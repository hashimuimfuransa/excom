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
  MonetizationOn as BargainIcon,
  People as AffiliateIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { Fab } from '@mui/material';
import { apiGet } from '@utils/api';
import StoreManagementDialog from '@components/StoreManagementDialog';
import VendorLayout from '@components/VendorLayout';
import LanguageSwitcher from '@components/LanguageSwitcher';
import DarkModeToggle from '@components/DarkModeToggle';
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


  const handleStoreCreated = (store: Store) => {
    setStores(prev => [store, ...prev]);
    setSelectedStore(store);
    setMessage('Store created successfully');
  };

  const handleStoreUpdated = (updatedStore: Store) => {
    setStores(prev => prev.map(s => s._id === updatedStore._id ? updatedStore : s));
    setSelectedStore(updatedStore);
    setMessage('Store updated successfully');
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
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          alignItems={{ xs: 'center', sm: 'flex-start' }} 
          spacing={{ xs: 1, sm: 2 }}
          textAlign={{ xs: 'center', sm: 'left' }}
        >
          <Avatar sx={{ 
            bgcolor: color, 
            width: { xs: 48, sm: 56 }, 
            height: { xs: 48, sm: 56 } 
          }}>
            {icon}
          </Avatar>
          <Box flex={1}>
            <Typography 
              variant="h4" 
              fontWeight={700} 
              color={color}
              sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}
            >
              {value}
            </Typography>
            <Typography 
              variant="body1" 
              fontWeight={600} 
              gutterBottom
              sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              >
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
    <VendorLayout>
      <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Stack 
        direction={{ xs: 'column', sm: 'row' }} 
        alignItems={{ xs: 'flex-start', sm: 'center' }} 
        justifyContent="space-between" 
        spacing={{ xs: 2, sm: 0 }}
        mb={4}
      >
        <Box>
          <Typography variant="h4" fontWeight={900} gutterBottom>
            {t('vendor.vendorHub')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('vendor.trackPerformance')}
          </Typography>
        </Box>
        <Stack 
          direction="row" 
          alignItems="center" 
          spacing={2}
          sx={{ 
            width: { xs: '100%', sm: 'auto' },
            justifyContent: { xs: 'space-between', sm: 'flex-end' }
          }}
        >
          <LanguageSwitcher />
          <DarkModeToggle />
          <Avatar sx={{ 
            bgcolor: 'primary.main', 
            width: { xs: 48, sm: 64 }, 
            height: { xs: 48, sm: 64 } 
          }}>
            <StoreIcon sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }} />
          </Avatar>
        </Stack>
      </Stack>

      {/* Message Alert */}
      {message && (
        <Alert 
          severity={message.includes('Failed') || message.includes('error') ? 'error' : 'success'}
          onClose={() => setMessage(null)}
          sx={{ mb: 3 }}
        >
          {message}
        </Alert>
      )}

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
        <Grid container spacing={{ xs: 1, sm: 2 }}>
          <Grid item xs={6} sm={6} md={3}>
            <Button 
              href="/dashboard/vendor/stores" 
              variant="contained" 
              fullWidth
              size="small"
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                py: { xs: 1, sm: 1.5 }
              }}
            >
              {t('vendor.storeHub')}
            </Button>
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <Button 
              href="/dashboard/vendor/products" 
              variant="contained" 
              fullWidth
              size="small"
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                py: { xs: 1, sm: 1.5 }
              }}
            >
              {t('vendor.myProducts')}
            </Button>
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <Button 
              href="/dashboard/vendor/orders" 
              variant="contained" 
              fullWidth
              size="small"
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                py: { xs: 1, sm: 1.5 }
              }}
            >
              {t('vendor.orderQueue')}
            </Button>
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <Button 
              href="/dashboard/vendor/payouts" 
              variant="contained" 
              fullWidth
              size="small"
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                py: { xs: 1, sm: 1.5 }
              }}
            >
              {t('vendor.earnings')}
            </Button>
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <Button 
              href="/seller/collections" 
              variant="contained" 
              fullWidth
              size="small"
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                py: { xs: 1, sm: 1.5 }
              }}
            >
              {t('vendor.collections')}
            </Button>
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <Button 
              href="/seller/bookings" 
              variant="contained" 
              fullWidth
              size="small"
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                py: { xs: 1, sm: 1.5 }
              }}
            >
              {t('vendor.bookings')}
            </Button>
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <Button 
              href="/dashboard/vendor/bargaining" 
              variant="contained" 
              fullWidth
              size="small"
              startIcon={<BargainIcon />}
              sx={{ 
                bgcolor: 'rgba(255,215,0,0.3)', 
                '&:hover': { bgcolor: 'rgba(255,215,0,0.4)' },
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,215,0,0.4)',
                color: '#fff',
                fontWeight: 'bold',
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                py: { xs: 1, sm: 1.5 },
                '& .MuiButton-startIcon': {
                  marginRight: { xs: 0.5, sm: 1 }
                }
              }}
            >
              {t('vendor.bargainingHub')}
            </Button>
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <Button 
              href="/dashboard/vendor/affiliate" 
              variant="contained" 
              fullWidth
              size="small"
              startIcon={<AffiliateIcon />}
              sx={{ 
                bgcolor: 'rgba(76,175,80,0.3)', 
                '&:hover': { bgcolor: 'rgba(76,175,80,0.4)' },
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(76,175,80,0.4)',
                color: '#fff',
                fontWeight: 'bold',
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                py: { xs: 1, sm: 1.5 },
                '& .MuiButton-startIcon': {
                  marginRight: { xs: 0.5, sm: 1 }
                }
              }}
            >
              Affiliate Management
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {stores.length === 0 ? (
        <Paper sx={{ p: 6, borderRadius: 4, textAlign: 'center' }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 80, height: 80, mx: 'auto', mb: 3 }}>
            <StoreIcon fontSize="large" />
          </Avatar>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            {t('vendor.launchYourStore')}
          </Typography>
          <Typography color="text.secondary" mb={3}>
            {t('vendor.createGetApproved')}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateStoreDialogOpen(true)}
            size="large"
            sx={{ borderRadius: 2, px: 4, py: 1.5 }}
          >
            Create Your First Store
          </Button>
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
            <Grid container spacing={{ xs: 1, sm: 2 }}>
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
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                      <Stack spacing={2}>
                        <Stack 
                          direction={{ xs: 'column', sm: 'row' }} 
                          alignItems={{ xs: 'center', sm: 'flex-start' }} 
                          spacing={{ xs: 1, sm: 2 }}
                          textAlign={{ xs: 'center', sm: 'left' }}
                        >
                          <Avatar sx={{ 
                            bgcolor: store.approved ? 'success.main' : 'warning.main',
                            width: { xs: 40, sm: 48 },
                            height: { xs: 40, sm: 48 }
                          }}>
                            {store.logo ? (
                              <Box 
                                component="img" 
                                src={store.logo} 
                                alt={store.name}
                                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              <StoreIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                            )}
                          </Avatar>
                          <Box flex={1}>
                            <Typography 
                              variant="subtitle1" 
                              fontWeight={600}
                              sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                            >
                              {store.name}
                            </Typography>
                            <Chip 
                              label={store.approved ? t('vendor.active') : t('vendor.pending')} 
                              color={store.approved ? 'success' : 'warning'}
                              size="small"
                              sx={{ fontSize: { xs: '0.625rem', sm: '0.75rem' } }}
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
                              <Edit sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                        {store.description && (
                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ 
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              fontSize: { xs: '0.75rem', sm: '0.875rem' }
                            }}
                          >
                            {store.description}
                          </Typography>
                        )}
                        <Stack 
                          direction={{ xs: 'column', sm: 'row' }} 
                          spacing={1} 
                          flexWrap="wrap"
                          sx={{ 
                            '& .MuiButton-root': {
                              fontSize: { xs: '0.75rem', sm: '0.875rem' },
                              minWidth: { xs: 'auto', sm: 'auto' }
                            }
                          }}
                        >
                          <Button 
                            size="small" 
                            variant="outlined"
                            href={`/dashboard/vendor/products?store=${store._id}`}
                            disabled={!store.approved}
                            fullWidth
                          >
                            {t('vendor.products')}
                          </Button>
                          <Button 
                            size="small" 
                            variant="outlined"
                            href={`/dashboard/vendor/orders?store=${store._id}`}
                            disabled={!store.approved}
                            fullWidth
                          >
                            {t('vendor.orders')}
                          </Button>
                          <Button 
                            size="small" 
                            variant="outlined"
                            href="/dashboard/vendor/bargaining"
                            disabled={!store.approved}
                            fullWidth
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
                  <Grid container spacing={{ xs: 2, sm: 3 }} mb={4}>
                    <Grid item xs={6} sm={6} md={3}>
                      <StatCard
                        title={t('vendor.totalProducts')}
                        value={stats.totalProducts}
                        icon={<Inventory />}
                        color="#1976d2"
                        subtitle={t('vendor.activeListings')}
                      />
                    </Grid>
                    <Grid item xs={6} sm={6} md={3}>
                      <StatCard
                        title={t('vendor.totalOrders')}
                        value={stats.totalOrders}
                        icon={<ShoppingCart />}
                        color="#2e7d32"
                        subtitle={t('vendor.allTime')}
                      />
                    </Grid>
                    <Grid item xs={6} sm={6} md={3}>
                      <StatCard
                        title={t('vendor.totalBargains')}
                        value={stats.totalBargains || 0}
                        icon={<BargainIcon />}
                        color="#ff9800"
                        subtitle={`${stats.activeBargains || 0} ${t('vendor.activeBargains').toLowerCase()}, ${stats.acceptedBargains || 0} ${t('vendor.acceptedBargains').toLowerCase()}`}
                      />
                    </Grid>
                    <Grid item xs={6} sm={6} md={3}>
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
                  <Grid container spacing={{ xs: 2, sm: 3 }} mb={4}>
                    <Grid item xs={6} sm={6} md={3}>
                      <StatCard
                        title={t('vendor.pendingOrders')}
                        value={stats.pendingOrders}
                        icon={<LocalShipping />}
                        color="#9c27b0"
                        subtitle={t('vendor.needAttention')}
                      />
                    </Grid>
                    <Grid item xs={6} sm={6} md={3}>
                      <StatCard
                        title={t('vendor.activeBargains')}
                        value={stats.activeBargains || 0}
                        icon={<ChatIcon />}
                        color="#4caf50"
                        subtitle={t('vendor.ongoingNegotiations')}
                      />
                    </Grid>
                    <Grid item xs={6} sm={6} md={3}>
                      <StatCard
                        title={t('vendor.acceptedBargains')}
                        value={stats.acceptedBargains || 0}
                        icon={<CheckCircle />}
                        color="#2196f3"
                        subtitle={t('vendor.successfulDeals')}
                      />
                    </Grid>
                    <Grid item xs={6} sm={6} md={3}>
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
              <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 4, border: (t) => `1px solid ${t.palette.divider}`, mb: 4 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  {t('vendor.quickActions')}
                </Typography>
                <Grid container spacing={{ xs: 1, sm: 2 }}>
                  <Grid item xs={6} sm={6} md={3}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Inventory />}
                      href="/dashboard/vendor/products"
                      size="small"
                      sx={{ 
                        borderRadius: 2, 
                        py: { xs: 1, sm: 1.5 },
                        flexDirection: { xs: 'row', sm: 'column' },
                        height: { xs: 'auto', sm: '80px' },
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        '& .MuiButton-startIcon': { 
                          marginRight: { xs: 1, sm: 0 }, 
                          marginBottom: { xs: 0, sm: 1 } 
                        }
                      }}
                    >
                      {t('vendor.manageProducts')}
                    </Button>
                  </Grid>
                  <Grid item xs={6} sm={6} md={3}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<ShoppingCart />}
                      href="/dashboard/vendor/orders"
                      size="small"
                      sx={{ 
                        borderRadius: 2, 
                        py: { xs: 1, sm: 1.5 },
                        flexDirection: { xs: 'row', sm: 'column' },
                        height: { xs: 'auto', sm: '80px' },
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        '& .MuiButton-startIcon': { 
                          marginRight: { xs: 1, sm: 0 }, 
                          marginBottom: { xs: 0, sm: 1 } 
                        }
                      }}
                    >
                      {t('vendor.ordersManagement')}
                    </Button>
                  </Grid>
                  <Grid item xs={6} sm={6} md={3}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<BargainIcon />}
                      href="/dashboard/vendor/bargaining"
                      size="small"
                      sx={{ 
                        borderRadius: 2, 
                        py: { xs: 1, sm: 1.5 },
                        flexDirection: { xs: 'row', sm: 'column' },
                        height: { xs: 'auto', sm: '80px' },
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        color: 'warning.main',
                        borderColor: 'warning.main',
                        '&:hover': {
                          borderColor: 'warning.dark',
                          bgcolor: 'warning.light',
                          color: 'warning.dark'
                        },
                        '& .MuiButton-startIcon': { 
                          marginRight: { xs: 1, sm: 0 }, 
                          marginBottom: { xs: 0, sm: 1 } 
                        }
                      }}
                    >
                      {t('products.bargainHistory')}
                    </Button>
                  </Grid>
                  <Grid item xs={6} sm={6} md={3}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Analytics />}
                      href="/dashboard/vendor/analytics"
                      size="small"
                      sx={{ 
                        borderRadius: 2, 
                        py: { xs: 1, sm: 1.5 },
                        flexDirection: { xs: 'row', sm: 'column' },
                        height: { xs: 'auto', sm: '80px' },
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        '& .MuiButton-startIcon': { 
                          marginRight: { xs: 1, sm: 0 }, 
                          marginBottom: { xs: 0, sm: 1 } 
                        }
                      }}
                    >
                      {t('vendor.analytics')}
                    </Button>
                  </Grid>
                  <Grid item xs={6} sm={6} md={3}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<AffiliateIcon />}
                      href="/dashboard/vendor/affiliate"
                      size="small"
                      sx={{ 
                        borderRadius: 2, 
                        py: { xs: 1, sm: 1.5 },
                        flexDirection: { xs: 'row', sm: 'column' },
                        height: { xs: 'auto', sm: '80px' },
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        color: 'success.main',
                        borderColor: 'success.main',
                        '&:hover': {
                          borderColor: 'success.dark',
                          bgcolor: 'success.light',
                          color: 'success.dark'
                        },
                        '& .MuiButton-startIcon': { 
                          marginRight: { xs: 1, sm: 0 }, 
                          marginBottom: { xs: 0, sm: 1 } 
                        }
                      }}
                    >
                      Affiliate Management
                    </Button>
                  </Grid>
                </Grid>
              </Paper>

              {/* Recent Orders */}
              <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 4, border: (t) => `1px solid ${t.palette.divider}` }}>
                <Stack 
                  direction={{ xs: 'column', sm: 'row' }} 
                  alignItems={{ xs: 'flex-start', sm: 'center' }} 
                  justifyContent="space-between" 
                  spacing={{ xs: 1, sm: 0 }}
                  mb={3}
                >
                  <Typography variant="h6" fontWeight={700}>
                    {t('vendor.recentOrders')}
                  </Typography>
                  <Button 
                    href="/dashboard/vendor/orders" 
                    variant="outlined" 
                    size="small"
                    sx={{ alignSelf: { xs: 'flex-end', sm: 'auto' } }}
                  >
                    {t('vendor.viewAll')}
                  </Button>
                </Stack>
                <Stack divider={<Divider />} spacing={2}>
                  {stats.recentOrders.map((order) => (
                    <Stack 
                      key={order._id} 
                      direction={{ xs: 'column', sm: 'row' }} 
                      justifyContent="space-between" 
                      alignItems={{ xs: 'flex-start', sm: 'center' }}
                      spacing={{ xs: 1, sm: 0 }}
                    >
                      <Box>
                        <Typography 
                          fontWeight={600}
                          sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                        >
                          Order #{order._id.slice(-6)}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                        >
                          {new Date(order.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Stack 
                        alignItems={{ xs: 'flex-start', sm: 'flex-end' }} 
                        spacing={0.5}
                        direction={{ xs: 'row', sm: 'column' }}
                        sx={{ width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'space-between', sm: 'flex-end' } }}
                      >
                        <Typography 
                          fontWeight={700}
                          sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                        >
                          ${order.total}
                        </Typography>
                        <Chip 
                          label={order.status} 
                          size="small"
                          sx={{ fontSize: { xs: '0.625rem', sm: '0.75rem' } }}
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
      <StoreManagementDialog
        open={createStoreDialogOpen}
        onClose={() => setCreateStoreDialogOpen(false)}
        onStoreCreated={handleStoreCreated}
      />

      {/* Edit Store Dialog */}
      <StoreManagementDialog
        open={!!editingStore}
        onClose={() => setEditingStore(null)}
        store={editingStore}
        onStoreUpdated={handleStoreUpdated}
      />

      {/* Floating AI Support Button */}
      <Fab
        color="primary"
        href="/dashboard/vendor/ai-support-new"
        size="medium"
        sx={{
          position: 'fixed',
          bottom: { xs: 16, sm: 20 },
          right: { xs: 16, sm: 20 },
          zIndex: 1000,
          bgcolor: 'primary.main',
          width: { xs: 48, sm: 56 },
          height: { xs: 48, sm: 56 },
          '&:hover': {
            bgcolor: 'primary.dark',
            transform: 'scale(1.1)'
          },
          animation: 'pulse 3s infinite',
          '@keyframes pulse': {
            '0%': {
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
            },
            '50%': {
              boxShadow: '0 6px 20px rgba(59, 130, 246, 0.8)',
              transform: 'scale(1.05)',
            },
            '100%': {
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
            }
          }
        }}
      >
        <ChatIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
      </Fab>

      {/* Floating Bargain Chat Button */}
      <Fab
        color="warning"
        href="/dashboard/vendor/bargaining"
        size="medium"
        sx={{
          position: 'fixed',
          bottom: { xs: 76, sm: 90 },
          right: { xs: 16, sm: 20 },
          zIndex: 1000,
          bgcolor: 'warning.main',
          width: { xs: 48, sm: 56 },
          height: { xs: 48, sm: 56 },
          '&:hover': {
            bgcolor: 'warning.dark',
            transform: 'scale(1.1)'
          },
          animation: 'pulse 3s infinite 1.5s',
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
        <BargainIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
      </Fab>
      </Container>
    </VendorLayout>
  );
}