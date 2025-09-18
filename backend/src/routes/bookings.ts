import express from 'express';
import Booking from '../models/Booking';
import Collection from '../models/Collection';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

// Create new booking
router.post('/', requireAuth, async (req, res) => {
  try {
    const { sub: userId } = req.user as any;
    const {
      collectionId,
      checkIn,
      checkOut,
      guests,
      roomType,
      specialRequests,
      customerInfo
    } = req.body;

    // Find the collection
    const collection = await Collection.findById(collectionId);
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    // Calculate total amount based on collection type
    let totalAmount = collection.price || 0;
    
    if (collection.type === 'hotel' && roomType && collection.roomTypes) {
      const room = collection.roomTypes.find(r => r.name === roomType);
      if (room) {
        totalAmount = room.price;
        
        // Calculate nights if dates provided
        if (checkIn && checkOut) {
          const nights = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));
          totalAmount *= nights;
        }
      }
    }

    const booking = new Booking({
      collection: collectionId,
      customer: userId,
      vendor: collection.vendor,
      checkIn: checkIn ? new Date(checkIn) : undefined,
      checkOut: checkOut ? new Date(checkOut) : undefined,
      guests,
      roomType,
      totalAmount,
      specialRequests,
      customerInfo
    });

    await booking.save();
    
    await booking.populate([
      { path: 'collection', select: 'title type location images' },
      { path: 'customer', select: 'name email' },
      { path: 'vendor', select: 'name email' }
    ]);

    res.status(201).json(booking);
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// Get user's bookings (as customer)
router.get('/my-bookings', requireAuth, async (req, res) => {
  try {
    const { sub: userId } = req.user as any;
    
    const bookings = await Booking.find({ customer: userId })
      .populate([
        { path: 'collection', select: 'title type location images vendor' },
        { path: 'vendor', select: 'name email' }
      ])
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Get vendor's received bookings
router.get('/vendor/received', requireAuth, async (req, res) => {
  try {
    const { role, sub: userId } = req.user as any;
    
    if (role !== 'seller' && role !== 'admin') {
      return res.status(403).json({ error: 'Only vendors can access this endpoint' });
    }

    const bookings = await Booking.find({ vendor: userId })
      .populate([
        { path: 'collection', select: 'title type location images' },
        { path: 'customer', select: 'name email' }
      ])
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    console.error('Error fetching vendor bookings:', error);
    res.status(500).json({ error: 'Failed to fetch vendor bookings' });
  }
});

// Update booking status (vendor only)
router.patch('/:id/status', requireAuth, async (req, res) => {
  try {
    const { role, sub: userId } = req.user as any;
    const { vendorResponse, status, vendorNotes } = req.body;
    
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if user is the vendor for this booking or admin
    if (booking.vendor.toString() !== userId && role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this booking' });
    }

    const updates: any = {};
    if (vendorResponse) updates.vendorResponse = vendorResponse;
    if (status) updates.status = status;
    if (vendorNotes) updates.vendorNotes = vendorNotes;

    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    ).populate([
      { path: 'collection', select: 'title type location images' },
      { path: 'customer', select: 'name email' },
      { path: 'vendor', select: 'name email' }
    ]);

    res.json(updatedBooking);
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ error: 'Failed to update booking status' });
  }
});

// Cancel booking (customer or vendor)
router.patch('/:id/cancel', requireAuth, async (req, res) => {
  try {
    const { sub: userId } = req.user as any;
    
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if user is customer or vendor for this booking
    if (booking.customer.toString() !== userId && booking.vendor.toString() !== userId) {
      return res.status(403).json({ error: 'Not authorized to cancel this booking' });
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' },
      { new: true }
    ).populate([
      { path: 'collection', select: 'title type location images' },
      { path: 'customer', select: 'name email' },
      { path: 'vendor', select: 'name email' }
    ]);

    res.json(updatedBooking);
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

// Get booking details
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { sub: userId } = req.user as any;
    
    const booking = await Booking.findById(req.params.id)
      .populate([
        { path: 'collection', select: 'title type location images vendor' },
        { path: 'customer', select: 'name email' },
        { path: 'vendor', select: 'name email' }
      ]);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if user is customer or vendor for this booking
    if (booking.customer._id.toString() !== userId && booking.vendor._id.toString() !== userId) {
      return res.status(403).json({ error: 'Not authorized to view this booking' });
    }

    res.json(booking);
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
});

// Process cart bookings (create multiple bookings from cart)
router.post('/process-cart', requireAuth, async (req, res) => {
  try {
    const { sub: userId } = req.user as any;
    const { bookings } = req.body;

    if (!Array.isArray(bookings) || bookings.length === 0) {
      return res.status(400).json({ error: 'No bookings provided' });
    }

    const createdBookings = [];
    const errors = [];

    for (const bookingData of bookings) {
      try {
        const { collectionId, checkIn, checkOut, guests, roomType, specialRequests, customerInfo, totalAmount } = bookingData;

        // Find the collection
        const collection = await Collection.findById(collectionId);
        if (!collection) {
          errors.push({ collectionId, error: 'Collection not found' });
          continue;
        }

        // Create booking
        const booking = new Booking({
          collection: collectionId,
          customer: userId,
          vendor: collection.vendor,
          checkIn: checkIn ? new Date(checkIn) : undefined,
          checkOut: checkOut ? new Date(checkOut) : undefined,
          guests,
          roomType,
          totalAmount,
          specialRequests,
          customerInfo
        });

        await booking.save();
        
        await booking.populate([
          { path: 'collection', select: 'title type location images' },
          { path: 'customer', select: 'name email' },
          { path: 'vendor', select: 'name email' }
        ]);

        createdBookings.push(booking);
      } catch (error) {
        console.error('Error creating individual booking:', error);
        errors.push({ collectionId: bookingData.collectionId, error: error.message });
      }
    }

    res.status(201).json({ 
      bookings: createdBookings, 
      errors: errors.length > 0 ? errors : undefined,
      success: createdBookings.length,
      failed: errors.length
    });
  } catch (error) {
    console.error('Error processing cart bookings:', error);
    res.status(500).json({ error: 'Failed to process cart bookings' });
  }
});

export default router;