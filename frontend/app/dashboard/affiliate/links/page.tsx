'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  CircularProgress,
  Tooltip,
  Fab,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Avatar
} from '@mui/material';
import {
  Add as AddIcon,
  ContentCopy as CopyIcon,
  Share as ShareIcon,
  Link as LinkIcon,
  Visibility as VisibilityIcon,
  TrendingUp as TrendingUpIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  QrCode as QrCodeIcon,
  Analytics as AnalyticsIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import AffiliateLayout from '@/components/AffiliateLayout';
import { apiGet, apiPost, apiDelete } from '@utils/api';

interface AffiliateLink {
  _id: string;
  productId: string;
  productName: string;
  productImage?: string;
  vendorName: string;
  originalUrl: string;
  affiliateUrl: string;
  shortUrl: string;
  qrCode?: string;
  clicks: number;
  conversions: number;
  earnings: number;
  conversionRate: number;
  status: 'active' | 'inactive' | 'paused';
  createdAt: string;
  lastClicked?: string;
  tags: string[];
  description?: string;
}

interface Product {
  _id: string;
  title: string;
  image?: string;
  price: number;
  vendor: {
    _id: string;
    name: string;
  };
  category: string;
  commissionRate: number;
}

export default function AffiliateLinksPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [linkDescription, setLinkDescription] = useState('');
  const [linkTags, setLinkTags] = useState<string[]>([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [generating, setGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchLinks();
    fetchProducts();
  }, []);

  const fetchLinks = async () => {
    try {
      setLoading(true);
      const response = await apiGet('/affiliate/links');
      setLinks(response.data || []);
    } catch (error) {
      console.error('Error fetching links:', error);
      showSnackbar('Error fetching affiliate links', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await apiGet('/affiliate/products');
      setProducts(response.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleCreateLink = async () => {
    if (!selectedProduct) {
      showSnackbar('Please select a product', 'error');
      return;
    }

    try {
      setGenerating(true);
      const response = await apiPost('/affiliate/generate-product-link', {
        productId: selectedProduct
      });

      if (response) {
        showSnackbar(t('affiliate.linkGenerated'), 'success');
        setCreateDialogOpen(false);
        setSelectedProduct('');
        setLinkDescription('');
        setLinkTags([]);
        fetchLinks();
      } else {
        showSnackbar(t('affiliate.errorGeneratingLink'), 'error');
      }
    } catch (error) {
      console.error('Error creating link:', error);
      showSnackbar(t('affiliate.errorGeneratingLink'), 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyLink = async (link: AffiliateLink) => {
    try {
      await navigator.clipboard.writeText(link.affiliateUrl);
      showSnackbar(t('affiliate.linkCopied'), 'success');
    } catch (error) {
      showSnackbar(t('affiliate.errorCopyingLink'), 'error');
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    if (!confirm('Are you sure you want to delete this link?')) return;

    try {
      const response = await apiDelete(`/affiliate/links/${linkId}`);
      if (response.success) {
        showSnackbar('Link deleted successfully', 'success');
        fetchLinks();
      } else {
        showSnackbar('Error deleting link', 'error');
      }
    } catch (error) {
      console.error('Error deleting link:', error);
      showSnackbar('Error deleting link', 'error');
    }
  };

  const handleToggleStatus = async (linkId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    try {
      const response = await apiPost(`/affiliate/links/${linkId}/status`, {
        status: newStatus
      });
      
      if (response.success) {
        showSnackbar(`Link ${newStatus === 'active' ? 'activated' : 'deactivated'}`, 'success');
        fetchLinks();
      } else {
        showSnackbar('Error updating link status', 'error');
      }
    } catch (error) {
      console.error('Error updating link status:', error);
      showSnackbar('Error updating link status', 'error');
    }
  };

  const filteredLinks = links.filter(link => {
    const matchesSearch = link.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         link.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         link.affiliateUrl.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || link.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const totalStats = {
    totalLinks: links.length,
    totalClicks: links.reduce((sum, link) => sum + link.clicks, 0),
    totalConversions: links.reduce((sum, link) => sum + link.conversions, 0),
    totalEarnings: links.reduce((sum, link) => sum + link.earnings, 0)
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
            {t('affiliate.affiliateLinks')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('affiliate.manageAffiliateLinks')}
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" fontWeight={700} color="primary.main">
                      {totalStats.totalLinks}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('affiliate.totalLinks')}
                    </Typography>
                  </Box>
                  <LinkIcon sx={{ fontSize: 40, color: 'primary.main', opacity: 0.7 }} />
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
                      {totalStats.totalClicks}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('affiliate.totalClicks')}
                    </Typography>
                  </Box>
                  <VisibilityIcon sx={{ fontSize: 40, color: 'info.main', opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" fontWeight={700} color="success.main">
                      {totalStats.totalConversions}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('affiliate.conversions')}
                    </Typography>
                  </Box>
                  <TrendingUpIcon sx={{ fontSize: 40, color: 'success.main', opacity: 0.7 }} />
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
                      ${totalStats.totalEarnings.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('affiliate.totalEarnings')}
                    </Typography>
                  </Box>
                  <TrendingUpIcon sx={{ fontSize: 40, color: 'warning.main', opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters and Actions */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  placeholder={t('affiliate.searchLinks')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <VisibilityIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>{t('affiliate.status')}</InputLabel>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    label={t('affiliate.status')}
                  >
                    <MenuItem value="all">{t('affiliate.allStatus')}</MenuItem>
                    <MenuItem value="active">{t('affiliate.active')}</MenuItem>
                    <MenuItem value="inactive">{t('affiliate.inactive')}</MenuItem>
                    <MenuItem value="paused">{t('affiliate.paused')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={12} md={5}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={fetchLinks}
                  >
                    {t('affiliate.refresh')}
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setCreateDialogOpen(true)}
                  >
                    {t('affiliate.createLink')}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Links Table */}
        <Card>
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('affiliate.product')}</TableCell>
                    <TableCell>{t('affiliate.affiliateUrl')}</TableCell>
                    <TableCell align="center">{t('affiliate.status')}</TableCell>
                    <TableCell align="center">{t('affiliate.clicks')}</TableCell>
                    <TableCell align="center">{t('affiliate.conversions')}</TableCell>
                    <TableCell align="center">{t('affiliate.earnings')}</TableCell>
                    <TableCell align="center">{t('affiliate.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredLinks.map((link) => (
                    <TableRow key={link._id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar
                            src={link.productImage}
                            sx={{ width: 40, height: 40 }}
                          >
                            {link.productName.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" fontWeight={600}>
                              {link.productName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {link.vendorName}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: 'monospace',
                              fontSize: '0.75rem',
                              maxWidth: 200,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {link.shortUrl || link.affiliateUrl}
                          </Typography>
                          <Tooltip title={t('affiliate.copyLink')}>
                            <IconButton
                              size="small"
                              onClick={() => handleCopyLink(link)}
                            >
                              <CopyIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                      
                      <TableCell align="center">
                        <Chip
                          label={link.status}
                          color={
                            link.status === 'active' ? 'success' :
                            link.status === 'inactive' ? 'error' : 'warning'
                          }
                          size="small"
                          onClick={() => handleToggleStatus(link._id, link.status)}
                          sx={{ cursor: 'pointer' }}
                        />
                      </TableCell>
                      
                      <TableCell align="center">
                        <Typography variant="body2" fontWeight={600}>
                          {link.clicks}
                        </Typography>
                      </TableCell>
                      
                      <TableCell align="center">
                        <Typography variant="body2" fontWeight={600}>
                          {link.conversions}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {link.conversionRate.toFixed(1)}%
                        </Typography>
                      </TableCell>
                      
                      <TableCell align="center">
                        <Typography variant="body2" fontWeight={600} color="success.main">
                          ${link.earnings.toFixed(2)}
                        </Typography>
                      </TableCell>
                      
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          <Tooltip title={t('affiliate.viewAnalytics')}>
                            <IconButton size="small">
                              <AnalyticsIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={t('affiliate.share')}>
                            <IconButton size="small">
                              <ShareIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={t('affiliate.delete')}>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteLink(link._id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            {filteredLinks.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <LinkIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {t('affiliate.noAffiliateLinksFound')}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {t('affiliate.createFirstAffiliateLink')}
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setCreateDialogOpen(true)}
                >
                  {t('affiliate.createFirstLink')}
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Create Link Dialog */}
        <Dialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>{t('affiliate.createNewAffiliateLink')}</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>{t('affiliate.selectProduct')}</InputLabel>
                <Select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  label={t('affiliate.selectProduct')}
                >
                  {products.map((product) => (
                    <MenuItem key={product._id} value={product._id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar
                          src={product.image}
                          sx={{ width: 32, height: 32 }}
                        >
                          {product.title.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">
                            {product.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {product.vendor.name} • {product.commissionRate}% commission
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <TextField
                fullWidth
                label={t('affiliate.descriptionOptional')}
                multiline
                rows={3}
                value={linkDescription}
                onChange={(e) => setLinkDescription(e.target.value)}
                placeholder={t('affiliate.addDescriptionForLink')}
                sx={{ mb: 3 }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)}>
              {t('affiliate.cancel')}
            </Button>
            <Button
              onClick={handleCreateLink}
              variant="contained"
              disabled={!selectedProduct || generating}
            >
              {generating ? <CircularProgress size={20} /> : t('affiliate.createLink')}
            </Button>
          </DialogActions>
        </Dialog>

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
