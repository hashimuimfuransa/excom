"use client";
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Chip,
  Divider,
  useTheme,
  alpha,
  Tooltip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  Directions as DirectionsIcon,
  MyLocation as MyLocationIcon,
  Close as CloseIcon,
  Store as StoreIcon,
  AccessTime as TimeIcon,
  Phone as PhoneIcon,
  Language as WebsiteIcon
} from '@mui/icons-material';
import { APIProvider, Map, Marker, InfoWindow } from '@vis.gl/react-google-maps';

interface Location {
  lat: number;
  lng: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
}

interface Store {
  _id: string;
  name: string;
  location: Location;
  businessHours?: {
    [key: string]: { open: string; close: string; closed?: boolean };
  };
  contactInfo?: {
    phone?: string;
    website?: string;
  };
}

interface LocationComparisonProps {
  userLocation: Location | null;
  store: Store;
  productTitle: string;
  open: boolean;
  onClose: () => void;
}

export default function LocationComparison({
  userLocation,
  store,
  productTitle,
  open,
  onClose
}: LocationComparisonProps) {
  const theme = useTheme();
  const [distance, setDistance] = useState<number | null>(null);
  const [travelTime, setTravelTime] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userLocation && store.location && open) {
      calculateDistanceAndTime();
    }
  }, [userLocation, store.location, open]);

  const calculateDistanceAndTime = async () => {
    if (!userLocation || !store.location) return;

    setIsLoading(true);
    setError(null);

    try {
      // Calculate straight-line distance
      const distanceKm = calculateHaversineDistance(
        userLocation.lat,
        userLocation.lng,
        store.location.lat,
        store.location.lng
      );
      setDistance(distanceKm);

      // Get travel time using Google Maps Distance Matrix API
      if (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${userLocation.lat},${userLocation.lng}&destinations=${store.location.lat},${store.location.lng}&mode=driving&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
        );
        const data = await response.json();

        if (data.status === 'OK' && data.rows[0]?.elements[0]?.status === 'OK') {
          const element = data.rows[0].elements[0];
          setTravelTime(element.duration.text);
        }
      }
    } catch (err) {
      setError('Failed to calculate travel information');
      console.error('Error calculating distance/time:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const openInMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${store.location.lat},${store.location.lng}`;
    window.open(url, '_blank');
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          // Update user location (this would need to be passed up to parent)
          console.log('New location:', newLocation);
        },
        (error) => {
          setError('Unable to get current location');
          console.error('Geolocation error:', error);
        }
      );
    }
  };

  const formatDistance = (distanceKm: number): string => {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)}m`;
    }
    return `${distanceKm.toFixed(1)}km`;
  };

  const getBusinessHoursText = () => {
    if (!store.businessHours) return 'Hours not available';
    
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const todayHours = store.businessHours[today];
    
    if (!todayHours || todayHours.closed) {
      return 'Closed today';
    }
    
    return `Open today: ${todayHours.open} - ${todayHours.close}`;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, rgba(26, 26, 46, 0.95) 0%, rgba(22, 33, 62, 0.95) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
          backdropFilter: 'blur(20px)',
          border: `1px solid ${alpha(theme.palette.divider, 0.2)}`
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        pb: 1
      }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <StoreIcon color="primary" />
          <Typography variant="h6" fontWeight={600}>
            Store Location
          </Typography>
        </Stack>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Stack spacing={3}>
          {/* Product Info */}
          <Card sx={{ 
            background: alpha(theme.palette.primary.main, 0.05),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
          }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="subtitle2" color="primary" fontWeight={600} gutterBottom>
                Product Available At
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                {productTitle}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {store.name}
              </Typography>
            </CardContent>
          </Card>

          {/* Location Information */}
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <LocationIcon color="primary" />
                  <Typography variant="subtitle1" fontWeight={600}>
                    Store Location
                  </Typography>
                </Stack>
                
                <Typography variant="body1">
                  {store.location.address || 'Address not available'}
                </Typography>
                
                {store.location.city && (
                  <Typography variant="body2" color="text.secondary">
                    {store.location.city}
                    {store.location.state && `, ${store.location.state}`}
                    {store.location.country && `, ${store.location.country}`}
                  </Typography>
                )}

                {/* Distance and Travel Time */}
                {userLocation && (
                  <Box sx={{ 
                    p: 2, 
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                  }}>
                    <Stack spacing={1}>
                      <Typography variant="subtitle2" color="success.main" fontWeight={600}>
                        Distance Information
                      </Typography>
                      
                      {isLoading ? (
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <CircularProgress size={16} />
                          <Typography variant="body2">Calculating...</Typography>
                        </Stack>
                      ) : (
                        <>
                          {distance && (
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <LocationIcon fontSize="small" />
                              <Typography variant="body2">
                                {formatDistance(distance)} away
                              </Typography>
                            </Stack>
                          )}
                          
                          {travelTime && (
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <TimeIcon fontSize="small" />
                              <Typography variant="body2">
                                {travelTime} by car
                              </Typography>
                            </Stack>
                          )}
                        </>
                      )}
                    </Stack>
                  </Box>
                )}

                {/* Business Hours */}
                <Box sx={{ 
                  p: 2, 
                  bgcolor: alpha(theme.palette.info.main, 0.1),
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
                }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                    <TimeIcon fontSize="small" color="info" />
                    <Typography variant="subtitle2" color="info.main" fontWeight={600}>
                      Business Hours
                    </Typography>
                  </Stack>
                  <Typography variant="body2">
                    {getBusinessHoursText()}
                  </Typography>
                </Box>

                {/* Contact Information */}
                {(store.contactInfo?.phone || store.contactInfo?.website) && (
                  <Box sx={{ 
                    p: 2, 
                    bgcolor: alpha(theme.palette.warning.main, 0.1),
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`
                  }}>
                    <Typography variant="subtitle2" color="warning.main" fontWeight={600} gutterBottom>
                      Contact Information
                    </Typography>
                    <Stack spacing={1}>
                      {store.contactInfo.phone && (
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <PhoneIcon fontSize="small" />
                          <Typography variant="body2">{store.contactInfo.phone}</Typography>
                        </Stack>
                      )}
                      {store.contactInfo.website && (
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <WebsiteIcon fontSize="small" />
                          <Typography 
                            variant="body2" 
                            component="a" 
                            href={store.contactInfo.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ 
                              color: 'primary.main', 
                              textDecoration: 'none',
                              '&:hover': { textDecoration: 'underline' }
                            }}
                          >
                            Visit Website
                          </Typography>
                        </Stack>
                      )}
                    </Stack>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* Map */}
          <Card>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ height: 300, borderRadius: 2, overflow: 'hidden' }}>
                <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'demo-key'}>
                  <Map
                    defaultCenter={store.location}
                    defaultZoom={15}
                    mapId="store-location-map"
                    style={{ width: '100%', height: '100%' }}
                  >
                    {/* Store Marker */}
                    <Marker
                      position={store.location}
                      title={store.name}
                    />
                    
                    {/* User Location Marker */}
                    {userLocation && (
                      <Marker
                        position={userLocation}
                        title="Your Location"
                      />
                    )}
                  </Map>
                </APIProvider>
              </Box>
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {error}
            </Alert>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
          <Button
            variant="outlined"
            startIcon={<MyLocationIcon />}
            onClick={getCurrentLocation}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Update Location
          </Button>
          
          <Button
            variant="contained"
            startIcon={<DirectionsIcon />}
            onClick={openInMaps}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              background: 'linear-gradient(45deg, #7c3aed, #06b6d4)',
              '&:hover': {
                background: 'linear-gradient(45deg, #6d28d9, #0891b2)'
              }
            }}
          >
            Get Directions
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
