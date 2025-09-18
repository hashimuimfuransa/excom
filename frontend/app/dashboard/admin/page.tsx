"use client";
import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Button,
  IconButton,
  Divider,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  People,
  Store,
  ShoppingBag,
  TrendingUp,
  PendingActions,
  CheckCircle,
  Cancel,
  Notifications,
  Analytics
} from '@mui/icons-material';
import { apiGet, apiPatch } from '@utils/api';
import AdminLayout from '@/components/admin/AdminLayout';
import StatsCard from '@/components/admin/StatsCard';

interface Store {
  _id: string;
  name: string;
  description?: string;
  approved?: boolean;
  owner?: { _id: string; name: string; email: string; role: string };
}

interface DashboardStats {
  totalUsers: number;
  totalStores: number;
  pendingStores: number;
  totalProducts: number;
  activeStores: number;
  monthlyGrowth: {
    users: number;
    stores: number;
    products: number;
  };
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentStores, setRecentStores] = useState<Store[]>([]);
  const [pendingActions, setPendingActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('excom_token');
        if (!token) {
          window.location.href = '/auth/login';
          return;
        }

        // Fetch all required data
        const [stores, users, products, pendingStoresData] = await Promise.all([
          apiGet('/sellers/stores').catch(() => []),
          apiGet('/admin/users').catch(() => []),
          apiGet('/admin/products').catch(() => []),
          apiGet('/sellers/stores?pending=1').catch(() => [])
        ]);

        // Calculate stats
        const approvedStores = stores.filter((s: Store) => s.approved);
        const statsData: DashboardStats = {
          totalUsers: users.length,
          totalStores: stores.length,
          activeStores: approvedStores.length,
          pendingStores: pendingStoresData.length,
          totalProducts: products.length,
          monthlyGrowth: {
            users: Math.floor(Math.random() * 20) + 5, // Mock data
            stores: Math.floor(Math.random() * 15) + 3,
            products: Math.floor(Math.random() * 25) + 8
          }
        };

        setStats(statsData);
        setRecentStores(pendingStoresData.slice(0, 5));
        setPendingActions([
          ...pendingStoresData.map((s: Store) => ({
            id: s._id,
            type: 'store_approval',
            title: `Store approval: ${s.name}`,
            description: `${s.owner?.name} requested store approval`,
            time: 'Recently',
            avatar: s.name.charAt(0).toUpperCase(),
            color: 'warning'
          }))
        ]);

      } catch (err) {
        setError('Failed to load dashboard data');
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleStoreAction = async (storeId: string, approved: boolean) => {
    try {
      await apiPatch(`/sellers/stores/${storeId}`, { approved });
      
      // Update local state
      setRecentStores(prev => prev.filter(s => s._id !== storeId));
      setPendingActions(prev => prev.filter(a => a.id !== storeId));
      
      if (stats) {
        setStats({
          ...stats,
          pendingStores: stats.pendingStores - 1,
          activeStores: approved ? stats.activeStores + 1 : stats.activeStores
        });
      }
    } catch (err) {
      setError('Failed to update store status');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <Box sx={{ p: 3 }}>
          <LinearProgress />
          <Typography sx={{ mt: 2, textAlign: 'center' }}>Loading dashboard...</Typography>
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            Dashboard Overview
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Monitor your platform's performance and manage key operations
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Stats Grid */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="Total Users"
              value={stats?.totalUsers || 0}
              subtitle="Registered platform users"
              icon={<People />}
              color="primary"
              trend={{
                value: stats?.monthlyGrowth.users || 0,
                period: "vs last month"
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="Active Stores"
              value={stats?.activeStores || 0}
              subtitle="Approved vendor stores"
              icon={<Store />}
              color="success"
              trend={{
                value: stats?.monthlyGrowth.stores || 0,
                period: "vs last month"
              }}
              progress={{
                value: stats?.activeStores || 0,
                max: stats?.totalStores || 1
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="Products Listed"
              value={stats?.totalProducts || 0}
              subtitle="Total product catalog"
              icon={<ShoppingBag />}
              color="info"
              trend={{
                value: stats?.monthlyGrowth.products || 0,
                period: "vs last month"
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="Pending Reviews"
              value={stats?.pendingStores || 0}
              subtitle="Awaiting approval"
              icon={<PendingActions />}
              color="warning"
              actions={[
                {
                  label: "Review All",
                  onClick: () => window.location.href = '/dashboard/admin/stores'
                }
              ]}
            />
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Recent Store Applications */}
          <Grid item xs={12} lg={6}>
            <Card sx={{ height: 400 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h6" fontWeight={700}>
                    Recent Store Applications
                  </Typography>
                  <Chip 
                    size="small" 
                    label={recentStores.length} 
                    color="warning"
                  />
                </Box>
                
                <List sx={{ maxHeight: 280, overflow: 'auto' }}>
                  {recentStores.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No pending store applications
                      </Typography>
                    </Box>
                  ) : (
                    recentStores.map((store, index) => (
                      <React.Fragment key={store._id}>
                        <ListItem
                          sx={{ px: 0, py: 1.5 }}
                          secondaryAction={
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleStoreAction(store._id, true)}
                              >
                                <CheckCircle />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleStoreAction(store._id, false)}
                              >
                                <Cancel />
                              </IconButton>
                            </Box>
                          }
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                              {store.name.charAt(0).toUpperCase()}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography variant="subtitle2" fontWeight={600}>
                                {store.name}
                              </Typography>
                            }
                            secondary={
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  {store.description || 'No description provided'}
                                </Typography>
                                {store.owner && (
                                  <Typography variant="caption" color="text.secondary">
                                    by {store.owner.name} • {store.owner.email}
                                  </Typography>
                                )}
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < recentStores.length - 1 && <Divider variant="inset" />}
                      </React.Fragment>
                    ))
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Activity Feed */}
          <Grid item xs={12} lg={6}>
            <Card sx={{ height: 400 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h6" fontWeight={700}>
                    Recent Activity
                  </Typography>
                  <Notifications color="action" />
                </Box>
                
                <List sx={{ maxHeight: 280, overflow: 'auto' }}>
                  {pendingActions.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No recent activity
                      </Typography>
                    </Box>
                  ) : (
                    pendingActions.map((action, index) => (
                      <React.Fragment key={action.id}>
                        <ListItem sx={{ px: 0, py: 1.5 }}>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: `${action.color}.main` }}>
                              {action.avatar}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography variant="subtitle2" fontWeight={600}>
                                {action.title}
                              </Typography>
                            }
                            secondary={
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  {action.description}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {action.time}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < pendingActions.length - 1 && <Divider variant="inset" />}
                      </React.Fragment>
                    ))
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Quick Actions */}
          <Grid item xs={12}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Quick Actions
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    startIcon={<Store />}
                    onClick={() => window.location.href = '/dashboard/admin/stores'}
                  >
                    Review Stores
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<People />}
                    onClick={() => window.location.href = '/dashboard/admin/users'}
                  >
                    Manage Users
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<ShoppingBag />}
                    onClick={() => window.location.href = '/dashboard/admin/products'}
                  >
                    View Products
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Analytics />}
                    onClick={() => window.location.href = '/dashboard/admin/analytics'}
                  >
                    View Analytics
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </AdminLayout>
  );
}