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

// Get affiliate settings
router.get('/settings', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.sub;
    const user = await User.findById(userId).select('-passwordHash -oauthId');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get affiliate record
    const affiliate = await Affiliate.findOne({ user: userId });

    // Return affiliate settings with default values if not set
    const settings = {
      profile: {
        displayName: user.affiliateSettings?.displayName || user.name || '',
        bio: user.affiliateSettings?.bio || user.bio || '',
        website: user.affiliateSettings?.website || user.website || '',
        socialMedia: user.affiliateSettings?.socialMedia || {
          facebook: '',
          instagram: '',
          twitter: '',
          youtube: '',
          tiktok: ''
        },
        niche: user.affiliateSettings?.niche || '',
        targetAudience: user.affiliateSettings?.targetAudience || ''
      },
      preferences: {
        commissionRate: user.affiliateSettings?.commissionRate || 5,
        preferredCategories: user.affiliateSettings?.preferredCategories || [],
        autoApproveProducts: user.affiliateSettings?.autoApproveProducts || false,
        showPersonalBranding: user.affiliateSettings?.showPersonalBranding || true,
        allowDirectMessages: user.affiliateSettings?.allowDirectMessages || true
      },
      payments: {
        payoutMethod: user.affiliateSettings?.payoutMethod || 'paypal',
        bankAccount: user.affiliateSettings?.bankAccount || '',
        paypalEmail: user.affiliateSettings?.paypalEmail || user.email || '',
        stripeAccount: user.affiliateSettings?.stripeAccount || '',
        taxId: user.affiliateSettings?.taxId || '',
        minimumPayout: user.affiliateSettings?.minimumPayout || 25
      },
      notifications: {
        emailNotifications: user.notifications?.emailNotifications || true,
        commissionNotifications: user.notifications?.commissionNotifications || true,
        newProductNotifications: user.notifications?.newProductNotifications || true,
        performanceNotifications: user.notifications?.performanceNotifications || true,
        marketingTips: user.notifications?.marketingTips || true,
        weeklyReports: user.notifications?.weeklyReports || true
      },
      marketing: {
        trackingEnabled: user.affiliateSettings?.trackingEnabled || true,
        customTrackingCode: user.affiliateSettings?.customTrackingCode || '',
        utmParameters: user.affiliateSettings?.utmParameters || {
          source: 'affiliate',
          medium: 'social',
          campaign: ''
        },
        socialSharing: user.affiliateSettings?.socialSharing || true,
        emailMarketing: user.affiliateSettings?.emailMarketing || false
      },
      analytics: {
        trackClicks: user.affiliateSettings?.trackClicks || true,
        trackConversions: user.affiliateSettings?.trackConversions || true,
        trackRevenue: user.affiliateSettings?.trackRevenue || true,
        shareDataWithVendors: user.affiliateSettings?.shareDataWithVendors || false,
        detailedReporting: user.affiliateSettings?.detailedReporting || true
      }
    };

    res.json({ settings });
  } catch (error) {
    console.error('Error fetching affiliate settings:', error);
    res.status(500).json({ message: 'Failed to fetch settings' });
  }
});

