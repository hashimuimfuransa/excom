import { Router } from 'express';
import Product from '../models/Product';
import Store from '../models/Store';
import Order from '../models/Order';
import BargainChat from '../models/BargainChat';
import AffiliateProgram from '../models/AffiliateProgram';
import User from '../models/User';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { analyzeVendorTrends } from '../services/aiService';

const router = Router();

// Vendor inventory
router.get('/inventory', requireAuth, async (req: AuthRequest, res) => {
  const sellerId = req.user!.sub;
  const items = await Product.find({ seller: sellerId });
  res.json(items);
});

router.post('/inventory', requireAuth, async (req: AuthRequest, res) => {
  const sellerId = req.user!.sub;
  // Optional: ensure store approved before allowing product creation
  const store = await Store.findOne({ owner: sellerId });
  if (!store || !store.approved) return res.status(403).json({ message: 'Store not approved' });
  const doc = await Product.create({ ...req.body, seller: sellerId, source: 'local' });
  res.status(201).json(doc);
});

// Vendor store: get my store (backwards compatibility)
router.get('/my-store', requireAuth, async (req: AuthRequest, res) => {
  const sellerId = req.user!.sub;
  const store = await Store.findOne({ owner: sellerId });
  res.json(store);
});

// Vendor stores: get all my stores
router.get('/my-stores', requireAuth, async (req: AuthRequest, res) => {
  const sellerId = req.user!.sub;
  const stores = await Store.find({ owner: sellerId }).sort({ createdAt: -1 });
  res.json(stores);
});

// Vendor store: create (pending approval)
router.post('/stores', requireAuth, async (req: AuthRequest, res) => {
  const sellerId = req.user!.sub;
  const { 
    name, 
    description, 
    category, 
    logo, 
    banner,
    contactInfo,
    location,
    businessHours
  } = req.body;
  
  // Check if store name already exists for this user
  const exists = await Store.findOne({ owner: sellerId, name });
  if (exists) return res.status(400).json({ message: 'Store with this name already exists' });
  
  // Validate required location fields
  if (!location || !location.address || !location.city || !location.country || !location.coordinates) {
    return res.status(400).json({ message: 'Location information is required' });
  }
  
  const doc = await Store.create({ 
    owner: sellerId, 
    name, 
    description, 
    category,
    logo,
    banner,
    contactInfo: contactInfo || {},
    location,
    businessHours: businessHours || {},
    approved: false,
    isActive: true
  });

  // Automatically create an affiliate program for the store
  try {
    await AffiliateProgram.create({
      vendor: sellerId,
      store: doc._id,
      isActive: true,
      globalSettings: {
        enabled: true,
        defaultCommissionRate: 8, // Default 8% commission
        defaultCommissionType: 'percentage',
        minPayoutAmount: 50,
        payoutFrequency: 'monthly',
        autoApproveAffiliates: true, // Auto-approve affiliates by default
        requireSocialMediaVerification: false
      },
      commissionRules: {
        productCategories: [{
          category: category || 'General',
          commissionRate: 8,
          commissionType: 'percentage'
        }]
      },
      requirements: {
        minFollowers: 100,
        minEngagementRate: 2.0,
        requiredPlatforms: ['instagram'],
        contentGuidelines: 'Promote products authentically and follow FTC guidelines'
      },
      terms: {
        commissionStructure: 'Percentage-based commission on all sales',
        paymentTerms: 'Monthly payouts via bank transfer or PayPal',
        contentRequirements: 'Must disclose affiliate relationship in all promotional content',
        prohibitedPractices: 'No spam, misleading claims, or unauthorized use of brand assets'
      }
    });
  } catch (error) {
    console.error('Error creating affiliate program:', error);
    // Don't fail store creation if affiliate program creation fails
  }

  const withOwner = await Store.findById(doc._id).populate('owner', 'name email role');
  res.status(201).json(withOwner);
});

