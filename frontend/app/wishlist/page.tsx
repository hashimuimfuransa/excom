"use client";
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardMedia,
  CardContent,
  IconButton,
  Button,
  Stack,
  Paper,
  Breadcrumbs,
  Link as MuiLink,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Divider,
  useTheme,
  useMediaQuery,
  alpha,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  Delete as DeleteIcon,
  ShoppingCart as ShoppingCartIcon,
  Share as ShareIcon,
  SortByAlpha as SortIcon,
  Home as HomeIcon,
  FavoriteBorder as FavoriteBorderIcon,
  ShoppingBag as ShoppingBagIcon,
  ClearAll as ClearAllIcon
} from '@mui/icons-material';
import NextLink from 'next/link';
import { useWishlist } from '@utils/wishlist';
import { addToCart } from '@utils/cart';
import { getMainImage } from '@utils/imageHelpers';

type SortOption = 'newest' | 'oldest' | 'price-low' | 'price-high' | 'name';

export default function WishlistPage() {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const { items, removeItem, clearAll } = useWishlist();
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ 
    open: boolean; 
    message: string; 
    severity: 'success' | 'error' | 'info' 
  }>({ open: false, message: '', severity: 'success' });

  const sortedItems = [...items].sort((a, b) => {
    switch (sortBy) {
      case 'oldest':
        return new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'name':
        return a.title.localeCompare(b.title);
      case 'newest':
      default:
        return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
    }
  });

  const handleRemoveFromWishlist = (id: string) => {
    removeItem(id);
    setSnackbar({
      open: true,
      message: t('wishlist.removedFromWishlist'),
      severity: 'success'
    });
  };

  const handleClearWishlist = () => {
    clearAll();
    setClearDialogOpen(false);
    setSnackbar({
      open: true,
      message: t('wishlist.clearWishlist') + ' ✓',
      severity: 'info'
    });
  };

  const handleMoveToCart = (item: any) => {
    addToCart({
      id: item.id,
      title: item.title,
      price: item.price,
      image: item.image,
      quantity: 1
    });
    
    removeItem(item.id);
    setSnackbar({
      open: true,
      message: t('wishlist.moveToCart') + ' ✓',
      severity: 'success'
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: t('wishlist.title'),
          text: `${t('wishlist.itemsCount', { count: items.length })} on Excom`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
      setSnackbar({
        open: true,
        message: 'Link copied to clipboard!',
        severity: 'info'
      });
    }
  };

  const getTranslatedCategory = (category?: string) => {
    if (!category) return '';
    return t(`categories.${category}`) !== `categories.${category}` ? t(`categories.${category}`) : category;
  };

  return (
    <>
      <Container sx={{ py: 4 }}>
        {/* Breadcrumbs */}
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
            <FavoriteIcon fontSize="small" />
            {t('wishlist.title')}
          </Typography>
        </Breadcrumbs>

        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Stack 
            direction={{ xs: 'column', md: 'row' }} 
            justifyContent="space-between" 
            alignItems={{ xs: 'flex-start', md: 'center' }}
            spacing={2}
            sx={{ mb: 3 }}
          >
            <Box>
              <Typography 
                variant="h3" 
                fontWeight={800}
                sx={{
                  background: 'linear-gradient(45deg, #e91e63, #f06292)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }
                }}
              >
                {t('wishlist.myWishlist')}
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mt: 1 }}>
                {items.length > 0 
                  ? t('wishlist.itemsCount', { count: items.length })
                  : t('wishlist.noWishlistItems')
                }
              </Typography>
            </Box>
            
            {items.length > 0 && (
              <Stack direction="row" spacing={2}>
                <Tooltip title={t('wishlist.shareWishlist')}>
                  <Button
                    variant="outlined"
                    startIcon={<ShareIcon />}
                    onClick={handleShare}
                    sx={{ borderRadius: 3 }}
                  >
                    {!isMobile && t('wishlist.shareWishlist')}
                  </Button>
                </Tooltip>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<ClearAllIcon />}
                  onClick={() => setClearDialogOpen(true)}
                  sx={{ borderRadius: 3 }}
                >
                  {!isMobile && t('wishlist.clearWishlist')}
                </Button>
              </Stack>
            )}
          </Stack>

          {/* Sort Controls */}
          {items.length > 0 && (
            <Paper
              elevation={0}
              sx={{
                p: 2,
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, rgba(233, 30, 99, 0.1) 0%, rgba(240, 98, 146, 0.1) 100%)'
                  : 'linear-gradient(135deg, rgba(233, 30, 99, 0.05) 0%, rgba(240, 98, 146, 0.05) 100%)',
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                borderRadius: 3,
                backdropFilter: 'blur(10px)'
              }}
            >
              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                  {t('wishlist.sortBy')}:
                </Typography>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="newest">{t('wishlist.sortNewest')}</MenuItem>
                    <MenuItem value="oldest">{t('wishlist.sortOldest')}</MenuItem>
                    <MenuItem value="price-low">{t('wishlist.sortPriceLow')}</MenuItem>
                    <MenuItem value="price-high">{t('wishlist.sortPriceHigh')}</MenuItem>
                    <MenuItem value="name">{t('wishlist.sortName')}</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            </Paper>
          )}
        </Box>

        {/* Wishlist Content */}
        {items.length === 0 ? (
          /* Empty State */
          <Paper
            sx={{
              py: 8,
              px: 4,
              textAlign: 'center',
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(180deg, rgba(30, 30, 46, 0.5) 0%, rgba(20, 20, 35, 0.5) 100%)'
                : 'linear-gradient(180deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.8) 100%)',
              border: `3px dashed ${alpha(theme.palette.error.main, 0.3)}`,
              borderRadius: 4,
              backdropFilter: 'blur(20px)',
              maxWidth: 600,
              mx: 'auto'
            }}
          >
            <FavoriteBorderIcon 
              sx={{ 
                fontSize: 100, 
                color: 'text.disabled', 
                mb: 3,
                opacity: 0.5 
              }} 
            />
            <Typography variant="h4" color="text.secondary" fontWeight={700} gutterBottom>
              {t('wishlist.emptyWishlist')}
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 4, maxWidth: 400, mx: 'auto' }}>
              {t('wishlist.emptyWishlistDescription')}
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<ShoppingBagIcon />}
              component={NextLink}
              href="/product"
              sx={{
                borderRadius: 3,
                px: 4,
                py: 1.5,
                textTransform: 'none',
                fontSize: '1.1rem',
                fontWeight: 600,
                background: 'linear-gradient(45deg, #e91e63, #f06292)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #c2185b, #e91e63)',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              {t('wishlist.startShopping')}
            </Button>
          </Paper>
        ) : (
          /* Wishlist Items */
          <Grid container spacing={3}>
            {sortedItems.map((item) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    borderRadius: 3,
                    overflow: 'hidden',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
                  {/* Remove Button */}
                  <Tooltip title={t('wishlist.removeFromWishlist')}>
                    <IconButton
                      onClick={() => handleRemoveFromWishlist(item.id)}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        zIndex: 2,
                        bgcolor: 'rgba(244, 67, 54, 0.9)',
                        color: 'white',
                        width: 36,
                        height: 36,
                        '&:hover': {
                          bgcolor: 'error.main',
                          transform: 'scale(1.1)'
                        }
                      }}
                      size="small"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  <Box 
                    component={NextLink} 
                    href={`/product/${item.id}`}
                    sx={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <CardMedia
                      component="img"
                      height={200}
                      image={item.image || getMainImage([], 'product', item.id)}
                      alt={item.title}
                      sx={{
                        objectFit: 'cover',
                        transition: 'transform 0.3s ease',
                        '&:hover': {
                          transform: 'scale(1.05)'
                        }
                      }}
                    />
                  </Box>

                  <CardContent sx={{ flexGrow: 1, p: 2 }}>
                    <Typography
                      variant="h6"
                      fontWeight={700}
                      gutterBottom
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: 1.3,
                        fontSize: '1rem'
                      }}
                    >
                      {item.title}
                    </Typography>

                    {item.category && (
                      <Chip
                        label={getTranslatedCategory(item.category)}
                        size="small"
                        variant="outlined"
                        color="primary"
                        sx={{ mb: 1, fontSize: '0.7rem' }}
                      />
                    )}

                    <Typography 
                      variant="h5" 
                      fontWeight={800} 
                      color="success.main"
                      sx={{ mb: 1 }}
                    >
                      ${item.price.toFixed(2)}
                    </Typography>

                    <Typography variant="caption" color="text.secondary">
                      {t('wishlist.addedOn')} {new Date(item.addedAt).toLocaleDateString()}
                    </Typography>
                  </CardContent>

                  <Box sx={{ p: 2, pt: 0 }}>
                    <Stack spacing={1}>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<ShoppingCartIcon />}
                        onClick={() => handleMoveToCart(item)}
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
                        {t('wishlist.moveToCart')}
                      </Button>
                      
                      <Button
                        fullWidth
                        variant="outlined"
                        component={NextLink}
                        href={`/product/${item.id}`}
                        sx={{
                          borderRadius: 2,
                          textTransform: 'none',
                          fontWeight: 600
                        }}
                      >
                        {t('wishlist.viewProduct')}
                      </Button>
                    </Stack>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      {/* Clear Wishlist Confirmation Dialog */}
      <Dialog
        open={clearDialogOpen}
        onClose={() => setClearDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            minWidth: { xs: '90vw', sm: 400 }
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: 'error.main' }}>
          {t('wishlist.clearWishlist')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: '1rem' }}>
            {t('wishlist.confirmClearWishlist')}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setClearDialogOpen(false)}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            {t('actions.cancel')}
          </Button>
          <Button 
            onClick={handleClearWishlist} 
            color="error" 
            variant="contained"
            sx={{ borderRadius: 2, textTransform: 'none' }}
            autoFocus
          >
            {t('wishlist.clearWishlist')}
          </Button>
        </DialogActions>
      </Dialog>

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