// Update affiliate settings
router.put('/settings', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.sub;
    const { settings } = req.body;

    if (!settings) {
      return res.status(400).json({ message: 'Settings data is required' });
    }

    // Prepare update data
    const updateData: any = {};

    // Update affiliate-specific settings
    if (settings.profile || settings.preferences || settings.payments || settings.marketing || settings.analytics) {
      updateData.affiliateSettings = {
        ...updateData.affiliateSettings,
        ...(settings.profile && {
          displayName: settings.profile.displayName,
          bio: settings.profile.bio,
          website: settings.profile.website,
          socialMedia: settings.profile.socialMedia,
          niche: settings.profile.niche,
          targetAudience: settings.profile.targetAudience
        }),
        ...(settings.preferences && {
          commissionRate: settings.preferences.commissionRate,
          preferredCategories: settings.preferences.preferredCategories,
          autoApproveProducts: settings.preferences.autoApproveProducts,
          showPersonalBranding: settings.preferences.showPersonalBranding,
          allowDirectMessages: settings.preferences.allowDirectMessages
        }),
        ...(settings.payments && {
          payoutMethod: settings.payments.payoutMethod,
          bankAccount: settings.payments.bankAccount,
          paypalEmail: settings.payments.paypalEmail,
          stripeAccount: settings.payments.stripeAccount,
          taxId: settings.payments.taxId,
          minimumPayout: settings.payments.minimumPayout
        }),
        ...(settings.marketing && {
          trackingEnabled: settings.marketing.trackingEnabled,
          customTrackingCode: settings.marketing.customTrackingCode,
          utmParameters: settings.marketing.utmParameters,
          socialSharing: settings.marketing.socialSharing,
          emailMarketing: settings.marketing.emailMarketing
        }),
        ...(settings.analytics && {
          trackClicks: settings.analytics.trackClicks,
          trackConversions: settings.analytics.trackConversions,
          trackRevenue: settings.analytics.trackRevenue,
          shareDataWithVendors: settings.analytics.shareDataWithVendors,
          detailedReporting: settings.analytics.detailedReporting
        })
      };
    }

    // Update notification settings
    if (settings.notifications) {
      updateData.notifications = {
        ...updateData.notifications,
        emailNotifications: settings.notifications.emailNotifications,
        commissionNotifications: settings.notifications.commissionNotifications,
        newProductNotifications: settings.notifications.newProductNotifications,
        performanceNotifications: settings.notifications.performanceNotifications,
        marketingTips: settings.notifications.marketingTips,
        weeklyReports: settings.notifications.weeklyReports
      };
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-passwordHash -oauthId');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      message: 'Settings updated successfully',
      settings: {
        profile: user.affiliateSettings?.profile || {},
        preferences: user.affiliateSettings?.preferences || {},
        payments: user.affiliateSettings?.payments || {},
        notifications: user.notifications || {},
        marketing: user.affiliateSettings?.marketing || {},
        analytics: user.affiliateSettings?.analytics || {}
      }
    });
  } catch (error) {
    console.error('Error updating affiliate settings:', error);
    res.status(500).json({ message: 'Failed to update settings' });
  }
});

// Get affiliate links
router.get('/links', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.sub;

    // Get all affiliate relationships for this user
    const affiliates = await Affiliate.find({ user: userId, status: 'approved' });
    const affiliateIds = affiliates.map(a => a._id);

    // Get affiliate links
    const affiliateLinks = await AffiliateLink.find({ affiliate: { $in: affiliateIds } })
      .populate('affiliate', 'referralCode')
      .populate('vendor', 'name')
      .populate('targetId', 'title name images')
      .sort({ createdAt: -1 });

    res.json({ data: affiliateLinks });
  } catch (error) {
    console.error('Error fetching affiliate links:', error);
    res.status(500).json({ message: 'Failed to fetch affiliate links' });
  }
});

// Get affiliate earnings
router.get('/earnings', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.sub;

    // Get all affiliate relationships for this user
    const affiliates = await Affiliate.find({ user: userId, status: 'approved' });
    const affiliateIds = affiliates.map(a => a._id);

    // Get commissions
    const commissions = await AffiliateCommission.find({ affiliate: { $in: affiliateIds } })
      .populate('order', 'total status orderNumber')
      .populate('product', 'title images price')
      .populate('affiliate', 'referralCode')
      .sort({ createdAt: -1 });

    res.json({ data: commissions });
  } catch (error) {
    console.error('Error fetching affiliate earnings:', error);
    res.status(500).json({ message: 'Failed to fetch affiliate earnings' });
  }
});