// Vendor store: update own store
router.put('/stores/:id', requireAuth, async (req: AuthRequest, res) => {
  const sellerId = req.user!.sub;
  const { id } = req.params;
  const { 
    name, 
    description, 
    category, 
    logo, 
    banner, 
    isActive,
    contactInfo,
    location,
    businessHours
  } = req.body;

  console.log('Store update request:', { id, sellerId, body: req.body });
  
  // Check if store belongs to the user
  const store = await Store.findOne({ _id: id, owner: sellerId });
  if (!store) {
    console.log('Store not found or not owned by user:', { id, sellerId });
    return res.status(404).json({ message: 'Store not found or not owned by user' });
  }
  
  // Check if name already exists for this user (if name is being changed)
  console.log('Checking name uniqueness:', { 
    providedName: name, 
    currentStoreName: store.name, 
    nameChanged: name !== store.name 
  });
  
  if (name && name !== store.name) {
    const exists = await Store.findOne({ owner: sellerId, name, _id: { $ne: id } });
    console.log('Name uniqueness check result:', { exists: !!exists, existingStoreId: exists?._id });
    if (exists) {
      console.log('Store name already exists for this user');
      return res.status(400).json({ message: 'Store with this name already exists' });
    }
  }
  
  // Validate location if provided
  console.log('Location validation:', { 
    hasLocation: !!location,
    address: location?.address,
    city: location?.city,
    country: location?.country,
    coordinates: location?.coordinates
  });
  
  if (location && (!location.address || !location.city || !location.country || !location.coordinates)) {
    console.log('Location validation failed - missing required fields:', location);
    return res.status(400).json({ message: 'Complete location information is required' });
  }
  
  // If location is being updated, ensure coordinates are provided
  if (location && (!location.coordinates || typeof location.coordinates.lat !== 'number' || typeof location.coordinates.lng !== 'number')) {
    console.log('Location validation failed - invalid coordinates:', location.coordinates);
    return res.status(400).json({ message: 'Valid coordinates (lat, lng) are required for location' });
  }
  
  const updateData: any = {};
  if (name) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (category !== undefined) updateData.category = category;
  if (logo !== undefined) updateData.logo = logo;
  if (banner !== undefined) updateData.banner = banner;
  if (isActive !== undefined) updateData.isActive = isActive;
  if (contactInfo !== undefined) updateData.contactInfo = contactInfo;
  if (location !== undefined) updateData.location = location;
  if (businessHours !== undefined) updateData.businessHours = businessHours;
  
  console.log('Update data:', updateData);
  
  try {
    const updatedStore = await Store.findByIdAndUpdate(id, updateData, { new: true });
    console.log('Store updated successfully:', updatedStore);
    res.json(updatedStore);
  } catch (error) {
    console.error('Error updating store:', error);
    res.status(500).json({ message: 'Internal server error while updating store' });
  }
});

