"use client";
import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Stack,
  IconButton,
  TextField,
  Divider,
  Paper,
  Chip,
  Alert,
  Avatar,
  CircularProgress
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  ShoppingCartOutlined as EmptyCartIcon,
  LocalShipping as ShippingIcon,
  Security as SecurityIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { useCart, CartItem, BookingCartItem, removeFromCart, addToCart, removeBookingFromCart } from '@utils/cart';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { getCartItemImage, hasRealImages } from '@utils/imageHelpers';

export default function CartPage() {
  const { t } = useTranslation();
  const { items, setItems, bookingItems, setBookingItems, total, bookingTotal, grandTotal, refreshCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());
  const router = useRouter();

  // Refresh cart items on mount
  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setUpdatingItems(prev => new Set(prev).add(itemId));
    
    try {
      // Update quantity by removing and re-adding with new quantity
      const item = items.find(i => i.id === itemId);
      if (item) {
        removeFromCart(itemId);
        addToCart({ ...item, quantity: newQuantity });
        
        // Update local state
        const updatedItems = items.map(i => 
          i.id === itemId ? { ...i, quantity: newQuantity } : i
        );
        setItems(updatedItems);
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    setUpdatingItems(prev => new Set(prev).add(itemId));
    
    try {
      removeFromCart(itemId);
      const updatedItems = items.filter(i => i.id !== itemId);
      setItems(updatedItems);
    } catch (error) {
      console.error('Error removing item:', error);
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const handleRemoveBooking = async (itemId: string) => {
    setUpdatingItems(prev => new Set(prev).add(itemId));
    
    try {
      removeBookingFromCart(itemId);
      refreshCart();
    } catch (error) {
      console.error('Error removing booking:', error);
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const handleProceedToCheckout = async () => {
    setCheckoutLoading(true);
    
    // Check if user is logged in (especially important if there are bookings)
    const token = localStorage.getItem('excom_token');
    
    if (!token && bookingItems.length > 0) {
      // Redirect to login if user has bookings but is not logged in
      setCheckoutLoading(false);
      router.push('/auth/login?redirect=checkout');
      return;
    }
    
    // Small delay to show loading state
    setTimeout(() => {
      setCheckoutLoading(false);
      router.push('/checkout');
    }, 500);
  };

  const BookingCartItemCard = ({ item }: { item: BookingCartItem }) => {
    const isUpdating = updatingItems.has(item.id);
    
    return (
      <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'primary.main', borderWidth: 2 }}>
        <CardContent>
          <Stack direction="row" spacing={2}>
            {/* Booking Image */}
            <Card sx={{ width: 100, height: 100, borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
              <CardMedia
                component="img"
                width="100%"
                height="100%"
                image={getCartItemImage({ image: item.image, type: 'booking', id: item.id })}
                alt={item.title}
                sx={{ 
                  objectFit: 'cover',
                  filter: hasRealImages([item.image]) ? 'none' : 'brightness(0.9) sepia(0.1)'
                }}
              />
              {!hasRealImages([item.image]) && (
                <Chip
                  label="Stock"
                  size="small"
                  sx={{
                    position: 'absolute',
                    bottom: 2,
                    left: 2,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    fontSize: '0.6rem',
                    height: 16
                  }}
                />
              )}
            </Card>

            {/* Booking Details */}
            <Box flex={1}>
              <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                <Chip 
                  label={t('cart.booking_')} 
                  size="small" 
                  color="primary" 
                  variant="filled" 
                />
              </Stack>

              <Typography variant="h6" fontWeight={600} gutterBottom>
                {item.title}
              </Typography>
              
              <Typography variant="h6" color="primary.main" fontWeight={700} gutterBottom>
                ${item.price.toFixed(2)}
              </Typography>

              {/* Booking Info */}
              <Stack spacing={0.5} mt={1}>
                {item.bookingData.checkIn && item.bookingData.checkOut && (
                  <Typography variant="body2" color="text.secondary">
                    {t('cart.checkIn')}: {new Date(item.bookingData.checkIn).toLocaleDateString()} - 
                    {t('cart.checkOut')}: {new Date(item.bookingData.checkOut).toLocaleDateString()}
                  </Typography>
                )}
                <Typography variant="body2" color="text.secondary">
                  {t('cart.guests')}: {item.bookingData.guests}
                </Typography>
                {item.bookingData.roomType && (
                  <Typography variant="body2" color="text.secondary">
                    {t('cart.roomType')}: {item.bookingData.roomType}
                  </Typography>
                )}
                <Typography variant="body2" color="text.secondary">
                  {t('cart.customer')}: {item.bookingData.customerInfo.name} ({item.bookingData.customerInfo.email})
                </Typography>
              </Stack>
            </Box>

            {/* Remove Button */}
            <IconButton 
              onClick={() => handleRemoveBooking(item.id)}
              disabled={isUpdating}
              sx={{ 
                color: 'error.main',
                '&:hover': { bgcolor: 'error.main', color: 'white' }
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Stack>
        </CardContent>
      </Card>
    );
  };

  const CartItemCard = ({ item }: { item: CartItem }) => {
    const isUpdating = updatingItems.has(item.id);
    
    return (
      <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <CardContent>
          <Stack direction="row" spacing={2}>
            {/* Product Image */}
            <Card sx={{ width: 100, height: 100, borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
              <CardMedia
                component="img"
                width="100%"
                height="100%"
                image={getCartItemImage({ image: item.image, type: 'product', id: item.id })}
                alt={item.title}
                sx={{ 
                  objectFit: 'cover',
                  filter: hasRealImages([item.image]) ? 'none' : 'brightness(0.9) sepia(0.1)'
                }}
              />
              {!hasRealImages([item.image]) && (
                <Chip
                  label="Stock"
                  size="small"
                  sx={{
                    position: 'absolute',
                    bottom: 2,
                    left: 2,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    fontSize: '0.6rem',
                    height: 16
                  }}
                />
              )}
            </Card>

            {/* Product Details */}
            <Box flex={1}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                {item.title}
              </Typography>
              
              <Typography variant="h6" color="primary.main" fontWeight={700} gutterBottom>
                ${item.price.toFixed(2)}
              </Typography>

              {/* Quantity Controls */}
              <Stack direction="row" alignItems="center" spacing={1} mt={2}>
                <Typography variant="body2" color="text.secondary" mr={1}>
                  {t('cart.quantity')}:
                </Typography>
                <IconButton 
                  size="small"
                  onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                  disabled={item.quantity <= 1 || isUpdating}
                  sx={{ border: '1px solid', borderColor: 'divider' }}
                >
                  <RemoveIcon fontSize="small" />
                </IconButton>
                
                <TextField
                  value={item.quantity}
                  onChange={(e) => {
                    const newQty = parseInt(e.target.value) || 1;
                    handleUpdateQuantity(item.id, newQty);
                  }}
                  inputProps={{ 
                    style: { textAlign: 'center' },
                    min: 1,
                    type: 'number'
                  }}
                  sx={{ width: 60 }}
                  size="small"
                  disabled={isUpdating}
                />
                
                <IconButton 
                  size="small"
                  onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                  disabled={isUpdating}
                  sx={{ border: '1px solid', borderColor: 'divider' }}
                >
                  <AddIcon fontSize="small" />
                </IconButton>

                {isUpdating && (
                  <CircularProgress size={20} />
                )}
              </Stack>

              {/* Subtotal */}
              <Typography variant="body2" color="text.secondary" mt={1}>
                {t('cart.subtotal')}: ${(item.price * item.quantity).toFixed(2)}
              </Typography>
            </Box>

            {/* Remove Button */}
            <IconButton 
              onClick={() => handleRemoveItem(item.id)}
              disabled={isUpdating}
              sx={{ 
                color: 'error.main',
                '&:hover': { bgcolor: 'error.main', color: 'white' }
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Stack>
        </CardContent>
      </Card>
    );
  };

  if (items.length === 0 && bookingItems.length === 0) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
          <Avatar sx={{ 
            mx: 'auto', 
            mb: 3, 
            width: 80, 
            height: 80, 
            bgcolor: 'grey.100' 
          }}>
            <EmptyCartIcon fontSize="large" color="action" />
          </Avatar>
          
          <Typography variant="h5" fontWeight={700} gutterBottom>
            {t('cart.emptyCart')}
          </Typography>
          
          <Typography variant="body1" color="text.secondary" mb={4}>
            {t('cart.emptyCartMessage')}
          </Typography>
          
          <Button
            component={NextLink}
            href="/"
            variant="contained"
            size="large"
            sx={{ borderRadius: 2, px: 4 }}
          >
            {t('cart.continueShopping')}
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        {t('cart.title')}
      </Typography>
      
      <Typography variant="body1" color="text.secondary" gutterBottom>
        {t('cart.reviewItems')}
      </Typography>

      <Grid container spacing={4} mt={2}>
        {/* Cart Items */}
        <Grid item xs={12} md={8}>
          <Stack spacing={2}>
            {/* Booking Items First */}
            {bookingItems.map((item) => (
              <BookingCartItemCard key={item.id} item={item} />
            ))}
            
            {/* Regular Items */}
            {items.map((item) => (
              <CartItemCard key={item.id} item={item} />
            ))}
          </Stack>

          {/* Continue Shopping */}
          <Box mt={3}>
            <Button
              component={NextLink}
              href="/"
              variant="outlined"
              startIcon={<ArrowForwardIcon sx={{ transform: 'rotate(180deg)' }} />}
            >
              {t('cart.continueShopping')}
            </Button>
          </Box>
        </Grid>

        {/* Order Summary */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3, position: 'sticky', top: 20 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              {t('cart.orderSummary')}
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            <Stack spacing={2}>
              {items.length > 0 && (
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    {t('cart.products')} ({items.length} {items.length !== 1 ? t('cart.items') : t('cart.item')})
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    ${total.toFixed(2)}
                  </Typography>
                </Stack>
              )}
              
              {bookingItems.length > 0 && (
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    {t('cart.bookings')} ({bookingItems.length} {bookingItems.length !== 1 ? t('cart.bookings') : t('cart.booking')})
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    ${bookingTotal.toFixed(2)}
                  </Typography>
                </Stack>
              )}
              
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  {t('cart.shipping')}
                </Typography>
                <Chip 
                  label={t('cart.free')} 
                  size="small" 
                  color="success" 
                  variant="outlined"
                />
              </Stack>
              
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  {t('cart.tax')}
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {t('cart.calculatedAtCheckout')}
                </Typography>
              </Stack>
              
              <Divider />
              
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="h6" fontWeight={700}>
                  {t('cart.total')}
                </Typography>
                <Typography variant="h6" fontWeight={700} color="primary.main">
                  ${grandTotal.toFixed(2)}
                </Typography>
              </Stack>
            </Stack>
            
            <Button
              variant="contained"
              fullWidth
              size="large"
              disabled={checkoutLoading || grandTotal === 0}
              onClick={handleProceedToCheckout}
              sx={{ mt: 3, borderRadius: 2, py: 1.5 }}
            >
              {checkoutLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                t('cart.proceedToCheckout')
              )}
            </Button>
            
            {/* Trust Badges */}
            <Paper sx={{ p: 2, mt: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Stack spacing={1}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <ShippingIcon fontSize="small" color="primary" />
                  <Typography variant="caption">{t('cart.freeShippingInfo')}</Typography>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <SecurityIcon fontSize="small" color="primary" />
                  <Typography variant="caption">{t('cart.secureEncryption')}</Typography>
                </Stack>
              </Stack>
            </Paper>
          </Paper>
        </Grid>
      </Grid>

      {/* Additional Info */}
      <Alert 
        severity="info" 
        sx={{ mt: 4, borderRadius: 2 }}
        icon={<ShippingIcon />}
      >
        <Typography variant="body2">
          <strong>{t('cart.freeShippingInfo')}</strong>. {t('cart.multipleVendorsInfo')}
        </Typography>
      </Alert>
    </Container>
  );
}