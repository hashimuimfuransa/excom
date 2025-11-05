"use client";
import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Container,
  Grid,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  LinearProgress,
  Alert,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  IconButton,
  Tooltip,
  CircularProgress,
  Tab,
  Tabs
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Analytics,
  Insights,
  Lightbulb,
  Warning,
  CheckCircle,
  Refresh,
  Download,
  Share,
  Timeline,
  BarChart,
  PieChart,
  Assessment,
  MonetizationOn,
  ShoppingCart,
  Category
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart as RechartsBarChart, Bar, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import { apiGet } from '@utils/api';
import VendorLayout from '@components/VendorLayout';
import { useTranslation } from 'react-i18next';

interface TrendAnalysisData {
  vendorId: string;
  timeRange: string;
  analysis: {
    summary: {
      totalRevenue: number;
      totalOrders: number;
      averageOrderValue: number;
      growthRate: number;
      topPerformingCategory: string;
      topPerformingProduct: string;
    };
    trends: {
      salesTrend: 'increasing' | 'decreasing' | 'stable';
      categoryTrends: Array<{
        category: string;
        sales: number;
        growth: number;
        trend: 'up' | 'down' | 'stable';
      }>;
      productTrends: Array<{
        productId: string;
        productName: string;
        sales: number;
        growth: number;
        trend: 'up' | 'down' | 'stable';
      }>;
    };
    insights: {
      topInsights: Array<{
        type: 'opportunity' | 'warning' | 'success' | 'recommendation';
        title: string;
        description: string;
        impact: 'high' | 'medium' | 'low';
        actionable: boolean;
      }>;
      seasonalPatterns: string;
      customerBehavior: string;
      marketPosition: string;
    };
    recommendations: {
      pricing: Array<{
        productId: string;
        currentPrice: number;
        suggestedPrice: number;
        reason: string;
        expectedImpact: string;
      }>;
      inventory: Array<{
        productId: string;
        action: 'increase' | 'decrease' | 'maintain';
        reason: string;
        priority: 'high' | 'medium' | 'low';
      }>;
      marketing: Array<{
        strategy: string;
        targetProducts: string[];
        expectedOutcome: string;
        effort: 'low' | 'medium' | 'high';
      }>;
    };
    forecasting: {
      nextPeriodPrediction: {
        expectedRevenue: number;
        expectedOrders: number;
        confidence: 'high' | 'medium' | 'low';
      };
      riskFactors: string[];
      opportunities: string[];
    };
  };
  generatedAt: string;
  dataPoints: {
    currentPeriodOrders: number;
    previousPeriodOrders: number;
    totalProducts: number;
  };
}

interface PerformanceInsightsData {
  timeRange: string;
  summary: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    totalProducts: number;
  };
  topProducts: Array<{
    productId: string;
    productName: string;
    category: string;
    sales: number;
    revenue: number;
  }>;
  topCategories: Array<{
    category: string;
    sales: number;
    revenue: number;
  }>;
  salesByProduct: any[];
  salesByCategory: any[];
}

