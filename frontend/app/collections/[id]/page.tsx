"use client";
import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Stack,
  Chip,
  Paper,
  Avatar,
  Rating,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ImageList,
  ImageListItem,
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
  CircularProgress
} from '@mui/material';
import {
  LocationOn,
  Phone,
  Email,
  Language,
  AccessTime,
  CheckCircle,
  Star,
  ArrowBack,
  Hotel,
  Restaurant,
  HomeWork,
  Business,
  Group,
  Bed,
  Bathtub,
  SquareFoot
} from '@mui/icons-material';
import { useParams, useRouter } from 'next/navigation';
import NextLink from 'next/link';
import { apiGet, apiPost } from '@utils/api';
import { getMainImage, hasRealImages } from '@utils/imageHelpers';
import { useTranslation } from 'react-i18next';

interface Collection {
  _id: string;
  vendor: {
    _id: string;
    name: string;
    email: string;
  };
  title: string;
  description?: string;
  type: 'hotel' | 'restaurant' | 'real-estate' | 'service' | 'other';
  category?: string;
  images: string[];
  location: {
    coordinates: [number, number];
    address: string;
    city: string;
    state: string;
    country: string;
  };
  businessHours?: Array<{
    day: string;
    openTime: string;
    closeTime: string;
    isOpen: boolean;
  }>;
  amenities?: string[];
  price?: number;
  priceType?: string;
  rating?: number;
  totalRatings?: number;
  roomTypes?: Array<{
    name: string;
    capacity: number;
    price: number;
    amenities: string[];
    images: string[];
  }>;
  cuisine?: string;
  menuItems?: Array<{
    name: string;
    description: string;
    price: number;
    category: string;
    image?: string;
  }>;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  features?: string[];
  policies?: string[];
  contactInfo?: {
    phone?: string;
    email?: string;
    website?: string;
  };
}

interface BookingData {
  collectionId: string;
  checkIn?: string;
  checkOut?: string;
  guests: number;
  roomType?: string;
  specialRequests?: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
}

