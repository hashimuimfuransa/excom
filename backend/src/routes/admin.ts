import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import User from '../models/User';
import Product from '../models/Product';
import Order from '../models/Order';
import Store from '../models/Store';
import PayoutRequest from '../models/PayoutRequest';

const router = Router();

// Ensure requester is admin
function requireAdmin(req: AuthRequest, res: any, next: any) {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  next();
}

// List users (basic fields)
router.get('/users', requireAuth, requireAdmin, async (_req, res) => {
  const users = await User.find().select('name email role createdAt').sort({ createdAt: -1 }).limit(200);
  res.json(users);
});

// List products with seller info
router.get('/products', requireAuth, requireAdmin, async (_req, res) => {
  const products = await Product.find().populate('seller', 'name email').sort({ createdAt: -1 }).limit(200);
  res.json(products);
});

// Admin analytics endpoint
router.get('/analytics', requireAuth, requireAdmin, async (_req, res) => {
  try {
    // Get all orders
    const orders = await Order.find({}).populate('buyer', 'name email');
    const users = await User.find({});
    const stores = await Store.find({});
    const products = await Product.find({}).populate('seller', 'name email');

    // Calculate overview stats
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    const totalOrders = orders.length;
    const totalUsers = users.length;
    const totalStores = stores.filter(store => store.approved).length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Calculate trends (mock for now - in production you'd compare with previous period)
    const trends = {
      userGrowth: 12.5,
      revenueGrowth: 8.7,
      orderGrowth: 15.3,
      storeGrowth: 6.2
    };

    // Top products by revenue
    const productSales = new Map();
    orders.forEach(order => {
      order.items?.forEach((item: any) => {
        const productId = item.productId || item._id;
        const existing = productSales.get(productId) || { 
          _id: productId, 
          title: item.title || item.name || 'Unknown Product', 
          sales: 0, 
          revenue: 0 
        };
        existing.sales += item.quantity || 1;
        existing.revenue += (item.price || 0) * (item.quantity || 1);
        productSales.set(productId, existing);
      });
    });
    
    const topProducts = Array.from(productSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Top stores by revenue
    const storeRevenue = new Map();
    orders.forEach(order => {
      order.items?.forEach((item: any) => {
        const sellerId = item.sellerId;
        if (sellerId) {
          const store = stores.find(s => s.owner?.toString() === sellerId.toString());
          if (store) {
            const existing = storeRevenue.get(store._id) || {
              _id: store._id,
              name: store.name,
              revenue: 0,
              orders: 0
            };
            existing.revenue += (item.price || 0) * (item.quantity || 1);
            storeRevenue.set(store._id, existing);
          }
        }
      });
    });

    const topStores = Array.from(storeRevenue.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Recent activity
    const recentOrders = orders
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);
    
    const recentUsers = users
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 2);

    const recentActivity = [
      ...recentOrders.map(order => ({
        id: order._id,
        type: 'order' as const,
        description: `New order #${order._id.toString().slice(-6)} placed`,
        timestamp: order.createdAt,
        value: order.total
      })),
      ...recentUsers.map(user => ({
        id: user._id,
        type: user.role === 'seller' ? 'store' as const : 'user' as const,
        description: user.role === 'seller' 
          ? `New seller registration: ${user.email}` 
          : `New user registered: ${user.email}`,
        timestamp: user.createdAt
      }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
     .slice(0, 5);

    res.json({
      overview: {
        totalRevenue,
        totalOrders,
        totalUsers,
        totalStores,
        averageOrderValue
      },
      trends,
      topProducts,
      topStores,
      recentActivity
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Failed to fetch analytics data' });
  }
});

// Admin earnings endpoint
router.get('/earnings', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const orders = await Order.find({}).populate('buyer', 'name email');
    const users = await User.find({ role: 'seller' });
    const stores = await Store.find({}).populate('owner', 'name email');
    const payoutRequests = await PayoutRequest.find({})
      .populate('vendor', 'name email')
      .sort({ createdAt: -1 });

    // Calculate earnings per seller
    const sellerEarnings = new Map();
    
    orders.forEach(order => {
      if (order.status === 'delivered' && order.paymentStatus === 'paid') {
        order.items?.forEach((item: any) => {
          const sellerId = item.sellerId;
          if (sellerId) {
            const seller = users.find(u => u._id.toString() === sellerId.toString());
            const store = stores.find(s => s.owner?._id.toString() === sellerId.toString());
            
            if (seller) {
              const existing = sellerEarnings.get(sellerId.toString()) || {
                _id: `earning_${sellerId}`,
                seller: {
                  _id: seller._id,
                  name: seller.name,
                  email: seller.email
                },
                store: store ? {
                  _id: store._id,
                  name: store.name
                } : undefined,
                totalEarnings: 0,
                availableBalance: 0,
                pendingBalance: 0,
                totalWithdrawn: 0,
                commissionRate: 5.0,
                status: 'active' as const,
                ordersCount: 0,
                productsCount: 0
              };
              
              const itemTotal = (item.price || 0) * (item.quantity || 1);
              const sellerEarning = itemTotal * 0.95; // 5% platform commission
              
              existing.totalEarnings += sellerEarning;
              existing.availableBalance += sellerEarning;
              existing.ordersCount += 1;
              
              sellerEarnings.set(sellerId.toString(), existing);
            }
          }
        });
      }
    });

    // Subtract withdrawn amounts
    payoutRequests.forEach(payout => {
      if (payout.status === 'completed' && payout.vendor) {
        const sellerId = payout.vendor._id.toString();
        const existing = sellerEarnings.get(sellerId);
        if (existing) {
          existing.totalWithdrawn += payout.netAmount || payout.amount || 0;
          existing.availableBalance -= payout.netAmount || payout.amount || 0;
        }
      }
    });

    const earnings = Array.from(sellerEarnings.values());
    
    // Calculate stats
    const totalRevenue = earnings.reduce((sum, e) => sum + (e.totalEarnings / 0.95), 0);
    const totalCommissions = earnings.reduce((sum, e) => sum + (e.totalEarnings * 0.05 / 0.95), 0);
    const totalPayouts = earnings.reduce((sum, e) => sum + e.totalWithdrawn, 0);
    const pendingPayouts = payoutRequests
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    const activeSellerCount = earnings.filter(e => e.status === 'active').length;
    
    res.json({
      earnings,
      payoutRequests: payoutRequests.map(pr => ({
        _id: pr._id,
        seller: pr.vendor ? {
          _id: pr.vendor._id,
          name: pr.vendor.name,
          email: pr.vendor.email
        } : null,
        amount: pr.amount,
        requestDate: pr.createdAt,
        status: pr.status,
        paymentMethod: pr.paymentMethod || 'Bank Transfer',
        accountDetails: pr.accountDetails || '****0000',
        notes: pr.notes
      })),
      stats: {
        totalRevenue,
        totalCommissions,
        totalPayouts,
        pendingPayouts,
        activeSellerCount,
        avgCommissionRate: 5.0
      }
    });
  } catch (error) {
    console.error('Error fetching earnings:', error);
    res.status(500).json({ message: 'Failed to fetch earnings data' });
  }
});

// Admin orders endpoint
router.get('/orders', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const orders = await Order.find({})
      .populate('buyer', 'name email')
      .sort({ createdAt: -1 })
      .limit(200);
    
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// Admin stores endpoint
router.get('/stores', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const stores = await Store.find({})
      .populate('owner', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(stores);
  } catch (error) {
    console.error('Error fetching stores:', error);
    res.status(500).json({ message: 'Failed to fetch stores' });
  }
});

// Admin withdrawal requests endpoints
router.get('/withdrawals', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const withdrawals = await PayoutRequest.find({})
      .populate('vendor', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(withdrawals);
  } catch (error) {
    console.error('Error fetching withdrawals:', error);
    res.status(500).json({ message: 'Failed to fetch withdrawal requests' });
  }
});

router.patch('/withdrawals/:id/approve', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const withdrawal = await PayoutRequest.findByIdAndUpdate(
      id,
      { status: 'processing', processedAt: new Date() },
      { new: true }
    ).populate('vendor', 'name email');
    
    if (!withdrawal) {
      return res.status(404).json({ message: 'Withdrawal request not found' });
    }
    
    res.json(withdrawal);
  } catch (error) {
    console.error('Error approving withdrawal:', error);
    res.status(500).json({ message: 'Failed to approve withdrawal' });
  }
});

router.patch('/withdrawals/:id/reject', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    
    const withdrawal = await PayoutRequest.findByIdAndUpdate(
      id,
      { 
        status: 'rejected', 
        rejectionReason,
        processedAt: new Date() 
      },
      { new: true }
    ).populate('vendor', 'name email');
    
    if (!withdrawal) {
      return res.status(404).json({ message: 'Withdrawal request not found' });
    }
    
    res.json(withdrawal);
  } catch (error) {
    console.error('Error rejecting withdrawal:', error);
    res.status(500).json({ message: 'Failed to reject withdrawal' });
  }
});

router.patch('/withdrawals/:id/complete', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const withdrawal = await PayoutRequest.findByIdAndUpdate(
      id,
      { 
        status: 'completed',
        completedAt: new Date() 
      },
      { new: true }
    ).populate('vendor', 'name email');
    
    if (!withdrawal) {
      return res.status(404).json({ message: 'Withdrawal request not found' });
    }
    
    res.json(withdrawal);
  } catch (error) {
    console.error('Error completing withdrawal:', error);
    res.status(500).json({ message: 'Failed to complete withdrawal' });
  }
});

export default router;