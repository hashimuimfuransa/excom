'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
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
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as BankIcon,
  CreditCard as CardIcon,
  Receipt as ReceiptIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import AffiliateLayout from '@/components/AffiliateLayout';
import { apiGet, apiPost } from '@utils/api';

interface EarningsData {
  _id: string;
  orderId: string;
  productName: string;
  productImage?: string;
  vendorName: string;
  commissionRate: number;
  orderTotal: number;
  commissionAmount: number;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  orderDate: string;
  paymentDate?: string;
  paymentMethod?: string;
  transactionId?: string;
  customerEmail?: string;
  affiliateLink?: string;
}

interface EarningsStats {
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
  cancelledEarnings: number;
  thisMonthEarnings: number;
  lastMonthEarnings: number;
  totalOrders: number;
  averageOrderValue: number;
  topEarningProduct: string;
  topEarningVendor: string;
}

interface PayoutRequest {
  _id: string;
  amount: number;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  requestedDate: string;
  paymentMethod: string;
  bankDetails?: string;
  paypalEmail?: string;
}

export default function AffiliateEarningsPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState<EarningsData[]>([]);
  const [stats, setStats] = useState<EarningsStats>({
    totalEarnings: 0,
    pendingEarnings: 0,
    paidEarnings: 0,
    cancelledEarnings: 0,
    thisMonthEarnings: 0,
    lastMonthEarnings: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    topEarningProduct: '',
    topEarningVendor: ''
  });
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [requestingPayout, setRequestingPayout] = useState(false);

  useEffect(() => {
    fetchEarningsData();
    fetchPayoutRequests();
  }, []);

  const fetchEarningsData = async () => {
    try {
      setLoading(true);
      const [earningsResponse, statsResponse] = await Promise.all([
        apiGet('/affiliate/earnings'),
        apiGet('/affiliate/earnings/stats')
      ]);
      
      setEarnings(earningsResponse.data || []);
      setStats(statsResponse.data || stats);
    } catch (error) {
      console.error('Error fetching earnings data:', error);
      showSnackbar('Error fetching earnings data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchPayoutRequests = async () => {
    try {
      const response = await apiGet('/affiliate/payout-requests');
      setPayoutRequests(response.data || []);
    } catch (error) {
      console.error('Error fetching payout requests:', error);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleRequestPayout = async () => {
    if (stats.pendingEarnings < 25) {
      showSnackbar('Minimum payout amount is $25', 'error');
      return;
    }

    try {
      setRequestingPayout(true);
      const response = await apiPost('/affiliate/payout-request', {
        amount: stats.pendingEarnings
      });

      if (response.success) {
        showSnackbar('Payout request submitted successfully', 'success');
        fetchPayoutRequests();
        fetchEarningsData();
      } else {
        showSnackbar('Error submitting payout request', 'error');
      }
    } catch (error) {
      console.error('Error requesting payout:', error);
      showSnackbar('Error requesting payout', 'error');
    } finally {
      setRequestingPayout(false);
    }
  };

  const handleExportEarnings = async () => {
    try {
      const response = await apiGet('/affiliate/earnings/export');
      // Handle file download
      showSnackbar('Earnings data exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting earnings:', error);
      showSnackbar('Error exporting earnings data', 'error');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'success';
      case 'approved': return 'info';
      case 'pending': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircleIcon />;
      case 'approved': return <CheckCircleIcon />;
      case 'pending': return <PendingIcon />;
      case 'cancelled': return <CancelIcon />;
      default: return <VisibilityIcon />;
    }
  };

  const filteredEarnings = earnings.filter(earning => {
    const matchesStatus = statusFilter === 'all' || earning.status === statusFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const earningDate = new Date(earning.orderDate);
      const now = new Date();
      
      switch (dateFilter) {
        case 'today':
          matchesDate = earningDate.toDateString() === now.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = earningDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = earningDate >= monthAgo;
          break;
        case 'year':
          const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          matchesDate = earningDate >= yearAgo;
          break;
      }
    }
    
    return matchesStatus && matchesDate;
  });

  const earningsGrowth = stats.lastMonthEarnings > 0 
    ? ((stats.thisMonthEarnings - stats.lastMonthEarnings) / stats.lastMonthEarnings * 100)
    : 0;

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
            {t('affiliate.earnings')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('affiliate.trackEarningsAndPayouts')}
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" fontWeight={700} color="success.main">
                      ${stats.totalEarnings.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('affiliate.totalEarnings')}
                    </Typography>
                  </Box>
                  <MoneyIcon sx={{ fontSize: 40, color: 'success.main', opacity: 0.7 }} />
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
                      ${stats.pendingEarnings.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('affiliate.pendingEarnings')}
                    </Typography>
                  </Box>
                  <PendingIcon sx={{ fontSize: 40, color: 'warning.main', opacity: 0.7 }} />
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
                      ${stats.thisMonthEarnings.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('affiliate.thisMonth')}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      {earningsGrowth >= 0 ? (
                        <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
                      ) : (
                        <TrendingDownIcon sx={{ fontSize: 16, color: 'error.main', mr: 0.5 }} />
                      )}
                      <Typography
                        variant="caption"
                        color={earningsGrowth >= 0 ? 'success.main' : 'error.main'}
                        fontWeight={600}
                      >
                        {Math.abs(earningsGrowth).toFixed(1)}%
                      </Typography>
                    </Box>
                  </Box>
                  <TrendingUpIcon sx={{ fontSize: 40, color: 'info.main', opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" fontWeight={700} color="primary.main">
                      {stats.totalOrders}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('affiliate.totalOrders')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Avg: ${stats.averageOrderValue.toFixed(2)}
                    </Typography>
                  </Box>
                  <ReceiptIcon sx={{ fontSize: 40, color: 'primary.main', opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Payout Section */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Box>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  {t('affiliate.payoutManagement')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('affiliate.requestPayoutsForEarnings')}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={handleExportEarnings}
                >
                  {t('affiliate.exportData')}
                </Button>
                <Button
                  variant="contained"
                  startIcon={<BankIcon />}
                  onClick={handleRequestPayout}
                  disabled={stats.pendingEarnings < 25 || requestingPayout}
                >
                  {requestingPayout ? <CircularProgress size={20} /> : t('affiliate.requestPayout')}
                </Button>
              </Box>
            </Box>

            {stats.pendingEarnings < 25 && (
              <Alert severity="info" sx={{ mb: 2 }}>
                {t('affiliate.minimumPayoutAmount')} $25. {t('affiliate.youCurrentlyHave')} ${stats.pendingEarnings.toFixed(2)} {t('affiliate.pending')}.
              </Alert>
            )}

            {/* Payout Requests */}
            {payoutRequests.length > 0 && (
              <Box>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  {t('affiliate.recentPayoutRequests')}
                </Typography>
                <List>
                  {payoutRequests.slice(0, 3).map((request) => (
                    <ListItem key={request._id} divider>
                      <ListItemAvatar>
                        <Avatar>
                          <BankIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={`$${request.amount.toFixed(2)}`}
                        secondary={`${t('affiliate.requestedOn')} ${new Date(request.requestedDate).toLocaleDateString()}`}
                      />
                      <ListItemSecondaryAction>
                        <Chip
                          label={request.status}
                          color={getStatusColor(request.status)}
                          size="small"
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>{t('affiliate.status')}</InputLabel>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    label={t('affiliate.status')}
                  >
                    <MenuItem value="all">{t('affiliate.allStatus')}</MenuItem>
                    <MenuItem value="pending">{t('affiliate.pending')}</MenuItem>
                    <MenuItem value="approved">{t('affiliate.approved')}</MenuItem>
                    <MenuItem value="paid">{t('affiliate.paid')}</MenuItem>
                    <MenuItem value="cancelled">{t('affiliate.cancelled')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>{t('affiliate.dateRange')}</InputLabel>
                  <Select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    label={t('affiliate.dateRange')}
                  >
                    <MenuItem value="all">{t('affiliate.allTime')}</MenuItem>
                    <MenuItem value="today">{t('affiliate.today')}</MenuItem>
                    <MenuItem value="week">{t('affiliate.thisWeek')}</MenuItem>
                    <MenuItem value="month">{t('affiliate.thisMonth')}</MenuItem>
                    <MenuItem value="year">{t('affiliate.thisYear')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={12} md={6}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={fetchEarningsData}
                  >
                    {t('affiliate.refresh')}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Earnings Table */}
        <Card>
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('affiliate.product')}</TableCell>
                    <TableCell>{t('affiliate.orderDetails')}</TableCell>
                    <TableCell align="center">{t('affiliate.commissionRate')}</TableCell>
                    <TableCell align="center">{t('affiliate.orderTotal')}</TableCell>
                    <TableCell align="center">{t('affiliate.commission')}</TableCell>
                    <TableCell align="center">{t('affiliate.status')}</TableCell>
                    <TableCell align="center">{t('affiliate.date')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredEarnings.map((earning) => (
                    <TableRow key={earning._id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar
                            src={earning.productImage}
                            sx={{ width: 40, height: 40 }}
                          >
                            {earning.productName.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" fontWeight={600}>
                              {earning.productName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {earning.vendorName}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {t('affiliate.order')} #{earning.orderId}
                            </Typography>
                          {earning.customerEmail && (
                            <Typography variant="caption" color="text.secondary">
                              {earning.customerEmail}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      
                      <TableCell align="center">
                        <Typography variant="body2" fontWeight={600}>
                          {earning.commissionRate}%
                        </Typography>
                      </TableCell>
                      
                      <TableCell align="center">
                        <Typography variant="body2" fontWeight={600}>
                          ${earning.orderTotal.toFixed(2)}
                        </Typography>
                      </TableCell>
                      
                      <TableCell align="center">
                        <Typography variant="body2" fontWeight={600} color="success.main">
                          ${earning.commissionAmount.toFixed(2)}
                        </Typography>
                      </TableCell>
                      
                      <TableCell align="center">
                        <Chip
                          icon={getStatusIcon(earning.status)}
                          label={earning.status}
                          color={getStatusColor(earning.status)}
                          size="small"
                        />
                      </TableCell>
                      
                      <TableCell align="center">
                        <Typography variant="body2">
                          {new Date(earning.orderDate).toLocaleDateString()}
                        </Typography>
                        {earning.paymentDate && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              {t('affiliate.paid')}: {new Date(earning.paymentDate).toLocaleDateString()}
                            </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            {filteredEarnings.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <MoneyIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {t('affiliate.noEarningsFound')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('affiliate.startPromotingProducts')}
                </Typography>
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
