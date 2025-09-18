"use client";
import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Stack,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Paper,
  IconButton,
  Skeleton
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  LocationOn,
  Hotel,
  Restaurant,
  HomeWork,
  Business,
  Star,
  Visibility,
  VisibilityOff,
  DirectionsCar,
  School,
  ShoppingBag,
  CloudUpload,
  Image as ImageIcon,
  Close
} from '@mui/icons-material';
import NextLink from 'next/link';
import { apiGet, apiPost, apiPut, apiDelete } from '@utils/api';
import { getMainImage, hasRealImages } from '@utils/imageHelpers';

interface Collection {
  _id: string;
  title: string;
  description?: string;
  type: 'hotel' | 'restaurant' | 'real-estate' | 'service' | 'other';
  category?: string;
  images: string[];
  location: {
    coordinates: [number, number];
    address: string;
    city: string;
    state: string;
    country: string;
  };
  price?: number;
  priceType?: string;
  isActive: boolean;
  rating?: number;
  totalRatings?: number;
  createdAt: string;
}

interface CollectionFormData {
  title: string;
  description: string;
  type: 'hotel' | 'restaurant' | 'real-estate' | 'car-rental' | 'education' | 'shopping' | 'service' | 'other';
  category: string;
  images: string[];
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
    coordinates: [number, number];
  };
  price: number | '';
  priceType: string;
  isActive: boolean;
  amenities: string[];
  contactInfo: {
    phone: string;
    email: string;
    website: string;
  };
}

const initialFormData: CollectionFormData = {
  title: '',
  description: '',
  type: 'hotel',
  category: '',
  images: [],
  location: {
    address: '',
    city: '',
    state: '',
    country: '',
    coordinates: [0, 0]
  },
  price: '',
  priceType: 'per-night',
  isActive: true,
  amenities: [],
  contactInfo: {
    phone: '',
    email: '',
    website: ''
  }
};

