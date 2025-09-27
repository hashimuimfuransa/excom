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
  Alert,
  Avatar,
  Rating,
  ToggleButton,
  ToggleButtonGroup,
  Slider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  FormControlLabel,
  LinearProgress,
  Zoom,
  Fade,
  Collapse
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
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import ShareIcon from '@mui/icons-material/Share';
import StoreIcon from '@mui/icons-material/Store';
import VerifiedIcon from '@mui/icons-material/Verified';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import SecurityIcon from '@mui/icons-material/Security';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import RefreshIcon from '@mui/icons-material/Refresh';
import NextLink from 'next/link';
import { apiGet } from '@utils/api';
import ProductFilters, { Filters } from './filters';
import { getMainImage, hasRealImages } from '@utils/imageHelpers';
import { useWishlist } from '@utils/wishlist';
import { addToCart } from '@utils/cart';
import LocationComparison from '@/components/LocationComparison';
import { GamificationProvider, useGamification, calculateCreditsFromPurchase, calculateExperienceFromPurchase, getRankFromLevel } from '@/contexts/GamificationContext';
import GamificationStats from '@/components/GamificationStats';
import PurchaseCelebration from '@/components/PurchaseCelebration';

interface Product {
  _id: string;
  title: string;
  images: string[];
  price: number;
  originalPrice?: number;
  category?: string;
  description?: string;
  seller?: {
    name: string;
    _id: string;
    avatar?: string;
    rating?: number;
    reviewCount?: number;
    isVerified?: boolean;
    location?: {
      city?: string;
      province?: string;
      coordinates?: {
        lat: number;
        lng: number;
      };
    };
  };
  createdAt?: string;
  rating?: number;
  reviewCount?: number;
  location?: {
    city?: string;
    province?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  tags?: string[];
  features?: string[];
  shipping?: {
    free?: boolean;
    estimatedDays?: number;
    cost?: number;
  };
  availability?: {
    inStock?: boolean;
    quantity?: number;
  };
  discount?: {
    percentage?: number;
    validUntil?: string;
  };
}

type SortOption = 'newest' | 'price-low' | 'price-high' | 'rating' | 'popularity' | 'distance' | 'discount';
type ViewMode = 'grid' | 'list';
type FilterMode = 'all' | 'nearby' | 'verified' | 'free-shipping';

function ProductListPageContent() {
  const { t } = useTranslation();
  const [items, setItems] = useState<Product[] | null>(null);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Filters>({});
  const [open, setOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyProducts, setNearbyProducts] = useState<Product[]>([]);
  const [verifiedProducts, setVerifiedProducts] = useState<Product[]>([]);
  const [freeShippingProducts, setFreeShippingProducts] = useState<Product[]>([]);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'pending'>('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [compareList, setCompareList] = useState<string[]>([]);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({ 
    open: false, message: '', severity: 'success' 
  });
  const [locationComparisonOpen, setLocationComparisonOpen] = useState(false);
  const [selectedProductForLocation, setSelectedProductForLocation] = useState<Product | null>(null);
  const [showGamificationStats, setShowGamificationStats] = useState(false);
  const [purchaseCelebration, setPurchaseCelebration] = useState<{
    open: boolean;
    creditsEarned: number;
    experienceGained: number;
    levelUp: boolean;
    newRank?: string;
    achievementUnlocked?: any;
  }>({
    open: false,
    creditsEarned: 0,
    experienceGained: 0,
    levelUp: false
  });
  
