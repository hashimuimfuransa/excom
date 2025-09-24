'use client';

import React, { useState, useEffect } from 'react';
import { 
  Alert, Box, Button, Card, CardContent, Container, Grid, LinearProgress, 
  Paper, Stack, TextField, Typography, Divider, Avatar, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, FormControl, InputLabel,
  Select, MenuItem, IconButton, Tooltip, Tabs, Tab, Badge, CardMedia,
  List, ListItem, ListItemText, ListItemAvatar, ListItemSecondaryAction,
  Fab, Snackbar, CircularProgress, CardActions, CardHeader
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
  ContentCopy as CopyAllIcon,
  Share as ShareIcon,
  Analytics as AnalyticsIcon,
  Store as StoreIcon,
  Inventory as InventoryIcon,
  Assessment as AssessmentIcon,
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  Instagram as InstagramIcon,
  WhatsApp as WhatsAppIcon,
  Telegram as TelegramIcon,
  Email as EmailIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { apiGet, apiPost } from '@utils/api';
import AffiliateOnboardingGuard from '@/components/AffiliateOnboardingGuard';
import BackButton from '@/components/BackButton';

interface AffiliateStats {
  totalClicks: number;
  totalConversions: number;
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
  conversionRate: number;
}

interface Affiliate {
  _id: string;
  vendor: {
    _id: string;
    name: string;
    email: string;
  };
  store?: {
    _id: string;
    name: string;
    description: string;
    logo: string;
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
  targetId?: {
    _id: string;
    title?: string;
    name?: string;
  };
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
    images: string[];
    price: number;
  };
  commissionAmount: number;
  netCommission: number;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  earnedDate: string;
}

interface Product {
  _id: string;
  title: string;
  description: string;
  images: string[];
  price: number;
  currency: string;
  seller: {
    _id: string;
    name: string;
  };
  store?: {
    _id: string;
    name: string;
  };
  category: string;
  createdAt: string;
}

interface EngagementData {
  affiliateId: string;
  referralCode: string;
  recentClicks: number;
  conversions: number;
  conversionRate: number;
  topProducts: Array<{
    product: Product;
    clicks: number;
    conversions: number;
    conversionRate: number;
  }>;
}

interface AffiliateClick {
  _id: string;
  visitorId: string;
  ipAddress: string;
  userAgent: string;
  referrer?: string;
  clickedUrl: string;
  targetUrl: string;
  linkType: string;
  converted: boolean;
  conversionDate?: string;
  createdAt: string;
  targetId?: {
    _id: string;
    title?: string;
  };
}

export default function AffiliateDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AffiliateStats>({
    totalClicks: 0,
    totalConversions: 0,
    totalEarnings: 0,
    pendingEarnings: 0,
    paidEarnings: 0,
    conversionRate: 0
  });
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [affiliateLinks, setAffiliateLinks] = useState<AffiliateLink[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [engagementData, setEngagementData] = useState<EngagementData[]>([]);
  const [clicks, setClicks] = useState<AffiliateClick[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string>('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVendor, setFilterVendor] = useState('');
  const [generatingLink, setGeneratingLink] = useState(false);

  useEffect(() => {
    fetchAffiliateData();
  }, []);

  const fetchAffiliateData = async () => {
    try {
      const data = await apiGet<{
        affiliates: Affiliate[];
        affiliateLinks: AffiliateLink[];
        commissions: Commission[];
        products: Product[];
        engagementData: EngagementData[];
        clicks: AffiliateClick[];
        totalStats: AffiliateStats;
      }>("/affiliate/dashboard");
      
      setStats(data.totalStats);
      setAffiliates(data.affiliates);
      setAffiliateLinks(data.affiliateLinks);
      setCommissions(data.commissions);
      setProducts(data.products);
      setEngagementData(data.engagementData);
      setClicks(data.clicks);
    } catch (error) {
      console.error('Error fetching affiliate data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateProductLink = async (product: Product) => {
    setGeneratingLink(true);
    try {
      const response = await apiPost('/affiliate/generate-product-link', {
        productId: product._id
      });
      
      setGeneratedLink(response.affiliateUrl);
      setSelectedProduct(product);
      setShareDialogOpen(true);
      setSnackbarMessage('Affiliate link generated successfully!');
      setSnackbarOpen(true);
      
      // Refresh data to get updated links
      fetchAffiliateData();
    } catch (error: any) {
      setSnackbarMessage(error.message || 'Failed to generate affiliate link');
      setSnackbarOpen(true);
    } finally {
      setGeneratingLink(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSnackbarMessage('Link copied to clipboard!');
    setSnackbarOpen(true);
  };

  const shareToSocial = (platform: string) => {
    const message = `Check out this amazing product: ${selectedProduct?.title}`;
    const url = generatedLink;
    
    let shareUrl = '';
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(url)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(message + ' ' + url)}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(message)}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${encodeURIComponent(message)}&body=${encodeURIComponent(url)}`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank');
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

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVendor = !filterVendor || product.seller._id === filterVendor;
    return matchesSearch && matchesVendor;
  });

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  return (
    <AffiliateOnboardingGuard>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box mb={4}>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <BackButton href="/dashboard" tooltip="Back to Dashboard" />
            <Typography variant="h4" fontWeight={700}>
              🎯 Affiliate Dashboard
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary">
            Track your performance, manage products, and maximize your earnings
          </Typography>
        </Box>

        {/* Enhanced Stats Overview */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ 
              textAlign: 'center', 
              p: 2, 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
              color: 'white',
              border: 'none',
              boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)'
            }}>
              <CardContent>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mx: 'auto', mb: 2 }}>
                  <EyeIcon />
                </Avatar>
                <Typography variant="h4" fontWeight={700}>
                  {stats.totalClicks}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Total Clicks
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ 
              textAlign: 'center', 
              p: 2, 
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', 
              color: 'white',
              border: 'none',
              boxShadow: '0 8px 32px rgba(240, 147, 251, 0.3)'
            }}>
              <CardContent>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mx: 'auto', mb: 2 }}>
                  <ShoppingCartIcon />
                </Avatar>
                <Typography variant="h4" fontWeight={700}>
                  {stats.totalConversions}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Conversions
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ 
              textAlign: 'center', 
              p: 2, 
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', 
              color: 'white',
              border: 'none',
              boxShadow: '0 8px 32px rgba(79, 172, 254, 0.3)'
            }}>
              <CardContent>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mx: 'auto', mb: 2 }}>
                  <TrendingUpIcon />
                </Avatar>
                <Typography variant="h4" fontWeight={700}>
                  {stats.conversionRate.toFixed(1)}%
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Conversion Rate
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ 
              textAlign: 'center', 
              p: 2, 
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', 
              color: 'white',
              border: 'none',
              boxShadow: '0 8px 32px rgba(67, 233, 123, 0.3)'
            }}>
              <CardContent>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mx: 'auto', mb: 2 }}>
                  <DollarSignIcon />
                </Avatar>
                <Typography variant="h4" fontWeight={700}>
                  ${stats.totalEarnings.toFixed(2)}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Total Earnings
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ 
              textAlign: 'center', 
              p: 2, 
              background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', 
              color: 'white',
              border: 'none',
              boxShadow: '0 8px 32px rgba(250, 112, 154, 0.3)'
            }}>
              <CardContent>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mx: 'auto', mb: 2 }}>
                  <ClockIcon />
                </Avatar>
                <Typography variant="h4" fontWeight={700}>
                  ${stats.pendingEarnings.toFixed(2)}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Pending
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Enhanced Tabs */}
        <Paper sx={{ 
          borderRadius: 3, 
          overflow: 'hidden', 
          boxShadow: 3,
          backgroundColor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider'
        }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{ 
              borderBottom: 1, 
              borderColor: 'divider', 
              bgcolor: 'background.default',
              '& .MuiTab-root': {
                color: 'text.secondary',
                fontWeight: 600,
                '&.Mui-selected': {
                  color: 'primary.main',
                }
              },
              '& .MuiTabs-indicator': {
                backgroundColor: 'primary.main',
                height: 3,
                borderRadius: '3px 3px 0 0'
              }
            }}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="My Programs" icon={<UsersIcon />} />
            <Tab label="Products" icon={<InventoryIcon />} />
            <Tab label="Analytics" icon={<AnalyticsIcon />} />
            <Tab label="Links" icon={<LinkIcon />} />
            <Tab label="Commissions" icon={<DollarSignIcon />} />
          </Tabs>

          <Box sx={{ p: 3 }}>
            {/* My Programs Tab */}
            {activeTab === 0 && (
              <Box>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  My Affiliate Programs
                </Typography>
                <Grid container spacing={3}>
                  {affiliates.map((affiliate) => (
                    <Grid item xs={12} md={6} key={affiliate._id}>
                      <Card sx={{ height: '100%', border: 1, borderColor: 'divider' }}>
                        <CardHeader
                          avatar={
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                              <StoreIcon />
                            </Avatar>
                          }
                          title={affiliate.vendor.name}
                          subheader={affiliate.store?.name || 'Store'}
                          action={
                            <Chip 
                              label={affiliate.status}
                              color={getStatusColor(affiliate.status)}
                              variant="outlined"
                            />
                          }
                        />
                        <CardContent>
                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="text.secondary">
                                Commission Rate
                              </Typography>
                              <Typography variant="h6" fontWeight={600} color="primary">
                                {affiliate.commissionType === 'percentage' 
                                  ? `${affiliate.commissionRate}%` 
                                  : `$${affiliate.commissionRate}`
                                }
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="text.secondary">
                                Referral Code
                              </Typography>
                              <Typography variant="h6" fontWeight={600} fontFamily="monospace">
                                {affiliate.referralCode}
                              </Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography variant="body2" color="text.secondary">
                                Clicks
                              </Typography>
                              <Typography variant="subtitle1" fontWeight={600}>
                                {affiliate.totalClicks}
                              </Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography variant="body2" color="text.secondary">
                                Conversions
                              </Typography>
                              <Typography variant="subtitle1" fontWeight={600}>
                                {affiliate.totalConversions}
                              </Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography variant="body2" color="text.secondary">
                                Earnings
                              </Typography>
                              <Typography variant="subtitle1" fontWeight={600} color="success.main">
                                ${affiliate.totalEarnings.toFixed(2)}
                              </Typography>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {/* Products Tab */}
            {activeTab === 1 && (
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="h6" fontWeight={600}>
                    Available Products
                  </Typography>
                  <Box display="flex" gap={2}>
                    <TextField
                      size="small"
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      InputProps={{
                        startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                    />
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                      <InputLabel>Filter by Vendor</InputLabel>
                      <Select
                        value={filterVendor}
                        onChange={(e) => setFilterVendor(e.target.value)}
                        label="Filter by Vendor"
                      >
                        <MenuItem value="">All Vendors</MenuItem>
                        {affiliates.map((affiliate) => (
                          <MenuItem key={affiliate._id} value={affiliate.vendor._id}>
                            {affiliate.vendor.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                </Box>

                <Grid container spacing={3}>
                  {filteredProducts.map((product) => (
                    <Grid item xs={12} sm={6} md={4} key={product._id}>
                      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <CardMedia
                          component="img"
                          height="200"
                          image={product.images[0] || '/placeholder-product.svg'}
                          alt={product.title}
                          sx={{ objectFit: 'cover' }}
                        />
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" fontWeight={600} gutterBottom>
                            {product.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {product.description.substring(0, 100)}...
                          </Typography>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="h6" color="primary" fontWeight={600}>
                              ${product.price}
                            </Typography>
                            <Chip 
                              label={product.seller.name}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        </CardContent>
                        <CardActions>
                          <Button
                            fullWidth
                            variant="contained"
                            startIcon={generatingLink ? <CircularProgress size={16} /> : <ShareIcon />}
                            onClick={() => generateProductLink(product)}
                            disabled={generatingLink}
                          >
                            Generate Link
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {/* Analytics Tab */}
            {activeTab === 2 && (
              <Box>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Engagement Analytics
                </Typography>
                <Grid container spacing={3}>
                  {engagementData.map((data) => (
                    <Grid item xs={12} md={6} key={data.affiliateId}>
                      <Card>
                        <CardHeader
                          title={`Program Analytics`}
                          subheader={`Referral Code: ${data.referralCode}`}
                        />
                        <CardContent>
                          <Grid container spacing={2}>
                            <Grid item xs={4}>
                              <Typography variant="body2" color="text.secondary">
                                Recent Clicks
                              </Typography>
                              <Typography variant="h6" fontWeight={600}>
                                {data.recentClicks}
                              </Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography variant="body2" color="text.secondary">
                                Conversions
                              </Typography>
                              <Typography variant="h6" fontWeight={600} color="success.main">
                                {data.conversions}
                              </Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography variant="body2" color="text.secondary">
                                Conversion Rate
                              </Typography>
                              <Typography variant="h6" fontWeight={600} color="primary">
                                {data.conversionRate.toFixed(1)}%
                              </Typography>
                            </Grid>
                          </Grid>
                          
                          {data.topProducts.length > 0 && (
                            <Box mt={3}>
                              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                Top Performing Products
                              </Typography>
                              <List dense>
                                {data.topProducts.slice(0, 3).map((item, index) => (
                                  <ListItem key={item.product._id}>
                                    <ListItemAvatar>
                                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                                        {index + 1}
                                      </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                      primary={item.product.title}
                                      secondary={`${item.clicks} clicks, ${item.conversions} conversions`}
                                    />
                                    <ListItemSecondaryAction>
                                      <Typography variant="body2" color="primary" fontWeight={600}>
                                        {item.conversionRate.toFixed(1)}%
                                      </Typography>
                                    </ListItemSecondaryAction>
                                  </ListItem>
                                ))}
                              </List>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {/* Links Tab */}
            {activeTab === 3 && (
              <Box>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  My Affiliate Links
                </Typography>
                <Grid container spacing={3}>
                  {affiliateLinks.map((link) => (
                    <Grid item xs={12} key={link._id}>
                      <Card>
                        <CardContent>
                          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                            <Box flex={1}>
                              <Typography variant="subtitle1" fontWeight={600}>
                                {link.linkType.charAt(0).toUpperCase() + link.linkType.slice(1)} Link
                              </Typography>
                              {link.targetId && (
                                <Typography variant="body2" color="text.secondary">
                                  {link.targetId.title || link.targetId.name}
                                </Typography>
                              )}
                              <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-all', mt: 1 }}>
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
                          <Grid container spacing={2}>
                            <Grid item xs={3}>
                              <Typography variant="body2" color="text.secondary">
                                Clicks
                              </Typography>
                              <Typography variant="h6" fontWeight={600}>
                                {link.clicks}
                              </Typography>
                            </Grid>
                            <Grid item xs={3}>
                              <Typography variant="body2" color="text.secondary">
                                Conversions
                              </Typography>
                              <Typography variant="h6" fontWeight={600} color="success.main">
                                {link.conversions}
                              </Typography>
                            </Grid>
                            <Grid item xs={3}>
                              <Typography variant="body2" color="text.secondary">
                                Earnings
                              </Typography>
                              <Typography variant="h6" fontWeight={600} color="primary">
                                ${link.earnings.toFixed(2)}
                              </Typography>
                            </Grid>
                            <Grid item xs={3}>
                              <Typography variant="body2" color="text.secondary">
                                Conversion Rate
                              </Typography>
                              <Typography variant="h6" fontWeight={600}>
                                {link.clicks > 0 ? ((link.conversions / link.clicks) * 100).toFixed(1) : 0}%
                              </Typography>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {/* Commissions Tab */}
            {activeTab === 4 && (
              <Box>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Recent Commissions
                </Typography>
                <Grid container spacing={3}>
                  {commissions.map((commission) => (
                    <Grid item xs={12} md={6} key={commission._id}>
                      <Card>
                        <CardContent>
                          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
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
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2" color="text.secondary">
                              Earned: {new Date(commission.earnedDate).toLocaleDateString()}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Order Total: ${commission.order.total.toFixed(2)}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Box>
        </Paper>

        {/* Share Dialog */}
        <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={1}>
              <ShareIcon />
              Share Product
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box mb={3}>
              <Typography variant="h6" gutterBottom>
                {selectedProduct?.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Your affiliate link:
              </Typography>
              <TextField
                fullWidth
                value={generatedLink}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <IconButton onClick={() => copyToClipboard(generatedLink)}>
                      <CopyAllIcon />
                    </IconButton>
                  )
                }}
              />
            </Box>
            
            <Typography variant="subtitle2" gutterBottom>
              Share on social media:
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              <Button
                variant="outlined"
                startIcon={<FacebookIcon />}
                onClick={() => shareToSocial('facebook')}
                sx={{ color: '#1877f2' }}
              >
                Facebook
              </Button>
              <Button
                variant="outlined"
                startIcon={<TwitterIcon />}
                onClick={() => shareToSocial('twitter')}
                sx={{ color: '#1da1f2' }}
              >
                Twitter
              </Button>
              <Button
                variant="outlined"
                startIcon={<WhatsAppIcon />}
                onClick={() => shareToSocial('whatsapp')}
                sx={{ color: '#25d366' }}
              >
                WhatsApp
              </Button>
              <Button
                variant="outlined"
                startIcon={<TelegramIcon />}
                onClick={() => shareToSocial('telegram')}
                sx={{ color: '#0088cc' }}
              >
                Telegram
              </Button>
              <Button
                variant="outlined"
                startIcon={<EmailIcon />}
                onClick={() => shareToSocial('email')}
              >
                Email
              </Button>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShareDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={() => setSnackbarOpen(false)}
          message={snackbarMessage}
        />
      </Container>
    </AffiliateOnboardingGuard>
  );
}