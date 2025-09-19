import { Router } from 'express';
import Product from '../models/Product';
import Store from '../models/Store';
import Order from '../models/Order';
import BargainChat from '../models/BargainChat';
import { requireAuth, AuthRequest } from '../middleware/auth';

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
  const { name, description, category, logo, banner } = req.body;
  
  // Check if store name already exists for this user
  const exists = await Store.findOne({ owner: sellerId, name });
  if (exists) return res.status(400).json({ message: 'Store with this name already exists' });
  
  const doc = await Store.create({ 
    owner: sellerId, 
    name, 
    description, 
    category,
    logo,
    banner,
    approved: false,
    isActive: true
  });
  const withOwner = await Store.findById(doc._id).populate('owner', 'name email role');
  res.status(201).json(withOwner);
});

// Vendor store: update own store
router.put('/stores/:id', requireAuth, async (req: AuthRequest, res) => {
  const sellerId = req.user!.sub;
  const { id } = req.params;
  const { name, description, category, logo, banner, isActive } = req.body;
  
  // Check if store belongs to the user
  const store = await Store.findOne({ _id: id, owner: sellerId });
  if (!store) return res.status(404).json({ message: 'Store not found or not owned by user' });
  
  // Check if name already exists for this user (if name is being changed)
  if (name && name !== store.name) {
    const exists = await Store.findOne({ owner: sellerId, name, _id: { $ne: id } });
    if (exists) return res.status(400).json({ message: 'Store with this name already exists' });
  }
  
  const updateData: any = {};
  if (name) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (category !== undefined) updateData.category = category;
  if (logo !== undefined) updateData.logo = logo;
  if (banner !== undefined) updateData.banner = banner;
  if (isActive !== undefined) updateData.isActive = isActive;
  
  const updatedStore = await Store.findByIdAndUpdate(id, updateData, { new: true });
  res.json(updatedStore);
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

export default router;