export default function CollectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation('common');
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  const [bookingData, setBookingData] = useState<BookingData>({
    collectionId: '',
    guests: 1,
    customerInfo: {
      name: '',
      email: '',
      phone: ''
    }
  });

  useEffect(() => {
    if (params.id) {
      fetchCollection(params.id as string);
    }
  }, [params.id]);

  const fetchCollection = async (id: string) => {
    try {
      setLoading(true);
      const response = await apiGet<Collection>(`/collections/${id}`);
      setCollection(response);
      setBookingData(prev => ({ ...prev, collectionId: id }));
    } catch (error) {
      console.error('Failed to fetch collection:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = () => {
    setBookingDialogOpen(true);
  };

  const submitBooking = async () => {
    setBookingLoading(true);
    try {
      // Validate required fields
      if (!bookingData.customerInfo.name || !bookingData.customerInfo.email) {
        alert('Please fill in your name and email');
        setBookingLoading(false);
        return;
      }

      // Calculate total amount
      let totalAmount = collection?.price || 0;
      if (collection?.type === 'hotel' && bookingData.roomType && collection.roomTypes) {
        const room = collection.roomTypes.find(r => r.name === bookingData.roomType);
        if (room) {
          totalAmount = room.price;
          if (bookingData.checkIn && bookingData.checkOut) {
            const nights = Math.ceil((new Date(bookingData.checkOut).getTime() - new Date(bookingData.checkIn).getTime()) / (1000 * 60 * 60 * 24));
            totalAmount *= nights;
          }
        }
      }

      // Add booking to cart instead of directly submitting
      const bookingCartItem = {
        id: `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'booking' as const,
        collectionId: collection?.id || '',
        title: `${collection?.title} - ${bookingData.roomType || 'Booking'}`,
        price: totalAmount,
        image: collection?.images?.[0] || collection?.image,
        bookingData: {
          ...bookingData,
          collectionId: collection?.id
        },
        createdAt: new Date().toISOString()
      };

      // Import functions dynamically to avoid SSR issues
      const { addBookingToCart } = await import('../../../utils/cart');
      addBookingToCart(bookingCartItem);
      
      setBookingDialogOpen(false);
      alert('Booking added to cart! Go to cart to complete your booking.');
      
      // Reset form
      setBookingData(prev => ({
        ...prev,
        checkIn: '',
        checkOut: '',
        guests: 1,
        roomType: '',
        specialRequests: '',
        customerInfo: {
          name: '',
          email: '',
          phone: ''
        }
      }));

      // Refresh cart count in navbar
      window.dispatchEvent(new CustomEvent('cartUpdated'));
      
    } catch (error) {
      console.error('Failed to add booking to cart:', error);
      alert('Failed to add booking to cart. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'hotel': return <Hotel />;
      case 'restaurant': return <Restaurant />;
      case 'real-estate': return <HomeWork />;
      case 'service': return <Business />;
      default: return <Business />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'hotel': return '#2196F3';
      case 'restaurant': return '#FF9800';
      case 'real-estate': return '#4CAF50';
      case 'service': return '#9C27B0';
      default: return '#757575';
    }
  };

  if (loading) {
    return (
      <Container sx={{ py: 4 }}>
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2, mb: 3 }} />
        <Skeleton variant="text" width="60%" height={60} sx={{ mb: 2 }} />
        <Skeleton variant="text" width="40%" height={30} sx={{ mb: 4 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  if (!collection) {
    return (
      <Container sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Collection not found
        </Typography>
        <Button 
          component={NextLink} 
          href="/collections" 
          variant="contained"
          startIcon={<ArrowBack />}
        >
          Back to Collections
        </Button>
      </Container>
    );
  }

  const mainImage = selectedImageIndex !== null && collection.images?.[selectedImageIndex] 
                   ? collection.images[selectedImageIndex]
                   : getMainImage(collection.images, collection.type, collection._id);
  const isRealImage = hasRealImages(collection.images);
  const typeColor = getTypeColor(collection.type);

  return (
    <Box>
      <Container sx={{ py: 4 }}>
        {/* Back Button */}
        <Button 
          component={NextLink} 
          href="/collections" 
          startIcon={<ArrowBack />} 
          sx={{ mb: 3 }}
        >
          {t('collectionsPage.actions.back')}
        </Button>

        {/* Main Image and Gallery */}
        <Box sx={{ mb: 4 }}>
          <Card sx={{ borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
            <CardMedia
              component="img"
              height={400}
              image={mainImage}
              alt={collection.title}
              sx={{
                filter: isRealImage ? 'none' : 'brightness(0.9) sepia(0.08)',
              }}
            />
            
            {/* Type Badge */}
            <Chip
              icon={getTypeIcon(collection.type)}
              label={collection.type.replace('-', ' ').toUpperCase()}
              sx={{
                position: 'absolute',
                top: 16,
                left: 16,
                backgroundColor: typeColor,
                color: 'white',
                fontWeight: 700,
                textTransform: 'capitalize'
              }}
            />

            {/* Stock Photo Indicator */}
            {!isRealImage && (
              <Chip
                label={t('collectionsPage.imageStatus.stockPhoto')}
                size="small"
                sx={{
                  position: 'absolute',
                  top: 16,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  fontSize: '0.7rem',
                  height: 20
                }}
              />
            )}

            {/* Rating Badge */}
            {collection.rating && (
              <Chip
                icon={<Star sx={{ fontSize: 18 }} />}
                label={`${collection.rating.toFixed(1)} (${collection.totalRatings || 0} ${t('collectionsPage.details.reviews')})`}
                sx={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  backgroundColor: '#FFD700',
                  color: 'black',
                  fontWeight: 700
                }}
              />
            )}
          </Card>

          {/* Image Gallery */}
          {collection.images && collection.images.length > 1 && (
            <ImageList sx={{ width: '100%', height: 120, mt: 2 }} cols={6} rowHeight={120}>
              {collection.images.map((image, index) => (
                <ImageListItem 
                  key={index}
                  sx={{ 
                    cursor: 'pointer',
                    opacity: selectedImageIndex === index ? 1 : 0.7,
                    border: selectedImageIndex === index ? `3px solid ${typeColor}` : 'none',
                    borderRadius: 2,
                    overflow: 'hidden'
                  }}
                  onClick={() => setSelectedImageIndex(index)}
                >
                  <img
                    src={image}
                    alt={`${collection.title} ${index + 1}`}
                    loading="lazy"
                    style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                  />
                </ImageListItem>
              ))}
            </ImageList>
          )}
        </Box>

        <Grid container spacing={4}>
          {/* Main Content */}
          <Grid item xs={12} md={8}>
            {/* Header */}
            <Box mb={3}>
              <Typography variant="h3" fontWeight={900} gutterBottom>
                {collection.title}
              </Typography>
              
              <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <LocationOn color="action" />
                  <Typography variant="body1">
                    {collection.location.address}, {collection.location.city}, {collection.location.state}
                  </Typography>
                </Stack>
                
                {collection.rating && (
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Rating value={collection.rating} readOnly precision={0.1} size="small" />
                    <Typography variant="body2">
                      ({collection.totalRatings || 0} {t('collectionsPage.details.reviews')})
                    </Typography>
                  </Stack>
                )}
              </Stack>

              {/* Price */}
              {collection.price && (
                <Typography variant="h4" color="primary" fontWeight={700}>
                  ${collection.price}
                  {collection.priceType && collection.priceType !== 'fixed' && (
                    <Typography component="span" variant="h6" color="text.secondary">
                      /{collection.priceType.replace('per-', '')}
                    </Typography>
                  )}
                </Typography>
              )}
            </Box>

            {/* Description */}
            {collection.description && (
              <Box mb={3}>
                <Typography variant="h5" fontWeight={700} gutterBottom>
                  {t('collectionsPage.details.about')}
                </Typography>
                <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
                  {collection.description}
                </Typography>
              </Box>
            )}

            {/* Property Specific Info */}
            {collection.type === 'real-estate' && (
              <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  {t('collectionsPage.details.propertyDetails')}
                </Typography>
                <Grid container spacing={2}>
                  {collection.propertyType && (
                    <Grid item xs={6} sm={3}>
                      <Stack alignItems="center" spacing={1}>
                        <HomeWork color="primary" />
                        <Typography variant="body2" color="text.secondary">{t('collectionsPage.details.type')}</Typography>
                        <Typography variant="body1" fontWeight={600} textTransform="capitalize">
                          {collection.propertyType}
                        </Typography>
                      </Stack>
                    </Grid>
                  )}
                  {collection.bedrooms && (
                    <Grid item xs={6} sm={3}>
                      <Stack alignItems="center" spacing={1}>
                        <Bed color="primary" />
                        <Typography variant="body2" color="text.secondary">{t('collectionsPage.details.bedrooms')}</Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {collection.bedrooms}
                        </Typography>
                      </Stack>
                    </Grid>
                  )}
                  {collection.bathrooms && (
                    <Grid item xs={6} sm={3}>
                      <Stack alignItems="center" spacing={1}>
                        <Bathtub color="primary" />
                        <Typography variant="body2" color="text.secondary">{t('collectionsPage.details.bathrooms')}</Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {collection.bathrooms}
                        </Typography>
                      </Stack>
                    </Grid>
                  )}
                  {collection.area && (
                    <Grid item xs={6} sm={3}>
                      <Stack alignItems="center" spacing={1}>
                        <SquareFoot color="primary" />
                        <Typography variant="body2" color="text.secondary">{t('collectionsPage.details.area')}</Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {collection.area} {t('collectionsPage.details.sqft')}
                        </Typography>
                      </Stack>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            )}

            {/* Hotel Room Types */}
            {collection.roomTypes && collection.roomTypes.length > 0 && (
              <Box mb={3}>
                <Typography variant="h5" fontWeight={700} gutterBottom>
                  Room Types
                </Typography>
                <Grid container spacing={2}>
                  {collection.roomTypes.map((room, index) => (
                    <Grid item xs={12} sm={6} key={index}>
                      <Card sx={{ borderRadius: 2, border: `1px solid ${typeColor}30` }}>
                        <CardContent>
                          <Typography variant="h6" fontWeight={700} gutterBottom>
                            {room.name}
                          </Typography>
                          <Typography variant="h5" color="primary" fontWeight={700} mb={1}>
                            ${room.price}/night
                          </Typography>
                          <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                            <Group sx={{ fontSize: 18 }} />
                            <Typography variant="body2">
                              Up to {room.capacity} guests
                            </Typography>
                          </Stack>
                          {room.amenities && room.amenities.length > 0 && (
                            <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                              {room.amenities.map((amenity, idx) => (
                                <Chip key={idx} label={amenity} size="small" variant="outlined" />
                              ))}
                            </Stack>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {/* Restaurant Menu */}
            {collection.menuItems && collection.menuItems.length > 0 && (
              <Box mb={3}>
                <Typography variant="h5" fontWeight={700} gutterBottom>
                  Menu
                </Typography>
                <Grid container spacing={2}>
                  {collection.menuItems.map((item, index) => (
                    <Grid item xs={12} sm={6} key={index}>
                      <Card sx={{ borderRadius: 2 }}>
                        <CardContent>
                          <Stack direction="row" justifyContent="space-between" alignItems="start" mb={1}>
                            <Typography variant="h6" fontWeight={700}>
                              {item.name}
                            </Typography>
                            <Typography variant="h6" color="primary" fontWeight={700}>
                              ${item.price}
                            </Typography>
                          </Stack>
                          <Chip label={item.category} size="small" sx={{ mb: 1 }} />
                          <Typography variant="body2" color="text.secondary">
                            {item.description}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {/* Amenities */}
            {collection.amenities && collection.amenities.length > 0 && (
              <Box mb={3}>
                <Typography variant="h5" fontWeight={700} gutterBottom>
                  Amenities & Features
                </Typography>
                <Grid container spacing={1}>
                  {collection.amenities.map((amenity, index) => (
                    <Grid item key={index}>
                      <Chip 
                        icon={<CheckCircle />} 
                        label={amenity} 
                        variant="outlined"
                        sx={{ borderColor: typeColor, color: typeColor }}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {/* Business Hours */}
            {collection.businessHours && collection.businessHours.length > 0 && (
              <Box mb={3}>
                <Typography variant="h5" fontWeight={700} gutterBottom>
                  Business Hours
                </Typography>
                <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
                  <List dense>
                    {collection.businessHours.map((hours, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <AccessTime />
                        </ListItemIcon>
                        <ListItemText
                          primary={hours.day}
                          secondary={hours.isOpen ? `${hours.openTime} - ${hours.closeTime}` : 'Closed'}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Box>
            )}

            {/* Policies */}
            {collection.policies && collection.policies.length > 0 && (
              <Box mb={3}>
                <Typography variant="h5" fontWeight={700} gutterBottom>
                  Policies
                </Typography>
                <List>
                  {collection.policies.map((policy, index) => (
                    <ListItem key={index}>
                      <ListItemText primary={policy} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} md={4}>
            {/* Booking Card */}
            <Paper elevation={3} sx={{ p: 3, borderRadius: 3, position: 'sticky', top: 24 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Book This {collection.type.replace('-', ' ')}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              {/* Vendor Info */}
              <Stack direction="row" alignItems="center" spacing={2} mb={3}>
                <Avatar sx={{ bgcolor: typeColor }}>
                  {collection.vendor.name.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    {collection.vendor.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Vendor
                  </Typography>
                </Box>
              </Stack>

              {/* Contact Info */}
              {collection.contactInfo && (
                <Box mb={3}>
                  {collection.contactInfo.phone && (
                    <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                      <Phone sx={{ fontSize: 18 }} />
                      <Typography variant="body2">
                        {collection.contactInfo.phone}
                      </Typography>
                    </Stack>
                  )}
                  {collection.contactInfo.email && (
                    <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                      <Email sx={{ fontSize: 18 }} />
                      <Typography variant="body2">
                        {collection.contactInfo.email}
                      </Typography>
                    </Stack>
                  )}
                  {collection.contactInfo.website && (
                    <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                      <Language sx={{ fontSize: 18 }} />
                      <Typography variant="body2">
                        {collection.contactInfo.website}
                      </Typography>
                    </Stack>
                  )}
                </Box>
              )}

              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={handleBooking}
                sx={{
                  backgroundColor: typeColor,
                  '&:hover': { backgroundColor: typeColor, opacity: 0.9 },
                  borderRadius: 2,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 700
                }}
              >
                Book Now
              </Button>

              <Typography variant="body2" color="text.secondary" textAlign="center" mt={2}>
                You'll be contacted by the vendor to confirm your booking
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* Booking Dialog */}
      <Dialog 
        open={bookingDialogOpen} 
        onClose={() => setBookingDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h5" fontWeight={700}>
            Book {collection.title}
          </Typography>
        </DialogTitle>
        
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* Booking Dates (for hotels) */}
            {collection.type === 'hotel' && (
              <>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Check-in Date"
                    type="date"
                    value={bookingData.checkIn || ''}
                    onChange={(e) => setBookingData(prev => ({ ...prev, checkIn: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Check-out Date"
                    type="date"
                    value={bookingData.checkOut || ''}
                    onChange={(e) => setBookingData(prev => ({ ...prev, checkOut: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </>
            )}

            {/* Room Type Selection */}
            {collection.roomTypes && collection.roomTypes.length > 0 && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Room Type</InputLabel>
                  <Select
                    value={bookingData.roomType || ''}
                    label="Room Type"
                    onChange={(e) => setBookingData(prev => ({ ...prev, roomType: e.target.value }))}
                  >
                    {collection.roomTypes.map((room, index) => (
                      <MenuItem key={index} value={room.name}>
                        {room.name} - ${room.price}/night
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {/* Number of Guests */}
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Number of Guests"
                type="number"
                value={bookingData.guests}
                onChange={(e) => setBookingData(prev => ({ ...prev, guests: parseInt(e.target.value) || 1 }))}
                inputProps={{ min: 1 }}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Contact Information
              </Typography>
            </Grid>

            {/* Customer Info */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Full Name"
                value={bookingData.customerInfo.name}
                onChange={(e) => setBookingData(prev => ({
                  ...prev,
                  customerInfo: { ...prev.customerInfo, name: e.target.value }
                }))}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={bookingData.customerInfo.email}
                onChange={(e) => setBookingData(prev => ({
                  ...prev,
                  customerInfo: { ...prev.customerInfo, email: e.target.value }
                }))}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone Number"
                value={bookingData.customerInfo.phone}
                onChange={(e) => setBookingData(prev => ({
                  ...prev,
                  customerInfo: { ...prev.customerInfo, phone: e.target.value }
                }))}
                required
              />
            </Grid>

            {/* Special Requests */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Special Requests"
                multiline
                rows={3}
                value={bookingData.specialRequests || ''}
                onChange={(e) => setBookingData(prev => ({ ...prev, specialRequests: e.target.value }))}
                placeholder="Any special requirements or requests..."
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setBookingDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={submitBooking}
            disabled={bookingLoading || !bookingData.customerInfo.name || !bookingData.customerInfo.email || !bookingData.customerInfo.phone}
            sx={{ px: 4, backgroundColor: typeColor, '&:hover': { backgroundColor: typeColor, opacity: 0.9 } }}
          >
            {bookingLoading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              'Add to Cart'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}