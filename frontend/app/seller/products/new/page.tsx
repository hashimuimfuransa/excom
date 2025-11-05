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
  Select,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  ViewInAr as ArIcon
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
  variants: {
    sizes: string[];
    colors: string[];
    weight: {
      value: number | '';
      unit: 'kg' | 'g' | 'lb' | 'oz';
    };
    dimensions: {
      length: number | '';
      width: number | '';
      height: number | '';
      unit: 'cm' | 'in' | 'm';
    };
    material: string;
    brand: string;
    sku: string;
    inventory: number | '';
  };
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
  { code: 'NGN', name: 'Nigerian Naira (₦)' },
  { code: 'RWF', name: 'Rwandan Franc (FRw)' }
];

export default function NewProduct() {
  const router = useRouter();
  const [form, setForm] = useState<ProductForm>({
    title: '',
    description: '',
    price: '',
    currency: 'RWF',
    category: '',
    images: [],
    variants: {
      sizes: [],
      colors: [],
      weight: {
        value: '',
        unit: 'kg'
      },
      dimensions: {
        length: '',
        width: '',
        height: '',
        unit: 'cm'
      },
      material: '',
      brand: '',
      sku: '',
      inventory: ''
    }
  });
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [generateAR, setGenerateAR] = useState(true);

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
        source: 'local',
        variants: form.variants
      };

      const createdProduct = await apiPost('/products', productData);
      setSuccess(generateAR ? 'Product created successfully! AR generation started automatically.' : 'Product created successfully!');
      
      // Automatically trigger AR generation for new products if enabled
      if (generateAR && createdProduct._id && form.images.length > 0) {
        try {
          const token = localStorage.getItem('excom_token');
          if (token) {
            const arResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ar/${createdProduct._id}/generate-3d`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (arResponse.ok) {
              console.log('AR generation started automatically for product:', createdProduct.title);
            } else {
              const errorText = await arResponse.text();
              console.warn('Failed to start AR generation automatically:', errorText);
              
              // Check if it's a subscription error
              if (arResponse.status === 402) {
                console.warn('AR generation requires Meshy.ai subscription upgrade');
                setSuccess('Product created successfully! Note: AR generation requires Meshy.ai subscription upgrade.');
              }
            }
          }
        } catch (arError) {
          console.error('Error starting automatic AR generation:', arError);
          // Don't show error to user as this is automatic
        }
      }
      
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

                  {/* AR Generation Toggle */}
                  <Card sx={{ bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
                    <CardContent sx={{ py: 2 }}>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <ArIcon color="primary" />
                        <Box flex={1}>
                          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                            Augmented Reality (AR) Generation
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Automatically generate a 3D model from your product images for AR viewing
                          </Typography>
                        </Box>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={generateAR}
                              onChange={(e) => setGenerateAR(e.target.checked)}
                              color="primary"
                            />
                          }
                          label={generateAR ? "Enabled" : "Disabled"}
                        />
                      </Stack>
                    </CardContent>
                  </Card>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Product Variants Section */}
        <Grid container spacing={4} sx={{ mt: 2 }}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Product Variants & Specifications
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Add optional product variants like sizes, colors, and specifications
                </Typography>

                <Grid container spacing={3} sx={{ mt: 2 }}>
                  {/* Sizes */}
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Sizes (Optional)"
                      fullWidth
                      placeholder="Enter sizes separated by commas (e.g., S, M, L, XL)"
                      value={form.variants.sizes.join(', ')}
                      onChange={(e) => {
                        const inputValue = e.target.value;
                        // Update the input value immediately for smooth typing
                        const sizes = inputValue.split(',').map(s => s.trim()).filter(s => s);
                        setForm(prev => ({
                          ...prev,
                          variants: { ...prev.variants, sizes }
                        }));
                      }}
                      onKeyDown={(e) => {
                        // Allow Enter key to add the current text as a size
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const inputValue = e.currentTarget.value;
                          if (inputValue.trim()) {
                            const sizes = inputValue.split(',').map(s => s.trim()).filter(s => s);
                            setForm(prev => ({
                              ...prev,
                              variants: { ...prev.variants, sizes }
                            }));
                          }
                        }
                      }}
                      helperText="For clothing and accessories. Press Enter to add sizes."
                    />
                    {form.variants.sizes.length > 0 && (
                      <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {form.variants.sizes.map((size, index) => (
                          <Chip
                            key={index}
                            label={size}
                            size="small"
                            onDelete={() => {
                              const newSizes = form.variants.sizes.filter((_, i) => i !== index);
                              setForm(prev => ({
                                ...prev,
                                variants: { ...prev.variants, sizes: newSizes }
                              }));
                            }}
                          />
                        ))}
                      </Box>
                    )}
                  </Grid>

                  {/* Colors */}
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Colors (Optional)"
                      fullWidth
                      placeholder="Enter colors separated by commas (e.g., Red, Blue, Green)"
                      value={form.variants.colors.join(', ')}
                      onChange={(e) => {
                        const inputValue = e.target.value;
                        // Update the input value immediately for smooth typing
                        const colors = inputValue.split(',').map(c => c.trim()).filter(c => c);
                        setForm(prev => ({
                          ...prev,
                          variants: { ...prev.variants, colors }
                        }));
                      }}
                      onKeyDown={(e) => {
                        // Allow Enter key to add the current text as a color
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const inputValue = e.currentTarget.value;
                          if (inputValue.trim()) {
                            const colors = inputValue.split(',').map(c => c.trim()).filter(c => c);
                            setForm(prev => ({
                              ...prev,
                              variants: { ...prev.variants, colors }
                            }));
                          }
                        }
                      }}
                      helperText="Available color options. Press Enter to add colors."
                    />
                    {form.variants.colors.length > 0 && (
                      <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {form.variants.colors.map((color, index) => (
                          <Chip
                            key={index}
                            label={color}
                            size="small"
                            onDelete={() => {
                              const newColors = form.variants.colors.filter((_, i) => i !== index);
                              setForm(prev => ({
                                ...prev,
                                variants: { ...prev.variants, colors: newColors }
                              }));
                            }}
                          />
                        ))}
                      </Box>
                    )}
                  </Grid>

                  {/* Weight */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Weight (Optional)
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <TextField
                        label="Weight Value"
                        type="number"
                        value={form.variants.weight.value}
                        onChange={(e) => setForm(prev => ({
                          ...prev,
                          variants: {
                            ...prev.variants,
                            weight: {
                              ...prev.variants.weight,
                              value: e.target.value === '' ? '' : Number(e.target.value)
                            }
                          }
                        }))}
                        sx={{ flex: 1 }}
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                      <FormControl sx={{ minWidth: 80 }}>
                        <InputLabel>Unit</InputLabel>
                        <Select
                          value={form.variants.weight.unit}
                          label="Unit"
                          onChange={(e) => setForm(prev => ({
                            ...prev,
                            variants: {
                              ...prev.variants,
                              weight: {
                                ...prev.variants.weight,
                                unit: e.target.value as 'kg' | 'g' | 'lb' | 'oz'
                              }
                            }
                          }))}
                        >
                          <MenuItem value="kg">kg</MenuItem>
                          <MenuItem value="g">g</MenuItem>
                          <MenuItem value="lb">lb</MenuItem>
                          <MenuItem value="oz">oz</MenuItem>
                        </Select>
                      </FormControl>
                    </Stack>
                  </Grid>

                  {/* Dimensions */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Dimensions (Optional)
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                      <TextField
                        label="Length"
                        type="number"
                        value={form.variants.dimensions.length}
                        onChange={(e) => setForm(prev => ({
                          ...prev,
                          variants: {
                            ...prev.variants,
                            dimensions: {
                              ...prev.variants.dimensions,
                              length: e.target.value === '' ? '' : Number(e.target.value)
                            }
                          }
                        }))}
                        sx={{ flex: 1 }}
                        inputProps={{ min: 0, step: 0.1 }}
                      />
                      <TextField
                        label="Width"
                        type="number"
                        value={form.variants.dimensions.width}
                        onChange={(e) => setForm(prev => ({
                          ...prev,
                          variants: {
                            ...prev.variants,
                            dimensions: {
                              ...prev.variants.dimensions,
                              width: e.target.value === '' ? '' : Number(e.target.value)
                            }
                          }
                        }))}
                        sx={{ flex: 1 }}
                        inputProps={{ min: 0, step: 0.1 }}
                      />
                      <TextField
                        label="Height"
                        type="number"
                        value={form.variants.dimensions.height}
                        onChange={(e) => setForm(prev => ({
                          ...prev,
                          variants: {
                            ...prev.variants,
                            dimensions: {
                              ...prev.variants.dimensions,
                              height: e.target.value === '' ? '' : Number(e.target.value)
                            }
                          }
                        }))}
                        sx={{ flex: 1 }}
                        inputProps={{ min: 0, step: 0.1 }}
                      />
                    </Stack>
                    <FormControl sx={{ minWidth: 100 }}>
                      <InputLabel>Unit</InputLabel>
                      <Select
                        value={form.variants.dimensions.unit}
                        label="Unit"
                        onChange={(e) => setForm(prev => ({
                          ...prev,
                          variants: {
                            ...prev.variants,
                            dimensions: {
                              ...prev.variants.dimensions,
                              unit: e.target.value as 'cm' | 'in' | 'm'
                            }
                          }
                        }))}
                      >
                        <MenuItem value="cm">cm</MenuItem>
                        <MenuItem value="in">in</MenuItem>
                        <MenuItem value="m">m</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Additional Info */}
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Brand (Optional)"
                      value={form.variants.brand}
                      onChange={(e) => setForm(prev => ({
                        ...prev,
                        variants: { ...prev.variants, brand: e.target.value }
                      }))}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Material (Optional)"
                      value={form.variants.material}
                      onChange={(e) => setForm(prev => ({
                        ...prev,
                        variants: { ...prev.variants, material: e.target.value }
                      }))}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="SKU (Optional)"
                      value={form.variants.sku}
                      onChange={(e) => setForm(prev => ({
                        ...prev,
                        variants: { ...prev.variants, sku: e.target.value }
                      }))}
                      fullWidth
                      helperText="Stock Keeping Unit"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Inventory Quantity (Optional)"
                      type="number"
                      value={form.variants.inventory}
                      onChange={(e) => setForm(prev => ({
                        ...prev,
                        variants: {
                          ...prev.variants,
                          inventory: e.target.value === '' ? '' : Number(e.target.value)
                        }
                      }))}
                      fullWidth
                      inputProps={{ min: 0 }}
                      helperText="Available quantity"
                    />
                  </Grid>
                </Grid>
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