export default function TrendAnalysisPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [trendAnalysis, setTrendAnalysis] = useState<TrendAnalysisData | null>(null);
  const [performanceInsights, setPerformanceInsights] = useState<PerformanceInsightsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    fetchTrendAnalysis();
  }, [timeRange]);

  const fetchTrendAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch both AI-powered trend analysis and basic performance insights
      const [trendResponse, performanceResponse] = await Promise.all([
        apiGet<{ success: boolean; data: TrendAnalysisData }>(`/sellers/trend-analysis?timeRange=${timeRange}`).catch(() => null),
        apiGet<{ success: boolean; data: PerformanceInsightsData }>(`/sellers/performance-insights?timeRange=${timeRange}`)
      ]);

      if (trendResponse?.success) {
        setTrendAnalysis(trendResponse.data);
      }

      if (performanceResponse?.success) {
        setPerformanceInsights(performanceResponse.data);
      }

    } catch (error) {
      console.error('Error fetching trend analysis:', error);
      setError('Failed to load trend analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTrendAnalysis();
    setRefreshing(false);
  };

  const getTrendIcon = (trend: 'increasing' | 'decreasing' | 'stable' | 'up' | 'down') => {
    switch (trend) {
      case 'increasing':
      case 'up':
        return <TrendingUp color="success" />;
      case 'decreasing':
      case 'down':
        return <TrendingDown color="error" />;
      default:
        return <TrendingFlat color="info" />;
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity':
        return <Lightbulb color="warning" />;
      case 'warning':
        return <Warning color="error" />;
      case 'success':
        return <CheckCircle color="success" />;
      case 'recommendation':
        return <Insights color="info" />;
      default:
        return <Analytics />;
    }
  };

  const getInsightColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'RWF'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <VendorLayout>
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress size={60} />
          </Box>
        </Container>
      </VendorLayout>
    );
  }

  return (
    <VendorLayout>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              {t('vendor.trendAnalysis')}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t('vendor.trendAnalysisDescription')}
            </Typography>
          </Box>
          <Box display="flex" gap={2} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>{t('vendor.timeRange')}</InputLabel>
              <Select
                value={timeRange}
                label={t('vendor.timeRange')}
                onChange={(e) => setTimeRange(e.target.value as any)}
              >
                <MenuItem value="week">{t('vendor.week')}</MenuItem>
                <MenuItem value="month">{t('vendor.month')}</MenuItem>
                <MenuItem value="quarter">{t('vendor.quarter')}</MenuItem>
                <MenuItem value="year">{t('vendor.year')}</MenuItem>
              </Select>
            </FormControl>
            <Tooltip title={t('vendor.refresh')}>
              <IconButton onClick={handleRefresh} disabled={refreshing}>
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab icon={<Analytics />} label={t('vendor.aiAnalysis')} />
            <Tab icon={<Assessment />} label={t('vendor.performanceInsights')} />
          </Tabs>
        </Paper>

        {/* AI-Powered Trend Analysis Tab */}
        {activeTab === 0 && trendAnalysis && (
          <Grid container spacing={3}>
            {/* Summary Cards */}
            <Grid item xs={12}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box>
                          <Typography color="text.secondary" gutterBottom>
                            {t('vendor.totalRevenue')}
                          </Typography>
                          <Typography variant="h5">
                            {formatCurrency(trendAnalysis.analysis.summary.totalRevenue)}
                          </Typography>
                          <Box display="flex" alignItems="center" mt={1}>
                            {getTrendIcon(trendAnalysis.analysis.trends.salesTrend)}
                            <Typography variant="body2" color="text.secondary" ml={1}>
                              {formatPercentage(trendAnalysis.analysis.summary.growthRate)}
                            </Typography>
                          </Box>
                        </Box>
                        <MonetizationOn color="primary" />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box>
                          <Typography color="text.secondary" gutterBottom>
                            {t('vendor.totalOrders')}
                          </Typography>
                          <Typography variant="h5">
                            {trendAnalysis.analysis.summary.totalOrders}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" mt={1}>
                            {t('vendor.averageOrderValue')}: {formatCurrency(trendAnalysis.analysis.summary.averageOrderValue)}
                          </Typography>
                        </Box>
                        <ShoppingCart color="primary" />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box>
                          <Typography color="text.secondary" gutterBottom>
                            {t('vendor.topCategory')}
                          </Typography>
                          <Typography variant="h6">
                            {trendAnalysis.analysis.summary.topPerformingCategory}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" mt={1}>
                            {t('vendor.topProduct')}: {trendAnalysis.analysis.summary.topPerformingProduct}
                          </Typography>
                        </Box>
                        <Category color="primary" />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box>
                          <Typography color="text.secondary" gutterBottom>
                            {t('vendor.nextPeriodForecast')}
                          </Typography>
                          <Typography variant="h6">
                            {formatCurrency(trendAnalysis.analysis.forecasting.nextPeriodPrediction.expectedRevenue)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" mt={1}>
                            {t('vendor.confidence')}: {trendAnalysis.analysis.forecasting.nextPeriodPrediction.confidence}
                          </Typography>
                        </Box>
                        <Timeline color="primary" />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Grid>

            {/* AI Insights */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {t('vendor.aiInsights')}
                  </Typography>
                  <List>
                    {trendAnalysis.analysis.insights.topInsights.map((insight, index) => (
                      <React.Fragment key={index}>
                        <ListItem>
                          <ListItemIcon>
                            {getInsightIcon(insight.type)}
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box display="flex" alignItems="center" gap={1}>
                                <Typography variant="subtitle1">
                                  {insight.title}
                                </Typography>
                                <Chip 
                                  label={insight.impact} 
                                  size="small" 
                                  color={getInsightColor(insight.impact) as any}
                                />
                              </Box>
                            }
                            secondary={insight.description}
                          />
                        </ListItem>
                        {index < trendAnalysis.analysis.insights.topInsights.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Recommendations */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {t('vendor.recommendations')}
                  </Typography>
                  
                  {/* Pricing Recommendations */}
                  {trendAnalysis.analysis.recommendations.pricing.length > 0 && (
                    <Box mb={3}>
                      <Typography variant="subtitle2" gutterBottom>
                        {t('vendor.pricingRecommendations')}
                      </Typography>
                      {trendAnalysis.analysis.recommendations.pricing.slice(0, 3).map((rec, index) => (
                        <Paper key={index} sx={{ p: 2, mb: 1 }}>
                          <Typography variant="body2">
                            <strong>{rec.productId}:</strong> {formatCurrency(rec.currentPrice)} → {formatCurrency(rec.suggestedPrice)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {rec.reason}
                          </Typography>
                        </Paper>
                      ))}
                    </Box>
                  )}

                  {/* Marketing Recommendations */}
                  {trendAnalysis.analysis.recommendations.marketing.length > 0 && (
                    <Box mb={3}>
                      <Typography variant="subtitle2" gutterBottom>
                        {t('vendor.marketingRecommendations')}
                      </Typography>
                      {trendAnalysis.analysis.recommendations.marketing.slice(0, 2).map((rec, index) => (
                        <Paper key={index} sx={{ p: 2, mb: 1 }}>
                          <Typography variant="body2">
                            <strong>{rec.strategy}</strong>
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {rec.expectedOutcome}
                          </Typography>
                        </Paper>
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Product Trends Chart */}
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {t('vendor.productTrends')}
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsBarChart data={trendAnalysis.analysis.trends.productTrends.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="productName" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <RechartsTooltip formatter={(value) => [value, t('vendor.sales')]} />
                      <Bar dataKey="sales" fill="#8884d8" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Category Performance */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {t('vendor.categoryPerformance')}
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={trendAnalysis.analysis.trends.categoryTrends}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ category, sales }) => `${category}: ${sales}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="sales"
                      >
                        {trendAnalysis.analysis.trends.categoryTrends.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`hsl(${index * 60}, 70%, 50%)`} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Performance Insights Tab */}
        {activeTab === 1 && performanceInsights && (
          <Grid container spacing={3}>
            {/* Basic Metrics */}
            <Grid item xs={12}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="text.secondary" gutterBottom>
                        {t('vendor.totalRevenue')}
                      </Typography>
                      <Typography variant="h5">
                        {formatCurrency(performanceInsights.summary.totalRevenue)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="text.secondary" gutterBottom>
                        {t('vendor.totalOrders')}
                      </Typography>
                      <Typography variant="h5">
                        {performanceInsights.summary.totalOrders}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="text.secondary" gutterBottom>
                        {t('vendor.averageOrderValue')}
                      </Typography>
                      <Typography variant="h5">
                        {formatCurrency(performanceInsights.summary.averageOrderValue)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="text.secondary" gutterBottom>
                        {t('vendor.totalProducts')}
                      </Typography>
                      <Typography variant="h5">
                        {performanceInsights.summary.totalProducts}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Grid>

            {/* Top Products */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {t('vendor.topProducts')}
                  </Typography>
                  <List>
                    {performanceInsights.topProducts.map((product, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={product.productName}
                          secondary={`${product.sales} sales • ${formatCurrency(product.revenue)}`}
                        />
                        <Chip label={product.category} size="small" />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Top Categories */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {t('vendor.topCategories')}
                  </Typography>
                  <List>
                    {performanceInsights.topCategories.map((category, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={category.category}
                          secondary={`${category.sales} sales • ${formatCurrency(category.revenue)}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Footer */}
        <Box mt={4} textAlign="center">
          <Typography variant="body2" color="text.secondary">
            {trendAnalysis && `Last updated: ${new Date(trendAnalysis.generatedAt).toLocaleString()}`}
          </Typography>
        </Box>
      </Container>
    </VendorLayout>
  );
}
