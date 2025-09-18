import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { uploadImage, uploadMultipleImages } from '../services/cloudinary';

const router = Router();

// Upload single image (base64)
router.post('/image', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { image, folder = 'excom' } = req.body;

    if (!image) {
      return res.status(400).json({ message: 'Image data is required' });
    }

    // Check if image is base64 encoded
    if (!image.startsWith('data:image/')) {
      return res.status(400).json({ message: 'Invalid image format. Must be base64 encoded.' });
    }

    const result = await uploadImage(image, folder);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to upload image',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Upload multiple images (base64 array)
router.post('/images', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { images, folder = 'excom' } = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ message: 'Images array is required' });
    }

    // Validate all images are base64 encoded
    for (const image of images) {
      if (!image.startsWith('data:image/')) {
        return res.status(400).json({ message: 'All images must be base64 encoded.' });
      }
    }

    const results = await uploadMultipleImages(images, folder);
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Multiple upload error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to upload images',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;