// Get affiliate earnings stats
router.get('/earnings/stats', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.sub;

    // Get all affiliate relationships for this user
    const affiliates = await Affiliate.find({ user: userId, status: 'approved' });

    // Calculate stats
    const totalEarnings = affiliates.reduce((sum, affiliate) => sum + affiliate.totalEarnings, 0);
    const pendingEarnings = affiliates.reduce((sum, affiliate) => sum + affiliate.pendingEarnings, 0);
    const paidEarnings = affiliates.reduce((sum, affiliate) => sum + affiliate.paidEarnings, 0);
    const totalOrders = affiliates.reduce((sum, affiliate) => sum + affiliate.totalConversions, 0);

    // Calculate this month earnings
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const thisMonthCommissions = await AffiliateCommission.find({
      affiliate: { $in: affiliates.map(a => a._id) },
      createdAt: { $gte: thisMonth },
      status: { $in: ['approved', 'paid'] }
    });

    const thisMonthEarnings = thisMonthCommissions.reduce((sum, commission) => sum + commission.amount, 0);

    // Calculate last month earnings
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    lastMonth.setDate(1);
    lastMonth.setHours(0, 0, 0, 0);

    const lastMonthEnd = new Date();
    lastMonthEnd.setDate(0);
    lastMonthEnd.setHours(23, 59, 59, 999);

    const lastMonthCommissions = await AffiliateCommission.find({
      affiliate: { $in: affiliates.map(a => a._id) },
      createdAt: { $gte: lastMonth, $lte: lastMonthEnd },
      status: { $in: ['approved', 'paid'] }
    });

    const lastMonthEarnings = lastMonthCommissions.reduce((sum, commission) => sum + commission.amount, 0);

    // Calculate average order value
    const averageOrderValue = totalOrders > 0 ? totalEarnings / totalOrders : 0;

    // Get top earning product and vendor
    const topProduct = await AffiliateCommission.aggregate([
      { $match: { affiliate: { $in: affiliates.map(a => a._id) } } },
      { $group: { _id: '$product', totalEarnings: { $sum: '$amount' } } },
      { $sort: { totalEarnings: -1 } },
      { $limit: 1 },
      { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } }
    ]);

    const topVendor = await AffiliateCommission.aggregate([
      { $match: { affiliate: { $in: affiliates.map(a => a._id) } } },
      { $group: { _id: '$vendor', totalEarnings: { $sum: '$amount' } } },
      { $sort: { totalEarnings: -1 } },
      { $limit: 1 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'vendor' } }
    ]);

    res.json({
      data: {
        totalEarnings,
        pendingEarnings,
        paidEarnings,
        cancelledEarnings: 0, // Can be calculated if needed
        thisMonthEarnings,
        lastMonthEarnings,
        totalOrders,
        averageOrderValue,
        topEarningProduct: topProduct[0]?.product[0]?.title || '',
        topEarningVendor: topVendor[0]?.vendor[0]?.name || ''
      }
    });
  } catch (error) {
    console.error('Error fetching affiliate earnings stats:', error);
    res.status(500).json({ message: 'Failed to fetch affiliate earnings stats' });
  }
});

// Get payout requests
router.get('/payout-requests', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.sub;

    // Get all affiliate relationships for this user
    const affiliates = await Affiliate.find({ user: userId, status: 'approved' });
    const affiliateIds = affiliates.map(a => a._id);

    // Get payout requests
    const payoutRequests = await AffiliatePayout.find({ affiliate: { $in: affiliateIds } })
      .populate('affiliate', 'referralCode')
      .populate('vendor', 'name')
      .sort({ createdAt: -1 });

    res.json({ data: payoutRequests });
  } catch (error) {
    console.error('Error fetching payout requests:', error);
    res.status(500).json({ message: 'Failed to fetch payout requests' });
  }
});

