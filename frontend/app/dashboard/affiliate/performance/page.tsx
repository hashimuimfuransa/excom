'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Avatar,
  Alert,
  Snackbar
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  EmojiEvents as TrophyIcon,
  Target as TargetIcon,
  Star as StarIcon,
  Assessment as AssessmentIcon,
  Psychology as PsychologyIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import AffiliateLayout from '@/components/AffiliateLayout';
import { apiGet } from '@/utils/api';

interface PerformanceData {
  overallScore: number;
  rank: number;
  totalAffiliates: number;
  percentile: number;
  monthlyGrowth: number;
  quarterlyGrowth: number;
  yearlyGrowth: number;
  keyMetrics: {
    clickThroughRate: number;
    conversionRate: number;
    averageOrderValue: number;
    customerLifetimeValue: number;
    returnCustomerRate: number;
    socialMediaEngagement: number;
  };
  achievements: Array<{
    _id: string;
    title: string;
    description: string;
    icon: string;
    earnedDate: string;
    points: number;
    category: string;
  }>;
  goals: Array<{
    _id: string;
    title: string;
    description: string;
    target: number;
    current: number;
    unit: string;
    deadline: string;
    status: string;
    category: string;
  }>;
  topProducts: Array<{
    _id: string;
    name: string;
    image: string;
    performance: number;
    clicks: number;
    conversions: number;
    earnings: number;
  }>;
  competitorAnalysis: Array<{
    name: string;
    score: number;
    clicks: number;
    conversions: number;
    earnings: number;
    rank: number;
  }>;
  recommendations: Array<{
    _id: string;
    title: string;
    description: string;
    priority: string;
    category: string;
    impact: string;
  }>;
}

