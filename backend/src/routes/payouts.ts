import { Router } from 'express';
import PayoutAccount from '../models/PayoutAccount';
import PayoutRequest from '../models/PayoutRequest';
import Order from '../models/Order';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// Get vendor's payout stats
router.get('/stats', requireAuth, async (req: AuthRequest, res) => {
  const vendorId = req.user!.sub;
  
  try {
    // Calculate earnings from completed orders
    const vendorOrders = await Order.find({
      'items.sellerId': vendorId,
      status: 'delivered'
    });
    
    let totalEarnings = 0;
    vendorOrders.forEach(order => {
      order.items.forEach(item => {
        if (item.sellerId && item.sellerId.toString() === vendorId) {
          totalEarnings += item.price * (item.quantity || 1);
        }
      });
    });
    
    // Get payout requests
    const payoutRequests = await PayoutRequest.find({ vendor: vendorId });
    const completedPayouts = payoutRequests.filter(p => p.status === 'completed').length;
    const pendingPayouts = payoutRequests.filter(p => p.status === 'pending').length;
    const totalPaidOut = payoutRequests
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.netAmount, 0);
    const totalFees = payoutRequests
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.fee, 0);
    
    const availableBalance = totalEarnings - totalPaidOut;
    
    res.json({
      totalEarnings,
      availableBalance,
      pendingPayouts,
      completedPayouts,
      totalFees
    });
  } catch (error) {
    console.error('Error fetching payout stats:', error);
    res.status(500).json({ message: 'Failed to fetch payout stats' });
  }
});

// Get payout accounts
router.get('/accounts', requireAuth, async (req: AuthRequest, res) => {
  const vendorId = req.user!.sub;
  
  try {
    const accounts = await PayoutAccount.find({ owner: vendorId }).sort({ createdAt: -1 });
    res.json(accounts);
  } catch (error) {
    console.error('Error fetching payout accounts:', error);
    res.status(500).json({ message: 'Failed to fetch payout accounts' });
  }
});

// Create payout account
router.post('/accounts', requireAuth, async (req: AuthRequest, res) => {
  const vendorId = req.user!.sub;
  const { type, accountName, accountNumber } = req.body;
  
  try {
    // Check if this is the first account (make it default)
    const existingCount = await PayoutAccount.countDocuments({ owner: vendorId });
    const isDefault = existingCount === 0;
    
    const account = await PayoutAccount.create({
      owner: vendorId,
      type,
      accountName,
      accountNumber: accountNumber.slice(-4), // store only last 4 digits for display
      accountDetails: { full: accountNumber }, // in real app, encrypt this
      isDefault,
      isVerified: false
    });
    
    res.status(201).json(account);
  } catch (error) {
    console.error('Error creating payout account:', error);
    res.status(500).json({ message: 'Failed to create payout account' });
  }
});

// Update payout account
router.patch('/accounts/:id', requireAuth, async (req: AuthRequest, res) => {
  const vendorId = req.user!.sub;
  const { id } = req.params;
  
  try {
    const account = await PayoutAccount.findOneAndUpdate(
      { _id: id, owner: vendorId },
      { $set: req.body },
      { new: true }
    );
    
    if (!account) {
      return res.status(404).json({ message: 'Payout account not found' });
    }
    
    res.json(account);
  } catch (error) {
    console.error('Error updating payout account:', error);
    res.status(500).json({ message: 'Failed to update payout account' });
  }
});

// Get payout requests
router.get('/requests', requireAuth, async (req: AuthRequest, res) => {
  const vendorId = req.user!.sub;
  
  try {
    const requests = await PayoutRequest.find({ vendor: vendorId })
      .populate('payoutAccount')
      .sort({ createdAt: -1 });
    
    res.json(requests);
  } catch (error) {
    console.error('Error fetching payout requests:', error);
    res.status(500).json({ message: 'Failed to fetch payout requests' });
  }
});

// Create payout request
router.post('/requests', requireAuth, async (req: AuthRequest, res) => {
  const vendorId = req.user!.sub;
  const { amount, payoutAccountId } = req.body;
  
  try {
    // Check if account exists and belongs to vendor
    const account = await PayoutAccount.findOne({ 
      _id: payoutAccountId, 
      owner: vendorId,
      isVerified: true 
    });
    
    if (!account) {
      return res.status(400).json({ message: 'Invalid or unverified payout account' });
    }
    
    // Calculate fee (3% in this example)
    const fee = amount * 0.03;
    const netAmount = amount - fee;
    
    const request = await PayoutRequest.create({
      vendor: vendorId,
      payoutAccount: payoutAccountId,
      amount,
      fee,
      netAmount,
      status: 'pending'
    });
    
    const populated = await PayoutRequest.findById(request._id)
      .populate('payoutAccount');
    
    res.status(201).json(populated);
  } catch (error) {
    console.error('Error creating payout request:', error);
    res.status(500).json({ message: 'Failed to create payout request' });
  }
});

export default router;