// Get affiliate analytics
router.get('/analytics', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.sub;
    const { period = '30' } = req.query;

    // Get all affiliate relationships for this user
    const affiliates = await Affiliate.find({ user: userId, status: 'approved' });
    const affiliateIds = affiliates.map(a => a._id);

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period as string));

    // Get clicks and conversions
    const clicks = await AffiliateClick.find({
      affiliate: { $in: affiliateIds },
      createdAt: { $gte: startDate, $lte: endDate }
    });

    const totalClicks = clicks.length;
    const totalConversions = clicks.filter(click => click.converted).length;
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

    // Get earnings
    const commissions = await AffiliateCommission.find({
      affiliate: { $in: affiliateIds },
      createdAt: { $gte: startDate, $lte: endDate }
    });

    const totalEarnings = commissions.reduce((sum, commission) => sum + commission.amount, 0);

    // Get top performing products
    const productStats = await AffiliateClick.aggregate([
      { $match: { affiliate: { $in: affiliateIds }, linkType: 'product', createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$targetId', clicks: { $sum: 1 }, conversions: { $sum: { $cond: ['$converted', 1, 0] } } } },
      { $sort: { clicks: -1 } },
      { $limit: 10 }
    ]);

    const topPerformingProducts = await Promise.all(productStats.map(async (stat) => {
      const product = await Product.findById(stat._id).populate('seller', 'name');
      if (!product) return null;
      
      return {
        _id: product._id,
        name: product.title,
        image: product.images?.[0],
        clicks: stat.clicks,
        conversions: stat.conversions,
        earnings: stat.conversions * (product.price * 0.1), // Assuming 10% commission
        conversionRate: stat.clicks > 0 ? (stat.conversions / stat.clicks) * 100 : 0
      };
    }));

    // Get top performing links
    const linkStats = await AffiliateClick.aggregate([
      { $match: { affiliate: { $in: affiliateIds }, createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$affiliate', clicks: { $sum: 1 }, conversions: { $sum: { $cond: ['$converted', 1, 0] } } } },
      { $sort: { clicks: -1 } },
      { $limit: 10 }
    ]);

    const topPerformingLinks = await Promise.all(linkStats.map(async (stat) => {
      const affiliate = await Affiliate.findById(stat._id);
      if (!affiliate) return null;

      return {
        _id: affiliate._id,
        productName: 'General Link',
        productImage: null,
        clicks: stat.clicks,
        conversions: stat.conversions,
        earnings: stat.conversions * 10, // Assuming $10 average commission
        conversionRate: stat.clicks > 0 ? (stat.conversions / stat.clicks) * 100 : 0,
        url: `${process.env.FRONTEND_URL}?ref=${affiliate.referralCode}`
      };
    }));

    // Get daily stats
    const dailyStats = await AffiliateClick.aggregate([
      { $match: { affiliate: { $in: affiliateIds }, createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, clicks: { $sum: 1 }, conversions: { $sum: { $cond: ['$converted', 1, 0] } } } },
      { $sort: { _id: 1 } }
    ]);

    // Get traffic sources (simplified)
    const trafficSources = [
      { source: 'Direct', clicks: Math.floor(totalClicks * 0.3), conversions: Math.floor(totalConversions * 0.3), percentage: 30 },
      { source: 'Social Media', clicks: Math.floor(totalClicks * 0.4), conversions: Math.floor(totalConversions * 0.4), percentage: 40 },
      { source: 'Search', clicks: Math.floor(totalClicks * 0.2), conversions: Math.floor(totalConversions * 0.2), percentage: 20 },
      { source: 'Email', clicks: Math.floor(totalClicks * 0.1), conversions: Math.floor(totalConversions * 0.1), percentage: 10 }
    ];

    // Get device stats (simplified)
    const deviceStats = [
      { device: 'Mobile', clicks: Math.floor(totalClicks * 0.6), conversions: Math.floor(totalConversions * 0.6), percentage: 60 },
      { device: 'Desktop', clicks: Math.floor(totalClicks * 0.3), conversions: Math.floor(totalConversions * 0.3), percentage: 30 },
      { device: 'Tablet', clicks: Math.floor(totalClicks * 0.1), conversions: Math.floor(totalConversions * 0.1), percentage: 10 }
    ];

    // Get geographic stats (simplified)
    const geographicStats = [
      { country: 'Rwanda', clicks: Math.floor(totalClicks * 0.5), conversions: Math.floor(totalConversions * 0.5), earnings: totalEarnings * 0.5 },
      { country: 'Kenya', clicks: Math.floor(totalClicks * 0.2), conversions: Math.floor(totalConversions * 0.2), earnings: totalEarnings * 0.2 },
      { country: 'Uganda', clicks: Math.floor(totalClicks * 0.15), conversions: Math.floor(totalConversions * 0.15), earnings: totalEarnings * 0.15 },
      { country: 'Tanzania', clicks: Math.floor(totalClicks * 0.15), conversions: Math.floor(totalConversions * 0.15), earnings: totalEarnings * 0.15 }
    ];

    res.json({
      data: {
        totalClicks,
        totalConversions,
        totalEarnings,
        conversionRate,
        clickThroughRate: 2.5, // Simplified
        averageOrderValue: totalConversions > 0 ? totalEarnings / totalConversions : 0,
        topPerformingProducts: topPerformingProducts.filter(p => p !== null),
        topPerformingLinks: topPerformingLinks.filter(l => l !== null),
        dailyStats: dailyStats.map(stat => ({
          date: stat._id,
          clicks: stat.clicks,
          conversions: stat.conversions,
          earnings: stat.conversions * 10 // Simplified
        })),
        monthlyStats: [], // Can be implemented if needed
        trafficSources,
        deviceStats,
        geographicStats
      }
    });
  } catch (error) {
    console.error('Error fetching affiliate analytics:', error);
    res.status(500).json({ message: 'Failed to fetch affiliate analytics' });
  }
});

// Get affiliate products
router.get('/products', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.sub;

    // Get all affiliate relationships for this user
    const affiliates = await Affiliate.find({ user: userId, status: 'approved' });
    const vendorIds = affiliates.map(a => a.vendor);

    // Get products from vendors
    const products = await Product.find({ seller: { $in: vendorIds } })
      .populate('seller', 'name')
      .populate('store', 'name')
      .sort({ createdAt: -1 });

    // Get click and conversion stats for each product
    const productsWithStats = await Promise.all(products.map(async (product) => {
      const affiliate = affiliates.find(a => a.vendor.toString() === product.seller._id.toString());
      if (!affiliate) return null;

      const clicks = await AffiliateClick.find({
        affiliate: affiliate._id,
        targetId: product._id,
        linkType: 'product'
      });

      const conversions = clicks.filter(click => click.converted).length;
      const earnings = conversions * (product.price * (affiliate.commissionRate / 100));

      return {
        _id: product._id,
        title: product.title,
        description: product.description,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.images?.[0],
        images: product.images,
        category: product.category,
        subcategory: product.subcategory,
        vendor: {
          _id: product.seller._id,
          name: product.seller.name,
          logo: null,
          rating: 4.5
        },
        commissionRate: affiliate.commissionRate,
        status: 'active',
        tags: product.tags || [],
        rating: 4.5,
        reviewCount: 0,
        salesCount: conversions,
        clickCount: clicks.length,
        conversionCount: conversions,
        conversionRate: clicks.length > 0 ? (conversions / clicks.length) * 100 : 0,
        earnings,
        isFavorite: false,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      };
    }));

    res.json({ data: productsWithStats.filter(p => p !== null) });
  } catch (error) {
    console.error('Error fetching affiliate products:', error);
    res.status(500).json({ message: 'Failed to fetch affiliate products' });
  }
});