  const itemsPerPage = 12;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isItemInWishlist } = useWishlist();
  const { earnCredits, addExperience, userStats } = useGamification();

  useEffect(() => {
    let alive = true;
    setIsLoading(true);
    
    apiGet<Product[]>("/products").then((list) => {
      if (!alive) return;
      setItems(list);
      setIsLoading(false);
    }).catch(() => {
      setItems([]);
      setIsLoading(false);
    });
    return () => { alive = false; };
  }, []);

  // Enhanced location detection with better error handling
  useEffect(() => {
    if (navigator.geolocation) {
      setLocationPermission('pending');
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setLocationPermission('granted');
          
          setSnackbar({
            open: true,
            message: t('productsPage.locationDetected'),
            severity: 'success'
          });
        },
        (error) => {
          console.log('Location access denied:', error);
          setLocationPermission('denied');
          
          // Default to Kigali, Rwanda if location access is denied
          setUserLocation({ lat: -1.9441, lng: 30.0619 });
          
          setSnackbar({
            open: true,
            message: t('productsPage.locationDefault'),
            severity: 'info'
          });
        },
        { 
          enableHighAccuracy: true, 
          timeout: 15000, 
          maximumAge: 300000 
        }
      );
    } else {
      setLocationPermission('denied');
      // Default to Kigali, Rwanda if geolocation is not supported
      setUserLocation({ lat: -1.9441, lng: 30.0619 });
    }
  }, [t]);

  // Enhanced product categorization
  useEffect(() => {
    if (items) {
      const nearby: Product[] = [];
      const verified: Product[] = [];
      const freeShipping: Product[] = [];
      
      items.forEach(product => {
        // Check if product is nearby
        const productLocation = product.location?.coordinates || product.seller?.location?.coordinates;
        if (userLocation && productLocation) {
          const distance = calculateDistance(
            userLocation.lat, userLocation.lng,
            productLocation.lat, productLocation.lng
          );
          
          if (distance <= 50) { // Within 50km
            nearby.push(product);
          }
        }
        
        // Check if seller is verified
        if (product.seller?.isVerified) {
          verified.push(product);
        }
        
        // Check if shipping is free
        if (product.shipping?.free) {
          freeShipping.push(product);
        }
      });
      
      setNearbyProducts(nearby);
      setVerifiedProducts(verified);
      setFreeShippingProducts(freeShipping);
    }
  }, [userLocation, items]);

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

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

    // Apply filter mode
    switch (filterMode) {
      case 'nearby':
        result = result.filter(p => nearbyProducts.some(nearby => nearby._id === p._id));
        break;
      case 'verified':
        result = result.filter(p => verifiedProducts.some(verified => verified._id === p._id));
        break;
      case 'free-shipping':
        result = result.filter(p => freeShippingProducts.some(free => free._id === p._id));
        break;
      case 'all':
      default:
        // No additional filtering
        break;
    }

    // Enhanced sorting with location-based priority
    result.sort((a, b) => {
      // ALWAYS prioritize nearby products first when user location is available
      if (userLocation) {
        const aIsNearby = nearbyProducts.some(nearby => nearby._id === a._id);
        const bIsNearby = nearbyProducts.some(nearby => nearby._id === b._id);
        
        if (aIsNearby && !bIsNearby) return -1;
        if (!aIsNearby && bIsNearby) return 1;
        
        // If both are nearby, sort by distance
        if (aIsNearby && bIsNearby) {
          const aLocation = a.location?.coordinates || a.seller?.location?.coordinates;
          const bLocation = b.location?.coordinates || b.seller?.location?.coordinates;
          
          if (aLocation && bLocation) {
            const aDistance = calculateDistance(userLocation.lat, userLocation.lng, aLocation.lat, aLocation.lng);
            const bDistance = calculateDistance(userLocation.lat, userLocation.lng, bLocation.lat, bLocation.lng);
            return aDistance - bDistance;
          }
        }
      }
      
      // Then apply regular sorting
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'rating':
          return (b.rating || 4.5) - (a.rating || 4.5);
        case 'popularity':
          return (b.reviewCount || 0) - (a.reviewCount || 0);
        case 'discount':
          const aDiscount = a.discount?.percentage || 0;
          const bDiscount = b.discount?.percentage || 0;
          return bDiscount - aDiscount;
        case 'distance':
          if (userLocation) {
            const aLocation = a.location?.coordinates || a.seller?.location?.coordinates;
            const bLocation = b.location?.coordinates || b.seller?.location?.coordinates;
            
            if (aLocation && bLocation) {
              const aDistance = calculateDistance(userLocation.lat, userLocation.lng, aLocation.lat, aLocation.lng);
              const bDistance = calculateDistance(userLocation.lat, userLocation.lng, bLocation.lat, bLocation.lng);
              return aDistance - bDistance;
            }
          }
          return 0;
        case 'newest':
        default:
          return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
      }
    });

    return result;
  }, [items, query, filters, sortBy, nearbyProducts, verifiedProducts, freeShippingProducts, filterMode, userLocation]);

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

  const handleAddToCart = async (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await addToCart({
        id: product._id,
        title: product.title,
        price: product.price,
        image: getMainImage(product.images, 'product', product._id),
        quantity: 1
      });
      
      // Calculate gamification rewards
      const creditsEarned = calculateCreditsFromPurchase(product.price);
      const experienceGained = calculateExperienceFromPurchase(product.price);
      
      // Earn credits and experience
      await earnCredits(creditsEarned, `Purchase: ${product.title}`);
      await addExperience(experienceGained, `Purchase: ${product.title}`);
      
      // Check for level up
      const currentLevel = userStats ? Math.floor(userStats.experience / 100) + 1 : 1;
      const newLevel = Math.floor(((userStats?.experience || 0) + experienceGained) / 100) + 1;
      const levelUp = newLevel > currentLevel;
      
      // Show celebration
      setPurchaseCelebration({
        open: true,
        creditsEarned,
        experienceGained,
        levelUp,
        newRank: levelUp ? getRankFromLevel(newLevel) : undefined
      });
      
      setSnackbar({
        open: true,
        message: t('productsPage.addToCart') + ' ✓',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: t('productsPage.addToCartError'),
        severity: 'error'
      });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getTranslatedCategory = (category?: string) => {
    if (!category) return '';
    return t(`categories.${category}`) !== `categories.${category}` ? t(`categories.${category}`) : category;
  };

  // Product comparison functions
  const toggleCompare = (productId: string) => {
    if (compareList.includes(productId)) {
      setCompareList(compareList.filter(id => id !== productId));
      setSnackbar({
        open: true,
        message: t('productsPage.removedFromCompare'),
        severity: 'info'
      });
    } else if (compareList.length < 3) {
      setCompareList([...compareList, productId]);
      setSnackbar({
        open: true,
        message: t('productsPage.addedToCompare'),
        severity: 'success'
      });
    } else {
      setSnackbar({
        open: true,
        message: t('productsPage.maxCompareReached'),
        severity: 'error'
      });
    }
  };

  const clearCompare = () => {
    setCompareList([]);
    setSnackbar({
      open: true,
      message: t('productsPage.compareCleared'),
      severity: 'info'
    });
  };

  const openLocationComparison = (product: Product) => {
    setSelectedProductForLocation(product);
    setLocationComparisonOpen(true);
  };

  const closeLocationComparison = () => {
    setLocationComparisonOpen(false);
    setSelectedProductForLocation(null);
  };

  const refreshLocation = () => {
    if (navigator.geolocation) {
      setLocationPermission('pending');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setLocationPermission('granted');
          setSnackbar({
            open: true,
            message: t('productsPage.locationUpdated'),
            severity: 'success'
          });
        },
        (error) => {
          setLocationPermission('denied');
          setSnackbar({
            open: true,
            message: t('productsPage.locationError'),
            severity: 'error'
          });
        }
      );
    }
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
          
          {/* Gamification Stats */}
          <Box sx={{ mb: 3 }}>
            <GamificationStats compact />
          </Box>
          
          {/* Modern Filter Mode Toggle */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 3,
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)'
                : 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%)',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              borderRadius: 3,
              backdropFilter: 'blur(10px)'
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="h6" fontWeight={600}>
                {t('productsPage.quickFilters')}
              </Typography>
              <IconButton
                onClick={refreshLocation}
                disabled={locationPermission === 'pending'}
                sx={{
                  bgcolor: theme.palette.mode === 'dark' 
                    ? 'rgba(124, 58, 237, 0.1)' 
                    : 'rgba(124, 58, 237, 0.05)',
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  borderRadius: 2,
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' 
                      ? 'rgba(124, 58, 237, 0.2)' 
                      : 'rgba(124, 58, 237, 0.1)',
                    transform: 'scale(1.05)',
                    boxShadow: theme.palette.mode === 'dark'
                      ? '0 4px 12px rgba(124, 58, 237, 0.2)'
                      : '0 4px 12px rgba(124, 58, 237, 0.1)'
                  },
                  '&:disabled': {
                    bgcolor: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.05)' 
                      : 'rgba(0, 0, 0, 0.05)',
                    borderColor: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.1)' 
                      : 'rgba(0, 0, 0, 0.1)'
                  }
                }}
              >
                <RefreshIcon sx={{ 
                  color: theme.palette.mode === 'dark' 
                    ? 'rgba(124, 58, 237, 0.8)' 
                    : '#7c3aed',
                  animation: locationPermission === 'pending' ? 'spin 1s linear infinite' : 'none'
                }} />
              </IconButton>
            </Stack>
            
            <ToggleButtonGroup
              value={filterMode}
              exclusive
              onChange={(_, value) => value && setFilterMode(value)}
              sx={{
                width: '100%',
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                flexWrap: 'wrap',
                gap: { xs: 1, sm: 1.5 },
                '& .MuiToggleButton-root': {
                  borderRadius: 3,
                  textTransform: 'none',
                  fontWeight: 600,
                  px: { xs: 2, sm: 2.5 },
                  py: { xs: 1.2, sm: 1.5 },
                  minHeight: { xs: 44, sm: 48 },
                  border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  bgcolor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.05)' 
                    : 'rgba(255, 255, 255, 0.8)',
                  color: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.9)' 
                    : 'rgba(0, 0, 0, 0.8)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  flex: { xs: '1 1 100%', sm: '1 1 auto' },
                  minWidth: 'fit-content',
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  '&.Mui-selected': {
                    background: theme.palette.mode === 'dark'
                      ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.9) 0%, rgba(6, 182, 212, 0.9) 100%)'
                      : 'linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)',
                    color: 'white',
                    borderColor: theme.palette.mode === 'dark'
                      ? 'rgba(124, 58, 237, 0.8)'
                      : '#7c3aed',
                    boxShadow: theme.palette.mode === 'dark'
                      ? '0 8px 25px rgba(124, 58, 237, 0.3)'
                      : '0 8px 25px rgba(124, 58, 237, 0.2)',
                    transform: 'translateY(-2px)',
                    '&:hover': {
                      background: theme.palette.mode === 'dark'
                        ? 'linear-gradient(135deg, rgba(109, 40, 217, 0.9) 0%, rgba(8, 145, 178, 0.9) 100%)'
                        : 'linear-gradient(135deg, #6d28d9 0%, #0891b2 100%)',
                      transform: 'translateY(-3px)',
                      boxShadow: theme.palette.mode === 'dark'
                        ? '0 12px 35px rgba(124, 58, 237, 0.4)'
                        : '0 12px 35px rgba(124, 58, 237, 0.3)'
                    }
                  },
                  '&:hover:not(.Mui-selected)': {
                    bgcolor: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.1)' 
                      : 'rgba(255, 255, 255, 1)',
                    borderColor: alpha(theme.palette.primary.main, 0.4),
                    transform: 'translateY(-1px)',
                    boxShadow: theme.palette.mode === 'dark'
                      ? '0 4px 15px rgba(255, 255, 255, 0.1)'
                      : '0 4px 15px rgba(0, 0, 0, 0.1)'
                  },
                  '&.Mui-disabled': {
                    bgcolor: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.02)' 
                      : 'rgba(0, 0, 0, 0.02)',
                    color: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.3)' 
                      : 'rgba(0, 0, 0, 0.3)',
                    borderColor: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.1)' 
                      : 'rgba(0, 0, 0, 0.1)'
                  }
                }
              }}
            >
              <ToggleButton value="all">
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <ShoppingBagIcon fontSize="small" sx={{ opacity: 0.8 }} />
                  <Typography variant="body2" fontWeight={600}>
                    {t('productsPage.allProducts')}
                  </Typography>
                  <Chip 
                    label={items?.length || 0} 
                    size="small" 
                    sx={{ 
                      height: 20, 
                      fontSize: '0.7rem',
                      bgcolor: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.1)' 
                        : 'rgba(0, 0, 0, 0.1)',
                      color: 'inherit'
                    }} 
                  />
                </Stack>
              </ToggleButton>
              <ToggleButton value="nearby" disabled={nearbyProducts.length === 0}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <LocationOnIcon fontSize="small" sx={{ opacity: 0.8 }} />
                  <Typography variant="body2" fontWeight={600}>
                    {t('productsPage.nearbyProducts')}
                  </Typography>
                  <Chip 
                    label={nearbyProducts.length} 
                    size="small" 
                    sx={{ 
                      height: 20, 
                      fontSize: '0.7rem',
                      bgcolor: theme.palette.mode === 'dark' 
                        ? 'rgba(16, 185, 129, 0.2)' 
                        : 'rgba(16, 185, 129, 0.1)',
                      color: theme.palette.mode === 'dark' 
                        ? '#10b981' 
                        : '#059669'
                    }} 
                  />
                </Stack>
              </ToggleButton>
              <ToggleButton value="verified" disabled={verifiedProducts.length === 0}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <VerifiedIcon fontSize="small" sx={{ opacity: 0.8 }} />
                  <Typography variant="body2" fontWeight={600}>
                    {t('productsPage.verifiedSellers')}
                  </Typography>
                  <Chip 
                    label={verifiedProducts.length} 
                    size="small" 
                    sx={{ 
                      height: 20, 
                      fontSize: '0.7rem',
                      bgcolor: theme.palette.mode === 'dark' 
                        ? 'rgba(34, 197, 94, 0.2)' 
                        : 'rgba(34, 197, 94, 0.1)',
                      color: theme.palette.mode === 'dark' 
                        ? '#22c55e' 
                        : '#16a34a'
                    }} 
                  />
                </Stack>
              </ToggleButton>
              <ToggleButton value="free-shipping" disabled={freeShippingProducts.length === 0}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <LocalShippingIcon fontSize="small" sx={{ opacity: 0.8 }} />
                  <Typography variant="body2" fontWeight={600}>
                    {t('productsPage.freeShipping')}
                  </Typography>
                  <Chip 
                    label={freeShippingProducts.length} 
                    size="small" 
                    sx={{ 
                      height: 20, 
                      fontSize: '0.7rem',
                      bgcolor: theme.palette.mode === 'dark' 
                        ? 'rgba(59, 130, 246, 0.2)' 
                        : 'rgba(59, 130, 246, 0.1)',
                      color: theme.palette.mode === 'dark' 
                        ? '#3b82f6' 
                        : '#2563eb'
                    }} 
                  />
                </Stack>
              </ToggleButton>
            </ToggleButtonGroup>
          </Paper>
          
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
              spacing={{ xs: 2, sm: 3 }}
              alignItems={{ xs: 'stretch', lg: 'center' }}
              justifyContent="space-between"
            >
              <Stack 
                direction={{ xs: 'column', sm: 'row' }} 
                spacing={{ xs: 2, sm: 2.5 }} 
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
                    <MenuItem value="discount">{t('productsPage.biggestDiscount')}</MenuItem>
                    {userLocation && <MenuItem value="distance">{t('productsPage.nearestFirst')}</MenuItem>}
                  </Select>
                </FormControl>
              </Stack>

              <Stack direction="row" spacing={1} alignItems="center">
                {/* Comparison Button */}
                {compareList.length > 0 && (
                  <>
                    <Button
                      variant="contained"
                      startIcon={<CompareArrowsIcon />}
                      onClick={() => {
                        // TODO: Implement comparison modal/page
                        setSnackbar({
                          open: true,
                          message: t('productsPage.comparingProducts', { count: compareList.length }),
                          severity: 'info'
                        });
                      }}
                      sx={{ 
                        borderRadius: 3,
                        textTransform: 'none',
                        fontWeight: 600,
                        background: 'linear-gradient(45deg, #f59e0b, #d97706)',
                        '&:hover': {
                          background: 'linear-gradient(45deg, #d97706, #b45309)'
                        }
                      }}
                    >
                      {t('productsPage.compareProducts')} ({compareList.length})
                    </Button>
                    <IconButton
                      onClick={clearCompare}
                      sx={{
                        bgcolor: alpha(theme.palette.error.main, 0.1),
                        '&:hover': {
                          bgcolor: alpha(theme.palette.error.main, 0.2)
                        }
                      }}
                    >
                      <RefreshIcon />
                    </IconButton>
                    <Divider orientation="vertical" flexItem sx={{ mx: 1, height: 24, alignSelf: 'center' }} />
                  </>
                )}
                
                <Tooltip title={t('productsPage.gridView')}>
                  <IconButton
                    onClick={() => setViewMode('grid')}
                    color={viewMode === 'grid' ? 'primary' : 'default'}
                    sx={{
                      bgcolor: viewMode === 'grid' 
                        ? alpha(theme.palette.primary.main, 0.1) 
                        : theme.palette.mode === 'dark' 
                          ? 'rgba(255, 255, 255, 0.05)' 
                          : 'transparent',
                      borderRadius: 2,
                      border: viewMode === 'grid' 
                        ? `1px solid ${alpha(theme.palette.primary.main, 0.3)}` 
                        : theme.palette.mode === 'dark' 
                          ? '1px solid rgba(255, 255, 255, 0.1)' 
                          : '1px solid transparent',
                      color: theme.palette.mode === 'dark' ? 'white' : 'inherit',
                      '&:hover': {
                        bgcolor: viewMode === 'grid' 
                          ? alpha(theme.palette.primary.main, 0.2) 
                          : theme.palette.mode === 'dark' 
                            ? 'rgba(255, 255, 255, 0.1)' 
                            : 'rgba(0, 0, 0, 0.05)',
                        transform: 'scale(1.05)'
                      }
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
                      bgcolor: viewMode === 'list' 
                        ? alpha(theme.palette.primary.main, 0.1) 
                        : theme.palette.mode === 'dark' 
                          ? 'rgba(255, 255, 255, 0.05)' 
                          : 'transparent',
                      borderRadius: 2,
                      border: viewMode === 'list' 
                        ? `1px solid ${alpha(theme.palette.primary.main, 0.3)}` 
                        : theme.palette.mode === 'dark' 
                          ? '1px solid rgba(255, 255, 255, 0.1)' 
                          : '1px solid transparent',
                      color: theme.palette.mode === 'dark' ? 'white' : 'inherit',
                      '&:hover': {
                        bgcolor: viewMode === 'list' 
                          ? alpha(theme.palette.primary.main, 0.2) 
                          : theme.palette.mode === 'dark' 
                            ? 'rgba(255, 255, 255, 0.1)' 
                            : 'rgba(0, 0, 0, 0.05)',
                        transform: 'scale(1.05)'
                      }
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
              
              {/* Nearby Products Indicator */}
              {userLocation && nearbyProducts.length > 0 && (
                <Chip 
                  icon={<LocationOnIcon fontSize="small" />}
                  label={`${nearbyProducts.length} nearby`} 
                  size="small" 
                  sx={{ 
                    fontSize: '0.7rem',
                    bgcolor: theme.palette.mode === 'dark' 
                      ? 'rgba(16, 185, 129, 0.2)' 
                      : 'rgba(16, 185, 129, 0.1)',
                    color: theme.palette.mode === 'dark' 
                      ? '#10b981' 
                      : '#059669',
                    border: `1px solid ${theme.palette.mode === 'dark' 
                      ? 'rgba(16, 185, 129, 0.3)' 
                      : 'rgba(16, 185, 129, 0.2)'}`
                  }} 
                />
              )}
              
              {/* Priority Indicator */}
              {userLocation && (
                <Chip 
                  label="Nearby products prioritized" 
                  size="small" 
                  variant="outlined"
                  sx={{ 
                    fontSize: '0.7rem',
                    borderColor: theme.palette.mode === 'dark' 
                      ? 'rgba(124, 58, 237, 0.3)' 
                      : 'rgba(124, 58, 237, 0.2)',
                    color: theme.palette.mode === 'dark' 
                      ? 'rgba(124, 58, 237, 0.8)' 
                      : '#7c3aed'
                  }} 
                />
              )}
              
              {/* Filter Mode Indicators */}
              {filterMode !== 'all' && (
                <Chip
                  label={`${t('productsPage.filteredBy')} ${t(`productsPage.${filterMode}`)}`}
                  size="small"
                  variant="filled"
                  color="primary"
                  sx={{ borderRadius: 2 }}
                />
              )}
              
              {query && (
                <Chip
                  label={`${t('productsPage.searchColon')} "${query}"`}
                  onDelete={() => setQuery('')}
                  size="small"
                  variant="filled"
                  color="secondary"
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
              
              {/* Location Status */}
              {locationPermission === 'granted' && (
                <Chip
                  icon={<LocationOnIcon />}
                  label={t('productsPage.locationActive')}
                  size="small"
                  variant="outlined"
                  color="success"
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
                const isNearby = nearbyProducts.some(nearby => nearby._id === p._id);
                const isVerified = verifiedProducts.some(verified => verified._id === p._id);
                const hasFreeShipping = freeShippingProducts.some(free => free._id === p._id);
                const productLocation = p.location?.coordinates || p.seller?.location?.coordinates;
                const distance = userLocation && productLocation ? 
                  calculateDistance(userLocation.lat, userLocation.lng, productLocation.lat, productLocation.lng) : null;
                const isInCompare = compareList.includes(p._id);
                const discountPercentage = p.discount?.percentage || 0;
                const originalPrice = p.originalPrice || p.price;

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
                      {/* Enhanced Action Buttons */}
                      <Stack
                        direction="column"
                        spacing={1}
                        sx={{
                          position: 'absolute',
                          top: 12,
                          right: 12,
                          zIndex: 3
                        }}
                      >
                        {/* Wishlist Button */}
                        <Tooltip title={isWishlisted ? t('wishlist.removeFromWishlist') : t('wishlist.addToWishlist')}>
                          <IconButton
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleWishlist(p);
                            }}
                            sx={{
                              bgcolor: theme.palette.mode === 'dark' 
                                ? 'rgba(255, 255, 255, 0.1)' 
                                : 'rgba(255, 255, 255, 0.9)',
                              backdropFilter: 'blur(10px)',
                              width: 40,
                              height: 40,
                              color: theme.palette.mode === 'dark' ? 'white' : 'inherit',
                              border: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.2)' : 'none',
                              '&:hover': {
                                bgcolor: theme.palette.mode === 'dark' 
                                  ? 'rgba(255, 255, 255, 0.2)' 
                                  : 'rgba(255, 255, 255, 1)',
                                transform: 'scale(1.1)',
                                boxShadow: theme.palette.mode === 'dark' 
                                  ? '0 4px 12px rgba(255, 255, 255, 0.1)' 
                                  : '0 4px 12px rgba(0, 0, 0, 0.1)'
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
                        
                        {/* Compare Button */}
                        <Tooltip title={isInCompare ? t('productsPage.removeFromCompare') : t('productsPage.addToCompare')}>
                          <IconButton
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleCompare(p._id);
                            }}
                            sx={{
                              bgcolor: isInCompare 
                                ? 'rgba(245, 158, 11, 0.9)' 
                                : theme.palette.mode === 'dark' 
                                  ? 'rgba(255, 255, 255, 0.1)' 
                                  : 'rgba(255, 255, 255, 0.9)',
                              backdropFilter: 'blur(10px)',
                              width: 40,
                              height: 40,
                              color: isInCompare ? 'white' : theme.palette.mode === 'dark' ? 'white' : 'inherit',
                              border: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.2)' : 'none',
                              '&:hover': {
                                bgcolor: isInCompare 
                                  ? 'rgba(217, 119, 6, 0.9)' 
                                  : theme.palette.mode === 'dark' 
                                    ? 'rgba(255, 255, 255, 0.2)' 
                                    : 'rgba(255, 255, 255, 1)',
                                transform: 'scale(1.1)',
                                boxShadow: theme.palette.mode === 'dark' 
                                  ? '0 4px 12px rgba(255, 255, 255, 0.1)' 
                                  : '0 4px 12px rgba(0, 0, 0, 0.1)'
                              }
                            }}
                            size="small"
                          >
                            <CompareArrowsIcon />
                          </IconButton>
                        </Tooltip>
                        
                        {/* Share Button */}
                        <Tooltip title={t('productsPage.shareProduct')}>
                          <IconButton
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (navigator.share) {
                                navigator.share({
                                  title: p.title,
                                  text: p.description,
                                  url: window.location.origin + `/product/${p._id}`
                                });
                              } else {
                                navigator.clipboard.writeText(window.location.origin + `/product/${p._id}`);
                                setSnackbar({
                                  open: true,
                                  message: t('productsPage.linkCopied'),
                                  severity: 'success'
                                });
                              }
                            }}
                            sx={{
                              bgcolor: theme.palette.mode === 'dark' 
                                ? 'rgba(255, 255, 255, 0.1)' 
                                : 'rgba(255, 255, 255, 0.9)',
                              backdropFilter: 'blur(10px)',
                              width: 40,
                              height: 40,
                              color: theme.palette.mode === 'dark' ? 'white' : 'inherit',
                              border: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.2)' : 'none',
                              '&:hover': {
                                bgcolor: theme.palette.mode === 'dark' 
                                  ? 'rgba(255, 255, 255, 0.2)' 
                                  : 'rgba(255, 255, 255, 1)',
                                transform: 'scale(1.1)',
                                boxShadow: theme.palette.mode === 'dark' 
                                  ? '0 4px 12px rgba(255, 255, 255, 0.1)' 
                                  : '0 4px 12px rgba(0, 0, 0, 0.1)'
                              }
                            }}
                            size="small"
                          >
                            <ShareIcon />
                          </IconButton>
                        </Tooltip>
                      </Stack>

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
                                  backgroundColor: theme.palette.mode === 'dark' 
                                    ? 'rgba(255, 255, 255, 0.9)' 
                                    : 'rgba(0,0,0,0.7)',
                                  color: theme.palette.mode === 'dark' 
                                    ? 'rgba(0, 0, 0, 0.8)' 
                                    : 'white',
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
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 1
                              }}
                            >
                              {/* Price Badge */}
                              <Box
                                sx={{
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
                                {discountPercentage > 0 && (
                                  <Typography component="span" sx={{ fontSize: '0.7rem', ml: 0.5, textDecoration: 'line-through', opacity: 0.8 }}>
                                    ${originalPrice.toFixed(2)}
                                  </Typography>
                                )}
                              </Box>
                              
                              {/* Discount Badge */}
                              {discountPercentage > 0 && (
                                <Box
                                  sx={{
                                    bgcolor: 'error.main',
                                    color: 'white',
                                    px: 1,
                                    py: 0.3,
                                    borderRadius: 1.5,
                                    fontSize: '0.7rem',
                                    fontWeight: 600,
                                    textAlign: 'center'
                                  }}
                                >
                                  -{discountPercentage}%
                                </Box>
                              )}
                            </Box>
                            
                            {/* Enhanced Status Badges */}
                            <Stack
                              direction="column"
                              spacing={1}
                              sx={{
                                position: 'absolute',
                                bottom: 8,
                                left: 8,
                                zIndex: 2
                              }}
                            >
                              {/* Location Badge */}
                              {isNearby && distance && (
                                <Box
                                  sx={{
                                    bgcolor: 'rgba(16, 185, 129, 0.9)',
                                    color: 'white',
                                    px: 1.5,
                                    py: 0.5,
                                    borderRadius: 2,
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                    backdropFilter: 'blur(10px)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5
                                  }}
                                >
                                  <LocationOnIcon fontSize="small" />
                                  {distance.toFixed(1)}km
                                </Box>
                              )}
                              
                              {/* Verified Seller Badge */}
                              {isVerified && (
                                <Box
                                  sx={{
                                    bgcolor: 'rgba(34, 197, 94, 0.9)',
                                    color: 'white',
                                    px: 1.5,
                                    py: 0.5,
                                    borderRadius: 2,
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                    backdropFilter: 'blur(10px)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5
                                  }}
                                >
                                  <VerifiedIcon fontSize="small" />
                                  {t('productsPage.verified')}
                                </Box>
                              )}
                              
                              {/* Free Shipping Badge */}
                              {hasFreeShipping && (
                                <Box
                                  sx={{
                                    bgcolor: 'rgba(59, 130, 246, 0.9)',
                                    color: 'white',
                                    px: 1.5,
                                    py: 0.5,
                                    borderRadius: 2,
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                    backdropFilter: 'blur(10px)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5
                                  }}
                                >
                                  <LocalShippingIcon fontSize="small" />
                                  {t('productsPage.freeShipping')}
                                </Box>
                              )}
                            </Stack>
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
                              
                              {/* Seller Information */}
                              {p.seller && (
                                <Stack direction="row" alignItems="center" spacing={1}>
                                  <Avatar
                                    src={p.seller.avatar}
                                    sx={{ width: 20, height: 20 }}
                                  >
                                    <StoreIcon fontSize="small" />
                                  </Avatar>
                                  <Typography variant="caption" color="text.secondary">
                                    {p.seller.name}
                                  </Typography>
                                  {p.seller.isVerified && (
                                    <VerifiedIcon sx={{ fontSize: 14, color: 'success.main' }} />
                                  )}
                                </Stack>
                              )}
                              
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
                              
                              {/* Location Button */}
                              {(p.location?.coordinates || p.seller?.location?.coordinates) && (
                                <Button
                                  variant="outlined"
                                  startIcon={<LocationOnIcon />}
                                  size="small"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    openLocationComparison(p);
                                  }}
                                  sx={{
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    borderColor: theme.palette.mode === 'dark' 
                                      ? 'rgba(255, 255, 255, 0.3)' 
                                      : 'rgba(0, 0, 0, 0.2)',
                                    color: theme.palette.mode === 'dark' ? 'white' : 'inherit',
                                    '&:hover': {
                                      borderColor: 'primary.main',
                                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                      transform: 'translateY(-1px)'
                                    }
                                  }}
                                >
                                  {t('productsPage.viewLocation')}
                                </Button>
                              )}
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
                                  backgroundColor: theme.palette.mode === 'dark' 
                                    ? 'rgba(255, 255, 255, 0.9)' 
                                    : 'rgba(0,0,0,0.7)',
                                  color: theme.palette.mode === 'dark' 
                                    ? 'rgba(0, 0, 0, 0.8)' 
                                    : 'white',
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
                                {p.description || t('productsPage.defaultDescription')}
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
                  maxWidth: 500,
                  bgcolor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.02)' 
                    : 'rgba(0, 0, 0, 0.02)'
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

      {/* Location Comparison Dialog */}
      {selectedProductForLocation && (
        <LocationComparison
          userLocation={userLocation}
          store={{
            _id: selectedProductForLocation._id,
            name: selectedProductForLocation.seller?.name || 'Store',
            location: {
              lat: selectedProductForLocation.location?.coordinates?.lat || selectedProductForLocation.seller?.location?.coordinates?.lat || 0,
              lng: selectedProductForLocation.location?.coordinates?.lng || selectedProductForLocation.seller?.location?.coordinates?.lng || 0,
              address: selectedProductForLocation.location?.address || selectedProductForLocation.seller?.location?.address,
              city: selectedProductForLocation.location?.city || selectedProductForLocation.seller?.location?.city,
              state: selectedProductForLocation.location?.province || selectedProductForLocation.seller?.location?.province,
              country: selectedProductForLocation.location?.country || selectedProductForLocation.seller?.location?.country
            },
            businessHours: selectedProductForLocation.seller?.businessHours,
            contactInfo: {
              phone: selectedProductForLocation.seller?.phone,
              website: selectedProductForLocation.seller?.website
            }
          }}
          productTitle={selectedProductForLocation.title}
          open={locationComparisonOpen}
          onClose={closeLocationComparison}
        />
      )}
      
      {/* Purchase Celebration */}
      <PurchaseCelebration
        open={purchaseCelebration.open}
        onClose={() => setPurchaseCelebration({ ...purchaseCelebration, open: false })}
        creditsEarned={purchaseCelebration.creditsEarned}
        experienceGained={purchaseCelebration.experienceGained}
        levelUp={purchaseCelebration.levelUp}
        newRank={purchaseCelebration.newRank}
        achievementUnlocked={purchaseCelebration.achievementUnlocked}
      />
    </>
  );
}

export default function ProductListPage() {
  return (
    <GamificationProvider>
      <ProductListPageContent />
    </GamificationProvider>
  );
}