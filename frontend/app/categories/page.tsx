"use client";
import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Box,
  Stack,
  Paper,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Button,
  InputAdornment,
  IconButton,
  Slider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  FormControlLabel,
  Rating,
  Breadcrumbs,
  Link as MLink,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Badge,
  Tooltip,
  Divider,
  Alert,
  CircularProgress,
  Switch,
  RadioGroup,
  Radio,
  Autocomplete,
  ToggleButton,
  ToggleButtonGroup,
  CardActionArea,
  CardActions,
  alpha,
  useTheme
} from '@mui/material';
import {
  Search as SearchIcon,
  GridView as GridViewIcon,
  ViewList as ListViewIcon,
  ExpandMore as ExpandMoreIcon,
  Star as StarIcon,
  ShoppingCart as ShoppingCartIcon,
  Category as CategoryIcon,
  LocationOn as LocationIcon,
  MyLocation as MyLocationIcon,
  Map as MapIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Compare as CompareIcon,
  Share as ShareIcon,
  TrendingUp as TrendingIcon,
  Discount as DiscountIcon,
  Timer as TimerIcon,
  Store as StoreIcon,
  Directions as DirectionsIcon,
  PhoneAndroid as PhoneIcon,
  MusicNote as MusicIcon,
  Computer as ComputerIcon,
  ViewModule as ViewModuleIcon,
  Clear as ClearIcon,
  Close as CloseIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';
import { APIProvider, Map, Marker, InfoWindow } from '@vis.gl/react-google-maps';
import { apiGet } from '@utils/api';
import NextLink from 'next/link';

interface Product {
  _id: string;
  title: string;
  description: string;
  images: string[];
  price: number;
  currency: string;
  category: string;
  seller: string;
  store?: {
    _id: string;
    name: string;
    location?: {
      address: string;
      city: string;
      state?: string;
      country: string;
      coordinates: {
        lat: number;
        lng: number;
      };
    };
    businessHours?: {
      [key: string]: { open: string; close: string; closed?: boolean };
    };
    contactInfo?: {
      phone?: string;
      website?: string;
    };
  };
  createdAt?: string;
  variants?: {
    sizes?: string[];
    colors?: string[];
    brand?: string;
    material?: string;
    weight?: {
      value: number;
      unit: string;
    };
    dimensions?: {
      length: number;
      width: number;
      height: number;
      unit: string;
    };
    inventory?: number;
  };
  rating?: number;
  reviewCount?: number;
  isOnSale?: boolean;
  discountPercent?: number;
  isNew?: boolean;
  isFeatured?: boolean;
  isVerified?: boolean;
  shippingInfo?: {
    freeShipping?: boolean;
    estimatedDays?: number;
    shippingCost?: number;
  };
  tags?: string[];
  specifications?: {
    [key: string]: string;
  };
}

interface FilterState {
  priceRange: [number, number];
  categories: string[];
  brands: string[];
  colors: string[];
  sizes: string[];
  materials: string[];
  ratings: number[];
  features: string[];
  availability: string[];
  shipping: string[];
  location: {
    enabled: boolean;
    radius: number;
    userLocation: { lat: number; lng: number } | null;
  };
  sortBy: string;
  viewMode: 'grid' | 'list' | 'compact';
  showMap: boolean;
  compareMode: boolean;
  wishlistMode: boolean;
}

interface ProductsResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const categories = [
  { value: 'all', label: 'All Categories', icon: <CategoryIcon />, color: '#666' },
  { value: 'electronics', label: 'Electronics', icon: <ComputerIcon />, color: '#2196F3' },
  { value: 'fashion', label: 'Fashion', icon: <StarIcon />, color: '#E91E63' },
  { value: 'home', label: 'Home & Garden', icon: <StarIcon />, color: '#4CAF50' },
  { value: 'sports', label: 'Sports & Outdoors', icon: <StarIcon />, color: '#FF9800' },
  { value: 'books', label: 'Books & Media', icon: <StarIcon />, color: '#795548' },
  { value: 'toys', label: 'Toys & Games', icon: <StarIcon />, color: '#F44336' },
  { value: 'automotive', label: 'Automotive', icon: <StarIcon />, color: '#607D8B' },
  { value: 'beauty', label: 'Health & Beauty', icon: <StarIcon />, color: '#E91E63' },
  { value: 'food', label: 'Food & Beverages', icon: <StarIcon />, color: '#8BC34A' },
  { value: 'arts', label: 'Arts & Crafts', icon: <StarIcon />, color: '#9C27B0' },
  { value: 'mobile', label: 'Mobile & Tech', icon: <PhoneIcon />, color: '#FF5722' },
  { value: 'gaming', label: 'Gaming', icon: <StarIcon />, color: '#9C27B0' },
  { value: 'audio', label: 'Music & Audio', icon: <MusicIcon />, color: '#9C27B0' },
  { value: 'computers', label: 'Computers', icon: <ComputerIcon />, color: '#607D8B' },
  { value: 'kitchen', label: 'Kitchen & Dining', icon: <StarIcon />, color: '#FF5722' },
  { value: 'pets', label: 'Pets & Animals', icon: <StarIcon />, color: '#8BC34A' },
  { value: 'health', label: 'Health & Wellness', icon: <StarIcon />, color: '#00BCD4' },
  { value: 'travel', label: 'Travel & Luggage', icon: <StarIcon />, color: '#3F51B5' },
  { value: 'office', label: 'Office Supplies', icon: <StarIcon />, color: '#607D8B' },
  { value: 'jewelry', label: 'Jewelry & Watches', icon: <StarIcon />, color: '#FFD700' },
  { value: 'baby', label: 'Baby & Kids', icon: <StarIcon />, color: '#FF69B4' },
  { value: 'tools', label: 'Tools & Hardware', icon: <StarIcon />, color: '#8B4513' },
  { value: 'other', label: 'Other', icon: <StarIcon />, color: '#666' }
];

const sortOptions = [
  { value: 'newest', label: 'Newest First', icon: <TimerIcon /> },
  { value: 'price-low', label: 'Price: Low to High', icon: <TrendingIcon /> },
  { value: 'price-high', label: 'Price: High to Low', icon: <TrendingIcon /> },
  { value: 'rating', label: 'Highest Rated', icon: <StarIcon /> },
  { value: 'popular', label: 'Most Popular', icon: <TrendingIcon /> },
  { value: 'discount', label: 'Best Deals', icon: <DiscountIcon /> },
  { value: 'distance', label: 'Nearest First', icon: <LocationIcon /> },
  { value: 'relevance', label: 'Most Relevant', icon: <SearchIcon /> }
];

const brands = [
  'Apple', 'Samsung', 'Sony', 'LG', 'Microsoft', 'Google', 'Amazon', 'Nike', 'Adidas', 
  'Puma', 'Under Armour', 'Dell', 'HP', 'Lenovo', 'Asus', 'Acer', 'Canon', 'Nikon',
  'Bose', 'JBL', 'Beats', 'Philips', 'Panasonic', 'Toshiba', 'Intel', 'AMD', 'NVIDIA'
];

const colors = [
  'Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Purple', 'Pink',
  'Brown', 'Gray', 'Silver', 'Gold', 'Rose Gold', 'Space Gray', 'Midnight', 'Starlight'
];

const sizes = [
  'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '32', '34', '36', '38', '40', '42', '44', '46', '48',
  'Small', 'Medium', 'Large', 'Extra Large', 'One Size'
];

const materials = [
  'Cotton', 'Polyester', 'Leather', 'Denim', 'Silk', 'Wool', 'Linen', 'Nylon', 'Spandex',
  'Metal', 'Plastic', 'Wood', 'Glass', 'Ceramic', 'Rubber', 'Carbon Fiber', 'Aluminum', 'Steel'
];

const features = [
  'Wireless', 'Bluetooth', 'Waterproof', 'Shockproof', 'Energy Efficient', 'Eco-Friendly',
  'Smart', 'Touch Screen', 'Voice Control', 'AI Powered', 'Fast Charging', 'Long Battery Life',
  'High Resolution', '4K', 'HD', 'Noise Cancelling', 'Stereo', 'Surround Sound'
];

const availabilityOptions = [
  'In Stock', 'Low Stock', 'Pre-order', 'Backorder', 'Discontinued'
];

const shippingOptions = [
  'Free Shipping', 'Same Day Delivery', 'Next Day Delivery', '2-Day Delivery', 'Standard Shipping'
];

export default function CategoriesPage() {
  const theme = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  });
  
  // Comprehensive filter state
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 2000],
    categories: ['all'],
    brands: [],
    colors: [],
    sizes: [],
    materials: [],
    ratings: [],
    features: [],
    availability: [],
    shipping: [],
    location: {
      enabled: false,
      radius: 25,
      userLocation: null
    },
    sortBy: 'newest',
    viewMode: 'grid',
    showMap: false,
    compareMode: false,
    wishlistMode: false
  });

  // UI State
  const [showFilters, setShowFilters] = useState(false);
  const [showMapDialog, setShowMapDialog] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [compareList, setCompareList] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [mapCenter, setMapCenter] = useState({ lat: 40.7128, lng: -74.0060 });
  const [mapZoom, setMapZoom] = useState(10);

  // Get user location
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setFilters(prev => ({
            ...prev,
            location: {
              ...prev.location,
              userLocation: location,
              enabled: true
            }
          }));
          setMapCenter(location);
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '24'
      });
      
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      
      // Add category filters
      if (filters.categories.length > 0 && !filters.categories.includes('all')) {
        params.append('categories', filters.categories.join(','));
      }
      
      // Add price range
      params.append('minPrice', filters.priceRange[0].toString());
      params.append('maxPrice', filters.priceRange[1].toString());
      
      // Add location filters if enabled
      if (filters.location.enabled && filters.location.userLocation) {
        params.append('lat', filters.location.userLocation.lat.toString());
        params.append('lng', filters.location.userLocation.lng.toString());
        params.append('radius', filters.location.radius.toString());
      }
      
      const response = await apiGet<{ products: Product[], pagination: any }>(`/products?${params}&populate=store`);
      
      // Enhance product data with additional UI properties
      const enhancedProducts = (response?.products || []).map(product => {
        // Debug: Log store information to verify real data
        if (product.store) {
          console.log('Product:', product.title, 'Store:', product.store.name, 'Location:', product.store.location);
        }
        
        return {
          ...product,
          rating: Math.random() * 2 + 3, // 3-5 stars
          reviewCount: Math.floor(Math.random() * 500) + 10,
          isOnSale: Math.random() > 0.7,
          discountPercent: Math.random() > 0.7 ? Math.floor(Math.random() * 50) + 10 : 0,
          isNew: Math.random() > 0.8,
          isFeatured: Math.random() > 0.9,
          isVerified: Math.random() > 0.6,
          shippingInfo: {
            freeShipping: Math.random() > 0.5,
            estimatedDays: Math.floor(Math.random() * 7) + 1,
            shippingCost: Math.random() > 0.5 ? 0 : Math.floor(Math.random() * 20) + 5
          },
          tags: ['popular', 'trending', 'bestseller'].filter(() => Math.random() > 0.7),
          variants: {
            sizes: ['S', 'M', 'L', 'XL'].filter(() => Math.random() > 0.5),
            colors: ['Black', 'White', 'Red', 'Blue'].filter(() => Math.random() > 0.5),
            brand: brands[Math.floor(Math.random() * brands.length)],
            material: materials[Math.floor(Math.random() * materials.length)],
            inventory: Math.floor(Math.random() * 100) + 1
          }
          // Store data is already populated from the API call
        };
      });
      
      setProducts(enhancedProducts);
      setPagination(response?.pagination || {
        page,
        limit: 24,
        total: enhancedProducts.length,
        pages: Math.ceil(enhancedProducts.length / 24)
      });
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [page, filters.categories, filters.priceRange, filters.location.enabled]);

  // Comprehensive filtering logic
  const applyFilters = (products: Product[]): Product[] => {
    return products.filter(product => {
      // Price filter
      const priceMatch = product.price >= filters.priceRange[0] && product.price <= filters.priceRange[1];
      
      // Category filter
      const categoryMatch = filters.categories.includes('all') || 
        filters.categories.some(cat => 
          product.category.toLowerCase().includes(cat.toLowerCase())
        );
      
      // Brand filter
      const brandMatch = filters.brands.length === 0 || 
        filters.brands.some(brand => 
          product.variants?.brand?.toLowerCase().includes(brand.toLowerCase())
        );
      
      // Color filter
      const colorMatch = filters.colors.length === 0 || 
        filters.colors.some(color => 
          product.variants?.colors?.some(c => 
            c.toLowerCase().includes(color.toLowerCase())
          )
        );
      
      // Size filter
      const sizeMatch = filters.sizes.length === 0 || 
        filters.sizes.some(size => 
          product.variants?.sizes?.some(s => 
            s.toLowerCase().includes(size.toLowerCase())
          )
        );
      
      // Material filter
      const materialMatch = filters.materials.length === 0 || 
        filters.materials.some(material => 
          product.variants?.material?.toLowerCase().includes(material.toLowerCase())
        );
      
      // Rating filter
      const ratingMatch = filters.ratings.length === 0 || 
        filters.ratings.some(rating => 
          product.rating && product.rating >= rating
        );
      
      // Feature filter
      const featureMatch = filters.features.length === 0 || 
        filters.features.some(feature => 
          product.tags?.some(tag => 
            tag.toLowerCase().includes(feature.toLowerCase())
          )
        );
      
      // Availability filter
      const availabilityMatch = filters.availability.length === 0 || 
        filters.availability.some(availability => {
          switch (availability) {
            case 'In Stock':
              return (product.variants?.inventory || 0) > 10;
            case 'Low Stock':
              return (product.variants?.inventory || 0) <= 10 && (product.variants?.inventory || 0) > 0;
            case 'Pre-order':
              return product.tags?.includes('preorder');
            case 'Backorder':
              return product.tags?.includes('backorder');
            case 'Discontinued':
              return product.tags?.includes('discontinued');
            default:
              return true;
          }
        });
      
      // Shipping filter
      const shippingMatch = filters.shipping.length === 0 || 
        filters.shipping.some(shipping => {
          switch (shipping) {
            case 'Free Shipping':
              return product.shippingInfo?.freeShipping;
            case 'Same Day Delivery':
              return product.shippingInfo?.estimatedDays === 1;
            case 'Next Day Delivery':
              return product.shippingInfo?.estimatedDays === 2;
            case '2-Day Delivery':
              return product.shippingInfo?.estimatedDays === 3;
            case 'Standard Shipping':
              return (product.shippingInfo?.estimatedDays || 0) > 3;
            default:
              return true;
          }
        });
      
      // Location filter
      let locationMatch = true;
      if (filters.location.enabled && filters.location.userLocation && product.store?.location?.coordinates) {
        const distance = calculateDistance(
          filters.location.userLocation.lat,
          filters.location.userLocation.lng,
          product.store.location.coordinates.lat,
          product.store.location.coordinates.lng
        );
        locationMatch = distance <= filters.location.radius;
      }
      
      return priceMatch && categoryMatch && brandMatch && colorMatch && 
             sizeMatch && materialMatch && ratingMatch && featureMatch && 
             availabilityMatch && shippingMatch && locationMatch;
    });
  };

  // Calculate distance between two coordinates
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
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

  // Sorting logic
  const sortProducts = (products: Product[]): Product[] => {
    return [...products].sort((a, b) => {
      switch (filters.sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'popular':
          return (b.reviewCount || 0) - (a.reviewCount || 0);
        case 'discount':
          return (b.discountPercent || 0) - (a.discountPercent || 0);
        case 'distance':
          if (filters.location.enabled && filters.location.userLocation) {
            const distanceA = a.store?.location?.coordinates ? 
              calculateDistance(
                filters.location.userLocation.lat,
                filters.location.userLocation.lng,
                a.store.location.coordinates.lat,
                a.store.location.coordinates.lng
              ) : Infinity;
            const distanceB = b.store?.location?.coordinates ? 
              calculateDistance(
                filters.location.userLocation.lat,
                filters.location.userLocation.lng,
                b.store.location.coordinates.lat,
                b.store.location.coordinates.lng
              ) : Infinity;
            return distanceA - distanceB;
          }
          return 0;
      case 'newest':
      default:
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
    });
  };

  const filteredProducts = applyFilters(products);
  const sortedProducts = sortProducts(filteredProducts);

  // Enhanced Product Card Component
  const ProductCard = ({ product, isListView = false, isCompact = false }: { 
    product: Product; 
    isListView?: boolean; 
    isCompact?: boolean;
  }) => {
    const isWishlisted = wishlist.includes(product._id);
    const isInCompare = compareList.includes(product._id);
    const isSelected = selectedProducts.includes(product._id);
    
    const handleWishlistToggle = (e: React.MouseEvent) => {
      e.stopPropagation();
      setWishlist(prev => 
        prev.includes(product._id) 
          ? prev.filter(id => id !== product._id)
          : [...prev, product._id]
      );
    };

    const handleCompareToggle = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (compareList.length >= 4 && !isInCompare) {
        alert('You can compare up to 4 products at once');
        return;
      }
      setCompareList(prev => 
        prev.includes(product._id) 
          ? prev.filter(id => id !== product._id)
          : [...prev, product._id]
      );
    };

    const handleAddToCart = (e: React.MouseEvent) => {
      e.stopPropagation();
      // Add to cart logic here
      console.log('Added to cart:', product._id);
    };

    const handleShare = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (navigator.share) {
        navigator.share({
          title: product.title,
          text: product.description,
          url: window.location.origin + `/product/${product._id}`
        });
      } else {
        navigator.clipboard.writeText(window.location.origin + `/product/${product._id}`);
      }
    };

    const getDiscountPrice = () => {
      if (product.isOnSale && product.discountPercent) {
        return product.price * (1 - product.discountPercent / 100);
      }
      return product.price;
    };

    if (isCompact) {
      return (
        <Card 
          sx={{ 
            height: '100%',
            borderRadius: 0,
            border: '1px solid',
            borderColor: isSelected ? 'primary.main' : alpha(theme.palette.divider, 0.1),
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'pointer',
            position: 'relative',
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.6) 100%)',
            backdropFilter: 'blur(10px)',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, transparent 50%)'
                : 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, transparent 50%)',
              opacity: 0,
              transition: 'opacity 0.3s ease',
              pointerEvents: 'none'
            },
            '&:hover': {
              transform: 'translateY(-4px) scale(1.02)',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 12px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(59, 130, 246, 0.3)'
                : '0 12px 24px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(59, 130, 246, 0.2)',
              borderColor: 'primary.main',
              '&::before': {
                opacity: 1
              }
            }
          }}
          onClick={() => window.open(`/product/${product._id}`, '_blank')}
        >
          <CardActionArea>
            <Stack direction="row" sx={{ height: { xs: 80, sm: 100, md: 120 } }}>
              <CardMedia
                component="img"
                sx={{ width: { xs: 80, sm: 100, md: 120 }, flexShrink: 0 }}
                image={product.images[0] || '/api/placeholder/120/120'}
                alt={product.title}
              />
              <CardContent sx={{ flex: 1, p: { xs: 1, sm: 1.5, md: 2 } }}>
                <Stack spacing={1} height="100%">
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600} sx={{ 
                      fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' },
                      lineHeight: 1.2,
                      mb: { xs: 0.5, sm: 1 }
                    }}>
                      {product.title}
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="h6" color="primary.main" fontWeight={700} sx={{
                        fontSize: { xs: '0.8rem', sm: '1rem', md: '1.25rem' }
                      }}>
                        ${getDiscountPrice().toFixed(2)}
                      </Typography>
                      {product.isOnSale && (
                        <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                          ${product.price.toFixed(2)}
                        </Typography>
                      )}
                    </Stack>
                    {/* Store info with distance for compact view */}
                    {product.store && (
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
                        <StoreIcon fontSize="small" color="action" sx={{ fontSize: '0.75rem' }} />
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {product.store.name}
                        </Typography>
                        {filters.location.enabled && filters.location.userLocation && product.store.location?.coordinates && (
                          <Chip 
                            label={`${calculateDistance(
                              filters.location.userLocation.lat,
                              filters.location.userLocation.lng,
                              product.store.location.coordinates.lat,
                              product.store.location.coordinates.lng
                            ).toFixed(1)} km`}
                            size="small" 
                            variant="filled"
                            sx={{
                              bgcolor: theme.palette.mode === 'dark' 
                                ? 'rgba(59, 130, 246, 0.2)' 
                                : 'rgba(59, 130, 246, 0.1)',
                              color: 'primary.main',
                              fontWeight: 600,
                              fontSize: '0.65rem',
                              height: '18px'
                            }}
                          />
                        )}
                      </Stack>
                    )}
                  </Box>
                  <Box sx={{ mt: 'auto' }}>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={handleAddToCart}
                      sx={{ 
                        borderRadius: 0,
                        fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' },
                        py: { xs: 0.25, sm: 0.5, md: 1 },
                        px: { xs: 0.75, sm: 1, md: 2 },
                        minHeight: { xs: 24, sm: 28, md: 32 }
                      }}
                    >
                      Add to Cart
                    </Button>
                  </Box>
                </Stack>
              </CardContent>
            </Stack>
          </CardActionArea>
          
          {/* Action buttons */}
          <Stack direction="row" spacing={1} sx={{ position: 'absolute', top: 8, right: 8 }}>
            <IconButton
              size="small"
              onClick={handleWishlistToggle}
              sx={{ 
                bgcolor: 'background.paper',
                '&:hover': { bgcolor: 'background.paper' }
              }}
            >
              {isWishlisted ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
            </IconButton>
          </Stack>
        </Card>
      );
    }

    if (isListView) {
      return (
        <Card 
          sx={{ 
            height: '100%',
            borderRadius: 0,
            border: '1px solid',
            borderColor: isSelected ? 'primary.main' : alpha(theme.palette.divider, 0.1),
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'pointer',
            position: 'relative',
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.6) 100%)',
            backdropFilter: 'blur(10px)',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, transparent 50%)'
                : 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, transparent 50%)',
              opacity: 0,
              transition: 'opacity 0.3s ease',
              pointerEvents: 'none'
            },
            '&:hover': {
              transform: 'translateY(-6px) scale(1.01)',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 16px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(59, 130, 246, 0.3)'
                : '0 16px 32px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(59, 130, 246, 0.2)',
              borderColor: 'primary.main',
              '&::before': {
                opacity: 1
              }
            }
          }}
          onClick={() => window.open(`/product/${product._id}`, '_blank')}
        >
          <CardActionArea>
            <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ height: { xs: 'auto', sm: 160, md: 200 } }}>
              <CardMedia
                component="img"
                sx={{ 
                  width: { xs: '100%', sm: 160, md: 200 }, 
                  height: { xs: 120, sm: 160, md: 200 },
                  flexShrink: 0 
                }}
                image={product.images[0] || '/api/placeholder/200/200'}
                alt={product.title}
              />
              <CardContent sx={{ flex: 1, p: { xs: 1.5, sm: 2, md: 3 } }}>
                <Stack spacing={{ xs: 1, sm: 1.5, md: 2 }} height="100%">
              <Box>
                    {/* Badges */}
                    <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                      {product.isNew && (
                        <Chip label="NEW" size="small" color="success" variant="filled" />
                      )}
                      {product.isOnSale && (
                        <Chip label={`${product.discountPercent}% OFF`} size="small" color="error" variant="filled" />
                      )}
                      {product.isFeatured && (
                        <Chip label="FEATURED" size="small" color="primary" variant="filled" />
                      )}
                      {product.isVerified && (
                        <Chip label="VERIFIED" size="small" color="info" variant="filled" />
                      )}
                    </Stack>
                    
                <Typography variant="h6" fontWeight={600} gutterBottom sx={{
                  fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' },
                  lineHeight: 1.3
                }}>
                  {product.title}
                </Typography>
                    
                    {/* Rating */}
                    {product.rating && (
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                        <Rating value={product.rating} readOnly size="small" />
                        <Typography variant="body2" color="text.secondary">
                          ({product.reviewCount})
                        </Typography>
                      </Stack>
                    )}
                    
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {product.description}
                </Typography>
                    
                {/* Store info with distance */}
                {product.store && (
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
                    <StoreIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {product.store.name}
                    </Typography>
                    {product.store.location && (
                      <Chip 
                        label={product.store.location.city} 
                        size="small" 
                        variant="outlined"
                        icon={<LocationIcon />}
                      />
                    )}
                    {filters.location.enabled && filters.location.userLocation && product.store.location?.coordinates && (
                      <Chip 
                        label={`${calculateDistance(
                          filters.location.userLocation.lat,
                          filters.location.userLocation.lng,
                          product.store.location.coordinates.lat,
                          product.store.location.coordinates.lng
                        ).toFixed(1)} km`}
                        size="small" 
                        variant="filled"
                        sx={{
                          bgcolor: theme.palette.mode === 'dark' 
                            ? 'rgba(59, 130, 246, 0.2)' 
                            : 'rgba(59, 130, 246, 0.1)',
                          color: 'primary.main',
                          fontWeight: 600,
                          fontSize: '0.7rem'
                        }}
                      />
                    )}
                  </Stack>
                )}
              </Box>
                  
              <Box sx={{ mt: 'auto' }}>
                    <Stack direction="row" alignItems="center" spacing={{ xs: 1, sm: 2 }} sx={{ mb: { xs: 1, sm: 2 } }}>
                      <Typography variant="h6" fontWeight={700} sx={{
                        fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' }
                      }}>
                        ${getDiscountPrice().toFixed(2)} {product.currency}
                      </Typography>
                      {product.isOnSale && (
                        <Typography variant="body2" color="text.secondary" sx={{ 
                          textDecoration: 'line-through',
                          fontSize: { xs: '0.7rem', sm: '0.875rem' }
                        }}>
                          ${product.price.toFixed(2)}
                        </Typography>
                      )}
                    </Stack>
                    
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0.75, sm: 1, md: 2 }}>
                      <Button
                        variant="contained"
                        startIcon={<ShoppingCartIcon />}
                        onClick={handleAddToCart}
                        sx={{ 
                          borderRadius: 0,
                          fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' },
                          py: { xs: 0.5, sm: 0.75, md: 1 },
                          px: { xs: 1, sm: 1.5, md: 2 }
                        }}
                      >
                        Add to Cart
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<CompareIcon />}
                        onClick={handleCompareToggle}
                        color={isInCompare ? 'primary' : 'inherit'}
                        sx={{ 
                          borderRadius: 0,
                          fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' },
                          py: { xs: 0.5, sm: 0.75, md: 1 },
                          px: { xs: 1, sm: 1.5, md: 2 }
                        }}
                      >
                        Compare
                      </Button>
                    </Stack>
              </Box>
            </Stack>
          </CardContent>
        </Stack>
          </CardActionArea>
          
          {/* Action buttons */}
          <Stack direction="row" spacing={1} sx={{ position: 'absolute', top: 8, right: 8 }}>
            <IconButton
              size="small"
              onClick={handleWishlistToggle}
              sx={{ 
                bgcolor: 'background.paper',
                '&:hover': { bgcolor: 'background.paper' }
              }}
            >
              {isWishlisted ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
            </IconButton>
            <IconButton
              size="small"
              onClick={handleShare}
              sx={{ 
                bgcolor: 'background.paper',
                '&:hover': { bgcolor: 'background.paper' }
              }}
            >
              <ShareIcon />
            </IconButton>
          </Stack>
        </Card>
      );
    }

    // Enhanced Grid view (default)
    return (
      <Card 
        sx={{ 
          height: '100%',
          borderRadius: 0,
          border: '1px solid',
          borderColor: isSelected ? 'primary.main' : alpha(theme.palette.divider, 0.1),
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.6) 100%)',
          backdropFilter: 'blur(10px)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, transparent 50%)'
              : 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, transparent 50%)',
            opacity: 0,
            transition: 'opacity 0.3s ease',
            pointerEvents: 'none'
          },
          '&:hover': {
            transform: 'translateY(-8px) scale(1.02)',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(59, 130, 246, 0.3)'
              : '0 20px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(59, 130, 246, 0.2)',
            borderColor: 'primary.main',
            '&::before': {
              opacity: 1
            },
            '& .product-image': {
              transform: 'scale(1.1)'
            },
            '& .action-buttons': {
              opacity: 1,
              transform: 'translateY(0)'
            }
          }
        }}
        onClick={() => window.open(`/product/${product._id}`, '_blank')}
      >
        <CardActionArea>
          {/* Enhanced Image with badges */}
          <Box sx={{ position: 'relative', overflow: 'hidden' }}>
            <CardMedia
              component="img"
              height={200}
              image={product.images[0] || '/api/placeholder/300/200'}
              alt={product.title}
              className="product-image"
              sx={{ 
                objectFit: 'cover',
                transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                height: { xs: 150, sm: 180, md: 200 }
              }}
            />
            
            {/* Enhanced Badges overlay */}
            <Stack 
              direction="row" 
              spacing={1} 
              sx={{ 
                position: 'absolute', 
                top: 8, 
                left: 8,
                flexWrap: 'wrap',
                gap: 0.5
              }}
            >
              {product.isNew && (
                <Chip 
                  label="NEW" 
                  size="small" 
                  color="success" 
                  variant="filled"
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                    animation: 'bounce 2s ease-in-out infinite'
                  }}
                />
              )}
              {product.isOnSale && (
                <Chip 
                  label={`${product.discountPercent}% OFF`} 
                  size="small" 
                  color="error" 
                  variant="filled"
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
                  }}
                />
              )}
              {product.isFeatured && (
                <Chip 
                  label="FEATURED" 
                  size="small" 
                  color="primary" 
                  variant="filled"
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
                  }}
                />
              )}
            </Stack>
            
            {/* Enhanced Action buttons overlay */}
            <Stack 
              direction="row" 
              spacing={1} 
              className="action-buttons"
              sx={{ 
                position: 'absolute', 
                top: 8, 
                right: 8,
                opacity: 0,
                transform: 'translateY(-10px)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '.MuiCard-root:hover &': {
                  opacity: 1,
                  transform: 'translateY(0)'
                }
              }}
            >
              <IconButton
                size="small"
                onClick={handleWishlistToggle}
                sx={{ 
                  bgcolor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.1)' 
                    : 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                  transition: 'all 0.3s ease',
                  '&:hover': { 
                    bgcolor: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.2)' 
                      : 'rgba(255, 255, 255, 1)',
                    transform: 'scale(1.1)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                  }
                }}
              >
                {isWishlisted ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
              </IconButton>
              <IconButton
                size="small"
                onClick={handleShare}
                sx={{ 
                  bgcolor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.1)' 
                    : 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                  transition: 'all 0.3s ease',
                  '&:hover': { 
                    bgcolor: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.2)' 
                      : 'rgba(255, 255, 255, 1)',
                    transform: 'scale(1.1)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                  }
                }}
              >
                <ShareIcon />
              </IconButton>
            </Stack>
          </Box>
          
          <CardContent sx={{ p: { xs: 1, sm: 1.5, md: 2, lg: 3 } }}>
            <Stack spacing={{ xs: 1, sm: 1.5, md: 2 }}>
              <Box>
                <Typography variant="h6" fontWeight={600} gutterBottom sx={{
                  fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem', lg: '1.25rem' },
                  lineHeight: 1.3,
                  mb: { xs: 0.5, sm: 1 }
                }}>
                  {product.title}
                </Typography>
                
                {/* Rating */}
                {product.rating && (
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                    <Rating value={product.rating} readOnly size="small" />
                    <Typography variant="body2" color="text.secondary">
                      ({product.reviewCount})
                    </Typography>
                  </Stack>
                )}
                
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {product.description}
                </Typography>
                
                {/* Store info with distance */}
                {product.store && (
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
                    <StoreIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {product.store.name}
                    </Typography>
                    {product.store.location && (
                      <Chip 
                        label={product.store.location.city} 
                        size="small" 
                        variant="outlined"
                        icon={<LocationIcon />}
                      />
                    )}
                    {filters.location.enabled && filters.location.userLocation && product.store.location?.coordinates && (
                      <Chip 
                        label={`${calculateDistance(
                          filters.location.userLocation.lat,
                          filters.location.userLocation.lng,
                          product.store.location.coordinates.lat,
                          product.store.location.coordinates.lng
                        ).toFixed(1)} km`}
                        size="small" 
                        variant="filled"
                        sx={{
                          bgcolor: theme.palette.mode === 'dark' 
                            ? 'rgba(59, 130, 246, 0.2)' 
                            : 'rgba(59, 130, 246, 0.1)',
                          color: 'primary.main',
                          fontWeight: 600,
                          fontSize: '0.7rem'
                        }}
                      />
                    )}
                  </Stack>
                )}
              </Box>
              
              <Box>
                <Stack direction="row" alignItems="center" spacing={{ xs: 1, sm: 2 }} sx={{ mb: { xs: 1, sm: 2 } }}>
                  <Typography variant="h6" fontWeight={700} sx={{
                    fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' }
                  }}>
                    ${getDiscountPrice().toFixed(2)} {product.currency}
                  </Typography>
                  {product.isOnSale && (
                    <Typography variant="body2" color="text.secondary" sx={{ 
                      textDecoration: 'line-through',
                      fontSize: { xs: '0.7rem', sm: '0.875rem' }
                    }}>
                      ${product.price.toFixed(2)}
                    </Typography>
                  )}
                </Stack>
                
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<ShoppingCartIcon />}
                    onClick={handleAddToCart}
                    sx={{ 
                      borderRadius: 0,
                      fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' },
                      py: { xs: 0.5, sm: 0.75, md: 1 },
                      px: { xs: 0.75, sm: 1, md: 1.5 }
                    }}
                  >
                    Add to Cart
                  </Button>
                  <IconButton
                    onClick={handleCompareToggle}
                    color={isInCompare ? 'primary' : 'inherit'}
                    sx={{ 
                      borderRadius: 0,
                      minWidth: { xs: 32, sm: 36, md: 40 },
                      height: { xs: 32, sm: 36, md: 40 }
                    }}
                  >
                    <CompareIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </Box>
            </Stack>
          </CardContent>
        </CardActionArea>
    </Card>
  );
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: theme.palette.mode === 'dark' 
        ? 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)'
        : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: theme.palette.mode === 'dark'
          ? 'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.1) 0%, transparent 50%)'
          : 'radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(147, 51, 234, 0.05) 0%, transparent 50%)',
        pointerEvents: 'none'
      }
    }}>
      <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3, md: 4 }, position: 'relative', zIndex: 1 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: { xs: 2, sm: 3 }, display: { xs: 'none', sm: 'flex' } }}>
          <MLink 
            component={NextLink} 
            href="/" 
            underline="hover" 
            color="inherit"
            sx={{ 
              transition: 'all 0.3s ease',
              '&:hover': { 
                color: 'primary.main',
                transform: 'translateX(2px)'
              }
            }}
          >
            Home
          </MLink>
          <Typography color="text.primary">Shop by Category</Typography>
        </Breadcrumbs>

        {/* Enhanced Header */}
        <Paper sx={{ 
          p: { xs: 2, sm: 3, md: 4 }, 
          mb: { xs: 2, sm: 3, md: 4 }, 
          borderRadius: { xs: 2, sm: 3, md: 4 },
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.6) 100%)',
          backdropFilter: 'blur(20px)',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          boxShadow: theme.palette.mode === 'dark'
            ? '0 8px 32px rgba(0, 0, 0, 0.3)'
            : '0 8px 32px rgba(0, 0, 0, 0.1)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899, #06b6d4)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 3s ease-in-out infinite'
          }
        }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'center', sm: 'flex-start' }} spacing={{ xs: 2, sm: 3 }}>
            <Avatar sx={{ 
              bgcolor: 'primary.main', 
              width: { xs: 48, sm: 56, md: 64 }, 
              height: { xs: 48, sm: 56, md: 64 },
              boxShadow: '0 8px 24px rgba(59, 130, 246, 0.3)',
              animation: 'pulse 2s ease-in-out infinite'
            }}>
              <CategoryIcon fontSize="large" />
            </Avatar>
            <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
              <Typography 
                variant="h3" 
                fontWeight={800} 
                gutterBottom
                sx={{
                  background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(135deg, #ffffff 0%, #a855f7 100%)'
                    : 'linear-gradient(135deg, #1e293b 0%, #7c3aed 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: theme.palette.mode === 'dark' 
                    ? '0 0 20px rgba(168, 85, 247, 0.3)'
                    : 'none'
                }}
              >
                Shop by Category
              </Typography>
              <Typography 
                variant="h6" 
                color="text.secondary"
                sx={{ 
                  fontWeight: 400,
                  opacity: 0.8
                }}
              >
                Discover products from all categories with advanced filters and location-based search
              </Typography>
            </Box>
          </Stack>
        </Paper>

        {/* Mobile Filter Bar */}
        <Paper 
          elevation={0}
          sx={{ 
            p: 2, 
            mb: 3, 
            borderRadius: 3,
            display: { xs: 'block', md: 'none' },
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.6) 100%)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
          }}
        >
          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="h6" fontWeight={600}>
                Quick Filters
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<FilterListIcon />}
                onClick={() => setShowFilters(!showFilters)}
                sx={{ textTransform: 'none' }}
              >
                {showFilters ? 'Hide' : 'More'}
              </Button>
            </Stack>
            
            {/* Category Selection */}
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                multiple
                value={filters.categories}
                label="Category"
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  categories: e.target.value as string[]
                }))}
                renderValue={(selected) => (
                  <Stack direction="row" spacing={0.5} flexWrap="wrap">
                    {(selected as string[]).map((value) => (
                      <Chip 
                        key={value} 
                        label={categories.find(c => c.value === value)?.label || value}
                        size="small"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    ))}
                  </Stack>
                )}
              >
                {categories.map((category) => (
                  <MenuItem key={category.value} value={category.value}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Box 
                        sx={{ 
                          width: 12, 
                          height: 12, 
                          borderRadius: '50%', 
                          bgcolor: category.color 
                        }} 
                      />
                      {category.label}
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Price Range */}
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Price Range: ${filters.priceRange[0]} - ${filters.priceRange[1]}
              </Typography>
              <Slider
                value={filters.priceRange}
                onChange={(_, value) => setFilters(prev => ({
                  ...prev,
                  priceRange: value as [number, number]
                }))}
                valueLabelDisplay="auto"
                min={0}
                max={1000}
                step={10}
                sx={{ mt: 1 }}
              />
            </Box>

            {/* Sort */}
            <FormControl fullWidth size="small">
              <InputLabel>Sort by</InputLabel>
              <Select
                value={filters.sortBy}
                label="Sort by"
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  sortBy: e.target.value
                }))}
              >
                {sortOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Paper>

        {/* Enhanced Quick Stats */}
        <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: 4 }}>
          <Grid item xs={6} sm={3}>
            <Paper sx={{ 
              p: 3, 
              textAlign: 'center', 
              borderRadius: 3,
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)'
                : 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(59, 130, 246, 0.02) 100%)',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 24px rgba(59, 130, 246, 0.2)',
                borderColor: theme.palette.primary.main
              }
            }}>
              <Typography variant="h4" color="primary.main" fontWeight={800}>
                {sortedProducts.length}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                Products Found
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Paper sx={{ 
              p: 3, 
              textAlign: 'center', 
              borderRadius: 3,
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%)'
                : 'linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(34, 197, 94, 0.02) 100%)',
              border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 24px rgba(34, 197, 94, 0.2)',
                borderColor: theme.palette.success.main
              }
            }}>
              <Typography variant="h4" color="success.main" fontWeight={800}>
                {sortedProducts.filter(p => p.isOnSale).length}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                On Sale
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Paper sx={{ 
              p: 3, 
              textAlign: 'center', 
              borderRadius: 3,
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%)'
                : 'linear-gradient(135deg, rgba(168, 85, 247, 0.05) 0%, rgba(168, 85, 247, 0.02) 100%)',
              border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 24px rgba(168, 85, 247, 0.2)',
                borderColor: theme.palette.secondary.main
              }
            }}>
              <Typography variant="h4" color="secondary.main" fontWeight={800}>
                {wishlist.length}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                In Wishlist
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Paper sx={{ 
              p: 3, 
              textAlign: 'center', 
              borderRadius: 3,
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)'
                : 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(245, 158, 11, 0.02) 100%)',
              border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 24px rgba(245, 158, 11, 0.2)',
                borderColor: theme.palette.warning.main
              }
            }}>
              <Typography variant="h4" color="warning.main" fontWeight={800}>
                {compareList.length}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                Comparing
              </Typography>
            </Paper>
          </Grid>
        </Grid>

      <Grid container spacing={{ xs: 2, md: 4 }}>
        {/* Enhanced Filters Sidebar */}
        <Grid item xs={12} md={3} sx={{ display: { xs: showFilters ? 'block' : 'none', md: 'block' } }}>
          <Paper sx={{ 
            p: { xs: 2, md: 3 }, 
            borderRadius: 4, 
            position: { xs: 'static', md: 'sticky' }, 
            top: 20,
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.6) 100%)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 8px 32px rgba(0, 0, 0, 0.3)'
              : '0 8px 32px rgba(0, 0, 0, 0.1)',
            '& .MuiAccordion-root': {
              background: 'transparent',
              boxShadow: 'none',
              '&::before': { display: 'none' },
              '&.Mui-expanded': {
                margin: 0
              }
            },
            '& .MuiAccordionSummary-root': {
              background: theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.05)'
                : 'rgba(0, 0, 0, 0.02)',
              borderRadius: 2,
              marginBottom: 1,
              '&.Mui-expanded': {
                minHeight: 'auto',
                '& .MuiAccordionSummary-content': {
                  margin: '12px 0'
                }
              }
            },
            '& .MuiAccordionDetails-root': {
              padding: '8px 0 16px 0'
            }
          }}>
            <Stack spacing={3}>
              {/* Enhanced Search */}
              <Box>
                <TextField
                  fullWidth
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="primary" />
                      </InputAdornment>
                    ),
                    sx: { 
                      borderRadius: 3,
                      background: theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.05)'
                        : 'rgba(0, 0, 0, 0.02)',
                      '&:hover': {
                        background: theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.08)'
                          : 'rgba(0, 0, 0, 0.04)'
                      },
                      '&.Mui-focused': {
                        background: theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.1)'
                          : 'rgba(0, 0, 0, 0.06)',
                        boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`
                      }
                    }
                  }}
                />
              </Box>

              {/* Location Filter */}
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <LocationIcon color="primary" />
                    <Typography variant="subtitle1" fontWeight={600}>
                      Location
                    </Typography>
                  </Stack>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={2}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={filters.location.enabled}
                          onChange={(e) => setFilters(prev => ({
                            ...prev,
                            location: { ...prev.location, enabled: e.target.checked }
                          }))}
                        />
                      }
                      label="Enable location search"
                    />
                    
                    {filters.location.enabled && (
                      <>
                        <Button
                          variant="outlined"
                          startIcon={<MyLocationIcon />}
                          onClick={getUserLocation}
                          fullWidth
                          sx={{ borderRadius: 2 }}
                        >
                          Use Current Location
                        </Button>
                        
              <FormControl fullWidth>
                          <InputLabel>Search Radius</InputLabel>
                <Select
                            value={filters.location.radius}
                            label="Search Radius"
                            onChange={(e) => setFilters(prev => ({
                              ...prev,
                              location: { ...prev.location, radius: e.target.value as number }
                            }))}
                          >
                            <MenuItem value={5}>5 km</MenuItem>
                            <MenuItem value={10}>10 km</MenuItem>
                            <MenuItem value={25}>25 km</MenuItem>
                            <MenuItem value={50}>50 km</MenuItem>
                            <MenuItem value={100}>100 km</MenuItem>
                </Select>
              </FormControl>
                        
                        <Button
                          variant="text"
                          startIcon={<MapIcon />}
                          onClick={() => setShowMapDialog(true)}
                          fullWidth
                          sx={{ borderRadius: 2 }}
                        >
                          View on Map
                        </Button>
                      </>
                    )}
                  </Stack>
                </AccordionDetails>
              </Accordion>

              {/* Categories */}
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Categories
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={1}>
                    {categories.map((category) => (
                      <FormControlLabel
                        key={category.value}
                        control={
                          <Checkbox
                            checked={filters.categories.includes(category.value)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFilters(prev => ({
                                  ...prev,
                                  categories: [...prev.categories, category.value]
                                }));
                              } else {
                                setFilters(prev => ({
                                  ...prev,
                                  categories: prev.categories.filter(c => c !== category.value)
                                }));
                              }
                            }}
                          />
                        }
                        label={
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Box sx={{ color: category.color }}>{category.icon}</Box>
                            <Typography variant="body2">{category.label}</Typography>
                          </Stack>
                        }
                      />
                    ))}
                  </Stack>
                </AccordionDetails>
              </Accordion>

              {/* Price Range */}
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Price Range
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={2}>
                    <Slider
                      value={filters.priceRange}
                      onChange={(_, newValue) => setFilters(prev => ({
                        ...prev,
                        priceRange: newValue as [number, number]
                      }))}
                      valueLabelDisplay="auto"
                      min={0}
                      max={2000}
                      step={10}
                    />
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2">${filters.priceRange[0]}</Typography>
                      <Typography variant="body2">${filters.priceRange[1]}</Typography>
                    </Stack>
                  </Stack>
                </AccordionDetails>
              </Accordion>

              {/* Brands */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Brands
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Autocomplete
                    multiple
                    options={brands}
                    value={filters.brands}
                    onChange={(_, newValue) => setFilters(prev => ({
                      ...prev,
                      brands: newValue
                    }))}
                    renderInput={(params) => (
                      <TextField {...params} placeholder="Select brands" size="small" />
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          variant="outlined"
                          label={option}
                          {...getTagProps({ index })}
                          key={option}
                        />
                      ))
                    }
                  />
                </AccordionDetails>
              </Accordion>

              {/* Colors */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Colors
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={1}>
                    {colors.map((color) => (
                      <FormControlLabel
                        key={color}
                        control={
                          <Checkbox
                            checked={filters.colors.includes(color)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFilters(prev => ({
                                  ...prev,
                                  colors: [...prev.colors, color]
                                }));
                              } else {
                                setFilters(prev => ({
                                  ...prev,
                                  colors: prev.colors.filter(c => c !== color)
                                }));
                              }
                            }}
                          />
                        }
                        label={
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Box
                              sx={{
                                width: 16,
                                height: 16,
                                borderRadius: '50%',
                                bgcolor: color.toLowerCase(),
                                border: '1px solid',
                                borderColor: 'divider'
                              }}
                            />
                            <Typography variant="body2">{color}</Typography>
                          </Stack>
                        }
                      />
                    ))}
                  </Stack>
                </AccordionDetails>
              </Accordion>

              {/* Rating */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Rating
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={1}>
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <FormControlLabel
                        key={rating}
                        control={
                          <Checkbox
                            checked={filters.ratings.includes(rating)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFilters(prev => ({
                                  ...prev,
                                  ratings: [...prev.ratings, rating]
                                }));
                              } else {
                                setFilters(prev => ({
                                  ...prev,
                                  ratings: prev.ratings.filter(r => r !== rating)
                                }));
                              }
                            }}
                          />
                        }
                        label={
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Rating value={rating} readOnly size="small" />
                            <Typography variant="body2">& up</Typography>
                          </Stack>
                        }
                      />
                    ))}
                  </Stack>
                </AccordionDetails>
              </Accordion>

              {/* Features */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Features
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={1}>
                    {features.map((feature) => (
                      <FormControlLabel
                        key={feature}
                        control={
                          <Checkbox
                            checked={filters.features.includes(feature)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFilters(prev => ({
                                  ...prev,
                                  features: [...prev.features, feature]
                                }));
                              } else {
                                setFilters(prev => ({
                                  ...prev,
                                  features: prev.features.filter(f => f !== feature)
                                }));
                              }
                            }}
                          />
                        }
                        label={<Typography variant="body2">{feature}</Typography>}
                      />
                    ))}
                  </Stack>
                </AccordionDetails>
              </Accordion>

              {/* Clear Filters */}
              <Button
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={() => setFilters({
                  priceRange: [0, 2000],
                  categories: ['all'],
                  brands: [],
                  colors: [],
                  sizes: [],
                  materials: [],
                  ratings: [],
                  features: [],
                  availability: [],
                  shipping: [],
                  location: {
                    enabled: false,
                    radius: 25,
                    userLocation: null
                  },
                  sortBy: 'newest',
                  viewMode: 'grid',
                  showMap: false,
                  compareMode: false,
                  wishlistMode: false
                })}
                fullWidth
                sx={{ borderRadius: 2 }}
              >
                Clear All Filters
              </Button>
            </Stack>
          </Paper>
        </Grid>

        {/* Products Grid */}
        <Grid item xs={12} md={9}>
        {/* Enhanced Toolbar */}
        <Paper sx={{ 
          p: { xs: 1, md: 2 }, 
          mb: 3, 
          borderRadius: 3,
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.6) 100%)',
          backdropFilter: 'blur(20px)',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          boxShadow: theme.palette.mode === 'dark'
            ? '0 4px 16px rgba(0, 0, 0, 0.2)'
            : '0 4px 16px rgba(0, 0, 0, 0.05)'
        }}>
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              justifyContent="space-between" 
              alignItems={{ xs: 'stretch', sm: 'center' }}
              spacing={{ xs: 2, sm: 0 }}
            >
              <Typography variant="body2" color="text.secondary">
                {sortedProducts.length} product{sortedProducts.length !== 1 ? 's' : ''} found
                {filters.location.enabled && filters.location.userLocation && (
                  <Chip 
                    label={`Within ${filters.location.radius}km`} 
                    size="small" 
                    sx={{ ml: 1 }}
                    icon={<LocationIcon />}
                  />
                )}
              </Typography>
              
              <Stack 
                direction={{ xs: 'column', sm: 'row' }} 
                spacing={2} 
                alignItems={{ xs: 'stretch', sm: 'center' }}
                sx={{ width: { xs: '100%', sm: 'auto' } }}
              >
                {/* Mobile Filter Toggle */}
                <Button
                  variant="outlined"
                  startIcon={<FilterListIcon />}
                  onClick={() => setShowFilters(!showFilters)}
                  sx={{ 
                    display: { xs: 'flex', md: 'none' },
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600
                  }}
                >
                  Filters {showFilters ? '(Hide)' : ''}
                </Button>
                {/* Sort */}
                <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 150 } }}>
                  <InputLabel>Sort by</InputLabel>
                  <Select
                    value={filters.sortBy}
                    label="Sort by"
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      sortBy: e.target.value
                    }))}
                  >
                    {sortOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          {option.icon}
                          <Typography>{option.label}</Typography>
                        </Stack>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* View Toggle */}
                <ToggleButtonGroup
                  value={filters.viewMode}
                  exclusive
                  onChange={(_, newMode) => {
                    if (newMode !== null) {
                      setFilters(prev => ({
                        ...prev,
                        viewMode: newMode
                      }));
                    }
                  }}
                  size="small"
                >
                  <ToggleButton value="grid">
                    <GridViewIcon />
                  </ToggleButton>
                  <ToggleButton value="list">
                    <ListViewIcon />
                  </ToggleButton>
                  <ToggleButton value="compact">
                    <ViewModuleIcon />
                  </ToggleButton>
                </ToggleButtonGroup>

                {/* Compare Button */}
                {compareList.length > 0 && (
                  <Button
                    variant="contained"
                    startIcon={<CompareIcon />}
                    onClick={() => {/* Open compare dialog */}}
                    sx={{ borderRadius: 2 }}
                  >
                    Compare ({compareList.length})
                  </Button>
                )}
              </Stack>
            </Stack>
          </Paper>

          {loading ? (
            <Box textAlign="center" py={8}>
              <CircularProgress size={40} />
              <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
                Loading products...
              </Typography>
            </Box>
          ) : sortedProducts.length === 0 ? (
            <Box textAlign="center" py={8}>
              <Avatar sx={{ mx: 'auto', mb: 2, bgcolor: 'grey.100', width: 64, height: 64 }}>
                <CategoryIcon fontSize="large" color="action" />
              </Avatar>
              <Typography variant="h6" gutterBottom>
                No products found
              </Typography>
              <Typography color="text.secondary" mb={3}>
                Try adjusting your search or filters to find more products.
              </Typography>
              <Button
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={() => setFilters({
                  priceRange: [0, 2000],
                  categories: ['all'],
                  brands: [],
                  colors: [],
                  sizes: [],
                  materials: [],
                  ratings: [],
                  features: [],
                  availability: [],
                  shipping: [],
                  location: {
                    enabled: false,
                    radius: 25,
                    userLocation: null
                  },
                  sortBy: 'newest',
                  viewMode: 'grid',
                  showMap: false,
                  compareMode: false,
                  wishlistMode: false
                })}
              >
                Clear Filters
              </Button>
            </Box>
          ) : (
            <>
              {/* Products */}
              <Grid container spacing={{ xs: 1, sm: 2, md: 3 }}>
                {sortedProducts.map((product) => (
                  <Grid 
                    item 
                    xs={
                      filters.viewMode === 'grid' ? 6 : 
                      filters.viewMode === 'compact' ? 12 : 12
                    }
                    sm={
                      filters.viewMode === 'grid' ? 6 : 
                      filters.viewMode === 'compact' ? 6 : 12
                    } 
                    md={
                      filters.viewMode === 'grid' ? 4 : 
                      filters.viewMode === 'compact' ? 4 : 12
                    }
                    lg={
                      filters.viewMode === 'grid' ? 4 : 
                      filters.viewMode === 'compact' ? 3 : 12
                    } 
                    key={product._id}
                  >
                    <ProductCard 
                      product={product} 
                      isListView={filters.viewMode === 'list'}
                      isCompact={filters.viewMode === 'compact'}
                    />
                  </Grid>
                ))}
              </Grid>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <Box display="flex" justifyContent="center" mt={4}>
                  <Pagination
                    count={pagination.pages}
                    page={pagination.page}
                    onChange={(_, value) => setPage(value)}
                    color="primary"
                    size="large"
                    sx={{ '& .MuiPaginationItem-root': { borderRadius: 2 } }}
                  />
                </Box>
              )}
            </>
          )}
        </Grid>
      </Grid>

      {/* Map Dialog */}
      <Dialog
        open={showMapDialog}
        onClose={() => setShowMapDialog(false)}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: { xs: 0, sm: 3 },
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
            <MapIcon color="primary" />
            <Typography variant="h6" fontWeight={600}>
              Products Near You
            </Typography>
          </Stack>
          <IconButton onClick={() => setShowMapDialog(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ height: { xs: '70vh', sm: 500 }, borderRadius: { xs: 0, sm: 2 }, overflow: 'hidden' }}>
            <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'demo-key'}>
              <Map
                defaultCenter={mapCenter}
                defaultZoom={mapZoom}
                mapId="products-map"
                style={{ width: '100%', height: '100%' }}
              >
                {/* User Location Marker */}
                {filters.location.userLocation && (
                  <Marker
                    position={filters.location.userLocation}
                    title="Your Location"
                  />
                )}
                
                {/* Product Store Markers */}
                {sortedProducts
                  .filter(product => product.store?.location?.coordinates)
                  .map((product) => (
                    <Marker
                      key={product._id}
                      position={product.store!.location!.coordinates}
                      title={product.title}
                    />
                  ))}
              </Map>
            </APIProvider>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: '100%' }}>
            <Button
              variant="outlined"
              startIcon={<MyLocationIcon />}
              onClick={getUserLocation}
              sx={{ 
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                width: { xs: '100%', sm: 'auto' }
              }}
            >
              Update Location
            </Button>
            
            <Button
              variant="contained"
              startIcon={<DirectionsIcon />}
              onClick={() => {
                if (filters.location.userLocation) {
                  const url = `https://www.google.com/maps/dir/?api=1&destination=${filters.location.userLocation.lat},${filters.location.userLocation.lng}`;
                  window.open(url, '_blank');
                }
              }}
              sx={{ 
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                background: 'linear-gradient(45deg, #7c3aed, #06b6d4)',
                width: { xs: '100%', sm: 'auto' },
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

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        
        @keyframes pulse {
          0%, 100% { 
            transform: scale(1);
            box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3);
          }
          50% { 
            transform: scale(1.05);
            box-shadow: 0 12px 32px rgba(59, 130, 246, 0.4);
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes bounce {
          0%, 20%, 53%, 80%, 100% {
            transform: translate3d(0,0,0);
          }
          40%, 43% {
            transform: translate3d(0, -8px, 0);
          }
          70% {
            transform: translate3d(0, -4px, 0);
          }
          90% {
            transform: translate3d(0, -2px, 0);
          }
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out;
        }
        
        .animate-slideInLeft {
          animation: slideInLeft 0.6s ease-out;
        }
        
        .animate-bounce {
          animation: bounce 1s ease-in-out;
        }
        
        /* Smooth scrolling */
        html {
          scroll-behavior: smooth;
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: ${theme.palette.mode === 'dark' ? '#1a1a2e' : '#f1f1f1'};
        }
        
        ::-webkit-scrollbar-thumb {
          background: ${theme.palette.mode === 'dark' ? '#4a5568' : '#c1c1c1'};
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: ${theme.palette.mode === 'dark' ? '#718096' : '#a8a8a8'};
        }
      `}</style>
    </Container>
    </Box>
  );
}