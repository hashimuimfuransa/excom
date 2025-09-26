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

// Get user settings
router.get('/settings', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.sub;
    const user = await User.findById(userId).select('-passwordHash -oauthId');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return user settings with default values if not set
    const settings = {
      profile: {
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        dateOfBirth: user.dateOfBirth || '',
        gender: user.gender || '',
        bio: user.bio || '',
        avatar: user.avatar || ''
      },
      preferences: {
        language: user.preferences?.language || 'en',
        currency: user.preferences?.currency || 'USD',
        timezone: user.preferences?.timezone || 'UTC',
        theme: user.preferences?.theme || 'auto',
        emailMarketing: user.preferences?.emailMarketing || false,
        smsNotifications: user.preferences?.smsNotifications || false,
        pushNotifications: user.preferences?.pushNotifications || true
      },
      privacy: {
        profileVisibility: user.privacy?.profileVisibility || 'public',
        showEmail: user.privacy?.showEmail || false,
        showPhone: user.privacy?.showPhone || false,
        allowDirectMessages: user.privacy?.allowDirectMessages || true,
        dataSharing: user.privacy?.dataSharing || true,
        analyticsTracking: user.privacy?.analyticsTracking || true
      },
      notifications: {
        emailNotifications: user.notifications?.emailNotifications || true,
        orderUpdates: user.notifications?.orderUpdates || true,
        priceAlerts: user.notifications?.priceAlerts || true,
        newProducts: user.notifications?.newProducts || false,
        promotions: user.notifications?.promotions || true,
        securityAlerts: user.notifications?.securityAlerts || true,
        socialUpdates: user.notifications?.socialUpdates || false
      },
      security: {
        twoFactorAuth: user.security?.twoFactorAuth || false,
        loginAlerts: user.security?.loginAlerts || true,
        deviceManagement: user.security?.deviceManagement || true,
        sessionTimeout: user.security?.sessionTimeout || 30
      },
      addresses: user.addresses || []
    };

    res.json({ settings });
  } catch (error) {
    console.error('Error fetching user settings:', error);
    res.status(500).json({ message: 'Failed to fetch settings' });
  }
});

// Update user settings
router.put('/settings', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.sub;
    const { settings } = req.body;

    if (!settings) {
      return res.status(400).json({ message: 'Settings data is required' });
    }

    // Prepare update data
    const updateData: any = {};

    // Update profile information
    if (settings.profile) {
      if (settings.profile.firstName) updateData.firstName = settings.profile.firstName;
      if (settings.profile.lastName) updateData.lastName = settings.profile.lastName;
      if (settings.profile.phone) updateData.phone = settings.profile.phone;
      if (settings.profile.dateOfBirth) updateData.dateOfBirth = settings.profile.dateOfBirth;
      if (settings.profile.gender) updateData.gender = settings.profile.gender;
      if (settings.profile.bio) updateData.bio = settings.profile.bio;
      if (settings.profile.avatar) updateData.avatar = settings.profile.avatar;

      // Update name field
      if (settings.profile.firstName || settings.profile.lastName) {
        const firstName = settings.profile.firstName || '';
        const lastName = settings.profile.lastName || '';
        updateData.name = `${firstName} ${lastName}`.trim();
      }
    }

    // Update preferences
    if (settings.preferences) {
      updateData.preferences = settings.preferences;
    }

    // Update privacy settings
    if (settings.privacy) {
      updateData.privacy = settings.privacy;
    }

    // Update notification settings
    if (settings.notifications) {
      updateData.notifications = settings.notifications;
    }

    // Update security settings
    if (settings.security) {
      updateData.security = settings.security;
    }

    // Update addresses
    if (settings.addresses) {
      updateData.addresses = settings.addresses;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-passwordHash -oauthId');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      message: 'Settings updated successfully',
      settings: {
        profile: {
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          phone: user.phone || '',
          dateOfBirth: user.dateOfBirth || '',
          gender: user.gender || '',
          bio: user.bio || '',
          avatar: user.avatar || ''
        },
        preferences: user.preferences || {},
        privacy: user.privacy || {},
        notifications: user.notifications || {},
        security: user.security || {},
        addresses: user.addresses || []
      }
    });
  } catch (error) {
    console.error('Error updating user settings:', error);
    res.status(500).json({ message: 'Failed to update settings' });
  }
});

// Change password
router.post('/change-password', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.sub;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'All password fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New passwords do not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const bcrypt = require('bcryptjs');
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await User.findByIdAndUpdate(userId, { passwordHash: newPasswordHash });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Failed to change password' });
  }
});

// Delete account
router.delete('/delete-account', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.sub;

    // Delete user and related data
    await User.findByIdAndDelete(userId);

    // Note: In a production environment, you might want to:
    // 1. Soft delete the user (mark as deleted)
    // 2. Delete related data (orders, reviews, etc.)
    // 3. Send confirmation email
    // 4. Implement a grace period for account recovery

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ message: 'Failed to delete account' });
  }
});

export default router;