// Get affiliate products stats
router.get('/products/stats', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.sub;

    // Get all affiliate relationships for this user
    const affiliates = await Affiliate.find({ user: userId, status: 'approved' });
    const vendorIds = affiliates.map(a => a.vendor);

    // Get products count
    const totalProducts = await Product.countDocuments({ seller: { $in: vendorIds } });
    const activeProducts = await Product.countDocuments({ seller: { $in: vendorIds }, status: 'active' });

    // Get total clicks and conversions
    const affiliateIds = affiliates.map(a => a._id);
    const clicks = await AffiliateClick.find({ affiliate: { $in: affiliateIds } });
    const totalClicks = clicks.length;
    const totalConversions = clicks.filter(click => click.converted).length;

    // Get total earnings
    const commissions = await AffiliateCommission.find({ affiliate: { $in: affiliateIds } });
    const totalEarnings = commissions.reduce((sum, commission) => sum + commission.amount, 0);

    // Calculate average commission rate
    const averageCommissionRate = affiliates.length > 0 
      ? affiliates.reduce((sum, affiliate) => sum + affiliate.commissionRate, 0) / affiliates.length 
      : 0;

    // Get top category and vendor
    const topCategory = await Product.aggregate([
      { $match: { seller: { $in: vendorIds } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);

    const topVendor = await User.aggregate([
      { $match: { _id: { $in: vendorIds } } },
      { $lookup: { from: 'affiliatecommissions', localField: '_id', foreignField: 'vendor', as: 'commissions' } },
      { $addFields: { totalEarnings: { $sum: '$commissions.amount' } } },
      { $sort: { totalEarnings: -1 } },
      { $limit: 1 }
    ]);

    res.json({
      data: {
        totalProducts,
        activeProducts,
        totalClicks,
        totalConversions,
        totalEarnings,
        averageCommissionRate,
        topCategory: topCategory[0]?._id || '',
        topVendor: topVendor[0]?.name || ''
      }
    });
  } catch (error) {
    console.error('Error fetching affiliate products stats:', error);
    res.status(500).json({ message: 'Failed to fetch affiliate products stats' });
  }
});

// Get affiliate performance
router.get('/performance', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.sub;
    const { period = '30' } = req.query;

    // Get all affiliate relationships for this user
    const affiliates = await Affiliate.find({ user: userId, status: 'approved' });
    const affiliateIds = affiliates.map(a => a._id);

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period as string));

    // Get performance data
    const clicks = await AffiliateClick.find({
      affiliate: { $in: affiliateIds },
      createdAt: { $gte: startDate, $lte: endDate }
    });

    const conversions = clicks.filter(click => click.converted).length;
    const conversionRate = clicks.length > 0 ? (conversions / clicks.length) * 100 : 0;

    // Calculate overall score (simplified algorithm)
    const overallScore = Math.min(100, Math.max(0, 
      (conversionRate * 0.4) + 
      (Math.min(clicks.length / 100, 1) * 30) + 
      (Math.min(conversions / 10, 1) * 30)
    ));

    // Get rank (simplified - would need more complex logic in real implementation)
    const totalAffiliates = await Affiliate.countDocuments({ status: 'approved' });
    const rank = Math.floor(Math.random() * totalAffiliates) + 1;
    const percentile = Math.floor((1 - rank / totalAffiliates) * 100);

    // Calculate growth (simplified)
    const previousPeriodStart = new Date(startDate);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - parseInt(period as string));
    const previousPeriodEnd = new Date(startDate);

    const previousClicks = await AffiliateClick.find({
      affiliate: { $in: affiliateIds },
      createdAt: { $gte: previousPeriodStart, $lte: previousPeriodEnd }
    });

    const previousConversions = previousClicks.filter(click => click.converted).length;
    const monthlyGrowth = previousConversions > 0 ? ((conversions - previousConversions) / previousConversions) * 100 : 0;

    // Get achievements (simplified)
    const achievements = [
      {
        _id: '1',
        title: 'First Sale',
        description: 'Made your first affiliate sale',
        icon: 'trophy',
        earnedDate: new Date(),
        points: 100,
        category: 'sales'
      },
      {
        _id: '2',
        title: '100 Clicks',
        description: 'Generated 100 clicks on your affiliate links',
        icon: 'clicks',
        earnedDate: new Date(),
        points: 50,
        category: 'engagement'
      }
    ];

    // Get goals (simplified)
    const goals = [
      {
        _id: '1',
        title: 'Monthly Sales Target',
        description: 'Achieve 10 sales this month',
        target: 10,
        current: conversions,
        unit: 'sales',
        deadline: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
        status: conversions >= 10 ? 'completed' : 'active',
        category: 'sales'
      }
    ];

    // Get top products (simplified)
    const topProducts = await AffiliateClick.aggregate([
      { $match: { affiliate: { $in: affiliateIds }, linkType: 'product', createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$targetId', clicks: { $sum: 1 }, conversions: { $sum: { $cond: ['$converted', 1, 0] } } } },
      { $sort: { clicks: -1 } },
      { $limit: 5 }
    ]);

    const topProductsWithDetails = await Promise.all(topProducts.map(async (stat) => {
      const product = await Product.findById(stat._id);
      if (!product) return null;

      return {
        _id: product._id,
        name: product.title,
        image: product.images?.[0],
        performance: Math.min(100, (stat.clicks / 10) * 100),
        clicks: stat.clicks,
        conversions: stat.conversions,
        earnings: stat.conversions * (product.price * 0.1)
      };
    }));

    // Get competitor analysis (simplified)
    const competitorAnalysis = [
      { name: 'Top Performer', score: 95, clicks: 1000, conversions: 100, earnings: 5000, rank: 1 },
      { name: 'Average Affiliate', score: 75, clicks: 500, conversions: 50, earnings: 2500, rank: 2 }
    ];

    // Get recommendations (simplified)
    const recommendations = [
      {
        _id: '1',
        title: 'Improve Conversion Rate',
        description: 'Focus on high-converting products and optimize your content',
        priority: 'high',
        category: 'optimization',
        impact: 'Increase earnings by 25%'
      },
      {
        _id: '2',
        title: 'Expand Product Range',
        description: 'Promote more products to increase your earning potential',
        priority: 'medium',
        category: 'growth',
        impact: 'Increase earnings by 15%'
      }
    ];

    res.json({
      data: {
        overallScore,
        rank,
        totalAffiliates,
        percentile,
        monthlyGrowth,
        quarterlyGrowth: monthlyGrowth * 0.8,
        yearlyGrowth: monthlyGrowth * 0.6,
        keyMetrics: {
          clickThroughRate: 2.5,
          conversionRate,
          averageOrderValue: conversions > 0 ? 50 : 0,
          customerLifetimeValue: 150,
          returnCustomerRate: 15,
          socialMediaEngagement: 3.2
        },
        achievements,
        goals,
        monthlyPerformance: [], // Can be implemented if needed
        topProducts: topProductsWithDetails.filter(p => p !== null),
        competitorAnalysis,
        recommendations
      }
    });
  } catch (error) {
    console.error('Error fetching affiliate performance:', error);
    res.status(500).json({ message: 'Failed to fetch affiliate performance' });
  }
});