// Admin: list pending stores (with owner info)
router.get('/stores', requireAuth, async (req: AuthRequest, res) => {
  // simple role check
  if (req.user!.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  const pending = req.query.pending ? { approved: false } : {};
  const stores = await Store.find(pending).populate('owner', 'name email role');
  res.json(stores);
});

// Admin: approve/reject store
router.patch('/stores/:id', requireAuth, async (req: AuthRequest, res) => {
  if (req.user!.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  const { id } = req.params;
  const { approved } = req.body as { approved: boolean };
  const store = await Store.findByIdAndUpdate(id, { approved }, { new: true });
  if (!store) return res.status(404).json({ message: 'Not found' });
  res.json(store);
});

// Vendor dashboard stats
router.get('/dashboard-stats', requireAuth, async (req: AuthRequest, res) => {
  const sellerId = req.user!.sub;
  
  try {
    // Get vendor's products
    const totalProducts = await Product.countDocuments({ seller: sellerId });
    
    // Get vendor's orders (orders that contain items from this seller)
    const vendorOrders = await Order.find({
      'items.sellerId': sellerId
    }).populate('buyer', 'name email');
    
    const totalOrders = vendorOrders.length;
    const pendingOrders = vendorOrders.filter(order => order.status === 'pending').length;
    
    // Calculate total revenue from vendor's items
    let totalRevenue = 0;
    vendorOrders.forEach(order => {
      order.items.forEach(item => {
        if (item.sellerId && item.sellerId.toString() === sellerId) {
          totalRevenue += item.price * (item.quantity || 1);
        }
      });
    });
    
    // Get bargaining statistics
    const totalBargains = await BargainChat.countDocuments({ seller: sellerId });
    const activeBargains = await BargainChat.countDocuments({ 
      seller: sellerId, 
      status: 'active' 
    });
    const acceptedBargains = await BargainChat.countDocuments({ 
      seller: sellerId, 
      status: 'accepted' 
    });
    
    // Get recent orders (last 5)
    const recentOrders = vendorOrders
      .slice(-5)
      .map(order => ({
        _id: order._id,
        total: order.items
          .filter(item => item.sellerId && item.sellerId.toString() === sellerId)
          .reduce((sum, item) => sum + item.price * (item.quantity || 1), 0),
        currency: order.currency || 'USD',
        createdAt: order.createdAt,
        status: order.status || 'pending'
      }))
      .reverse();
    
    res.json({
      totalProducts,
      totalOrders,
      totalRevenue,
      pendingOrders,
      totalBargains,
      activeBargains,
      acceptedBargains,
      recentOrders
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard stats' });
  }
});

// Vendor orders - get orders containing vendor's products
router.get('/orders', requireAuth, async (req: AuthRequest, res) => {
  const sellerId = req.user!.sub;
  
  try {
    const orders = await Order.find({
      'items.sellerId': sellerId
    }).populate('buyer', 'name email').sort({ createdAt: -1 });
    
    // Filter out items that don't belong to this seller and calculate vendor-specific totals
    const vendorOrders = orders.map(order => ({
      _id: order._id,
      buyer: order.buyer,
      items: order.items.filter(item => item.sellerId && item.sellerId.toString() === sellerId),
      total: order.items
        .filter(item => item.sellerId && item.sellerId.toString() === sellerId)
        .reduce((sum, item) => sum + item.price * (item.quantity || 1), 0),
      currency: order.currency,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }));
    
    res.json(vendorOrders);
  } catch (error) {
    console.error('Error fetching vendor orders:', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// Public: get approved stores with basic info
router.get('/public/stores', async (req: AuthRequest, res) => {
  const { search, category, page = 1, limit = 12 } = req.query;
  
  const query: any = { approved: true, isActive: true };
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }
  
  if (category) {
    query.category = category;
  }
  
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  
  const stores = await Store.find(query)
    .populate('owner', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit as string));
    
  const total = await Store.countDocuments(query);
  
  res.json({
    stores,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total,
      pages: Math.ceil(total / parseInt(limit as string))
    }
  });
});

// Public: get store details by ID
router.get('/public/stores/:id', async (req: AuthRequest, res) => {
  try {
    const store = await Store.findOne({ 
      _id: req.params.id, 
      approved: true, 
      isActive: true 
    }).populate('owner', 'name email');
    
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }
    
    res.json(store);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch store' });
  }
});

// Public endpoint to create affiliate programs for existing stores (for setup)
router.post('/create-affiliate-programs', async (req, res) => {
  try {

    // Find all stores without affiliate programs
    const stores = await Store.find({ approved: true, isActive: true });
    const createdPrograms = [];

    for (const store of stores) {
      // Check if affiliate program already exists
      const existingProgram = await AffiliateProgram.findOne({ store: store._id });
      if (existingProgram) continue;

      // Create affiliate program for this store
      const program = await AffiliateProgram.create({
        vendor: store.owner,
        store: store._id,
        isActive: true,
        globalSettings: {
          enabled: true,
          defaultCommissionRate: 8,
          defaultCommissionType: 'percentage',
          minPayoutAmount: 50,
          payoutFrequency: 'monthly',
          autoApproveAffiliates: true,
          requireSocialMediaVerification: false
        },
        commissionRules: {
          productCategories: [{
            category: store.category || 'General',
            commissionRate: 8,
            commissionType: 'percentage'
          }]
        },
        requirements: {
          minFollowers: 100,
          minEngagementRate: 2.0,
          requiredPlatforms: ['instagram'],
          contentGuidelines: 'Promote products authentically and follow FTC guidelines'
        },
        terms: {
          commissionStructure: 'Percentage-based commission on all sales',
          paymentTerms: 'Monthly payouts via bank transfer or PayPal',
          contentRequirements: 'Must disclose affiliate relationship in all promotional content',
          prohibitedPractices: 'No spam, misleading claims, or unauthorized use of brand assets'
        }
      });

      createdPrograms.push({
        storeId: store._id,
        storeName: store.name,
        programId: program._id
      });
    }

    res.json({
      message: `Created ${createdPrograms.length} affiliate programs`,
      createdPrograms
    });
  } catch (error) {
    console.error('Error creating affiliate programs:', error);
    res.status(500).json({ message: 'Failed to create affiliate programs' });
  }
});

// Get vendor settings
router.get('/settings', requireAuth, async (req: AuthRequest, res) => {
  try {
    const sellerId = req.user!.sub;
    const user = await User.findById(sellerId).select('-passwordHash -oauthId');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get vendor's stores
    const stores = await Store.find({ owner: sellerId });

    // Return vendor settings with default values if not set
    const settings = {
      profile: {
        businessName: user.businessName || '',
        businessType: user.businessType || 'retail',
        description: user.bio || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        zipCode: user.zipCode || '',
        country: user.country || 'US',
        website: user.website || '',
        taxId: user.taxId || ''
      },
      store: {
        storeName: stores[0]?.name || '',
        storeDescription: stores[0]?.description || '',
        storeLogo: stores[0]?.logo || '',
        bannerImage: stores[0]?.banner || '',
        autoApproveProducts: user.vendorSettings?.autoApproveProducts || false,
        allowBargaining: user.vendorSettings?.allowBargaining || true,
        minimumBargainDiscount: user.vendorSettings?.minimumBargainDiscount || 5,
        maximumBargainDiscount: user.vendorSettings?.maximumBargainDiscount || 30
      },
      payments: {
        payoutMethod: user.vendorSettings?.payoutMethod || 'bank',
        bankAccount: user.vendorSettings?.bankAccount || '',
        paypalEmail: user.vendorSettings?.paypalEmail || '',
        stripeAccount: user.vendorSettings?.stripeAccount || '',
        taxRate: user.vendorSettings?.taxRate || 0,
        currency: user.vendorSettings?.currency || 'USD'
      },
      notifications: {
        emailNotifications: user.notifications?.emailNotifications || true,
        orderNotifications: user.notifications?.orderNotifications || true,
        lowStockAlerts: user.notifications?.lowStockAlerts || true,
        newReviewNotifications: user.notifications?.newReviewNotifications || true,
        bargainNotifications: user.notifications?.bargainNotifications || true,
        payoutNotifications: user.notifications?.payoutNotifications || true
      },
      shipping: {
        freeShippingThreshold: user.vendorSettings?.freeShippingThreshold || 50,
        shippingCost: user.vendorSettings?.shippingCost || 5.99,
        processingTime: user.vendorSettings?.processingTime || 2,
        returnPolicy: user.vendorSettings?.returnPolicy || '',
        shippingRegions: user.vendorSettings?.shippingRegions || ['US']
      },
      analytics: {
        trackSales: user.vendorSettings?.trackSales || true,
        trackInventory: user.vendorSettings?.trackInventory || true,
        trackCustomerBehavior: user.vendorSettings?.trackCustomerBehavior || false,
        shareDataWithPlatform: user.vendorSettings?.shareDataWithPlatform || true
      }
    };

    res.json({ settings });
  } catch (error) {
    console.error('Error fetching vendor settings:', error);
    res.status(500).json({ message: 'Failed to fetch settings' });
  }
});

// Update vendor settings
router.put('/settings', requireAuth, async (req: AuthRequest, res) => {
  try {
    const sellerId = req.user!.sub;
    const { settings } = req.body;

    if (!settings) {
      return res.status(400).json({ message: 'Settings data is required' });
    }

    // Prepare update data
    const updateData: any = {};

    // Update profile information
    if (settings.profile) {
      if (settings.profile.businessName) updateData.businessName = settings.profile.businessName;
      if (settings.profile.businessType) updateData.businessType = settings.profile.businessType;
      if (settings.profile.description) updateData.bio = settings.profile.description;
      if (settings.profile.phone) updateData.phone = settings.profile.phone;
      if (settings.profile.address) updateData.address = settings.profile.address;
      if (settings.profile.city) updateData.city = settings.profile.city;
      if (settings.profile.state) updateData.state = settings.profile.state;
      if (settings.profile.zipCode) updateData.zipCode = settings.profile.zipCode;
      if (settings.profile.country) updateData.country = settings.profile.country;
      if (settings.profile.website) updateData.website = settings.profile.website;
      if (settings.profile.taxId) updateData.taxId = settings.profile.taxId;
    }

    // Update vendor-specific settings
    if (settings.store || settings.payments || settings.shipping || settings.analytics) {
      updateData.vendorSettings = {
        ...updateData.vendorSettings,
        ...(settings.store && {
          autoApproveProducts: settings.store.autoApproveProducts,
          allowBargaining: settings.store.allowBargaining,
          minimumBargainDiscount: settings.store.minimumBargainDiscount,
          maximumBargainDiscount: settings.store.maximumBargainDiscount
        }),
        ...(settings.payments && {
          payoutMethod: settings.payments.payoutMethod,
          bankAccount: settings.payments.bankAccount,
          paypalEmail: settings.payments.paypalEmail,
          stripeAccount: settings.payments.stripeAccount,
          taxRate: settings.payments.taxRate,
          currency: settings.payments.currency
        }),
        ...(settings.shipping && {
          freeShippingThreshold: settings.shipping.freeShippingThreshold,
          shippingCost: settings.shipping.shippingCost,
          processingTime: settings.shipping.processingTime,
          returnPolicy: settings.shipping.returnPolicy,
          shippingRegions: settings.shipping.shippingRegions
        }),
        ...(settings.analytics && {
          trackSales: settings.analytics.trackSales,
          trackInventory: settings.analytics.trackInventory,
          trackCustomerBehavior: settings.analytics.trackCustomerBehavior,
          shareDataWithPlatform: settings.analytics.shareDataWithPlatform
        })
      };
    }

    // Update notification settings
    if (settings.notifications) {
      updateData.notifications = {
        ...updateData.notifications,
        emailNotifications: settings.notifications.emailNotifications,
        orderNotifications: settings.notifications.orderNotifications,
        lowStockAlerts: settings.notifications.lowStockAlerts,
        newReviewNotifications: settings.notifications.newReviewNotifications,
        bargainNotifications: settings.notifications.bargainNotifications,
        payoutNotifications: settings.notifications.payoutNotifications
      };
    }

    // Update store information if provided
    if (settings.store && (settings.store.storeName || settings.store.storeDescription)) {
      const stores = await Store.find({ owner: sellerId });
      if (stores.length > 0) {
        const storeUpdateData: any = {};
        if (settings.store.storeName) storeUpdateData.name = settings.store.storeName;
        if (settings.store.storeDescription) storeUpdateData.description = settings.store.storeDescription;
        if (settings.store.storeLogo) storeUpdateData.logo = settings.store.storeLogo;
        if (settings.store.bannerImage) storeUpdateData.banner = settings.store.bannerImage;

        await Store.findByIdAndUpdate(stores[0]._id, storeUpdateData);
      }
    }

    const user = await User.findByIdAndUpdate(
      sellerId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-passwordHash -oauthId');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      message: 'Settings updated successfully',
      settings: {
        profile: {
          businessName: user.businessName || '',
          businessType: user.businessType || 'retail',
          description: user.bio || '',
          phone: user.phone || '',
          address: user.address || '',
          city: user.city || '',
          state: user.state || '',
          zipCode: user.zipCode || '',
          country: user.country || 'US',
          website: user.website || '',
          taxId: user.taxId || ''
        },
        store: user.vendorSettings?.store || {},
        payments: user.vendorSettings?.payments || {},
        notifications: user.notifications || {},
        shipping: user.vendorSettings?.shipping || {},
        analytics: user.vendorSettings?.analytics || {}
      }
    });
  } catch (error) {
    console.error('Error updating vendor settings:', error);
    res.status(500).json({ message: 'Failed to update settings' });
  }
});

// AI-powered trend analysis endpoint
router.get('/trend-analysis', requireAuth, async (req: AuthRequest, res) => {
  try {
    const sellerId = req.user!.sub;
    const { timeRange = 'month' } = req.query;
    
    // Validate timeRange parameter
    const validTimeRanges = ['week', 'month', 'quarter', 'year'];
    if (!validTimeRanges.includes(timeRange as string)) {
      return res.status(400).json({ 
        message: 'Invalid time range. Must be one of: week, month, quarter, year' 
      });
    }

    console.log(`Generating trend analysis for vendor ${sellerId} over ${timeRange}`);
    
    // Generate AI-powered trend analysis
    const trendAnalysis = await analyzeVendorTrends(
      sellerId, 
      timeRange as 'week' | 'month' | 'quarter' | 'year'
    );
    
    res.json({
      success: true,
      data: trendAnalysis,
      message: 'Trend analysis generated successfully'
    });
    
  } catch (error) {
    console.error('Error generating trend analysis:', error);
    res.status(500).json({ 
      message: 'Failed to generate trend analysis',
      error: error.message 
    });
  }
});

// Get vendor performance insights (simplified version without AI)
router.get('/performance-insights', requireAuth, async (req: AuthRequest, res) => {
  try {
    const sellerId = req.user!.sub;
    const { timeRange = 'month' } = req.query;
    
    // Get vendor's products
    const products = await Product.find({ seller: sellerId });
    
    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (timeRange) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    // Get orders for the time period
    const orders = await Order.find({
      'items.vendor': sellerId,
      createdAt: { $gte: startDate, $lte: now }
    }).populate('items.product', 'title category price');
    
    // Calculate basic metrics
    let totalRevenue = 0;
    let totalOrders = orders.length;
    const salesByProduct: { [key: string]: any } = {};
    const salesByCategory: { [key: string]: any } = {};
    
    orders.forEach(order => {
      order.items.forEach((item: any) => {
        if (item.vendor === sellerId) {
          const product = item.product;
          if (!product) return;
          
          const productId = product._id.toString();
          const category = product.category;
          
          // Product sales
          if (!salesByProduct[productId]) {
            salesByProduct[productId] = {
              productId,
              productName: product.title,
              category: product.category,
              sales: 0,
              revenue: 0
            };
          }
          
          salesByProduct[productId].sales += 1;
          salesByProduct[productId].revenue += item.price * item.quantity;
          
          // Category sales
          if (!salesByCategory[category]) {
            salesByCategory[category] = {
              category,
              sales: 0,
              revenue: 0
            };
          }
          
          salesByCategory[category].sales += 1;
          salesByCategory[category].revenue += item.price * item.quantity;
          
          totalRevenue += item.price * item.quantity;
        }
      });
    });
    
    // Get top products and categories
    const topProducts = Object.values(salesByProduct)
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 5);
    
    const topCategories = Object.values(salesByCategory)
      .sort((a: any, b: any) => b.revenue - a.revenue);
    
    res.json({
      success: true,
      data: {
        timeRange,
        summary: {
          totalRevenue,
          totalOrders,
          averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
          totalProducts: products.length
        },
        topProducts,
        topCategories,
        salesByProduct: Object.values(salesByProduct),
        salesByCategory: Object.values(salesByCategory)
      }
    });
    
  } catch (error) {
    console.error('Error fetching performance insights:', error);
    res.status(500).json({ 
      message: 'Failed to fetch performance insights',
      error: error.message 
    });
  }
});

export default router;