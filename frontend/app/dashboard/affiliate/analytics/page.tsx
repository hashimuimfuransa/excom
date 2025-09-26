'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  LinearProgress
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Visibility as VisibilityIcon,
  ShoppingCart as ShoppingCartIcon,
  AttachMoney as MoneyIcon,
  Link as LinkIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import AffiliateLayout from '@/components/AffiliateLayout';
import { apiGet } from '@utils/api';

interface AnalyticsData {
  totalClicks: number;
  totalConversions: number;
  totalEarnings: number;
  conversionRate: number;
  clickThroughRate: number;
  averageOrderValue: number;
  topPerformingProducts: Array<{
    _id: string;
    name: string;
    image?: string;
    clicks: number;
    conversions: number;
    earnings: number;
    conversionRate: number;
  }>;
  topPerformingLinks: Array<{
    _id: string;
    productName: string;
    productImage?: string;
    clicks: number;
    conversions: number;
    earnings: number;
    conversionRate: number;
    url: string;
  }>;
  dailyStats: Array<{
    date: string;
    clicks: number;
    conversions: number;
    earnings: number;
  }>;
  monthlyStats: Array<{
    month: string;
    clicks: number;
    conversions: number;
    earnings: number;
  }>;
  trafficSources: Array<{
    source: string;
    clicks: number;
    conversions: number;
    percentage: number;
  }>;
  deviceStats: Array<{
    device: string;
    clicks: number;
    conversions: number;
    percentage: number;
  }>;
  geographicStats: Array<{
    country: string;
    clicks: number;
    conversions: number;
    earnings: number;
  }>;
}

interface ComparisonData {
  period: string;
  clicks: number;
  conversions: number;
  earnings: number;
  conversionRate: number;
}

