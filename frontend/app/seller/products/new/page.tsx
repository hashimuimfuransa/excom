'use client';

import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  Stack,
  Alert,
  CircularProgress,
  Paper,
  IconButton,
  Chip,
  MenuItem,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiPost } from '../../../../utils/api';

interface ProductForm {
  title: string;
  description: string;
  price: number | '';
  currency: string;
  category: string;
  images: string[];
}

const categories = [
  'Electronics',
  'Clothing & Fashion',
  'Home & Garden',
  'Books & Media',
  'Sports & Outdoors',
  'Health & Beauty',
  'Toys & Games',
  'Automotive',
  'Art & Crafts',
  'Food & Beverages',
  'Office Supplies',
  'Pet Supplies',
  'Jewelry & Accessories',
  'Musical Instruments',
  'Other'
];

const currencies = [
  { code: 'USD', name: 'US Dollar ($)' },
  { code: 'EUR', name: 'Euro (€)' },
  { code: 'GBP', name: 'British Pound (£)' },
  { code: 'JPY', name: 'Japanese Yen (¥)' },
  { code: 'CAD', name: 'Canadian Dollar (C$)' },
  { code: 'AUD', name: 'Australian Dollar (A$)' },
  { code: 'NGN', name: 'Nigerian Naira (₦)' }
];

export default function NewProduct() {
  const router = useRouter();
  const [form, setForm] = useState<ProductForm>({
    title: '',
    description: '',
    price: '',
    currency: 'USD',
    category: '',
    images: []
  });
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (field: keyof ProductForm) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    const value = event.target.value;
    setForm(prev => ({
      ...prev,
      [field]: field === 'price' ? (value === '' ? '' : parseFloat(value) || 0) : value
    }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    setError('');

    try {
      const uploadPromises = Array.from(files).map(file => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      const base64Images = await Promise.all(uploadPromises);
      
      // Upload to Cloudinary
      const response = await apiPost('/upload/images', {
        images: base64Images,
        folder: 'excom/products'
      });

      if (response.success) {
        const imageUrls = response.data.map((img: any) => img.secure_url);
        setForm(prev => ({
          ...prev,
          images: [...prev.images, ...imageUrls]
        }));
        setSuccess(`${imageUrls.length} image(s) uploaded successfully`);
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload images. Please try again.');
    } finally {
      setUploadingImages(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!form.title.trim() || !form.description.trim() || !form.price || form.images.length === 0 || !form.category) {
      setError('Please fill in all required fields, select a category, and add at least one image');
      return;
    }

    if (form.price <= 0) {
      setError('Price must be greater than zero');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const productData = {
        title: form.title.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        currency: form.currency,
        category: form.category,
        images: form.images,
        source: 'local'
      };

      await apiPost('/products', productData);
      setSuccess('Product created successfully!');
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/seller/products');
      }, 2000);
    } catch (err) {
      console.error('Create product error:', err);
      setError('Failed to create product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container sx={{ py: 4 }}>
      <Box mb={4}>
        <Button
          startIcon={<ArrowBackIcon />}
          component={Link}
          href="/seller/products"
          sx={{ mb: 2 }}
        >
          Back to Products
        </Button>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Add New Product
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Create a new product listing for your store
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={4}>
          {/* Product Images */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Product Images *
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Upload high-quality images of your product. First image will be the main display image.
                </Typography>

                <Box mb={3}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={uploadingImages ? <CircularProgress size={20} /> : <CloudUploadIcon />}
                    disabled={uploadingImages}
                    fullWidth
                    sx={{ py: 2 }}
                  >
                    {uploadingImages ? 'Uploading...' : 'Upload Images'}
                    <input
                      type="file"
                      hidden
                      multiple
                      accept="image/*"
                      onChange={handleFileUpload}
                    />
                  </Button>
                </Box>

                {form.images.length > 0 && (
                  <Grid container spacing={2}>
                    {form.images.map((image, index) => (
                      <Grid item xs={6} sm={4} key={index}>
                        <Paper
                          sx={{
                            position: 'relative',
                            paddingTop: '100%',
                            overflow: 'hidden'
                          }}
                        >
                          <Box
                            component="img"
                            src={image}
                            alt={`Product ${index + 1}`}
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveImage(index)}
                            sx={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              bgcolor: 'rgba(255, 255, 255, 0.8)',
                              '&:hover': {
                                bgcolor: 'rgba(255, 255, 255, 0.9)'
                              }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                          {index === 0 && (
                            <Chip
                              label="Main"
                              size="small"
                              color="primary"
                              sx={{
                                position: 'absolute',
                                bottom: 8,
                                left: 8
                              }}
                            />
                          )}
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Product Details */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Product Details
                </Typography>

                <Stack spacing={3}>
                  <TextField
                    label="Product Title"
                    fullWidth
                    required
                    value={form.title}
                    onChange={handleInputChange('title')}
                    placeholder="Enter a clear, descriptive title"
                  />

                  <TextField
                    label="Description"
                    fullWidth
                    required
                    multiline
                    minRows={4}
                    value={form.description}
                    onChange={handleInputChange('description')}
                    placeholder="Describe your product in detail..."
                  />

                  <Grid container spacing={2}>
                    <Grid item xs={8}>
                      <TextField
                        label="Price"
                        type="number"
                        fullWidth
                        required
                        value={form.price}
                        onChange={handleInputChange('price')}
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <FormControl fullWidth>
                        <InputLabel>Currency</InputLabel>
                        <Select
                          value={form.currency}
                          label="Currency"
                          onChange={handleInputChange('currency')}
                        >
                          {currencies.map((currency) => (
                            <MenuItem key={currency.code} value={currency.code}>
                              {currency.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>

                  <FormControl fullWidth required>
                    <InputLabel>Category *</InputLabel>
                    <Select
                      value={form.category}
                      label="Category *"
                      onChange={handleInputChange('category')}
                    >
                      {categories.map((category) => (
                        <MenuItem key={category} value={category}>
                          {category}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Action Buttons */}
        <Box mt={4}>
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              component={Link}
              href="/seller/products"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
              disabled={loading || uploadingImages}
              size="large"
            >
              {loading ? 'Creating...' : 'Create Product'}
            </Button>
          </Stack>
        </Box>
      </form>
    </Container>
  );
}