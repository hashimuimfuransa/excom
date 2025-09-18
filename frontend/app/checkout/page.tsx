"use client";
import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Grid, 
  TextField, 
  Button, 
  Card, 
  CardContent,
  Alert,
  CircularProgress,
  Divider,
  Stack,
  Chip,
  Paper
} from '@mui/material';
import { useCart, clearBookingCart } from '@utils/cart';
import { apiPost } from '@utils/api';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';

export default function CheckoutPage() {
  const { items, bookingItems, grandTotal, refreshCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  
  const [billingInfo, setBillingInfo] = useState({
    name: '',
    email: '',
    address: '',
    city: '',
    country: '',
    phone: ''
  });

  useEffect(() => {
    // If cart is empty, redirect to cart page
    if (items.length === 0 && bookingItems.length === 0) {
      router.push('/cart');
    }
  }, [items.length, bookingItems.length, router]);

  const handleInputChange = (field: string, value: string) => {
    setBillingInfo(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!billingInfo.name || !billingInfo.email) {
      setError('Please fill in your name and email address');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('excom_token');
      if (!token && bookingItems.length > 0) {
        setError('You must be logged in to complete bookings. Redirecting to login...');
        setLoading(false);
        setTimeout(() => {
          router.push('/auth/login?redirect=checkout');
        }, 2000);
        return;
      }

      // Process bookings if any
      if (bookingItems.length > 0) {
        const bookingPayload = bookingItems.map(item => ({
          collectionId: item.collectionId,
          checkIn: item.bookingData.checkIn,
          checkOut: item.bookingData.checkOut,
          guests: item.bookingData.guests,
          roomType: item.bookingData.roomType,
          specialRequests: item.bookingData.specialRequests,
          customerInfo: {
            ...item.bookingData.customerInfo,
            name: billingInfo.name,
            email: billingInfo.email,
            phone: billingInfo.phone
          },
          totalAmount: item.price
        }));

        const bookingResult = await apiPost('/bookings/process-cart', {
          bookings: bookingPayload
        });

        console.log('Booking result:', bookingResult);
      }

      // TODO: Process regular cart items (integrate with payment gateway)
      
      // Clear the booking cart after successful processing
      clearBookingCart();
      
      // Refresh cart state
      refreshCart();
      
      setSuccess(true);
      
      // Redirect to success page after a brief delay
      setTimeout(() => {
        router.push('/dashboard/vendor'); // or appropriate success page
      }, 2000);

    } catch (error: any) {
      console.error('Checkout error:', error);
      setError(error.message || 'Failed to process checkout');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Paper sx={{ p: 6, borderRadius: 3 }}>
          <Typography variant="h4" color="success.main" fontWeight={700} gutterBottom>
            Order Successful!
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={3}>
            Your bookings have been submitted successfully. You'll receive confirmation emails shortly.
          </Typography>
          <Button 
            component={NextLink} 
            href="/dashboard/vendor" 
            variant="contained" 
            size="large"
          >
            View My Bookings
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Checkout
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={4} mt={1}>
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Billing Information
              </Typography>
              
              <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gap: 3, mt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Full Name"
                      value={billingInfo.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      fullWidth
                      required
                      disabled={loading}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Email Address"
                      type="email"
                      value={billingInfo.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      fullWidth
                      required
                      disabled={loading}
                    />
                  </Grid>
                </Grid>
                
                <TextField
                  label="Phone Number"
                  value={billingInfo.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  fullWidth
                  disabled={loading}
                />
                
                <TextField
                  label="Address"
                  value={billingInfo.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  fullWidth
                  disabled={loading}
                />
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="City"
                      value={billingInfo.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      fullWidth
                      disabled={loading}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Country"
                      value={billingInfo.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      fullWidth
                      disabled={loading}
                    />
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, position: 'sticky', top: 20 }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Order Summary
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              {/* Booking Items */}
              {bookingItems.length > 0 && (
                <Box mb={3}>
                  <Typography variant="subtitle2" fontWeight={600} mb={2}>
                    Bookings ({bookingItems.length})
                  </Typography>
                  
                  {bookingItems.map((item) => (
                    <Stack key={item.id} direction="row" justifyContent="space-between" mb={1}>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {item.title}
                        </Typography>
                        <Chip size="small" label="BOOKING" color="primary" variant="outlined" />
                      </Box>
                      <Typography variant="body2" fontWeight={600}>
                        ${item.price.toFixed(2)}
                      </Typography>
                    </Stack>
                  ))}
                </Box>
              )}
              
              {/* Regular Items */}
              {items.length > 0 && (
                <Box mb={3}>
                  <Typography variant="subtitle2" fontWeight={600} mb={2}>
                    Products ({items.length})
                  </Typography>
                  
                  {items.map((item) => (
                    <Stack key={item.id} direction="row" justifyContent="space-between" mb={1}>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {item.title} × {item.quantity}
                        </Typography>
                      </Box>
                      <Typography variant="body2" fontWeight={600}>
                        ${(item.price * item.quantity).toFixed(2)}
                      </Typography>
                    </Stack>
                  ))}
                </Box>
              )}
              
              <Divider sx={{ my: 2 }} />
              
              <Stack direction="row" justifyContent="space-between" mb={3}>
                <Typography variant="h6" fontWeight={700}>
                  Total
                </Typography>
                <Typography variant="h6" fontWeight={700} color="primary.main">
                  ${grandTotal.toFixed(2)}
                </Typography>
              </Stack>
              
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={loading || grandTotal === 0}
                onClick={handleSubmit}
                sx={{ borderRadius: 2, py: 1.5 }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Complete Order'
                )}
              </Button>
              
              {bookingItems.length > 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="caption">
                    Bookings require confirmation from vendors before payment processing.
                  </Typography>
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}