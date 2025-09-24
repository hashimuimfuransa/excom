import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import Affiliate from '../models/Affiliate';
import AffiliateProgram from '../models/AffiliateProgram';
import AffiliateLink from '../models/AffiliateLink';
import AffiliateClick from '../models/AffiliateClick';
import AffiliateCommission from '../models/AffiliateCommission';
import AffiliatePayout from '../models/AffiliatePayout';
import User from '../models/User';
import Store from '../models/Store';
import Product from '../models/Product';

const router = Router();

// Get available vendors for affiliate selection
router.get('/vendors', async (req, res) => {
  try {
    const { search, category, page = 1, limit = 20 } = req.query;
    
    // Build query for approved stores
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
    
    // Get stores with owner info
    const stores = await Store.find(query)
      .populate('owner', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit as string));
    
    // Get affiliate programs for these stores
    const storeIds = stores.map(store => store._id);
    const affiliatePrograms = await AffiliateProgram.find({ 
      store: { $in: storeIds },
      isActive: true 
    });
    
    // Create a map of storeId to affiliate program
    const programMap = new Map();
    affiliatePrograms.forEach(program => {
      if (program.store) {
        programMap.set(program.store.toString(), program);
      }
    });
    
    // Get product counts for each store owner
    const storeOwners = stores.map(store => store.owner._id);
    const productCounts = await Product.aggregate([
      { $match: { seller: { $in: storeOwners } } },
      { $group: { _id: '$seller', count: { $sum: 1 } } }
    ]);
    
    const productCountMap = new Map();
    productCounts.forEach(item => {
      productCountMap.set(item._id.toString(), item.count);
    });
    
    // Combine store data with affiliate program info
    const vendorsWithPrograms = stores.map(store => {
      const program = programMap.get((store._id as any).toString());
      const productCount = productCountMap.get((store.owner._id as any).toString()) || 0;
      
      return {
        id: store._id,
        name: (store.owner as any).name,
        storeName: store.name,
        description: store.description,
        logo: store.logo,
        banner: store.banner,
        category: store.category,
        rating: 4.5, // Default rating - can be calculated from reviews
        productCount,
        categoryCount: 1, // Can be enhanced to count actual categories
        commissionRate: program?.globalSettings?.defaultCommissionRate || 5,
        commissionType: program?.globalSettings?.defaultCommissionType || 'percentage',
        minCommission: program?.globalSettings?.defaultCommissionRate || 3,
        maxCommission: program?.globalSettings?.defaultCommissionRate || 15,
        autoApproval: program?.globalSettings?.autoApproveAffiliates || false,
        categories: [store.category],
        affiliateProgram: program ? {
          id: program._id,
          isActive: program.isActive,
          requirements: program.requirements,
          terms: program.terms
        } : null
      };
    });
    
    const total = await Store.countDocuments(query);
    
    res.json({
      vendors: vendorsWithPrograms,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ message: 'Failed to fetch vendors' });
  }
});

