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
  Avatar,
  Tooltip,
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
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  CardMedia,
  CardActions,
  CardHeader,
  Badge,
  Rating,
  InputAdornment
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Add as AddIcon,
  Share as ShareIcon,
  Link as LinkIcon,
  Visibility as VisibilityIcon,
  ShoppingCart as ShoppingCartIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  Refresh as RefreshIcon,
  Category as CategoryIcon,
  Store as StoreIcon,
  LocalOffer as OfferIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import AffiliateLayout from '@/components/AffiliateLayout';
import { apiGet, apiPost } from '@utils/api';

interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  image?: string;
  images?: string[];
  category: string;
  subcategory?: string;
  vendor: {
    _id: string;
    name: string;
    logo?: string;
    rating: number;
  };
  commissionRate: number;
  status: 'active' | 'inactive' | 'out_of_stock';
  tags: string[];
  rating: number;
  reviewCount: number;
  salesCount: number;
  clickCount: number;
  conversionCount: number;
  conversionRate: number;
  earnings: number;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProductStats {
  totalProducts: number;
  activeProducts: number;
  totalClicks: number;
  totalConversions: number;
  totalEarnings: number;
  averageCommissionRate: number;
  topCategory: string;
  topVendor: string;
}

export default function AffiliateProductsPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<ProductStats>({
    totalProducts: 0,
    activeProducts: 0,
    totalClicks: 0,
    totalConversions: 0,
    totalEarnings: 0,
    averageCommissionRate: 0,
    topCategory: '',
    topVendor: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [vendorFilter, setVendorFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  useEffect(() => {
    fetchProducts();
    fetchStats();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await apiGet('/affiliate/products');
      setProducts(response.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      showSnackbar('Error fetching products', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiGet('/affiliate/products/stats');
      setStats(response.data || stats);
    } catch (error) {
      console.error('Error fetching product stats:', error);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleShareProduct = (product: Product) => {
    setSelectedProduct(product);
    setShareDialogOpen(true);
  };

  const handleGenerateLink = async (product: Product) => {
    try {
      const response = await apiPost('/affiliate/generate-product-link', {
        productId: product._id
      });

      if (response) {
        showSnackbar(t('affiliate.linkGenerated'), 'success');
      } else {
        showSnackbar(t('affiliate.errorGeneratingLink'), 'error');
      }
    } catch (error) {
      console.error('Error generating link:', error);
      showSnackbar(t('affiliate.errorGeneratingLink'), 'error');
    }
  };

  const handleToggleFavorite = async (product: Product) => {
    try {
      const response = await apiPost(`/affiliate/products/${product._id}/favorite`, {
        isFavorite: !product.isFavorite
      });

      if (response.success) {
        setProducts(prev => prev.map(p => 
          p._id === product._id ? { ...p, isFavorite: !p.isFavorite } : p
        ));
        showSnackbar(
          product.isFavorite ? 'Removed from favorites' : 'Added to favorites',
          'success'
        );
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      showSnackbar('Error updating favorites', 'error');
    }
  };

  const getUniqueCategories = () => {
    const categories = products.map(p => p.category);
    return [...new Set(categories)];
  };

  const getUniqueVendors = () => {
    const vendors = products.map(p => p.vendor.name);
    return [...new Set(vendors)];
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.vendor.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchesVendor = vendorFilter === 'all' || product.vendor.name === vendorFilter;
    
    return matchesSearch && matchesCategory && matchesVendor;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'price_low':
        return a.price - b.price;
      case 'price_high':
        return b.price - a.price;
      case 'commission_high':
        return b.commissionRate - a.commissionRate;
      case 'rating':
        return b.rating - a.rating;
      case 'sales':
        return b.salesCount - a.salesCount;
      default:
        return 0;
    }
  });

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
            {t('affiliate.products')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('affiliate.browseAndPromoteProducts')}
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
                      {stats.totalProducts}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('affiliate.totalProducts')}
                    </Typography>
                  </Box>
                  <ShoppingCartIcon sx={{ fontSize: 40, color: 'primary.main', opacity: 0.7 }} />
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
                      {stats.activeProducts}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('affiliate.activeProducts')}
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
                    <Typography variant="h4" fontWeight={700} color="info.main">
                      {stats.totalClicks}
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
                    <Typography variant="h4" fontWeight={700} color="warning.main">
                      ${stats.totalEarnings.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('affiliate.totalEarnings')}
                    </Typography>
                  </Box>
                  <MoneyIcon sx={{ fontSize: 40, color: 'warning.main', opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters and Search */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  placeholder={t('affiliate.searchProducts')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth>
                  <InputLabel>{t('affiliate.category')}</InputLabel>
                  <Select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    label={t('affiliate.category')}
                  >
                    <MenuItem value="all">{t('affiliate.allCategories')}</MenuItem>
                    {getUniqueCategories().map(category => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth>
                  <InputLabel>{t('affiliate.vendor')}</InputLabel>
                  <Select
                    value={vendorFilter}
                    onChange={(e) => setVendorFilter(e.target.value)}
                    label={t('affiliate.vendor')}
                  >
                    <MenuItem value="all">{t('affiliate.allVendors')}</MenuItem>
                    {getUniqueVendors().map(vendor => (
                      <MenuItem key={vendor} value={vendor}>
                        {vendor}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth>
                  <InputLabel>{t('affiliate.sortBy')}</InputLabel>
                  <Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    label={t('affiliate.sortBy')}
                  >
                    <MenuItem value="newest">{t('affiliate.newest')}</MenuItem>
                    <MenuItem value="oldest">{t('affiliate.oldest')}</MenuItem>
                    <MenuItem value="price_low">{t('affiliate.priceLowToHigh')}</MenuItem>
                    <MenuItem value="price_high">{t('affiliate.priceHighToLow')}</MenuItem>
                    <MenuItem value="commission_high">{t('affiliate.highestCommission')}</MenuItem>
                    <MenuItem value="rating">{t('affiliate.highestRating')}</MenuItem>
                    <MenuItem value="sales">{t('affiliate.mostSales')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={12} md={2}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={fetchProducts}
                  >
                    {t('affiliate.refresh')}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Products Grid */}
        <Grid container spacing={3}>
          {filteredProducts.map((product) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={product._id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ position: 'relative' }}>
                  <CardMedia
                    component="img"
                    height="200"
                    image={product.image || '/placeholder-product.jpg'}
                    alt={product.title}
                    sx={{ objectFit: 'cover' }}
                  />
                  <IconButton
                    sx={{ position: 'absolute', top: 8, right: 8 }}
                    onClick={() => handleToggleFavorite(product)}
                  >
                    {product.isFavorite ? (
                      <FavoriteIcon color="error" />
                    ) : (
                      <FavoriteBorderIcon />
                    )}
                  </IconButton>
                  <Chip
                    label={`${product.commissionRate}% Commission`}
                    color="success"
                    size="small"
                    sx={{ position: 'absolute', top: 8, left: 8 }}
                  />
                </Box>
                
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom noWrap>
                    {product.title}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Rating value={product.rating} readOnly size="small" />
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                      ({product.reviewCount})
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Avatar
                      src={product.vendor.logo}
                      sx={{ width: 24, height: 24 }}
                    >
                      {product.vendor.name.charAt(0)}
                    </Avatar>
                    <Typography variant="body2" color="text.secondary">
                      {product.vendor.name}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Typography variant="h6" fontWeight={700} color="primary.main">
                      ${product.price}
                    </Typography>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ textDecoration: 'line-through' }}
                      >
                        ${product.originalPrice}
                      </Typography>
                    )}
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                    {product.tags.slice(0, 2).map((tag, index) => (
                      <Chip
                        key={index}
                        label={tag}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {product.clickCount} {t('affiliate.clicks')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {product.conversionCount} {t('affiliate.conversions')}
                      </Typography>
                    </Box>
                    <Typography variant="body2" fontWeight={600} color="success.main">
                      ${product.earnings.toFixed(2)} {t('affiliate.earned')}
                    </Typography>
                  </Box>
                </CardContent>
                
                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button
                    size="small"
                    startIcon={<LinkIcon />}
                    onClick={() => handleGenerateLink(product)}
                    fullWidth
                  >
                    {t('affiliate.generateLink')}
                  </Button>
                  <Button
                    size="small"
                    startIcon={<ShareIcon />}
                    onClick={() => handleShareProduct(product)}
                    fullWidth
                  >
                    {t('affiliate.share')}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {filteredProducts.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <ShoppingCartIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {t('affiliate.noProductsFound')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('affiliate.tryAdjustingSearch')}
                </Typography>
          </Box>
        )}

        {/* Share Dialog */}
        <Dialog
          open={shareDialogOpen}
          onClose={() => setShareDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>{t('affiliate.shareProduct')}</DialogTitle>
          <DialogContent>
            {selectedProduct && (
              <Box sx={{ pt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Avatar
                    src={selectedProduct.image}
                    sx={{ width: 60, height: 60 }}
                  >
                    {selectedProduct.title.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={600}>
                      {selectedProduct.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedProduct.vendor.name}
                    </Typography>
                    <Typography variant="h6" color="primary.main">
                      ${selectedProduct.price}
                    </Typography>
                  </Box>
                </Box>
                
                <Typography variant="body2" color="text.secondary" paragraph>
                  {t('affiliate.shareProductDescription', { rate: selectedProduct.commissionRate })}
                </Typography>
                
                <Button
                  variant="contained"
                  startIcon={<LinkIcon />}
                  onClick={() => handleGenerateLink(selectedProduct)}
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  {t('affiliate.generateAffiliateLink')}
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<ShareIcon />}
                  fullWidth
                >
                  {t('affiliate.shareOnSocialMedia')}
                </Button>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShareDialogOpen(false)}>
              {t('affiliate.close')}
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
