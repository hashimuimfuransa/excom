"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Container, 
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  Typography, 
  Stack, 
  Skeleton, 
  Pagination, 
  TextField, 
  InputAdornment, 
  Box, 
  Drawer, 
  IconButton, 
  Chip, 
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CardActions,
  Fab,
  alpha,
  useTheme,
  useMediaQuery,
  Breadcrumbs,
  Link as MuiLink,
  Tooltip,
  Paper,
  Divider,
  Badge,
  Snackbar,
  Alert
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import StarIcon from '@mui/icons-material/Star';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewListIcon from '@mui/icons-material/ViewList';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import HomeIcon from '@mui/icons-material/Home';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import NextLink from 'next/link';
import { apiGet } from '@utils/api';
import ProductFilters, { Filters } from './filters';
import { getMainImage, hasRealImages } from '@utils/imageHelpers';
import { useWishlist } from '@utils/wishlist';
import { addToCart } from '@utils/cart';

interface Product {
  _id: string;
  title: string;
  images: string[];
  price: number;
  category?: string;
  description?: string;
  seller?: {
    name: string;
    _id: string;
  };
  createdAt?: string;
  rating?: number;
  reviewCount?: number;
}

type SortOption = 'newest' | 'price-low' | 'price-high' | 'rating' | 'popularity';
type ViewMode = 'grid' | 'list';

