'use client';

import React, { useState, useEffect } from 'react';
import { 
  Alert, Box, Button, Card, CardContent, Container, Grid, LinearProgress, 
  Paper, Stack, TextField, Typography, Divider, Avatar, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, FormControl, InputLabel,
  Select, MenuItem, IconButton, Tooltip, Tabs, Tab
} from '@mui/material';
import { 
  TrendingUp as TrendingUpIcon, 
  People as UsersIcon, 
  AttachMoney as DollarSignIcon, 
  Visibility as EyeIcon,
  ShoppingCart as ShoppingCartIcon,
  AccessTime as ClockIcon,
  CheckCircle as CheckCircleIcon,
  Link as LinkIcon,
  ContentCopy as CopyAllIcon
} from '@mui/icons-material';
import { apiGet } from '@utils/api';
import AffiliateOnboardingGuard from '@/components/AffiliateOnboardingGuard';

interface AffiliateStats {
  totalClicks: number;
  totalConversions: number;
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
}

interface Affiliate {
  _id: string;
  vendor: {
    _id: string;
    name: string;
    email: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'banned';
  commissionRate: number;
  commissionType: 'percentage' | 'fixed';
  referralCode: string;
  totalClicks: number;
  totalConversions: number;
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
}

interface AffiliateLink {
  _id: string;
  linkType: string;
  originalUrl: string;
  affiliateUrl: string;
  shortCode: string;
  clicks: number;
  conversions: number;
  earnings: number;
  isActive: boolean;
}

interface Commission {
  _id: string;
  order: {
    _id: string;
    total: number;
    status: string;
  };
  product: {
    _id: string;
    title: string;
  };
  commissionAmount: number;
  netCommission: number;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  earnedDate: string;
}

export default function AffiliateDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AffiliateStats>({
    totalClicks: 0,
    totalConversions: 0,
    totalEarnings: 0,
    pendingEarnings: 0,
    paidEarnings: 0
  });
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [affiliateLinks, setAffiliateLinks] = useState<AffiliateLink[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    fetchAffiliateData();
  }, []);

  const fetchAffiliateData = async () => {
    try {
      const data = await apiGet<{
        affiliates: Affiliate[];
        affiliateLinks: AffiliateLink[];
        commissions: Commission[];
        totalStats: AffiliateStats;
      }>("/affiliate/dashboard");
      
      setStats(data.totalStats);
      setAffiliates(data.affiliates);
      setAffiliateLinks(data.affiliateLinks);
      setCommissions(data.commissions);
    } catch (error) {
      console.error('Error fetching affiliate data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
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
    <AffiliateOnboardingGuard>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box mb={4}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Affiliate Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track your affiliate performance and earnings
          </Typography>
        </Box>

      {/* Stats Overview */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <CardContent>
              <Avatar sx={{ bgcolor: 'info.main', mx: 'auto', mb: 2 }}>
                <EyeIcon />
              </Avatar>
              <Typography variant="h4" fontWeight={700}>
                {stats.totalClicks}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Clicks
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <CardContent>
              <Avatar sx={{ bgcolor: 'success.main', mx: 'auto', mb: 2 }}>
                <ShoppingCartIcon />
              </Avatar>
              <Typography variant="h4" fontWeight={700}>
                {stats.totalConversions}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Conversions
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <CardContent>
              <Avatar sx={{ bgcolor: 'warning.main', mx: 'auto', mb: 2 }}>
                <DollarSignIcon />
              </Avatar>
              <Typography variant="h4" fontWeight={700}>
                ${stats.totalEarnings.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Earnings
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <CardContent>
              <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 2 }}>
                <ClockIcon />
              </Avatar>
              <Typography variant="h4" fontWeight={700}>
                ${stats.pendingEarnings.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <CardContent>
              <Avatar sx={{ bgcolor: 'secondary.main', mx: 'auto', mb: 2 }}>
                <CheckCircleIcon />
              </Avatar>
              <Typography variant="h4" fontWeight={700}>
                ${stats.paidEarnings.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Paid Out
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="My Affiliate Programs" icon={<UsersIcon />} />
          <Tab label="Affiliate Links" icon={<LinkIcon />} />
          <Tab label="Commissions" icon={<DollarSignIcon />} />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {activeTab === 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Affiliate Programs
                </Typography>
                <Stack spacing={2}>
                  {affiliates.map((affiliate) => (
                    <Paper key={affiliate._id} sx={{ p: 2, border: 1, borderColor: 'divider' }}>
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {affiliate.vendor.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {affiliate.vendor.email}
                          </Typography>
                        </Box>
                        <Chip 
                          label={affiliate.status}
                          color={getStatusColor(affiliate.status)}
                          variant="outlined"
                        />
                      </Box>
                      <Box mt={2}>
                        <Grid container spacing={2}>
                          <Grid item xs={3}>
                            <Typography variant="body2" color="text.secondary">
                              Commission Rate
                            </Typography>
                            <Typography variant="subtitle2" fontWeight={600}>
                              {affiliate.commissionType === 'percentage' 
                                ? `${affiliate.commissionRate}%` 
                                : `$${affiliate.commissionRate}`
                              }
                            </Typography>
                          </Grid>
                          <Grid item xs={3}>
                            <Typography variant="body2" color="text.secondary">
                              Referral Code
                            </Typography>
                            <Typography variant="subtitle2" fontWeight={600} fontFamily="monospace">
                              {affiliate.referralCode}
                            </Typography>
                          </Grid>
                          <Grid item xs={3}>
                            <Typography variant="body2" color="text.secondary">
                              Total Clicks
                            </Typography>
                            <Typography variant="subtitle2" fontWeight={600}>
                              {affiliate.totalClicks}
                            </Typography>
                          </Grid>
                          <Grid item xs={3}>
                            <Typography variant="body2" color="text.secondary">
                              Total Earnings
                            </Typography>
                            <Typography variant="subtitle2" fontWeight={600}>
                              ${affiliate.totalEarnings.toFixed(2)}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Box>
                    </Paper>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          )}

          {activeTab === 1 && (
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Affiliate Links
                </Typography>
                <Stack spacing={2}>
                  {affiliateLinks.map((link) => (
                    <Paper key={link._id} sx={{ p: 2, border: 1, borderColor: 'divider' }}>
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box flex={1}>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {link.linkType}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                            {link.affiliateUrl}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<CopyAllIcon />}
                            onClick={() => copyToClipboard(link.affiliateUrl)}
                          >
                            Copy
                          </Button>
                          <Chip 
                            label={link.isActive ? 'Active' : 'Inactive'}
                            color={link.isActive ? 'success' : 'default'}
                            variant="outlined"
                          />
                        </Box>
                      </Box>
                      <Box mt={2}>
                        <Grid container spacing={2}>
                          <Grid item xs={4}>
                            <Typography variant="body2" color="text.secondary">
                              Clicks
                            </Typography>
                            <Typography variant="subtitle2" fontWeight={600}>
                              {link.clicks}
                            </Typography>
                          </Grid>
                          <Grid item xs={4}>
                            <Typography variant="body2" color="text.secondary">
                              Conversions
                            </Typography>
                            <Typography variant="subtitle2" fontWeight={600}>
                              {link.conversions}
                            </Typography>
                          </Grid>
                          <Grid item xs={4}>
                            <Typography variant="body2" color="text.secondary">
                              Earnings
                            </Typography>
                            <Typography variant="subtitle2" fontWeight={600}>
                              ${link.earnings.toFixed(2)}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Box>
                    </Paper>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          )}

          {activeTab === 2 && (
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Recent Commissions
                </Typography>
                <Stack spacing={2}>
                  {commissions.map((commission) => (
                    <Paper key={commission._id} sx={{ p: 2, border: 1, borderColor: 'divider' }}>
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {commission.product.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Order #{commission.order._id.slice(-8)}
                          </Typography>
                        </Box>
                        <Box textAlign="right">
                          <Typography variant="h6" fontWeight={600} color="success.main">
                            ${commission.netCommission.toFixed(2)}
                          </Typography>
                          <Chip 
                            label={commission.status}
                            color={getStatusColor(commission.status)}
                            variant="outlined"
                            size="small"
                          />
                        </Box>
                      </Box>
                      <Box mt={1}>
                        <Typography variant="caption" color="text.secondary">
                          Earned: {new Date(commission.earnedDate).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Paper>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          )}
        </Box>
      </Paper>
    </Container>
    </AffiliateOnboardingGuard>
  );
}