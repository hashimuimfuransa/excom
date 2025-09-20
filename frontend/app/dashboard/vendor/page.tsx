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
  Edit,
  Chat as ChatIcon,
  MonetizationOn as BargainIcon
} from '@mui/icons-material';
import { Fab } from '@mui/material';
import { apiGet, apiPost } from '@utils/api';
import StoreManagement from '@components/StoreManagement';
import { useTranslation } from 'react-i18next';

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
  totalBargains: number;
  activeBargains: number;
  acceptedBargains: number;
  recentOrders: Array<{
    _id: string;
    total: number;
    currency: string;
    createdAt: string;
    status: string;
  }>;
}

export default function VendorDashboardPage() {
  const { t } = useTranslation();
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
        totalBargains: 0,
        activeBargains: 0,
        acceptedBargains: 0,
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
      setMessage(t('vendor.storeSubmittedApproval'));
    } catch (err: any) {
      setMessage(err?.message || t('vendor.failedToCreateStore'));
    }
  }

  const handleStoreCreated = (store: Store) => {
    setStores(prev => [store, ...prev]);
    setSelectedStore(store);
    setMessage(t('vendor.storeCreatedSuccessfully'));
  };

  const handleStoreUpdated = (updatedStore: Store) => {
    setStores(prev => prev.map(s => s._id === updatedStore._id ? updatedStore : s));
    setSelectedStore(updatedStore);
    setMessage(t('vendor.storeUpdatedSuccessfully'));
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
            {t('vendor.vendorHub')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('vendor.trackPerformance')}
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
          {t('vendor.powerTools')}
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
              {t('vendor.storeHub')}
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
              {t('vendor.myProducts')}
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
              {t('vendor.orderQueue')}
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
              {t('vendor.earnings')}
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
              {t('vendor.collections')}
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
              {t('vendor.bookings')}
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button 
              href="/dashboard/vendor/bargaining" 
              variant="contained" 
              fullWidth
              startIcon={<BargainIcon />}
              sx={{ 
                bgcolor: 'rgba(255,215,0,0.3)', 
                '&:hover': { bgcolor: 'rgba(255,215,0,0.4)' },
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,215,0,0.4)',
                color: '#fff',
                fontWeight: 'bold'
              }}
            >
              {t('vendor.bargainingHub')}
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
              {t('vendor.launchYourStore')}
            </Typography>
            <Typography color="text.secondary" maxWidth={600}>
              {t('vendor.createGetApproved')}
            </Typography>
            <Box component="form" onSubmit={createStore} sx={{ width: '100%', maxWidth: 500 }}>
              <Stack spacing={3}>
                <TextField 
                  label={t('vendor.storeName')}
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                  fullWidth
                  variant="outlined"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
                <TextField 
                  label={t('vendor.storeDescription')}
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
                  {t('vendor.requestStoreApproval')}
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
                {t('vendor.myStores')} ({stores.length})
              </Typography>
              <Button 
                variant="contained" 
                onClick={() => setCreateStoreDialogOpen(true)}
                sx={{ borderRadius: 2 }}
              >
                {t('vendor.createNewStore')}
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
                              label={store.approved ? t('vendor.active') : t('vendor.pending')} 
                              color={store.approved ? 'success' : 'warning'}
                              size="small"
                            />
                          </Box>
                          <Tooltip title={t('vendor.editStore')}>
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
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          <Button 
                            size="small" 
                            variant="outlined"
                            href={`/dashboard/vendor/products?store=${store._id}`}
                            disabled={!store.approved}
                          >
                            {t('vendor.products')}
                          </Button>
                          <Button 
                            size="small" 
                            variant="outlined"
                            href={`/dashboard/vendor/orders?store=${store._id}`}
                            disabled={!store.approved}
                          >
                            {t('vendor.orders')}
                          </Button>
                          <Button 
                            size="small" 
                            variant="outlined"
                            href="/dashboard/vendor/bargaining"
                            disabled={!store.approved}
                            sx={{ 
                              color: 'warning.main',
                              borderColor: 'warning.main',
                              '&:hover': {
                                borderColor: 'warning.dark',
                                bgcolor: 'warning.light'
                              }
                            }}
                          >
                            {t('products.bargainHistory')}
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
                {t('vendor.storePendingApproval', { storeName: selectedStore.name })}
              </Alert>
            )}
          </Paper>

          {/* Statistics Grid */}
          {selectedStore?.approved && stats && (
            <>
              <Grid container spacing={3} mb={4}>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    title={t('vendor.totalProducts')}
                    value={stats.totalProducts}
                    icon={<Inventory />}
                    color="#1976d2"
                    subtitle={t('vendor.activeListings')}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    title={t('vendor.totalOrders')}
                    value={stats.totalOrders}
                    icon={<ShoppingCart />}
                    color="#2e7d32"
                    subtitle={t('vendor.allTime')}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    title={t('vendor.totalBargains')}
                    value={stats.totalBargains || 0}
                    icon={<BargainIcon />}
                    color="#ff9800"
                    subtitle={`${stats.activeBargains || 0} ${t('vendor.activeBargains').toLowerCase()}, ${stats.acceptedBargains || 0} ${t('vendor.acceptedBargains').toLowerCase()}`}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    title={t('vendor.revenue')}
                    value={`$${stats.totalRevenue.toLocaleString()}`}
                    icon={<TrendingUp />}
                    color="#ed6c02"
                    subtitle={t('vendor.totalEarnings')}
                  />
                </Grid>
              </Grid>

              {/* Second Row of Stats */}
              <Grid container spacing={3} mb={4}>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    title={t('vendor.pendingOrders')}
                    value={stats.pendingOrders}
                    icon={<LocalShipping />}
                    color="#9c27b0"
                    subtitle={t('vendor.needAttention')}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    title={t('vendor.activeBargains')}
                    value={stats.activeBargains || 0}
                    icon={<ChatIcon />}
                    color="#4caf50"
                    subtitle={t('vendor.ongoingNegotiations')}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    title={t('vendor.acceptedBargains')}
                    value={stats.acceptedBargains || 0}
                    icon={<CheckCircle />}
                    color="#2196f3"
                    subtitle={t('vendor.successfulDeals')}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    title={t('vendor.bargainSuccessRate')}
                    value={stats.totalBargains ? `${Math.round((stats.acceptedBargains || 0) / stats.totalBargains * 100)}%` : '0%'}
                    icon={<TrendingUp />}
                    color="#00bcd4"
                    subtitle={t('vendor.negotiationEfficiency')}
                  />
                </Grid>
              </Grid>

              {/* Quick Actions */}
              <Paper sx={{ p: 3, borderRadius: 4, border: (t) => `1px solid ${t.palette.divider}`, mb: 4 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  {t('vendor.quickActions')}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Inventory />}
                      href="/dashboard/vendor/products"
                      sx={{ 
                        borderRadius: 2, 
                        py: 1.5,
                        flexDirection: 'column',
                        height: '80px',
                        '& .MuiButton-startIcon': { marginRight: 0, marginBottom: 1 }
                      }}
                    >
                      {t('vendor.manageProducts')}
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<ShoppingCart />}
                      href="/dashboard/vendor/orders"
                      sx={{ 
                        borderRadius: 2, 
                        py: 1.5,
                        flexDirection: 'column',
                        height: '80px',
                        '& .MuiButton-startIcon': { marginRight: 0, marginBottom: 1 }
                      }}
                    >
                      {t('vendor.ordersManagement')}
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<BargainIcon />}
                      href="/dashboard/vendor/bargaining"
                      sx={{ 
                        borderRadius: 2, 
                        py: 1.5,
                        flexDirection: 'column',
                        height: '80px',
                        color: 'warning.main',
                        borderColor: 'warning.main',
                        '&:hover': {
                          borderColor: 'warning.dark',
                          bgcolor: 'warning.light',
                          color: 'warning.dark'
                        },
                        '& .MuiButton-startIcon': { marginRight: 0, marginBottom: 1 }
                      }}
                    >
                      {t('products.bargainHistory')}
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Analytics />}
                      href="/dashboard/vendor/analytics"
                      sx={{ 
                        borderRadius: 2, 
                        py: 1.5,
                        flexDirection: 'column',
                        height: '80px',
                        '& .MuiButton-startIcon': { marginRight: 0, marginBottom: 1 }
                      }}
                    >
                      {t('vendor.analytics')}
                    </Button>
                  </Grid>
                </Grid>
              </Paper>

              {/* Recent Orders */}
              <Paper sx={{ p: 3, borderRadius: 4, border: (t) => `1px solid ${t.palette.divider}` }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
                  <Typography variant="h6" fontWeight={700}>
                    {t('vendor.recentOrders')}
                  </Typography>
                  <Button href="/dashboard/vendor/orders" variant="outlined" size="small">
                    {t('vendor.viewAll')}
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

      {/* Floating Bargain Chat Button */}
      <Fab
        color="warning"
        href="/dashboard/vendor/bargaining"
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 1000,
          bgcolor: 'warning.main',
          '&:hover': {
            bgcolor: 'warning.dark',
            transform: 'scale(1.1)'
          },
          animation: 'pulse 3s infinite',
          '@keyframes pulse': {
            '0%': {
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)',
            },
            '50%': {
              boxShadow: '0 6px 20px rgba(245, 158, 11, 0.8)',
              transform: 'scale(1.05)',
            },
            '100%': {
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)',
            }
          }
        }}
      >
        <ChatIcon />
      </Fab>
    </Container>
  );
}