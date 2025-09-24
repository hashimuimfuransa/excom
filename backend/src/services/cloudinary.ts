import { v2 as cloudinary } from 'cloudinary';
import { UploadApiResponse } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface CloudinaryUploadResult {
  public_id: string;
  url: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
}

/**
 * Upload an image to Cloudinary from base64 string
 */
export const uploadImage = async (base64Image: string, folder = 'excom'): Promise<CloudinaryUploadResult> => {
  try {
    const result: UploadApiResponse = await cloudinary.uploader.upload(base64Image, {
      folder,
      resource_type: 'image',
      transformation: [
        { quality: 'auto' },
        { fetch_format: 'auto' },
        { width: 1200, height: 1200, crop: 'limit' }
      ]
    });

    return {
      public_id: result.public_id,
      url: result.url,
      secure_url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
};

/**
 * Upload multiple images to Cloudinary
 */
export const uploadMultipleImages = async (images: string[], folder = 'excom'): Promise<CloudinaryUploadResult[]> => {
  try {
    const uploadPromises = images.map(image => uploadImage(image, folder));
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Cloudinary multiple upload error:', error);
    throw new Error('Failed to upload images to Cloudinary');
  }
};

/**
 * Delete an image from Cloudinary
 */
export const deleteImage = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error('Failed to delete image from Cloudinary');
  }
};

/**
 * Upload a 3D model file to Cloudinary
 */
export const upload3DModel = async (fileBuffer: Buffer, fileName: string, folder = 'excom/3d-models'): Promise<CloudinaryUploadResult> => {
  try {
    // Determine resource type based on file extension
    const extension = fileName.toLowerCase().split('.').pop();
    let resourceType: 'raw' | 'video' = 'raw';
    
    if (['gltf', 'glb', 'usdz'].includes(extension || '')) {
      resourceType = 'raw';
    }

    const result: UploadApiResponse = await cloudinary.uploader.upload(
      `data:application/octet-stream;base64,${fileBuffer.toString('base64')}`,
      {
        folder,
        resource_type: resourceType,
        public_id: fileName.split('.')[0], // Remove extension from public_id
        use_filename: true,
        unique_filename: true
      }
    );

    return {
      public_id: result.public_id,
      url: result.url,
      secure_url: result.secure_url,
      width: result.width || 0,
      height: result.height || 0,
      format: result.format || extension || 'unknown'
    };
  } catch (error) {
    console.error('Cloudinary 3D model upload error:', error);
    throw new Error('Failed to upload 3D model to Cloudinary');
  }
};

/**
 * Upload a 3D model from URL to Cloudinary
 */
export const upload3DModelFromUrl = async (url: string, fileName: string, folder = 'excom/3d-models'): Promise<CloudinaryUploadResult> => {
  try {
    const result: UploadApiResponse = await cloudinary.uploader.upload(url, {
      folder,
      resource_type: 'raw',
      public_id: fileName.split('.')[0],
      use_filename: true,
      unique_filename: true
    });

    return {
      public_id: result.public_id,
      url: result.url,
      secure_url: result.secure_url,
      width: result.width || 0,
      height: result.height || 0,
      format: result.format || 'unknown'
    };
  } catch (error) {
    console.error('Cloudinary 3D model upload from URL error:', error);
    throw new Error('Failed to upload 3D model from URL to Cloudinary');
  }
};

/**
 * Delete a 3D model from Cloudinary
 */
export const delete3DModel = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
  } catch (error) {
    console.error('Cloudinary 3D model delete error:', error);
    throw new Error('Failed to delete 3D model from Cloudinary');
  }
};

export default cloudinary;