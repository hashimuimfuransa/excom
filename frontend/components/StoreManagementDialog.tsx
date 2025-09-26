"use client";
import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Stack,
  Typography,
  Alert,
  Avatar,
  IconButton,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Grid,
  Divider,
  Switch,
  FormControlLabel,
  InputAdornment,
  Paper
} from '@mui/material';
import {
  PhotoCamera,
  Edit,
  Store as StoreIcon,
  Image as ImageIcon,
  LocationOn,
  Phone,
  Email,
  Language,
  AccessTime,
  Facebook,
  Instagram,
  Twitter,
  LinkedIn,
  MyLocation,
  Map as MapIcon
} from '@mui/icons-material';
import { APIProvider, Map, Marker, InfoWindow } from '@vis.gl/react-google-maps';
import { apiPost, apiPut } from '../utils/api';
import LanguageSwitcher from './LanguageSwitcher';
import DarkModeToggle from './DarkModeToggle';
import { useTranslation } from 'react-i18next';

interface Store {
  _id: string;
  name: string;
  description?: string;
  logo?: string;
  banner?: string;
  approved?: boolean;
  owner?: { _id: string; name: string; email: string; role: string };
  isActive?: boolean;
  category?: string;
  contactInfo?: {
    email?: string;
    phone?: string;
    website?: string;
    socialMedia?: {
      facebook?: string;
      instagram?: string;
      twitter?: string;
      linkedin?: string;
    };
  };
  location?: {
    address: string;
    city: string;
    state?: string;
    country: string;
    postalCode?: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  businessHours?: {
    [key: string]: {
      open: string;
      close: string;
      closed?: boolean;
    };
  };
  createdAt?: string;
}

interface StoreFormData {
  name: string;
  description: string;
  category: string;
  logo?: string;
  banner?: string;
  isActive: boolean;
  contactInfo: {
    email: string;
    phone: string;
    website: string;
    socialMedia: {
      facebook: string;
      instagram: string;
      twitter: string;
      linkedin: string;
    };
  };
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  businessHours: {
    [key: string]: {
      open: string;
      close: string;
      closed: boolean;
    };
  };
}

interface StoreManagementDialogProps {
  open: boolean;
  onClose: () => void;
  store?: Store | null;
  onStoreCreated?: (store: Store) => void;
  onStoreUpdated?: (store: Store) => void;
}

const categories = [
  'Electronics',
  'Fashion',
  'Home & Garden',
  'Sports & Outdoors',
  'Books',
  'Toys & Games',
  'Health & Beauty',
  'Food & Beverages',
  'Arts & Crafts',
  'Automotive',
  'Other'
];

const countries = [
  'Rwanda',
  'Kenya',
  'Uganda',
  'Tanzania',
  'Burundi',
  'South Africa',
  'Nigeria',
  'Ghana',
  'Egypt',
  'Morocco',
  'Other'
];

const days = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' }
];

