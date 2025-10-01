'use client';

import React, { useState, useEffect } from 'react';
import { 
  Alert, Box, Button, Card, CardContent, Container, Grid, LinearProgress, 
  Paper, Stack, TextField, Typography, Divider, Avatar, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, FormControl, InputLabel,
  Select, MenuItem, IconButton, Tooltip, Tabs, Tab, Switch, FormControlLabel
} from '@mui/material';
import { 
  TrendingUp, 
  People as Users, 
  AttachMoney as DollarSign, 
  Visibility as Eye,
  ShoppingCart,
  Settings,
  PersonAdd as UserPlus,
  CheckCircle,
  Cancel as XCircle,
  AccessTime as Clock,
  Group as AffiliateIcon,
  Analytics,
  MonetizationOn
} from '@mui/icons-material';
import { apiGet, apiPost, apiPatch } from '@utils/api';
import { useTranslation } from 'react-i18next';
import VendorLayout from '@components/VendorLayout';

interface AffiliateProgram {
  _id: string;
  isActive: boolean;
  globalSettings: {
    enabled: boolean;
    defaultCommissionRate: number;
    defaultCommissionType: 'percentage' | 'fixed';
    minPayoutAmount: number;
    autoApproveAffiliates: boolean;
  };
  payoutSettings: {
    processingFee: number;
    vendorFee: number;
  };
}

interface Affiliate {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    phone?: string;
    country?: string;
    city?: string;
  };
  store?: {
    _id: string;
    name: string;
    description: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'banned';
  commissionRate: number;
  commissionType: 'percentage' | 'fixed';
  totalClicks: number;
  totalConversions: number;
  totalEarnings: number;
  pendingEarnings: number;
  applicationDate: string;
  approvalDate?: string;
  notes?: string;
  socialMediaHandles?: {
    instagram?: string;
    tiktok?: string;
    facebook?: string;
    twitter?: string;
    youtube?: string;
  };
  marketingExperience?: string;
  expectedMonthlySales?: string;
  preferredCategories?: string[];
}

interface Analytics {
  overview: {
    totalAffiliates: number;
    activeAffiliates: number;
    pendingAffiliates: number;
    totalClicks: number;
    conversions: number;
    conversionRate: number;
  };
  commissions: {
    totalAmount: number;
    totalNet: number;
    count: number;
  };
  topAffiliates: Affiliate[];
}

