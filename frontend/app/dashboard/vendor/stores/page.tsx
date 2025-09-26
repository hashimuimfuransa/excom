"use client";
import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Stack,
  Chip,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  LinearProgress,
  Paper,
  Divider,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Store as StoreIcon,
  Add,
  Edit,
  Delete,
  LocationOn,
  Phone,
  Email,
  Language,
  AccessTime,
  Visibility,
  VisibilityOff,
  CheckCircle,
  Schedule,
  Map as MapIcon,
  Business,
  Public
} from '@mui/icons-material';
import { apiGet, apiDelete } from '@utils/api';
import VendorLayout from '@components/VendorLayout';
import LanguageSwitcher from '@components/LanguageSwitcher';
import DarkModeToggle from '@components/DarkModeToggle';
import { useTranslation } from 'react-i18next';
import StoreManagementDialog from '@components/StoreManagementDialog';

interface Store {
  _id: string;
  name: string;
  description?: string;
  logo?: string;
  banner?: string;
  approved?: boolean;
  isActive?: boolean;
  category?: string;
  contactInfo?: {
    email?: string;
    phone?: string;
    website?: string;
    socialMedia?: {
      facebook?: string;
      instagram?: string;
      twitter?: string;
      linkedin?: string;
    };
  };
  location?: {
    address: string;
    city: string;
    state?: string;
    country: string;
    postalCode?: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  businessHours?: {
    [key: string]: {
      open: string;
      close: string;
      closed?: boolean;
    };
  };
  createdAt?: string;
  updatedAt?: string;
}

export default function VendorStoresPage() {
  const { t } = useTranslation();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const data = await apiGet<Store[]>('/sellers/my-stores');
      setStores(data);
    } catch (error: any) {
      setMessage(error?.message || 'Failed to fetch stores');
    } finally {
      setLoading(false);
    }
  };

  const handleStoreCreated = (store: Store) => {
    setStores(prev => [store, ...prev]);
    setCreateDialogOpen(false);
    setMessage(t('storeManagement.storeCreatedSuccessfully'));
  };

  const handleStoreUpdated = (updatedStore: Store) => {
    setStores(prev => prev.map(s => s._id === updatedStore._id ? updatedStore : s));
    setEditDialogOpen(false);
    setSelectedStore(null);
    setMessage(t('storeManagement.storeUpdatedSuccessfully'));
  };

  const handleDeleteStore = async (storeId: string) => {
    if (!confirm(t('storeManagement.confirmDeleteStore'))) {
      return;
    }

    try {
      await apiDelete(`/sellers/stores/${storeId}`);
      setStores(prev => prev.filter(s => s._id !== storeId));
      setMessage(t('storeManagement.storeDeletedSuccessfully'));
    } catch (error: any) {
      setMessage(error?.message || t('storeManagement.failedToDeleteStore'));
    }
  };

  const handleEditStore = (store: Store) => {
    setSelectedStore(store);
    setEditDialogOpen(true);
  };

  const getStatusColor = (store: Store) => {
    if (!store.approved) return 'warning';
    if (!store.isActive) return 'error';
    return 'success';
  };

  const getStatusText = (store: Store) => {
    if (!store.approved) return t('storeManagement.storePending');
    if (!store.isActive) return t('storeManagement.storeIsInactive');
    return t('storeManagement.storeIsActive');
  };

  const formatBusinessHours = (businessHours?: Store['businessHours']) => {
    if (!businessHours) return t('common.notSet', 'Not set');
    
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    const hours = days.map((day, index) => {
      const dayHours = businessHours[day];
      if (!dayHours || dayHours.closed) return `${dayNames[index]}: ${t('storeManagement.closed')}`;
      return `${dayNames[index]}: ${dayHours.open} - ${dayHours.close}`;
    });
    
    return hours.join(', ');
  };

  if (loading) {
    return (
      <VendorLayout>
        <Container sx={{ py: 4 }}>
          <LinearProgress sx={{ borderRadius: 2, height: 6 }} />
        </Container>
      </VendorLayout>
    );
  }

  return (
    <VendorLayout>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={4}>
          <Box>
            <Typography variant="h4" fontWeight={900} gutterBottom>
              {t('storeManagement.title')}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t('storeManagement.subtitle')}
            </Typography>
          </Box>
          <Stack direction="row" alignItems="center" spacing={2}>
            <LanguageSwitcher />
            <DarkModeToggle />
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setCreateDialogOpen(true)}
              sx={{ borderRadius: 2, px: 3 }}
            >
              {t('storeManagement.createNewStore')}
            </Button>
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

        {/* Stores Grid */}
        {stores.length === 0 ? (
          <Paper sx={{ p: 6, borderRadius: 4, textAlign: 'center' }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 80, height: 80, mx: 'auto', mb: 3 }}>
              <StoreIcon fontSize="large" />
            </Avatar>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              {t('storeManagement.noStoresYet')}
            </Typography>
            <Typography color="text.secondary" mb={3}>
              {t('storeManagement.createFirstStore')}
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setCreateDialogOpen(true)}
              size="large"
            >
              {t('storeManagement.createFirstStore')}
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {stores.map((store) => (
              <Grid item xs={12} md={6} lg={4} key={store._id}>
                <Card 
                  sx={{ 
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                    }
                  }}
                >
                  {/* Store Banner */}
                  {store.banner && (
                    <Box
                      component="img"
                      src={store.banner}
                      alt={store.name}
                      sx={{
                        width: '100%',
                        height: 120,
                        objectFit: 'cover'
                      }}
                    />
                  )}

                  <CardContent>
                    <Stack spacing={2}>
                      {/* Store Header */}
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar 
                          sx={{ 
                            bgcolor: store.approved ? 'success.main' : 'warning.main',
                            width: 48,
                            height: 48
                          }}
                        >
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
                          <Typography variant="h6" fontWeight={600} noWrap>
                            {store.name}
                          </Typography>
                          <Chip
                            label={getStatusText(store)}
                            color={getStatusColor(store)}
                            size="small"
                          />
                        </Box>
                      </Stack>

                      {/* Store Description */}
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
                          }}
                        >
                          {store.description}
                        </Typography>
                      )}

                      {/* Category */}
                      {store.category && (
                        <Chip
                          label={store.category}
                          variant="outlined"
                          size="small"
                          icon={<Business />}
                        />
                      )}

                      <Divider />

                      {/* Contact Information */}
                      <Stack spacing={1}>
                        {store.contactInfo?.email && (
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Email fontSize="small" color="action" />
                            <Typography variant="body2" noWrap>
                              {store.contactInfo.email}
                            </Typography>
                          </Stack>
                        )}
                        {store.contactInfo?.phone && (
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Phone fontSize="small" color="action" />
                            <Typography variant="body2" noWrap>
                              {store.contactInfo.phone}
                            </Typography>
                          </Stack>
                        )}
                        {store.contactInfo?.website && (
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Language fontSize="small" color="action" />
                            <Typography variant="body2" noWrap>
                              {store.contactInfo.website}
                            </Typography>
                          </Stack>
                        )}
                        {store.location && (
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <LocationOn fontSize="small" color="action" />
                            <Typography variant="body2" noWrap>
                              {store.location.city}, {store.location.country}
                            </Typography>
                          </Stack>
                        )}
                      </Stack>

                      {/* Business Hours */}
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <AccessTime fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {formatBusinessHours(store.businessHours)}
                        </Typography>
                      </Stack>
                    </Stack>
                  </CardContent>

                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Stack direction="row" spacing={1} width="100%">
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Edit />}
                        onClick={() => handleEditStore(store)}
                        sx={{ flex: 1 }}
                      >
                        {t('storeManagement.actions.edit')}
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Visibility />}
                        href={`/dashboard/vendor/products?store=${store._id}`}
                        disabled={!store.approved}
                        sx={{ flex: 1 }}
                      >
                        {t('products.myProducts')}
                      </Button>
                      <Tooltip title={t('storeManagement.deleteStore')}>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteStore(store._id)}
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Create Store Dialog */}
        <StoreManagementDialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          onStoreCreated={handleStoreCreated}
        />

        {/* Edit Store Dialog */}
        <StoreManagementDialog
          open={editDialogOpen}
          onClose={() => {
            setEditDialogOpen(false);
            setSelectedStore(null);
          }}
          store={selectedStore}
          onStoreUpdated={handleStoreUpdated}
        />
      </Container>
    </VendorLayout>
  );
}
