import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import Affiliate from '../models/Affiliate';
import AffiliateCommission from '../models/AffiliateCommission';
import AffiliateClick from '../models/AffiliateClick';

const router = Router();

// Get affiliate leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const { period = '30d', limit = 50 } = req.query;

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
      case 'all':
        startDate = new Date(0);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Get top affiliates by earnings
    const leaderboard = await AffiliateCommission.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $in: ['approved', 'paid'] }
        }
      },
      {
        $group: {
          _id: '$affiliate',
          totalEarnings: { $sum: '$netCommission' },
          totalCommissions: { $sum: 1 },
          totalClicks: { $first: '$affiliate' } // We'll populate this separately
        }
      },
      {
        $lookup: {
          from: 'affiliates',
          localField: '_id',
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
          _id: '$_id',
          user: {
            _id: '$userInfo._id',
            name: '$userInfo.name',
            email: '$userInfo.email',
            avatar: '$userInfo.avatar'
          },
          vendor: {
            _id: '$vendorInfo._id',
            name: '$vendorInfo.name'
          },
          referralCode: '$affiliateInfo.referralCode',
          totalEarnings: 1,
          totalCommissions: 1,
          totalClicks: '$affiliateInfo.totalClicks',
          totalConversions: '$affiliateInfo.totalConversions'
        }
      },
      {
        $sort: { totalEarnings: -1 }
      },
      {
        $limit: Number(limit)
      }
    ]);

    // Add rank and badges
    const leaderboardWithRank = leaderboard.map((affiliate, index) => ({
      ...affiliate,
      rank: index + 1,
      badge: getBadge(index + 1, affiliate.totalEarnings, affiliate.totalConversions)
    }));

    res.json({
      period,
      leaderboard: leaderboardWithRank,
      totalAffiliates: leaderboard.length
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ message: 'Failed to fetch leaderboard' });
  }
});

// Get affiliate badges and achievements
router.get('/badges/:affiliateId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { affiliateId } = req.params;

    const affiliate = await Affiliate.findById(affiliateId);
    if (!affiliate) {
      return res.status(404).json({ message: 'Affiliate not found' });
    }

    const badges = await calculateBadges(affiliate);

    res.json({
      affiliate: {
        _id: affiliate._id,
        referralCode: affiliate.referralCode,
        totalEarnings: affiliate.totalEarnings,
        totalClicks: affiliate.totalClicks,
        totalConversions: affiliate.totalConversions
      },
      badges
    });
  } catch (error) {
    console.error('Error fetching badges:', error);
    res.status(500).json({ message: 'Failed to fetch badges' });
  }
});

// Get affiliate stats for gamification
router.get('/stats/:affiliateId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { affiliateId } = req.params;
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

    const affiliate = await Affiliate.findById(affiliateId);
    if (!affiliate) {
      return res.status(404).json({ message: 'Affiliate not found' });
    }

    // Get period-specific stats
    const periodStats = await AffiliateCommission.aggregate([
      {
        $match: {
          affiliate: affiliate._id,
          createdAt: { $gte: startDate },
          status: { $in: ['approved', 'paid'] }
        }
      },
      {
        $group: {
          _id: null,
          periodEarnings: { $sum: '$netCommission' },
          periodCommissions: { $sum: 1 }
        }
      }
    ]);

    const clicks = await AffiliateClick.countDocuments({
      affiliate: affiliate._id,
      createdAt: { $gte: startDate }
    });

    const conversions = await AffiliateClick.countDocuments({
      affiliate: affiliate._id,
      converted: true,
      createdAt: { $gte: startDate }
    });

    const periodEarnings = periodStats[0]?.periodEarnings || 0;
    const periodCommissions = periodStats[0]?.periodCommissions || 0;

    res.json({
      affiliate: {
        _id: affiliate._id,
        referralCode: affiliate.referralCode
      },
      period,
      stats: {
        earnings: periodEarnings,
        commissions: periodCommissions,
        clicks,
        conversions,
        conversionRate: clicks > 0 ? (conversions / clicks) * 100 : 0
      },
      badges: await calculateBadges(affiliate)
    });
  } catch (error) {
    console.error('Error fetching affiliate stats:', error);
    res.status(500).json({ message: 'Failed to fetch affiliate stats' });
  }
});

