"use client";
import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Stack,
  Chip,
  Paper,
  Avatar,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Skeleton,
  Alert
} from '@mui/material';
import {
  CalendarToday,
  Person,
  LocationOn,
  Hotel,
  Restaurant,
  HomeWork,
  Business,
  Email,
  Phone,
  CheckCircle,
  Cancel,
  Pending,
  Group,
  DirectionsCar,
  School,
  ShoppingBag
} from '@mui/icons-material';
import { apiGet, apiPatch } from '@utils/api';
import { getMainImage, hasRealImages } from '@utils/imageHelpers';

interface Booking {
  _id: string;
  collection: {
    _id: string;
    title: string;
    type: string;
    location: {
      address: string;
      city: string;
      state: string;
    };
    images: string[];
  };
  customer: {
    _id: string;
    name: string;
    email: string;
  };
  checkIn?: string;
  checkOut?: string;
  guests: number;
  roomType?: string;
  totalAmount: number;
  currency: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  specialRequests?: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  vendorNotes?: string;
  vendorResponse: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export default function VendorBookingsPage() {
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [vendorNotes, setVendorNotes] = useState('');
  const [vendorResponse, setVendorResponse] = useState<'accepted' | 'rejected'>('accepted');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const data = await apiGet<Booking[]>('/bookings/vendor/received');
      setBookings(data || []);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      setBookings([]);
    }
  };

  const handleBookingAction = (booking: Booking) => {
    setSelectedBooking(booking);
    setVendorNotes(booking.vendorNotes || '');
    setVendorResponse(booking.vendorResponse === 'rejected' ? 'rejected' : 'accepted');
    setDialogOpen(true);
  };

  const updateBookingStatus = async () => {
    if (!selectedBooking) return;

    try {
      await apiPatch(`/bookings/${selectedBooking._id}/status`, {
        vendorResponse,
        status: vendorResponse === 'accepted' ? 'confirmed' : 'cancelled',
        vendorNotes
      });

      setDialogOpen(false);
      fetchBookings();
    } catch (error) {
      console.error('Failed to update booking:', error);
      alert('Failed to update booking. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FF9800';
      case 'confirmed': return '#4CAF50';
      case 'cancelled': return '#F44336';
      case 'completed': return '#2196F3';
      default: return '#757575';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Pending />;
      case 'confirmed': return <CheckCircle />;
      case 'cancelled': return <Cancel />;
      case 'completed': return <CheckCircle />;
      default: return <Pending />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'hotel': return <Hotel />;
      case 'restaurant': return <Restaurant />;
      case 'real-estate': return <HomeWork />;
      case 'car-rental': return <DirectionsCar />;
      case 'education': return <School />;
      case 'shopping': return <ShoppingBag />;
      case 'service': return <Business />;
      default: return <Business />;
    }
  };

  const filteredBookings = bookings?.filter(booking => {
    if (statusFilter === 'all') return true;
    return booking.status === statusFilter;
  }) || [];

  if (bookings === null) {
    return (
      <Container sx={{ py: 4 }}>
        <Grid container spacing={3}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Grid item xs={12} key={i}>
              <Skeleton variant="rectangular" height={150} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  return (
    <Box>
      <Container sx={{ py: 4 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={4}>
          <Box>
            <Typography variant="h4" fontWeight={900} gutterBottom>
              Booking Requests
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your collection bookings and customer requests
            </Typography>
          </Box>

          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Filter by Status</InputLabel>
            <Select
              value={statusFilter}
              label="Filter by Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">All Bookings</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="confirmed">Confirmed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        {/* Stats Cards */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={1} sx={{ p: 3, borderRadius: 2, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={700} color="warning.main">
                {bookings.filter(b => b.status === 'pending').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={1} sx={{ p: 3, borderRadius: 2, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={700} color="success.main">
                {bookings.filter(b => b.status === 'confirmed').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Confirmed
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={1} sx={{ p: 3, borderRadius: 2, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={700} color="primary.main">
                {bookings.filter(b => b.status === 'completed').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completed
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={1} sx={{ p: 3, borderRadius: 2, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={700} color="text.primary">
                ${bookings.reduce((sum, b) => sum + b.totalAmount, 0).toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Revenue
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {filteredBookings.length === 0 ? (
          <Paper elevation={1} sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
            <CalendarToday sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              No bookings found
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {statusFilter === 'all' 
                ? 'You haven\'t received any booking requests yet.' 
                : `No ${statusFilter} bookings at this time.`}
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {filteredBookings.map((booking) => {
              const statusColor = getStatusColor(booking.status);
              const collectionImage = getMainImage(booking.collection.images, booking.collection.type, booking.collection._id);

              return (
                <Grid item xs={12} key={booking._id}>
                  <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
                    <CardContent sx={{ p: 3 }}>
                      <Grid container spacing={3}>
                        {/* Collection Info */}
                        <Grid item xs={12} md={3}>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Avatar
                              src={collectionImage}
                              sx={{ width: 60, height: 60, borderRadius: 2 }}
                              variant="rounded"
                            />
                            <Box>
                              <Typography variant="h6" fontWeight={700} noWrap>
                                {booking.collection.title}
                              </Typography>
                              <Stack direction="row" alignItems="center" spacing={0.5}>
                                {getTypeIcon(booking.collection.type)}
                                <Typography variant="body2" color="text.secondary" textTransform="capitalize">
                                  {booking.collection.type.replace('-', ' ')}
                                </Typography>
                              </Stack>
                              <Stack direction="row" alignItems="center" spacing={0.5} mt={0.5}>
                                <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary">
                                  {booking.collection.location.city}
                                </Typography>
                              </Stack>
                            </Box>
                          </Stack>
                        </Grid>

                        {/* Customer Info */}
                        <Grid item xs={12} md={3}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Customer
                          </Typography>
                          <Stack spacing={0.5}>
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              <Person sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="body2">
                                {booking.customerInfo.name}
                              </Typography>
                            </Stack>
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              <Email sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="body2">
                                {booking.customerInfo.email}
                              </Typography>
                            </Stack>
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              <Phone sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="body2">
                                {booking.customerInfo.phone}
                              </Typography>
                            </Stack>
                          </Stack>
                        </Grid>

                        {/* Booking Details */}
                        <Grid item xs={12} md={3}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Booking Details
                          </Typography>
                          <Stack spacing={0.5}>
                            {booking.checkIn && booking.checkOut && (
                              <Stack direction="row" alignItems="center" spacing={0.5}>
                                <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="body2">
                                  {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
                                </Typography>
                              </Stack>
                            )}
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              <Group sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="body2">
                                {booking.guests} guest{booking.guests > 1 ? 's' : ''}
                              </Typography>
                            </Stack>
                            {booking.roomType && (
                              <Typography variant="body2">
                                Room: {booking.roomType}
                              </Typography>
                            )}
                            <Typography variant="h6" color="primary" fontWeight={700}>
                              ${booking.totalAmount}
                            </Typography>
                          </Stack>
                        </Grid>

                        {/* Status & Actions */}
                        <Grid item xs={12} md={3}>
                          <Stack spacing={2} alignItems="flex-end">
                            <Chip
                              icon={getStatusIcon(booking.status)}
                              label={booking.status.toUpperCase()}
                              sx={{
                                backgroundColor: statusColor,
                                color: 'white',
                                fontWeight: 700
                              }}
                            />

                            <Typography variant="body2" color="text.secondary">
                              {new Date(booking.createdAt).toLocaleDateString()}
                            </Typography>

                            {booking.status === 'pending' && (
                              <Button
                                variant="contained"
                                size="small"
                                onClick={() => handleBookingAction(booking)}
                                sx={{ borderRadius: 2 }}
                              >
                                Respond
                              </Button>
                            )}

                            {booking.status !== 'pending' && (
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => handleBookingAction(booking)}
                                sx={{ borderRadius: 2 }}
                              >
                                View Details
                              </Button>
                            )}
                          </Stack>
                        </Grid>
                      </Grid>

                      {/* Special Requests */}
                      {booking.specialRequests && (
                        <>
                          <Divider sx={{ my: 2 }} />
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Special Requests
                            </Typography>
                            <Typography variant="body2">
                              {booking.specialRequests}
                            </Typography>
                          </Box>
                        </>
                      )}

                      {/* Vendor Notes */}
                      {booking.vendorNotes && (
                        <>
                          <Divider sx={{ my: 2 }} />
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Your Notes
                            </Typography>
                            <Typography variant="body2">
                              {booking.vendorNotes}
                            </Typography>
                          </Box>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Container>

      {/* Booking Action Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedBooking?.status === 'pending' ? 'Respond to Booking Request' : 'Booking Details'}
        </DialogTitle>

        <DialogContent>
          {selectedBooking && (
            <Stack spacing={3} sx={{ mt: 2 }}>
              {/* Booking Summary */}
              <Paper elevation={1} sx={{ p: 2, borderRadius: 2, backgroundColor: 'background.default' }}>
                <Typography variant="h6" gutterBottom>
                  {selectedBooking.collection.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Customer: {selectedBooking.customerInfo.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Amount: ${selectedBooking.totalAmount}
                </Typography>
                {selectedBooking.checkIn && selectedBooking.checkOut && (
                  <Typography variant="body2" color="text.secondary">
                    Dates: {new Date(selectedBooking.checkIn).toLocaleDateString()} - {new Date(selectedBooking.checkOut).toLocaleDateString()}
                  </Typography>
                )}
              </Paper>

              {/* Response Options */}
              {selectedBooking.status === 'pending' && (
                <>
                  <FormControl fullWidth>
                    <InputLabel>Response</InputLabel>
                    <Select
                      value={vendorResponse}
                      label="Response"
                      onChange={(e) => setVendorResponse(e.target.value as 'accepted' | 'rejected')}
                    >
                      <MenuItem value="accepted">Accept Booking</MenuItem>
                      <MenuItem value="rejected">Decline Booking</MenuItem>
                    </Select>
                  </FormControl>

                  {vendorResponse === 'accepted' && (
                    <Alert severity="success">
                      Accepting this booking will confirm the reservation and notify the customer.
                    </Alert>
                  )}

                  {vendorResponse === 'rejected' && (
                    <Alert severity="warning">
                      Declining this booking will cancel the request and notify the customer.
                    </Alert>
                  )}
                </>
              )}

              {/* Vendor Notes */}
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={4}
                value={vendorNotes}
                onChange={(e) => setVendorNotes(e.target.value)}
                placeholder={selectedBooking.status === 'pending' 
                  ? "Add any notes for the customer (optional)" 
                  : "View or edit your notes"}
                disabled={selectedBooking.status !== 'pending'}
              />
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDialogOpen(false)}>
            {selectedBooking?.status === 'pending' ? 'Cancel' : 'Close'}
          </Button>
          
          {selectedBooking?.status === 'pending' && (
            <Button
              variant="contained"
              onClick={updateBookingStatus}
              color={vendorResponse === 'accepted' ? 'success' : 'error'}
            >
              {vendorResponse === 'accepted' ? 'Accept Booking' : 'Decline Booking'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}