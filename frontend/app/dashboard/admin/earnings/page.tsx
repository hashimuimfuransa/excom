"use client";
import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Alert,
  Avatar,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  AttachMoney,
  TrendingUp,
  TrendingDown,
  Store,
  Person,
  Payment,
  AccountBalance,
  Receipt,
  Visibility,
  CheckCircle,
  Schedule,
  Cancel
} from '@mui/icons-material';
import { apiGet, apiPatch } from '@utils/api';
import AdminLayout from '@/components/admin/AdminLayout';
import DataTable, { Column } from '@/components/admin/DataTable';
import StatsCard from '@/components/admin/StatsCard';

interface SellerEarning {
  _id: string;
  seller: {
    _id: string;
    name: string;
    email: string;
  };
  store?: {
    _id: string;
    name: string;
  };
  totalEarnings: number;
  availableBalance: number;
  pendingBalance: number;
  totalWithdrawn: number;
  commissionRate: number;
  lastPayoutDate?: string;
  nextPayoutDate?: string;
  status: 'active' | 'suspended' | 'pending';
  ordersCount: number;
  productsCount: number;
}

interface PayoutRequest {
  _id: string;
  seller: {
    _id: string;
    name: string;
    email: string;
  };
  amount: number;
  requestDate: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  paymentMethod: string;
  accountDetails: string;
  notes?: string;
}

interface EarningsStats {
  totalRevenue: number;
  totalCommissions: number;
  totalPayouts: number;
  pendingPayouts: number;
  activeSellerCount: number;
  avgCommissionRate: number;
}

