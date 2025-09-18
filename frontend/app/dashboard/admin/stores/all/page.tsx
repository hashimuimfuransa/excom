"use client";
import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Grid,
  Alert
} from '@mui/material';
import {
  Store,
  Person,
  Visibility,
  Edit,
  Block,
  Delete,
  CheckCircle,
  Cancel,
  TrendingUp,
  ShoppingBag
} from '@mui/icons-material';
import { apiGet, apiPatch, apiDelete } from '@utils/api';
import AdminLayout from '@/components/admin/AdminLayout';
import DataTable, { Column } from '@/components/admin/DataTable';

interface Store {
  _id: string;
  name: string;
  description?: string;
  approved?: boolean;
  isActive?: boolean;
  owner?: { 
    _id: string; 
    name: string; 
    email: string; 
    role: string;
  };
  createdAt: string;
  products?: number;
  revenue?: number;
  status: 'active' | 'suspended' | 'pending' | 'rejected';
}

export default function AllStoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailDialog, setDetailDialog] = useState(false);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAllStores();
  }, []);

  const fetchAllStores = async () => {
    try {
      const token = localStorage.getItem('excom_token');
      if (!token) {
        window.location.href = '/auth/login';
        return;
      }

      const data = await apiGet<Store[]>('/sellers/stores/all').catch(async () => {
        // Fallback to getting both approved and pending stores
        const [approved, pending] = await Promise.all([
          apiGet<Store[]>('/sellers/stores').catch(() => []),
          apiGet<Store[]>('/sellers/stores?pending=1').catch(() => [])
        ]);
        return [...approved, ...pending];
      });

      // Add status based on approved field and simulate some additional data
      const processedStores = data.map((store: Store) => ({
        ...store,
        status: store.approved ? 'active' : 'pending',
        isActive: store.approved,
        products: Math.floor(Math.random() * 50) + 1, // Mock data
        revenue: Math.floor(Math.random() * 10000) + 100 // Mock data
      }));

      setStores(processedStores);
    } catch (error) {
      setError('Failed to fetch stores');
      console.error('Error fetching stores:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStoreAction = async (action: string, store: Store) => {
    setSelectedStore(store);

    switch (action) {
      case 'view':
        setDetailDialog(true);
        break;
      case 'edit':
        // TODO: Implement edit functionality
        console.log('Edit store:', store.name);
        break;
      case 'suspend':
        await handleSuspendStore(store._id);
        break;
      case 'activate':
        await handleActivateStore(store._id);
        break;
      case 'delete':
        await handleDeleteStore(store._id);
        break;
    }
  };

  const handleSuspendStore = async (storeId: string) => {
    if (!confirm('Are you sure you want to suspend this store?')) return;
    
    try {
      await apiPatch(`/admin/stores/${storeId}/suspend`, { suspended: true });
      setStores(prev => prev.map(s => 
        s._id === storeId 
          ? { ...s, status: 'suspended' as const, isActive: false } 
          : s
      ));
    } catch (error) {
      setError('Failed to suspend store');
    }
  };

  const handleActivateStore = async (storeId: string) => {
    try {
      await apiPatch(`/admin/stores/${storeId}/activate`, { suspended: false });
      setStores(prev => prev.map(s => 
        s._id === storeId 
          ? { ...s, status: 'active' as const, isActive: true } 
          : s
      ));
    } catch (error) {
      setError('Failed to activate store');
    }
  };

  const handleDeleteStore = async (storeId: string) => {
    if (!confirm('Are you sure you want to permanently delete this store? This action cannot be undone.')) return;
    
    try {
      await apiDelete(`/admin/stores/${storeId}`);
      setStores(prev => prev.filter(s => s._id !== storeId));
    } catch (error) {
      setError('Failed to delete store');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'pending': return 'warning';
      case 'suspended': return 'error';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle />;
      case 'pending': return <Block />;
      case 'suspended': return <Cancel />;
      case 'rejected': return <Cancel />;
      default: return <Block />;
    }
  };

  const columns: Column[] = [
    {
      id: 'name',
      label: 'Store',
      format: (value, store: Store) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: getStatusColor(store.status) + '.main' }}>
            <Store />
          </Avatar>
          <Box>
            <Typography variant="subtitle2" fontWeight={600}>
              {store.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {store.description || 'No description'}
            </Typography>
          </Box>
        </Box>
      )
    },
    {
      id: 'owner',
      label: 'Owner',
      format: (value, store: Store) => store.owner ? (
        <Box>
          <Typography variant="subtitle2" fontWeight={600}>
            {store.owner.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {store.owner.email}
          </Typography>
        </Box>
      ) : 'No owner'
    },
    {
      id: 'products',
      label: 'Products',
      format: (value: number) => (
        <Typography variant="body2" fontWeight={600}>
          {value || 0}
        </Typography>
      )
    },
    {
      id: 'revenue',
      label: 'Revenue',
      format: (value: number) => (
        <Typography variant="body2" fontWeight={600} color="success.main">
          ${(value || 0).toLocaleString()}
        </Typography>
      )
    },
    {
      id: 'createdAt',
      label: 'Created',
      format: (value: string) => new Date(value).toLocaleDateString()
    },
    {
      id: 'status',
      label: 'Status',
      format: (value, store: Store) => (
        <Chip
          size="small"
          label={store.status.charAt(0).toUpperCase() + store.status.slice(1)}
          color={getStatusColor(store.status) as any}
          icon={getStatusIcon(store.status)}
        />
      )
    }
  ];

  const getRowActions = (store: Store) => {
    const actions = [
      { label: 'View Details', action: 'view', icon: <Visibility /> },
      { label: 'Edit Store', action: 'edit', icon: <Edit /> }
    ];

    if (store.status === 'active') {
      actions.push({ label: 'Suspend Store', action: 'suspend', icon: <Block /> });
    } else if (store.status === 'suspended') {
      actions.push({ label: 'Activate Store', action: 'activate', icon: <CheckCircle /> });
    }

    actions.push({ label: 'Delete Store', action: 'delete', icon: <Delete /> });
    
    return actions;
  };

  const handleBulkAction = (action: string, selectedStores: Store[]) => {
    console.log('Bulk action:', action, 'on stores:', selectedStores);
    // Implement bulk actions here
  };

  const bulkActions = [
    { label: 'Suspend Selected', action: 'suspend_bulk', icon: <Block /> },
    { label: 'Delete Selected', action: 'delete_bulk', icon: <Delete /> }
  ];

  // Stats calculations
  const activeStores = stores.filter(s => s.status === 'active').length;
  const pendingStores = stores.filter(s => s.status === 'pending').length;
  const suspendedStores = stores.filter(s => s.status === 'suspended').length;
  const totalRevenue = stores.reduce((sum, s) => sum + (s.revenue || 0), 0);

  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            All Stores
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Comprehensive view of all stores on the platform
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Stats Overview */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'success.main' }}>
                    <CheckCircle />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight={700}>
                      {activeStores}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Stores
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'warning.main' }}>
                    <Block />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight={700}>
                      {pendingStores}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pending Approval
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'error.main' }}>
                    <Cancel />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight={700}>
                      {suspendedStores}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Suspended
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'info.main' }}>
                    <TrendingUp />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight={700}>
                      ${totalRevenue.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Revenue
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Stores Table */}
        <DataTable
          title={`All Stores (${stores.length})`}
          columns={columns}
          rows={stores}
          loading={loading}
          searchable
          selectable
          onRowAction={handleStoreAction}
          onBulkAction={handleBulkAction}
          rowActions={getRowActions(stores[0] || {} as Store)} // Dynamic actions
          bulkActions={bulkActions}
          emptyMessage="No stores found"
        />

        {/* Store Details Dialog */}
        <Dialog open={detailDialog} onClose={() => setDetailDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>Store Details</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            {selectedStore && (
              <Box>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    {selectedStore.name}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" paragraph>
                    {selectedStore.description || 'No description provided'}
                  </Typography>
                </Box>

                {selectedStore.owner && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      Store Owner
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar>
                        <Person />
                      </Avatar>
                      <Box>
                        <Typography variant="body1">{selectedStore.owner.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {selectedStore.owner.email}
                        </Typography>
                        <Chip size="small" label={selectedStore.owner.role} sx={{ mt: 0.5 }} />
                      </Box>
                    </Box>
                  </Box>
                )}

                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Performance Metrics
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Products
                      </Typography>
                      <Typography variant="h6">{selectedStore.products || 0}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Revenue
                      </Typography>
                      <Typography variant="h6" color="success.main">
                        ${(selectedStore.revenue || 0).toLocaleString()}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>

                <Box>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Store Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Status
                      </Typography>
                      <Chip 
                        size="small" 
                        label={selectedStore.status.charAt(0).toUpperCase() + selectedStore.status.slice(1)} 
                        color={getStatusColor(selectedStore.status) as any}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Created Date
                      </Typography>
                      <Typography variant="body1">
                        {new Date(selectedStore.createdAt).toLocaleDateString()}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailDialog(false)}>Close</Button>
            {selectedStore?.status === 'active' && (
              <Button 
                variant="outlined" 
                color="error"
                onClick={() => {
                  setDetailDialog(false);
                  handleStoreAction('suspend', selectedStore);
                }}
              >
                Suspend Store
              </Button>
            )}
            {selectedStore?.status === 'suspended' && (
              <Button 
                variant="contained" 
                color="success"
                onClick={() => {
                  setDetailDialog(false);
                  handleStoreAction('activate', selectedStore);
                }}
              >
                Activate Store
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </Box>
    </AdminLayout>
  );
}