// Generate unique referral code
function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generate short code for affiliate links
function generateShortCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Affiliate registration - apply to join a vendor's program
router.post('/register', requireAuth, async (req: AuthRequest, res) => {
  try {
    console.log('Affiliate registration request:', req.body);
    const userId = req.user!.sub;
    const { 
      vendorId, 
      socialMediaHandles, 
      phone, 
      country, 
      city, 
      address, 
      zipCode,
      commissionPreference,
      expectedMonthlySales,
      marketingExperience,
      preferredCategories
    } = req.body;

    console.log('Processing affiliate registration for user:', userId, 'vendor:', vendorId);

    // Check if user is already an affiliate for this vendor (using store ID)
    const existingAffiliate = await Affiliate.findOne({ user: userId, store: vendorId });
    if (existingAffiliate) {
      return res.status(400).json({ message: 'You are already registered as an affiliate for this vendor' });
    }

    // Get the store information first
    const store = await Store.findById(vendorId).populate('owner');
    if (!store) {
      console.log('Store not found:', vendorId);
      return res.status(400).json({ message: 'Store not found' });
    }
    console.log('Store found:', store.name, 'Owner:', store.owner);

    // Check if vendor has an active affiliate program (check by both store and vendor)
    let program = await AffiliateProgram.findOne({ 
      $or: [
        { store: vendorId, isActive: true },
        { vendor: store.owner._id, isActive: true }
      ]
    });
    console.log('Found existing program:', program ? 'Yes' : 'No');
    
    // If no program exists, create one automatically
    if (!program || !program.globalSettings.enabled) {
      console.log('Creating new affiliate program for store:', vendorId, 'vendor:', store.owner._id);
      
      // Check if there's already a program for this vendor (to avoid duplicate key error)
      const existingProgram = await AffiliateProgram.findOne({ vendor: store.owner._id });
      if (existingProgram) {
        console.log('Found existing program for vendor, updating store reference');
        // Update the existing program to include the store reference
        program = await AffiliateProgram.findByIdAndUpdate(
          existingProgram._id,
          { store: vendorId, isActive: true, 'globalSettings.enabled': true },
          { new: true }
        );
      } else {
        // Create affiliate program automatically
        try {
          program = await AffiliateProgram.create({
        vendor: store.owner._id,
        store: vendorId,
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
        console.log('Affiliate program created successfully:', program._id);
        } catch (error) {
          console.error('Error creating affiliate program:', error);
          return res.status(500).json({ message: 'Failed to create affiliate program', error: error.message });
        }
      }
    }

    // Get the store owner (vendor) ID from the program
    const vendorUserId = program.vendor;

    // Generate unique referral code
    let referralCode = generateReferralCode();
    while (await Affiliate.findOne({ referralCode })) {
      referralCode = generateReferralCode();
    }

    // Update user profile with additional information and mark onboarding as completed
    await User.findByIdAndUpdate(userId, {
      phone,
      country,
      city,
      address,
      zipCode,
      affiliateOnboardingCompleted: true
    });

    // Create affiliate application
    console.log('Creating affiliate record with:', {
      user: userId,
      vendor: vendorUserId,
      store: vendorId,
      program: program._id,
      referralCode
    });
    
    let affiliate;
    try {
      affiliate = await Affiliate.create({
        user: userId,
        vendor: vendorUserId,
        store: vendorId,
        program: program._id,
        status: program.globalSettings.autoApproveAffiliates ? 'approved' : 'pending',
        commissionRate: program.globalSettings.defaultCommissionRate,
        commissionType: program.globalSettings.defaultCommissionType,
        fixedCommissionAmount: program.globalSettings.defaultFixedAmount,
        referralCode,
        socialMediaHandles,
        approvalDate: program.globalSettings.autoApproveAffiliates ? new Date() : undefined,
        notes: `Marketing Experience: ${marketingExperience}\nExpected Monthly Sales: ${expectedMonthlySales}\nPreferred Categories: ${preferredCategories?.join(', ') || 'Not specified'}`
      });
      console.log('Affiliate created successfully:', affiliate._id);
    } catch (error) {
      console.error('Error creating affiliate:', error);
      return res.status(500).json({ message: 'Failed to create affiliate', error: error.message });
    }

    const populatedAffiliate = await Affiliate.findById(affiliate._id)
      .populate('user', 'name email phone country city')
      .populate('vendor', 'name email');

    res.status(201).json(populatedAffiliate);
  } catch (error) {
    console.error('Error registering affiliate:', error);
    res.status(500).json({ message: 'Failed to register as affiliate', error: error.message });
  }
});

// Get affiliate dashboard data
router.get('/dashboard', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.sub;

    // Get all affiliate relationships for this user
    const affiliates = await Affiliate.find({ user: userId })
      .populate('vendor', 'name email')
      .populate('user', 'name email')
      .populate('store', 'name description logo');

    // Get affiliate links
    const affiliateLinks = await AffiliateLink.find({ affiliate: { $in: affiliates.map(a => a._id) } })
      .populate('affiliate', 'referralCode')
      .populate('vendor', 'name')
      .populate('targetId', 'title name');

    // Get recent commissions
    const commissions = await AffiliateCommission.find({ affiliate: { $in: affiliates.map(a => a._id) } })
      .populate('order', 'total status')
      .populate('product', 'title images price')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get recent clicks with detailed analytics
    const clicks = await AffiliateClick.find({ affiliate: { $in: affiliates.map(a => a._id) } })
      .populate('affiliate', 'referralCode')
      .populate('targetId', 'title')
      .sort({ createdAt: -1 })
      .limit(20);

    // Get products from all vendors the affiliate works with
    const vendorIds = affiliates.map(a => a.vendor._id);
    const products = await Product.find({ seller: { $in: vendorIds } })
      .populate('seller', 'name')
      .populate('store', 'name')
      .sort({ createdAt: -1 })
      .limit(50);

    // Get engagement analytics for each affiliate
    const engagementData = await Promise.all(affiliates.map(async (affiliate) => {
      // Get clicks for this affiliate in the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentClicks = await AffiliateClick.find({
        affiliate: affiliate._id,
        createdAt: { $gte: thirtyDaysAgo }
      }).sort({ createdAt: -1 });

      // Get conversion rate
      const conversions = recentClicks.filter(click => click.converted).length;
      const conversionRate = recentClicks.length > 0 ? (conversions / recentClicks.length) * 100 : 0;

      // Get top performing products
      const productClicks = await AffiliateClick.aggregate([
        { $match: { affiliate: affiliate._id, linkType: 'product' } },
        { $group: { _id: '$targetId', clicks: { $sum: 1 }, conversions: { $sum: { $cond: ['$converted', 1, 0] } } } },
        { $sort: { clicks: -1 } },
        { $limit: 5 }
      ]);

      // Get top performing products with product details
      const topProducts = await Promise.all(productClicks.map(async (item) => {
        const product = await Product.findById(item._id).populate('seller', 'name');
        return {
          product,
          clicks: item.clicks,
          conversions: item.conversions,
          conversionRate: item.clicks > 0 ? (item.conversions / item.clicks) * 100 : 0
        };
      }));

      return {
        affiliateId: affiliate._id,
        referralCode: affiliate.referralCode,
        recentClicks: recentClicks.length,
        conversions,
        conversionRate,
        topProducts: topProducts.filter(p => p.product)
      };
    }));

    // Calculate total stats
    const totalStats = affiliates.reduce((acc, affiliate) => ({
      totalClicks: acc.totalClicks + affiliate.totalClicks,
      totalConversions: acc.totalConversions + affiliate.totalConversions,
      totalEarnings: acc.totalEarnings + affiliate.totalEarnings,
      pendingEarnings: acc.pendingEarnings + affiliate.pendingEarnings,
      paidEarnings: acc.paidEarnings + affiliate.paidEarnings
    }), { totalClicks: 0, totalConversions: 0, totalEarnings: 0, pendingEarnings: 0, paidEarnings: 0 });

    // Calculate overall conversion rate
    const overallConversionRate = totalStats.totalClicks > 0 
      ? (totalStats.totalConversions / totalStats.totalClicks) * 100 
      : 0;

    res.json({
      affiliates,
      affiliateLinks,
      commissions,
      clicks,
      products,
      engagementData,
      totalStats: {
        ...totalStats,
        conversionRate: overallConversionRate
      }
    });
  } catch (error) {
    console.error('Error fetching affiliate dashboard:', error);
    res.status(500).json({ message: 'Failed to fetch affiliate dashboard' });
  }
});

