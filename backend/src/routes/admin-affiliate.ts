import { Router } from 'express';
import { requireAuth, AuthRequest, requireRole } from '../middleware/auth';
import Affiliate from '../models/Affiliate';
import AffiliateProgram from '../models/AffiliateProgram';
import AffiliateCommission from '../models/AffiliateCommission';
import AffiliateClick from '../models/AffiliateClick';
import AffiliatePayout from '../models/AffiliatePayout';
import User from '../models/User';

const router = Router();

// Get global affiliate stats
router.get('/stats', requireAuth, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    // Get affiliate counts
    const totalAffiliates = await Affiliate.countDocuments();
    const activeAffiliates = await Affiliate.countDocuments({ status: 'approved' });
    const pendingAffiliates = await Affiliate.countDocuments({ status: 'pending' });

    // Get click and conversion stats
    const totalClicks = await AffiliateClick.countDocuments();
    const totalConversions = await AffiliateClick.countDocuments({ converted: true });

    // Get commission stats
    const commissionStats = await AffiliateCommission.aggregate([
      {
        $group: {
          _id: null,
          totalCommissions: { $sum: '$commissionAmount' },
          totalPlatformFees: { $sum: '$platformFee' }
        }
      }
    ]);

    const totalCommissions = commissionStats[0]?.totalCommissions || 0;
    const platformRevenue = commissionStats[0]?.totalPlatformFees || 0;
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

    res.json({
      totalAffiliates,
      activeAffiliates,
      pendingAffiliates,
      totalClicks,
      totalConversions,
      totalCommissions,
      platformRevenue,
      conversionRate
    });
  } catch (error) {
    console.error('Error fetching global affiliate stats:', error);
    res.status(500).json({ message: 'Failed to fetch global affiliate stats' });
  }
});

// Get top performing vendors
router.get('/top-vendors', requireAuth, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const topVendors = await AffiliateCommission.aggregate([
      {
        $group: {
          _id: '$vendor',
          totalCommissions: { $sum: '$commissionAmount' },
          platformRevenue: { $sum: '$platformFee' },
          affiliateCount: { $addToSet: '$affiliate' }
        }
      },
      {
        $project: {
          vendor: '$_id',
          totalCommissions: 1,
          platformRevenue: 1,
          affiliateCount: { $size: '$affiliateCount' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'vendor',
          foreignField: '_id',
          as: 'vendorInfo'
        }
      },
      {
        $unwind: '$vendorInfo'
      },
      {
        $project: {
          _id: '$vendor',
          name: '$vendorInfo.name',
          email: '$vendorInfo.email',
          totalCommissions: 1,
          platformRevenue: 1,
          affiliateCount: 1
        }
      },
      {
        $sort: { totalCommissions: -1 }
      },
      {
        $limit: 10
      }
    ]);

    res.json(topVendors);
  } catch (error) {
    console.error('Error fetching top vendors:', error);
    res.status(500).json({ message: 'Failed to fetch top vendors' });
  }
});

