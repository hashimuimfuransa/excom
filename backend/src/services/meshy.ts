import axios from 'axios';
import { upload3DModelFromUrl } from './cloudinary';

export interface MeshyGenerationRequest {
  image_url: string;
  mode: 'preview' | 'texture' | 'preview+texture';
  style?: 'default' | 'realistic' | 'cartoon' | 'anime';
  art_style?: 'realistic' | 'cartoon' | 'anime';
  negative_prompt?: string;
  seed?: number;
}

export interface MeshyGenerationResponse {
  result: string; // Task ID
  status: 'submitted' | 'processing' | 'completed' | 'failed';
}

export interface MeshyTaskStatus {
  id: string;
  status: 'submitted' | 'processing' | 'completed' | 'failed';
  progress: number;
  file_url?: string;
  thumbnail_url?: string;
  error?: string;
  created_at: string;
  updated_at: string;
}

export interface MeshyGenerationResult {
  taskId: string;
  status: 'submitted' | 'processing' | 'completed' | 'failed';
  progress: number;
  modelUrl?: string;
  thumbnailUrl?: string;
  error?: string;
}

class MeshyService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.MESHY_API_KEY || '';
    this.baseUrl = 'https://api.meshy.ai/v1';
    
    if (!this.apiKey) {
      console.warn('MESHY_API_KEY not found in environment variables');
    }
  }

  /**
   * Generate a 3D model from a 2D image
   */
  async generate3DModel(imageUrl: string, options: Partial<MeshyGenerationRequest> = {}): Promise<MeshyGenerationResult> {
    if (!this.apiKey) {
      throw new Error('Meshy API key not configured');
    }

    try {
      const requestData = {
        image_url: imageUrl,
        mode: 'preview+texture',
        style: 'realistic',
        art_style: 'realistic',
        ...options
      };

      const response = await axios.post<MeshyGenerationResponse>(
        `${this.baseUrl}/image-to-3d`,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        taskId: response.data.result || response.data.task_id || response.data.id,
        status: response.data.status || 'submitted',
        progress: 0
      };
    } catch (error) {
      console.error('Meshy API error:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response status:', error.response?.status);
        console.error('Response data:', error.response?.data);
        console.error('Request URL:', error.config?.url);
        console.error('Request data:', error.config?.data);
        
        // Handle specific error cases
        if (error.response?.status === 402) {
          throw new Error('Meshy API subscription required: Please upgrade your plan at https://www.meshy.ai/settings/subscription');
        }
        
        throw new Error(`Meshy API error: ${error.response?.data?.message || error.message}`);
      }
      throw new Error('Failed to generate 3D model');
    }
  }

  /**
   * Check the status of a 3D model generation task
   */
  async getTaskStatus(taskId: string): Promise<MeshyGenerationResult> {
    if (!this.apiKey) {
      throw new Error('Meshy API key not configured');
    }

    try {
      const response = await axios.get<MeshyTaskStatus>(
        `${this.baseUrl}/image-to-3d/${taskId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      const task = response.data;
      
      return {
        taskId: task.id || task.task_id || taskId,
        status: task.status || 'processing',
        progress: task.progress || 0,
        modelUrl: task.file_url || task.model_url || task.download_url,
        thumbnailUrl: task.thumbnail_url || task.preview_url,
        error: task.error || task.message
      };
    } catch (error) {
      console.error('Meshy API error:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response status:', error.response?.status);
        console.error('Response data:', error.response?.data);
        console.error('Request URL:', error.config?.url);
        throw new Error(`Meshy API error: ${error.response?.data?.message || error.message}`);
      }
      throw new Error('Failed to get task status');
    }
  }

  /**
   * Generate 3D model and upload to Cloudinary
   */
  async generateAndUpload3DModel(imageUrl: string, fileName: string, options: Partial<MeshyGenerationRequest> = {}): Promise<{
    taskId: string;
    status: 'submitted' | 'processing' | 'completed' | 'failed';
    progress: number;
    cloudinaryUrl?: string;
    error?: string;
  }> {
    try {
      // Start generation
      const generationResult = await this.generate3DModel(imageUrl, options);
      
      // If generation is completed immediately (unlikely), upload to Cloudinary
      if (generationResult.status === 'completed' && generationResult.modelUrl) {
        try {
          const cloudinaryResult = await upload3DModelFromUrl(generationResult.modelUrl, fileName);
          return {
            ...generationResult,
            cloudinaryUrl: cloudinaryResult.secure_url
          };
        } catch (uploadError) {
          console.error('Failed to upload to Cloudinary:', uploadError);
          return {
            ...generationResult,
            error: 'Failed to upload to Cloudinary'
          };
        }
      }

      return generationResult;
    } catch (error) {
      console.error('Error in generateAndUpload3DModel:', error);
      return {
        taskId: '',
        status: 'failed',
        progress: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Poll task status until completion and upload to Cloudinary
   */
  async pollTaskAndUpload(taskId: string, fileName: string, maxAttempts: number = 30, intervalMs: number = 10000): Promise<{
    status: 'completed' | 'failed';
    cloudinaryUrl?: string;
    error?: string;
  }> {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const taskStatus = await this.getTaskStatus(taskId);
        
        if (taskStatus.status === 'completed' && taskStatus.modelUrl) {
          // Upload to Cloudinary
          try {
            const cloudinaryResult = await upload3DModelFromUrl(taskStatus.modelUrl, fileName);
            return {
              status: 'completed',
              cloudinaryUrl: cloudinaryResult.secure_url
            };
          } catch (uploadError) {
            console.error('Failed to upload to Cloudinary:', uploadError);
            return {
              status: 'failed',
              error: 'Failed to upload to Cloudinary'
            };
          }
        } else if (taskStatus.status === 'failed') {
          return {
            status: 'failed',
            error: taskStatus.error || 'Generation failed'
          };
        }
        
        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, intervalMs));
        attempts++;
        
      } catch (error) {
        console.error('Error polling task:', error);
        attempts++;
        if (attempts >= maxAttempts) {
          return {
            status: 'failed',
            error: 'Polling timeout'
          };
        }
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }
    }
    
    return {
      status: 'failed',
      error: 'Polling timeout'
    };
  }
}

export default new MeshyService();
