'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/utils/auth';
import { apiGet, apiPost } from '@/utils/api';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Button,
  IconButton,
  Divider,
  Alert,
  CircularProgress,
  useTheme,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip
} from '@mui/material';
import { 
  People,
  AttachMoney,
  Visibility,
  ShoppingCart,
  TrendingUp,
  Warning,
  CheckCircle,
  AccessTime,
  Cancel,
  Refresh,
  Block
} from '@mui/icons-material';
import AdminLayout from '@/components/admin/AdminLayout';

interface GlobalStats {
  totalAffiliates: number;
  activeAffiliates: number;
  pendingAffiliates: number;
  totalClicks: number;
  totalConversions: number;
  totalCommissions: number;
  platformRevenue: number;
  conversionRate: number;
}

interface TopVendor {
  _id: string;
  name: string;
  email: string;
  affiliateCount: number;
  totalCommissions: number;
  platformRevenue: number;
}

interface SuspiciousActivity {
  _id: string;
  affiliate: {
    _id: string;
    referralCode: string;
    user: {
      name: string;
      email: string;
    };
  };
  vendor: {
    name: string;
  };
  suspiciousClicks: number;
  suspiciousConversions: number;
  riskScore: number;
  lastActivity: string;
}

interface AffiliatePayoutRequest {
  _id: string;
  affiliate: {
    _id: string;
    user: {
      _id: string;
      name: string;
      email: string;
    };
    referralCode: string;
  };
  vendor: {
    _id: string;
    name: string;
    email: string;
  };
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  requestedAt: string;
  approvedAt?: string;
  paidAt?: string;
  paymentMethod: string;
  paymentDetails: any;
  notes?: string;
}