export default function VendorAffiliatePage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState<AffiliateProgram | null>(null);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [approvalData, setApprovalData] = useState({
    commissionRate: 5,
    commissionType: 'percentage' as 'percentage' | 'fixed',
    notes: ''
  });
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchAffiliateData();
  }, []);

  const fetchAffiliateData = async () => {
    try {
      const token = localStorage.getItem('excom_token');
      
      // Fetch program settings
      const programResponse = await apiGet<AffiliateProgram>("/vendor-affiliate/program");
      setProgram(programResponse);

      // Fetch affiliates
      const affiliatesResponse = await apiGet<{affiliates: Affiliate[]}>("/vendor-affiliate/affiliates");
      setAffiliates(affiliatesResponse.affiliates);

      // Fetch analytics
      const analyticsResponse = await apiGet<Analytics>("/vendor-affiliate/analytics");
      setAnalytics(analyticsResponse);
    } catch (error) {
      console.error('Error fetching affiliate data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAffiliateStatus = async (affiliateId: string, status: string, additionalData?: any) => {
    setApprovalLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    
    try {
      const response = await apiPatch(`/vendor-affiliate/affiliates/${affiliateId}/status`, { 
        status, 
        ...additionalData 
      });
      
      if (response) {
        setSuccessMessage(`Affiliate ${status} successfully!`);
        await fetchAffiliateData(); // Refresh data
        setApprovalDialogOpen(false);
        setDetailDialogOpen(false);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (error: any) {
      console.error('Error updating affiliate status:', error);
      setErrorMessage(error.message || `Failed to ${status} affiliate. Please try again.`);
    } finally {
      setApprovalLoading(false);
    }
  };

  const handleViewDetails = async (affiliate: Affiliate) => {
    setSelectedAffiliate(affiliate);
    setDetailDialogOpen(true);
  };

  const handleApproveAffiliate = (affiliate: Affiliate) => {
    setSelectedAffiliate(affiliate);
    setApprovalData({
      commissionRate: affiliate.commissionRate,
      commissionType: affiliate.commissionType,
      notes: affiliate.notes || ''
    });
    setApprovalDialogOpen(true);
  };

  const handleRejectAffiliate = (affiliate: Affiliate) => {
    setSelectedAffiliate(affiliate);
    setRejectReason('');
    setRejectDialogOpen(true);
  };

  const confirmReject = () => {
    if (selectedAffiliate) {
      updateAffiliateStatus(selectedAffiliate._id, 'rejected', { 
        notes: rejectReason || 'No reason provided' 
      });
      setRejectDialogOpen(false);
    }
  };

  const updateProgramSettings = async (updates: Partial<AffiliateProgram>) => {
    try {
      const response = await apiPost<AffiliateProgram>("/vendor-affiliate/program", updates);
      if (response) {
        setProgram(response);
      }
    } catch (error) {
      console.error('Error updating program settings:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      case 'banned': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle />;
      case 'pending': return <Clock />;
      case 'rejected': return <XCircle />;
      case 'banned': return <XCircle />;
      default: return <Clock />;
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <LinearProgress sx={{ width: '100%', maxWidth: 400 }} />
        </Box>
      </Container>
    );
  }

  return (
    <VendorLayout>
      <Container 
        maxWidth="lg" 
        sx={{ 
          py: { xs: 2, sm: 3, md: 4, lg: 4 },
          px: { xs: 2, sm: 3, md: 4, lg: 4 }
        }}
      >
      <Box mb={{ xs: 3, sm: 4, md: 4, lg: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Affiliate Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your affiliate program and track performance
        </Typography>
      </Box>

      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Overview" icon={<Analytics />} />
          <Tab label="Affiliates" icon={<Users />} />
          <Tab label="Settings" icon={<Settings />} />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* Success/Error Messages */}
          {successMessage && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
              {successMessage}
            </Alert>
          )}
          {errorMessage && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMessage(null)}>
              {errorMessage}
            </Alert>
          )}

          {activeTab === 0 && analytics && (
            <>
              {/* Stats Overview */}
              <Grid container spacing={3} mb={4}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ textAlign: 'center', p: 2 }}>
                    <CardContent>
                      <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 2 }}>
                        <Users />
                      </Avatar>
                      <Typography variant="h4" fontWeight={700}>
                        {analytics.overview.totalAffiliates}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Affiliates
                      </Typography>
                      <Typography variant="caption" color="success.main">
                        {analytics.overview.activeAffiliates} active
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ textAlign: 'center', p: 2 }}>
                    <CardContent>
                      <Avatar sx={{ bgcolor: 'info.main', mx: 'auto', mb: 2 }}>
                        <Eye />
                      </Avatar>
                      <Typography variant="h4" fontWeight={700}>
                        {analytics.overview.totalClicks}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Clicks
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ textAlign: 'center', p: 2 }}>
                    <CardContent>
                      <Avatar sx={{ bgcolor: 'success.main', mx: 'auto', mb: 2 }}>
                        <ShoppingCart />
                      </Avatar>
                      <Typography variant="h4" fontWeight={700}>
                        {analytics.overview.conversions}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Conversions
                      </Typography>
                      <Typography variant="caption" color="success.main">
                        {analytics.overview.conversionRate.toFixed(1)}% conversion rate
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ textAlign: 'center', p: 2 }}>
                    <CardContent>
                      <Avatar sx={{ bgcolor: 'warning.main', mx: 'auto', mb: 2 }}>
                        <DollarSign />
                      </Avatar>
                      <Typography variant="h4" fontWeight={700}>
                        ${analytics.commissions.totalAmount.toFixed(2)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Commissions
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {analytics.commissions.count} transactions
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Top Affiliates */}
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Top Performing Affiliates
                  </Typography>
                  <Stack spacing={2}>
                    {analytics.topAffiliates.map((affiliate, index) => (
                      <Paper key={affiliate._id} sx={{ p: 2, border: 1, borderColor: 'divider' }}>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                          <Box display="flex" alignItems="center" gap={2}>
                            <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                              {index + 1}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle1" fontWeight={600}>
                                {affiliate.user.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {affiliate.user.email}
                              </Typography>
                            </Box>
                          </Box>
                          <Box textAlign="right">
                            <Typography variant="h6" fontWeight={600} color="success.main">
                              ${affiliate.totalEarnings.toFixed(2)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {affiliate.totalConversions} conversions
                            </Typography>
                          </Box>
                        </Box>
                      </Paper>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </>
          )}

          {activeTab === 1 && (
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Affiliate Applications
                </Typography>
                <Stack spacing={2}>
                  {affiliates.map((affiliate) => (
                    <Paper key={affiliate._id} sx={{ p: 2, border: 1, borderColor: 'divider' }}>
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar sx={{ bgcolor: 'grey.300' }}>
                            {affiliate.user.name.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1" fontWeight={600}>
                              {affiliate.user.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {affiliate.user.email}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Applied: {new Date(affiliate.applicationDate).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Box>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Box textAlign="right">
                            <Typography variant="body2" color="text.secondary">
                              Commission Rate
                            </Typography>
                            <Typography variant="subtitle2" fontWeight={600}>
                              {affiliate.commissionType === 'percentage' 
                                ? `${affiliate.commissionRate}%` 
                                : `$${affiliate.commissionRate}`
                              }
                            </Typography>
                          </Box>
                          <Chip 
                            icon={getStatusIcon(affiliate.status)}
                            label={affiliate.status}
                            color={getStatusColor(affiliate.status)}
                            variant="outlined"
                          />
                          <Box display="flex" gap={1}>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<Eye />}
                              onClick={() => handleViewDetails(affiliate)}
                            >
                              View Details
                            </Button>
                            {affiliate.status === 'pending' && (
                              <>
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="success"
                                  onClick={() => handleApproveAffiliate(affiliate)}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="error"
                                  onClick={() => handleRejectAffiliate(affiliate)}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                          </Box>
                        </Box>
                      </Box>
                      {affiliate.status === 'approved' && (
                        <Box mt={2} pt={2} borderTop={1} borderColor="divider">
                          <Grid container spacing={2}>
                            <Grid item xs={4}>
                              <Typography variant="body2" color="text.secondary">
                                Total Clicks
                              </Typography>
                              <Typography variant="subtitle2" fontWeight={600}>
                                {affiliate.totalClicks}
                              </Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography variant="body2" color="text.secondary">
                                Conversions
                              </Typography>
                              <Typography variant="subtitle2" fontWeight={600}>
                                {affiliate.totalConversions}
                              </Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography variant="body2" color="text.secondary">
                                Total Earnings
                              </Typography>
                              <Typography variant="subtitle2" fontWeight={600}>
                                ${affiliate.totalEarnings.toFixed(2)}
                              </Typography>
                            </Grid>
                          </Grid>
                        </Box>
                      )}
                    </Paper>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          )}

          {activeTab === 2 && program && (
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Program Settings
                </Typography>
                <Stack spacing={3}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={program.globalSettings.enabled}
                        onChange={(e) => 
                          updateProgramSettings({
                            globalSettings: { ...program.globalSettings, enabled: e.target.checked }
                          })
                        }
                      />
                    }
                    label="Enable Affiliate Program"
                  />

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Default Commission Rate (%)"
                        type="number"
                        value={program.globalSettings.defaultCommissionRate}
                        onChange={(e) => 
                          updateProgramSettings({
                            globalSettings: { 
                              ...program.globalSettings, 
                              defaultCommissionRate: Number(e.target.value) 
                            }
                          })
                        }
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Minimum Payout Amount ($)"
                        type="number"
                        value={program.globalSettings.minPayoutAmount}
                        onChange={(e) => 
                          updateProgramSettings({
                            globalSettings: { 
                              ...program.globalSettings, 
                              minPayoutAmount: Number(e.target.value) 
                            }
                          })
                        }
                      />
                    </Grid>
                  </Grid>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={program.globalSettings.autoApproveAffiliates}
                        onChange={(e) => 
                          updateProgramSettings({
                            globalSettings: { ...program.globalSettings, autoApproveAffiliates: e.target.checked }
                          })
                        }
                      />
                    }
                    label="Auto-Approve Affiliates"
                  />

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Platform Processing Fee (%)"
                        type="number"
                        value={program.payoutSettings.processingFee}
                        onChange={(e) => 
                          updateProgramSettings({
                            payoutSettings: { 
                              ...program.payoutSettings, 
                              processingFee: Number(e.target.value) 
                            }
                          })
                        }
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Vendor Fee (%)"
                        type="number"
                        value={program.payoutSettings.vendorFee}
                        onChange={(e) => 
                          updateProgramSettings({
                            payoutSettings: { 
                              ...program.payoutSettings, 
                              vendorFee: Number(e.target.value) 
                            }
                          })
                        }
                      />
                    </Grid>
                  </Grid>
                </Stack>
              </CardContent>
            </Card>
          )}
        </Box>
      </Paper>

      {/* Affiliate Details Dialog */}
      <Dialog 
        open={detailDialogOpen} 
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              {selectedAffiliate?.user.name.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h6">{selectedAffiliate?.user.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedAffiliate?.user.email}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedAffiliate && (
            <Stack spacing={3}>
              {/* Basic Information */}
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Basic Information</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Phone:</Typography>
                    <Typography variant="body1">{selectedAffiliate.user.phone || 'Not provided'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Location:</Typography>
                    <Typography variant="body1">
                      {selectedAffiliate.user.city && selectedAffiliate.user.country 
                        ? `${selectedAffiliate.user.city}, ${selectedAffiliate.user.country}`
                        : 'Not provided'
                      }
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Application Date:</Typography>
                    <Typography variant="body1">
                      {new Date(selectedAffiliate.applicationDate).toLocaleDateString()}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Social Media */}
              {selectedAffiliate.socialMediaHandles && (
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>Social Media</Typography>
                  <Grid container spacing={2}>
                    {Object.entries(selectedAffiliate.socialMediaHandles).map(([platform, handle]) => (
                      handle && (
                        <Grid item xs={6} key={platform}>
                          <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                            {platform}:
                          </Typography>
                          <Typography variant="body1">{handle}</Typography>
                        </Grid>
                      )
                    ))}
                  </Grid>
                </Paper>
              )}

              {/* Marketing Information */}
              {(selectedAffiliate.marketingExperience || selectedAffiliate.expectedMonthlySales) && (
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>Marketing Information</Typography>
                  {selectedAffiliate.marketingExperience && (
                    <Box mb={2}>
                      <Typography variant="body2" color="text.secondary">Experience:</Typography>
                      <Typography variant="body1">{selectedAffiliate.marketingExperience}</Typography>
                    </Box>
                  )}
                  {selectedAffiliate.expectedMonthlySales && (
                    <Box mb={2}>
                      <Typography variant="body2" color="text.secondary">Expected Monthly Sales:</Typography>
                      <Typography variant="body1">{selectedAffiliate.expectedMonthlySales}</Typography>
                    </Box>
                  )}
                  {selectedAffiliate.preferredCategories && selectedAffiliate.preferredCategories.length > 0 && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">Preferred Categories:</Typography>
                      <Box display="flex" gap={1} flexWrap="wrap" mt={1}>
                        {selectedAffiliate.preferredCategories.map(category => (
                          <Chip key={category} label={category} size="small" variant="outlined" />
                        ))}
                      </Box>
                    </Box>
                  )}
                </Paper>
              )}

              {/* Performance Stats */}
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Performance</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={3}>
                    <Typography variant="body2" color="text.secondary">Total Clicks:</Typography>
                    <Typography variant="h6">{selectedAffiliate.totalClicks}</Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="body2" color="text.secondary">Conversions:</Typography>
                    <Typography variant="h6">{selectedAffiliate.totalConversions}</Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="body2" color="text.secondary">Total Earnings:</Typography>
                    <Typography variant="h6">${selectedAffiliate.totalEarnings.toFixed(2)}</Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="body2" color="text.secondary">Pending:</Typography>
                    <Typography variant="h6">${selectedAffiliate.pendingEarnings.toFixed(2)}</Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
          {selectedAffiliate?.status === 'pending' && (
            <Button 
              variant="contained" 
              color="success"
              onClick={() => handleApproveAffiliate(selectedAffiliate)}
            >
              Approve Affiliate
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog 
        open={approvalDialogOpen} 
        onClose={() => setApprovalDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Approve Affiliate</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Commission Rate"
              type="number"
              value={approvalData.commissionRate}
              onChange={(e) => setApprovalData(prev => ({ 
                ...prev, 
                commissionRate: Number(e.target.value) 
              }))}
              inputProps={{ min: 0, max: 100, step: 0.1 }}
              helperText={approvalData.commissionType === 'percentage' 
                ? 'Enter percentage (0-100)' 
                : 'Enter fixed amount in dollars'
              }
              error={approvalData.commissionRate < 0 || (approvalData.commissionType === 'percentage' && approvalData.commissionRate > 100)}
            />
            <FormControl fullWidth>
              <InputLabel>Commission Type</InputLabel>
              <Select
                value={approvalData.commissionType}
                label="Commission Type"
                onChange={(e) => setApprovalData(prev => ({ 
                  ...prev, 
                  commissionType: e.target.value as 'percentage' | 'fixed' 
                }))}
              >
                <MenuItem value="percentage">Percentage (%)</MenuItem>
                <MenuItem value="fixed">Fixed Amount ($)</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Notes (Optional)"
              multiline
              rows={3}
              value={approvalData.notes}
              onChange={(e) => setApprovalData(prev => ({ 
                ...prev, 
                notes: e.target.value 
              }))}
              placeholder="Add any notes about this affiliate..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setApprovalDialogOpen(false)}
            disabled={approvalLoading}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="success"
            disabled={approvalLoading || approvalData.commissionRate < 0 || (approvalData.commissionType === 'percentage' && approvalData.commissionRate > 100)}
            onClick={() => selectedAffiliate && updateAffiliateStatus(
              selectedAffiliate._id, 
              'approved', 
              approvalData
            )}
            startIcon={approvalLoading ? <LinearProgress sx={{ width: 16, height: 16 }} /> : null}
          >
            {approvalLoading ? 'Approving...' : 'Approve Affiliate'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Confirmation Dialog */}
      <Dialog 
        open={rejectDialogOpen} 
        onClose={() => setRejectDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Reject Affiliate Application</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Alert severity="warning">
              Are you sure you want to reject this affiliate application? This action cannot be undone.
            </Alert>
            <TextField
              fullWidth
              label="Reason for Rejection (Optional)"
              multiline
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Please provide a reason for rejection..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setRejectDialogOpen(false)}
            disabled={approvalLoading}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="error"
            disabled={approvalLoading}
            onClick={confirmReject}
            startIcon={approvalLoading ? <LinearProgress sx={{ width: 16, height: 16 }} /> : null}
          >
            {approvalLoading ? 'Rejecting...' : 'Reject Application'}
          </Button>
        </DialogActions>
      </Dialog>
      </Container>
    </VendorLayout>
  );
}