// Update affiliate link status
router.post('/links/:id/status', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.sub;
    const { id } = req.params;
    const { status } = req.body;

    // Verify affiliate owns this link
    const affiliate = await Affiliate.findOne({ user: userId, status: 'approved' });
    if (!affiliate) {
      return res.status(400).json({ message: 'Affiliate not found' });
    }

    const link = await AffiliateLink.findOne({ _id: id, affiliate: affiliate._id });
    if (!link) {
      return res.status(404).json({ message: 'Link not found' });
    }

    // Update link status
    link.status = status;
    await link.save();

    res.json({ success: true, message: 'Link status updated successfully' });
  } catch (error) {
    console.error('Error updating link status:', error);
    res.status(500).json({ message: 'Failed to update link status' });
  }
});

// Delete affiliate link
router.delete('/links/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.sub;
    const { id } = req.params;

    // Verify affiliate owns this link
    const affiliate = await Affiliate.findOne({ user: userId, status: 'approved' });
    if (!affiliate) {
      return res.status(400).json({ message: 'Affiliate not found' });
    }

    const link = await AffiliateLink.findOne({ _id: id, affiliate: affiliate._id });
    if (!link) {
      return res.status(404).json({ message: 'Link not found' });
    }

    // Delete link
    await AffiliateLink.findByIdAndDelete(id);

    res.json({ success: true, message: 'Link deleted successfully' });
  } catch (error) {
    console.error('Error deleting link:', error);
    res.status(500).json({ message: 'Failed to delete link' });
  }
});