export default function AdminAffiliatePage() {
  const { user } = useAuth();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [stats, setStats] = useState<GlobalStats>({
    totalAffiliates: 0,
    activeAffiliates: 0,
    pendingAffiliates: 0,
    totalClicks: 0,
    totalConversions: 0,
    totalCommissions: 0,
    platformRevenue: 0,
    conversionRate: 0
  });
  const [topVendors, setTopVendors] = useState<TopVendor[]>([]);
  const [suspiciousActivities, setSuspiciousActivities] = useState<SuspiciousActivity[]>([]);
  const [affiliatePrograms, setAffiliatePrograms] = useState<AffiliateProgram[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<AffiliatePayoutRequest[]>([]);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const token = localStorage.getItem('excom_token');
      
      if (!token) {
        setError('No authentication token found. Please log in again.');
        return;
      }
      
      // Fetch global stats
      try {
        const statsData = await apiGet('/admin/affiliate/stats', token);
        setStats(statsData);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        if (error instanceof Error && error.message.includes('401')) {
          setError('Authentication failed. Please log in again.');
          return;
        }
      }

      // Fetch top vendors
      try {
        const vendorsData = await apiGet('/admin/affiliate/top-vendors', token);
        setTopVendors(vendorsData);
      } catch (error) {
        console.error('Failed to fetch top vendors:', error);
      }

      // Fetch suspicious activities
      try {
        const suspiciousData = await apiGet('/admin/affiliate/suspicious', token);
        setSuspiciousActivities(suspiciousData);
      } catch (error) {
        console.error('Failed to fetch suspicious activities:', error);
      }

      // Fetch affiliate programs
      try {
        const programsData = await apiGet('/admin/affiliate/programs', token);
        setAffiliatePrograms(programsData);
      } catch (error) {
        console.error('Failed to fetch affiliate programs:', error);
      }

      // Fetch payout requests
      try {
        const payoutData = await apiGet('/admin/affiliate/payout-requests', token);
        setPayoutRequests(payoutData);
      } catch (error) {
        console.error('Failed to fetch payout requests:', error);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
      setError('Failed to load affiliate data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getRiskColor = (riskScore: number) => {
    if (riskScore >= 80) return 'error';
    if (riskScore >= 60) return 'warning';
    if (riskScore >= 40) return 'info';
    return 'success';
  };

  const getRiskLabel = (riskScore: number) => {
    if (riskScore >= 80) return 'High Risk';
    if (riskScore >= 60) return 'Medium Risk';
    if (riskScore >= 40) return 'Low Risk';
    return 'Safe';
  };

  const handleInvestigateAffiliate = async (affiliateId: string) => {
    try {
      const token = localStorage.getItem('excom_token');
      if (!token) return;
      
      // Here you would implement investigation logic
      console.log('Investigating affiliate:', affiliateId);
      // Could open a detailed investigation modal or redirect to investigation page
    } catch (error) {
      console.error('Error investigating affiliate:', error);
    }
  };

  const handleApprovePayout = async (requestId: string) => {
    try {
      const token = localStorage.getItem('excom_token');
      if (!token) return;
      
      await apiPost(`/admin/affiliate/payout-requests/${requestId}/approve`, {}, token);
      
      // Refresh the data
      await fetchAdminData(true);
      console.log('Payout request approved successfully');
    } catch (error) {
      console.error('Error approving payout request:', error);
    }
  };

  const handleRejectPayout = async (requestId: string, reason: string) => {
    try {
      const token = localStorage.getItem('excom_token');
      if (!token) return;
      
      await apiPost(`/admin/affiliate/payout-requests/${requestId}/reject`, {
        reason
      }, token);
      
      // Refresh the data
      await fetchAdminData(true);
      console.log('Payout request rejected successfully');
    } catch (error) {
      console.error('Error rejecting payout request:', error);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '50vh',
          gap: 2
        }}>
          <CircularProgress size={60} />
          <Typography variant="h6" color="text.secondary">
            Loading affiliate data...
          </Typography>
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography 
                variant="h4" 
                fontWeight={800} 
                gutterBottom
                sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}
              >
                Affiliate Management
              </Typography>
              <Typography 
                variant="body1" 
                color="text.secondary"
                sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
              >
                Monitor global affiliate activity and detect fraud
              </Typography>
            </Box>
            <Button
              variant="outlined"
              onClick={() => fetchAdminData(true)}
              disabled={refreshing}
              startIcon={refreshing ? <CircularProgress size={16} /> : <TrendingUp />}
            >
              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </Button>
          </Box>
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
        </Box>

      {/* Global Stats */}
        <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 4 }}>
          <Grid item xs={6} sm={6} md={3}>
            <Card sx={{ 
              borderRadius: 3,
              border: 1,
              borderColor: 'divider',
              height: '100%',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                boxShadow: 2,
                transform: 'translateY(-2px)'
              }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>
                    Total Affiliates
                  </Typography>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                    <People />
                  </Avatar>
                </Box>
                <Typography variant="h4" fontWeight={800} color="primary.main" sx={{ mb: 1 }}>
                  {stats.totalAffiliates}
                </Typography>
                <Typography variant="body2" color="text.secondary">
              {stats.activeAffiliates} active
                </Typography>
          </CardContent>
        </Card>
          </Grid>

          <Grid item xs={6} sm={6} md={3}>
            <Card sx={{ 
              borderRadius: 3,
              border: 1,
              borderColor: 'divider',
              height: '100%',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                boxShadow: 2,
                transform: 'translateY(-2px)'
              }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>
                    Total Clicks
                  </Typography>
                  <Avatar sx={{ bgcolor: 'info.main', width: 40, height: 40 }}>
                    <Visibility />
                  </Avatar>
                </Box>
                <Typography variant="h4" fontWeight={800} color="info.main" sx={{ mb: 1 }}>
                  {stats.totalClicks.toLocaleString()}
                </Typography>
          </CardContent>
        </Card>
          </Grid>

          <Grid item xs={6} sm={6} md={3}>
            <Card sx={{ 
              borderRadius: 3,
              border: 1,
              borderColor: 'divider',
              height: '100%',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                boxShadow: 2,
                transform: 'translateY(-2px)'
              }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>
                    Total Conversions
                  </Typography>
                  <Avatar sx={{ bgcolor: 'success.main', width: 40, height: 40 }}>
                    <ShoppingCart />
                  </Avatar>
                </Box>
                <Typography variant="h4" fontWeight={800} color="success.main" sx={{ mb: 1 }}>
                  {stats.totalConversions}
                </Typography>
                <Typography variant="body2" color="text.secondary">
              {stats.conversionRate.toFixed(1)}% conversion rate
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={6} sm={6} md={3}>
            <Card sx={{ 
              borderRadius: 3,
              border: 1,
              borderColor: 'divider',
              height: '100%',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                boxShadow: 2,
                transform: 'translateY(-2px)'
              }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>
                    Platform Revenue
                  </Typography>
                  <Avatar sx={{ bgcolor: 'warning.main', width: 40, height: 40 }}>
                    <AttachMoney />
                  </Avatar>
                </Box>
                <Typography variant="h4" fontWeight={800} color="warning.main" sx={{ mb: 1 }}>
                  ${stats.platformRevenue.toFixed(2)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  From processing fees
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
              <Tab label="Overview" />
              <Tab label="Top Vendors" />
              <Tab label="Suspicious Activity" />
              <Tab label="Affiliate Programs" />
              <Tab label="Payout Requests" />
            </Tabs>
        </Box>

        {/* Tab Content */}
        {tabValue === 0 && (
          <Box>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Affiliate Overview
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Summary of affiliate program performance
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card sx={{ borderRadius: 3, border: 1, borderColor: 'divider' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      Affiliate Status Distribution
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />
                          <Typography variant="body2">Approved</Typography>
                        </Box>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {stats.activeAffiliates}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AccessTime sx={{ color: 'warning.main', fontSize: 20 }} />
                          <Typography variant="body2">Pending</Typography>
                        </Box>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {stats.pendingAffiliates}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card sx={{ borderRadius: 3, border: 1, borderColor: 'divider' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      Performance Metrics
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body2">Conversion Rate</Typography>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {stats.conversionRate.toFixed(1)}%
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body2">Total Commissions</Typography>
                        <Typography variant="subtitle2" fontWeight={600}>
                          ${stats.totalCommissions.toFixed(2)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Platform Revenue</Typography>
                        <Typography variant="subtitle2" fontWeight={600}>
                          ${stats.platformRevenue.toFixed(2)}
                        </Typography>
                      </Box>
                    </Box>
            </CardContent>
          </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {tabValue === 1 && (
          <Box>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Top Performing Vendors
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Vendors with the highest affiliate activity
            </Typography>
            
            <TableContainer component={Paper} sx={{ borderRadius: 3, overflow: 'hidden' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><Typography variant="subtitle2" fontWeight={700}>Vendor</Typography></TableCell>
                    <TableCell><Typography variant="subtitle2" fontWeight={700}>Affiliates</Typography></TableCell>
                    <TableCell><Typography variant="subtitle2" fontWeight={700}>Commissions</Typography></TableCell>
                    <TableCell><Typography variant="subtitle2" fontWeight={700}>Revenue</Typography></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topVendors.map((vendor) => (
                    <TableRow key={vendor._id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {vendor.name || 'N/A'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {vendor.email}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{vendor.affiliateCount}</TableCell>
                      <TableCell>${vendor.totalCommissions.toFixed(2)}</TableCell>
                      <TableCell>${vendor.platformRevenue.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {tabValue === 2 && (
          <Box>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Suspicious Activity Detection
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Monitor potential fraud and unusual patterns
            </Typography>
            
                {suspiciousActivities.length === 0 ? (
              <Card sx={{ borderRadius: 3, border: 1, borderColor: 'divider' }}>
                <CardContent sx={{ p: 6, textAlign: 'center' }}>
                  <CheckCircle sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    No Suspicious Activity
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    All affiliate activities appear to be legitimate.
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <TableContainer component={Paper} sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><Typography variant="subtitle2" fontWeight={700}>Affiliate</Typography></TableCell>
                      <TableCell><Typography variant="subtitle2" fontWeight={700}>Vendor</Typography></TableCell>
                      <TableCell><Typography variant="subtitle2" fontWeight={700}>Suspicious Clicks</Typography></TableCell>
                      <TableCell><Typography variant="subtitle2" fontWeight={700}>Risk Score</Typography></TableCell>
                      <TableCell><Typography variant="subtitle2" fontWeight={700}>Last Activity</Typography></TableCell>
                      <TableCell><Typography variant="subtitle2" fontWeight={700}>Actions</Typography></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {suspiciousActivities.map((activity) => (
                      <TableRow key={activity._id} hover>
                        <TableCell>
                          <Box>
                            <Typography variant="subtitle2" fontWeight={600}>
                              {activity.affiliate.user?.name || 'N/A'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {activity.affiliate.referralCode}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{activity.vendor?.name || 'N/A'}</TableCell>
                        <TableCell>{activity.suspiciousClicks}</TableCell>
                        <TableCell>
                          <Chip
                            label={getRiskLabel(activity.riskScore)}
                            color={getRiskColor(activity.riskScore) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AccessTime sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              {activity.lastActivity}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button 
                              size="small" 
                              variant="outlined"
                              onClick={() => handleInvestigateAffiliate(activity._id)}
                            >
                          Investigate
                        </Button>
                            <Button 
                              size="small" 
                              variant="contained" 
                              color="error"
                              onClick={() => handleBanAffiliate(activity._id)}
                            >
                          Ban Affiliate
                        </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}

        {tabValue === 3 && (
          <Box>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Affiliate Programs Overview
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Manage and monitor all affiliate programs across the platform
            </Typography>
            
            <TableContainer component={Paper} sx={{ borderRadius: 3, overflow: 'hidden' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><Typography variant="subtitle2" fontWeight={700}>Vendor</Typography></TableCell>
                    <TableCell><Typography variant="subtitle2" fontWeight={700}>Store</Typography></TableCell>
                    <TableCell><Typography variant="subtitle2" fontWeight={700}>Commission Rate</Typography></TableCell>
                    <TableCell><Typography variant="subtitle2" fontWeight={700}>Min Payout</Typography></TableCell>
                    <TableCell><Typography variant="subtitle2" fontWeight={700}>Auto Approve</Typography></TableCell>
                    <TableCell><Typography variant="subtitle2" fontWeight={700}>Status</Typography></TableCell>
                    <TableCell><Typography variant="subtitle2" fontWeight={700}>Created</Typography></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {affiliatePrograms.map((program) => (
                    <TableRow key={program._id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {program.vendor?.name || 'N/A'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {program.vendor.email}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{program.store?.name || 'N/A'}</TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {program.globalSettings.defaultCommissionRate}% {program.globalSettings.defaultCommissionType}
                        </Typography>
                      </TableCell>
                      <TableCell>${program.globalSettings.minPayoutAmount}</TableCell>
                      <TableCell>
                        <Chip
                          label={program.globalSettings.autoApproveAffiliates ? 'Yes' : 'No'}
                          color={program.globalSettings.autoApproveAffiliates ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={program.isActive ? 'Active' : 'Inactive'}
                          color={program.isActive ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(program.createdAt).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Payout Requests Tab */}
        {tabValue === 4 && (
          <Box>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Affiliate Payout Requests
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Review and manage affiliate payout requests
            </Typography>

            <TableContainer component={Paper} sx={{ 
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 2
            }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Affiliate</TableCell>
                    <TableCell>Vendor</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Payment Method</TableCell>
                    <TableCell>Requested</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payoutRequests.map((request) => (
                    <TableRow key={request._id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {request.affiliate.user?.name || 'N/A'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {request.affiliate.referralCode}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {request.vendor?.name || 'N/A'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {request.vendor?.email || 'N/A'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="h6" color="primary" fontWeight={600}>
                          ${request.amount.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {request.paymentMethod}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(request.requestedAt).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          color={
                            request.status === 'approved' ? 'success' :
                            request.status === 'rejected' ? 'error' :
                            request.status === 'paid' ? 'info' : 'warning'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {request.status === 'pending' && (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Approve Payout">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleApprovePayout(request._id)}
                              >
                                <CheckCircle />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject Payout">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleRejectPayout(request._id, 'Rejected by admin')}
                              >
                                <Cancel />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Box>
    </AdminLayout>
  );
}