// Calculate badges for an affiliate
async function calculateBadges(affiliate: any) {
  const badges = [];

  // Earnings badges
  if (affiliate.totalEarnings >= 1000) {
    badges.push({
      id: 'high_earner',
      name: 'High Earner',
      description: 'Earned over $1,000',
      icon: '💰',
      earned: true,
      earnedDate: new Date()
    });
  } else if (affiliate.totalEarnings >= 500) {
    badges.push({
      id: 'medium_earner',
      name: 'Medium Earner',
      description: 'Earned over $500',
      icon: '💵',
      earned: true,
      earnedDate: new Date()
    });
  } else if (affiliate.totalEarnings >= 100) {
    badges.push({
      id: 'starter_earner',
      name: 'Starter Earner',
      description: 'Earned over $100',
      icon: '💸',
      earned: true,
      earnedDate: new Date()
    });
  }

  // Conversion badges
  if (affiliate.totalConversions >= 100) {
    badges.push({
      id: 'conversion_master',
      name: 'Conversion Master',
      description: '100+ conversions',
      icon: '🎯',
      earned: true,
      earnedDate: new Date()
    });
  } else if (affiliate.totalConversions >= 50) {
    badges.push({
      id: 'conversion_expert',
      name: 'Conversion Expert',
      description: '50+ conversions',
      icon: '🏆',
      earned: true,
      earnedDate: new Date()
    });
  } else if (affiliate.totalConversions >= 10) {
    badges.push({
      id: 'conversion_starter',
      name: 'Conversion Starter',
      description: '10+ conversions',
      icon: '⭐',
      earned: true,
      earnedDate: new Date()
    });
  }

  // Click badges
  if (affiliate.totalClicks >= 1000) {
    badges.push({
      id: 'click_champion',
      name: 'Click Champion',
      description: '1000+ clicks generated',
      icon: '👆',
      earned: true,
      earnedDate: new Date()
    });
  } else if (affiliate.totalClicks >= 500) {
    badges.push({
      id: 'click_expert',
      name: 'Click Expert',
      description: '500+ clicks generated',
      icon: '👆',
      earned: true,
      earnedDate: new Date()
    });
  } else if (affiliate.totalClicks >= 100) {
    badges.push({
      id: 'click_starter',
      name: 'Click Starter',
      description: '100+ clicks generated',
      icon: '👆',
      earned: true,
      earnedDate: new Date()
    });
  }

  // Consistency badge (active for 30+ days)
  const daysActive = Math.floor((Date.now() - affiliate.createdAt.getTime()) / (1000 * 60 * 60 * 24));
  if (daysActive >= 30) {
    badges.push({
      id: 'consistent_performer',
      name: 'Consistent Performer',
      description: 'Active for 30+ days',
      icon: '📅',
      earned: true,
      earnedDate: new Date()
    });
  }

  return badges;
}

// Get badge for leaderboard position
function getBadge(rank: number, earnings: number, conversions: number) {
  if (rank === 1) {
    return { name: '🥇 Champion', color: 'gold' };
  } else if (rank === 2) {
    return { name: '🥈 Runner-up', color: 'silver' };
  } else if (rank === 3) {
    return { name: '🥉 Third Place', color: 'bronze' };
  } else if (rank <= 10) {
    return { name: '🏆 Top 10', color: 'blue' };
  } else if (rank <= 50) {
    return { name: '⭐ Top 50', color: 'green' };
  } else {
    return { name: '🎯 Participant', color: 'gray' };
  }
}

export default router;
