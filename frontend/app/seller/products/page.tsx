'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Avatar,
  Stack
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  GridView as GridViewIcon,
  TableRows as TableViewIcon
} from '@mui/icons-material';
import Link from 'next/link';
import { apiGet, apiDelete } from '../../../utils/api';
import { getMainImage, hasRealImages } from '../../../utils/imageHelpers';

interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  category?: string;
  source?: string;
  createdAt: string;
  updatedAt: string;
}

export default function SellerProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const productsData = await apiGet('/products/mine/list');
      setProducts(productsData);
    } catch (err) {
      setError('Failed to load products');
      console.error('Products error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await apiDelete(`/products/${productId}`);
      setProducts(prev => prev.filter(p => p._id !== productId));
    } catch (err) {
      setError('Failed to delete product');
      console.error('Delete product error:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Container sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container sx={{ py: 4 }}>
      <Box mb={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              My Products
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage and track all your products
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Box>
              <IconButton
                onClick={() => setViewMode('grid')}
                color={viewMode === 'grid' ? 'primary' : 'default'}
              >
                <GridViewIcon />
              </IconButton>
              <IconButton
                onClick={() => setViewMode('table')}
                color={viewMode === 'table' ? 'primary' : 'default'}
              >
                <TableViewIcon />
              </IconButton>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              component={Link}
              href="/seller/products/new"
            >
              Add Product
            </Button>
          </Stack>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
      </Box>

      {products.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Box
            component="img"
            src="/api/placeholder/400/300"
            alt="No products"
            sx={{ width: 200, height: 150, mb: 3, opacity: 0.5 }}
          />
          <Typography variant="h5" color="text.secondary" gutterBottom>
            No products found
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={4}>
            You haven't created any products yet. Start by adding your first product.
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            component={Link}
            href="/seller/products/new"
          >
            Create Your First Product
          </Button>
        </Paper>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <Grid container spacing={3}>
              {products.map((product) => {
                const mainImage = getMainImage(product.images, 'product', product._id);
                const isRealImage = hasRealImages(product.images);
                
                return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={product._id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                    <Box
                      component="img"
                      src={mainImage}
                      alt={product.title}
                      sx={{
                        width: '100%',
                        height: 200,
                        objectFit: 'cover',
                        filter: isRealImage ? 'none' : 'brightness(0.9) sepia(0.08)',
                      }}
                    />
                    
                    {/* Stock Photo Indicator */}
                    {!isRealImage && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          backgroundColor: 'rgba(0,0,0,0.7)',
                          color: 'white',
                          padding: '2px 6px',
                          borderRadius: 1,
                          fontSize: '0.7rem',
                          zIndex: 1
                        }}
                      >
                        Stock Photo
                      </Box>
                    )}
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" noWrap gutterBottom title={product.title}>
                        {product.title}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          mb: 2
                        }}
                      >
                        {product.description}
                      </Typography>
                      <Typography variant="h6" color="primary" gutterBottom>
                        {product.currency} {product.price}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        {product.category && (
                          <Chip 
                            label={product.category} 
                            size="small" 
                            variant="outlined"
                          />
                        )}
                        {product.source && (
                          <Chip 
                            label={product.source} 
                            size="small" 
                            color="secondary"
                          />
                        )}
                      </Stack>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Created: {formatDate(product.createdAt)}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <IconButton 
                        size="small" 
                        component={Link} 
                        href={`/product/${product._id}`}
                        title="View Product"
                      >
                        <ViewIcon />
                      </IconButton>
                      <IconButton 
                        size="small"
                        component={Link}
                        href={`/seller/products/${product._id}/edit`}
                        title="Edit Product"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => handleDeleteProduct(product._id)}
                        title="Delete Product"
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </CardActions>
                  </Card>
                </Grid>
                );
              })}
            </Grid>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Source</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products.map((product) => {
                    const mainImage = getMainImage(product.images, 'product', product._id);
                    const isRealImage = hasRealImages(product.images);
                    
                    return (
                    <TableRow key={product._id}>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Box sx={{ position: 'relative' }}>
                            <Avatar
                              src={mainImage}
                              variant="square"
                              sx={{ 
                                width: 60, 
                                height: 60,
                                filter: isRealImage ? 'none' : 'brightness(0.9) sepia(0.08)',
                              }}
                            >
                              {product.title.charAt(0)}
                            </Avatar>
                            {!isRealImage && (
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: -4,
                                  right: -4,
                                  backgroundColor: 'rgba(0,0,0,0.7)',
                                  color: 'white',
                                  padding: '1px 3px',
                                  borderRadius: 0.5,
                                  fontSize: '0.6rem',
                                  zIndex: 1
                                }}
                              >
                                SP
                              </Box>
                            )}
                          </Box>
                          <Box>
                            <Typography variant="subtitle1" fontWeight={600}>
                              {product.title}
                            </Typography>
                            <Typography 
                              variant="body2" 
                              color="text.secondary"
                              sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 1,
                                WebkitBoxOrient: 'vertical',
                              }}
                            >
                              {product.description}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {product.currency} {product.price}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {product.category && (
                          <Chip 
                            label={product.category} 
                            size="small" 
                            variant="outlined"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {product.source && (
                          <Chip 
                            label={product.source} 
                            size="small" 
                            color="secondary"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(product.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <IconButton 
                            size="small" 
                            component={Link} 
                            href={`/product/${product._id}`}
                            title="View Product"
                          >
                            <ViewIcon />
                          </IconButton>
                          <IconButton 
                            size="small"
                            component={Link}
                            href={`/seller/products/${product._id}/edit`}
                            title="Edit Product"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={() => handleDeleteProduct(product._id)}
                            title="Delete Product"
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}
    </Container>
  );
}