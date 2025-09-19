import { Router } from 'express';
import User from '../models/User';
import Order from '../models/Order';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { uploadImage } from '../services/cloudinary';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Get current user profile (detailed)
router.get('/profile', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.user!.sub).select('-passwordHash -oauthId');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Split name into firstName and lastName if they don't exist
    if (!user.firstName && !user.lastName && user.name) {
      const nameParts = user.name.split(' ');
      user.firstName = nameParts[0] || '';
      user.lastName = nameParts.slice(1).join(' ') || '';
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

// Update user profile
router.patch('/profile', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.sub;
    const updateData = req.body;

    // Don't allow updating sensitive fields
    delete updateData.email;
    delete updateData.passwordHash;
    delete updateData.role;
    delete updateData._id;
    delete updateData.id;

    // Update the name field if firstName or lastName changed
    if (updateData.firstName || updateData.lastName) {
      const user = await User.findById(userId);
      if (user) {
        const firstName = updateData.firstName || user.firstName || '';
        const lastName = updateData.lastName || user.lastName || '';
        updateData.name = `${firstName} ${lastName}`.trim();
      }
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-passwordHash -oauthId');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// Get user stats (orders, spending, etc.)
router.get('/stats', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.sub;

    // Get order statistics
    const orderStats = await Order.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$total' },
          completedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
          }
        }
      }
    ]);

    const stats = orderStats[0] || {
      totalOrders: 0,
      totalSpent: 0,
      completedOrders: 0
    };

    // Calculate loyalty points (simple: 1 point per $1 spent)
    stats.loyaltyPoints = Math.floor(stats.totalSpent || 0);

    res.json(stats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    // Return empty stats instead of error
    res.json({
      totalOrders: 0,
      totalSpent: 0,
      loyaltyPoints: 0,
      completedOrders: 0
    });
  }
});

// Upload profile avatar (multipart form data)
router.post('/avatar', requireAuth, upload.single('avatar'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const userId = req.user!.sub;
    
    // Convert buffer to base64
    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    
    // Upload to Cloudinary
    const result = await uploadImage(base64Image, 'users/avatars');
    
    // Update user avatar URL
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { avatar: result.secure_url } },
      { new: true }
    ).select('-passwordHash -oauthId');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      message: 'Avatar updated successfully',
      avatar: result.secure_url,
      user 
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    res.status(500).json({ message: 'Failed to upload avatar' });
  }
});

// Upload profile avatar (base64)
router.post('/avatar-base64', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { image } = req.body;
    
    if (!image) {
      return res.status(400).json({ message: 'No image data provided' });
    }

    if (!image.startsWith('data:image/')) {
      return res.status(400).json({ message: 'Invalid image format. Must be base64 encoded.' });
    }

    const userId = req.user!.sub;
    
    // Upload to Cloudinary
    const result = await uploadImage(image, 'users/avatars');
    
    // Update user avatar URL
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { avatar: result.secure_url } },
      { new: true }
    ).select('-passwordHash -oauthId');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      message: 'Avatar updated successfully',
      avatar: result.secure_url,
      user 
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    res.status(500).json({ message: 'Failed to upload avatar' });
  }
});

export default router;