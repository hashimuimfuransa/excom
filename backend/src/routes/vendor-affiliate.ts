import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import Affiliate from '../models/Affiliate';
import AffiliateProgram from '../models/AffiliateProgram';
import AffiliateCommission from '../models/AffiliateCommission';
import AffiliatePayout from '../models/AffiliatePayout';
import AffiliateClick from '../models/AffiliateClick';
import User from '../models/User';
import Store from '../models/Store';

const router = Router();

// Get vendor's affiliate program settings
router.get('/program', requireAuth, async (req: AuthRequest, res) => {
  try {
    const vendorId = req.user!.sub;

    let program = await AffiliateProgram.findOne({ vendor: vendorId });
    
    // Create default program if it doesn't exist
    if (!program) {
      program = await AffiliateProgram.create({
        vendor: vendorId,
        isActive: true,
        globalSettings: {
          enabled: true,
          defaultCommissionRate: 5,
          defaultCommissionType: 'percentage',
          minPayoutAmount: 50,
          payoutFrequency: 'monthly',
          autoApproveAffiliates: false,
          requireSocialMediaVerification: false
        },
        commissionRules: {
          productCategories: []
        },
        payoutSettings: {
          allowedMethods: ['bank', 'mobile_money'],
          processingFee: 3,
          vendorFee: 0
        },
        trackingSettings: {
          cookieDuration: 30,
          allowMultipleConversions: true,
          conversionWindow: 7
        }
      });
    }

    res.json(program);
  } catch (error) {
    console.error('Error fetching affiliate program:', error);
    res.status(500).json({ message: 'Failed to fetch affiliate program' });
  }
});

// Update vendor's affiliate program settings
router.put('/program', requireAuth, async (req: AuthRequest, res) => {
  try {
    const vendorId = req.user!.sub;
    const updates = req.body;

    const program = await AffiliateProgram.findOneAndUpdate(
      { vendor: vendorId },
      { $set: updates },
      { new: true, upsert: true }
    );

    res.json(program);
  } catch (error) {
    console.error('Error updating affiliate program:', error);
    res.status(500).json({ message: 'Failed to update affiliate program' });
  }
});

// Get vendor's affiliates
router.get('/affiliates', requireAuth, async (req: AuthRequest, res) => {
  try {
    const vendorId = req.user!.sub;
    const { status, page = 1, limit = 10 } = req.query;

    const query: any = { vendor: vendorId };
    if (status) {
      query.status = status;
    }

    const affiliates = await Affiliate.find(query)
      .populate('user', 'name email avatar phone country city')
      .populate('store', 'name description')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Affiliate.countDocuments(query);

    res.json({
      affiliates,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching affiliates:', error);
    res.status(500).json({ message: 'Failed to fetch affiliates' });
  }
});

// Get detailed affiliate information
router.get('/affiliates/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const vendorId = req.user!.sub;
    const { id } = req.params;

    const affiliate = await Affiliate.findOne({ _id: id, vendor: vendorId })
      .populate('user', 'name email avatar phone country city address zipCode')
      .populate('store', 'name description logo')
      .populate('program', 'globalSettings commissionRules');

    if (!affiliate) {
      return res.status(404).json({ message: 'Affiliate not found' });
    }

    // Get recent commissions for this affiliate
    const recentCommissions = await AffiliateCommission.find({ affiliate: id })
      .populate('order', 'total status createdAt')
      .populate('product', 'title images')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get recent clicks for this affiliate
    const recentClicks = await AffiliateClick.find({ affiliate: id })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      affiliate,
      recentCommissions,
      recentClicks
    });
  } catch (error) {
    console.error('Error fetching affiliate details:', error);
    res.status(500).json({ message: 'Failed to fetch affiliate details' });
  }
});

// Approve/reject affiliate application
router.patch('/affiliates/:id/status', requireAuth, async (req: AuthRequest, res) => {
  try {
    const vendorId = req.user!.sub;
    const { id } = req.params;
    const { status, notes, commissionRate, commissionType } = req.body;

    if (!['approved', 'rejected', 'banned'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const updateData: any = { 
      status,
      approvalDate: status === 'approved' ? new Date() : undefined,
      notes
    };

    // Allow updating commission rate and type when approving
    if (status === 'approved') {
      if (commissionRate !== undefined) updateData.commissionRate = commissionRate;
      if (commissionType !== undefined) updateData.commissionType = commissionType;
    }

    const affiliate = await Affiliate.findOneAndUpdate(
      { _id: id, vendor: vendorId },
      updateData,
      { new: true }
    ).populate('user', 'name email avatar phone country city');

    if (!affiliate) {
      return res.status(404).json({ message: 'Affiliate not found' });
    }

    res.json(affiliate);
  } catch (error) {
    console.error('Error updating affiliate status:', error);
    res.status(500).json({ message: 'Failed to update affiliate status' });
  }
});

// Get vendor's affiliate analytics
router.get('/analytics', requireAuth, async (req: AuthRequest, res) => {
  try {
    const vendorId = req.user!.sub;
    const { period = '30d' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Get affiliate stats
    const totalAffiliates = await Affiliate.countDocuments({ vendor: vendorId });
    const activeAffiliates = await Affiliate.countDocuments({ 
      vendor: vendorId, 
      status: 'approved' 
    });
    const pendingAffiliates = await Affiliate.countDocuments({ 
      vendor: vendorId, 
      status: 'pending' 
    });

    // Get commission stats
    const totalCommissions = await AffiliateCommission.aggregate([
      { $match: { vendor: vendorId, createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$commissionAmount' },
          totalNet: { $sum: '$netCommission' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get click stats
    const totalClicks = await AffiliateClick.countDocuments({ 
      vendor: vendorId, 
      createdAt: { $gte: startDate } 
    });

    // Get conversion rate
    const conversions = await AffiliateClick.countDocuments({ 
      vendor: vendorId, 
      converted: true,
      createdAt: { $gte: startDate } 
    });

    const conversionRate = totalClicks > 0 ? (conversions / totalClicks) * 100 : 0;

    // Get top performing affiliates
    const topAffiliates = await Affiliate.find({ vendor: vendorId, status: 'approved' })
      .populate('user', 'name email')
      .sort({ totalEarnings: -1 })
      .limit(5);

    res.json({
      overview: {
        totalAffiliates,
        activeAffiliates,
        pendingAffiliates,
        totalClicks,
        conversions,
        conversionRate: Math.round(conversionRate * 100) / 100
      },
      commissions: totalCommissions[0] || { totalAmount: 0, totalNet: 0, count: 0 },
      topAffiliates
    });
  } catch (error) {
    console.error('Error fetching affiliate analytics:', error);
    res.status(500).json({ message: 'Failed to fetch affiliate analytics' });
  }
});

export default router;
