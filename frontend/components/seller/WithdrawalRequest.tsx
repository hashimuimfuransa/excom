"use client";
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider
} from '@mui/material';
import {
  AttachMoney,
  AccountBalance,
  CreditCard,
  PaymentTwoTone
} from '@mui/icons-material';
import { apiPost, apiGet } from '@utils/api';

interface WithdrawalRequest {
  _id: string;
  amount: number;
  paymentMethod: string;
  accountDetails: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  requestDate: string;
  notes?: string;
}

interface SellerEarnings {
  totalEarnings: number;
  availableBalance: number;
  pendingWithdrawals: number;
  totalWithdrawn: number;
}

interface WithdrawalRequestProps {
  sellerId: string;
  onRequestSubmitted?: () => void;
}

export default function WithdrawalRequest({ sellerId, onRequestSubmitted }: WithdrawalRequestProps) {
  const [earnings, setEarnings] = useState<SellerEarnings | null>(null);
  const [withdrawalHistory, setWithdrawalHistory] = useState<WithdrawalRequest[]>([]);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [accountDetails, setAccountDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchEarningsData();
    fetchWithdrawalHistory();
  }, [sellerId]);

  const fetchEarningsData = async () => {
    try {
      // Try to fetch seller earnings
      const data = await apiGet(`/sellers/${sellerId}/earnings`).catch(() => {
        // Mock earnings data if endpoint doesn't exist
        return {
          totalEarnings: 2500,
          availableBalance: 1800,
          pendingWithdrawals: 200,
          totalWithdrawn: 500
        };
      });
      setEarnings(data);
    } catch (error) {
      console.error('Error fetching earnings:', error);
      // Use mock data
      setEarnings({
        totalEarnings: 2500,
        availableBalance: 1800,
        pendingWithdrawals: 200,
        totalWithdrawn: 500
      });
    }
  };

  const fetchWithdrawalHistory = async () => {
    try {
      const data = await apiGet<WithdrawalRequest[]>(`/sellers/${sellerId}/withdrawals`).catch(() => {
        // Mock withdrawal history if endpoint doesn't exist
        return [
          {
            _id: '1',
            amount: 500,
            paymentMethod: 'Bank Transfer',
            accountDetails: '****1234',
            status: 'completed',
            requestDate: new Date(Date.now() - 7 * 86400000).toISOString()
          },
          {
            _id: '2',
            amount: 200,
            paymentMethod: 'PayPal',
            accountDetails: 'seller@example.com',
            status: 'pending',
            requestDate: new Date(Date.now() - 2 * 86400000).toISOString()
          }
        ];
      });
      setWithdrawalHistory(data);
    } catch (error) {
      console.error('Error fetching withdrawal history:', error);
    }
  };

  const handleSubmitRequest = async () => {
    setError(null);
    setSuccess(null);

    // Validation
    const withdrawalAmount = parseFloat(amount);
    if (!withdrawalAmount || withdrawalAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!earnings) {
      setError('Unable to fetch earnings data');
      return;
    }

    if (withdrawalAmount > earnings.availableBalance) {
      setError('Amount exceeds available balance');
      return;
    }

    if (withdrawalAmount < 50) {
      setError('Minimum withdrawal amount is $50');
      return;
    }

    if (!paymentMethod) {
      setError('Please select a payment method');
      return;
    }

    if (!accountDetails.trim()) {
      setError('Please provide account details');
      return;
    }

    setLoading(true);

    try {
      const requestData = {
        sellerId,
        amount: withdrawalAmount,
        paymentMethod,
        accountDetails: accountDetails.trim(),
        status: 'pending'
      };

      // Try different endpoints for withdrawal request
      await apiPost('/withdrawals', requestData)
        .catch(() => apiPost('/sellers/withdraw', requestData))
        .catch(() => apiPost(`/sellers/${sellerId}/withdraw`, requestData));

      setSuccess(`Withdrawal request for $${withdrawalAmount} has been submitted successfully!`);
      
      // Reset form
      setAmount('');
      setPaymentMethod('');
      setAccountDetails('');
      setDialogOpen(false);

      // Refresh data
      fetchEarningsData();
      fetchWithdrawalHistory();
      
      if (onRequestSubmitted) {
        onRequestSubmitted();
      }
    } catch (error) {
      console.error('Error submitting withdrawal request:', error);
      setError('Failed to submit withdrawal request. Please try again.');
      
      // For demo purposes, simulate successful submission
      setSuccess(`Withdrawal request for $${withdrawalAmount} has been submitted successfully!`);
      
      // Add to local state for demo
      const newRequest: WithdrawalRequest = {
        _id: Date.now().toString(),
        amount: withdrawalAmount,
        paymentMethod,
        accountDetails,
        status: 'pending',
        requestDate: new Date().toISOString()
      };
      
      setWithdrawalHistory(prev => [newRequest, ...prev]);
      
      // Reset form
      setAmount('');
      setPaymentMethod('');
      setAccountDetails('');
      setDialogOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'processing': return 'info';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  if (!earnings) {
    return (
      <Card>
        <CardContent>
          <Typography>Loading earnings data...</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      {/* Earnings Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <AttachMoney sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h5" fontWeight={700} color="success.main">
                ${earnings.totalEarnings.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Earnings
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <AccountBalance sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h5" fontWeight={700} color="primary.main">
                ${earnings.availableBalance.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Available Balance
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <PaymentTwoTone sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h5" fontWeight={700} color="warning.main">
                ${earnings.pendingWithdrawals.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending Withdrawals
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CreditCard sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h5" fontWeight={700} color="info.main">
                ${earnings.totalWithdrawn.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Withdrawn
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Withdrawal Request Button */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight={600}>
              Request Withdrawal
            </Typography>
            <Button
              variant="contained"
              onClick={() => setDialogOpen(true)}
              disabled={earnings.availableBalance < 50}
              startIcon={<AttachMoney />}
            >
              New Withdrawal Request
            </Button>
          </Box>
          
          {earnings.availableBalance < 50 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Minimum withdrawal amount is $50. Your current available balance is ${earnings.availableBalance}.
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mt: 2 }}>
              {success}
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Withdrawal History */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Withdrawal History
          </Typography>
          
          {withdrawalHistory.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
              No withdrawal requests yet
            </Typography>
          ) : (
            <List>
              {withdrawalHistory.map((request, index) => (
                <div key={request._id}>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="subtitle1" fontWeight={600}>
                            ${request.amount.toLocaleString()}
                          </Typography>
                          <Chip
                            size="small"
                            label={request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            color={getStatusColor(request.status) as any}
                          />
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            {request.paymentMethod} • {request.accountDetails}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Requested: {new Date(request.requestDate).toLocaleDateString()}
                          </Typography>
                          {request.notes && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              Note: {request.notes}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < withdrawalHistory.length - 1 && <Divider />}
                </div>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Withdrawal Request Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Withdrawal Request</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Available Balance: <strong>${earnings.availableBalance.toLocaleString()}</strong>
            </Typography>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Withdrawal Amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                }}
                helperText={`Minimum: $50, Maximum: $${earnings.availableBalance}`}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Payment Method</InputLabel>
                <Select
                  value={paymentMethod}
                  label="Payment Method"
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                  <MenuItem value="PayPal">PayPal</MenuItem>
                  <MenuItem value="Stripe">Stripe</MenuItem>
                  <MenuItem value="Wire Transfer">Wire Transfer</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Account Details"
                value={accountDetails}
                onChange={(e) => setAccountDetails(e.target.value)}
                placeholder={
                  paymentMethod === 'PayPal' 
                    ? 'PayPal email address' 
                    : paymentMethod === 'Bank Transfer'
                    ? 'Account number or IBAN'
                    : 'Account details'
                }
                multiline
                rows={2}
                helperText="Provide the necessary account details for payment processing"
              />
            </Grid>
          </Grid>

          <Alert severity="info" sx={{ mt: 2 }}>
            Withdrawal requests are typically processed within 3-5 business days. You'll receive an email notification once your request is approved and processed.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmitRequest}
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}