export default function AffiliatePerformancePage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [performance, setPerformance] = useState<PerformanceData>({
    overallScore: 0,
    rank: 0,
    totalAffiliates: 0,
    percentile: 0,
    monthlyGrowth: 0,
    quarterlyGrowth: 0,
    yearlyGrowth: 0,
    keyMetrics: {
      clickThroughRate: 0,
      conversionRate: 0,
      averageOrderValue: 0,
      customerLifetimeValue: 0,
      returnCustomerRate: 0,
      socialMediaEngagement: 0
    },
    achievements: [],
    goals: [],
    topProducts: [],
    competitorAnalysis: [],
    recommendations: []
  });
  const [activeTab, setActiveTab] = useState(0);
  const [timeRange, setTimeRange] = useState('30');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  useEffect(() => {
    fetchPerformanceData();
  }, [timeRange]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      const response = await apiGet(`/affiliate/performance?period=${timeRange}`);
      setPerformance(response.data || performance);
    } catch (error) {
      console.error('Error fetching performance data:', error);
      showSnackbar('Error fetching performance data', 'error');
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
      const response = await apiGet(`/affiliate/performance/export?period=${timeRange}`);
      console.log('Export data:', response.data);
      showSnackbar('Data exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting performance data:', error);
      showSnackbar('Error exporting performance data', 'error');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'success.main';
    if (score >= 60) return 'warning.main';
    return 'error.main';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Very Good';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Average';
    return 'Needs Improvement';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
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
            {t('affiliate.performance')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('affiliate.trackPerformanceMetrics')}
          </Typography>
        </Box>

        {/* Controls */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={fetchPerformanceData}
                  fullWidth
                >
                  {t('affiliate.refresh')}
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={handleExportData}
                  fullWidth
                >
                  {t('affiliate.exportData')}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Performance Overview */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h2" fontWeight={700} color={getScoreColor(performance.overallScore)}>
                    {performance.overallScore}
                  </Typography>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    {t('affiliate.overallScore')}
                  </Typography>
                  <Chip
                    label={getScoreLabel(performance.overallScore)}
                    color={performance.overallScore >= 80 ? 'success' : performance.overallScore >= 60 ? 'warning' : 'error'}
                    sx={{ mb: 2 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {t('affiliate.rankedOutOf')} {performance.totalAffiliates} {t('affiliate.affiliate')}s
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Top {performance.percentile}% {t('affiliate.topPercentPerformers')}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  {t('affiliate.growthTrends')}
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">{t('affiliate.monthly')}</Typography>
                    <Typography variant="body2" fontWeight={600} color={performance.monthlyGrowth >= 0 ? 'success.main' : 'error.main'}>
                      {performance.monthlyGrowth >= 0 ? '+' : ''}{performance.monthlyGrowth.toFixed(1)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(Math.abs(performance.monthlyGrowth), 100)}
                    color={performance.monthlyGrowth >= 0 ? 'success' : 'error'}
                  />
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">{t('affiliate.quarterly')}</Typography>
                    <Typography variant="body2" fontWeight={600} color={performance.quarterlyGrowth >= 0 ? 'success.main' : 'error.main'}>
                      {performance.quarterlyGrowth >= 0 ? '+' : ''}{performance.quarterlyGrowth.toFixed(1)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(Math.abs(performance.quarterlyGrowth), 100)}
                    color={performance.quarterlyGrowth >= 0 ? 'success' : 'error'}
                  />
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">{t('affiliate.yearly')}</Typography>
                    <Typography variant="body2" fontWeight={600} color={performance.yearlyGrowth >= 0 ? 'success.main' : 'error.main'}>
                      {performance.yearlyGrowth >= 0 ? '+' : ''}{performance.yearlyGrowth.toFixed(1)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(Math.abs(performance.yearlyGrowth), 100)}
                    color={performance.yearlyGrowth >= 0 ? 'success' : 'error'}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  {t('affiliate.keyMetrics')}
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    {t('affiliate.clickThroughRate')}
                  </Typography>
                  <Typography variant="h6" fontWeight={600}>
                    {performance.keyMetrics.clickThroughRate.toFixed(2)}%
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    {t('affiliate.conversionRate')}
                  </Typography>
                  <Typography variant="h6" fontWeight={600}>
                    {performance.keyMetrics.conversionRate.toFixed(2)}%
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    {t('affiliate.averageOrderValue')}
                  </Typography>
                  <Typography variant="h6" fontWeight={600}>
                    ${performance.keyMetrics.averageOrderValue.toFixed(2)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {t('affiliate.customerLifetimeValue')}
                  </Typography>
                  <Typography variant="h6" fontWeight={600}>
                    ${performance.keyMetrics.customerLifetimeValue.toFixed(2)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Card>
          <CardContent>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant={activeTab === 0 ? 'contained' : 'outlined'}
                  startIcon={<TrophyIcon />}
                  onClick={() => setActiveTab(0)}
                >
                  {t('affiliate.achievements')}
                </Button>
                <Button
                  variant={activeTab === 1 ? 'contained' : 'outlined'}
                  startIcon={<TargetIcon />}
                  onClick={() => setActiveTab(1)}
                >
                  {t('affiliate.goals')}
                </Button>
                <Button
                  variant={activeTab === 2 ? 'contained' : 'outlined'}
                  startIcon={<StarIcon />}
                  onClick={() => setActiveTab(2)}
                >
                  {t('affiliate.topProducts')}
                </Button>
                <Button
                  variant={activeTab === 3 ? 'contained' : 'outlined'}
                  startIcon={<AssessmentIcon />}
                  onClick={() => setActiveTab(3)}
                >
                  {t('affiliate.competitorAnalysis')}
                </Button>
                <Button
                  variant={activeTab === 4 ? 'contained' : 'outlined'}
                  startIcon={<PsychologyIcon />}
                  onClick={() => setActiveTab(4)}
                >
                  {t('affiliate.recommendations')}
                </Button>
              </Box>
            </Box>

            {/* Achievements Tab */}
            {activeTab === 0 && (
              <Box>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  {t('affiliate.yourAchievements')}
                </Typography>
                <Grid container spacing={2}>
                  {performance.achievements.map((achievement) => (
                    <Grid item xs={12} sm={6} md={4} key={achievement._id}>
                      <Card>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                              <TrophyIcon />
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle1" fontWeight={600}>
                                {achievement.title}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {achievement.description}
                              </Typography>
                              <Typography variant="caption" color="primary">
                                {achievement.points} {t('affiliate.points')}
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {/* Goals Tab */}
            {activeTab === 1 && (
              <Box>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  {t('affiliate.yourGoals')}
                </Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('affiliate.goal')}</TableCell>
                        <TableCell align="center">{t('affiliate.progress')}</TableCell>
                        <TableCell align="center">{t('affiliate.target')}</TableCell>
                        <TableCell align="center">{t('affiliate.deadline')}</TableCell>
                        <TableCell align="center">{t('affiliate.status')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {performance.goals.map((goal) => (
                        <TableRow key={goal._id}>
                          <TableCell>
                            <Typography variant="subtitle2" fontWeight={600}>
                              {goal.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {goal.description}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ minWidth: 100 }}>
                              <LinearProgress
                                variant="determinate"
                                value={(goal.current / goal.target) * 100}
                                sx={{ mb: 1 }}
                              />
                              <Typography variant="body2">
                                {goal.current} / {goal.target} {goal.unit}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" fontWeight={600}>
                              {goal.target} {goal.unit}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">
                              {new Date(goal.deadline).toLocaleDateString()}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={goal.status}
                              color={goal.status === 'completed' ? 'success' : goal.status === 'active' ? 'primary' : 'default'}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* Top Products Tab */}
            {activeTab === 2 && (
              <Box>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  {t('affiliate.topPerformingProducts')}
                </Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('affiliate.product')}</TableCell>
                        <TableCell align="center">{t('affiliate.performanceScore')}</TableCell>
                        <TableCell align="center">{t('affiliate.clicks')}</TableCell>
                        <TableCell align="center">{t('affiliate.conversions')}</TableCell>
                        <TableCell align="center">{t('affiliate.earnings')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {performance.topProducts.map((product) => (
                        <TableRow key={product._id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar src={product.image} variant="rounded" />
                              <Typography variant="subtitle2" fontWeight={600}>
                                {product.name}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              color={getScoreColor(product.performance)}
                            >
                              {product.performance}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" fontWeight={600}>
                              {product.clicks}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" fontWeight={600}>
                              {product.conversions}
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
              </Box>
            )}

            {/* Competitor Analysis Tab */}
            {activeTab === 3 && (
              <Box>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  {t('affiliate.competitorAnalysis')}
                </Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('affiliate.affiliate')}</TableCell>
                        <TableCell align="center">{t('affiliate.rank')}</TableCell>
                        <TableCell align="center">{t('affiliate.score')}</TableCell>
                        <TableCell align="center">{t('affiliate.clicks')}</TableCell>
                        <TableCell align="center">{t('affiliate.conversions')}</TableCell>
                        <TableCell align="center">{t('affiliate.earnings')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {performance.competitorAnalysis.map((competitor, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Typography variant="subtitle2" fontWeight={600}>
                              {competitor.name}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={`#${competitor.rank}`}
                              color="primary"
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              color={getScoreColor(competitor.score)}
                            >
                              {competitor.score}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" fontWeight={600}>
                              {competitor.clicks}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" fontWeight={600}>
                              {competitor.conversions}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" fontWeight={600} color="success.main">
                              ${competitor.earnings.toFixed(2)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* Recommendations Tab */}
            {activeTab === 4 && (
              <Box>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  {t('affiliate.performanceRecommendations')}
                </Typography>
                <Grid container spacing={2}>
                  {performance.recommendations.map((recommendation) => (
                    <Grid item xs={12} md={6} key={recommendation._id}>
                      <Card>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                              <PsychologyIcon />
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Typography variant="subtitle1" fontWeight={600}>
                                  {recommendation.title}
                                </Typography>
                                <Chip
                                  label={recommendation.priority}
                                  color={getPriorityColor(recommendation.priority)}
                                  size="small"
                                />
                              </Box>
                              <Typography variant="body2" color="text.secondary" paragraph>
                                {recommendation.description}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Chip
                                  label={recommendation.category}
                                  variant="outlined"
                                  size="small"
                                />
                                <Chip
                                  label={recommendation.impact}
                                  color="info"
                                  size="small"
                                />
                              </Box>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </CardContent>
        </Card>

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