// Get suspicious activities (fraud detection)
router.get('/suspicious', requireAuth, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    // Find affiliates with suspicious patterns
    const suspiciousAffiliates = await AffiliateClick.aggregate([
      {
        $group: {
          _id: '$affiliate',
          totalClicks: { $sum: 1 },
          uniqueVisitors: { $addToSet: '$visitorId' },
          conversions: { $sum: { $cond: ['$converted', 1, 0] } },
          avgClicksPerVisitor: { $avg: '$visitorId' },
          lastActivity: { $max: '$createdAt' }
        }
      },
      {
        $project: {
          affiliate: '$_id',
          totalClicks: 1,
          uniqueVisitors: { $size: '$uniqueVisitors' },
          conversions: 1,
          lastActivity: 1,
          clickToVisitorRatio: {
            $divide: ['$totalClicks', { $size: '$uniqueVisitors' }]
          }
        }
      },
      {
        $match: {
          $or: [
            { clickToVisitorRatio: { $gt: 10 } }, // More than 10 clicks per visitor
            { conversions: { $gt: 50 } }, // More than 50 conversions
            { totalClicks: { $gt: 1000 } } // More than 1000 total clicks
          ]
        }
      },
      {
        $lookup: {
          from: 'affiliates',
          localField: 'affiliate',
          foreignField: '_id',
          as: 'affiliateInfo'
        }
      },
      {
        $unwind: '$affiliateInfo'
      },
      {
        $lookup: {
          from: 'users',
          localField: 'affiliateInfo.user',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $unwind: '$userInfo'
      },
      {
        $lookup: {
          from: 'users',
          localField: 'affiliateInfo.vendor',
          foreignField: '_id',
          as: 'vendorInfo'
        }
      },
      {
        $unwind: '$vendorInfo'
      },
      {
        $project: {
          _id: '$affiliate',
          affiliate: {
            _id: '$affiliate',
            referralCode: '$affiliateInfo.referralCode',
            user: {
              _id: '$userInfo._id',
              name: '$userInfo.name',
              email: '$userInfo.email'
            }
          },
          vendor: {
            name: '$vendorInfo.name'
          },
          suspiciousClicks: '$totalClicks',
          suspiciousConversions: '$conversions',
          riskScore: {
            $min: [
              100,
              {
                $add: [
                  { $multiply: ['$clickToVisitorRatio', 10] },
                  { $multiply: ['$conversions', 2] }
                ]
              }
            ]
          },
          lastActivity: 1
        }
      },
      {
        $sort: { riskScore: -1 }
      },
      {
        $limit: 20
      }
    ]);

    res.json(suspiciousAffiliates);
  } catch (error) {
    console.error('Error fetching suspicious activities:', error);
    res.status(500).json({ message: 'Failed to fetch suspicious activities' });
  }
});

// Ban suspicious affiliate
router.post('/ban-affiliate/:id', requireAuth, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const affiliate = await Affiliate.findByIdAndUpdate(
      id,
      { 
        status: 'banned',
        notes: reason || 'Banned by admin for suspicious activity'
      },
      { new: true }
    ).populate('user', 'name email');

    if (!affiliate) {
      return res.status(404).json({ message: 'Affiliate not found' });
    }

    res.json({ message: 'Affiliate banned successfully', affiliate });
  } catch (error) {
    console.error('Error banning affiliate:', error);
    res.status(500).json({ message: 'Failed to ban affiliate' });
  }
});

// Get affiliate program overview
router.get('/programs', requireAuth, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const programs = await AffiliateProgram.find()
      .populate('vendor', 'name email')
      .sort({ createdAt: -1 });

    res.json(programs);
  } catch (error) {
    console.error('Error fetching affiliate programs:', error);
    res.status(500).json({ message: 'Failed to fetch affiliate programs' });
  }
});

// Get affiliate payout requests
router.get('/payout-requests', requireAuth, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const payoutRequests = await AffiliatePayout.find()
      .populate('affiliate', 'referralCode')
      .populate('affiliate.user', 'name email')
      .populate('vendor', 'name email')
      .sort({ requestedAt: -1 });

    res.json(payoutRequests);
  } catch (error) {
    console.error('Error fetching payout requests:', error);
    res.status(500).json({ message: 'Failed to fetch payout requests' });
  }
});

// Approve payout request
router.post('/payout-requests/:id/approve', requireAuth, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    const payoutRequest = await AffiliatePayout.findByIdAndUpdate(
      id,
      { 
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: req.user?.sub
      },
      { new: true }
    ).populate('affiliate', 'referralCode')
     .populate('affiliate.user', 'name email')
     .populate('vendor', 'name email');

    if (!payoutRequest) {
      return res.status(404).json({ message: 'Payout request not found' });
    }

    res.json({ message: 'Payout request approved successfully', payoutRequest });
  } catch (error) {
    console.error('Error approving payout request:', error);
    res.status(500).json({ message: 'Failed to approve payout request' });
  }
});

// Reject payout request
router.post('/payout-requests/:id/reject', requireAuth, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const payoutRequest = await AffiliatePayout.findByIdAndUpdate(
      id,
      { 
        status: 'rejected',
        rejectedAt: new Date(),
        rejectedBy: req.user?.sub,
        rejectionReason: reason
      },
      { new: true }
    ).populate('affiliate', 'referralCode')
     .populate('affiliate.user', 'name email')
     .populate('vendor', 'name email');

    if (!payoutRequest) {
      return res.status(404).json({ message: 'Payout request not found' });
    }

    res.json({ message: 'Payout request rejected successfully', payoutRequest });
  } catch (error) {
    console.error('Error rejecting payout request:', error);
    res.status(500).json({ message: 'Failed to reject payout request' });
  }
});

export default router;
