"use client";
import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Avatar,
  Button,
  Tabs,
  Tab,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Grid
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Store,
  Person,
  Edit,
  Delete,
  Visibility,
  Block,
  Shop
} from '@mui/icons-material';
import { apiGet, apiPatch, apiDelete } from '@utils/api';
import AdminLayout from '@/components/admin/AdminLayout';
import DataTable, { Column } from '@/components/admin/DataTable';

interface Store {
  _id: string;
  name: string;
  description?: string;
  approved?: boolean;
  owner?: { 
    _id: string; 
    name: string; 
    email: string; 
    role: string;
  };
  createdAt: string;
  products?: number;
  revenue?: number;
}

export default function AdminStoresPage() {
  const [tab, setTab] = useState(0);
  const [pendingStores, setPendingStores] = useState<Store[]>([]);
  const [approvedStores, setApprovedStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailDialog, setDetailDialog] = useState(false);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const token = localStorage.getItem('excom_token');
      if (!token) {
        window.location.href = '/auth/login';
        return;
      }

      const [pending, all] = await Promise.all([
        apiGet<Store[]>('/sellers/stores?pending=1').catch(() => []),
        apiGet<Store[]>('/sellers/stores').catch(() => [])
      ]);

      setPendingStores(pending);
      setApprovedStores(all.filter(s => s.approved));
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
      case 'approve':
        await handleApproveStore(store._id, true);
        break;
      case 'reject':
        await handleApproveStore(store._id, false);
        break;
      case 'view':
        setDetailDialog(true);
        break;
      case 'edit':
        // TODO: Implement edit functionality
        break;
      case 'delete':
        await handleDeleteStore(store._id);
        break;
      case 'suspend':
        // TODO: Implement suspend functionality
        break;
    }
  };

  const handleApproveStore = async (storeId: string, approved: boolean) => {
    try {
      await apiPatch(`/sellers/stores/${storeId}`, { approved });
      
      // Update local state
      if (approved) {
        const approvedStore = pendingStores.find(s => s._id === storeId);
        if (approvedStore) {
          setApprovedStores(prev => [...prev, { ...approvedStore, approved: true }]);
        }
      }
      setPendingStores(prev => prev.filter(s => s._id !== storeId));
    } catch (error) {
      setError('Failed to update store status');
    }
  };

  const handleDeleteStore = async (storeId: string) => {
    if (!confirm('Are you sure you want to delete this store?')) return;
    
    try {
      await apiDelete(`/admin/stores/${storeId}`);
      setPendingStores(prev => prev.filter(s => s._id !== storeId));
      setApprovedStores(prev => prev.filter(s => s._id !== storeId));
    } catch (error) {
      setError('Failed to delete store');
    }
  };

  const pendingColumns: Column[] = [
    {
      id: 'name',
      label: 'Store',
      format: (value, store: Store) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'warning.main' }}>
            <Shop />
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
      id: 'createdAt',
      label: 'Requested',
      format: (value: string) => new Date(value).toLocaleDateString()
    },
    {
      id: 'actions',
      label: 'Actions',
      format: (value, store: Store) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            variant="contained"
            color="success"
            startIcon={<CheckCircle />}
            onClick={() => handleStoreAction('approve', store)}
          >
            Approve
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            startIcon={<Cancel />}
            onClick={() => handleStoreAction('reject', store)}
          >
            Reject
          </Button>
        </Box>
      ),
      sortable: false
    }
  ];

  const approvedColumns: Column[] = [
    {
      id: 'name',
      label: 'Store',
      format: (value, store: Store) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'success.main' }}>
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
      format: (value: number) => value || 0
    },
    {
      id: 'createdAt',
      label: 'Approved',
      format: (value: string) => new Date(value).toLocaleDateString()
    },
    {
      id: 'status',
      label: 'Status',
      format: () => (
        <Chip
          size="small"
          label="Active"
          color="success"
          icon={<CheckCircle />}
        />
      )
    }
  ];

  const approvedRowActions = [
    { label: 'View Details', action: 'view', icon: <Visibility /> },
    { label: 'Edit Store', action: 'edit', icon: <Edit /> },
    { label: 'Suspend', action: 'suspend', icon: <Block /> },
    { label: 'Delete Store', action: 'delete', icon: <Delete /> }
  ];

  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            Store Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Review store applications and manage approved stores
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
                  <Avatar sx={{ bgcolor: 'warning.main' }}>
                    <Shop />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight={700}>
                      {pendingStores.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pending Stores
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
                  <Avatar sx={{ bgcolor: 'success.main' }}>
                    <Store />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight={700}>
                      {approvedStores.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Stores
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Card sx={{ mb: 3 }}>
          <Tabs 
            value={tab} 
            onChange={(_, v) => setTab(v)} 
            sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
          >
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Pending Applications
                  <Chip size="small" label={pendingStores.length} color="warning" />
                </Box>
              } 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Approved Stores
                  <Chip size="small" label={approvedStores.length} color="success" />
                </Box>
              } 
            />
          </Tabs>
        </Card>

        {/* Tab Content */}
        {tab === 0 && (
          <DataTable
            title="Pending Store Applications"
            columns={pendingColumns}
            rows={pendingStores}
            loading={loading}
            searchable
            emptyMessage="No pending store applications"
          />
        )}

        {tab === 1 && (
          <DataTable
            title="Approved Stores"
            columns={approvedColumns}
            rows={approvedStores}
            loading={loading}
            searchable
            selectable
            onRowAction={handleStoreAction}
            rowActions={approvedRowActions}
            emptyMessage="No approved stores"
          />
        )}

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
                        label={selectedStore.approved ? 'Approved' : 'Pending'} 
                        color={selectedStore.approved ? 'success' : 'warning'}
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
          </DialogActions>
        </Dialog>
      </Box>
    </AdminLayout>
  );
}