export default function AdminEarningsPage() {
  const [earnings, setEarnings] = useState<SellerEarning[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [stats, setStats] = useState<EarningsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'earnings' | 'payouts'>('earnings');
  const [detailDialog, setDetailDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SellerEarning | PayoutRequest | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEarningsData();
  }, []);

  const fetchEarningsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('excom_token');
      if (!token) {
        window.location.href = '/auth/login';
        return;
      }

      // Fetch real data from the backend
      const data = await apiGet<{
        earnings: SellerEarning[];
        payoutRequests: PayoutRequest[];
        stats: EarningsStats;
      }>('/admin/earnings', token);

      setEarnings(data.earnings);
      setPayoutRequests(data.payoutRequests);
      setStats(data.stats);
      setLoading(false);

    } catch (error) {
      console.error('Error fetching earnings data:', error);
      setError('Failed to fetch earnings data. Please try again later.');
      setLoading(false);
      
      // Fallback to empty data
      setEarnings([]);
      setPayoutRequests([]);
      setStats({
        totalRevenue: 0,
        totalCommissions: 0,
        totalPayouts: 0,
        pendingPayouts: 0,
        activeSellerCount: 0,
        avgCommissionRate: 5.0
      });
    }
  };

  const generateMockEarnings = (): SellerEarning[] => {
    return Array.from({ length: 15 }, (_, i) => ({
      _id: `earning_${i + 1}`,
      seller: {
        _id: `seller_${i + 1}`,
        name: `Seller ${i + 1}`,
        email: `seller${i + 1}@example.com`
      },
      store: {
        _id: `store_${i + 1}`,
        name: `Store ${i + 1}`
      },
      totalEarnings: 5000 + (i * 500),
      availableBalance: 1000 + (i * 100),
      pendingBalance: 500 + (i * 50),
      totalWithdrawn: 3500 + (i * 350),
      commissionRate: 5.0,
      lastPayoutDate: new Date(Date.now() - (i * 86400000 * 7)).toISOString(),
      nextPayoutDate: new Date(Date.now() + (7 * 86400000)).toISOString(),
      status: Math.random() > 0.1 ? 'active' : 'suspended',
      ordersCount: 50 + (i * 10),
      productsCount: 10 + (i * 2)
    }));
  };

  const generateMockPayoutRequests = (): PayoutRequest[] => {
    const statuses: PayoutRequest['status'][] = ['pending', 'processing', 'completed', 'rejected'];
    const paymentMethods = ['Bank Transfer', 'PayPal', 'Stripe'];
    
    return Array.from({ length: 20 }, (_, i) => ({
      _id: `payout_${i + 1}`,
      seller: {
        _id: `seller_${i + 1}`,
        name: `Seller ${i + 1}`,
        email: `seller${i + 1}@example.com`
      },
      amount: 100 + (i * 50),
      requestDate: new Date(Date.now() - (i * 86400000)).toISOString(),
      status: statuses[Math.floor(Math.random() * statuses.length)],
      paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
      accountDetails: `****${1234 + i}`,
      notes: i % 3 === 0 ? `Additional notes for payout request ${i + 1}` : undefined
    }));
  };

  const generateMockStats = (): EarningsStats => {
    return {
      totalRevenue: 125000,
      totalCommissions: 6250,
      totalPayouts: 45000,
      pendingPayouts: 8500,
      activeSellerCount: 45,
      avgCommissionRate: 5.0
    };
  };

  const handleEarningAction = (action: string, item: SellerEarning) => {
    setSelectedItem(item);
    
    switch (action) {
      case 'view':
        setDetailDialog(true);
        break;
      case 'suspend':
        handleSuspendSeller(item.seller._id);
        break;
      case 'activate':
        handleActivateSeller(item.seller._id);
        break;
    }
  };

  const handlePayoutAction = async (action: string, item: PayoutRequest) => {
    setSelectedItem(item);

    switch (action) {
      case 'view':
        setDetailDialog(true);
        break;
      case 'approve':
        await handleApprovePayout(item._id);
        break;
      case 'reject':
        await handleRejectPayout(item._id);
        break;
      case 'complete':
        await handleCompletePayout(item._id);
        break;
    }
  };

  const handleSuspendSeller = async (sellerId: string) => {
    if (!confirm('Are you sure you want to suspend this seller\'s earnings?')) return;
    
    try {
      await apiPatch(`/admin/sellers/${sellerId}/suspend-earnings`, {});
      setEarnings(prev => prev.map(e => 
        e.seller._id === sellerId ? { ...e, status: 'suspended' } : e
      ));
    } catch (error) {
      // Update locally for demo
      setEarnings(prev => prev.map(e => 
        e.seller._id === sellerId ? { ...e, status: 'suspended' } : e
      ));
    }
  };

  const handleActivateSeller = async (sellerId: string) => {
    try {
      await apiPatch(`/admin/sellers/${sellerId}/activate-earnings`, {});
      setEarnings(prev => prev.map(e => 
        e.seller._id === sellerId ? { ...e, status: 'active' } : e
      ));
    } catch (error) {
      // Update locally for demo
      setEarnings(prev => prev.map(e => 
        e.seller._id === sellerId ? { ...e, status: 'active' } : e
      ));
    }
  };

  const handleApprovePayout = async (payoutId: string) => {
    if (!confirm('Are you sure you want to approve this payout request?')) return;
    
    try {
      await apiPatch(`/admin/withdrawals/${payoutId}/approve`, { status: 'processing' });
      
      setPayoutRequests(prev => prev.map(p => 
        p._id === payoutId ? { ...p, status: 'processing' } : p
      ));
      
      // Refresh earnings data to reflect the approved withdrawal
      fetchEarningsData();
    } catch (error) {
      console.error('Error approving payout:', error);
      setError('Failed to approve payout request');
    }
  };

  const handleRejectPayout = async (payoutId: string) => {
    const reason = prompt('Please provide a reason for rejection (optional):');
    if (!confirm('Are you sure you want to reject this payout request?')) return;
    
    try {
      await apiPatch(`/admin/withdrawals/${payoutId}/reject`, { 
        status: 'rejected', 
        rejectionReason: reason 
      });
      
      setPayoutRequests(prev => prev.map(p => 
        p._id === payoutId ? { 
          ...p, 
          status: 'rejected', 
          notes: reason || 'Rejected by admin' 
        } : p
      ));
      
      fetchEarningsData();
    } catch (error) {
      console.error('Error rejecting payout:', error);
      setError('Failed to reject payout request');
    }
  };

  const handleCompletePayout = async (payoutId: string) => {
    if (!confirm('Mark this payout as completed? This will transfer the funds to the seller.')) return;
    
    try {
      await apiPatch(`/admin/withdrawals/${payoutId}/complete`, { 
        status: 'completed',
        completedAt: new Date().toISOString()
      });
      
      setPayoutRequests(prev => prev.map(p => 
        p._id === payoutId ? { ...p, status: 'completed' } : p
      ));
      
      fetchEarningsData();
    } catch (error) {
      console.error('Error completing payout:', error);
      setError('Failed to complete payout request');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': case 'completed': return 'success';
      case 'processing': return 'info';
      case 'pending': return 'warning';
      case 'suspended': case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const earningsColumns: Column[] = [
    {
      id: 'seller',
      label: 'Seller',
      format: (value, earning: SellerEarning) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <Person />
          </Avatar>
          <Box>
            <Typography variant="subtitle2" fontWeight={600}>
              {earning.seller.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {earning.store?.name || 'Direct Sales'}
            </Typography>
          </Box>
        </Box>
      )
    },
    {
      id: 'totalEarnings',
      label: 'Total Earnings',
      format: (value: number) => (
        <Typography variant="body1" fontWeight={600} color="success.main">
          ${value.toLocaleString()}
        </Typography>
      )
    },
    {
      id: 'availableBalance',
      label: 'Available',
      format: (value: number) => (
        <Typography variant="body2" fontWeight={600}>
          ${value.toLocaleString()}
        </Typography>
      )
    },
    {
      id: 'pendingBalance',
      label: 'Pending',
      format: (value: number) => (
        <Typography variant="body2" fontWeight={600} color="warning.main">
          ${value.toLocaleString()}
        </Typography>
      )
    },
    {
      id: 'totalWithdrawn',
      label: 'Withdrawn',
      format: (value: number) => (
        <Typography variant="body2" color="text.secondary">
          ${value.toLocaleString()}
        </Typography>
      )
    },
    {
      id: 'ordersCount',
      label: 'Orders',
      format: (value: number) => (
        <Typography variant="body2">
          {value} orders
        </Typography>
      )
    },
    {
      id: 'status',
      label: 'Status',
      format: (value, earning: SellerEarning) => (
        <Chip
          size="small"
          label={earning.status.charAt(0).toUpperCase() + earning.status.slice(1)}
          color={getStatusColor(earning.status) as any}
        />
      )
    }
  ];

  const payoutColumns: Column[] = [
    {
      id: 'seller',
      label: 'Seller',
      format: (value, payout: PayoutRequest) => (
        <Box>
          <Typography variant="subtitle2" fontWeight={600}>
            {payout.seller.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {payout.seller.email}
          </Typography>
        </Box>
      )
    },
    {
      id: 'amount',
      label: 'Amount',
      format: (value: number) => (
        <Typography variant="body1" fontWeight={600} color="success.main">
          ${value.toLocaleString()}
        </Typography>
      )
    },
    {
      id: 'paymentMethod',
      label: 'Method',
      format: (value: string) => (
        <Typography variant="body2">
          {value}
        </Typography>
      )
    },
    {
      id: 'requestDate',
      label: 'Requested',
      format: (value: string) => new Date(value).toLocaleDateString()
    },
    {
      id: 'status',
      label: 'Status',
      format: (value, payout: PayoutRequest) => (
        <Chip
          size="small"
          label={payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
          color={getStatusColor(payout.status) as any}
        />
      )
    }
  ];

  const getEarningsRowActions = (earning: SellerEarning) => {
    const actions = [{ label: 'View Details', action: 'view', icon: <Visibility /> }];
    
    if (earning.status === 'active') {
      actions.push({ label: 'Suspend Earnings', action: 'suspend', icon: <Cancel /> });
    } else {
      actions.push({ label: 'Activate Earnings', action: 'activate', icon: <CheckCircle /> });
    }
    
    return actions;
  };

  const getPayoutRowActions = (payout: PayoutRequest) => {
    const actions = [{ label: 'View Details', action: 'view', icon: <Visibility /> }];
    
    if (payout.status === 'pending') {
      actions.push({ label: 'Approve', action: 'approve', icon: <CheckCircle /> });
      actions.push({ label: 'Reject', action: 'reject', icon: <Cancel /> });
    } else if (payout.status === 'processing') {
      actions.push({ label: 'Mark Completed', action: 'complete', icon: <Payment /> });
    }
    
    return actions;
  };

  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            Earnings Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Monitor seller earnings, commissions, and payout requests
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Stats Overview */}
        {stats && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={2}>
              <StatsCard
                title="Total Revenue"
                value={`$${stats.totalRevenue.toLocaleString()}`}
                subtitle="Platform revenue"
                icon={<AttachMoney />}
                color="success"
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <StatsCard
                title="Commissions"
                value={`$${stats.totalCommissions.toLocaleString()}`}
                subtitle="Total earned"
                icon={<Receipt />}
                color="primary"
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <StatsCard
                title="Payouts"
                value={`$${stats.totalPayouts.toLocaleString()}`}
                subtitle="Total paid out"
                icon={<Payment />}
                color="info"
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <StatsCard
                title="Pending"
                value={`$${stats.pendingPayouts.toLocaleString()}`}
                subtitle="Awaiting payout"
                icon={<Schedule />}
                color="warning"
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <StatsCard
                title="Active Sellers"
                value={stats.activeSellerCount}
                subtitle="Earning sellers"
                icon={<Store />}
                color="secondary"
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <StatsCard
                title="Avg Commission"
                value={`${stats.avgCommissionRate.toFixed(1)}%`}
                subtitle="Commission rate"
                icon={<TrendingUp />}
                color="info"
              />
            </Grid>
          </Grid>
        )}

        {/* Tab Navigation */}
        <Box sx={{ mb: 3 }}>
          <Button
            variant={activeTab === 'earnings' ? 'contained' : 'outlined'}
            onClick={() => setActiveTab('earnings')}
            sx={{ mr: 2 }}
          >
            Seller Earnings ({earnings.length})
          </Button>
          <Button
            variant={activeTab === 'payouts' ? 'contained' : 'outlined'}
            onClick={() => setActiveTab('payouts')}
          >
            Payout Requests ({payoutRequests.filter(p => p.status === 'pending').length} pending)
          </Button>
        </Box>

        {/* Tables */}
        {activeTab === 'earnings' ? (
          <DataTable
            title="Seller Earnings"
            columns={earningsColumns}
            rows={earnings}
            loading={loading}
            searchable
            onRowAction={handleEarningAction}
            rowActions={getEarningsRowActions(earnings[0] || {} as SellerEarning)}
            emptyMessage="No earnings data found"
          />
        ) : (
          <DataTable
            title="Payout Requests"
            columns={payoutColumns}
            rows={payoutRequests}
            loading={loading}
            searchable
            onRowAction={handlePayoutAction}
            rowActions={getPayoutRowActions(payoutRequests[0] || {} as PayoutRequest)}
            emptyMessage="No payout requests found"
          />
        )}

        {/* Details Dialog */}
        <Dialog open={detailDialog} onClose={() => setDetailDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            {selectedItem && 'seller' in selectedItem ? 'Seller Earnings Details' : 'Payout Request Details'}
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            {selectedItem && (
              <Box>
                {'seller' in selectedItem ? (
                  // Earnings Details
                  <Box>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        {(selectedItem as SellerEarning).seller.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {(selectedItem as SellerEarning).seller.email}
                      </Typography>
                      {(selectedItem as SellerEarning).store && (
                        <Typography variant="body2" color="primary.main">
                          Store: {(selectedItem as SellerEarning).store!.name}
                        </Typography>
                      )}
                    </Box>

                    <Grid container spacing={3}>
                      <Grid item xs={6} md={3}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="h6" color="success.main">
                            ${(selectedItem as SellerEarning).totalEarnings.toLocaleString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Total Earnings
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="h6">
                            ${(selectedItem as SellerEarning).availableBalance.toLocaleString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Available Balance
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="h6" color="warning.main">
                            ${(selectedItem as SellerEarning).pendingBalance.toLocaleString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Pending Balance
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="h6">
                            ${(selectedItem as SellerEarning).totalWithdrawn.toLocaleString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Total Withdrawn
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>

                    <Box sx={{ mt: 3 }}>
                      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                        Performance Metrics
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Total Orders
                          </Typography>
                          <Typography variant="h6">
                            {(selectedItem as SellerEarning).ordersCount}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Products Listed
                          </Typography>
                          <Typography variant="h6">
                            {(selectedItem as SellerEarning).productsCount}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Commission Rate
                          </Typography>
                          <Typography variant="h6">
                            {(selectedItem as SellerEarning).commissionRate}%
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Status
                          </Typography>
                          <Chip 
                            label={(selectedItem as SellerEarning).status.charAt(0).toUpperCase() + (selectedItem as SellerEarning).status.slice(1)}
                            color={getStatusColor((selectedItem as SellerEarning).status) as any}
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  </Box>
                ) : (
                  // Payout Details
                  <Box>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        {(selectedItem as PayoutRequest).seller.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {(selectedItem as PayoutRequest).seller.email}
                      </Typography>
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Payout Amount
                        </Typography>
                        <Typography variant="h5" color="success.main">
                          ${(selectedItem as PayoutRequest).amount.toLocaleString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Payment Method
                        </Typography>
                        <Typography variant="body1">
                          {(selectedItem as PayoutRequest).paymentMethod}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Account Details
                        </Typography>
                        <Typography variant="body1">
                          {(selectedItem as PayoutRequest).accountDetails}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Request Date
                        </Typography>
                        <Typography variant="body1">
                          {new Date((selectedItem as PayoutRequest).requestDate).toLocaleDateString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                          Status
                        </Typography>
                        <Chip 
                          label={(selectedItem as PayoutRequest).status.charAt(0).toUpperCase() + (selectedItem as PayoutRequest).status.slice(1)}
                          color={getStatusColor((selectedItem as PayoutRequest).status) as any}
                        />
                      </Grid>
                      {(selectedItem as PayoutRequest).notes && (
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">
                            Notes
                          </Typography>
                          <Typography variant="body1">
                            {(selectedItem as PayoutRequest).notes}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Box>
                )}
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