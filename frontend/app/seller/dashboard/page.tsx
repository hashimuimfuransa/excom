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
  Stack,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Paper,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Store as StoreIcon,
  Inventory as InventoryIcon,
  Analytics as AnalyticsIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  TrendingUp,
  ShoppingCart,
  AttachMoney
} from '@mui/icons-material';
import Link from 'next/link';
import { apiGet, apiPost, apiDelete } from '../../../utils/api';

interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  category?: string;
  createdAt: string;
}

interface Store {
  _id: string;
  name: string;
  description?: string;
  logo?: string;
  approved: boolean;
  createdAt: string;
}

interface DashboardStats {
  totalProducts: number;
  totalRevenue: number;
  totalOrders: number;
  conversionRate: number;
}

export default function SellerDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [store, setStore] = useState<Store | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalRevenue: 0,
    totalOrders: 0,
    conversionRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createStoreOpen, setCreateStoreOpen] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [createStoreLoading, setCreateStoreLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [productsResponse, storeResponse] = await Promise.allSettled([
        apiGet('/products/mine/list'),
        apiGet('/sellers/my-store')
      ]);

      if (productsResponse.status === 'fulfilled') {
        setProducts(productsResponse.value);
        setStats(prev => ({ ...prev, totalProducts: productsResponse.value.length }));
      }

      if (storeResponse.status === 'fulfilled' && storeResponse.value) {
        setStore(storeResponse.value);
      }
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStore = async () => {
    if (!storeName.trim()) return;

    try {
      setCreateStoreLoading(true);
      const newStore = await apiPost('/sellers/stores', {
        name: storeName,
        description: storeDescription
      });
      setStore(newStore);
      setCreateStoreOpen(false);
      setStoreName('');
      setStoreDescription('');
    } catch (err) {
      setError('Failed to create store');
      console.error('Create store error:', err);
    } finally {
      setCreateStoreLoading(false);
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
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Seller Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your store, products, and track your performance
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Store Status Section */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <StoreIcon />
          Store Status
        </Typography>
        
        {store ? (
          <Box>
            <Stack direction="row" spacing={2} alignItems="center" mb={2}>
              <Typography variant="h6">{store.name}</Typography>
              <Chip 
                label={store.approved ? 'Approved' : 'Pending Approval'} 
                color={store.approved ? 'success' : 'warning'}
                size="small"
              />
            </Stack>
            {store.description && (
              <Typography variant="body2" color="text.secondary" mb={2}>
                {store.description}
              </Typography>
            )}
            {!store.approved && (
              <Alert severity="info">
                Your store is pending admin approval. You can create products, but they won't be visible until approved.
              </Alert>
            )}
          </Box>
        ) : (
          <Box>
            <Typography variant="body1" color="text.secondary" mb={2}>
              You don't have a store yet. Create one to start selling products.
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={() => setCreateStoreOpen(true)}
            >
              Create Store
            </Button>
          </Box>
        )}
      </Paper>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <InventoryIcon color="primary" />
                <Box>
                  <Typography variant="h4" fontWeight={600}>{stats.totalProducts}</Typography>
                  <Typography variant="body2" color="text.secondary">Total Products</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <AttachMoney color="success" />
                <Box>
                  <Typography variant="h4" fontWeight={600}>${stats.totalRevenue}</Typography>
                  <Typography variant="body2" color="text.secondary">Total Revenue</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <ShoppingCart color="info" />
                <Box>
                  <Typography variant="h4" fontWeight={600}>{stats.totalOrders}</Typography>
                  <Typography variant="body2" color="text.secondary">Total Orders</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <TrendingUp color="warning" />
                <Box>
                  <Typography variant="h4" fontWeight={600}>{stats.conversionRate}%</Typography>
                  <Typography variant="body2" color="text.secondary">Conversion Rate</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Box mb={4}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Quick Actions
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            component={Link}
            href="/seller/products/new"
            disabled={!store?.approved}
          >
            Add New Product
          </Button>
          <Button
            variant="outlined"
            startIcon={<InventoryIcon />}
            component={Link}
            href="/seller/products"
          >
            Manage Products
          </Button>
          <Button
            variant="outlined"
            startIcon={<AnalyticsIcon />}
            component={Link}
            href="/seller/analytics"
          >
            View Analytics
          </Button>
        </Stack>
      </Box>

      {/* Recent Products */}
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6" fontWeight={600}>
            Recent Products
          </Typography>
          <Button 
            variant="text" 
            component={Link} 
            href="/seller/products"
            endIcon={<ViewIcon />}
          >
            View All
          </Button>
        </Box>

        {products.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <InventoryIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No products yet
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Start by creating your first product to begin selling
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              component={Link}
              href="/seller/products/new"
              disabled={!store?.approved}
            >
              Create Your First Product
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {products.slice(0, 6).map((product) => (
              <Grid item xs={12} md={6} lg={4} key={product._id}>
                <Card>
                  {product.images.length > 0 && (
                    <Box
                      component="img"
                      src={product.images[0]}
                      alt={product.title}
                      sx={{
                        width: '100%',
                        height: 200,
                        objectFit: 'cover'
                      }}
                    />
                  )}
                  <CardContent>
                    <Typography variant="h6" noWrap gutterBottom>
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
                      }}
                    >
                      {product.description}
                    </Typography>
                    <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                      {product.currency} {product.price}
                    </Typography>
                    {product.category && (
                      <Chip 
                        label={product.category} 
                        size="small" 
                        sx={{ mt: 1 }}
                      />
                    )}
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
            ))}
          </Grid>
        )}
      </Box>

      {/* Create Store Dialog */}
      <Dialog open={createStoreOpen} onClose={() => setCreateStoreOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Your Store</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Store Name"
            fullWidth
            variant="outlined"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Store Description (Optional)"
            fullWidth
            multiline
            minRows={3}
            variant="outlined"
            value={storeDescription}
            onChange={(e) => setStoreDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateStoreOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateStore} 
            variant="contained"
            disabled={!storeName.trim() || createStoreLoading}
            startIcon={createStoreLoading ? <CircularProgress size={20} /> : <AddIcon />}
          >
            Create Store
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}