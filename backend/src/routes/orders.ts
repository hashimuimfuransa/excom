import { Router } from 'express';
import Order from '../models/Order';
import { requireAuth, AuthRequest } from '../middleware/auth';
import Affiliate from '../models/Affiliate';
import { processAffiliateCommission } from '../middleware/affiliateTracking';

const router = Router();

router.get('/', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const list = await Order.find({ buyer: userId }).sort({ createdAt: -1 });
  res.json(list);
});

router.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.sub;
    const { items, currency, affiliateCode, couponCode } = req.body;
    
    // Calculate total
    const total = items.reduce((sum: number, it: any) => sum + it.price * (it.quantity || 1), 0);
    
    // Find affiliate if code provided
    let affiliateId = null;
    if (affiliateCode) {
      const affiliate = await Affiliate.findOne({ 
        referralCode: affiliateCode, 
        status: 'approved' 
      });
      affiliateId = affiliate?._id;
    }
    
    // Create order with affiliate tracking
    const order = await Order.create({ 
      buyer: userId, 
      items, 
      total, 
      currency: currency || 'USD',
      affiliateId,
      affiliateCode,
      couponCode,
      referralSource: affiliateCode ? 'affiliate_link' : couponCode ? 'coupon_code' : undefined
    });
    
    res.status(201).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Failed to create order' });
  }
});

// Update order status
router.patch('/:id/status', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const order = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Process affiliate commission when order is completed
    if (status === 'completed' && order.affiliateId) {
      await processAffiliateCommission(order._id);
    }
    
    res.json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Failed to update order status' });
  }
});

export default router;