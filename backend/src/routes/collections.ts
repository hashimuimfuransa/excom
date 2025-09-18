import express from 'express';
import Collection, { ICollection } from '../models/Collection';
import Booking from '../models/Booking';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

// Get all collections with optional filters
router.get('/', async (req, res) => {
  try {
    const {
      type,
      category,
      city,
      state,
      country,
      latitude,
      longitude,
      radius = 10, // km
      minPrice,
      maxPrice,
      page = 1,
      limit = 20
    } = req.query;

    let query: any = { isActive: true };

    // Type filter
    if (type) query.type = type;
    if (category) query.category = category;

    // Location filters
    if (city) query['location.city'] = new RegExp(city as string, 'i');
    if (state) query['location.state'] = new RegExp(state as string, 'i');
    if (country) query['location.country'] = new RegExp(country as string, 'i');

    // Geospatial query
    if (latitude && longitude) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude as string), parseFloat(latitude as string)]
          },
          $maxDistance: parseFloat(radius as string) * 1000 // convert km to meters
        }
      };
    }

    // Price filters
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice as string);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice as string);
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    const collections = await Collection.find(query)
      .populate('vendor', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit as string));

    const total = await Collection.countDocuments(query);

    res.json({
      collections,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({ error: 'Failed to fetch collections' });
  }
});

// Get collection by ID
router.get('/:id', async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id)
      .populate('vendor', 'name email contactInfo');
    
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    res.json(collection);
  } catch (error) {
    console.error('Error fetching collection:', error);
    res.status(500).json({ error: 'Failed to fetch collection' });
  }
});

// Create new collection (vendor only)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { role } = req.user as any;
    
    if (role !== 'seller' && role !== 'admin') {
      return res.status(403).json({ error: 'Only vendors can create collections' });
    }

    const collectionData = {
      ...req.body,
      vendor: req.user.sub
    };

    const collection = new Collection(collectionData);
    await collection.save();
    
    await collection.populate('vendor', 'name email');
    
    res.status(201).json(collection);
  } catch (error) {
    console.error('Error creating collection:', error);
    res.status(500).json({ error: 'Failed to create collection' });
  }
});

// Update collection (vendor only)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { role, sub: userId } = req.user as any;
    
    const collection = await Collection.findById(req.params.id);
    
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    // Check if user owns this collection or is admin
    if (collection.vendor.toString() !== userId && role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this collection' });
    }

    const updatedCollection = await Collection.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('vendor', 'name email');

    res.json(updatedCollection);
  } catch (error) {
    console.error('Error updating collection:', error);
    res.status(500).json({ error: 'Failed to update collection' });
  }
});

// Delete collection (vendor only)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { role, sub: userId } = req.user as any;
    
    const collection = await Collection.findById(req.params.id);
    
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    // Check if user owns this collection or is admin
    if (collection.vendor.toString() !== userId && role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this collection' });
    }

    await Collection.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Collection deleted successfully' });
  } catch (error) {
    console.error('Error deleting collection:', error);
    res.status(500).json({ error: 'Failed to delete collection' });
  }
});

// Get vendor's collections
router.get('/vendor/mine', requireAuth, async (req, res) => {
  try {
    const { role, sub: userId } = req.user as any;
    
    if (role !== 'seller' && role !== 'admin') {
      return res.status(403).json({ error: 'Only vendors can access this endpoint' });
    }

    const collections = await Collection.find({ vendor: userId })
      .sort({ createdAt: -1 });

    res.json(collections);
  } catch (error) {
    console.error('Error fetching vendor collections:', error);
    res.status(500).json({ error: 'Failed to fetch vendor collections' });
  }
});

export default router;