// Export affiliate data
router.get('/analytics/export', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.sub;
    const { period = '30' } = req.query;

    // Get all affiliate relationships for this user
    const affiliates = await Affiliate.find({ user: userId, status: 'approved' });
    const affiliateIds = affiliates.map(a => a._id);

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period as string));

    // Get data for export
    const clicks = await AffiliateClick.find({
      affiliate: { $in: affiliateIds },
      createdAt: { $gte: startDate, $lte: endDate }
    }).populate('targetId', 'title');

    const commissions = await AffiliateCommission.find({
      affiliate: { $in: affiliateIds },
      createdAt: { $gte: startDate, $lte: endDate }
    }).populate('product', 'title');

    // Format data for CSV export (simplified)
    const exportData = {
      clicks: clicks.map(click => ({
        date: click.createdAt,
        target: click.targetId?.title || 'Unknown',
        converted: click.converted,
        ipAddress: click.ipAddress
      })),
      commissions: commissions.map(commission => ({
        date: commission.createdAt,
        product: commission.product?.title || 'Unknown',
        amount: commission.amount,
        status: commission.status
      }))
    };

    res.json({ success: true, data: exportData });
  } catch (error) {
    console.error('Error exporting affiliate data:', error);
    res.status(500).json({ message: 'Failed to export affiliate data' });
  }
});

