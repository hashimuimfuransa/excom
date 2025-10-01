"use client";
import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Alert,
  LinearProgress,
  Divider
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  People,
  Store,
  ShoppingBag,
  AttachMoney,
  Analytics,
  Star,
  Timeline,
  LocalAtm
} from '@mui/icons-material';
import { apiGet } from '@utils/api';
import AdminLayout from '@/components/admin/AdminLayout';
import StatsCard from '@/components/admin/StatsCard';

interface AnalyticsData {
  overview: {
    totalRevenue: number;
    totalOrders: number;
    totalUsers: number;
    totalStores: number;
    averageOrderValue: number;
  };
  trends: {
    userGrowth: number;
    revenueGrowth: number;
    orderGrowth: number;
    storeGrowth: number;
  };
  topProducts: Array<{
    _id: string;
    title: string;
    sales: number;
    revenue: number;
  }>;
  topStores: Array<{
    _id: string;
    name: string;
    revenue: number;
    orders: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: 'order' | 'user' | 'store';
    description: string;
    timestamp: string;
    value?: number;
  }>;
}

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('excom_token');
      if (!token) {
        window.location.href = '/auth/login';
        return;
      }

      // Fetch real data from the backend
      const data = await apiGet<AnalyticsData>('/admin/analytics', token);
      setAnalytics(data);
      setLoading(false);

    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Failed to fetch analytics data. Please try again later.');
      setLoading(false);
      
      // Fallback to mock data for development
      const mockData: AnalyticsData = {
        overview: {
          totalRevenue: 0,
          totalOrders: 0,
          totalUsers: 0,
          totalStores: 0,
          averageOrderValue: 0
        },
        trends: {
          userGrowth: 0,
          revenueGrowth: 0,
          orderGrowth: 0,
          storeGrowth: 0
        },
        topProducts: [],
        topStores: [],
        recentActivity: []
      };
      setAnalytics(mockData);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <Box sx={{ p: 3 }}>
          <LinearProgress />
          <Typography sx={{ mt: 2, textAlign: 'center' }}>Loading analytics...</Typography>
        </Box>
      </AdminLayout>
    );
  }

  if (!analytics) {
    return (
      <AdminLayout>
        <Box sx={{ p: 3 }}>
          <Alert severity="error">Failed to load analytics data</Alert>
        </Box>
      </AdminLayout>
    );
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'order': return <ShoppingBag />;
      case 'user': return <People />;
      case 'store': return <Store />;
      default: return <Analytics />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'order': return 'success.main';
      case 'user': return 'primary.main';
      case 'store': return 'warning.main';
      default: return 'info.main';
    }
  };

  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            Analytics Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Monitor platform performance and track key metrics
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Overview Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <StatsCard
              title="Total Revenue"
              value={`$${analytics.overview.totalRevenue.toLocaleString()}`}
              subtitle="Platform earnings"
              icon={<AttachMoney />}
              color="success"
              trend={{
                value: analytics.trends.revenueGrowth,
                period: "vs last month"
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <StatsCard
              title="Total Orders"
              value={analytics.overview.totalOrders.toLocaleString()}
              subtitle="Completed transactions"
              icon={<ShoppingBag />}
              color="primary"
              trend={{
                value: analytics.trends.orderGrowth,
                period: "vs last month"
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <StatsCard
              title="Total Users"
              value={analytics.overview.totalUsers.toLocaleString()}
              subtitle="Registered users"
              icon={<People />}
              color="info"
              trend={{
                value: analytics.trends.userGrowth,
                period: "vs last month"
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <StatsCard
              title="Active Stores"
              value={analytics.overview.totalStores}
              subtitle="Approved stores"
              icon={<Store />}
              color="warning"
              trend={{
                value: analytics.trends.storeGrowth,
                period: "vs last month"
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <StatsCard
              title="Avg. Order Value"
              value={`$${analytics.overview.averageOrderValue.toFixed(2)}`}
              subtitle="Per transaction"
              icon={<LocalAtm />}
              color="secondary"
            />
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Top Products */}
          <Grid item xs={12} lg={6}>
            <Card sx={{ height: 400 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h6" fontWeight={700}>
                    Top Products
                  </Typography>
                  <Chip size="small" label="By Revenue" />
                </Box>
                
                <List sx={{ maxHeight: 280, overflow: 'auto' }}>
                  {analytics.topProducts.map((product, index) => (
                    <React.Fragment key={product._id}>
                      <ListItem sx={{ px: 0, py: 1.5 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            #{index + 1}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle2" fontWeight={600}>
                              {product.title}
                            </Typography>
                          }
                          secondary={
                            <span style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                              <Typography variant="body2" color="text.secondary" component="span">
                                {product.sales} sales
                              </Typography>
                              <Typography variant="body2" fontWeight={600} color="success.main" component="span">
                                ${product.revenue.toLocaleString()}
                              </Typography>
                            </span>
                          }
                        />
                      </ListItem>
                      {index < analytics.topProducts.length - 1 && <Divider variant="inset" />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Top Stores */}
          <Grid item xs={12} lg={6}>
            <Card sx={{ height: 400 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h6" fontWeight={700}>
                    Top Performing Stores
                  </Typography>
                  <Chip size="small" label="By Revenue" />
                </Box>
                
                <List sx={{ maxHeight: 280, overflow: 'auto' }}>
                  {analytics.topStores.map((store, index) => (
                    <React.Fragment key={store._id}>
                      <ListItem sx={{ px: 0, py: 1.5 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'warning.main' }}>
                            <Store />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle2" fontWeight={600}>
                              {store.name}
                            </Typography>
                          }
                          secondary={
                            <span style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                              <Typography variant="body2" color="text.secondary" component="span">
                                {store.orders} orders
                              </Typography>
                              <Typography variant="body2" fontWeight={600} color="success.main" component="span">
                                ${store.revenue.toLocaleString()}
                              </Typography>
                            </span>
                          }
                        />
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="caption" color="text.secondary">
                            Rank #{index + 1}
                          </Typography>
                        </Box>
                      </ListItem>
                      {index < analytics.topStores.length - 1 && <Divider variant="inset" />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Activity */}
          <Grid item xs={12}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h6" fontWeight={700}>
                    Recent Activity
                  </Typography>
                  <Chip size="small" label="Last 24 hours" />
                </Box>
                
                <List>
                  {analytics.recentActivity.map((activity, index) => (
                    <React.Fragment key={activity.id}>
                      <ListItem sx={{ px: 0, py: 2 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: getActivityColor(activity.type) }}>
                            {getActivityIcon(activity.type)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle2" fontWeight={600}>
                              {activity.description}
                            </Typography>
                          }
                          secondary={
                            <span style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 4 }}>
                              <Typography variant="body2" color="text.secondary" component="span">
                                {new Date(activity.timestamp).toLocaleTimeString()}
                              </Typography>
                              {activity.value && (
                                <Typography variant="body2" fontWeight={600} color="success.main" component="span">
                                  +${activity.value}
                                </Typography>
                              )}
                            </span>
                          }
                        />
                      </ListItem>
                      {index < analytics.recentActivity.length - 1 && <Divider variant="inset" />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </AdminLayout>
  );
}