export default function ProductListPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<Product[] | null>(null);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Filters>({});
  const [open, setOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ 
    open: false, message: '', severity: 'success' 
  });
  
  const itemsPerPage = 12;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isItemInWishlist } = useWishlist();

  useEffect(() => {
    let alive = true;
    apiGet<Product[]>("/products").then((list) => {
      if (!alive) return;
      setItems(list);
    }).catch(() => setItems([]));
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const filtered = useMemo(() => {
    let result = (items || []).filter((p) => {
      if (query && !p.title.toLowerCase().includes(query.toLowerCase())) return false;
      if (filters.minPrice != null && p.price < filters.minPrice) return false;
      if (filters.maxPrice != null && p.price > filters.maxPrice) return false;
      if (filters.categories && filters.categories.length && !filters.categories.includes(p.category || '')) return false;
      if (filters.rating != null && (p.rating || 4.5) < filters.rating) return false;
      return true;
    });

    // Sort products
    result.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'rating':
          return (b.rating || 4.5) - (a.rating || 4.5);
        case 'popularity':
          return (b.reviewCount || 0) - (a.reviewCount || 0);
        case 'newest':
        default:
          return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
      }
    });

    return result;
  }, [items, query, filters, sortBy]);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filtered.slice(startIndex, startIndex + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const toggleWishlist = (product: Product) => {
    const isInWishlist = isItemInWishlist(product._id);
    
    if (isInWishlist) {
      removeFromWishlist(product._id);
      setSnackbar({
        open: true,
        message: t('wishlist.removedFromWishlist'),
        severity: 'success'
      });
    } else {
      addToWishlist({
        id: product._id,
        title: product.title,
        price: product.price,
        image: getMainImage(product.images, 'product', product._id),
        category: product.category,
        description: product.description,
        seller: product.seller,
        rating: product.rating,
        reviewCount: product.reviewCount,
        createdAt: product.createdAt
      });
      setSnackbar({
        open: true,
        message: t('wishlist.addedToWishlist'),
        severity: 'success'
      });
    }
  };

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    addToCart({
      id: product._id,
      title: product.title,
      price: product.price,
      image: getMainImage(product.images, 'product', product._id),
      quantity: 1
    });
    
    setSnackbar({
      open: true,
      message: t('productsPage.addToCart') + ' ✓',
      severity: 'success'
    });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getTranslatedCategory = (category?: string) => {
    if (!category) return '';
    return t(`categories.${category}`) !== `categories.${category}` ? t(`categories.${category}`) : category;
  };

  return (
    <>
      <Container sx={{ py: 4 }}>
        {/* Enhanced Breadcrumbs */}
        <Breadcrumbs 
          sx={{ 
            mb: 3,
            '& .MuiBreadcrumbs-separator': {
              color: 'primary.main'
            }
          }}
        >
          <MuiLink 
            component={NextLink} 
            href="/" 
            color="inherit" 
            underline="hover"
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.5,
              '&:hover': { color: 'primary.main' }
            }}
          >
            <HomeIcon fontSize="small" />
            {t('pages.home')}
          </MuiLink>
          <Typography 
            color="primary.main" 
            fontWeight={600}
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            <ShoppingBagIcon fontSize="small" />
            {t('navigation.products')}
          </Typography>
        </Breadcrumbs>

        {/* Enhanced Header */}
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h3" 
            fontWeight={800} 
            gutterBottom
            sx={{
              background: 'linear-gradient(45deg, #7c3aed, #06b6d4)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }
            }}
          >
            {t('productsPage.title')}
          </Typography>
          <Typography 
            variant="h6" 
            color="text.secondary" 
            sx={{ 
              mb: 4,
              maxWidth: 600,
              fontSize: { xs: '1rem', sm: '1.1rem' }
            }}
          >
            {t('productsPage.subtitle')}
          </Typography>
          
          {/* Enhanced Search and Controls */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, md: 3 },
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)'
                : 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%)',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              borderRadius: 3,
              backdropFilter: 'blur(10px)'
            }}
          >
            <Stack
              direction={{ xs: 'column', lg: 'row' }}
              spacing={2}
              alignItems={{ xs: 'stretch', lg: 'center' }}
              justifyContent="space-between"
            >
              <Stack 
                direction={{ xs: 'column', sm: 'row' }} 
                spacing={2} 
                sx={{ flex: 1 }}
              >
                <TextField
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('productsPage.searchPlaceholder')}
                  variant="outlined"
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="primary" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ 
                    maxWidth: { sm: 400 },
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      '&:hover fieldset': {
                        borderColor: 'primary.main',
                      }
                    }
                  }}
                />
                
                <FormControl 
                  variant="outlined" 
                  sx={{ 
                    minWidth: { xs: '100%', sm: 200 },
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                    }
                  }}
                >
                  <InputLabel>{t('productsPage.sortBy')}</InputLabel>
                  <Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    label={t('productsPage.sortBy')}
                    startAdornment={<SortIcon sx={{ mr: 1, color: 'text.secondary' }} />}
                  >
                    <MenuItem value="newest">{t('productsPage.newest')}</MenuItem>
                    <MenuItem value="price-low">{t('productsPage.priceLowToHigh')}</MenuItem>
                    <MenuItem value="price-high">{t('productsPage.priceHighToLow')}</MenuItem>
                    <MenuItem value="rating">{t('productsPage.highestRated')}</MenuItem>
                    <MenuItem value="popularity">{t('productsPage.mostPopular')}</MenuItem>
                  </Select>
                </FormControl>
              </Stack>

              <Stack direction="row" spacing={1} alignItems="center">
                <Tooltip title={t('productsPage.gridView')}>
                  <IconButton
                    onClick={() => setViewMode('grid')}
                    color={viewMode === 'grid' ? 'primary' : 'default'}
                    sx={{
                      bgcolor: viewMode === 'grid' ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                      borderRadius: 2,
                      border: viewMode === 'grid' ? `1px solid ${alpha(theme.palette.primary.main, 0.3)}` : '1px solid transparent'
                    }}
                  >
                    <ViewModuleIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('productsPage.listView')}>
                  <IconButton
                    onClick={() => setViewMode('list')}
                    color={viewMode === 'list' ? 'primary' : 'default'}
                    sx={{
                      bgcolor: viewMode === 'list' ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                      borderRadius: 2,
                      border: viewMode === 'list' ? `1px solid ${alpha(theme.palette.primary.main, 0.3)}` : '1px solid transparent'
                    }}
                  >
                    <ViewListIcon />
                  </IconButton>
                </Tooltip>
                <Divider orientation="vertical" flexItem sx={{ mx: 1, height: 24, alignSelf: 'center' }} />
                <Button
                  variant="outlined"
                  startIcon={<FilterListIcon />}
                  onClick={() => setOpen(true)}
                  sx={{ 
                    borderRadius: 3,
                    textTransform: 'none',
                    fontWeight: 600
                  }}
                >
                  {t('productsPage.filters')}
                </Button>
              </Stack>
            </Stack>
            
            {/* Enhanced Results Summary */}
            <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Typography variant="body1" color="text.primary" fontWeight={600}>
                {items ? `${filtered.length} ${t('productsPage.productsFound')}` : t('productsPage.loadingProducts')}
              </Typography>
              {query && (
                <Chip
                  label={`${t('productsPage.searchColon')} "${query}"`}
                  onDelete={() => setQuery('')}
                  size="small"
                  variant="filled"
                  color="primary"
                  sx={{ borderRadius: 2 }}
                />
              )}
              {filters.categories && filters.categories.length > 0 && (
                <Chip
                  label={`${t('productsPage.categoriesColon')} ${filters.categories.length}`}
                  size="small"
                  variant="outlined"
                  color="primary"
                  sx={{ borderRadius: 2 }}
                />
              )}
            </Box>
          </Paper>
        </Box>

        {/* Enhanced Filters Drawer */}
        <Drawer 
          anchor="right" 
          open={open} 
          onClose={() => setOpen(false)}
          PaperProps={{
            sx: {
              width: { xs: '90vw', sm: 400 },
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(180deg, rgba(30, 30, 46, 0.95) 0%, rgba(20, 20, 35, 0.95) 100%)'
                : 'linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
              backdropFilter: 'blur(20px)'
            }
          }}
        >
          <Box sx={{ p: 3 }}>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              {t('productsPage.filterProducts')}
            </Typography>
            <ProductFilters products={(items || [])} onChange={setFilters} />
          </Box>
        </Drawer>

        {/* Enhanced Loading State */}
        {!items ? (
          <Grid container spacing={3}>
            {Array.from({ length: 12 }).map((_, i) => (
              <Grid item xs={6} sm={4} md={viewMode === 'grid' ? 3 : 12} key={i}>
                <Card 
                  sx={{ 
                    p: viewMode === 'list' ? 2 : 0,
                    borderRadius: 3,
                    boxShadow: theme.palette.mode === 'dark' 
                      ? '0 8px 32px rgba(0,0,0,0.3)'
                      : '0 8px 32px rgba(0,0,0,0.1)'
                  }}
                >
                  {viewMode === 'list' ? (
                    <Stack direction="row" spacing={2}>
                      <Skeleton variant="rectangular" width={120} height={120} sx={{ borderRadius: 2 }} />
                      <Box sx={{ flex: 1 }}>
                        <Skeleton width="80%" height={30} />
                        <Skeleton width="60%" height={20} sx={{ mt: 1 }} />
                        <Skeleton width="40%" height={20} sx={{ mt: 1 }} />
                        <Skeleton width="30%" height={35} sx={{ mt: 2 }} />
                      </Box>
                    </Stack>
                  ) : (
                    <>
                      <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
                      <CardContent>
                        <Skeleton width="80%" height={25} />
                        <Skeleton width="60%" height={20} sx={{ mt: 1 }} />
                        <Skeleton width="40%" height={20} sx={{ mt: 1 }} />
                        <Skeleton width="50%" height={30} sx={{ mt: 2 }} />
                      </CardContent>
                    </>
                  )}
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <>
            {/* Enhanced Products Grid/List */}
            <Grid container spacing={3}>
              {paginatedItems.map((p) => {
                const img = getMainImage(p.images, 'product', p._id);
                const isRealImage = hasRealImages(p.images);
                const isWishlisted = isItemInWishlist(p._id);
                const rating = p.rating || 4.5;
                const reviewCount = p.reviewCount || Math.floor(Math.random() * 50) + 1;

                return (
                  <Grid item xs={6} sm={4} md={viewMode === 'grid' ? 3 : 12} key={p._id}>
                    <Card
                      sx={{
                        position: 'relative',
                        height: '100%',
                        display: 'flex',
                        flexDirection: viewMode === 'list' ? 'row' : 'column',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        cursor: 'pointer',
                        borderRadius: 3,
                        overflow: 'hidden',
                        boxShadow: theme.palette.mode === 'dark'
                          ? '0 4px 20px rgba(0,0,0,0.25)'
                          : '0 4px 20px rgba(0,0,0,0.08)',
                        '&:hover': {
                          transform: 'translateY(-8px)',
                          boxShadow: theme.palette.mode === 'dark'
                            ? '0 20px 60px rgba(0,0,0,0.4)'
                            : '0 20px 60px rgba(0,0,0,0.15)',
                        }
                      }}
                    >
                      {/* Enhanced Wishlist Button */}
                      <Tooltip title={isWishlisted ? t('wishlist.removeFromWishlist') : t('wishlist.addToWishlist')}>
                        <IconButton
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleWishlist(p);
                          }}
                          sx={{
                            position: 'absolute',
                            top: 12,
                            right: 12,
                            zIndex: 3,
                            bgcolor: 'rgba(255, 255, 255, 0.9)',
                            backdropFilter: 'blur(10px)',
                            width: 40,
                            height: 40,
                            '&:hover': {
                              bgcolor: 'rgba(255, 255, 255, 1)',
                              transform: 'scale(1.1)'
                            }
                          }}
                          size="small"
                        >
                          {isWishlisted ? (
                            <FavoriteIcon color="error" />
                          ) : (
                            <FavoriteBorderIcon />
                          )}
                        </IconButton>
                      </Tooltip>

                      {viewMode === 'grid' ? (
                        /* Enhanced Grid Layout */
                        <Box 
                          component={NextLink} 
                          href={`/product/${p._id}`} 
                          sx={{ 
                            textDecoration: 'none', 
                            color: 'inherit', 
                            height: '100%', 
                            display: 'flex', 
                            flexDirection: 'column' 
                          }}
                        >
                          <Box sx={{ position: 'relative', overflow: 'hidden', aspectRatio: '4/3' }}>
                            <CardMedia
                              component="img"
                              height="100%"
                              image={img}
                              alt={p.title}
                              sx={{
                                filter: isRealImage ? 'none' : 'brightness(0.9) sepia(0.1)',
                                transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                objectFit: 'cover',
                                '&:hover': {
                                  transform: 'scale(1.1)'
                                }
                              }}
                            />
                            {!isRealImage && (
                              <Chip
                                label={t('productsPage.stockPhoto')}
                                size="small"
                                sx={{
                                  position: 'absolute',
                                  bottom: 8,
                                  left: 8,
                                  backgroundColor: 'rgba(0,0,0,0.7)',
                                  color: 'white',
                                  fontSize: '0.65rem',
                                  height: 20,
                                  borderRadius: 1
                                }}
                              />
                            )}
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 8,
                                left: 8,
                                bgcolor: 'success.main',
                                color: 'white',
                                px: 1.5,
                                py: 0.5,
                                borderRadius: 2,
                                fontSize: '0.875rem',
                                fontWeight: 700,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                              }}
                            >
                              ${p.price.toFixed(2)}
                            </Box>
                          </Box>
                          <CardContent sx={{ 
                            flexGrow: 1, 
                            display: 'flex', 
                            flexDirection: 'column', 
                            justifyContent: 'space-between',
                            p: 2
                          }}>
                            <Box>
                              <Typography
                                variant="h6"
                                fontWeight={700}
                                gutterBottom
                                sx={{
                                  fontSize: { xs: '0.9rem', sm: '1.1rem' },
                                  lineHeight: 1.3,
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  mb: 1
                                }}
                              >
                                {p.title}
                              </Typography>
                              {p.category && (
                                <Chip
                                  label={getTranslatedCategory(p.category)}
                                  size="small"
                                  variant="outlined"
                                  color="primary"
                                  sx={{ 
                                    mb: 1.5, 
                                    fontSize: '0.7rem',
                                    borderRadius: 1
                                  }}
                                />
                              )}
                            </Box>
                            
                            <Stack spacing={1}>
                              <Stack direction="row" alignItems="center" spacing={0.5}>
                                <StarIcon sx={{ color: 'warning.main', fontSize: 18 }} />
                                <Typography variant="body2" fontWeight={700}>
                                  {rating.toFixed(1)}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  ({reviewCount})
                                </Typography>
                              </Stack>
                              
                              <Button
                                variant="contained"
                                startIcon={<ShoppingCartIcon />}
                                size="small"
                                onClick={(e) => handleAddToCart(p, e)}
                                sx={{
                                  borderRadius: 2,
                                  textTransform: 'none',
                                  fontWeight: 600,
                                  background: 'linear-gradient(45deg, #7c3aed, #06b6d4)',
                                  '&:hover': {
                                    background: 'linear-gradient(45deg, #6d28d9, #0891b2)',
                                    transform: 'translateY(-1px)'
                                  }
                                }}
                              >
                                {t('productsPage.addToCart')}
                              </Button>
                            </Stack>
                          </CardContent>
                        </Box>
                      ) : (
                        /* Enhanced List Layout */
                        <Box 
                          component={NextLink} 
                          href={`/product/${p._id}`} 
                          sx={{ 
                            textDecoration: 'none', 
                            color: 'inherit', 
                            display: 'flex', 
                            width: '100%', 
                            p: 3,
                            gap: 3
                          }}
                        >
                          <Box sx={{ position: 'relative', flexShrink: 0 }}>
                            <CardMedia
                              component="img"
                              sx={{ 
                                width: { xs: 100, sm: 140 }, 
                                height: { xs: 100, sm: 140 }, 
                                borderRadius: 2,
                                objectFit: 'cover'
                              }}
                              image={img}
                              alt={p.title}
                            />
                            {!isRealImage && (
                              <Chip
                                label={t('productsPage.stockPhoto')}
                                size="small"
                                sx={{
                                  position: 'absolute',
                                  bottom: 4,
                                  left: 4,
                                  backgroundColor: 'rgba(0,0,0,0.7)',
                                  color: 'white',
                                  fontSize: '0.6rem',
                                  height: 16
                                }}
                              />
                            )}
                          </Box>
                          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <Box>
                              <Typography variant="h5" fontWeight={700} gutterBottom>
                                {p.title}
                              </Typography>
                              <Typography 
                                variant="body1" 
                                color="text.secondary" 
                                sx={{ 
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  mb: 2
                                }}
                              >
                                {p.description || 'High-quality product with excellent features and design.'}
                              </Typography>
                              {p.category && (
                                <Chip 
                                  label={getTranslatedCategory(p.category)} 
                                  size="small" 
                                  variant="outlined" 
                                  color="primary"
                                  sx={{ mb: 2 }} 
                                />
                              )}
                            </Box>
                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                              <Stack spacing={1}>
                                <Typography variant="h5" fontWeight={700} color="success.main">
                                  ${p.price.toFixed(2)}
                                </Typography>
                                <Stack direction="row" alignItems="center" spacing={0.5}>
                                  <StarIcon sx={{ color: 'warning.main', fontSize: 18 }} />
                                  <Typography variant="body2" fontWeight={600}>
                                    {rating.toFixed(1)}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    ({reviewCount})
                                  </Typography>
                                </Stack>
                              </Stack>
                              <Button
                                variant="contained"
                                startIcon={<ShoppingCartIcon />}
                                onClick={(e) => handleAddToCart(p, e)}
                                sx={{
                                  borderRadius: 2,
                                  textTransform: 'none',
                                  fontWeight: 600,
                                  px: 3,
                                  py: 1,
                                  background: 'linear-gradient(45deg, #7c3aed, #06b6d4)',
                                  '&:hover': {
                                    background: 'linear-gradient(45deg, #6d28d9, #0891b2)',
                                    transform: 'translateY(-1px)'
                                  }
                                }}
                              >
                                {t('productsPage.addToCart')}
                              </Button>
                            </Stack>
                          </Box>
                        </Box>
                      )}
                    </Card>
                  </Grid>
                );
              })}
            </Grid>

            {/* Enhanced Pagination */}
            {totalPages > 1 && (
              <Box sx={{ mt: 6, display: 'flex', justifyContent: 'center' }}>
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={(_, page) => {
                    setCurrentPage(page);
                    scrollToTop();
                  }}
                  color="primary"
                  size={isMobile ? 'small' : 'large'}
                  sx={{
                    '& .MuiPaginationItem-root': {
                      borderRadius: 3,
                      fontWeight: 600,
                      fontSize: '1rem',
                      '&:hover': {
                        transform: 'translateY(-2px)'
                      }
                    }
                  }}
                />
              </Box>
            )}

            {/* Enhanced Empty State */}
            {filtered.length === 0 && (
              <Paper
                sx={{
                  py: 8,
                  textAlign: 'center',
                  background: 'transparent',
                  boxShadow: 'none',
                  border: `3px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
                  borderRadius: 4,
                  mx: 'auto',
                  maxWidth: 500
                }}
              >
                <SearchIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 3 }} />
                <Typography variant="h5" color="text.secondary" fontWeight={600} gutterBottom>
                  {t('productsPage.noProductsFound')}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  {t('productsPage.adjustSearch')}
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => {
                    setQuery('');
                    setFilters({});
                    setCurrentPage(1);
                  }}
                  sx={{
                    borderRadius: 3,
                    px: 4,
                    py: 1.5,
                    textTransform: 'none',
                    fontWeight: 600,
                    background: 'linear-gradient(45deg, #7c3aed, #06b6d4)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #6d28d9, #0891b2)',
                    }
                  }}
                >
                  {t('productsPage.clearAllFilters')}
                </Button>
              </Paper>
            )}
          </>
        )}
      </Container>

      {/* Enhanced Scroll to Top Button */}
      {showScrollTop && (
        <Fab
          color="primary"
          size="large"
          onClick={scrollToTop}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000,
            background: 'linear-gradient(45deg, #7c3aed, #06b6d4)',
            boxShadow: '0 8px 32px rgba(124, 58, 237, 0.3)',
            '&:hover': {
              background: 'linear-gradient(45deg, #6d28d9, #0891b2)',
              transform: 'scale(1.1) rotate(5deg)'
            }
          }}
        >
          <ArrowUpwardIcon />
        </Fab>
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}