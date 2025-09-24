import { Router } from 'express';
import Product from '../models/Product';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// Public: list recent products
router.get('/', async (_req, res) => {
  const list = await Product.find().limit(50).sort({ createdAt: -1 });
  res.json(list);
});

// Public: get single product by id
router.get('/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    
    // Validate productId parameter
    if (!productId || productId === 'undefined' || productId === 'null') {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    // Validate ObjectId format
    if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid product ID format' });
    }

    const item = await Product.findById(productId);
    if (!item) return res.status(404).json({ message: 'Product not found' });
    
    res.json(item);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Public: get products by store
router.get('/store/:storeId', async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const storeId = req.params.storeId;
    
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    const products = await Product.find({ store: storeId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit as string));
      
    const total = await Product.countDocuments({ store: storeId });
    
    res.json({
      products,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});

// Public: get related products by category (excluding current product)
router.get('/related/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    const { limit = 8 } = req.query;
    
    // First get the current product to find its category
    const currentProduct = await Product.findById(productId);
    if (!currentProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Find related products in the same category, excluding current product
    const relatedProducts = await Product.find({
      _id: { $ne: productId },
      category: currentProduct.category
    })
    .limit(parseInt(limit as string))
    .sort({ createdAt: -1 });
    
    res.json(relatedProducts);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch related products' });
  }
});

// Seller: list my products with optional store filter
router.get('/mine/list', requireAuth, async (req: AuthRequest, res) => {
  const sellerId = req.user!.sub;
  const { store } = req.query;
  
  const query: any = { seller: sellerId };
  if (store) {
    query.store = store;
  }
  
  const list = await Product.find(query).populate('store', 'name').sort({ createdAt: -1 });
  res.json(list);
});

// Seller: create product (accepts base64 image strings or URLs in images[])
router.post('/', requireAuth, async (req: AuthRequest, res) => {
  const role = req.user!.role;
  if (!['seller', 'admin'].includes(role)) {
    return res.status(403).json({ message: 'Seller or admin role required' });
  }

  const { 
    title, 
    description, 
    images = [], 
    price, 
    currency = 'USD', 
    category, 
    source = 'local', 
    store,
    bargainingEnabled = false,
    minBargainPrice,
    maxBargainDiscountPercent = 20,
    variants = {}
  } = req.body || {};

  if (!title || !description || typeof price !== 'number' || !category) {
    return res.status(400).json({ message: 'title, description, price, and category are required' });
  }

  // Basic sanitization of images field to be string array
  const imgArray: string[] = Array.isArray(images) ? images.filter((i: any) => typeof i === 'string') : [];

  // Ensure at least one image is provided
  if (imgArray.length === 0) {
    return res.status(400).json({ message: 'At least one product image is required' });
  }

  // If store is provided, verify it belongs to the seller
  if (store) {
    const Store = require('../models/Store').default;
    const storeDoc = await Store.findOne({ _id: store, owner: req.user!.sub });
    if (!storeDoc) {
      return res.status(400).json({ message: 'Invalid store or store does not belong to you' });
    }
  }

  // Process variants data
  const processedVariants: any = {};
  
  if (variants.sizes && Array.isArray(variants.sizes)) {
    processedVariants.sizes = variants.sizes.filter((size: any) => typeof size === 'string' && size.trim());
  }
  
  if (variants.colors && Array.isArray(variants.colors)) {
    processedVariants.colors = variants.colors.filter((color: any) => typeof color === 'string' && color.trim());
  }
  
  if (variants.weight) {
    processedVariants.weight = {
      value: variants.weight.value,
      unit: variants.weight.unit || 'kg',
      displayValue: variants.weight.displayValue || `${variants.weight.value}${variants.weight.unit || 'kg'}`
    };
  }
  
  if (variants.dimensions) {
    processedVariants.dimensions = {
      length: variants.dimensions.length,
      width: variants.dimensions.width,
      height: variants.dimensions.height,
      unit: variants.dimensions.unit || 'cm'
    };
  }
  
  if (variants.material) processedVariants.material = variants.material;
  if (variants.brand) processedVariants.brand = variants.brand;
  if (variants.sku) processedVariants.sku = variants.sku;
  if (variants.inventory !== undefined) processedVariants.inventory = variants.inventory;

  const doc = await Product.create({
    title,
    description,
    images: imgArray,
    price,
    currency,
    category,
    source,
    seller: req.user!.sub,
    store: store || undefined,
    bargainingEnabled,
    minBargainPrice: minBargainPrice || undefined,
    maxBargainDiscountPercent,
    variants: Object.keys(processedVariants).length > 0 ? processedVariants : undefined
  });

  res.status(201).json(doc);
});

// Seller: update product
router.patch('/:id', requireAuth, async (req: AuthRequest, res) => {
  const role = req.user!.role;
  if (!['seller', 'admin'].includes(role)) {
    return res.status(403).json({ message: 'Seller or admin role required' });
  }

  const productId = req.params.id;
  const sellerId = req.user!.sub;
  
  // Find the product and check ownership
  const product = await Product.findOne({ _id: productId, seller: sellerId });
  if (!product) {
    return res.status(404).json({ message: 'Product not found or does not belong to you' });
  }

  const { 
    title, 
    description, 
    images, 
    price, 
    currency, 
    category, 
    source, 
    store,
    bargainingEnabled,
    minBargainPrice,
    maxBargainDiscountPercent,
    variants
  } = req.body || {};

  // If store is provided, verify it belongs to the seller
  if (store) {
    const Store = require('../models/Store').default;
    const storeDoc = await Store.findOne({ _id: store, owner: sellerId });
    if (!storeDoc) {
      return res.status(400).json({ message: 'Invalid store or store does not belong to you' });
    }
  }

  // Process variants data if provided
  let processedVariants: any = undefined;
  if (variants !== undefined) {
    processedVariants = {};
    
    if (variants.sizes && Array.isArray(variants.sizes)) {
      processedVariants.sizes = variants.sizes.filter((size: any) => typeof size === 'string' && size.trim());
    }
    
    if (variants.colors && Array.isArray(variants.colors)) {
      processedVariants.colors = variants.colors.filter((color: any) => typeof color === 'string' && color.trim());
    }
    
    if (variants.weight) {
      processedVariants.weight = {
        value: variants.weight.value,
        unit: variants.weight.unit || 'kg',
        displayValue: variants.weight.displayValue || `${variants.weight.value}${variants.weight.unit || 'kg'}`
      };
    }
    
    if (variants.dimensions) {
      processedVariants.dimensions = {
        length: variants.dimensions.length,
        width: variants.dimensions.width,
        height: variants.dimensions.height,
        unit: variants.dimensions.unit || 'cm'
      };
    }
    
    if (variants.material) processedVariants.material = variants.material;
    if (variants.brand) processedVariants.brand = variants.brand;
    if (variants.sku) processedVariants.sku = variants.sku;
    if (variants.inventory !== undefined) processedVariants.inventory = variants.inventory;
  }

  // Build update object with only provided fields
  const updateData: any = {};
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (images !== undefined) updateData.images = images;
  if (price !== undefined) updateData.price = price;
  if (currency !== undefined) updateData.currency = currency;
  if (category !== undefined) updateData.category = category;
  if (source !== undefined) updateData.source = source;
  if (store !== undefined) updateData.store = store;
  if (bargainingEnabled !== undefined) updateData.bargainingEnabled = bargainingEnabled;
  if (minBargainPrice !== undefined) updateData.minBargainPrice = minBargainPrice;
  if (maxBargainDiscountPercent !== undefined) updateData.maxBargainDiscountPercent = maxBargainDiscountPercent;
  if (processedVariants !== undefined) updateData.variants = processedVariants;

  const updatedProduct = await Product.findByIdAndUpdate(productId, updateData, { new: true });
  res.json(updatedProduct);
});

// Seller: delete product
router.delete('/:id', requireAuth, async (req: AuthRequest, res) => {
  const role = req.user!.role;
  if (!['seller', 'admin'].includes(role)) {
    return res.status(403).json({ message: 'Seller or admin role required' });
  }

  const productId = req.params.id;
  const sellerId = req.user!.sub;
  
  // Find the product and check ownership
  const product = await Product.findOne({ _id: productId, seller: sellerId });
  if (!product) {
    return res.status(404).json({ message: 'Product not found or does not belong to you' });
  }

  await Product.findByIdAndDelete(productId);
  res.json({ message: 'Product deleted successfully' });
});

export default router;