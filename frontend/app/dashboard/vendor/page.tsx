"use client";
import React, { useEffect, useState } from 'react';
import { 
  Alert, Box, Button, Card, CardContent, Container, Grid, LinearProgress, 
  Paper, Stack, TextField, Typography, Divider, Avatar, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, FormControl, InputLabel,
  Select, MenuItem, IconButton, Tooltip
} from '@mui/material';
import { 
  Store as StoreIcon, 
  TrendingUp, 
  ShoppingCart, 
  AccountBalanceWallet,
  Inventory,
  CheckCircle,
  Schedule,
  LocalShipping,
  Analytics,
  Edit
} from '@mui/icons-material';
import { apiGet, apiPost } from '@utils/api';
import StoreManagement from '@components/StoreManagement';

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

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  recentOrders: Array<{
    _id: string;
    total: number;
    currency: string;
    createdAt: string;
    status: string;
  }>;
}

export default function VendorDashboardPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [createStoreDialogOpen, setCreateStoreDialogOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('excom_token');
    if (!token) {
      window.location.href = '/auth/login';
      return;
    }
    
    Promise.all([
      apiGet<Store[]>("/sellers/my-stores").catch(() => []),
      apiGet<DashboardStats>("/sellers/dashboard-stats").catch(() => ({
        totalProducts: 0,
        totalOrders: 0,
        totalRevenue: 0,
        pendingOrders: 0,
        recentOrders: []
      } as DashboardStats))
    ]).then(([storesData, statsData]) => {
      setStores(storesData);
      setSelectedStore(storesData.length > 0 ? storesData[0] : null);
      setStats(statsData);
      setLoading(false);
    });
  }, []);

  async function createStore(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    try {
      const s = await apiPost<Store>("/sellers/stores", { name, description, category });
      setStores(prev => [s, ...prev]);
      setSelectedStore(s);
      setCreateStoreDialogOpen(false);
      setName('');
      setDescription('');
      setCategory('');
      setMessage('Store submitted for approval.');
    } catch (err: any) {
      setMessage(err?.message || 'Failed to create store.');
    }
  }

  const handleStoreCreated = (store: Store) => {
    setStores(prev => [store, ...prev]);
    setSelectedStore(store);
    setMessage('Store created successfully and submitted for approval.');
  };

  const handleStoreUpdated = (updatedStore: Store) => {
    setStores(prev => prev.map(s => s._id === updatedStore._id ? updatedStore : s));
    setSelectedStore(updatedStore);
    setMessage('Store updated successfully.');
  };

  const StatCard = ({ title, value, icon, color, subtitle }: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    subtitle?: string;
  }) => (
    <Card sx={{ 
      borderRadius: 3, 
      border: '1px solid', 
      borderColor: 'divider',
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      transition: 'transform 0.2s ease-in-out',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.12)'
      }
    }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>
            {icon}
          </Avatar>
          <Box flex={1}>
            <Typography variant="h4" fontWeight={700} color={color}>
              {value}
            </Typography>
            <Typography variant="body1" fontWeight={600} gutterBottom>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Container sx={{ py: 6 }}>
        <LinearProgress sx={{ borderRadius: 2, height: 6 }} />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={900} gutterBottom>
            Vendor Hub
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Your business command center. Track performance and grow your impact.
          </Typography>
        </Box>
        <Avatar sx={{ bgcolor: 'primary.main', width: 64, height: 64 }}>
          <StoreIcon fontSize="large" />
        </Avatar>
      </Stack>

      {/* Quick Navigation */}
      <Paper sx={(theme) => ({ 
        p: 3, 
        borderRadius: 4, 
        mb: 4,
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%)'
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        border: `1px solid ${theme.palette.divider}`
      })}>
        <Typography variant="h6" fontWeight={700} gutterBottom color="white">
          Power Tools
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Button 
              href="/dashboard/vendor" 
              variant="contained" 
              fullWidth
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
            >
              Store Hub
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button 
              href="/dashboard/vendor/products" 
              variant="contained" 
              fullWidth
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
            >
              My Products
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button 
              href="/dashboard/vendor/orders" 
              variant="contained" 
              fullWidth
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
            >
              Order Queue
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button 
              href="/dashboard/vendor/payouts" 
              variant="contained" 
              fullWidth
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
            >
              Earnings
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button 
              href="/seller/collections" 
              variant="contained" 
              fullWidth
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
            >
              Collections
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button 
              href="/seller/bookings" 
              variant="contained" 
              fullWidth
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
            >
              Bookings
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {stores.length === 0 ? (
        <Paper sx={{ p: 4, borderRadius: 4, border: (t) => `1px solid ${t.palette.divider}` }}>
          <Stack alignItems="center" spacing={3} textAlign="center">
            <Avatar sx={{ bgcolor: 'primary.main', width: 80, height: 80 }}>
              <StoreIcon fontSize="large" />
            </Avatar>
            <Typography variant="h5" fontWeight={700}>
              Launch Your Store
            </Typography>
            <Typography color="text.secondary" maxWidth={600}>
              Begin your entrepreneurial journey. Create your store, get approved, and start building your business with us.
            </Typography>
            <Box component="form" onSubmit={createStore} sx={{ width: '100%', maxWidth: 500 }}>
              <Stack spacing={3}>
                <TextField 
                  label="Store Name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                  fullWidth
                  variant="outlined"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
                <TextField 
                  label="Store Description" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  multiline 
                  rows={3} 
                  fullWidth
                  variant="outlined"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
                <Button 
                  type="submit" 
                  variant="contained" 
                  size="large"
                  sx={{ borderRadius: 2, py: 1.5 }}
                >
                  Request Store Approval
                </Button>
                {message && (
                  <Alert severity={message.includes('Failed') ? 'error' : 'success'}>
                    {message}
                  </Alert>
                )}
              </Stack>
            </Box>
          </Stack>
        </Paper>
      ) : (
        <>
          {/* Store Management Header */}
          <Paper sx={{ p: 3, borderRadius: 4, border: (t) => `1px solid ${t.palette.divider}`, mb: 4 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
              <Typography variant="h6" fontWeight={700}>
                My Stores ({stores.length})
              </Typography>
              <Button 
                variant="contained" 
                onClick={() => setCreateStoreDialogOpen(true)}
                sx={{ borderRadius: 2 }}
              >
                Create New Store
              </Button>
            </Stack>

            {/* Store Selection */}
            <Grid container spacing={2}>
              {stores.map((store) => (
                <Grid item xs={12} sm={6} md={4} key={store._id}>
                  <Card 
                    sx={{ 
                      borderRadius: 3,
                      border: selectedStore?._id === store._id ? '2px solid' : '1px solid',
                      borderColor: selectedStore?._id === store._id ? 'primary.main' : 'divider',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: 'primary.main',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                      }
                    }}
                    onClick={() => setSelectedStore(store)}
                  >
                    <CardContent>
                      <Stack spacing={2}>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Avatar sx={{ bgcolor: store.approved ? 'success.main' : 'warning.main' }}>
                            {store.logo ? (
                              <Box 
                                component="img" 
                                src={store.logo} 
                                alt={store.name}
                                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              <StoreIcon />
                            )}
                          </Avatar>
                          <Box flex={1}>
                            <Typography variant="subtitle1" fontWeight={600}>
                              {store.name}
                            </Typography>
                            <Chip 
                              label={store.approved ? 'Active' : 'Pending'} 
                              color={store.approved ? 'success' : 'warning'}
                              size="small"
                            />
                          </Box>
                          <Tooltip title="Edit Store">
                            <IconButton 
                              size="small" 
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingStore(store);
                              }}
                              sx={{ color: 'text.secondary' }}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                        {store.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ 
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}>
                            {store.description}
                          </Typography>
                        )}
                        <Stack direction="row" spacing={1}>
                          <Button 
                            size="small" 
                            variant="outlined"
                            href={`/dashboard/vendor/products?store=${store._id}`}
                            disabled={!store.approved}
                          >
                            Products
                          </Button>
                          <Button 
                            size="small" 
                            variant="outlined"
                            href={`/dashboard/vendor/orders?store=${store._id}`}
                            disabled={!store.approved}
                          >
                            Orders
                          </Button>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {selectedStore && !selectedStore.approved && (
              <Alert severity="info" sx={{ mt: 3 }}>
                Store "{selectedStore.name}" is pending approval. You'll be notified once an admin reviews and approves your store.
              </Alert>
            )}
          </Paper>

          {/* Statistics Grid */}
          {selectedStore?.approved && stats && (
            <>
              <Grid container spacing={3} mb={4}>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    title="Total Products"
                    value={stats.totalProducts}
                    icon={<Inventory />}
                    color="#1976d2"
                    subtitle="Active listings"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    title="Total Orders"
                    value={stats.totalOrders}
                    icon={<ShoppingCart />}
                    color="#2e7d32"
                    subtitle="All time"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    title="Revenue"
                    value={`$${stats.totalRevenue.toLocaleString()}`}
                    icon={<TrendingUp />}
                    color="#ed6c02"
                    subtitle="Total earnings"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    title="Pending Orders"
                    value={stats.pendingOrders}
                    icon={<LocalShipping />}
                    color="#9c27b0"
                    subtitle="Need attention"
                  />
                </Grid>
              </Grid>

              {/* Recent Orders */}
              <Paper sx={{ p: 3, borderRadius: 4, border: (t) => `1px solid ${t.palette.divider}` }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
                  <Typography variant="h6" fontWeight={700}>
                    Recent Orders
                  </Typography>
                  <Button href="/dashboard/vendor/orders" variant="outlined" size="small">
                    View All
                  </Button>
                </Stack>
                <Stack divider={<Divider />} spacing={2}>
                  {stats.recentOrders.map((order) => (
                    <Stack key={order._id} direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography fontWeight={600}>
                          Order #{order._id.slice(-6)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Stack alignItems="flex-end" spacing={0.5}>
                        <Typography fontWeight={700}>
                          ${order.total}
                        </Typography>
                        <Chip 
                          label={order.status} 
                          size="small"
                          color={
                            order.status === 'completed' ? 'success' :
                            order.status === 'shipped' ? 'info' : 'warning'
                          }
                        />
                      </Stack>
                    </Stack>
                  ))}
                </Stack>
              </Paper>
            </>
          )}
        </>
      )}

      {/* Create Store Dialog */}
      <StoreManagement
        open={createStoreDialogOpen}
        onClose={() => setCreateStoreDialogOpen(false)}
        onStoreCreated={handleStoreCreated}
      />

      {/* Edit Store Dialog */}
      <StoreManagement
        open={!!editingStore}
        onClose={() => setEditingStore(null)}
        store={editingStore}
        onStoreUpdated={handleStoreUpdated}
      />
    </Container>
  );
}