export default function StoreManagementDialog({ 
  open, 
  onClose, 
  store, 
  onStoreCreated, 
  onStoreUpdated 
}: StoreManagementDialogProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<StoreFormData>(() => ({
    name: store?.name || '',
    description: store?.description || '',
    category: store?.category || '',
    logo: store?.logo || '',
    banner: store?.banner || '',
    isActive: store?.isActive ?? true,
    contactInfo: {
      email: store?.contactInfo?.email || '',
      phone: store?.contactInfo?.phone || '',
      website: store?.contactInfo?.website || '',
      socialMedia: {
        facebook: store?.contactInfo?.socialMedia?.facebook || '',
        instagram: store?.contactInfo?.socialMedia?.instagram || '',
        twitter: store?.contactInfo?.socialMedia?.twitter || '',
        linkedin: store?.contactInfo?.socialMedia?.linkedin || ''
      }
    },
    location: {
      address: store?.location?.address || '',
      city: store?.location?.city || '',
      state: store?.location?.state || '',
      country: store?.location?.country || 'Rwanda',
      postalCode: store?.location?.postalCode || '',
      coordinates: {
        lat: store?.location?.coordinates?.lat || -1.9441,
        lng: store?.location?.coordinates?.lng || 30.0619
      }
    },
    businessHours: {
      monday: { open: '09:00', close: '18:00', closed: false },
      tuesday: { open: '09:00', close: '18:00', closed: false },
      wednesday: { open: '09:00', close: '18:00', closed: false },
      thursday: { open: '09:00', close: '18:00', closed: false },
      friday: { open: '09:00', close: '18:00', closed: false },
      saturday: { open: '09:00', close: '16:00', closed: false },
      sunday: { open: '10:00', close: '14:00', closed: false },
      ...store?.businessHours
    }
  }));
  
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState<{lat: number; lng: number}>({
    lat: formData.location.coordinates.lat,
    lng: formData.location.coordinates.lng
  });
  const [showMap, setShowMap] = useState(false);
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const isEditMode = !!store;

  useEffect(() => {
    if (open) {
      setMapCenter({
        lat: formData.location.coordinates.lat,
        lng: formData.location.coordinates.lng
      });
    }
  }, [open, formData.location.coordinates]);

  const handleInputChange = (field: string) => (
    event: React.ChangeEvent<HTMLInputElement | { value: unknown }>
  ) => {
    const value = event.target.value;
    
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      if (parent === 'contactInfo' && child === 'socialMedia') {
        // Handle social media fields
        const socialField = (event.target as any).name;
        setFormData(prev => ({
          ...prev,
          contactInfo: {
            ...prev.contactInfo,
            socialMedia: {
              ...prev.contactInfo.socialMedia,
              [socialField]: value
            }
          }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent as keyof StoreFormData],
            [child]: value
          }
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleLocationChange = (field: string) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        [field]: value
      }
    }));
  };

  const handleBusinessHoursChange = (day: string, field: string) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [day]: {
          ...prev.businessHours[day],
          [field]: field === 'closed' ? event.target.checked : value
        }
      }
    }));
  };

  const handleMapClick = async (event: any) => {
    const lat = event.detail.latLng.lat;
    const lng = event.detail.latLng.lng;
    
    setLocationLoading(true);
    setMessage('Getting address for selected location...');
    
    try {
      // Use Google Geocoding API to get address details
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        const addressComponents = result.address_components;
        
        // Extract address components
        let streetNumber = '';
        let route = '';
        let city = '';
        let state = '';
        let country = '';
        let postalCode = '';
        
        addressComponents.forEach((component: any) => {
          const types = component.types;
          if (types.includes('street_number')) {
            streetNumber = component.long_name;
          } else if (types.includes('route')) {
            route = component.long_name;
          } else if (types.includes('locality') || types.includes('administrative_area_level_2')) {
            city = component.long_name;
          } else if (types.includes('administrative_area_level_1')) {
            state = component.long_name;
          } else if (types.includes('country')) {
            country = component.long_name;
          } else if (types.includes('postal_code')) {
            postalCode = component.long_name;
          }
        });
        
        const fullAddress = result.formatted_address;
        const address = streetNumber && route ? `${streetNumber} ${route}` : route || fullAddress;
        
        setFormData(prev => ({
          ...prev,
          location: {
            address: address,
            city: city || prev.location.city,
            state: state || prev.location.state,
            country: country || prev.location.country,
            postalCode: postalCode || prev.location.postalCode,
            coordinates: { lat, lng }
          }
        }));
        
        setMessage('Location selected and address filled automatically');
      } else {
        // Fallback: just set coordinates if geocoding fails
        setFormData(prev => ({
          ...prev,
          location: {
            ...prev.location,
            coordinates: { lat, lng }
          }
        }));
        setMessage('Location selected, please fill address manually');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      // Fallback: just set coordinates
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          coordinates: { lat, lng }
        }
      }));
      setMessage('Location selected, please fill address manually');
    } finally {
      setLocationLoading(false);
    }
    
    setMapCenter({ lat, lng });
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setLocationLoading(true);
      setMessage('Getting your current location...');
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          try {
            // Use Google Geocoding API to get address details
            const response = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
            );
            const data = await response.json();
            
            if (data.status === 'OK' && data.results.length > 0) {
              const result = data.results[0];
              const addressComponents = result.address_components;
              
              // Extract address components
              let streetNumber = '';
              let route = '';
              let city = '';
              let state = '';
              let country = '';
              let postalCode = '';
              
              addressComponents.forEach((component: any) => {
                const types = component.types;
                if (types.includes('street_number')) {
                  streetNumber = component.long_name;
                } else if (types.includes('route')) {
                  route = component.long_name;
                } else if (types.includes('locality') || types.includes('administrative_area_level_2')) {
                  city = component.long_name;
                } else if (types.includes('administrative_area_level_1')) {
                  state = component.long_name;
                } else if (types.includes('country')) {
                  country = component.long_name;
                } else if (types.includes('postal_code')) {
                  postalCode = component.long_name;
                }
              });
              
              const fullAddress = result.formatted_address;
              const address = streetNumber && route ? `${streetNumber} ${route}` : route || fullAddress;
              
              setFormData(prev => ({
                ...prev,
                location: {
                  address: address,
                  city: city || prev.location.city,
                  state: state || prev.location.state,
                  country: country || prev.location.country,
                  postalCode: postalCode || prev.location.postalCode,
                  coordinates: { lat, lng }
                }
              }));
              
              setMessage('Location detected and address filled automatically');
            } else {
              // Fallback: just set coordinates if geocoding fails
              setFormData(prev => ({
                ...prev,
                location: {
                  ...prev.location,
                  coordinates: { lat, lng }
                }
              }));
              setMessage('Location detected, please fill address manually');
            }
          } catch (error) {
            console.error('Geocoding error:', error);
            // Fallback: just set coordinates
            setFormData(prev => ({
              ...prev,
              location: {
                ...prev.location,
                coordinates: { lat, lng }
              }
            }));
            setMessage('Location detected, please fill address manually');
          } finally {
            setLocationLoading(false);
          }
          
          setMapCenter({ lat, lng });
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationLoading(false);
          let errorMessage = 'Unable to get your current location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. Please enable location permissions.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out.';
              break;
          }
          setMessage(errorMessage);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    } else {
      setLocationLoading(false);
      setMessage('Geolocation is not supported by this browser');
    }
  };

  const handleImageUpload = async (
    file: File, 
    type: 'logo' | 'banner'
  ): Promise<string | null> => {
    try {
      setUploading(true);
      
      const reader = new FileReader();
      return new Promise((resolve, reject) => {
        reader.onload = async () => {
          try {
            const base64 = reader.result as string;
            const response = await apiPost<{ success: boolean; data: { secure_url: string } }>(
              '/upload/image',
              { 
                image: base64, 
                folder: `stores/${type}s` 
              }
            );
            
            if (response.success) {
              resolve(response.data.secure_url);
            } else {
              reject(new Error('Upload failed'));
            }
          } catch (error) {
            reject(error);
          }
        };
        
        reader.onerror = () => reject(new Error('File read failed'));
        reader.readAsDataURL(file);
      });
    } catch (error) {
      console.error(`${type} upload error:`, error);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'logo' | 'banner'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage('File size must be less than 5MB');
      return;
    }

    const uploadedUrl = await handleImageUpload(file, type);
    if (uploadedUrl) {
      setFormData(prev => ({
        ...prev,
        [type]: uploadedUrl
      }));
      setMessage(`${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully`);
    } else {
      setMessage(`Failed to upload ${type}`);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Prepare data for submission
      const submitData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        logo: formData.logo,
        banner: formData.banner,
        isActive: formData.isActive,
        contactInfo: formData.contactInfo,
        businessHours: formData.businessHours
      };

      // Only include location if it has required fields
      if (formData.location.address && formData.location.city && formData.location.country && 
          formData.location.coordinates.lat && formData.location.coordinates.lng) {
        submitData.location = formData.location;
      }

      if (isEditMode && store) {
        const updatedStore = await apiPut<Store>(`/sellers/stores/${store._id}`, submitData);
        onStoreUpdated?.(updatedStore);
        setMessage('Store updated successfully');
      } else {
        // For new stores, location is required
        if (!formData.location.address || !formData.location.city || !formData.location.country || 
            !formData.location.coordinates.lat || !formData.location.coordinates.lng) {
          setMessage('Location information is required for new stores');
          setLoading(false);
          return;
        }
        submitData.location = formData.location;
        
        const newStore = await apiPost<Store>('/sellers/stores', submitData);
        onStoreCreated?.(newStore);
        setMessage('Store created and submitted for approval');
      }
      
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (error: any) {
      setMessage(error?.message || `Failed to ${isEditMode ? 'update' : 'create'} store`);
    } finally {
      setLoading(false);
    }
  };

  const ImageUploadCard = ({ 
    type, 
    imageUrl, 
    onUpload 
  }: { 
    type: 'logo' | 'banner'; 
    imageUrl?: string; 
    onUpload: () => void; 
  }) => (
    <Card 
      sx={{ 
        borderRadius: 2, 
        border: '2px dashed',
        borderColor: imageUrl ? 'primary.main' : 'divider',
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': {
          borderColor: 'primary.main',
          bgcolor: 'action.hover'
        }
      }}
      onClick={onUpload}
    >
      <CardContent sx={{ textAlign: 'center', py: 3 }}>
        {imageUrl ? (
          <Box>
            <Box
              component="img"
              src={imageUrl}
              alt={`Store ${type}`}
              sx={{
                width: '100%',
                height: type === 'banner' ? 100 : 80,
                objectFit: 'cover',
                borderRadius: 1,
                mb: 1
              }}
            />
            <Typography variant="body2" color="text.secondary">
              Click to change {type}
            </Typography>
          </Box>
        ) : (
          <Stack alignItems="center" spacing={1}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <ImageIcon />
            </Avatar>
            <Typography variant="body2" color="text.secondary">
              Upload {type} image
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {type === 'banner' ? 'Recommended: 1200x300px' : 'Recommended: 300x300px'}
            </Typography>
          </Stack>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, maxHeight: '90vh' }
      }}
    >
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <StoreIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                {isEditMode ? t('storeManagement.editStore') : t('storeManagement.createNewStore')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {isEditMode ? t('storeManagement.subtitle') : t('storeManagement.subtitle')}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1}>
            <LanguageSwitcher />
            <DarkModeToggle />
          </Stack>
        </Stack>
      </DialogTitle>
      
      <DialogContent dividers sx={{ maxHeight: '70vh', overflow: 'auto' }}>
        <Stack spacing={4} component="form" onSubmit={handleSubmit}>
          {/* Store Images */}
          <Box>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              {t('storeManagement.storeImages')}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {t('storeManagement.storeLogo')} ({t('common.optional')})
                </Typography>
                <ImageUploadCard
                  type="logo"
                  imageUrl={formData.logo}
                  onUpload={() => logoInputRef.current?.click()}
                />
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => handleFileSelect(e, 'logo')}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {t('storeManagement.storeBanner')} ({t('common.optional')})
                </Typography>
                <ImageUploadCard
                  type="banner"
                  imageUrl={formData.banner}
                  onUpload={() => bannerInputRef.current?.click()}
                />
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => handleFileSelect(e, 'banner')}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Store Information */}
          <Box>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              {t('storeManagement.storeInformation')}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label={t('storeManagement.storeName')}
                  value={formData.name}
                  onChange={handleInputChange('name')}
                  required
                  fullWidth
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>{t('storeManagement.storeCategory')}</InputLabel>
                  <Select
                    value={formData.category}
                    label={t('storeManagement.storeCategory')}
                    onChange={handleInputChange('category')}
                  >
                    {categories.map((cat) => (
                      <MenuItem key={cat} value={cat}>
                        {t(`storeManagement.categories.${cat}`, cat)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label={t('storeManagement.storeDescription')}
                  value={formData.description}
                  onChange={handleInputChange('description')}
                  multiline
                  rows={3}
                  fullWidth
                  variant="outlined"
                  helperText={t('storeManagement.subtitle')}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Contact Information */}
          <Box>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              {t('storeManagement.contactInformation')}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label={t('storeManagement.email')}
                  type="email"
                  value={formData.contactInfo.email}
                  onChange={handleInputChange('contactInfo.email')}
                  fullWidth
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label={t('storeManagement.phone')}
                  value={formData.contactInfo.phone}
                  onChange={handleInputChange('contactInfo.phone')}
                  fullWidth
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label={t('storeManagement.website')}
                  value={formData.contactInfo.website}
                  onChange={handleInputChange('contactInfo.website')}
                  fullWidth
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Language />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>

            {/* Social Media */}
            <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ mt: 2 }}>
              {t('storeManagement.socialMedia')} ({t('common.optional')})
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label={t('storeManagement.facebook')}
                  value={formData.contactInfo.socialMedia.facebook}
                  onChange={handleInputChange('contactInfo.socialMedia')}
                  name="facebook"
                  fullWidth
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Facebook />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label={t('storeManagement.instagram')}
                  value={formData.contactInfo.socialMedia.instagram}
                  onChange={handleInputChange('contactInfo.socialMedia')}
                  name="instagram"
                  fullWidth
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Instagram />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label={t('storeManagement.twitter')}
                  value={formData.contactInfo.socialMedia.twitter}
                  onChange={handleInputChange('contactInfo.socialMedia')}
                  name="twitter"
                  fullWidth
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Twitter />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label={t('storeManagement.linkedin')}
                  value={formData.contactInfo.socialMedia.linkedin}
                  onChange={handleInputChange('contactInfo.socialMedia')}
                  name="linkedin"
                  fullWidth
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LinkedIn />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Location Information */}
          <Box>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              {t('storeManagement.locationInformation')}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label={t('storeManagement.address')}
                  value={formData.location.address}
                  onChange={handleLocationChange('address')}
                  required
                  fullWidth
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationOn />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label={t('storeManagement.city')}
                  value={formData.location.city}
                  onChange={handleLocationChange('city')}
                  required
                  fullWidth
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label={t('storeManagement.state')}
                  value={formData.location.state}
                  onChange={handleLocationChange('state')}
                  fullWidth
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>{t('storeManagement.country')}</InputLabel>
                  <Select
                    value={formData.location.country}
                    label={t('storeManagement.country')}
                    onChange={handleLocationChange('country')}
                    required
                  >
                    {countries.map((country) => (
                      <MenuItem key={country} value={country}>
                        {t(`storeManagement.countries.${country}`, country)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label={t('storeManagement.postalCode')}
                  value={formData.location.postalCode}
                  onChange={handleLocationChange('postalCode')}
                  fullWidth
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    startIcon={<MyLocation />}
                    onClick={getCurrentLocation}
                    disabled={locationLoading}
                    sx={{ flex: 1 }}
                  >
                    {locationLoading ? t('storeManagement.gettingLocation') : t('storeManagement.useCurrentLocation')}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<MapIcon />}
                    onClick={() => setShowMap(!showMap)}
                    sx={{ flex: 1 }}
                  >
                    {showMap ? t('storeManagement.hideMap') : t('storeManagement.showMap')}
                  </Button>
                </Stack>
              </Grid>
            </Grid>

            {/* Map */}
            {showMap && (
              <Paper sx={{ mt: 2, borderRadius: 2, overflow: 'hidden' }}>
                <Box sx={{ height: 300, position: 'relative' }}>
                  <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'demo-key'}>
                    <Map
                      center={mapCenter}
                      zoom={15}
                      mapId="store-location-map"
                      style={{ width: '100%', height: '100%' }}
                      onClick={handleMapClick}
                    >
                      <Marker
                        position={formData.location.coordinates}
                        title="Store Location"
                      />
                    </Map>
                  </APIProvider>
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 10,
                      left: 10,
                      bgcolor: 'white',
                      p: 1,
                      borderRadius: 1,
                      boxShadow: 1
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      {locationLoading ? t('storeManagement.gettingAddress') : t('storeManagement.clickOnMapToSetLocation')}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            )}
          </Box>

          {/* Business Hours */}
          <Box>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              {t('storeManagement.businessHours')}
            </Typography>
            <Grid container spacing={2}>
              {days.map((day) => (
                <Grid item xs={12} key={day.key}>
                  <Paper sx={{ p: 2, borderRadius: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Box sx={{ minWidth: 100 }}>
                        <Typography variant="body2" fontWeight={600}>
                          {t(`storeManagement.${day.key}`, day.label)}
                        </Typography>
                      </Box>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={!formData.businessHours[day.key]?.closed}
                            onChange={handleBusinessHoursChange(day.key, 'closed')}
                          />
                        }
                        label={t('storeManagement.open')}
                      />
                      {!formData.businessHours[day.key]?.closed && (
                        <>
                          <TextField
                            type="time"
                            value={formData.businessHours[day.key]?.open || '09:00'}
                            onChange={handleBusinessHoursChange(day.key, 'open')}
                            size="small"
                            sx={{ width: 120 }}
                          />
                          <Typography variant="body2">{t('storeManagement.to')}</Typography>
                          <TextField
                            type="time"
                            value={formData.businessHours[day.key]?.close || '18:00'}
                            onChange={handleBusinessHoursChange(day.key, 'close')}
                            size="small"
                            sx={{ width: 120 }}
                          />
                        </>
                      )}
                    </Stack>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Status (Edit Mode Only) */}
          {isEditMode && (
            <Box>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                {t('storeManagement.storeStatus')}
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      isActive: e.target.checked 
                    }))}
                  />
                }
                label={t('storeManagement.storeIsActive')}
              />
            </Box>
          )}

          {uploading && (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {t('storeManagement.uploadingImage')}
              </Typography>
              <LinearProgress />
            </Box>
          )}
          
          {message && (
            <Alert severity={message.includes('Failed') || message.includes('error') ? 'error' : 'success'}>
              {message}
            </Alert>
          )}
        </Stack>
      </DialogContent>
      
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} disabled={loading}>
          {t('storeManagement.actions.cancel')}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || uploading || !formData.name.trim() || (!isEditMode && (!formData.location.address.trim() || !formData.location.city.trim() || !formData.location.country.trim()))}
          sx={{ borderRadius: 2 }}
        >
          {loading ? (isEditMode ? t('storeManagement.actions.updating') : t('storeManagement.actions.creating')) : (isEditMode ? t('storeManagement.actions.update') : t('storeManagement.actions.create'))}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