// Generate affiliate link
router.post('/links', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.sub;
    const { vendorId, linkType, targetId, originalUrl } = req.body;

    // Find affiliate relationship
    const affiliate = await Affiliate.findOne({ user: userId, vendor: vendorId, status: 'approved' });
    if (!affiliate) {
      return res.status(400).json({ message: 'You are not an approved affiliate for this vendor' });
    }

    // Generate unique short code
    let shortCode = generateShortCode();
    while (await AffiliateLink.findOne({ shortCode })) {
      shortCode = generateShortCode();
    }

    // Create affiliate URL
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const affiliateUrl = `${baseUrl}${originalUrl}${originalUrl.includes('?') ? '&' : '?'}ref=${affiliate.referralCode}`;

    // Create affiliate link
    const affiliateLink = await AffiliateLink.create({
      affiliate: affiliate._id,
      vendor: vendorId,
      linkType,
      targetId,
      originalUrl,
      affiliateUrl,
      shortCode
    });

    res.status(201).json(affiliateLink);
  } catch (error) {
    console.error('Error creating affiliate link:', error);
    res.status(500).json({ message: 'Failed to create affiliate link' });
  }
});

// Generate affiliate link for specific product
router.post('/generate-product-link', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.sub;
    const { productId } = req.body;

    // Find the product and get vendor info
    const product = await Product.findById(productId).populate('seller', 'name');
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Find affiliate relationship with this vendor
    const affiliate = await Affiliate.findOne({ 
      user: userId, 
      vendor: product.seller._id, 
      status: 'approved' 
    });
    
    if (!affiliate) {
      return res.status(400).json({ 
        message: 'You are not an approved affiliate for this vendor',
        vendorName: product.seller.name
      });
    }

    // Check if link already exists
    let affiliateLink = await AffiliateLink.findOne({
      affiliate: affiliate._id,
      vendor: product.seller._id,
      linkType: 'product',
      targetId: productId
    });

    if (affiliateLink) {
      return res.json({
        ...affiliateLink.toObject(),
        product: product,
        vendor: product.seller
      });
    }

    // Generate unique short code
    let shortCode = generateShortCode();
    while (await AffiliateLink.findOne({ shortCode })) {
      shortCode = generateShortCode();
    }

    // Create affiliate URL
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const originalUrl = `/product/${productId}`;
    const affiliateUrl = `${baseUrl}${originalUrl}?ref=${affiliate.referralCode}`;

    // Create affiliate link
    affiliateLink = await AffiliateLink.create({
      affiliate: affiliate._id,
      vendor: product.seller._id,
      linkType: 'product',
      targetId: productId,
      originalUrl,
      affiliateUrl,
      shortCode
    });

    res.status(201).json({
      ...affiliateLink.toObject(),
      product: product,
      vendor: product.seller
    });
  } catch (error) {
    console.error('Error creating product affiliate link:', error);
    res.status(500).json({ message: 'Failed to create product affiliate link' });
  }
});

