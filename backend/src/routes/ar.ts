import { Router } from 'express';
import Product from '../models/Product';
import { requireAuth, AuthRequest } from '../middleware/auth';
import meshyService from '../services/meshy';
import { upload3DModel, delete3DModel } from '../services/cloudinary';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'model/gltf-binary', 'model/gltf+json', 'application/octet-stream'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gltf', '.glb', '.usdz'];
    
    const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    
    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, GLTF, GLB, and USDZ files are allowed.'));
    }
  }
});

// Generate 3D model from product image
router.post('/:id/generate-3d', requireAuth, async (req: AuthRequest, res) => {
  const role = req.user!.role;
  if (!['seller', 'admin'].includes(role)) {
    return res.status(403).json({ message: 'Seller or admin role required' });
  }

  const productId = req.params.id;
  const sellerId = req.user!.sub;

  try {
    // Find the product and check ownership
    const product = await Product.findOne({ _id: productId, seller: sellerId });
    if (!product) {
      return res.status(404).json({ message: 'Product not found or does not belong to you' });
    }

    // Check if product already has a 3D model
    if (product.modelStatus === 'ready') {
      return res.status(400).json({ message: 'Product already has a 3D model' });
    }

    // Check if generation is already in progress
    if (product.modelStatus === 'generating') {
      return res.status(400).json({ message: '3D model generation is already in progress' });
    }

    // Ensure product has at least one image
    if (!product.images || product.images.length === 0) {
      return res.status(400).json({ message: 'Product must have at least one image to generate 3D model' });
    }

    // Update product status to generating
    await Product.findByIdAndUpdate(productId, {
      modelStatus: 'generating',
      modelGenerationId: uuidv4()
    });

    // Start 3D model generation
    const fileName = `${product.title.replace(/[^a-zA-Z0-9]/g, '_')}_${productId}.glb`;
    const generationResult = await meshyService.generateAndUpload3DModel(
      product.images[0], // Use first image
      fileName,
      {
        mode: 'preview+texture',
        style: 'realistic'
      }
    );

    if (generationResult.status === 'failed') {
      // Update product status to failed
      await Product.findByIdAndUpdate(productId, {
        modelStatus: 'failed',
        modelGenerationId: generationResult.taskId
      });
      
      return res.status(500).json({ 
        message: 'Failed to generate 3D model',
        error: generationResult.error 
      });
    }

    // Update product with task ID
    await Product.findByIdAndUpdate(productId, {
      modelGenerationId: generationResult.taskId
    });

    res.json({
      message: '3D model generation started',
      taskId: generationResult.taskId,
      status: generationResult.status,
      progress: generationResult.progress
    });

  } catch (error) {
    console.error('Error generating 3D model:', error);
    
    // Update product status to failed
    await Product.findByIdAndUpdate(productId, {
      modelStatus: 'failed'
    });
    
    res.status(500).json({ 
      message: 'Failed to generate 3D model',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Check 3D model generation status
router.get('/:id/3d-status', requireAuth, async (req: AuthRequest, res) => {
  const role = req.user!.role;
  if (!['seller', 'admin'].includes(role)) {
    return res.status(403).json({ message: 'Seller or admin role required' });
  }

  const productId = req.params.id;
  const sellerId = req.user!.sub;

  try {
    const product = await Product.findOne({ _id: productId, seller: sellerId });
    if (!product) {
      return res.status(404).json({ message: 'Product not found or does not belong to you' });
    }

    if (!product.modelGenerationId) {
      return res.json({
        status: product.modelStatus,
        progress: 0,
        message: 'No generation task found'
      });
    }

    // Check status with Meshy
    const taskStatus = await meshyService.getTaskStatus(product.modelGenerationId);
    
    // If generation is completed, upload to Cloudinary and update product
    if (taskStatus.status === 'completed' && taskStatus.modelUrl) {
      try {
        const fileName = `${product.title.replace(/[^a-zA-Z0-9]/g, '_')}_${productId}.glb`;
        const cloudinaryResult = await meshyService.pollTaskAndUpload(
          product.modelGenerationId!,
          fileName,
          1, // Only one attempt since we know it's completed
          1000
        );

        if (cloudinaryResult.status === 'completed' && cloudinaryResult.cloudinaryUrl) {
          // Update product with 3D model info
          await Product.findByIdAndUpdate(productId, {
            modelUrl: cloudinaryResult.cloudinaryUrl,
            modelType: 'glb',
            modelStatus: 'ready',
            modelGeneratedAt: new Date()
          });

          return res.json({
            status: 'ready',
            progress: 100,
            modelUrl: cloudinaryResult.cloudinaryUrl,
            message: '3D model generation completed'
          });
        }
      } catch (uploadError) {
        console.error('Failed to upload completed model:', uploadError);
        await Product.findByIdAndUpdate(productId, {
          modelStatus: 'failed'
        });
      }
    }

    // If generation failed
    if (taskStatus.status === 'failed') {
      await Product.findByIdAndUpdate(productId, {
        modelStatus: 'failed'
      });
    }

    res.json({
      status: taskStatus.status,
      progress: taskStatus.progress,
      error: taskStatus.error,
      message: taskStatus.status === 'processing' ? 'Generation in progress...' : 
               taskStatus.status === 'failed' ? 'Generation failed' : 'Generation completed'
    });

  } catch (error) {
    console.error('Error checking 3D model status:', error);
    res.status(500).json({ 
      message: 'Failed to check 3D model status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Upload custom 3D model
router.post('/:id/upload-3d', requireAuth, upload.single('model'), async (req: AuthRequest, res) => {
  const role = req.user!.role;
  if (!['seller', 'admin'].includes(role)) {
    return res.status(403).json({ message: 'Seller or admin role required' });
  }

  const productId = req.params.id;
  const sellerId = req.user!.sub;

  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Find the product and check ownership
    const product = await Product.findOne({ _id: productId, seller: sellerId });
    if (!product) {
      return res.status(404).json({ message: 'Product not found or does not belong to you' });
    }

    // Determine file type
    const fileName = req.file.originalname;
    const fileExtension = fileName.toLowerCase().split('.').pop();
    let modelType: 'gltf' | 'glb' | 'usdz';

    switch (fileExtension) {
      case 'gltf':
        modelType = 'gltf';
        break;
      case 'glb':
        modelType = 'glb';
        break;
      case 'usdz':
        modelType = 'usdz';
        break;
      default:
        return res.status(400).json({ message: 'Unsupported file type. Only GLTF, GLB, and USDZ files are allowed.' });
    }

    // Upload to Cloudinary
    const cloudinaryResult = await upload3DModel(req.file.buffer, fileName);

    // Update product with 3D model info
    const updatedProduct = await Product.findByIdAndUpdate(productId, {
      modelUrl: cloudinaryResult.secure_url,
      modelType: modelType,
      modelStatus: 'ready',
      modelGeneratedAt: new Date(),
      modelGenerationId: undefined // Clear any previous generation ID
    }, { new: true });

    res.json({
      message: '3D model uploaded successfully',
      modelUrl: cloudinaryResult.secure_url,
      modelType: modelType,
      status: 'ready'
    });

  } catch (error) {
    console.error('Error uploading 3D model:', error);
    res.status(500).json({ 
      message: 'Failed to upload 3D model',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete 3D model
router.delete('/:id/3d-model', requireAuth, async (req: AuthRequest, res) => {
  const role = req.user!.role;
  if (!['seller', 'admin'].includes(role)) {
    return res.status(403).json({ message: 'Seller or admin role required' });
  }

  const productId = req.params.id;
  const sellerId = req.user!.sub;

  try {
    const product = await Product.findOne({ _id: productId, seller: sellerId });
    if (!product) {
      return res.status(404).json({ message: 'Product not found or does not belong to you' });
    }

    if (!product.modelUrl) {
      return res.status(400).json({ message: 'No 3D model found for this product' });
    }

    // Extract public ID from Cloudinary URL
    const urlParts = product.modelUrl.split('/');
    const publicId = urlParts[urlParts.length - 1].split('.')[0];
    const folder = 'excom/3d-models';

    // Delete from Cloudinary
    try {
      await delete3DModel(`${folder}/${publicId}`);
    } catch (deleteError) {
      console.error('Failed to delete from Cloudinary:', deleteError);
      // Continue with database update even if Cloudinary deletion fails
    }

    // Update product to remove 3D model info
    await Product.findByIdAndUpdate(productId, {
      modelUrl: undefined,
      modelType: undefined,
      modelStatus: 'none',
      modelGeneratedAt: undefined,
      modelGenerationId: undefined
    });

    res.json({ message: '3D model deleted successfully' });

  } catch (error) {
    console.error('Error deleting 3D model:', error);
    res.status(500).json({ 
      message: 'Failed to delete 3D model',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Regenerate 3D model (delete existing and generate new one)
router.post('/:id/regenerate-3d', requireAuth, async (req: AuthRequest, res) => {
  const role = req.user!.role;
  if (!['seller', 'admin'].includes(role)) {
    return res.status(403).json({ message: 'Seller or admin role required' });
  }

  const productId = req.params.id;
  const sellerId = req.user!.sub;

  try {
    const product = await Product.findOne({ _id: productId, seller: sellerId });
    if (!product) {
      return res.status(404).json({ message: 'Product not found or does not belong to you' });
    }

    // Delete existing 3D model if it exists
    if (product.modelUrl) {
      try {
        const urlParts = product.modelUrl.split('/');
        const publicId = urlParts[urlParts.length - 1].split('.')[0];
        const folder = 'excom/3d-models';
        await delete3DModel(`${folder}/${publicId}`);
      } catch (deleteError) {
        console.error('Failed to delete existing model:', deleteError);
      }
    }

    // Reset product 3D model fields
    await Product.findByIdAndUpdate(productId, {
      modelUrl: undefined,
      modelType: undefined,
      modelStatus: 'generating',
      modelGeneratedAt: undefined,
      modelGenerationId: uuidv4()
    });

    // Start new generation
    const fileName = `${product.title.replace(/[^a-zA-Z0-9]/g, '_')}_${productId}_regenerated.glb`;
    const generationResult = await meshyService.generateAndUpload3DModel(
      product.images[0],
      fileName,
      {
        mode: 'preview+texture',
        style: 'realistic'
      }
    );

    if (generationResult.status === 'failed') {
      await Product.findByIdAndUpdate(productId, {
        modelStatus: 'failed',
        modelGenerationId: generationResult.taskId
      });
      
      return res.status(500).json({ 
        message: 'Failed to regenerate 3D model',
        error: generationResult.error 
      });
    }

    await Product.findByIdAndUpdate(productId, {
      modelGenerationId: generationResult.taskId
    });

    res.json({
      message: '3D model regeneration started',
      taskId: generationResult.taskId,
      status: generationResult.status,
      progress: generationResult.progress
    });

  } catch (error) {
    console.error('Error regenerating 3D model:', error);
    
    await Product.findByIdAndUpdate(productId, {
      modelStatus: 'failed'
    });
    
    res.status(500).json({ 
      message: 'Failed to regenerate 3D model',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
