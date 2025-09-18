"use client";
import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Stack,
  Typography,
  Alert,
  Avatar,
  IconButton,
  Card,
  CardContent,
  LinearProgress,
  Chip
} from '@mui/material';
import {
  PhotoCamera,
  Edit,
  Delete,
  Store as StoreIcon,
  Image as ImageIcon
} from '@mui/icons-material';
import { apiPost, apiPut } from '../utils/api';

interface Store {
  _id: string;
  name: string;
  description?: string;
  logo?: string;
  banner?: string;
  approved?: boolean;
  owner?: { _id: string; name: string; email: string; role: string };
  isActive?: boolean;
  category?: string;
  createdAt?: string;
}

interface StoreFormData {
  name: string;
  description: string;
  category: string;
  logo?: string;
  banner?: string;
  isActive: boolean;
}

interface StoreManagementProps {
  open: boolean;
  onClose: () => void;
  store?: Store | null;
  onStoreCreated?: (store: Store) => void;
  onStoreUpdated?: (store: Store) => void;
}

const categories = [
  'Electronics',
  'Fashion',
  'Home & Garden',
  'Sports & Outdoors',
  'Books',
  'Toys & Games',
  'Health & Beauty',
  'Food & Beverages',
  'Arts & Crafts',
  'Automotive',
  'Other'
];

export default function StoreManagement({ 
  open, 
  onClose, 
  store, 
  onStoreCreated, 
  onStoreUpdated 
}: StoreManagementProps) {
  const [formData, setFormData] = useState<StoreFormData>(() => ({
    name: store?.name || '',
    description: store?.description || '',
    category: store?.category || '',
    logo: store?.logo || '',
    banner: store?.banner || '',
    isActive: store?.isActive ?? true
  }));
  
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const isEditMode = !!store;

  const handleInputChange = (field: keyof StoreFormData) => (
    event: React.ChangeEvent<HTMLInputElement | { value: unknown }>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleImageUpload = async (
    file: File, 
    type: 'logo' | 'banner'
  ): Promise<string | null> => {
    try {
      setUploading(true);
      
      // Convert file to base64
      const reader = new FileReader();
      return new Promise((resolve, reject) => {
        reader.onload = async () => {
          try {
            const base64 = reader.result as string;
            const response = await apiPost<{ success: boolean; data: { secure_url: string } }>(
              '/upload/image',
              { 
                image: base64, 
                folder: `stores/${type}s` 
              }
            );
            
            if (response.success) {
              resolve(response.data.secure_url);
            } else {
              reject(new Error('Upload failed'));
            }
          } catch (error) {
            reject(error);
          }
        };
        
        reader.onerror = () => reject(new Error('File read failed'));
        reader.readAsDataURL(file);
      });
    } catch (error) {
      console.error(`${type} upload error:`, error);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'logo' | 'banner'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setMessage('File size must be less than 5MB');
      return;
    }

    const uploadedUrl = await handleImageUpload(file, type);
    if (uploadedUrl) {
      setFormData(prev => ({
        ...prev,
        [type]: uploadedUrl
      }));
      setMessage(`${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully`);
    } else {
      setMessage(`Failed to upload ${type}`);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isEditMode && store) {
        // Update existing store
        const updatedStore = await apiPut<Store>(`/sellers/stores/${store._id}`, {
          name: formData.name,
          description: formData.description,
          category: formData.category,
          logo: formData.logo,
          banner: formData.banner,
          isActive: formData.isActive
        });
        
        onStoreUpdated?.(updatedStore);
        setMessage('Store updated successfully');
      } else {
        // Create new store
        const newStore = await apiPost<Store>('/sellers/stores', {
          name: formData.name,
          description: formData.description,
          category: formData.category,
          logo: formData.logo,
          banner: formData.banner
        });
        
        onStoreCreated?.(newStore);
        setMessage('Store created and submitted for approval');
      }
      
      // Close after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (error: any) {
      setMessage(error?.message || `Failed to ${isEditMode ? 'update' : 'create'} store`);
    } finally {
      setLoading(false);
    }
  };

  const ImageUploadCard = ({ 
    type, 
    imageUrl, 
    onUpload 
  }: { 
    type: 'logo' | 'banner'; 
    imageUrl?: string; 
    onUpload: () => void; 
  }) => (
    <Card 
      sx={{ 
        borderRadius: 2, 
        border: '2px dashed',
        borderColor: imageUrl ? 'primary.main' : 'divider',
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': {
          borderColor: 'primary.main',
          bgcolor: 'action.hover'
        }
      }}
      onClick={onUpload}
    >
      <CardContent sx={{ textAlign: 'center', py: 3 }}>
        {imageUrl ? (
          <Box>
            <Box
              component="img"
              src={imageUrl}
              alt={`Store ${type}`}
              sx={{
                width: '100%',
                height: type === 'banner' ? 100 : 80,
                objectFit: 'cover',
                borderRadius: 1,
                mb: 1
              }}
            />
            <Typography variant="body2" color="text.secondary">
              Click to change {type}
            </Typography>
          </Box>
        ) : (
          <Stack alignItems="center" spacing={1}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <ImageIcon />
            </Avatar>
            <Typography variant="body2" color="text.secondary">
              Upload {type} image
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {type === 'banner' ? 'Recommended: 1200x300px' : 'Recommended: 300x300px'}
            </Typography>
          </Stack>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <StoreIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={600}>
              {isEditMode ? 'Edit Store' : 'Create New Store'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isEditMode ? 'Update your store information' : 'Set up your new store'}
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>
      
      <DialogContent dividers>
        <Stack spacing={3} component="form" onSubmit={handleSubmit}>
          {/* Store Images */}
          <Box>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Store Images
            </Typography>
            <Stack spacing={2}>
              {/* Logo Upload */}
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Store Logo (Optional)
                </Typography>
                <ImageUploadCard
                  type="logo"
                  imageUrl={formData.logo}
                  onUpload={() => logoInputRef.current?.click()}
                />
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => handleFileSelect(e, 'logo')}
                />
              </Box>
              
              {/* Banner Upload */}
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Store Banner (Optional)
                </Typography>
                <ImageUploadCard
                  type="banner"
                  imageUrl={formData.banner}
                  onUpload={() => bannerInputRef.current?.click()}
                />
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => handleFileSelect(e, 'banner')}
                />
              </Box>
            </Stack>
          </Box>

          {/* Store Information */}
          <Box>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Store Information
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="Store Name"
                value={formData.name}
                onChange={handleInputChange('name')}
                required
                fullWidth
                variant="outlined"
              />
              
              <TextField
                label="Store Description"
                value={formData.description}
                onChange={handleInputChange('description')}
                multiline
                rows={3}
                fullWidth
                variant="outlined"
                helperText="Tell customers about your store"
              />
              
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  label="Category"
                  onChange={handleInputChange('category')}
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              {isEditMode && (
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.isActive ? 'active' : 'inactive'}
                    label="Status"
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      isActive: e.target.value === 'active' 
                    }))}
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              )}
            </Stack>
          </Box>

          {uploading && (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Uploading image...
              </Typography>
              <LinearProgress />
            </Box>
          )}
          
          {message && (
            <Alert severity={message.includes('Failed') || message.includes('error') ? 'error' : 'success'}>
              {message}
            </Alert>
          )}
        </Stack>
      </DialogContent>
      
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || uploading || !formData.name.trim()}
          sx={{ borderRadius: 2 }}
        >
          {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Store' : 'Create Store')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}