// Export earnings data
router.get('/earnings/export', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.sub;

    // Get all affiliate relationships for this user
    const affiliates = await Affiliate.find({ user: userId, status: 'approved' });
    const affiliateIds = affiliates.map(a => a._id);

    // Get earnings data
    const commissions = await AffiliateCommission.find({ affiliate: { $in: affiliateIds } })
      .populate('product', 'title')
      .populate('order', 'orderNumber')
      .sort({ createdAt: -1 });

    // Format data for export
    const exportData = commissions.map(commission => ({
      date: commission.createdAt,
      orderNumber: commission.order?.orderNumber || 'N/A',
      product: commission.product?.title || 'Unknown',
      amount: commission.amount,
      status: commission.status,
      paymentDate: commission.paymentDate || 'N/A'
    }));

    res.json({ success: true, data: exportData });
  } catch (error) {
    console.error('Error exporting earnings data:', error);
    res.status(500).json({ message: 'Failed to export earnings data' });
  }
});

// Export performance data
router.get('/performance/export', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.sub;
    const { period = '30' } = req.query;

    // Get all affiliate relationships for this user
    const affiliates = await Affiliate.find({ user: userId, status: 'approved' });
    const affiliateIds = affiliates.map(a => a._id);

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period as string));

    // Get performance data
    const clicks = await AffiliateClick.find({
      affiliate: { $in: affiliateIds },
      createdAt: { $gte: startDate, $lte: endDate }
    });

    const commissions = await AffiliateCommission.find({
      affiliate: { $in: affiliateIds },
      createdAt: { $gte: startDate, $lte: endDate }
    });

    // Format data for export
    const exportData = {
      summary: {
        totalClicks: clicks.length,
        totalConversions: clicks.filter(click => click.converted).length,
        totalEarnings: commissions.reduce((sum, commission) => sum + commission.amount, 0),
        conversionRate: clicks.length > 0 ? (clicks.filter(click => click.converted).length / clicks.length) * 100 : 0
      },
      dailyStats: clicks.map(click => ({
        date: click.createdAt,
        clicks: 1,
        converted: click.converted ? 1 : 0
      }))
    };

    res.json({ success: true, data: exportData });
  } catch (error) {
    console.error('Error exporting performance data:', error);
    res.status(500).json({ message: 'Failed to export performance data' });
  }
});

export default router;