// Track affiliate click
router.post('/track-click', async (req, res) => {
  try {
    const { affiliateCode, targetUrl, visitorId, ipAddress, userAgent, referrer } = req.body;

    // Find affiliate by referral code
    const affiliate = await Affiliate.findOne({ referralCode: affiliateCode, status: 'approved' });
    if (!affiliate) {
      return res.status(400).json({ message: 'Invalid affiliate code' });
    }

    // Create click record
    const click = await AffiliateClick.create({
      affiliate: affiliate._id,
      vendor: affiliate.vendor,
      visitorId,
      ipAddress,
      userAgent,
      referrer,
      clickedUrl: req.get('Referer') || '',
      targetUrl,
      linkType: 'general' // This could be determined from the target URL
    });

    res.status(201).json({ clickId: click._id });
  } catch (error) {
    console.error('Error tracking click:', error);
    res.status(500).json({ message: 'Failed to track click' });
  }
});

// Request payout
router.post('/payout-request', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.sub;
    const { vendorId, amount, paymentMethod, paymentDetails } = req.body;

    // Find affiliate relationship
    const affiliate = await Affiliate.findOne({ user: userId, vendor: vendorId, status: 'approved' });
    if (!affiliate) {
      return res.status(400).json({ message: 'You are not an approved affiliate for this vendor' });
    }

    // Check if affiliate has enough pending earnings
    if (amount > affiliate.pendingEarnings) {
      return res.status(400).json({ message: 'Insufficient pending earnings' });
    }

    // Get affiliate program settings
    const program = await AffiliateProgram.findOne({ vendor: vendorId });
    if (!program) {
      return res.status(400).json({ message: 'Affiliate program not found' });
    }

    // Check minimum payout amount
    if (amount < program.globalSettings.minPayoutAmount) {
      return res.status(400).json({ 
        message: `Minimum payout amount is ${program.globalSettings.minPayoutAmount}` 
      });
    }

    // Calculate fees
    const platformFee = amount * (program.payoutSettings.processingFee / 100);
    const vendorFee = amount * (program.payoutSettings.vendorFee / 100);
    const netAmount = amount - platformFee - vendorFee;

    // Get pending commissions for this affiliate
    const pendingCommissions = await AffiliateCommission.find({
      affiliate: affiliate._id,
      status: 'pending'
    }).limit(amount / 10); // Rough estimate, adjust based on average commission

    // Create payout request
    const payout = await AffiliatePayout.create({
      affiliate: affiliate._id,
      vendor: vendorId,
      commissions: pendingCommissions.map(c => c._id),
      totalAmount: amount,
      platformFee,
      vendorFee,
      netAmount,
      paymentMethod,
      paymentDetails,
      requestedBy: userId
    });

    // Update affiliate pending earnings
    await Affiliate.findByIdAndUpdate(affiliate._id, {
      $inc: { pendingEarnings: -amount }
    });

    // Update commission status
    await AffiliateCommission.updateMany(
      { _id: { $in: pendingCommissions.map(c => c._id) } },
      { 
        status: 'approved',
        payoutRequest: payout._id,
        approvedDate: new Date()
      }
    );

    const populatedPayout = await AffiliatePayout.findById(payout._id)
      .populate('affiliate', 'referralCode')
      .populate('vendor', 'name');

    res.status(201).json(populatedPayout);
  } catch (error) {
    console.error('Error creating payout request:', error);
    res.status(500).json({ message: 'Failed to create payout request' });
  }
});

export default router;
