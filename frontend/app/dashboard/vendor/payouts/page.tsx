"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, Button, Container, Paper, Stack, TextField, Typography, Alert, 
  Grid, Card, CardContent, Avatar, Divider, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, FormControl, InputLabel,
  Select, MenuItem, InputAdornment, LinearProgress, Dialog, DialogTitle,
  DialogContent, DialogActions, Tab, Tabs, IconButton
} from '@mui/material';
import {
  AccountBalanceWallet,
  TrendingUp,
  Schedule,
  CheckCircle,
  Error,
  Search as SearchIcon,
  Download as DownloadIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  AccountBalance,
  CreditCard,
  Payment,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { apiGet, apiPost, apiPatch } from '@utils/api';
import { useTranslation } from 'react-i18next';
import VendorLayout from '@components/VendorLayout';

interface PayoutAccount {
  _id: string;
  type: 'bank' | 'paypal' | 'stripe';
  accountName: string;
  accountNumber: string;
  isDefault: boolean;
  isVerified: boolean;
  createdAt: string;
}

interface PayoutRequest {
  _id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requestedAt: string;
  processedAt?: string;
  payoutAccount: PayoutAccount;
  fee: number;
  netAmount: number;
  reference?: string;
}

interface PayoutStats {
  totalEarnings: number;
  availableBalance: number;
  pendingPayouts: number;
  completedPayouts: number;
  totalFees: number;
}

const statusColors = {
  pending: 'warning',
  processing: 'info',
  completed: 'success',
  failed: 'error'
} as const;

const accountTypeIcons = {
  bank: <AccountBalance />,
  paypal: <Payment />,
  stripe: <CreditCard />
};

export default function VendorPayoutsPage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<PayoutStats | null>(null);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [payoutAccounts, setPayoutAccounts] = useState<PayoutAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);
  
  // Account form states
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<PayoutAccount | null>(null);
  const [accountType, setAccountType] = useState<'bank' | 'paypal' | 'stripe'>('bank');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  
  // Payout request states
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState<string>('');
  const [selectedPayoutAccount, setSelectedPayoutAccount] = useState<string>('');
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  useEffect(() => {
    const token = localStorage.getItem('excom_token');
    if (!token) { 
      window.location.href = '/auth/login'; 
      return; 
    }
    
    Promise.all([
      apiGet<PayoutStats>('/payouts/stats').catch(() => ({
        totalEarnings: 0,
        availableBalance: 0,
        pendingPayouts: 0,
        completedPayouts: 0,
        totalFees: 0
      } as PayoutStats)),
      apiGet<PayoutAccount[]>('/payouts/accounts').catch(() => []),
      apiGet<PayoutRequest[]>('/payouts/requests').catch(() => [])
    ]).then(([statsData, accountsData, requestsData]) => {
      setStats(statsData);
      setPayoutAccounts(accountsData);
      setPayoutRequests(requestsData);
      setLoading(false);
    });
  }, []);

  const filteredPayouts = useMemo(() => {
    return payoutRequests.filter(payout => {
      const matchesSearch = 
        payout._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payout.reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payout.payoutAccount.accountName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || payout.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [payoutRequests, searchQuery, statusFilter]);

  const tabPayouts = useMemo(() => {
    switch (selectedTab) {
      case 1: return filteredPayouts.filter(p => p.status === 'pending');
      case 2: return filteredPayouts.filter(p => p.status === 'processing');
      case 3: return filteredPayouts.filter(p => p.status === 'completed');
      case 4: return filteredPayouts.filter(p => p.status === 'failed');
      default: return filteredPayouts;
    }
  }, [filteredPayouts, selectedTab]);

  const handleSaveAccount = async () => {
    if (!accountName || !accountNumber) return;
    
    const accountData = {
      type: accountType,
      accountName,
      accountNumber,
      isDefault: payoutAccounts.length === 0
    };
    
    try {
      if (editingAccount) {
        // Update existing account
        const updated = await apiPatch(`/payouts/accounts/${editingAccount._id}`, accountData);
        setPayoutAccounts(accounts => 
          accounts.map(acc => acc._id === editingAccount._id ? { ...acc, ...updated } : acc)
        );
      } else {
        // Create new account
        const created = await apiPost('/payouts/accounts', accountData);
        setPayoutAccounts(accounts => [...accounts, created]);
      }
      
      setAccountDialogOpen(false);
      setEditingAccount(null);
      setAccountName('');
      setAccountNumber('');
      setAccountType('bank');
    } catch (error) {
      console.error('Failed to save payout account:', error);
    }
  };

  const handleRequestPayout = async () => {
    if (!payoutAmount || !selectedPayoutAccount) return;
    
    try {
      const amount = parseFloat(payoutAmount);
      const fee = amount * 0.03; // 3% fee
      const netAmount = amount - fee;
      
      const payoutData = {
        amount,
        payoutAccountId: selectedPayoutAccount,
        fee,
        netAmount
      };
      
      const created = await apiPost('/payouts/requests', payoutData);
      setPayoutRequests(payouts => [created, ...payouts]);
      
      setPayoutDialogOpen(false);
      setPayoutAmount('');
      setSelectedPayoutAccount('');
      
      // Update available balance
      if (stats) {
        setStats({ ...stats, availableBalance: stats.availableBalance - amount });
      }
    } catch (error) {
      console.error('Failed to request payout:', error);
    }
  };

  const StatCard = ({ title, value, subtitle, color, icon, progress }: {
    title: string;
    value: string | number;
    subtitle?: string;
    color: string;
    icon: React.ReactNode;
    progress?: number;
  }) => (
    <Card sx={{ 
      borderRadius: 3, 
      border: '1px solid', 
      borderColor: 'divider',
      transition: 'transform 0.2s ease-in-out',
      '&:hover': { transform: 'translateY(-2px)' }
    }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>
            {icon}
          </Avatar>
          <Box flex={1}>
            <Typography variant="h4" fontWeight={700} color={color}>
              {value}
            </Typography>
            <Typography variant="body1" fontWeight={600} gutterBottom>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
            {progress !== undefined && (
              <Box sx={{ mt: 1 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={progress} 
                  sx={{ borderRadius: 1, height: 6 }}
                />
              </Box>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Container sx={{ py: 4 }}>
        <Typography>Loading payout information...</Typography>
      </Container>
    );
  }

  return (
    <VendorLayout>
      <Container 
        maxWidth="xl" 
        sx={{ 
          py: { xs: 2, sm: 3, md: 4, lg: 4 }, 
          px: { xs: 2, sm: 3, md: 4, lg: 4 } 
        }}
      >
      {/* Header */}
      <Stack 
        direction={{ xs: 'column', sm: 'row' }} 
        alignItems={{ xs: 'stretch', sm: 'center' }} 
        justifyContent="space-between" 
        mb={{ xs: 3, sm: 4, md: 4, lg: 4 }}
        spacing={{ xs: 2, sm: 0 }}
      >
        <Stack direction="row" alignItems="center" spacing={{ xs: 1, sm: 2, md: 2, lg: 2 }}>
          <IconButton 
            onClick={() => window.location.href = '/dashboard/vendor'}
            sx={{ 
              bgcolor: 'primary.main', 
              color: 'white',
              '&:hover': { bgcolor: 'primary.dark' },
              width: { xs: 40, sm: 44, md: 48, lg: 48 },
              height: { xs: 40, sm: 44, md: 48, lg: 48 }
            }}
          >
            <ArrowBackIcon fontSize="medium" />
          </IconButton>
          <Box>
            <Typography 
              variant={{ xs: 'h5', sm: 'h4' }} 
              fontWeight={900} 
              gutterBottom
              sx={{ lineHeight: { xs: 1.2, sm: 1.167 } }}
            >
              Payouts & Earnings
            </Typography>
            <Typography 
              variant={{ xs: 'body2', sm: 'body1' }} 
              color="text.secondary"
              sx={{ display: { xs: 'none', sm: 'block' } }}
            >
              Manage your earnings and payout methods
            </Typography>
          </Box>
        </Stack>
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={{ xs: 1, sm: 2 }}
          width={{ xs: '100%', sm: 'auto' }}
        >
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setAccountDialogOpen(true)}
            sx={{ 
              borderRadius: 2,
              px: { xs: 2, sm: 3 }
            }}
            size="medium"
            fullWidth
          >
            <Typography variant={{ xs: 'body2', sm: 'body1' }}>
              Add Account
            </Typography>
          </Button>
          <Button
            variant="contained"
            startIcon={<AccountBalanceWallet />}
            onClick={() => setPayoutDialogOpen(true)}
            disabled={!stats || stats.availableBalance <= 0 || payoutAccounts.length === 0}
            sx={{ 
              borderRadius: 2,
              px: { xs: 2, sm: 3 }
            }}
            size="medium"
            fullWidth
          >
            <Typography variant={{ xs: 'body2', sm: 'body1' }}>
              Request Payout
            </Typography>
          </Button>
        </Stack>
      </Stack>

      {/* Stats Cards */}
      {stats && (
        <Grid container spacing={{ xs: 2, sm: 3 }} mb={{ xs: 3, sm: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Earnings"
              value={`$${stats.totalEarnings.toLocaleString()}`}
              subtitle="All time earnings"
              color="#2e7d32"
              icon={<TrendingUp />}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Available Balance"
              value={`$${stats.availableBalance.toLocaleString()}`}
              subtitle="Ready for payout"
              color="#1976d2"
              icon={<AccountBalanceWallet />}
              progress={(stats.availableBalance / stats.totalEarnings) * 100}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Pending Payouts"
              value={stats.pendingPayouts}
              subtitle="Being processed"
              color="#ed6c02"
              icon={<Schedule />}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Fees"
              value={`$${stats.totalFees.toLocaleString()}`}
              subtitle="Processing fees"
              color="#9c27b0"
              icon={<Error />}
            />
          </Grid>
        </Grid>
      )}

      {/* Payout Accounts */}
      <Paper sx={{ 
        p: { xs: 2, sm: 3 }, 
        borderRadius: 3, 
        border: '1px solid', 
        borderColor: 'divider', 
        mb: { xs: 2, sm: 3 } 
      }}>
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          alignItems={{ xs: 'stretch', sm: 'center' }} 
          justifyContent="space-between" 
          mb={{ xs: 2, sm: 3 }}
          spacing={{ xs: 2, sm: 0 }}
        >
          <Typography variant={{ xs: 'subtitle1', sm: 'h6' }} fontWeight={700}>
            Payout Accounts
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setAccountDialogOpen(true)}
            fullWidth
            sx={{ maxWidth: { xs: '100%', sm: '150px' } }}
          >
            Add Account
          </Button>
        </Stack>
        
        {payoutAccounts.length === 0 ? (
          <Alert severity="info">
            No payout accounts configured. Add a bank account, PayPal, or Stripe account to receive payments.
          </Alert>
        ) : (
          <Grid container spacing={{ xs: 1.5, sm: 2 }}>
            {payoutAccounts.map((account) => (
              <Grid item xs={12} sm={6} md={4} key={account._id}>
                <Card sx={{ 
                  border: '1px solid', 
                  borderColor: account.isDefault ? 'primary.main' : 'divider',
                  position: 'relative'
                }}>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {accountTypeIcons[account.type]}
                      </Avatar>
                      <Box flex={1}>
                        <Typography fontWeight={600}>
                          {account.accountName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {account.accountNumber}
                        </Typography>
                      </Box>
                    </Stack>
                    
                    <Stack direction="row" spacing={1} mb={2}>
                      {account.isDefault && (
                        <Chip label="Default" color="primary" size="small" />
                      )}
                      <Chip 
                        label={account.isVerified ? 'Verified' : 'Unverified'} 
                        color={account.isVerified ? 'success' : 'warning'}
                        size="small"
                      />
                    </Stack>
                    
                    <Typography variant="caption" color="text.secondary">
                      Added {new Date(account.createdAt).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* Payout History */}
      <Paper sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ p: { xs: 2, sm: 3 }, pb: 0 }}>
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            alignItems={{ xs: 'stretch', sm: 'center' }} 
            justifyContent="space-between" 
            mb={2}
            spacing={{ xs: 2, sm: 0 }}
          >
            <Typography variant={{ xs: 'subtitle1', sm: 'h6' }} fontWeight={700}>
              Payout History
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<DownloadIcon />}
              fullWidth
              sx={{ 
                borderRadius: 2,
                maxWidth: { xs: '100%', sm: '120px' }
              }}
            >
              Export
            </Button>
          </Stack>
          
          <Grid container spacing={{ xs: 1.5, sm: 2 }} mb={3}>
            <Grid item xs={12} sm={8} md={6}>
              <TextField
                fullWidth
                placeholder="Search payouts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="medium"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" fontSize="medium" />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 2 }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4} md={3}>
              <FormControl fullWidth size="medium">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="processing">Processing</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="failed">Failed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>

        <Tabs 
          value={selectedTab} 
          onChange={(_, newValue) => setSelectedTab(newValue)}
          sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 2 }}
        >
          <Tab label={`All (${payoutRequests.length})`} />
          <Tab label={`Pending (${payoutRequests.filter(p => p.status === 'pending').length})`} />
          <Tab label={`Processing (${payoutRequests.filter(p => p.status === 'processing').length})`} />
          <Tab label={`Completed (${payoutRequests.filter(p => p.status === 'completed').length})`} />
          <Tab label={`Failed (${payoutRequests.filter(p => p.status === 'failed').length})`} />
        </Tabs>

        <TableContainer sx={{ 
          overflowX: 'auto',
          '& .MuiTable-root': {
            minWidth: { xs: 700, sm: 'auto' }
          }
        }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ minWidth: { xs: 100, sm: 'auto' } }}>Request ID</TableCell>
                <TableCell sx={{ minWidth: { xs: 80, sm: 'auto' } }}>Amount</TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, minWidth: 60 }}>Fee</TableCell>
                <TableCell sx={{ minWidth: { xs: 90, sm: 'auto' } }}>Net Amount</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, minWidth: 120 }}>Account</TableCell>
                <TableCell sx={{ minWidth: { xs: 80, sm: 'auto' } }}>Status</TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, minWidth: 100 }}>Requested</TableCell>
                <TableCell sx={{ minWidth: 80 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tabPayouts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      No payout requests found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                tabPayouts.map((payout) => (
                  <TableRow key={payout._id} hover>
                    <TableCell>
                      <Typography fontWeight={600}>
                        {payout._id.slice(-8)}
                      </Typography>
                      {payout.reference && (
                        <Typography variant="caption" color="text.secondary">
                          {payout.reference}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight={600}>
                        ${payout.amount.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography color="text.secondary">
                        ${payout.fee.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight={700} color="success.main">
                        ${payout.netAmount.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main' }}>
                          {React.cloneElement(accountTypeIcons[payout.payoutAccount.type], { fontSize: 'small' })}
                        </Avatar>
                        <Typography variant="body2">
                          {payout.payoutAccount.accountName}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={payout.status}
                        color={statusColors[payout.status]}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(payout.requestedAt).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(payout.requestedAt).toLocaleTimeString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton size="small">
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add/Edit Account Dialog */}
      <Dialog 
        open={accountDialogOpen} 
        onClose={() => setAccountDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        fullScreen={false}
        PaperProps={{
          sx: {
            borderRadius: { xs: 0, sm: 2 },
            mx: { xs: 0, sm: 2 },
            my: { xs: 0, sm: 2 }
          }
        }}
      >
        <DialogTitle sx={{ px: { xs: 2, sm: 3 } }}>
          <Typography variant={{ xs: 'subtitle1', sm: 'h6' }} fontWeight={600}>
            {editingAccount ? 'Edit Payout Account' : 'Add Payout Account'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ px: { xs: 2, sm: 3 } }}>
          <Stack spacing={{ xs: 2, sm: 3 }} mt={1}>
            <FormControl fullWidth size="medium">
              <InputLabel>Account Type</InputLabel>
              <Select
                value={accountType}
                label="Account Type"
                onChange={(e) => setAccountType(e.target.value as any)}
              >
                <MenuItem value="bank">Bank Account</MenuItem>
                <MenuItem value="paypal">PayPal</MenuItem>
                <MenuItem value="stripe">Stripe</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              label="Account Name"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              fullWidth
              required
              size="medium"
            />
            
            <TextField
              label={
                accountType === 'bank' ? 'Account Number' :
                accountType === 'paypal' ? 'PayPal Email' :
                'Stripe Account ID'
              }
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              fullWidth
              required
              size="medium"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAccountDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveAccount} variant="contained">
            {editingAccount ? 'Update' : 'Add'} Account
          </Button>
        </DialogActions>
      </Dialog>

      {/* Request Payout Dialog */}
      <Dialog open={payoutDialogOpen} onClose={() => setPayoutDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Request Payout</DialogTitle>
        <DialogContent>
          <Stack spacing={3} mt={1}>
            <Alert severity="info">
              Available balance: ${stats?.availableBalance.toFixed(2) || '0.00'}
            </Alert>
            
            <TextField
              label="Payout Amount"
              type="number"
              value={payoutAmount}
              onChange={(e) => setPayoutAmount(e.target.value)}
              fullWidth
              required
              inputProps={{ 
                min: 10, 
                max: stats?.availableBalance || 0,
                step: 0.01 
              }}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>
              }}
            />
            
            <FormControl fullWidth required>
              <InputLabel>Payout Account</InputLabel>
              <Select
                value={selectedPayoutAccount}
                label="Payout Account"
                onChange={(e) => setSelectedPayoutAccount(e.target.value)}
              >
                {payoutAccounts
                  .filter(acc => acc.isVerified)
                  .map((account) => (
                    <MenuItem key={account._id} value={account._id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {accountTypeIcons[account.type]}
                        {account.accountName} ({account.accountNumber})
                      </Box>
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
            
            {payoutAmount && (
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Processing fee (3%): ${(parseFloat(payoutAmount) * 0.03).toFixed(2)}
                </Typography>
                <Typography variant="h6" fontWeight={700}>
                  Net amount: ${(parseFloat(payoutAmount) - parseFloat(payoutAmount) * 0.03).toFixed(2)}
                </Typography>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayoutDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleRequestPayout} 
            variant="contained"
            disabled={!payoutAmount || !selectedPayoutAccount}
          >
            Request Payout
          </Button>
        </DialogActions>
      </Dialog>
      </Container>
    </VendorLayout>
  );
}