export default function VendorCollectionsPage() {
  const [collections, setCollections] = useState<Collection[] | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [formData, setFormData] = useState<CollectionFormData>(initialFormData);
  const [amenityInput, setAmenityInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      const data = await apiGet<Collection[]>('/collections/vendor/mine');
      setCollections(data || []);
    } catch (error) {
      console.error('Failed to fetch collections:', error);
      setCollections([]);
    }
  };

  const handleCreateNew = () => {
    setEditingCollection(null);
    setFormData(initialFormData);
    setImageFiles([]);
    setImagePreviews([]);
    setDialogOpen(true);
  };

  const handleEdit = (collection: Collection) => {
    setEditingCollection(collection);
    setFormData({
      title: collection.title,
      description: collection.description || '',
      type: collection.type,
      category: collection.category || '',
      images: collection.images,
      location: collection.location,
      price: collection.price || '',
      priceType: collection.priceType || 'per-night',
      isActive: collection.isActive,
      amenities: [],
      contactInfo: {
        phone: '',
        email: '',
        website: ''
      }
    });
    setImageFiles([]);
    setImagePreviews([]);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      setUploading(true);
      
      // Upload new images if any
      let uploadedImageUrls: string[] = [];
      if (imageFiles.length > 0) {
        try {
          uploadedImageUrls = await uploadImages(imageFiles);
          if (uploadedImageUrls.length === 0 && imageFiles.length > 0) {
            throw new Error('No images were uploaded successfully');
          }
          if (uploadedImageUrls.length < imageFiles.length) {
            const uploadedCount = uploadedImageUrls.length;
            const totalCount = imageFiles.length;
            alert(`Warning: Only ${uploadedCount} out of ${totalCount} images were uploaded successfully. The collection will be saved with the uploaded images.`);
          }
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError);
          const errorMessage = uploadError instanceof Error ? uploadError.message : 'Unknown upload error';
          
          if (errorMessage.includes('cloud name')) {
            alert('Image upload failed: Cloudinary is not properly configured. Please contact support or save without images for now.');
          } else {
            alert(`Image upload failed: ${errorMessage}. You can save without images or try again.`);
          }
          
          const shouldContinue = confirm('Would you like to save the collection without the new images?');
          if (!shouldContinue) {
            return;
          }
          // Continue with existing images only
        }
      }

      const submitData = {
        ...formData,
        images: [...formData.images, ...uploadedImageUrls],
        price: formData.price === '' ? undefined : Number(formData.price)
      };

      if (editingCollection) {
        await apiPut(`/collections/${editingCollection._id}`, submitData);
      } else {
        await apiPost('/collections', submitData);
      }

      setDialogOpen(false);
      setImageFiles([]);
      setImagePreviews([]);
      fetchCollections();
    } catch (error) {
      console.error('Failed to save collection:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to save collection: ${errorMessage}. Please try again.`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this collection?')) {
      try {
        await apiDelete(`/collections/${id}`);
        fetchCollections();
      } catch (error) {
        console.error('Failed to delete collection:', error);
        alert('Failed to delete collection. Please try again.');
      }
    }
  };

  const toggleActive = async (collection: Collection) => {
    try {
      await apiPut(`/collections/${collection._id}`, {
        ...collection,
        isActive: !collection.isActive
      });
      fetchCollections();
    } catch (error) {
      console.error('Failed to update collection:', error);
    }
  };

  const addAmenity = () => {
    if (amenityInput.trim()) {
      setFormData(prev => ({
        ...prev,
        amenities: [...prev.amenities, amenityInput.trim()]
      }));
      setAmenityInput('');
    }
  };

  const removeAmenity = (index: number) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter((_, i) => i !== index)
    }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    
    // Validate files
    const validFiles: File[] = [];
    const errors: string[] = [];
    
    newFiles.forEach(file => {
      // Check file type
      if (!file.type.startsWith('image/')) {
        errors.push(`${file.name}: Only image files are allowed`);
        return;
      }
      
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        errors.push(`${file.name}: File size must be less than 10MB`);
        return;
      }
      
      validFiles.push(file);
    });
    
    // Show errors if any
    if (errors.length > 0) {
      alert(`Upload errors:\n${errors.join('\n')}`);
    }
    
    if (validFiles.length === 0) return;
    
    // Check total image limit
    const currentImageCount = formData.images.length + imageFiles.length;
    if (currentImageCount + validFiles.length > 10) {
      alert(`Cannot upload more than 10 images. Current: ${currentImageCount}, Trying to add: ${validFiles.length}`);
      return;
    }
    
    setImageFiles(prev => [...prev, ...validFiles]);

    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    // Also remove from formData if it's an existing URL
    if (index < formData.images.length) {
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      }));
    }
  };

  const uploadImages = async (files: File[]): Promise<string[]> => {
    try {
      // Convert files to base64
      const base64Images = await Promise.all(
        files.map(file => {
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        })
      );

      // Upload to backend
      const response = await apiPost('/upload/images', {
        images: base64Images,
        folder: 'excom/collections'
      });

      if (response.success) {
        return response.data.map((img: any) => img.secure_url);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      throw error;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'hotel': return <Hotel />;
      case 'restaurant': return <Restaurant />;
      case 'real-estate': return <HomeWork />;
      case 'car-rental': return <DirectionsCar />;
      case 'education': return <School />;
      case 'shopping': return <ShoppingBag />;
      case 'service': return <Business />;
      default: return <Business />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'hotel': return '#2196F3';
      case 'restaurant': return '#FF9800';
      case 'real-estate': return '#4CAF50';
      case 'car-rental': return '#E91E63';
      case 'education': return '#3F51B5';
      case 'shopping': return '#9C27B0';
      case 'service': return '#795548';
      default: return '#757575';
    }
  };

  if (collections === null) {
    return (
      <Container sx={{ py: 4 }}>
        <Grid container spacing={3}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2, mb: 1 }} />
              <Skeleton width="80%" />
              <Skeleton width="60%" />
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  return (
    <Box>
      <Container sx={{ py: 4 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={4}>
          <Box>
            <Typography variant="h4" fontWeight={900} gutterBottom>
              My Collections
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your hotels, restaurants, properties, and services
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateNew}
            sx={{ borderRadius: 2, px: 3 }}
          >
            Add Collection
          </Button>
        </Stack>

        {collections.length === 0 ? (
          <Paper elevation={1} sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
            <Business sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              No collections yet
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={3}>
              Start by creating your first collection to showcase your business
            </Typography>
            <Button variant="contained" startIcon={<Add />} onClick={handleCreateNew}>
              Create Your First Collection
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {collections.map((collection) => {
              const mainImage = getMainImage(collection.images, collection.type, collection._id);
              const isRealImage = hasRealImages(collection.images);
              const typeColor = getTypeColor(collection.type);

              return (
                <Grid item xs={12} sm={6} md={4} key={collection._id}>
                  <Card
                    sx={{
                      borderRadius: 3,
                      overflow: 'hidden',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.3s ease',
                      opacity: collection.isActive ? 1 : 0.6,
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 30px rgba(0,0,0,0.15)'
                      }
                    }}
                  >
                    <Box sx={{ position: 'relative' }}>
                      <CardMedia
                        component="img"
                        height={180}
                        image={mainImage}
                        alt={collection.title}
                      />

                      {/* Status Badge */}
                      <Chip
                        icon={collection.isActive ? <Visibility /> : <VisibilityOff />}
                        label={collection.isActive ? 'Active' : 'Hidden'}
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 12,
                          left: 12,
                          backgroundColor: collection.isActive ? '#4CAF50' : '#757575',
                          color: 'white',
                          fontWeight: 700
                        }}
                      />

                      {/* Type Badge */}
                      <Chip
                        icon={getTypeIcon(collection.type)}
                        label={collection.type.replace('-', ' ').toUpperCase()}
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 12,
                          right: 12,
                          backgroundColor: typeColor,
                          color: 'white',
                          fontWeight: 700,
                          textTransform: 'capitalize'
                        }}
                      />

                      {/* Rating */}
                      {collection.rating && (
                        <Chip
                          icon={<Star sx={{ fontSize: 16 }} />}
                          label={collection.rating.toFixed(1)}
                          size="small"
                          sx={{
                            position: 'absolute',
                            bottom: 12,
                            right: 12,
                            backgroundColor: '#FFD700',
                            color: 'black',
                            fontWeight: 700
                          }}
                        />
                      )}
                    </Box>

                    <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="h6" fontWeight={700} gutterBottom noWrap>
                        {collection.title}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mb: 2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}
                      >
                        {collection.description}
                      </Typography>

                      {/* Location */}
                      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                        <LocationOn sx={{ fontSize: 18, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {collection.location.city}, {collection.location.state}
                        </Typography>
                      </Stack>

                      {/* Price */}
                      {collection.price && (
                        <Typography variant="h6" color="primary" fontWeight={700} mb={2}>
                          ${collection.price}
                          {collection.priceType && collection.priceType !== 'fixed' && (
                            <Typography component="span" variant="body2" color="text.secondary">
                              /{collection.priceType.replace('per-', '')}
                            </Typography>
                          )}
                        </Typography>
                      )}

                      {/* Actions */}
                      <Stack direction="row" spacing={1} mt="auto">
                        <Button
                          size="small"
                          variant="outlined"
                          component={NextLink}
                          href={`/collections/${collection._id}`}
                          sx={{ borderRadius: 2 }}
                        >
                          View
                        </Button>
                        
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(collection)}
                          sx={{ color: 'primary.main' }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>

                        <IconButton
                          size="small"
                          onClick={() => toggleActive(collection)}
                          sx={{ color: collection.isActive ? 'warning.main' : 'success.main' }}
                        >
                          {collection.isActive ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>

                        <IconButton
                          size="small"
                          onClick={() => handleDelete(collection._id)}
                          sx={{ color: 'error.main' }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Container>

      {/* Collection Form Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingCollection ? 'Edit Collection' : 'Create New Collection'}
        </DialogTitle>

        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  label="Type"
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                >
                  <MenuItem value="hotel">Hotel</MenuItem>
                  <MenuItem value="restaurant">Restaurant</MenuItem>
                  <MenuItem value="real-estate">Real Estate</MenuItem>
                  <MenuItem value="car-rental">Car Rental</MenuItem>
                  <MenuItem value="education">Education & Tutoring</MenuItem>
                  <MenuItem value="shopping">Shopping & Lifestyle</MenuItem>
                  <MenuItem value="service">Service</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Category"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  />
                }
                label="Active"
              />
            </Grid>

            {/* Images Upload */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Images
              </Typography>
              
              <Paper
                elevation={1}
                sx={{
                  p: 3,
                  border: '2px dashed',
                  borderColor: 'divider',
                  borderRadius: 2,
                  textAlign: 'center',
                  cursor: 'pointer',
                  '&:hover': {
                    borderColor: 'primary.main',
                    backgroundColor: 'action.hover'
                  }
                }}
                onClick={() => document.getElementById('image-upload')?.click()}
              >
                <input
                  id="image-upload"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
                
                <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                <Typography variant="h6" gutterBottom>
                  Upload Images
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Click to browse or drag and drop images here
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                  Supported formats: JPG, PNG, WebP (Max 10 images)
                </Typography>
              </Paper>

              {/* Image Previews */}
              {(imagePreviews.length > 0 || formData.images.length > 0) && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Images ({formData.images.length + imagePreviews.length})
                  </Typography>
                  <Grid container spacing={1}>
                    {/* Existing images */}
                    {formData.images.map((image, index) => (
                      <Grid item xs={6} sm={4} md={3} key={index}>
                        <Paper
                          elevation={2}
                          sx={{
                            position: 'relative',
                            aspectRatio: '16/9',
                            borderRadius: 2,
                            overflow: 'hidden'
                          }}
                        >
                          <Box
                            component="img"
                            src={image}
                            alt={`Collection image ${index + 1}`}
                            sx={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => removeImage(index)}
                            sx={{
                              position: 'absolute',
                              top: 4,
                              right: 4,
                              backgroundColor: 'rgba(0,0,0,0.5)',
                              color: 'white',
                              '&:hover': {
                                backgroundColor: 'rgba(0,0,0,0.7)'
                              }
                            }}
                          >
                            <Close fontSize="small" />
                          </IconButton>
                        </Paper>
                      </Grid>
                    ))}
                    
                    {/* New image previews */}
                    {imagePreviews.map((preview, index) => (
                      <Grid item xs={6} sm={4} md={3} key={formData.images.length + index}>
                        <Paper
                          elevation={2}
                          sx={{
                            position: 'relative',
                            aspectRatio: '16/9',
                            borderRadius: 2,
                            overflow: 'hidden',
                            border: '2px solid',
                            borderColor: 'primary.main'
                          }}
                        >
                          <Box
                            component="img"
                            src={preview}
                            alt={`New image ${index + 1}`}
                            sx={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => removeImage(formData.images.length + index)}
                            sx={{
                              position: 'absolute',
                              top: 4,
                              right: 4,
                              backgroundColor: 'rgba(0,0,0,0.5)',
                              color: 'white',
                              '&:hover': {
                                backgroundColor: 'rgba(0,0,0,0.7)'
                              }
                            }}
                          >
                            <Close fontSize="small" />
                          </IconButton>
                          <Chip
                            label="NEW"
                            size="small"
                            color="primary"
                            sx={{
                              position: 'absolute',
                              bottom: 4,
                              left: 4,
                              fontSize: '0.7rem',
                              height: 20
                            }}
                          />
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </Grid>

            {/* Location */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Location
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                value={formData.location.address}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  location: { ...prev.location, address: e.target.value }
                }))}
                required
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="City"
                value={formData.location.city}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  location: { ...prev.location, city: e.target.value }
                }))}
                required
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="State"
                value={formData.location.state}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  location: { ...prev.location, state: e.target.value }
                }))}
                required
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Country"
                value={formData.location.country}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  location: { ...prev.location, country: e.target.value }
                }))}
                required
              />
            </Grid>

            {/* Pricing */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value === '' ? '' : Number(e.target.value) }))}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Price Type</InputLabel>
                <Select
                  value={formData.priceType}
                  label="Price Type"
                  onChange={(e) => setFormData(prev => ({ ...prev, priceType: e.target.value }))}
                >
                  <MenuItem value="per-night">Per Night</MenuItem>
                  <MenuItem value="per-hour">Per Hour</MenuItem>
                  <MenuItem value="per-day">Per Day</MenuItem>
                  <MenuItem value="per-month">Per Month</MenuItem>
                  <MenuItem value="fixed">Fixed Price</MenuItem>
                  <MenuItem value="contact">Contact for Price</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Amenities */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Amenities
              </Typography>
              <Stack direction="row" spacing={1} mb={2}>
                <TextField
                  fullWidth
                  label="Add Amenity"
                  value={amenityInput}
                  onChange={(e) => setAmenityInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addAmenity();
                    }
                  }}
                />
                <Button variant="contained" onClick={addAmenity}>
                  Add
                </Button>
              </Stack>
              
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                {formData.amenities.map((amenity, index) => (
                  <Chip
                    key={index}
                    label={amenity}
                    onDelete={() => removeAmenity(index)}
                    variant="outlined"
                  />
                ))}
              </Stack>
            </Grid>

            {/* Contact Info */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Contact Information
              </Typography>
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.contactInfo.phone}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  contactInfo: { ...prev.contactInfo, phone: e.target.value }
                }))}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.contactInfo.email}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  contactInfo: { ...prev.contactInfo, email: e.target.value }
                }))}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Website"
                value={formData.contactInfo.website}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  contactInfo: { ...prev.contactInfo, website: e.target.value }
                }))}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={uploading || !formData.title || !formData.location.address || !formData.location.city}
          >
            {uploading ? 'Uploading...' : (editingCollection ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}