"use client";
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  TextField,
  Stack,
  Chip,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Rating,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Skeleton,
  InputAdornment,
  IconButton,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  Fab,
  Zoom,
  Tooltip,
  Badge,
  CardActions,
  useTheme,
  CircularProgress
} from '@mui/material';
import {
  LocationOn,
  Hotel,
  Restaurant,
  HomeWork,
  Business,
  Search,
  FilterList,
  Map as MapIcon,
  Star,
  Phone,
  Email,
  Language,
  AccessTime,
  Group,
  CheckCircle,
  ViewList,
  GridView,
  Navigation,
  Visibility,
  FavoriteOutlined,
  Share,
  TrendingUp,
  LocalOffer,
  Verified,
  MyLocation
} from '@mui/icons-material';
import NextLink from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { APIProvider, Map, Marker, InfoWindow } from '@vis.gl/react-google-maps';
import { apiGet, apiPost } from '@utils/api';
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
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
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

export default function CollectionsPage() {
  const theme = useTheme();
  const { t } = useTranslation('common');
  const [collections, setCollections] = useState<Collection[] | null>(null);
  const [filteredCollections, setFilteredCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [priceFilter, setPriceFilter] = useState({ min: '', max: '' });
  const [ratingFilter, setRatingFilter] = useState('');
  const [sortBy, setSortBy] = useState('featured');

  // Booking form data
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
    fetchCollections();
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Error getting user location:', error);
        }
      );
    }
  };

  const fetchCollections = async () => {
    try {
      const response = await apiGet<{ collections: Collection[] }>('/collections');
      setCollections(response.collections || []);
      setFilteredCollections(response.collections || []);
    } catch (error) {
      console.error('Failed to fetch collections:', error);
      setCollections([]);
      setFilteredCollections([]);
    }
  };

  // Filter and sort collections based on search criteria
  useEffect(() => {
    if (!collections) return;

    let filtered = collections.filter(collection => {
      const matchesSearch = !searchQuery || 
        collection.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        collection.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        collection.location.address.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = !typeFilter || collection.type === typeFilter;

      const matchesCity = !cityFilter || 
        collection.location.city.toLowerCase().includes(cityFilter.toLowerCase());

      const matchesPrice = (!priceFilter.min || !collection.price || collection.price >= parseFloat(priceFilter.min)) &&
                           (!priceFilter.max || !collection.price || collection.price <= parseFloat(priceFilter.max));

      const matchesRating = !ratingFilter || (collection.rating && collection.rating >= parseFloat(ratingFilter));

      return matchesSearch && matchesType && matchesCity && matchesPrice && matchesRating;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return (a.price || 0) - (b.price || 0);
        case 'price-high':
          return (b.price || 0) - (a.price || 0);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'distance':
          if (userLocation) {
            const distanceA = getDistance(userLocation, { lat: a.location.coordinates[1], lng: a.location.coordinates[0] });
            const distanceB = getDistance(userLocation, { lat: b.location.coordinates[1], lng: b.location.coordinates[0] });
            return distanceA - distanceB;
          }
          return 0;
        default: // featured
          return (b.rating || 0) * (b.totalRatings || 0) - (a.rating || 0) * (a.totalRatings || 0);
      }
    });

    setFilteredCollections(filtered);
  }, [collections, searchQuery, typeFilter, cityFilter, priceFilter, ratingFilter, sortBy, userLocation]);

  const getDistance = (point1: {lat: number; lng: number}, point2: {lat: number; lng: number}) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLon = (point2.lng - point1.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in kilometers
    return distance;
  };

  const handleBookCollection = (collection: Collection) => {
    setSelectedCollection(collection);
    setBookingData(prev => ({
      ...prev,
      collectionId: collection._id
    }));
    setBookingDialogOpen(true);
  };

  const toggleFavorite = (collectionId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(collectionId)) {
      newFavorites.delete(collectionId);
    } else {
      newFavorites.add(collectionId);
    }
    setFavorites(newFavorites);
    // Here you would typically sync with backend
  };

  const handleViewModeChange = (
    event: React.MouseEvent<HTMLElement>,
    newMode: 'grid' | 'map',
  ) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  const getDistanceFromUser = (collection: Collection) => {
    if (!userLocation) return null;
    return getDistance(userLocation, { 
      lat: collection.location.coordinates[1], 
      lng: collection.location.coordinates[0] 
    });
  };

  const submitBooking = async () => {
    setBookingLoading(true);
    try {
      // Validate required fields
      if (!bookingData.customerInfo.name || !bookingData.customerInfo.email) {
        alert(t('collectionsPage.booking.validationError'));
        setBookingLoading(false);
        return;
      }

      // Calculate total amount
      let totalAmount = selectedCollection?.price || 0;
      if (selectedCollection?.type === 'hotel' && bookingData.roomType && selectedCollection.roomTypes) {
        const room = selectedCollection.roomTypes.find(r => r.name === bookingData.roomType);
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
        collectionId: selectedCollection?._id || '',
        title: `${selectedCollection?.title} - ${bookingData.roomType || 'Booking'}`,
        price: totalAmount,
        image: selectedCollection?.images?.[0],
        bookingData: {
          ...bookingData,
          collectionId: selectedCollection?._id
        },
        createdAt: new Date().toISOString()
      };

      // Import functions dynamically to avoid SSR issues
      const { addBookingToCart } = await import('../../utils/cart');
      addBookingToCart(bookingCartItem);
      
      setBookingDialogOpen(false);
      alert(t('collectionsPage.booking.successMessage'));
      
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
      alert(t('collectionsPage.booking.errorMessage'));
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

  const getPlaceholderImage = (type: string) => {
    // Use high-quality, relevant stock images from Unsplash with consistent dimensions
    const placeholders = {
      'hotel': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop&crop=center',
      'restaurant': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop&crop=center',
      'real-estate': 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600&h=400&fit=crop&crop=center',
      'service': 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop&crop=center'
    };
    return placeholders[type as keyof typeof placeholders] || placeholders['service'];
  };

  if (collections === null) {
    return (
      <Container sx={{ py: 4 }}>
        <Grid container spacing={3}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
              <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2, mb: 1 }} />
              <Skeleton width="80%" />
              <Skeleton width="60%" />
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Hero Section */}
      <Box 
        sx={{ 
          background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.secondary.main}15 100%)`,
          pt: 8,
          pb: 6
        }}
      >
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Box textAlign="center" mb={4}>
              <Typography 
                variant="h2" 
                fontWeight={900} 
                gutterBottom
                sx={{
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 2
                }}
              >
                {t('collectionsPage.title')}
              </Typography>
              <Typography variant="h5" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
                {t('collectionsPage.description')}
              </Typography>
              
              {/* Featured Stats */}
              <Stack direction="row" spacing={4} justifyContent="center" sx={{ mb: 4 }}>
                <Box textAlign="center">
                  <Typography variant="h4" fontWeight={900} color="primary.main">
                    {collections?.length || 0}+
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('collectionsPage.stats.premiumLocations')}
                  </Typography>
                </Box>
                <Box textAlign="center">
                  <Typography variant="h4" fontWeight={900} color="secondary.main">
                    4.8★
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('collectionsPage.stats.averageRating')}
                  </Typography>
                </Box>
                <Box textAlign="center">
                  <Typography variant="h4" fontWeight={900} color="success.main">
                    24/7
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('collectionsPage.stats.supportAvailable')}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </motion.div>
        </Container>
      </Box>

      <Container sx={{ py: 4 }}>
        {/* Advanced Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Paper 
            elevation={12} 
            sx={{ 
              p: { xs: 2, md: 4 }, 
              mb: 4, 
              borderRadius: { xs: 2, md: 4 },
              background: theme.palette.mode === 'dark' 
                ? 'linear-gradient(135deg, rgba(25,118,210,0.08) 0%, rgba(156,39,176,0.05) 100%)'
                : 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(245,245,255,0.9) 100%)',
              backdropFilter: 'blur(20px)',
              border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(25,118,210,0.1)'}`,
              boxShadow: theme.palette.mode === 'dark' 
                ? '0 20px 40px rgba(0,0,0,0.4)' 
                : '0 20px 40px rgba(25,118,210,0.15)'
            }}
          >
            <Grid container spacing={3} alignItems="center">
              {/* Main Search */}
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder={t('collectionsPage.search.placeholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ color: 'primary.main', fontSize: 22 }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      borderRadius: { xs: 2, md: 3 },
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,1)',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(25,118,210,0.2)'
                      },
                      '&:hover fieldset': {
                        borderColor: 'primary.main',
                        borderWidth: '2px'
                      },
                      '&.Mui-focused': {
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,1)',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 8px 20px rgba(25,118,210,0.25)'
                      }
                    }
                  }}
                />
              </Grid>
              
              {/* Filters Row 1 */}
              <Grid item xs={6} md={2}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: 'text.primary', fontWeight: 500 }}>
                    {t('collectionsPage.filters.category')}
                  </InputLabel>
                  <Select
                    value={typeFilter}
                    label={t('collectionsPage.filters.category')}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    sx={{ 
                      borderRadius: { xs: 2, md: 3 },
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,1)',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(156,39,176,0.2)'
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'secondary.main',
                        borderWidth: '2px'
                      }
                    }}
                  >
                    <MenuItem value="">{t('collectionsPage.filters.allCategories')}</MenuItem>
                    <MenuItem value="hotel">🏨 {t('collectionsPage.types.hotels')}</MenuItem>
                    <MenuItem value="restaurant">🍽️ {t('collectionsPage.types.restaurants')}</MenuItem>
                    <MenuItem value="real-estate">🏢 {t('collectionsPage.types.realEstate')}</MenuItem>
                    <MenuItem value="service">🔧 {t('collectionsPage.types.services')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={6} md={2}>
                <TextField
                  fullWidth
                  placeholder={t('collectionsPage.search.cityPlaceholder')}
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationOn sx={{ color: 'secondary.main', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      borderRadius: { xs: 2, md: 3 },
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,1)',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(156,39,176,0.2)'
                      },
                      '&:hover fieldset': {
                        borderColor: 'secondary.main',
                        borderWidth: '2px'
                      }
                    }
                  }}
                />
              </Grid>

              <Grid item xs={6} md={2}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: 'text.primary', fontWeight: 500 }}>
                    {t('collectionsPage.filters.minRating')}
                  </InputLabel>
                  <Select
                    value={ratingFilter}
                    label={t('collectionsPage.filters.minRating')}
                    onChange={(e) => setRatingFilter(e.target.value)}
                    sx={{ 
                      borderRadius: { xs: 2, md: 3 },
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,1)',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(255,193,7,0.2)'
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#ffc107',
                        borderWidth: '2px'
                      }
                    }}
                  >
                    <MenuItem value="">{t('collectionsPage.filters.anyRating')}</MenuItem>
                    <MenuItem value="4.5">4.5+ ⭐⭐⭐⭐⭐</MenuItem>
                    <MenuItem value="4">4+ ⭐⭐⭐⭐</MenuItem>
                    <MenuItem value="3.5">3.5+ ⭐⭐⭐</MenuItem>
                    <MenuItem value="3">3+ ⭐⭐⭐</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={6} md={2}>
                <FormControl fullWidth>
                  <InputLabel>{t('collectionsPage.filters.sortBy')}</InputLabel>
                  <Select
                    value={sortBy}
                    label={t('collectionsPage.filters.sortBy')}
                    onChange={(e) => setSortBy(e.target.value)}
                    sx={{ borderRadius: 3 }}
                  >
                    <MenuItem value="featured">🔥 {t('collectionsPage.sorting.featured')}</MenuItem>
                    <MenuItem value="rating">⭐ {t('collectionsPage.sorting.highestRated')}</MenuItem>
                    <MenuItem value="price-low">💰 {t('collectionsPage.sorting.priceLowHigh')}</MenuItem>
                    <MenuItem value="price-high">💎 {t('collectionsPage.sorting.priceHighLow')}</MenuItem>
                    {userLocation && <MenuItem value="distance">📍 {t('collectionsPage.sorting.nearestFirst')}</MenuItem>}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Price Range Filter */}
            <Box mt={3}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={2}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {t('collectionsPage.filters.priceRange')}:
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={2}>
                  <TextField
                    fullWidth
                    type="number"
                    placeholder={t('collectionsPage.filters.min')}
                    value={priceFilter.min}
                    onChange={(e) => setPriceFilter(prev => ({ ...prev, min: e.target.value }))}
                    size="small"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>
                <Grid item xs={6} sm={2}>
                  <TextField
                    fullWidth
                    type="number"
                    placeholder={t('collectionsPage.filters.max')}
                    value={priceFilter.max}
                    onChange={(e) => setPriceFilter(prev => ({ ...prev, max: e.target.value }))}
                    size="small"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Stack direction="row" spacing={2} justifyContent="flex-end">
                    {userLocation && (
                      <Tooltip title={t('collectionsPage.map.getMyLocation')}>
                        <IconButton 
                          onClick={getUserLocation}
                          color="primary"
                          sx={{ 
                            bgcolor: 'primary.main',
                            color: 'white',
                            '&:hover': { bgcolor: 'primary.dark' }
                          }}
                        >
                          <MyLocation />
                        </IconButton>
                      </Tooltip>
                    )}
                    <ToggleButtonGroup
                      value={viewMode}
                      exclusive
                      onChange={handleViewModeChange}
                      sx={{ borderRadius: 3 }}
                    >
                      <ToggleButton value="grid" aria-label={t('collectionsPage.viewModes.gridView')}>
                        <GridView />
                      </ToggleButton>
                      <ToggleButton value="map" aria-label={t('collectionsPage.viewModes.mapView')}>
                        <MapIcon />
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Stack>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </motion.div>

        {/* Results Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Box>
              <Typography variant="h4" fontWeight={700}>
                <Badge badgeContent={filteredCollections.length} color="primary" max={999}>
                  <span>{t('collectionsPage.results.title')}</span>
                </Badge>
              </Typography>
              <Typography variant="body1" color="text.secondary" mt={1}>
                {filteredCollections.length === 0 
                  ? t('collectionsPage.results.noResults')
                  : t('collectionsPage.results.found', { count: filteredCollections.length })
                }
              </Typography>
            </Box>
            <Chip
              icon={<TrendingUp />}
              label={t('collectionsPage.results.premiumQuality')}
              color="success"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          </Stack>
        </motion.div>

        {/* Main Content Area */}
        <AnimatePresence mode="wait">
          {viewMode === 'grid' ? (
            /* Collections Grid */
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Grid container spacing={3}>
                {filteredCollections.map((collection, index) => {
                  // Use real uploaded images, with a proper fallback for collections without images
                  const hasRealImages = collection.images && collection.images.length > 0 && collection.images[0];
                  const mainImage = hasRealImages 
                    ? collection.images[0] 
                    : getPlaceholderImage(collection.type);
                  const typeColor = getTypeColor(collection.type);
                  const distance = getDistanceFromUser(collection);
                  
                  return (
                    <Grid item xs={12} sm={6} md={4} key={collection._id}>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                      >
                        <Card 
                          elevation={theme.palette.mode === 'dark' ? 8 : 4}
                          sx={{ 
                            borderRadius: 4, 
                            overflow: 'hidden',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                            cursor: 'pointer',
                            position: 'relative',
                            backgroundColor: theme.palette.mode === 'dark' 
                              ? 'rgba(30, 41, 59, 0.8)'
                              : 'background.paper',
                            backdropFilter: 'blur(20px)',
                            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
                            '&:hover': {
                              transform: 'translateY(-8px) scale(1.02)',
                              boxShadow: theme.palette.mode === 'dark' 
                                ? '0 20px 40px rgba(0,0,0,0.4)' 
                                : '0 20px 40px rgba(0,0,0,0.1)',
                            },
                            '&:before': {
                              content: '""',
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              background: `linear-gradient(45deg, ${typeColor}${theme.palette.mode === 'dark' ? '15' : '08'}, transparent)`,
                              opacity: 0,
                              transition: 'opacity 0.3s ease',
                              zIndex: 1,
                              pointerEvents: 'none'
                            },
                            '&:hover:before': {
                              opacity: 1
                            }
                          }}
                        >
                          <Box sx={{ position: 'relative', overflow: 'hidden' }}>
                            <Box sx={{ position: 'relative' }}>
                              <CardMedia
                                component="img"
                                height={240}
                                image={mainImage}
                                alt={collection.title}
                                sx={{
                                  transition: 'transform 0.4s ease',
                                  filter: hasRealImages ? 'none' : 'brightness(0.8) sepia(0.2)',
                                  '&:hover': {
                                    transform: 'scale(1.1)'
                                  }
                                }}
                              />
                              
                              {/* Image Status Indicator */}
                              {!hasRealImages && (
                                <Chip
                                  label={t('collectionsPage.imageStatus.stockPhoto')}
                                  size="small"
                                  sx={{
                                    position: 'absolute',
                                    bottom: 8,
                                    left: 8,
                                    backgroundColor: 'rgba(0,0,0,0.6)',
                                    color: 'white',
                                    fontSize: '0.7rem'
                                  }}
                                />
                              )}
                              
                              {/* Multiple Images Indicator */}
                              {hasRealImages && collection.images.length > 1 && (
                                <Chip
                                  icon={<ViewList sx={{ fontSize: 14 }} />}
                                  label={t('collectionsPage.imageStatus.photos', { count: collection.images.length - 1 })}
                                  size="small"
                                  sx={{
                                    position: 'absolute',
                                    bottom: 8,
                                    left: 8,
                                    backgroundColor: 'rgba(0,0,0,0.7)',
                                    color: 'white',
                                    fontSize: '0.7rem'
                                  }}
                                />
                              )}
                            </Box>
                            
                            {/* Gradient Overlay */}
                            <Box
                              sx={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                height: '50%',
                                background: theme.palette.mode === 'dark' 
                                  ? 'linear-gradient(transparent, rgba(0,0,0,0.8))'
                                  : 'linear-gradient(transparent, rgba(0,0,0,0.6))',
                                zIndex: 1
                              }}
                            />
                            
                            {/* Top Badges */}
                            <Stack
                              direction="row"
                              spacing={1}
                              sx={{
                                position: 'absolute',
                                top: 12,
                                left: 12,
                                zIndex: 2
                              }}
                            >
                              <Chip
                                icon={getTypeIcon(collection.type)}
                                label={t(`collectionsPage.types.${collection.type.replace('-', '')}`)}
                                size="small"
                                sx={{
                                  backgroundColor: typeColor,
                                  color: 'white',
                                  fontWeight: 700,
                                  textTransform: 'capitalize',
                                  backdropFilter: 'blur(10px)',
                                  border: theme.palette.mode === 'dark' ? '1px solid rgba(255,255,255,0.2)' : 'none',
                                  boxShadow: theme.palette.mode === 'dark' 
                                    ? `0 2px 8px ${typeColor}40` 
                                    : `0 2px 8px ${typeColor}30`
                                }}
                              />
                              {collection.amenities?.includes('verified') && (
                                <Chip
                                  icon={<Verified sx={{ fontSize: 14 }} />}
                                  label={t('collectionsPage.verification.verified')}
                                  size="small"
                                  sx={{
                                    backgroundColor: '#4CAF50',
                                    color: 'white',
                                    fontWeight: 600,
                                    border: theme.palette.mode === 'dark' ? '1px solid rgba(255,255,255,0.2)' : 'none',
                                    boxShadow: theme.palette.mode === 'dark' 
                                      ? '0 2px 8px rgba(76,175,80,0.4)' 
                                      : '0 2px 8px rgba(76,175,80,0.3)'
                                  }}
                                />
                              )}
                            </Stack>

                            {/* Top Right Actions */}
                            <Stack
                              sx={{
                                position: 'absolute',
                                top: 12,
                                right: 12,
                                zIndex: 2
                              }}
                            >
                              <Tooltip title={favorites.has(collection._id) ? t('collectionsPage.favorites.removeFromFavorites') : t('collectionsPage.favorites.addToFavorites')}>
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavorite(collection._id);
                                  }}
                                  sx={{
                                    backgroundColor: theme.palette.mode === 'dark' 
                                      ? 'rgba(255,255,255,0.15)'
                                      : 'rgba(255,255,255,0.9)',
                                    color: favorites.has(collection._id) ? 'error.main' : 
                                      theme.palette.mode === 'dark' ? 'white' : 'text.secondary',
                                    backdropFilter: 'blur(10px)',
                                    border: theme.palette.mode === 'dark' ? '1px solid rgba(255,255,255,0.2)' : 'none',
                                    '&:hover': {
                                      backgroundColor: theme.palette.mode === 'dark' 
                                        ? 'rgba(255,255,255,0.25)'
                                        : 'white',
                                      color: 'error.main',
                                      transform: 'scale(1.1)'
                                    }
                                  }}
                                >
                                  <FavoriteOutlined sx={{ fontSize: 18 }} />
                                </IconButton>
                              </Tooltip>
                            </Stack>

                            {/* Bottom Overlay Content */}
                            <Box
                              sx={{
                                position: 'absolute',
                                bottom: 12,
                                left: 12,
                                right: 12,
                                zIndex: 2
                              }}
                            >
                              <Stack direction="row" justifyContent="space-between" alignItems="center">
                                {/* Rating */}
                                {collection.rating && (
                                  <Chip
                                    icon={<Star sx={{ fontSize: 16 }} />}
                                    label={`${collection.rating.toFixed(1)} (${collection.totalRatings || 0})`}
                                    size="small"
                                    sx={{
                                      backgroundColor: 'rgba(255, 215, 0, 0.9)',
                                      color: 'black',
                                      fontWeight: 700,
                                      backdropFilter: 'blur(10px)',
                                      border: theme.palette.mode === 'dark' ? '1px solid rgba(255,215,0,0.3)' : 'none'
                                    }}
                                  />
                                )}
                                
                                {/* Distance */}
                                {distance && (
                                  <Chip
                                    icon={<Navigation sx={{ fontSize: 14 }} />}
                                    label={`${distance.toFixed(1)}km`}
                                    size="small"
                                    sx={{
                                      backgroundColor: theme.palette.mode === 'dark' 
                                        ? 'rgba(255,255,255,0.15)'
                                        : 'rgba(255,255,255,0.9)',
                                      color: theme.palette.mode === 'dark' ? 'white' : 'text.primary',
                                      fontWeight: 600,
                                      backdropFilter: 'blur(10px)',
                                      border: theme.palette.mode === 'dark' ? '1px solid rgba(255,255,255,0.2)' : 'none'
                                    }}
                                  />
                                )}
                              </Stack>
                            </Box>
                          </Box>

                          <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 3, zIndex: 2 }}>
                            <Typography variant="h5" fontWeight={700} gutterBottom>
                              {collection.title}
                            </Typography>
                            
                            <Typography 
                              variant="body2" 
                              color="text.secondary" 
                              sx={{ 
                                mb: 2,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                lineHeight: 1.5
                              }}
                            >
                              {collection.description}
                            </Typography>

                            {/* Location with Enhanced Styling */}
                            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                              <LocationOn sx={{ 
                                fontSize: 20, 
                                color: theme.palette.mode === 'dark' ? 'primary.light' : 'primary.main' 
                              }} />
                              <Typography 
                                variant="body2" 
                                color={theme.palette.mode === 'dark' ? 'text.primary' : 'text.primary'} 
                                fontWeight={500}
                                sx={{
                                  opacity: theme.palette.mode === 'dark' ? 0.9 : 1
                                }}
                              >
                                {collection.location.address}
                              </Typography>
                            </Stack>

                            {/* Price with Enhanced Styling */}
                            {collection.price && (
                              <Box mb={2}>
                                <Typography 
                                  variant="h5" 
                                  color={theme.palette.mode === 'dark' ? 'primary.light' : 'primary.main'}
                                  fontWeight={900}
                                  sx={{
                                    textShadow: theme.palette.mode === 'dark' ? '0 1px 2px rgba(0,0,0,0.5)' : 'none'
                                  }}
                                >
                                  ${collection.price.toLocaleString()}
                                  {collection.priceType && collection.priceType !== 'fixed' && (
                                    <Typography 
                                      component="span" 
                                      variant="body1" 
                                      color="text.secondary" 
                                      fontWeight={500}
                                      sx={{
                                        opacity: theme.palette.mode === 'dark' ? 0.8 : 1
                                      }}
                                    >
                                      /{collection.priceType.replace('per-', '')}
                                    </Typography>
                                  )}
                                </Typography>
                              </Box>
                            )}

                            {/* Enhanced Amenities */}
                            {collection.amenities && collection.amenities.length > 0 && (
                              <Box mb={2}>
                                <Typography variant="subtitle2" color="text.secondary" mb={1}>
                                  {t('collectionsPage.amenities.features')}:
                                </Typography>
                                <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                                  {collection.amenities.slice(0, 4).map((amenity, index) => (
                                    <Chip
                                      key={index}
                                      label={amenity}
                                      size="small"
                                      variant="outlined"
                                      sx={{ 
                                        fontSize: '0.75rem',
                                        borderRadius: 2,
                                        borderColor: `${typeColor}50`,
                                        color: typeColor,
                                        backgroundColor: `${typeColor}08`
                                      }}
                                    />
                                  ))}
                                  {collection.amenities.length > 4 && (
                                    <Chip
                                      label={`+${collection.amenities.length - 4}`}
                                      size="small"
                                      sx={{ 
                                        fontSize: '0.75rem',
                                        backgroundColor: 'action.hover',
                                        borderRadius: 2
                                      }}
                                    />
                                  )}
                                </Stack>
                              </Box>
                            )}

                            {/* Image Status Debug Info */}
                            <Box mb={2}>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Typography variant="caption" color="text.secondary">
                                  {t('collectionsPage.imageStatus.images')}:
                                </Typography>
                                {hasRealImages ? (
                                  <Chip
                                    icon={<CheckCircle sx={{ fontSize: 14 }} />}
                                    label={t('collectionsPage.imageStatus.uploaded', { count: collection.images.length })}
                                    size="small"
                                    color="success"
                                    sx={{ fontSize: '0.7rem', height: 20 }}
                                  />
                                ) : (
                                  <Chip
                                    label={t('collectionsPage.imageStatus.usingStock')}
                                    size="small"
                                    variant="outlined"
                                    sx={{ 
                                      fontSize: '0.7rem', 
                                      height: 20,
                                      borderColor: 'warning.main',
                                      color: 'warning.main'
                                    }}
                                  />
                                )}
                              </Stack>
                            </Box>

                            {/* Enhanced Actions */}
                            <CardActions sx={{ p: 0, mt: 'auto', pt: 2 }}>
                              <Stack direction="row" spacing={2} width="100%">
                                <Button
                                  variant="outlined"
                                  size="medium"
                                  component={NextLink}
                                  href={`/collections/${collection._id}`}
                                  startIcon={<Visibility />}
                                  sx={{ 
                                    borderRadius: 3,
                                    borderWidth: 2,
                                    fontWeight: 600,
                                    flex: 1,
                                    '&:hover': {
                                      borderWidth: 2,
                                      transform: 'translateY(-1px)'
                                    }
                                  }}
                                >
                                  {t('collectionsPage.actions.explore')}
                                </Button>
                                
                                <Button
                                  variant="contained"
                                  size="medium"
                                  onClick={() => handleBookCollection(collection)}
                                  startIcon={<LocalOffer />}
                                  sx={{ 
                                    borderRadius: 3,
                                    backgroundColor: typeColor,
                                    fontWeight: 700,
                                    flex: 1,
                                    boxShadow: `0 4px 12px ${typeColor}40`,
                                    '&:hover': {
                                      backgroundColor: typeColor,
                                      boxShadow: `0 6px 20px ${typeColor}60`,
                                      transform: 'translateY(-1px)'
                                    }
                                  }}
                                >
                                  {t('collectionsPage.actions.book')}
                                </Button>
                              </Stack>
                            </CardActions>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </Grid>
                  );
                })}
              </Grid>
            </motion.div>
          ) : (
            /* Map View */
            <motion.div
              key="map"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Paper 
                elevation={4} 
                sx={{ 
                  borderRadius: 4, 
                  overflow: 'hidden', 
                  height: '70vh',
                  position: 'relative'
                }}
              >
                <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'demo-key'}>
                  <Map
                    defaultCenter={
                      userLocation || 
                      (filteredCollections.length > 0 
                        ? { 
                            lat: filteredCollections[0].location.coordinates[1], 
                            lng: filteredCollections[0].location.coordinates[0] 
                          }
                        : { lat: 37.7749, lng: -122.4194 }
                      )
                    }
                    defaultZoom={userLocation ? 12 : 10}
                    mapId="collections-map"
                    style={{ width: '100%', height: '100%' }}
                  >
                    {/* User Location Marker */}
                    {userLocation && (
                      <Marker
                        position={userLocation}
                        title={t('collectionsPage.map.yourLocation')}
                      />
                    )}

                    {/* Collection Markers */}
                    {filteredCollections.map((collection) => (
                      <Marker
                        key={collection._id}
                        position={{ 
                          lat: collection.location.coordinates[1], 
                          lng: collection.location.coordinates[0] 
                        }}
                        title={collection.title}
                        onClick={() => setSelectedMarker(collection._id)}
                      />
                    ))}

                    {/* Info Window for Selected Marker */}
                    {selectedMarker && (
                      <InfoWindow
                        position={{
                          lat: filteredCollections.find(c => c._id === selectedMarker)?.location.coordinates[1] || 0,
                          lng: filteredCollections.find(c => c._id === selectedMarker)?.location.coordinates[0] || 0
                        }}
                        onCloseClick={() => setSelectedMarker(null)}
                      >
                        <Box sx={{ p: 2, minWidth: 300 }}>
                          {(() => {
                            const collection = filteredCollections.find(c => c._id === selectedMarker);
                            if (!collection) return null;
                            
                            return (
                              <>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                  {getTypeIcon(collection.type)}
                                  <Typography variant="h6" fontWeight={700} ml={1}>
                                    {collection.title}
                                  </Typography>
                                </Box>
                                
                                <Typography variant="body2" color="text.secondary" mb={1}>
                                  {collection.description}
                                </Typography>
                                
                                <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                                  <LocationOn sx={{ fontSize: 16, color: 'primary.main' }} />
                                  <Typography variant="body2">
                                    {collection.location.address}
                                  </Typography>
                                </Stack>
                                
                                {collection.rating && (
                                  <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                                    <Star sx={{ fontSize: 16, color: '#FFD700' }} />
                                    <Typography variant="body2">
                                      {collection.rating.toFixed(1)} ({collection.totalRatings || 0} {t('collectionsPage.reviews')})
                                    </Typography>
                                  </Stack>
                                )}
                                
                                {collection.price && (
                                  <Typography variant="h6" color="primary" fontWeight={700} mb={2}>
                                    ${collection.price}
                                    {collection.priceType && collection.priceType !== 'fixed' && 
                                      `/${collection.priceType.replace('per-', '')}`
                                    }
                                  </Typography>
                                )}
                                
                                <Stack direction="row" spacing={1}>
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    component={NextLink}
                                    href={`/collections/${collection._id}`}
                                    sx={{ borderRadius: 2 }}
                                  >
                                    {t('collectionsPage.actions.viewDetails')}
                                  </Button>
                                  <Button
                                    variant="contained"
                                    size="small"
                                    onClick={() => handleBookCollection(collection)}
                                    sx={{ borderRadius: 2 }}
                                  >
                                    {t('collectionsPage.actions.bookNow')}
                                  </Button>
                                </Stack>
                              </>
                            );
                          })()}
                        </Box>
                      </InfoWindow>
                    )}
                  </Map>
                </APIProvider>

                {/* Map Controls */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    zIndex: 1000
                  }}
                >
                  <Stack spacing={1}>
                    <Tooltip title={t('collectionsPage.map.recenterLocation')}>
                      <Fab
                        size="small"
                        color="primary"
                        onClick={getUserLocation}
                        disabled={!userLocation}
                      >
                        <MyLocation />
                      </Fab>
                    </Tooltip>
                    <Tooltip title={t('collectionsPage.map.switchToGrid')}>
                      <Fab
                        size="small"
                        color="secondary"
                        onClick={() => setViewMode('grid')}
                      >
                        <GridView />
                      </Fab>
                    </Tooltip>
                  </Stack>
                </Box>
              </Paper>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Empty State */}
        {filteredCollections.length === 0 && collections && collections.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Box 
              textAlign="center" 
              py={12}
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main}08 0%, ${theme.palette.secondary.main}08 100%)`,
                borderRadius: 4,
                border: '2px dashed',
                borderColor: 'divider'
              }}
            >
              <MapIcon sx={{ fontSize: 120, color: 'text.disabled', mb: 3, opacity: 0.5 }} />
              <Typography variant="h4" fontWeight={700} gutterBottom color="text.primary">
                {t('collectionsPage.emptyState.title')}
              </Typography>
              <Typography variant="h6" color="text.secondary" mb={3} sx={{ maxWidth: 500, mx: 'auto' }}>
                {t('collectionsPage.emptyState.description')}
              </Typography>
              <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => {
                    setSearchQuery('');
                    setTypeFilter('');
                    setCityFilter('');
                    setRatingFilter('');
                    setPriceFilter({ min: '', max: '' });
                  }}
                  sx={{ borderRadius: 3, fontWeight: 600 }}
                >
                  {t('collectionsPage.emptyState.clearFilters')}
                </Button>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => setViewMode('map')}
                  startIcon={<MapIcon />}
                  sx={{ borderRadius: 3, fontWeight: 600 }}
                >
                  {t('collectionsPage.emptyState.exploreMap')}
                </Button>
              </Stack>
            </Box>
          </motion.div>
        )}
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
            {t('collectionsPage.booking.title', { title: selectedCollection?.title || '' })}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('collectionsPage.booking.subtitle')}
          </Typography>
        </DialogTitle>
        
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* Collection Info */}
            {selectedCollection && (
              <Grid item xs={12}>
                <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
                  <Stack direction="row" spacing={2}>
                    <Avatar
                      src={selectedCollection.images?.[0]}
                      sx={{ width: 60, height: 60 }}
                    />
                    <Box>
                      <Typography variant="h6" fontWeight={700}>
                        {selectedCollection.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedCollection.location.address}
                      </Typography>
                      {selectedCollection.price && (
                        <Typography variant="h6" color="primary">
                          ${selectedCollection.price}
                          {selectedCollection.priceType && selectedCollection.priceType !== 'fixed' && (
                            <span>/{selectedCollection.priceType.replace('per-', '')}</span>
                          )}
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
            )}

            {/* Booking Dates (for hotels) */}
            {selectedCollection?.type === 'hotel' && (
              <>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label={t('collectionsPage.booking.checkInDate')}
                    type="date"
                    value={bookingData.checkIn || ''}
                    onChange={(e) => setBookingData(prev => ({ ...prev, checkIn: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label={t('collectionsPage.booking.checkOutDate')}
                    type="date"
                    value={bookingData.checkOut || ''}
                    onChange={(e) => setBookingData(prev => ({ ...prev, checkOut: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </>
            )}

            {/* Room Type Selection */}
            {selectedCollection?.roomTypes && selectedCollection.roomTypes.length > 0 && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>{t('collectionsPage.booking.roomType')}</InputLabel>
                  <Select
                    value={bookingData.roomType || ''}
                    label={t('collectionsPage.booking.roomType')}
                    onChange={(e) => setBookingData(prev => ({ ...prev, roomType: e.target.value }))}
                  >
                    {selectedCollection.roomTypes.map((room, index) => (
                      <MenuItem key={index} value={room.name}>
                        {room.name} - ${room.price}/{t('collectionsPage.booking.perNight')} ({t('collectionsPage.booking.capacity')}: {room.capacity})
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
                label={t('collectionsPage.booking.numberOfGuests')}
                type="number"
                value={bookingData.guests}
                onChange={(e) => setBookingData(prev => ({ ...prev, guests: parseInt(e.target.value) || 1 }))}
                inputProps={{ min: 1 }}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                {t('collectionsPage.booking.contactInformation')}
              </Typography>
            </Grid>

            {/* Customer Info */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('collectionsPage.booking.fullName')}
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
                label={t('collectionsPage.booking.email')}
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
                label={t('collectionsPage.booking.phone')}
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
                label={t('collectionsPage.booking.specialRequests')}
                multiline
                rows={3}
                value={bookingData.specialRequests || ''}
                onChange={(e) => setBookingData(prev => ({ ...prev, specialRequests: e.target.value }))}
                placeholder={t('collectionsPage.booking.enterRequests')}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setBookingDialogOpen(false)}>
            {t('collectionsPage.booking.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={submitBooking}
            disabled={bookingLoading || !bookingData.customerInfo.name || !bookingData.customerInfo.email || !bookingData.customerInfo.phone}
            sx={{ 
              px: 4, 
              backgroundColor: selectedCollection ? getTypeColor(selectedCollection.type) : undefined, 
              '&:hover': { 
                backgroundColor: selectedCollection ? getTypeColor(selectedCollection.type) : undefined, 
                opacity: 0.9 
              } 
            }}
          >
            {bookingLoading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              t('actions.addToCart')
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}