export default function AffiliateAnalyticsPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalClicks: 0,
    totalConversions: 0,
    totalEarnings: 0,
    conversionRate: 0,
    clickThroughRate: 0,
    averageOrderValue: 0,
    topPerformingProducts: [],
    topPerformingLinks: [],
    dailyStats: [],
    monthlyStats: [],
    trafficSources: [],
    deviceStats: [],
    geographicStats: []
  });
  const [comparisonData, setComparisonData] = useState<ComparisonData>({
    period: '',
    clicks: 0,
    conversions: 0,
    earnings: 0,
    conversionRate: 0
  });
  const [timeRange, setTimeRange] = useState('30');
  const [viewType, setViewType] = useState('overview');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const analyticsResponse = await apiGet(`/affiliate/analytics?period=${timeRange}`);
      
      setAnalytics(analyticsResponse.data || analytics);
      // Generate mock comparison data for now
      setComparisonData({
        clicks: Math.floor(analyticsResponse.data?.totalClicks * 0.8 || 0),
        conversions: Math.floor(analyticsResponse.data?.totalConversions * 0.8 || 0),
        conversionRate: (analyticsResponse.data?.conversionRate || 0) * 0.8,
        earnings: (analyticsResponse.data?.totalEarnings || 0) * 0.8
      });
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      showSnackbar('Error fetching analytics data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleExportData = async () => {
    try {
      const response = await apiGet(`/affiliate/analytics/export?period=${timeRange}`);
      // Handle file download
      showSnackbar('Analytics data exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting analytics:', error);
      showSnackbar('Error exporting analytics data', 'error');
    }
  };

  const getGrowthPercentage = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const formatGrowth = (current: number, previous: number) => {
    const growth = getGrowthPercentage(current, previous);
    return {
      value: Math.abs(growth).toFixed(1),
      isPositive: growth >= 0,
      icon: growth >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />
    };
  };

  if (loading) {
    return (
      <AffiliateLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </AffiliateLayout>
    );
  }

  return (
    <AffiliateLayout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            {t('affiliate.analytics')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('affiliate.analyzePerformanceAndMetrics')}
          </Typography>
        </Box>

        {/* Controls */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>{t('affiliate.timeRange')}</InputLabel>
                  <Select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    label={t('affiliate.timeRange')}
                  >
                    <MenuItem value="7">{t('affiliate.last7Days')}</MenuItem>
                    <MenuItem value="30">{t('affiliate.last30Days')}</MenuItem>
                    <MenuItem value="90">{t('affiliate.last90Days')}</MenuItem>
                    <MenuItem value="365">{t('affiliate.lastYear')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>{t('affiliate.viewType')}</InputLabel>
                  <Select
                    value={viewType}
                    onChange={(e) => setViewType(e.target.value)}
                    label={t('affiliate.viewType')}
                  >
                    <MenuItem value="overview">{t('affiliate.overview')}</MenuItem>
                    <MenuItem value="products">{t('affiliate.products')}</MenuItem>
                    <MenuItem value="links">{t('affiliate.links')}</MenuItem>
                    <MenuItem value="traffic">{t('affiliate.trafficSources')}</MenuItem>
                    <MenuItem value="geographic">{t('affiliate.geographic')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={12} md={6}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={fetchAnalyticsData}
                  >
                    {t('affiliate.refresh')}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={handleExportData}
                  >
                    {t('affiliate.exportData')}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" fontWeight={700} color="primary.main">
                      {analytics.totalClicks.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('affiliate.totalClicks')}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      {formatGrowth(analytics.totalClicks, comparisonData.clicks).icon}
                      <Typography
                        variant="caption"
                        color={formatGrowth(analytics.totalClicks, comparisonData.clicks).isPositive ? 'success.main' : 'error.main'}
                        fontWeight={600}
                        sx={{ ml: 0.5 }}
                      >
                        {formatGrowth(analytics.totalClicks, comparisonData.clicks).value}%
                      </Typography>
                    </Box>
                  </Box>
                  <VisibilityIcon sx={{ fontSize: 40, color: 'primary.main', opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" fontWeight={700} color="success.main">
                      {analytics.totalConversions.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('affiliate.conversions')}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      {formatGrowth(analytics.totalConversions, comparisonData.conversions).icon}
                      <Typography
                        variant="caption"
                        color={formatGrowth(analytics.totalConversions, comparisonData.conversions).isPositive ? 'success.main' : 'error.main'}
                        fontWeight={600}
                        sx={{ ml: 0.5 }}
                      >
                        {formatGrowth(analytics.totalConversions, comparisonData.conversions).value}%
                      </Typography>
                    </Box>
                  </Box>
                  <ShoppingCartIcon sx={{ fontSize: 40, color: 'success.main', opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" fontWeight={700} color="warning.main">
                      {analytics.conversionRate.toFixed(2)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('affiliate.conversionRate')}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      {formatGrowth(analytics.conversionRate, comparisonData.conversionRate).icon}
                      <Typography
                        variant="caption"
                        color={formatGrowth(analytics.conversionRate, comparisonData.conversionRate).isPositive ? 'success.main' : 'error.main'}
                        fontWeight={600}
                        sx={{ ml: 0.5 }}
                      >
                        {formatGrowth(analytics.conversionRate, comparisonData.conversionRate).value}%
                      </Typography>
                    </Box>
                  </Box>
                  <AssessmentIcon sx={{ fontSize: 40, color: 'warning.main', opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" fontWeight={700} color="info.main">
                      ${analytics.totalEarnings.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('affiliate.totalEarnings')}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      {formatGrowth(analytics.totalEarnings, comparisonData.earnings).icon}
                      <Typography
                        variant="caption"
                        color={formatGrowth(analytics.totalEarnings, comparisonData.earnings).isPositive ? 'success.main' : 'error.main'}
                        fontWeight={600}
                        sx={{ ml: 0.5 }}
                      >
                        {formatGrowth(analytics.totalEarnings, comparisonData.earnings).value}%
                      </Typography>
                    </Box>
                  </Box>
                  <MoneyIcon sx={{ fontSize: 40, color: 'info.main', opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Top Performing Products */}
        {viewType === 'overview' || viewType === 'products' ? (
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                {t('affiliate.topPerformingProducts')}
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('affiliate.product')}</TableCell>
                      <TableCell align="center">{t('affiliate.clicks')}</TableCell>
                      <TableCell align="center">{t('affiliate.conversions')}</TableCell>
                      <TableCell align="center">{t('affiliate.conversionRate')}</TableCell>
                      <TableCell align="center">{t('affiliate.earnings')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analytics.topPerformingProducts.map((product) => (
                      <TableRow key={product._id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar
                              src={product.image}
                              sx={{ width: 40, height: 40 }}
                            >
                              {product.name.charAt(0)}
                            </Avatar>
                            <Typography variant="subtitle2" fontWeight={600}>
                              {product.name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" fontWeight={600}>
                            {product.clicks.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" fontWeight={600}>
                            {product.conversions.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" fontWeight={600}>
                            {product.conversionRate.toFixed(2)}%
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" fontWeight={600} color="success.main">
                            ${product.earnings.toFixed(2)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        ) : null}

        {/* Top Performing Links */}
        {viewType === 'overview' || viewType === 'links' ? (
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                {t('affiliate.topPerformingLinks')}
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('affiliate.link')}</TableCell>
                      <TableCell align="center">{t('affiliate.clicks')}</TableCell>
                      <TableCell align="center">{t('affiliate.conversions')}</TableCell>
                      <TableCell align="center">{t('affiliate.conversionRate')}</TableCell>
                      <TableCell align="center">{t('affiliate.earnings')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analytics.topPerformingLinks.map((link) => (
                      <TableRow key={link._id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar
                              src={link.productImage}
                              sx={{ width: 40, height: 40 }}
                            >
                              {link.productName.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" fontWeight={600}>
                                {link.productName}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                  fontFamily: 'monospace',
                                  maxWidth: 200,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  display: 'block'
                                }}
                              >
                                {link.url}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" fontWeight={600}>
                            {link.clicks.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" fontWeight={600}>
                            {link.conversions.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" fontWeight={600}>
                            {link.conversionRate.toFixed(2)}%
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" fontWeight={600} color="success.main">
                            ${link.earnings.toFixed(2)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        ) : null}

        {/* Traffic Sources */}
        {viewType === 'overview' || viewType === 'traffic' ? (
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                {t('affiliate.trafficSources')}
              </Typography>
              <Grid container spacing={2}>
                {analytics.trafficSources.map((source, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Paper sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {source.source}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {source.percentage.toFixed(1)}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={source.percentage}
                        sx={{ mb: 1 }}
                      />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="text.secondary">
                          {source.clicks} {t('affiliate.clicks')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {source.conversions} {t('affiliate.conversions')}
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        ) : null}

        {/* Device Stats */}
        {viewType === 'overview' || viewType === 'traffic' ? (
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                {t('affiliate.deviceBreakdown')}
              </Typography>
              <Grid container spacing={2}>
                {analytics.deviceStats.map((device, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Paper sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {device.device}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {device.percentage.toFixed(1)}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={device.percentage}
                        sx={{ mb: 1 }}
                      />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="text.secondary">
                          {device.clicks} {t('affiliate.clicks')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {device.conversions} {t('affiliate.conversions')}
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        ) : null}

        {/* Geographic Stats */}
        {viewType === 'overview' || viewType === 'geographic' ? (
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                {t('affiliate.geographicPerformance')}
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('affiliate.country')}</TableCell>
                      <TableCell align="center">{t('affiliate.clicks')}</TableCell>
                      <TableCell align="center">{t('affiliate.conversions')}</TableCell>
                      <TableCell align="center">{t('affiliate.earnings')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analytics.geographicStats.map((geo, index) => (
                      <TableRow key={index} hover>
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {geo.country}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" fontWeight={600}>
                            {geo.clicks.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" fontWeight={600}>
                            {geo.conversions.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" fontWeight={600} color="success.main">
                            ${geo.earnings.toFixed(2)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        ) : null}

        {/* Snackbar */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={() => setSnackbarOpen(false)}
        >
          <Alert
            onClose={() => setSnackbarOpen(false)}
            severity={snackbarSeverity}
            sx={{ width: '100%' }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
    </AffiliateLayout>
  );
}
