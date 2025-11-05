'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Paper,
  Stack,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AttachMoney,
  ShoppingCart,
  Visibility,
  Star,
  Inventory,
  People
} from '@mui/icons-material';
import { apiGet } from '../../../utils/api';

interface AnalyticsData {
  overview: {
    totalRevenue: number;
    totalOrders: number;
    totalProducts: number;
    totalViews: number;
    averageRating: number;
    conversionRate: number;
    revenueGrowth: number;
    ordersGrowth: number;
  };
  topProducts: Array<{
    _id: string;
    title: string;
    image: string;
    sales: number;
    revenue: number;
    views: number;
  }>;
  recentOrders: Array<{
    _id: string;
    productTitle: string;
    customerName: string;
    amount: number;
    currency: string;
    status: string;
    createdAt: string;
  }>;
  monthlyData: Array<{
    month: string;
    revenue: number;
    orders: number;
  }>;
}

export default function SellerAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      // Mock data for now - replace with actual API call
      const mockData: AnalyticsData = {
        overview: {
          totalRevenue: 12450.50,
          totalOrders: 156,
          totalProducts: 24,
          totalViews: 3240,
          averageRating: 4.8,
          conversionRate: 4.8,
          revenueGrowth: 23.5,
          ordersGrowth: 18.2
        },
        topProducts: [
          {
            _id: '1',
            title: 'Wireless Bluetooth Headphones',
            image: '/api/placeholder/60/60',
            sales: 45,
            revenue: 3375,
            views: 890
          },
          {
            _id: '2',
            title: 'Smart Phone Case',
            image: '/api/placeholder/60/60',
            sales: 67,
            revenue: 1005,
            views: 567
          },
          {
            _id: '3',
            title: 'USB-C Cable 3ft',
            image: '/api/placeholder/60/60',
            sales: 123,
            revenue: 984,
            views: 432
          }
        ],
        recentOrders: [
          {
            _id: '1',
            productTitle: 'Wireless Bluetooth Headphones',
            customerName: 'John Doe',
            amount: 75,
            currency: 'RWF',
            status: 'completed',
            createdAt: new Date().toISOString()
          },
          {
            _id: '2',
            productTitle: 'Smart Phone Case',
            customerName: 'Jane Smith',
            amount: 15,
            currency: 'RWF',
            status: 'pending',
            createdAt: new Date(Date.now() - 86400000).toISOString()
          }
        ],
        monthlyData: [
          { month: 'Jan', revenue: 8200, orders: 98 },
          { month: 'Feb', revenue: 9100, orders: 112 },
          { month: 'Mar', revenue: 12450, orders: 156 }
        ]
      };

      setAnalytics(mockData);
    } catch (err) {
      setError('Failed to load analytics data');
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency = 'RWF') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Container sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!analytics) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error">Failed to load analytics data</Alert>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Analytics Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track your store performance and insights
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Overview Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Revenue
                  </Typography>
                  <Typography variant="h4" fontWeight={600}>
                    {formatCurrency(analytics.overview.totalRevenue)}
                  </Typography>
                </Box>
                <AttachMoney color="success" sx={{ fontSize: 40 }} />
              </Stack>
              <Stack direction="row" alignItems="center" spacing={1}>
                <TrendingUp color="success" fontSize="small" />
                <Typography variant="body2" color="success.main">
                  +{analytics.overview.revenueGrowth}% from last month
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Orders
                  </Typography>
                  <Typography variant="h4" fontWeight={600}>
                    {analytics.overview.totalOrders}
                  </Typography>
                </Box>
                <ShoppingCart color="primary" sx={{ fontSize: 40 }} />
              </Stack>
              <Stack direction="row" alignItems="center" spacing={1}>
                <TrendingUp color="success" fontSize="small" />
                <Typography variant="body2" color="success.main">
                  +{analytics.overview.ordersGrowth}% from last month
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Products
                  </Typography>
                  <Typography variant="h4" fontWeight={600}>
                    {analytics.overview.totalProducts}
                  </Typography>
                </Box>
                <Inventory color="info" sx={{ fontSize: 40 }} />
              </Stack>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="body2" color="text.secondary">
                  Active listings
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Conversion Rate
                  </Typography>
                  <Typography variant="h4" fontWeight={600}>
                    {analytics.overview.conversionRate}%
                  </Typography>
                </Box>
                <TrendingUp color="warning" sx={{ fontSize: 40 }} />
              </Stack>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="body2" color="text.secondary">
                  {analytics.overview.totalViews} total views
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={4}>
        {/* Top Products */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Top Performing Products
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell align="right">Sales</TableCell>
                      <TableCell align="right">Revenue</TableCell>
                      <TableCell align="right">Views</TableCell>
                      <TableCell align="right">Conversion</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analytics.topProducts.map((product) => (
                      <TableRow key={product._id}>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={2}>
                            <Avatar
                              src={product.image}
                              variant="square"
                              sx={{ width: 40, height: 40 }}
                            />
                            <Typography variant="body2" fontWeight={500}>
                              {product.title}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={600}>
                            {product.sales}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={600}>
                            {formatCurrency(product.revenue)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            {product.views}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            {((product.sales / product.views) * 100).toFixed(1)}%
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={(product.sales / product.views) * 100}
                            sx={{ mt: 1, height: 4 }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Orders */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Recent Orders
              </Typography>
              <Stack spacing={2}>
                {analytics.recentOrders.map((order) => (
                  <Paper
                    key={order._id}
                    variant="outlined"
                    sx={{ p: 2 }}
                  >
                    <Stack spacing={1}>
                      <Typography variant="body2" fontWeight={600} noWrap>
                        {order.productTitle}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        by {order.customerName}
                      </Typography>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6" color="primary">
                          {formatCurrency(order.amount, order.currency)}
                        </Typography>
                        <Chip
                          label={order.status}
                          size="small"
                          color={getStatusColor(order.status) as any}
                          variant="outlined"
                        />
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(order.createdAt)}
                      </Typography>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Monthly Performance */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Monthly Performance
              </Typography>
              <Grid container spacing={2}>
                {analytics.monthlyData.map((month) => (
                  <Grid item xs={12} sm={4} key={month.month}>
                    <Paper
                      variant="outlined"
                      sx={{ p: 3, textAlign: 'center' }}
                    >
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        {month.month}
                      </Typography>
                      <Typography variant="h4" color="primary" gutterBottom>
                        {formatCurrency(month.revenue)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {month.orders} orders
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}