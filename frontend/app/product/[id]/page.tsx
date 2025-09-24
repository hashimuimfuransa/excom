"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Container,
  Box,
  Typography,
  Grid,
  Button,
  Card,
  CardContent,
  CardMedia,
  Stack,
  Skeleton,
  Paper,
  Divider,
  IconButton,
  Badge,
  Avatar,
  Chip,
  Rating,
  TextField,
  Breadcrumbs,
  Link as MLink,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Zoom,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Snackbar,
  Fab,
  LinearProgress,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  ShoppingCart as ShoppingCartIcon,
  FavoriteBorder as FavoriteIcon,
  Share as ShareIcon,
  ZoomIn as ZoomInIcon,
  Store as StoreIcon,
  LocalShipping as ShippingIcon,
  Security as SecurityIcon,
  AssignmentReturn as ReturnIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Star as StarIcon,
  Chat as ChatIcon,
  MonetizationOn as BargainIcon,
  Badge as BadgeIcon,
  Favorite as FavoriteFilledIcon,
  CompareArrows as CompareIcon,
  NotificationsActive as NotifyIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  LocalOffer as OfferIcon,
  Timer as TimerIcon,
  TrendingUp as TrendingIcon,
  Visibility as ViewIcon,
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  WhatsApp as WhatsAppIcon,
  ContentCopy as CopyIcon,
  QrCode as QrCodeIcon,
  Inventory as InventoryIcon,
  LocalAtm as MoneyIcon,
  VerifiedUser as VerifiedIcon,
  Diamond as PremiumIcon
} from '@mui/icons-material';
import { apiGet } from '@utils/api';
import { addToCart } from '@utils/cart';
import NextLink from 'next/link';
import BargainChat from '@components/BargainChat';
import ARViewer from '@components/ARViewer';
import { useAuth } from '@utils/auth';
import { useTranslation } from 'react-i18next';

interface Product {
  _id: string;
  title: string;
  description: string;
  images: string[];
  price: number;
  currency: string;
  category: string;
  seller: string;
  store?: string;
  createdAt?: string;
  bargainingEnabled?: boolean;
  minBargainPrice?: number;
  maxBargainDiscountPercent?: number;
  inventory?: number;
  sku?: string;
  weight?: number;
  dimensions?: { length: number; width: number; height: number };
  brand?: string;
  condition?: string;
  warranty?: string;
  features?: string[];
  rating?: { average: number; count: number; breakdown: { [key: number]: number } };
  views?: number;
  sold?: number;
  tags?: string[];
  // Product variants
  variants?: {
    sizes?: string[];
    colors?: string[];
    weight?: {
      value: number;
      unit: 'kg' | 'g' | 'lb' | 'oz';
      displayValue?: string;
    };
    dimensions?: {
      length: number;
      width: number;
      height: number;
      unit: 'cm' | 'in' | 'm';
    };
    material?: string;
    brand?: string;
    sku?: string;
    inventory?: number;
  };
  // AR/3D Model fields
  modelUrl?: string;
  modelType?: 'gltf' | 'glb' | 'usdz';
  modelStatus?: 'none' | 'generating' | 'ready' | 'failed';
  modelGeneratedAt?: string;
  modelGenerationId?: string;
}

interface Store {
  _id: string;
  name: string;
  logo?: string;
  owner?: { name: string };
}

// Related Product Card Component
const RelatedProductCard = ({ product: relatedProduct, router }: { product: Product, router: any }) => (
  <Card 
    elevation={0}
    sx={{ 
      height: '100%',
      borderRadius: 3,
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      border: '1px solid',
      borderColor: 'divider',
      backdropFilter: 'blur(10px)',
      background: (theme) => theme.palette.mode === 'dark' 
                      ? 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
                      : 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
      }
    }}
    onClick={() => router.push(`/product/${relatedProduct._id}`)}
  >
    <CardMedia
      component="img"
      height={{ xs: 140, md: 150 }}
      image={relatedProduct.images[0]}
      alt={relatedProduct.title}
      sx={{ objectFit: 'cover' }}
    />
    <CardContent sx={{ p: { xs: 1.5, md: 2 } }}>
      <Typography 
        variant="subtitle2" 
        fontWeight={600} 
        gutterBottom
        sx={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          fontSize: { xs: '0.8rem', md: '0.875rem' }
        }}
      >
        {relatedProduct.title}
      </Typography>
      <Typography 
        variant="h6" 
        color="primary.main" 
        fontWeight={700}
        sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}
      >
        ${relatedProduct.price.toFixed(2)}
      </Typography>
    </CardContent>
  </Card>
);

// Enhanced Product Image Gallery Component
const ProductImageGallery = ({ 
  product, 
  selectedImageIndex, 
  setSelectedImageIndex, 
  setImageDialogOpen 
}: {
  product: Product;
  selectedImageIndex: number;
  setSelectedImageIndex: (index: number) => void;
  setImageDialogOpen: (open: boolean) => void;
}) => {
  if (!product?.images?.length) return null;

  return (
    <Paper 
      elevation={0}
      sx={{ 
        borderRadius: 3, 
        overflow: 'hidden', 
        p: { xs: 1, md: 1.5 },
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        backdropFilter: 'blur(10px)',
        background: (theme) => theme.palette.mode === 'dark' 
                      ? 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
                      : 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)'
      }}
    >
      {/* Main Image */}
      <Card 
        elevation={0}
        sx={{ 
          borderRadius: 3, 
          mb: { xs: 1.5, md: 2 }, 
          position: 'relative',
          cursor: 'pointer',
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'scale(1.02)',
            boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
          },
          '&:hover .zoom-icon': { opacity: 1 }
        }}
        onClick={() => setImageDialogOpen(true)}
      >
        <CardMedia
          component="img"
          height={{ xs: 250, sm: 300, md: 400 }}
          image={product.images[selectedImageIndex]}
          alt={product.title}
          sx={{ 
            objectFit: 'cover',
            transition: 'transform 0.3s ease'
          }}
        />
        <IconButton
          className="zoom-icon"
          sx={{
            position: 'absolute',
            top: { xs: 8, md: 12 },
            right: { xs: 8, md: 12 },
            bgcolor: (theme) => theme.palette.mode === 'dark' 
              ? 'rgba(255,255,255,0.15)' 
              : 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(10px)',
            opacity: 0,
            transition: 'all 0.3s ease',
            width: { xs: 36, md: 44 },
            height: { xs: 36, md: 44 },
            color: (theme) => theme.palette.mode === 'dark' 
              ? 'rgba(255,255,255,0.9)' 
              : 'rgba(0,0,0,0.7)',
            '&:hover': { 
              bgcolor: (theme) => theme.palette.mode === 'dark' 
                ? 'rgba(255,255,255,0.25)' 
                : 'rgba(255,255,255,1)',
              transform: 'scale(1.1)'
            }
          }}
        >
          <ZoomInIcon sx={{ fontSize: { xs: 20, md: 24 } }} />
        </IconButton>
        
        {/* Image Counter */}
        {product.images.length > 1 && (
          <Box
            sx={{
              position: 'absolute',
              bottom: { xs: 8, md: 12 },
              left: { xs: 8, md: 12 },
              bgcolor: (theme) => theme.palette.mode === 'dark' 
                ? 'rgba(0,0,0,0.8)' 
                : 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(10px)',
              borderRadius: 2,
              px: 1.5,
              py: 0.5
            }}
          >
            <Typography variant="caption" color="white" fontWeight={600}>
              {selectedImageIndex + 1} / {product.images.length}
            </Typography>
          </Box>
        )}
      </Card>

      {/* Enhanced Thumbnail Images */}
      {product.images.length > 1 && (
        <Stack 
          direction="row" 
          spacing={{ xs: 0.5, md: 1 }} 
          sx={{ 
            overflowX: 'auto',
            pb: 0.5,
            '&::-webkit-scrollbar': {
              height: 4,
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(0,0,0,0.2)',
              borderRadius: 2,
            },
            '&::-webkit-scrollbar-thumb:hover': {
              backgroundColor: 'rgba(0,0,0,0.3)',
            },
          }}
        >
          {product.images.map((image, index) => (
            <Card
              key={index}
              elevation={0}
              sx={{
                minWidth: { xs: 50, md: 60 },
                height: { xs: 50, md: 60 },
                cursor: 'pointer',
                border: selectedImageIndex === index ? '2px solid' : '1px solid',
                borderColor: selectedImageIndex === index ? 'primary.main' : 'divider',
                borderRadius: 2,
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.05)',
                  borderColor: 'primary.main',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }
              }}
              onClick={() => setSelectedImageIndex(index)}
            >
              <CardMedia
                component="img"
                height="100%"
                image={image}
                alt={`${product.title} ${index + 1}`}
                sx={{ 
                  objectFit: 'cover',
                  transition: 'transform 0.3s ease'
                }}
              />
            </Card>
          ))}
        </Stack>
      )}
    </Paper>
  );
};

export default function ProductPage() {
  const { t } = useTranslation();
  const { user, token } = useAuth();
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  // State
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [bargainChatOpen, setBargainChatOpen] = useState(false);
  const [existingChatId, setExistingChatId] = useState<string | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [notifyOnStock, setNotifyOnStock] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [deliveryOption, setDeliveryOption] = useState('standard');
  const [currentPromotion, setCurrentPromotion] = useState<any>(null);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [frequentlyBought, setFrequentlyBought] = useState<Product[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [productViews, setProductViews] = useState(0);
  const [mockProduct, setMockProduct] = useState<Product | null>(null);
  
  // Product variant selection state
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');

  // Fetch product data
  useEffect(() => {
    fetchProduct();
  }, [productId]);

  // Check for existing bargain chat
  useEffect(() => {
    if (product && user && product.bargainingEnabled) {
      checkExistingBargainChat();
    }
  }, [product, user]);

  // Recently viewed tracking with view count and analytics
  useEffect(() => {
    if (product) {
      // Update recently viewed products
      const recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]')
      const updated = [
        product,
        ...recentlyViewed.filter((p: Product) => p._id !== product._id)
      ].slice(0, 10)
      localStorage.setItem('recentlyViewed', JSON.stringify(updated))

      // Simulate view count increment (would be backend API call)
      setMockProduct(prev => prev ? {
        ...prev,
        views: (prev.views || 0) + 1
      } : prev)

      // Track product view analytics
      const viewHistory = JSON.parse(localStorage.getItem('productViewHistory') || '{}')
      const today = new Date().toISOString().split('T')[0]
      viewHistory[today] = (viewHistory[today] || 0) + 1
      localStorage.setItem('productViewHistory', JSON.stringify(viewHistory))
    }
  }, [product]);

  const fetchProduct = async () => {
    // Validate productId before making API call
    if (!productId || productId === 'undefined' || productId === 'null') {
      console.error('Invalid product ID:', productId);
      setSnackbar({ open: true, message: t('productDetails.notFound'), severity: 'error' });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const productData = await apiGet<Product>(`/products/${productId}`);
      setProduct(productData);
      
      // Fetch store info if product has store
      if (productData.store) {
        try {
          const storeData = await apiGet<Store>(`/sellers/public/stores/${productData.store}`);
          setStore(storeData);
        } catch (error) {
          console.error('Failed to fetch store:', error);
        }
      }
      
      // Fetch related products
      fetchRelatedProducts();
    } catch (error) {
      console.error('Failed to fetch product:', error);
      setSnackbar({ open: true, message: t('productDetails.notFound'), severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedProducts = async () => {
    // Validate productId before making API call
    if (!productId || productId === 'undefined' || productId === 'null') {
      return;
    }

    try {
      setRelatedLoading(true);
      const related = await apiGet<Product[]>(`/products/related/${productId}`);
      setRelatedProducts(related);
    } catch (error) {
      console.error('Failed to fetch related products:', error);
    } finally {
      setRelatedLoading(false);
    }
  };

  const handleAddToCart = useCallback(async () => {
    if (!product) return;
    
    // Check if required variants are selected
    if (product.variants?.sizes?.length && !selectedSize) {
      setSnackbar({ 
        open: true, 
        message: t('productDetails.pleaseSelectSize'), 
        severity: 'error' 
      });
      return;
    }
    
    if (product.variants?.colors?.length && !selectedColor) {
      setSnackbar({ 
        open: true, 
        message: t('productDetails.pleaseSelectColor'), 
        severity: 'error' 
      });
      return;
    }
    
    try {
      setAddingToCart(true);
      const cartItem = {
        id: product._id,
        title: product.title,
        price: product.price,
        image: product.images[0],
        quantity,
        selectedSize: selectedSize || undefined,
        selectedColor: selectedColor || undefined,
        variants: {
          size: selectedSize || undefined,
          color: selectedColor || undefined
        }
      };
      
      addToCart(cartItem);
      setSnackbar({ 
        open: true, 
        message: t('productDetails.addedToCart', { productName: product.title }), 
        severity: 'success' 
      });
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: t('productDetails.failedToAddToCart'), 
        severity: 'error' 
      });
    } finally {
      setAddingToCart(false);
    }
  }, [product, quantity, selectedSize, selectedColor, t]);

  const handleBuyNow = useCallback(() => {
    if (!product) return;
    handleAddToCart().then(() => {
      router.push('/cart');
    });
  }, [product, handleAddToCart, router]);

  const checkExistingBargainChat = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bargain/my-chats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const existingChat = data.chats.find((chat: any) => 
          chat.product._id === productId && chat.status === 'active'
        );
        if (existingChat) {
          setExistingChatId(existingChat._id);
        }
      }
    } catch (error) {
      console.error('Error checking existing bargain chat:', error);
    }
  };

  const handleStartBargaining = () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    setBargainChatOpen(true);
  };

  const canUserBargain = () => {
    // Show bargaining UI to all users except the seller
    // Authentication will be handled when user tries to interact
    return product?.bargainingEnabled && (!user || user._id !== product?.seller);
  };

  // Track product view
  useEffect(() => {
    if (product) {
      // Increment view count
      setProductViews(prev => prev + 1);
      
      // Add to recently viewed (localStorage)
      const recent = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
      const filtered = recent.filter((id: string) => id !== productId);
      localStorage.setItem('recentlyViewed', JSON.stringify([productId, ...filtered.slice(0, 9)]));
    }
  }, [product, productId]);

  // Wishlist handlers
  const handleToggleWishlist = useCallback(async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    
    try {
      setIsWishlisted(!isWishlisted);
      setSnackbar({ 
        open: true, 
        message: isWishlisted ? t('productDetails.removedFromWishlist') : t('productDetails.addedToWishlist'), 
        severity: 'success' 
      });
    } catch (error) {
      setSnackbar({ open: true, message: 'Error updating wishlist', severity: 'error' });
    }
  }, [user, isWishlisted, router, t]);

  // Compare functionality
  const handleToggleCompare = useCallback(() => {
    const compareList = JSON.parse(localStorage.getItem('compareList') || '[]');
    let updatedList;
    
    if (isComparing) {
      updatedList = compareList.filter((id: string) => id !== productId);
      setIsComparing(false);
      setSnackbar({ open: true, message: t('productDetails.removedFromCompare'), severity: 'success' });
    } else {
      if (compareList.length >= 4) {
        setSnackbar({ open: true, message: t('productDetails.compareLimit'), severity: 'error' });
        return;
      }
      updatedList = [...compareList, productId];
      setIsComparing(true);
      setSnackbar({ open: true, message: t('productDetails.addedToCompare'), severity: 'success' });
    }
    
    localStorage.setItem('compareList', JSON.stringify(updatedList));
  }, [isComparing, productId, t]);

  // Notify when in stock
  const handleNotifyToggle = useCallback(async () => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }
    
    setNotifyOnStock(!notifyOnStock);
    setSnackbar({ 
      open: true, 
      message: notifyOnStock ? t('productDetails.notifyDisabled') : t('productDetails.notifyEnabled'), 
      severity: 'success' 
    });
  }, [user, notifyOnStock, router, t]);

  // Share functionality
  const handleShare = useCallback((platform?: string) => {
    const url = window.location.href;
    const text = `Check out ${product?.title} on Excom`;
    
    if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
    } else if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`, '_blank');
    } else if (platform === 'copy') {
      navigator.clipboard.writeText(url);
      setSnackbar({ open: true, message: t('productDetails.linkCopied'), severity: 'success' });
    }
    setShareDialogOpen(false);
  }, [product, t]);

  // Check wishlist and compare status on load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
      const compareList = JSON.parse(localStorage.getItem('compareList') || '[]');
      setIsWishlisted(wishlist.includes(productId));
      setIsComparing(compareList.includes(productId));
    }
  }, [productId]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3 }} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Skeleton variant="text" width="80%" height={40} />
            <Skeleton variant="text" width="40%" height={30} sx={{ mt: 1 }} />
            <Skeleton variant="text" width="100%" height={20} sx={{ mt: 2 }} />
            <Skeleton variant="text" width="100%" height={20} />
            <Skeleton variant="text" width="60%" height={20} />
            <Box mt={3}>
              <Skeleton variant="rectangular" width="100%" height={56} sx={{ borderRadius: 2 }} />
            </Box>
          </Grid>
        </Grid>
      </Container>
    );
  }

  if (!product) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>{t('productDetails.notFound')}</Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          {t('productDetails.notFoundMessage')}
        </Typography>
        <Button variant="contained" onClick={() => router.push('/')} sx={{ mt: 2 }}>
          {t('productDetails.goHome')}
        </Button>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
        {/* Enhanced Breadcrumbs */}
        <Paper 
          elevation={0}
          sx={{ 
            p: { xs: 1.5, md: 2 }, 
            mb: { xs: 2, md: 4 }, 
            borderRadius: 3, 
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            backdropFilter: 'blur(10px)',
            background: (theme) => theme.palette.mode === 'dark' 
              ? 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
              : 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)'
          }}
        >
          <Breadcrumbs 
            sx={{ 
              fontSize: { xs: '0.75rem', md: '0.875rem' },
              '& .MuiBreadcrumbs-separator': {
                color: 'text.secondary',
                mx: { xs: 0.5, md: 1 }
              }
            }}
          >
          <MLink 
            component={NextLink} 
            href="/" 
            underline="hover" 
            color="inherit"
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5,
                transition: 'all 0.2s ease',
                '&:hover': {
                  color: 'primary.main',
                  transform: 'translateX(2px)'
                }
              }}
          >
            🏠 {t('productDetails.home')}
          </MLink>
          <MLink 
            component={NextLink} 
            href="/product" 
            underline="hover" 
            color="inherit"
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5,
                transition: 'all 0.2s ease',
                '&:hover': {
                  color: 'primary.main',
                  transform: 'translateX(2px)'
                }
              }}
          >
            🛍️ {t('productDetails.products')}
          </MLink>
          <Typography color="text.primary" sx={{ fontWeight: 500 }}>
            📁 {product.category}
          </Typography>
          <Typography 
            color="primary.main" 
            sx={{ 
              fontWeight: 600,
                maxWidth: { xs: 150, md: 200 },
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            ✨ {product.title}
          </Typography>
        </Breadcrumbs>
      </Paper>

        <Grid container spacing={{ xs: 2, md: 4 }}>
        {/* Product Images */}
        <Grid item xs={12} md={6}>
          <ProductImageGallery 
            product={product}
            selectedImageIndex={selectedImageIndex}
            setSelectedImageIndex={setSelectedImageIndex}
            setImageDialogOpen={setImageDialogOpen}
          />
          
          {/* AR Viewer */}
          {product.modelStatus === 'ready' && product.modelUrl && (
              <Box sx={{ mt: { xs: 2, md: 3 } }}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: { xs: 2, md: 3 }, 
                    borderRadius: 3, 
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    backdropFilter: 'blur(10px)',
                    background: (theme) => theme.palette.mode === 'dark' 
                      ? 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
                      : 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)'
                  }}
                >
                <Stack spacing={2}>
                    <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                    <Typography variant="h6" fontWeight={700}>
                      🎯 View in 3D & AR
                    </Typography>
                    <Chip 
                      label={product.modelType?.toUpperCase()} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                        sx={{ fontWeight: 600 }}
                    />
                  </Stack>
                  <ARViewer
                    modelUrl={product.modelUrl}
                    modelType={product.modelType || 'glb'}
                    productTitle={product.title}
                    productImage={product.images[0]}
                    onError={(error) => {
                      setSnackbar({ 
                        open: true, 
                        message: `AR Viewer Error: ${error}`, 
                        severity: 'error' 
                      });
                    }}
                    onLoad={() => {
                      console.log('3D model loaded successfully');
                    }}
                  />
                </Stack>
              </Paper>
            </Box>
          )}
        </Grid>

        {/* Product Info */}
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={0}
            sx={{ 
              p: { xs: 2, md: 3 }, 
              borderRadius: 3, 
              height: 'fit-content', 
              position: { xs: 'static', md: 'sticky' }, 
              top: { md: 20 },
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              backdropFilter: 'blur(10px)',
              background: (theme) => theme.palette.mode === 'dark' 
                ? 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
                : 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)'
            }}
          >
            <Stack spacing={{ xs: 2, md: 3 }}>
              {/* Title and Category */}
              <Box>
                <Stack 
                  direction="row" 
                  spacing={{ xs: 0.5, md: 1 }} 
                  alignItems="center" 
                  mb={{ xs: 1, md: 1.5 }}
                  flexWrap="wrap"
                >
                  <Chip 
                    label={product.category} 
                    size="small" 
                    color="primary" 
                    variant="filled"
                    sx={{ 
                      background: (theme) => theme.palette.mode === 'dark' 
                        ? 'linear-gradient(45deg, #64B5F6, #42A5F5)'
                        : 'linear-gradient(45deg, #2196F3, #21CBF3)',
                      fontWeight: 600,
                      fontSize: { xs: '0.7rem', md: '0.75rem' }
                    }}
                  />
                  <Chip 
                    label={`✨ ${t('productDetails.premium')}`}
                    size="small" 
                    color="warning" 
                    variant="outlined"
                    sx={{ 
                      fontWeight: 500,
                      fontSize: { xs: '0.7rem', md: '0.75rem' }
                    }}
                  />
                  {product.bargainingEnabled && (
                    <Chip 
                      label={`💬 ${t('productDetails.negotiable')}`}
                      size="small" 
                      color="success" 
                      variant="outlined"
                      sx={{ 
                        fontWeight: 500,
                        fontSize: { xs: '0.7rem', md: '0.75rem' }
                      }}
                    />
                  )}
                </Stack>
                <Typography 
                  variant="h4" 
                  fontWeight={800} 
                  gutterBottom
                  sx={{
                    fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
                    background: (theme) => theme.palette.mode === 'dark' 
                      ? 'linear-gradient(45deg, #ffffff, #e0e0e0)'
                      : 'linear-gradient(45deg, #1a1a1a, #4a4a4a)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    lineHeight: 1.2,
                    mb: { xs: 1, md: 1.5 }
                  }}
                >
                  {product.title}
                </Typography>
                {/* Enhanced Rating & Social Proof */}
                <Stack spacing={{ xs: 1.5, md: 2 }}>
                  <Stack 
                    direction={{ xs: 'column', sm: 'row' }} 
                    alignItems={{ xs: 'flex-start', sm: 'center' }} 
                    spacing={{ xs: 0.5, sm: 1 }}
                  >
                    <Rating 
                      value={product.rating?.average || 4.2} 
                      precision={0.1} 
                      readOnly 
                      size="small"
                      sx={{ color: 'warning.main' }}
                    />
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                    >
                      ({product.rating?.average || 4.2}) • {product.rating?.count || 127} {t('productDetails.reviews')}
                    </Typography>
                  </Stack>

                  {/* Social Proof Indicators */}
                  <Stack 
                    direction={{ xs: 'column', sm: 'row' }} 
                    spacing={{ xs: 1, sm: 2 }} 
                    alignItems={{ xs: 'flex-start', sm: 'center' }} 
                    flexWrap="wrap"
                  >
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <ViewIcon fontSize="small" color="action" />
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}
                      >
                        {(product.views || productViews || 245).toLocaleString()} {t('productDetails.views')}
                      </Typography>
                    </Stack>
                    
                    {(product.sold || 0) > 0 && (
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <TrendingIcon fontSize="small" color="success" />
                        <Typography 
                          variant="caption" 
                          color="success.main" 
                          fontWeight={600}
                          sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}
                        >
                          {product.sold} {t('productDetails.soldThisMonth')}
                        </Typography>
                      </Stack>
                    )}
                    
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <TimerIcon fontSize="small" color="warning" />
                      <Typography 
                        variant="caption" 
                        color="warning.main" 
                        fontWeight={600}
                        sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}
                      >
                        ⚡ 23 {t('productDetails.peopleViewingThis')}
                      </Typography>
                    </Stack>
                  </Stack>
                </Stack>
              </Box>

              {/* Price */}
              <Box>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: { xs: 1.5, md: 2 }, 
                    borderRadius: 3, 
                    border: '1px solid',
                    borderColor: 'primary.main',
                    bgcolor: 'primary.50',
                    background: (theme) => theme.palette.mode === 'dark' 
                      ? 'linear-gradient(135deg, rgba(100, 181, 246, 0.15) 0%, rgba(66, 165, 245, 0.1) 100%)'
                      : 'linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(33, 150, 243, 0.05) 100%)',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <Stack spacing={{ xs: 1, md: 1.5 }}>
                    <Box 
                      display="flex" 
                      alignItems="baseline" 
                      gap={{ xs: 0.5, md: 1 }}
                      flexWrap="wrap"
                    >
                      <Typography 
                        variant="h2" 
                        fontWeight={900}
                        sx={{
                          fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                          background: (theme) => theme.palette.mode === 'dark' 
                            ? 'linear-gradient(45deg, #64B5F6, #42A5F5)'
                            : 'linear-gradient(45deg, #2196F3, #21CBF3)',
                          backgroundClip: 'text',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                        }}
                      >
                        ${product.price.toFixed(2)}
                      </Typography>
                      <Typography 
                        variant="h6" 
                        color="text.secondary" 
                        fontWeight={500}
                        sx={{ fontSize: { xs: '0.9rem', md: '1.25rem' } }}
                      >
                        {product.currency || t('productDetails.usd')}
                      </Typography>
                      {product.bargainingEnabled && (
                        <Chip 
                          icon={<BargainIcon />}
                          label={`💬 ${t('productDetails.negotiable')}`} 
                          size="small" 
                          color="warning" 
                          variant="filled"
                          sx={{ 
                            ml: 'auto',
                            fontSize: { xs: '0.7rem', md: '0.75rem' }
                          }}
                        />
                      )}
                    </Box>
                    
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="success.main" fontWeight={600}>
                        💰 {t('productDetails.bestPriceGuaranteed')}
                      </Typography>
                      {product.bargainingEnabled && product.minBargainPrice && (
                        <Typography variant="caption" color="warning.dark" fontWeight={600}>
                          {t('productDetails.min')} ${product.minBargainPrice.toFixed(2)}
                        </Typography>
                      )}
                    </Stack>

                    <Stack direction="row" spacing={1} mt={1}>
                      <Chip 
                        label={`🚚 ${t('productDetails.freeShipping')}`} 
                        size="small" 
                        color="success" 
                        variant="outlined"
                      />
                      <Chip 
                        label={`📦 ${t('productDetails.inStock')}`} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                      <Chip 
                        label={`⚡ ${t('productDetails.fastDelivery')}`} 
                        size="small" 
                        color="warning" 
                        variant="outlined"
                      />
                    </Stack>
                  </Stack>
                </Paper>
              </Box>

              {/* Store Info */}
              {store && (
                <Paper sx={{ 
                  p: 2, 
                  bgcolor: (theme) => theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.05)' 
                    : 'grey.50', 
                  borderRadius: 2,
                  border: (theme) => theme.palette.mode === 'dark' 
                    ? '1px solid rgba(255, 255, 255, 0.1)' 
                    : 'none',
                  backdropFilter: (theme) => theme.palette.mode === 'dark' 
                    ? 'blur(10px)' 
                    : 'none',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: (theme) => theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.08)' 
                      : 'grey.100',
                    transform: 'translateY(-1px)',
                    boxShadow: (theme) => theme.palette.mode === 'dark' 
                      ? '0 4px 20px rgba(0, 0, 0, 0.3)' 
                      : '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }
                }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ 
                      bgcolor: (theme) => theme.palette.mode === 'dark' 
                        ? 'linear-gradient(45deg, #64B5F6, #42A5F5)' 
                        : 'primary.main',
                      width: 48,
                      height: 48,
                      boxShadow: (theme) => theme.palette.mode === 'dark' 
                        ? '0 4px 12px rgba(100, 181, 246, 0.3)' 
                        : '0 2px 8px rgba(33, 150, 243, 0.2)'
                    }}>
                      {store.logo ? (
                        <Box 
                          component="img" 
                          src={store.logo} 
                          alt={store.name}
                          sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <StoreIcon sx={{ color: 'white' }} />
                      )}
                    </Avatar>
                    <Box flex={1}>
                      <Typography 
                        variant="subtitle1" 
                        fontWeight={600}
                        sx={{
                          color: (theme) => theme.palette.mode === 'dark' 
                            ? 'rgba(255, 255, 255, 0.9)' 
                            : 'text.primary',
                          fontSize: { xs: '0.9rem', md: '1rem' }
                        }}
                      >
                        {store.name}
                      </Typography>
                      {store.owner && (
                        <Typography 
                          variant="body2" 
                          sx={{
                            color: (theme) => theme.palette.mode === 'dark' 
                              ? 'rgba(255, 255, 255, 0.7)' 
                              : 'text.secondary',
                            fontSize: { xs: '0.75rem', md: '0.875rem' }
                          }}
                        >
                          {t('productDetails.by')} {store.owner.name}
                        </Typography>
                      )}
                    </Box>
                    <Button
                      component={NextLink}
                      href={`/vendors/${store._id}`}
                      variant="outlined"
                      size="small"
                      sx={{
                        borderRadius: 2,
                        px: 2,
                        py: 0.5,
                        fontSize: { xs: '0.75rem', md: '0.875rem' },
                        fontWeight: 600,
                        borderColor: (theme) => theme.palette.mode === 'dark' 
                          ? 'rgba(100, 181, 246, 0.5)' 
                          : 'primary.main',
                        color: (theme) => theme.palette.mode === 'dark' 
                          ? 'rgba(100, 181, 246, 0.9)' 
                          : 'primary.main',
                        bgcolor: (theme) => theme.palette.mode === 'dark' 
                          ? 'rgba(100, 181, 246, 0.1)' 
                          : 'transparent',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          borderColor: (theme) => theme.palette.mode === 'dark' 
                            ? 'rgba(100, 181, 246, 0.8)' 
                            : 'primary.dark',
                          bgcolor: (theme) => theme.palette.mode === 'dark' 
                            ? 'rgba(100, 181, 246, 0.2)' 
                            : 'primary.50',
                          transform: 'translateY(-1px)',
                          boxShadow: (theme) => theme.palette.mode === 'dark' 
                            ? '0 4px 12px rgba(100, 181, 246, 0.3)' 
                            : '0 2px 8px rgba(33, 150, 243, 0.2)'
                        }
                      }}
                    >
                      {t('productDetails.visitStore')}
                    </Button>
                  </Stack>
                </Paper>
              )}

              {/* Product Variants */}
              {(product.variants?.sizes?.length || product.variants?.colors?.length) && (
                <Box>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    {t('productDetails.selectOptions')}
                  </Typography>
                  
                  {/* Size Selection */}
                  {product.variants?.sizes?.length && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {t('productDetails.size')} {selectedSize && `: ${selectedSize}`}
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        {product.variants.sizes.map((size) => (
                          <Chip
                            key={size}
                            label={size}
                            onClick={() => setSelectedSize(size)}
                            variant={selectedSize === size ? "filled" : "outlined"}
                            color={selectedSize === size ? "primary" : "default"}
                            sx={{ 
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                transform: 'scale(1.05)',
                                boxShadow: 2
                              }
                            }}
                          />
                        ))}
                      </Stack>
                    </Box>
                  )}

                  {/* Color Selection */}
                  {product.variants?.colors?.length && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {t('productDetails.color')} {selectedColor && `: ${selectedColor}`}
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        {product.variants.colors.map((color) => (
                          <Chip
                            key={color}
                            label={color}
                            onClick={() => setSelectedColor(color)}
                            variant={selectedColor === color ? "filled" : "outlined"}
                            color={selectedColor === color ? "primary" : "default"}
                            sx={{ 
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                transform: 'scale(1.05)',
                                boxShadow: 2
                              }
                            }}
                          />
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Box>
              )}

              {/* Quantity Selector */}
              <Box>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  {t('productDetails.quantity')}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <IconButton 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    size="small"
                    sx={{ border: '1px solid', borderColor: 'divider' }}
                  >
                    <RemoveIcon />
                  </IconButton>
                  <TextField
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    inputProps={{ 
                      style: { textAlign: 'center' },
                      min: 1,
                      type: 'number'
                    }}
                    sx={{ width: 80 }}
                    size="small"
                  />
                  <IconButton 
                    onClick={() => setQuantity(quantity + 1)}
                    size="small"
                    sx={{ border: '1px solid', borderColor: 'divider' }}
                  >
                    <AddIcon />
                  </IconButton>
                </Stack>
              </Box>

              {/* Bargaining Section - Super Visible */}
              {canUserBargain() && (
                <Paper 
                  elevation={8}
                  sx={{ 
                    p: 3, 
                    bgcolor: 'warning.50', 
                    border: '3px solid', 
                    borderColor: 'warning.main',
                    borderRadius: 4,
                    background: (theme) => theme.palette.mode === 'dark' 
                      ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(251, 191, 36, 0.2) 100%)'
                      : 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(251, 191, 36, 0.15) 100%)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      background: 'linear-gradient(90deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3, #54a0ff)',
                      backgroundSize: '300% 100%',
                      animation: 'gradientMove 3s ease infinite',
                      '@keyframes gradientMove': {
                        '0%': { backgroundPosition: '0% 50%' },
                        '50%': { backgroundPosition: '100% 50%' },
                        '100%': { backgroundPosition: '0% 50%' }
                      }
                    }
                  }}
                >
                  <Stack spacing={2}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: '50%',
                          bgcolor: 'warning.main',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          animation: 'bounce 2s infinite'
                        }}
                      >
                        <BargainIcon sx={{ color: 'white', fontSize: 24 }} />
                      </Box>
                      <Box>
                        <Typography variant="h6" fontWeight={800} color="warning.dark">
                          🔥 {t('productDetails.specialOffer')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" fontWeight={500}>
                          💬 {t('productDetails.bargainFeatures')}
                        </Typography>
                      </Box>
                    </Stack>
                    
                    <Box sx={{ 
                      p: 2, 
                      bgcolor: (theme) => theme.palette.mode === 'dark' 
                        ? 'rgba(255,255,255,0.1)' 
                        : 'rgba(255,255,255,0.7)', 
                      borderRadius: 2,
                      border: '1px dashed',
                      borderColor: 'warning.main'
                    }}>
                      <Typography variant="body2" color="text.primary" fontWeight={600} gutterBottom>
                        🎉 {t('productDetails.whyNegotiate')}
                      </Typography>
                      <Stack direction="row" spacing={2} flexWrap="wrap">
                        <Typography variant="caption" color="success.dark">💰 {t('productDetails.saveMoney')}</Typography>
                        <Typography variant="caption" color="primary.dark">🤝 {t('productDetails.personalService')}</Typography>
                        <Typography variant="caption" color="warning.dark">⚡ {t('productDetails.quickResponses')}</Typography>
                        <Typography variant="caption" color="secondary.dark">🎯 {t('productDetails.bestDeals')}</Typography>
                      </Stack>
                    </Box>

                    <Button
                      variant="contained"
                      size="large"
                      startIcon={existingChatId ? <ChatIcon /> : <BargainIcon />}
                      onClick={handleStartBargaining}
                      sx={{ 
                        bgcolor: 'warning.main',
                        '&:hover': { 
                          bgcolor: 'warning.dark',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 25px rgba(245, 158, 11, 0.5)'
                        },
                        fontWeight: 'bold',
                        py: 2,
                        fontSize: '1.1rem',
                        borderRadius: 3,
                        transition: 'all 0.3s ease',
                        animation: 'glow 2s ease-in-out infinite alternate',
                        '@keyframes glow': {
                          '0%': { boxShadow: '0 4px 20px rgba(245, 158, 11, 0.4)' },
                          '100%': { boxShadow: '0 8px 30px rgba(245, 158, 11, 0.7)' }
                        },
                        '@keyframes bounce': {
                          '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
                          '40%': { transform: 'translateY(-10px)' },
                          '60%': { transform: 'translateY(-5px)' }
                        }
                      }}
                    >
                      {existingChatId ? 
                        `💬 ${t('productDetails.continueNegotiation')}` : 
                        `🚀 ${t('productDetails.startBargainingNow')}`
                      }
                    </Button>
                    
                    {existingChatId && (
                      <Typography variant="caption" color="success.main" fontWeight={600} textAlign="center">
                        ✅ {t('productDetails.activeNegotiation')}
                      </Typography>
                    )}
                  </Stack>
                </Paper>
              )}

              {/* Action Buttons */}
              <Stack spacing={{ xs: 1.5, md: 2 }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={addingToCart ? <CircularProgress size={20} color="inherit" /> : <ShoppingCartIcon />}
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                  sx={{ 
                    borderRadius: 3, 
                    py: { xs: 1.5, md: 2 },
                    fontSize: { xs: '1rem', md: '1.1rem' },
                    fontWeight: 'bold',
                    background: (theme) => theme.palette.mode === 'dark' 
                      ? 'linear-gradient(45deg, #64B5F6, #42A5F5)'
                      : 'linear-gradient(45deg, #2196F3, #21CBF3)',
                    boxShadow: (theme) => theme.palette.mode === 'dark' 
                      ? '0 4px 20px rgba(100, 181, 246, 0.3)'
                      : '0 4px 20px rgba(33, 150, 243, 0.3)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: (theme) => theme.palette.mode === 'dark' 
                        ? '0 8px 25px rgba(100, 181, 246, 0.4)'
                        : '0 8px 25px rgba(33, 150, 243, 0.4)',
                      background: (theme) => theme.palette.mode === 'dark' 
                        ? 'linear-gradient(45deg, #42A5F5, #64B5F6)'
                        : 'linear-gradient(45deg, #1976D2, #2196F3)'
                    }
                  }}
                >
                  {addingToCart ? t('productDetails.adding') : `🛒 ${t('productDetails.addToCart')}`}
                </Button>
                
                <Button
                  variant="outlined"
                  size="large"
                  onClick={handleBuyNow}
                  sx={{ 
                    borderRadius: 3, 
                    py: { xs: 1.5, md: 2 },
                    fontSize: { xs: '1rem', md: '1.1rem' },
                    fontWeight: 'bold',
                    borderWidth: 2,
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderWidth: 2,
                      borderColor: 'primary.dark',
                      bgcolor: 'primary.main',
                      color: 'white',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 6px 20px rgba(33, 150, 243, 0.3)'
                    }
                  }}
                >
                  ⚡ {t('productDetails.buyNow')}
                </Button>

                {/* Enhanced Action Buttons */}
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: { xs: 1.5, md: 2 }, 
                    borderRadius: 3, 
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    backdropFilter: 'blur(10px)',
                    background: (theme) => theme.palette.mode === 'dark' 
                      ? 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
                      : 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)'
                  }}
                >
                  <Typography 
                    variant="subtitle2" 
                    fontWeight={600} 
                    gutterBottom 
                    color="text.secondary" 
                    sx={{ 
                      mb: { xs: 1.5, md: 2 },
                      fontSize: { xs: '0.8rem', md: '0.875rem' }
                    }}
                  >
                    🚀 {t('productDetails.quickActions') || 'Quick Actions'}
                  </Typography>
                  <Stack spacing={{ xs: 1.5, md: 2 }}>
                    <Stack 
                      direction={{ xs: 'column', sm: 'row' }} 
                      spacing={{ xs: 1, sm: 1 }}
                    >
                      <Tooltip title={isWishlisted ? t('productDetails.removeFromWishlist') : t('productDetails.addToWishlist')}>
                        <Button
                          variant={isWishlisted ? "contained" : "outlined"}
                          startIcon={isWishlisted ? <FavoriteFilledIcon /> : <FavoriteIcon />}
                          onClick={handleToggleWishlist}
                          sx={{ 
                            flex: 1,
                            borderRadius: 2,
                            py: { xs: 1, md: 1.5 },
                            fontSize: { xs: '0.8rem', md: '0.875rem' },
                            color: isWishlisted ? 'white' : 'error.main',
                            bgcolor: isWishlisted ? 'error.main' : 'transparent',
                            borderColor: 'error.main',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              bgcolor: isWishlisted ? 'error.dark' : 'error.50',
                              color: isWishlisted ? 'white' : 'error.dark',
                              transform: 'translateY(-2px)',
                              boxShadow: '0 4px 12px rgba(244, 67, 54, 0.3)'
                            }
                          }}
                        >
                          ❤️ {isWishlisted ? t('productDetails.wishlisted') : t('productDetails.save')}
                        </Button>
                      </Tooltip>
                    
                      <Tooltip title={t('productDetails.shareProduct')}>
                        <Button
                          variant="outlined"
                          startIcon={<ShareIcon />}
                          onClick={() => setShareDialogOpen(true)}
                          sx={{ 
                            flex: 1,
                            borderRadius: 2,
                            py: { xs: 1, md: 1.5 },
                            fontSize: { xs: '0.8rem', md: '0.875rem' },
                            color: 'success.main',
                            borderColor: 'success.main',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              bgcolor: 'success.50',
                              color: 'success.dark',
                              transform: 'translateY(-2px)',
                              boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)'
                            }
                          }}
                        >
                          📤 {t('productDetails.share')}
                        </Button>
                      </Tooltip>
                  </Stack>

                    <Stack 
                      direction={{ xs: 'column', sm: 'row' }} 
                      spacing={{ xs: 1, sm: 1 }}
                    >
                      <Tooltip title={isComparing ? t('productDetails.removeFromCompare') : t('productDetails.addToCompare')}>
                        <Button
                          variant={isComparing ? "contained" : "outlined"}
                          startIcon={<CompareIcon />}
                          onClick={handleToggleCompare}
                          sx={{ 
                            flex: 1,
                            borderRadius: 2,
                            py: { xs: 1, md: 1.5 },
                            fontSize: { xs: '0.8rem', md: '0.875rem' },
                            color: isComparing ? 'white' : 'primary.main',
                            bgcolor: isComparing ? 'primary.main' : 'transparent',
                            borderColor: 'primary.main',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              bgcolor: isComparing ? 'primary.dark' : 'primary.50',
                              transform: 'translateY(-2px)',
                              boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)'
                            }
                          }}
                        >
                          ⚖️ {isComparing ? t('productDetails.comparing') : t('productDetails.compare')}
                        </Button>
                      </Tooltip>
                    
                    {(product.inventory === 0 || !product.inventory) && (
                      <Tooltip title={notifyOnStock ? t('productDetails.notifyDisabled') : t('productDetails.notifyEnabled')}>
                        <Button
                          variant={notifyOnStock ? "contained" : "outlined"}
                          startIcon={<NotifyIcon />}
                          onClick={handleNotifyToggle}
                          sx={{ 
                            flex: 1,
                            borderRadius: 2,
                            py: { xs: 1, md: 1.5 },
                            fontSize: { xs: '0.8rem', md: '0.875rem' },
                            color: notifyOnStock ? 'white' : 'warning.main',
                            bgcolor: notifyOnStock ? 'warning.main' : 'transparent',
                            borderColor: 'warning.main',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              bgcolor: notifyOnStock ? 'warning.dark' : 'warning.50',
                              transform: 'translateY(-2px)',
                              boxShadow: '0 4px 12px rgba(255, 193, 7, 0.3)'
                            }
                          }}
                        >
                          🔔 {notifyOnStock ? t('productDetails.notifying') : t('productDetails.notify')}
                        </Button>
                      </Tooltip>
                    )}
                  </Stack>
                </Stack>
                </Paper>
              </Stack>

              {/* Delivery Options */}
              <Paper 
                elevation={0}
                sx={{ 
                  p: { xs: 2, md: 3 }, 
                  borderRadius: 3, 
                  border: '1px solid',
                  borderColor: 'primary.main',
                  bgcolor: 'primary.50',
                  background: (theme) => theme.palette.mode === 'dark' 
                      ? 'linear-gradient(135deg, rgba(100, 181, 246, 0.15) 0%, rgba(66, 165, 245, 0.1) 100%)'
                      : 'linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(33, 150, 243, 0.05) 100%)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <Typography 
                  variant="subtitle1" 
                  fontWeight={700} 
                  gutterBottom 
                  color="primary.main"
                  sx={{ fontSize: { xs: '0.9rem', md: '1rem' } }}
                >
                  🚚 {t('productDetails.deliveryOptions')}
                </Typography>
                <FormControl fullWidth size="small" sx={{ mb: { xs: 1.5, md: 2 } }}>
                  <InputLabel sx={{ fontSize: { xs: '0.8rem', md: '0.875rem' } }}>
                    {t('productDetails.chooseDeliveryOption')}
                  </InputLabel>
                  <Select
                    value={deliveryOption}
                    label={t('productDetails.chooseDeliveryOption')}
                    onChange={(e) => setDeliveryOption(e.target.value)}
                    sx={{ fontSize: { xs: '0.8rem', md: '0.875rem' } }}
                  >
                    <MenuItem value="standard">
                      <Stack 
                        direction={{ xs: 'column', sm: 'row' }} 
                        justifyContent="space-between" 
                        width="100%"
                        spacing={{ xs: 0.5, sm: 1 }}
                      >
                        <span>📦 {t('productDetails.standardShipping')}</span>
                        <span>{t('productDetails.freeDelivery')}</span>
                      </Stack>
                    </MenuItem>
                    <MenuItem value="express">
                      <Stack 
                        direction={{ xs: 'column', sm: 'row' }} 
                        justifyContent="space-between" 
                        width="100%"
                        spacing={{ xs: 0.5, sm: 1 }}
                      >
                        <span>⚡ {t('productDetails.expressShipping')}</span>
                        <span>{t('productDetails.fastDelivery')}</span>
                      </Stack>
                    </MenuItem>
                    <MenuItem value="overnight">
                      <Stack 
                        direction={{ xs: 'column', sm: 'row' }} 
                        justifyContent="space-between" 
                        width="100%"
                        spacing={{ xs: 0.5, sm: 1 }}
                      >
                        <span>🚀 {t('productDetails.overnightShipping')}</span>
                        <span>{t('productDetails.overnightDelivery')}</span>
                      </Stack>
                    </MenuItem>
                  </Select>
                </FormControl>
                
                <Stack spacing={{ xs: 0.5, md: 1 }}>
                  <Stack 
                    direction={{ xs: 'column', sm: 'row' }} 
                    alignItems={{ xs: 'flex-start', sm: 'center' }} 
                    spacing={{ xs: 0.5, sm: 1 }}
                  >
                    <CheckIcon fontSize="small" color="success" />
                    <Typography 
                      variant="caption"
                      sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}
                    >
                      {t('productDetails.freeReturns30Days')}
                    </Typography>
                  </Stack>
                  <Stack 
                    direction={{ xs: 'column', sm: 'row' }} 
                    alignItems={{ xs: 'flex-start', sm: 'center' }} 
                    spacing={{ xs: 0.5, sm: 1 }}
                  >
                    <VerifiedIcon fontSize="small" color="primary" />
                    <Typography 
                      variant="caption"
                      sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}
                    >
                      {t('productDetails.securePackaging')}
                    </Typography>
                  </Stack>
                </Stack>
              </Paper>

              {/* Inventory Status */}
              <Paper 
                elevation={0}
                sx={{ 
                  p: { xs: 2, md: 3 }, 
                  borderRadius: 3,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  backdropFilter: 'blur(10px)',
                  background: (theme) => theme.palette.mode === 'dark' 
                      ? 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
                      : 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)'
                }}
              >
                <Stack spacing={{ xs: 1.5, md: 2 }}>
                  <Stack 
                    direction={{ xs: 'column', sm: 'row' }} 
                    justifyContent="space-between" 
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                    spacing={{ xs: 1, sm: 0 }}
                  >
                    <Typography 
                      variant="subtitle1" 
                      fontWeight={700}
                      sx={{ fontSize: { xs: '0.9rem', md: '1rem' } }}
                    >
                      📊 {t('productDetails.stockStatus')}
                    </Typography>
                    <Chip 
                      label={product.inventory && product.inventory > 0 ? `✅ ${t('productDetails.inStock')}` : `❌ ${t('productDetails.outOfStock')}`}
                      color={product.inventory && product.inventory > 0 ? 'success' : 'error'}
                      variant="filled"
                      sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}
                    />
                  </Stack>
                  
                  {product.inventory && product.inventory > 0 && (
                    <Box>
                      <Stack 
                        direction={{ xs: 'column', sm: 'row' }} 
                        justifyContent="space-between" 
                        alignItems={{ xs: 'flex-start', sm: 'center' }} 
                        mb={1}
                        spacing={{ xs: 0.5, sm: 0 }}
                      >
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                        >
                          {t('productDetails.available')}: {product.inventory} {t('productDetails.units')}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="success.main" 
                          fontWeight={600}
                          sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                        >
                          {product.inventory > 20 ? t('productDetails.highStock') : product.inventory > 5 ? t('productDetails.limitedStock') : t('productDetails.lowStock')}
                        </Typography>
                      </Stack>
                      
                      <LinearProgress 
                        variant="determinate" 
                        value={Math.min((product.inventory / 50) * 100, 100)}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: 'grey.200',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: product.inventory > 20 ? 'success.main' : 
                                    product.inventory > 5 ? 'warning.main' : 'error.main',
                            borderRadius: 3
                          }
                        }}
                      />
                    </Box>
                  )}
                  
                  {product.sku && (
                    <Stack 
                      direction={{ xs: 'column', sm: 'row' }} 
                      justifyContent="space-between"
                      spacing={{ xs: 0.5, sm: 0 }}
                    >
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                      >
                        SKU:
                      </Typography>
                      <Typography 
                        variant="body2" 
                        fontWeight={600}
                        sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                      >
                        {product.sku}
                      </Typography>
                    </Stack>
                  )}
                </Stack>
              </Paper>

              {/* Features */}
              <Paper 
                elevation={0}
                sx={{ 
                  p: { xs: 1.5, md: 2 }, 
                  borderRadius: 3,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  backdropFilter: 'blur(10px)',
                  background: (theme) => theme.palette.mode === 'dark' 
                      ? 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
                      : 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)'
                }}
              >
                <Typography 
                  variant="subtitle2" 
                  fontWeight={600} 
                  gutterBottom 
                  sx={{ 
                    mb: { xs: 1.5, md: 2 },
                    fontSize: { xs: '0.8rem', md: '0.875rem' }
                  }}
                >
                  🛡️ {t('productDetails.productGuarantees')}
                </Typography>
                <Grid container spacing={{ xs: 1.5, md: 2 }}>
                  <Grid item xs={6}>
                    <Stack 
                      direction={{ xs: 'column', sm: 'row' }} 
                      alignItems="center" 
                      spacing={{ xs: 0.5, sm: 1 }}
                    >
                      <ShippingIcon fontSize="small" color="primary" />
                      <Typography 
                        variant="caption"
                        sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}
                      >
                        {t('productDetails.freeShipping')}
                      </Typography>
                    </Stack>
                  </Grid>
                  <Grid item xs={6}>
                    <Stack 
                      direction={{ xs: 'column', sm: 'row' }} 
                      alignItems="center" 
                      spacing={{ xs: 0.5, sm: 1 }}
                    >
                      <SecurityIcon fontSize="small" color="primary" />
                      <Typography 
                        variant="caption"
                        sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}
                      >
                        {t('productDetails.securePayment')}
                      </Typography>
                    </Stack>
                  </Grid>
                  <Grid item xs={6}>
                    <Stack 
                      direction={{ xs: 'column', sm: 'row' }} 
                      alignItems="center" 
                      spacing={{ xs: 0.5, sm: 1 }}
                    >
                      <ReturnIcon fontSize="small" color="primary" />
                      <Typography 
                        variant="caption"
                        sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}
                      >
                        {t('productDetails.easyReturns')}
                      </Typography>
                    </Stack>
                  </Grid>
                  <Grid item xs={6}>
                    <Stack 
                      direction={{ xs: 'column', sm: 'row' }} 
                      alignItems="center" 
                      spacing={{ xs: 0.5, sm: 1 }}
                    >
                      <VerifiedIcon fontSize="small" color="primary" />
                      <Typography 
                        variant="caption"
                        sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}
                      >
                        {t('productDetails.qualityAssured')}
                      </Typography>
                    </Stack>
                  </Grid>
                </Grid>
              </Paper>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Enhanced Product Details Tabs */}
        <Paper 
          elevation={0}
          sx={{ 
            mt: { xs: 3, md: 4 }, 
            borderRadius: 3, 
            overflow: 'hidden',
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            backdropFilter: 'blur(10px)',
            background: (theme) => theme.palette.mode === 'dark' 
                      ? 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
                      : 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)'
          }}
        >
        <Tabs 
          value={tabValue} 
          onChange={(_, value) => setTabValue(value)} 
          sx={{ 
              px: { xs: 1, md: 2 }, 
              bgcolor: 'background.paper',
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0'
              },
              '& .MuiTab-root': {
                fontSize: { xs: '0.75rem', md: '0.875rem' },
                fontWeight: 600,
                minHeight: { xs: 40, md: 48 },
                px: { xs: 1, md: 2 }
            }
          }}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label={`📄 ${t('productDetails.description')}`} />
          <Tab label={`⚙️ ${t('productDetails.specifications')}`} />
          <Tab label={`⭐ ${t('productDetails.reviews')} (${product.rating?.count || 127})`} />
          <Tab label={`❓ FAQ`} />
          <Tab label={`📦 ${t('productDetails.shipping')}`} />
        </Tabs>
        
          <Box sx={{ p: { xs: 2, md: 3 } }}>
          {/* Description Tab */}
          {tabValue === 0 && (
              <Stack spacing={{ xs: 2, md: 3 }}>
              <Box>
                  <Typography 
                    variant="h6" 
                    fontWeight={700} 
                    gutterBottom
                    sx={{ fontSize: { xs: '1.1rem', md: '1.25rem' } }}
                  >
                  {t('productDetails.productDescription')}
                </Typography>
                  <Typography 
                    variant="body1" 
                    color="text.secondary" 
                    lineHeight={1.8}
                    sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
                  >
                  {product.description}
                </Typography>
              </Box>
              
              {/* Key Features */}
              {product.features && product.features.length > 0 && (
                <Box>
                    <Typography 
                      variant="h6" 
                      fontWeight={700} 
                      gutterBottom
                      sx={{ fontSize: { xs: '1.1rem', md: '1.25rem' } }}
                    >
                    🎯 Key Features
                  </Typography>
                  <List>
                    {product.features.map((feature, index) => (
                      <ListItem key={index} disablePadding>
                          <ListItemIcon sx={{ minWidth: { xs: 28, md: 32 } }}>
                          <CheckIcon fontSize="small" color="success" />
                        </ListItemIcon>
                          <ListItemText 
                            primary={feature}
                            sx={{ 
                              '& .MuiListItemText-primary': {
                                fontSize: { xs: '0.875rem', md: '1rem' }
                              }
                            }}
                          />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {/* Tags */}
              {product.tags && product.tags.length > 0 && (
                <Box>
                    <Typography 
                      variant="subtitle1" 
                      fontWeight={600} 
                      gutterBottom
                      sx={{ fontSize: { xs: '0.9rem', md: '1rem' } }}
                    >
                    🏷️ Tags
                  </Typography>
                    <Stack 
                      direction="row" 
                      spacing={{ xs: 0.5, md: 1 }} 
                      flexWrap="wrap"
                    >
                    {product.tags.map((tag, index) => (
                      <Chip 
                        key={index}
                        label={tag}
                        size="small"
                        variant="outlined"
                        color="primary"
                          sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}
                      />
                    ))}
                  </Stack>
                </Box>
              )}
            </Stack>
          )}
          
          {/* Enhanced Specifications Tab */}
          {tabValue === 1 && (
            <Stack spacing={{ xs: 2, md: 3 }}>
              <Typography 
                variant="h6" 
                fontWeight={700} 
                gutterBottom
                sx={{ fontSize: { xs: '1.1rem', md: '1.25rem' } }}
              >
                📋 Detailed Specifications
              </Typography>
              
              {/* Basic Info */}
              <Accordion defaultExpanded>
                <AccordionSummary 
                  expandIcon={<ExpandMoreIcon />}
                  sx={{ 
                    '& .MuiAccordionSummary-content': {
                      fontSize: { xs: '0.9rem', md: '1rem' }
                    }
                  }}
                >
                  <Typography fontWeight={600}>📦 Basic Information</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={{ xs: 1.5, md: 2 }}>
                    <Stack 
                      direction={{ xs: 'column', sm: 'row' }} 
                      justifyContent="space-between"
                      spacing={{ xs: 0.5, sm: 0 }}
                    >
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                      >
                        Category:
                      </Typography>
                      <Typography 
                        variant="body2" 
                        fontWeight={600}
                        sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                      >
                        {product.category}
                      </Typography>
                    </Stack>
                    <Stack 
                      direction={{ xs: 'column', sm: 'row' }} 
                      justifyContent="space-between"
                      spacing={{ xs: 0.5, sm: 0 }}
                    >
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                      >
                        Price:
                      </Typography>
                      <Typography 
                        variant="body2" 
                        fontWeight={600}
                        sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                      >
                        ${product.price.toFixed(2)}
                      </Typography>
                    </Stack>
                    <Stack 
                      direction={{ xs: 'column', sm: 'row' }} 
                      justifyContent="space-between"
                      spacing={{ xs: 0.5, sm: 0 }}
                    >
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                      >
                        Currency:
                      </Typography>
                      <Typography 
                        variant="body2" 
                        fontWeight={600}
                        sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                      >
                        {product.currency || 'USD'}
                      </Typography>
                    </Stack>
                    {product.brand && (
                      <Stack 
                        direction={{ xs: 'column', sm: 'row' }} 
                        justifyContent="space-between"
                        spacing={{ xs: 0.5, sm: 0 }}
                      >
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                        >
                          Brand:
                        </Typography>
                        <Typography 
                          variant="body2" 
                          fontWeight={600}
                          sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                        >
                          {product.brand}
                        </Typography>
                      </Stack>
                    )}
                    {product.condition && (
                      <Stack 
                        direction={{ xs: 'column', sm: 'row' }} 
                        justifyContent="space-between"
                        alignItems={{ xs: 'flex-start', sm: 'center' }}
                        spacing={{ xs: 0.5, sm: 0 }}
                      >
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                        >
                          Condition:
                        </Typography>
                        <Chip 
                          label={product.condition} 
                          size="small" 
                          color="info" 
                          variant="outlined"
                          sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}
                        />
                      </Stack>
                    )}
                  </Stack>
                </AccordionDetails>
              </Accordion>

              {/* Product Variants */}
              {(product.variants?.sizes?.length || product.variants?.colors?.length || product.variants?.weight || product.variants?.dimensions) && (
                <Accordion>
                  <AccordionSummary 
                    expandIcon={<ExpandMoreIcon />}
                    sx={{ 
                      '& .MuiAccordionSummary-content': {
                        fontSize: { xs: '0.9rem', md: '1rem' }
                      }
                    }}
                  >
                    <Typography fontWeight={600}>🎨 Product Variants & Specifications</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={{ xs: 1.5, md: 2 }}>
                      {product.variants?.sizes?.length && (
                        <Box>
                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            gutterBottom
                            sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                          >
                            Available Sizes:
                          </Typography>
                          <Stack 
                            direction="row" 
                            spacing={{ xs: 0.5, md: 1 }} 
                            flexWrap="wrap"
                          >
                            {product.variants.sizes.map((size) => (
                              <Chip 
                                key={size} 
                                label={size} 
                                size="small" 
                                variant="outlined"
                                sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}
                              />
                            ))}
                          </Stack>
                        </Box>
                      )}
                      
                      {product.variants?.colors?.length && (
                        <Box>
                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            gutterBottom
                            sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                          >
                            Available Colors:
                          </Typography>
                          <Stack 
                            direction="row" 
                            spacing={{ xs: 0.5, md: 1 }} 
                            flexWrap="wrap"
                          >
                            {product.variants.colors.map((color) => (
                              <Chip 
                                key={color} 
                                label={color} 
                                size="small" 
                                variant="outlined"
                                sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}
                              />
                            ))}
                          </Stack>
                        </Box>
                      )}
                      
                      {product.variants?.weight && (
                        <Stack 
                          direction={{ xs: 'column', sm: 'row' }} 
                          justifyContent="space-between"
                          spacing={{ xs: 0.5, sm: 0 }}
                        >
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                          >
                            Weight:
                          </Typography>
                          <Typography 
                            variant="body2" 
                            fontWeight={600}
                            sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                          >
                            {product.variants.weight.displayValue || `${product.variants.weight.value}${product.variants.weight.unit}`}
                          </Typography>
                        </Stack>
                      )}
                      
                      {product.variants?.dimensions && (
                        <Stack 
                          direction={{ xs: 'column', sm: 'row' }} 
                          justifyContent="space-between"
                          spacing={{ xs: 0.5, sm: 0 }}
                        >
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                          >
                            Dimensions:
                          </Typography>
                          <Typography 
                            variant="body2" 
                            fontWeight={600}
                            sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                          >
                            {product.variants.dimensions.length} × {product.variants.dimensions.width} × {product.variants.dimensions.height} {product.variants.dimensions.unit}
                          </Typography>
                        </Stack>
                      )}
                      
                      {product.variants?.material && (
                        <Stack 
                          direction={{ xs: 'column', sm: 'row' }} 
                          justifyContent="space-between"
                          spacing={{ xs: 0.5, sm: 0 }}
                        >
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                          >
                            Material:
                          </Typography>
                          <Typography 
                            variant="body2" 
                            fontWeight={600}
                            sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                          >
                            {product.variants.material}
                          </Typography>
                        </Stack>
                      )}
                      
                      {product.variants?.brand && (
                        <Stack 
                          direction={{ xs: 'column', sm: 'row' }} 
                          justifyContent="space-between"
                          spacing={{ xs: 0.5, sm: 0 }}
                        >
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                          >
                            Brand:
                          </Typography>
                          <Typography 
                            variant="body2" 
                            fontWeight={600}
                            sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                          >
                            {product.variants.brand}
                          </Typography>
                        </Stack>
                      )}
                      
                      {product.variants?.sku && (
                        <Stack 
                          direction={{ xs: 'column', sm: 'row' }} 
                          justifyContent="space-between"
                          spacing={{ xs: 0.5, sm: 0 }}
                        >
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                          >
                            SKU:
                          </Typography>
                          <Typography 
                            variant="body2" 
                            fontWeight={600}
                            sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                          >
                            {product.variants.sku}
                          </Typography>
                        </Stack>
                      )}
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              )}

              {/* Physical Details - Fallback for old products */}
              {(product.weight || product.dimensions) && !product.variants && (
                <Accordion>
                  <AccordionSummary 
                    expandIcon={<ExpandMoreIcon />}
                    sx={{ 
                      '& .MuiAccordionSummary-content': {
                        fontSize: { xs: '0.9rem', md: '1rem' }
                      }
                    }}
                  >
                    <Typography fontWeight={600}>📏 Physical Details</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={{ xs: 1.5, md: 2 }}>
                      {product.weight && (
                        <Stack 
                          direction={{ xs: 'column', sm: 'row' }} 
                          justifyContent="space-between"
                          spacing={{ xs: 0.5, sm: 0 }}
                        >
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                          >
                            Weight:
                          </Typography>
                          <Typography 
                            variant="body2" 
                            fontWeight={600}
                            sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                          >
                            {product.weight} kg
                          </Typography>
                        </Stack>
                      )}
                      {product.dimensions && (
                        <Stack 
                          direction={{ xs: 'column', sm: 'row' }} 
                          justifyContent="space-between"
                          spacing={{ xs: 0.5, sm: 0 }}
                        >
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                          >
                            Dimensions:
                          </Typography>
                          <Typography 
                            variant="body2" 
                            fontWeight={600}
                            sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                          >
                            {product.dimensions.length} × {product.dimensions.width} × {product.dimensions.height} cm
                          </Typography>
                        </Stack>
                      )}
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              )}

              {/* Warranty */}
              {product.warranty && (
                <Accordion>
                  <AccordionSummary 
                    expandIcon={<ExpandMoreIcon />}
                    sx={{ 
                      '& .MuiAccordionSummary-content': {
                        fontSize: { xs: '0.9rem', md: '1rem' }
                      }
                    }}
                  >
                    <Typography fontWeight={600}>🛡️ Warranty & Support</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
                    >
                      {product.warranty}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              )}
            </Stack>
          )}
          
          {/* Enhanced Reviews Tab */}
          {tabValue === 2 && (
            <Stack spacing={{ xs: 2, md: 3 }}>
              <Box>
                <Typography 
                  variant="h6" 
                  fontWeight={700} 
                  gutterBottom
                  sx={{ fontSize: { xs: '1.1rem', md: '1.25rem' } }}
                >
                  ⭐ Customer Reviews & Ratings
                </Typography>
                
                {/* Rating Overview */}
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: { xs: 2, md: 3 }, 
                    bgcolor: 'background.paper',
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    backdropFilter: 'blur(10px)',
                    background: (theme) => theme.palette.mode === 'dark' 
                      ? 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
                      : 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                    mb: { xs: 2, md: 3 }
                  }}
                >
                  <Grid container spacing={{ xs: 2, md: 3 }}>
                    <Grid item xs={12} md={4}>
                      <Stack alignItems="center" spacing={1}>
                        <Typography 
                          variant="h2" 
                          fontWeight={800} 
                          color="warning.main"
                          sx={{ fontSize: { xs: '2rem', md: '3rem' } }}
                        >
                          {product.rating?.average || 4.2}
                        </Typography>
                        <Rating 
                          value={product.rating?.average || 4.2} 
                          readOnly 
                          precision={0.1}
                          size="small"
                        />
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                        >
                          Based on {product.rating?.count || 127} reviews
                        </Typography>
                      </Stack>
                    </Grid>
                    
                    <Grid item xs={12} md={8}>
                      <Stack spacing={{ xs: 0.5, md: 1 }}>
                        {[5, 4, 3, 2, 1].map((stars) => (
                          <Stack 
                            key={stars} 
                            direction="row" 
                            alignItems="center" 
                            spacing={{ xs: 0.5, md: 1 }}
                          >
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                minWidth: { xs: 50, md: 60 },
                                fontSize: { xs: '0.75rem', md: '0.875rem' }
                              }}
                            >
                              {stars} stars
                            </Typography>
                            <LinearProgress 
                              variant="determinate" 
                              value={((product.rating?.breakdown?.[stars] || Math.random() * 50) / (product.rating?.count || 127)) * 100}
                              sx={{ 
                                flex: 1, 
                                height: { xs: 4, md: 6 }, 
                                borderRadius: 3 
                              }}
                            />
                            <Typography 
                              variant="body2" 
                              color="text.secondary" 
                              sx={{ 
                                minWidth: { xs: 30, md: 40 },
                                fontSize: { xs: '0.75rem', md: '0.875rem' }
                              }}
                            >
                              {product.rating?.breakdown?.[stars] || Math.floor(Math.random() * 50)}
                            </Typography>
                          </Stack>
                        ))}
                      </Stack>
                    </Grid>
                  </Grid>
                </Paper>
                
                <Typography 
                  variant="body1" 
                  color="text.secondary" 
                  textAlign="center"
                  sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
                >
                  📝 Individual reviews will be displayed here when available
                </Typography>
              </Box>
            </Stack>
          )}
          
          {/* FAQ Tab */}
          {tabValue === 3 && (
            <Stack spacing={{ xs: 1.5, md: 2 }}>
              <Typography 
                variant="h6" 
                fontWeight={700} 
                gutterBottom
                sx={{ fontSize: { xs: '1.1rem', md: '1.25rem' } }}
              >
                ❓ Frequently Asked Questions
              </Typography>
              
              {[
                {
                  question: "What's included in the box?",
                  answer: "The product comes with all standard accessories, user manual, and warranty information."
                },
                {
                  question: "Is this product compatible with...?",
                  answer: "Please check the specifications tab for detailed compatibility information."
                },
                {
                  question: "What's the return policy?",
                  answer: "We offer a 30-day hassle-free return policy. Items must be in original condition."
                },
                {
                  question: "Do you provide technical support?",
                  answer: "Yes, we provide free technical support via chat, email, and phone during business hours."
                },
                {
                  question: "Is there a warranty?",
                  answer: product.warranty || "This product comes with a standard manufacturer warranty."
                }
              ].map((faq, index) => (
                <Accordion key={index}>
                  <AccordionSummary 
                    expandIcon={<ExpandMoreIcon />}
                    sx={{ 
                      '& .MuiAccordionSummary-content': {
                        fontSize: { xs: '0.9rem', md: '1rem' }
                      }
                    }}
                  >
                    <Typography fontWeight={600}>{faq.question}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
                    >
                      {faq.answer}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Stack>
          )}
          
          {/* Shipping Tab */}
          {tabValue === 4 && (
            <Stack spacing={{ xs: 2, md: 3 }}>
              <Typography 
                variant="h6" 
                fontWeight={700} 
                gutterBottom
                sx={{ fontSize: { xs: '1.1rem', md: '1.25rem' } }}
              >
                🚚 Shipping & Delivery Information
              </Typography>
              
              <Grid container spacing={{ xs: 2, md: 3 }}>
                <Grid item xs={12} md={6}>
                  <Paper 
                    elevation={0}
                    sx={{ 
                      p: { xs: 2, md: 3 }, 
                      bgcolor: 'success.50',
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: 'success.main',
                      backdropFilter: 'blur(10px)',
                      background: (theme) => theme.palette.mode === 'dark' 
                      ? 'linear-gradient(135deg, rgba(129, 199, 132, 0.15) 0%, rgba(102, 187, 106, 0.1) 100%)'
                      : 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0.05) 100%)'
                    }}
                  >
                    <Stack spacing={{ xs: 1.5, md: 2 }}>
                      <Typography 
                        variant="subtitle1" 
                        fontWeight={600} 
                        color="success.dark"
                        sx={{ fontSize: { xs: '0.9rem', md: '1rem' } }}
                      >
                        📦 Free Standard Shipping
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
                      >
                        • Delivery in 3-5 business days<br/>
                        • Available nationwide<br/>
                        • Package tracking included<br/>
                        • Signature required
                      </Typography>
                    </Stack>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Paper 
                    elevation={0}
                    sx={{ 
                      p: { xs: 2, md: 3 }, 
                      bgcolor: 'warning.50',
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: 'warning.main',
                      backdropFilter: 'blur(10px)',
                      background: (theme) => theme.palette.mode === 'dark' 
                      ? 'linear-gradient(135deg, rgba(255, 213, 79, 0.15) 0%, rgba(255, 193, 7, 0.1) 100%)'
                      : 'linear-gradient(135deg, rgba(255, 193, 7, 0.1) 0%, rgba(255, 193, 7, 0.05) 100%)'
                    }}
                  >
                    <Stack spacing={{ xs: 1.5, md: 2 }}>
                      <Typography 
                        variant="subtitle1" 
                        fontWeight={600} 
                        color="warning.dark"
                        sx={{ fontSize: { xs: '0.9rem', md: '1rem' } }}
                      >
                        ⚡ Express Options
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
                      >
                        • Express (1-2 days): $9.99<br/>
                        • Overnight: $19.99<br/>
                        • Same-day in select cities<br/>
                        • Priority handling
                      </Typography>
                    </Stack>
                  </Paper>
                </Grid>
              </Grid>
              
              <Divider />
              
              <Box>
                <Typography 
                  variant="subtitle1" 
                  fontWeight={600} 
                  gutterBottom
                  sx={{ fontSize: { xs: '0.9rem', md: '1rem' } }}
                >
                  📋 Important Shipping Notes
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                    <ListItemText 
                      primary="All orders are processed within 1 business day"
                      sx={{ 
                        '& .MuiListItemText-primary': {
                          fontSize: { xs: '0.875rem', md: '1rem' }
                        }
                      }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                    <ListItemText 
                      primary="Free packaging and handling"
                      sx={{ 
                        '& .MuiListItemText-primary': {
                          fontSize: { xs: '0.875rem', md: '1rem' }
                        }
                      }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                    <ListItemText 
                      primary="Secure and eco-friendly packaging"
                      sx={{ 
                        '& .MuiListItemText-primary': {
                          fontSize: { xs: '0.875rem', md: '1rem' }
                        }
                      }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                    <ListItemText 
                      primary="Real-time tracking updates via SMS and email"
                      sx={{ 
                        '& .MuiListItemText-primary': {
                          fontSize: { xs: '0.875rem', md: '1rem' }
                        }
                      }}
                    />
                  </ListItem>
                </List>
              </Box>
            </Stack>
          )}
        </Box>
      </Paper>

      {/* Related Products */}
      <Container maxWidth="lg" sx={{ mt: { xs: 4, md: 6 } }}>
        <Box>
          <Typography 
            variant="h5" 
            fontWeight={700} 
            gutterBottom
            sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}
          >
          {t('productDetails.relatedProducts')}
        </Typography>
        
        {relatedLoading ? (
            <Grid container spacing={{ xs: 1.5, md: 2 }}>
            {[...Array(4)].map((_, i) => (
              <Grid item xs={6} sm={4} md={3} key={i}>
                <Skeleton variant="rectangular" height={150} sx={{ borderRadius: 2 }} />
                <Skeleton variant="text" sx={{ mt: 1 }} />
                <Skeleton variant="text" width="60%" />
              </Grid>
            ))}
          </Grid>
        ) : relatedProducts.length > 0 ? (
            <Grid container spacing={{ xs: 1.5, md: 3 }}>
            {relatedProducts.map((relatedProduct) => (
              <Grid item xs={6} sm={4} md={3} key={relatedProduct._id}>
                <RelatedProductCard product={relatedProduct} router={router} />
              </Grid>
            ))}
          </Grid>
        ) : (
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
            >
            {t('productDetails.noRelatedProducts')}
          </Typography>
        )}
      </Box>

      {/* Recently Viewed Products Section */}
      <Container maxWidth="lg" sx={{ mt: { xs: 4, md: 6 } }}>
        <Box>
          <Typography 
            variant="h5" 
            fontWeight={700} 
            gutterBottom
            sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}
          >
          👁️ Recently Viewed Products
        </Typography>
        <RecentlyViewedProducts currentProductId={productId} />
        </Box>
      </Container>
      </Container>

      {/* Image Dialog */}
      <Dialog
        open={imageDialogOpen}
        onClose={() => setImageDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ 
          sx: { 
            borderRadius: 3,
            maxHeight: '90vh',
            m: { xs: 1, md: 2 }
          } 
        }}
      >
        <DialogTitle>
          <Stack 
            direction="row" 
            justifyContent="space-between" 
            alignItems="center"
          >
            <Typography 
              variant="h6"
              sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}
            >
              {product.title}
            </Typography>
            <IconButton 
              onClick={() => setImageDialogOpen(false)}
              sx={{ 
                width: { xs: 32, md: 40 },
                height: { xs: 32, md: 40 }
              }}
            >
              ×
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center' }}>
            <img
              src={product.images[selectedImageIndex]}
              alt={product.title}
              style={{ 
                maxWidth: '100%', 
                maxHeight: '70vh', 
                objectFit: 'contain',
                borderRadius: 8 
              }}
            />
          </Box>
          {product.images.length > 1 && (
            <Stack 
              direction="row" 
              spacing={{ xs: 0.5, md: 1 }} 
              justifyContent="center" 
              mt={2}
              flexWrap="wrap"
            >
              {product.images.map((_, index) => (
                <Button
                  key={index}
                  variant={selectedImageIndex === index ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setSelectedImageIndex(index)}
                  sx={{ 
                    fontSize: { xs: '0.75rem', md: '0.875rem' },
                    minWidth: { xs: 32, md: 40 },
                    height: { xs: 32, md: 40 }
                  }}
                >
                  {index + 1}
                </Button>
              ))}
            </Stack>
          )}
        </DialogContent>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        sx={{ 
          mb: { xs: 2, md: 3 },
          ml: { xs: 1, md: 2 }
        }}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
          sx={{ 
            borderRadius: 2,
            fontSize: { xs: '0.875rem', md: '1rem' }
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Enhanced Floating Bargain Chat Button - Visible on All Screen Sizes */}
      {canUserBargain() && (
        <>
          {/* Main Floating Button */}
          <Fab
            color="warning"
            onClick={handleStartBargaining}
            sx={{
              position: 'fixed',
              bottom: { xs: 80, md: 120 }, // Higher on desktop to avoid conflicts
              right: { xs: 16, md: 24 },
              zIndex: 1000,
              width: { xs: 56, md: 68 },
              height: { xs: 56, md: 68 },
              bgcolor: 'warning.main',
              boxShadow: '0 8px 25px rgba(245, 158, 11, 0.6)',
              '&:hover': {
                bgcolor: 'warning.dark',
                transform: 'scale(1.15)',
                boxShadow: '0 12px 35px rgba(245, 158, 11, 0.8)'
              },
              animation: 'pulseGlow 2s ease-in-out infinite alternate',
              transition: 'all 0.3s ease',
              '@keyframes pulseGlow': {
                '0%': { 
                  boxShadow: '0 8px 25px rgba(245, 158, 11, 0.6)',
                  transform: 'scale(1)'
                },
                '100%': { 
                  boxShadow: '0 12px 35px rgba(245, 158, 11, 0.9)',
                  transform: 'scale(1.05)'
                }
              }
            }}
          >
            {existingChatId ? <ChatIcon sx={{ fontSize: { xs: 24, md: 28 } }} /> : <BargainIcon sx={{ fontSize: { xs: 24, md: 28 } }} />}
          </Fab>

          {/* Floating Label - Shows on hover/focus */}
          <Paper
            elevation={8}
            sx={{
              position: 'fixed',
              bottom: { xs: 80, md: 120 },
              right: { xs: 80, md: 100 },
              zIndex: 999,
              px: { xs: 1.5, md: 2 },
              py: { xs: 0.5, md: 1 },
              borderRadius: 3,
              bgcolor: 'warning.dark',
              color: 'white',
              fontWeight: 600,
              fontSize: { xs: '0.75rem', md: '0.875rem' },
              whiteSpace: 'nowrap',
              opacity: 0,
              transform: 'translateX(10px)',
              transition: 'all 0.3s ease',
              pointerEvents: 'none',
              '&.show-label': {
                opacity: 1,
                transform: 'translateX(0)'
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                right: -8,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 0,
                height: 0,
                borderLeft: '8px solid',
                borderLeftColor: 'warning.dark',
                borderTop: '6px solid transparent',
                borderBottom: '6px solid transparent'
              }
            }}
            className="bargain-chat-label"
          >
            {existingChatId ? 
              `💬 ${t('productDetails.continueChat') || 'Continue Chat'}` : 
              `🚀 ${t('productDetails.startBargaining') || 'Start Bargaining'}`
            }
          </Paper>

          {/* Enhanced Visual Indicator for Existing Chat */}
          {existingChatId && (
            <Paper
              sx={{
                position: 'fixed',
                bottom: { xs: 135, md: 175 },
                right: { xs: 12, md: 20 },
                zIndex: 1001,
                width: { xs: 20, md: 24 },
                height: { xs: 20, md: 24 },
                borderRadius: '50%',
                bgcolor: 'success.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'notification-pulse 1.5s ease-in-out infinite',
                '@keyframes notification-pulse': {
                  '0%, 100%': { 
                    transform: 'scale(1)',
                    opacity: 1
                  },
                  '50%': { 
                    transform: 'scale(1.2)',
                    opacity: 0.8
                  }
                }
              }}
            >
              <Typography 
                variant="caption" 
                fontWeight="bold" 
                color="white" 
                fontSize={{ xs: '0.7rem', md: '0.75rem' }}
              >
                !
              </Typography>
            </Paper>
          )}

          <style jsx global>{`
            .bargain-fab:hover + .bargain-chat-label,
            .bargain-fab:focus + .bargain-chat-label {
              opacity: 1 !important;
              transform: translateX(0) !important;
            }
          `}</style>
        </>
      )}

      {/* Bargain Chat */}
      <BargainChat
        isOpen={bargainChatOpen}
        onClose={() => setBargainChatOpen(false)}
        productId={!existingChatId ? productId : undefined}
        chatId={existingChatId || undefined}
      />
      </Container>
    </Box>
  );
}

// Recently Viewed Products Component
const RecentlyViewedProducts = ({ currentProductId }: { currentProductId: string }) => {
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([])
  
  useEffect(() => {
    const viewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]')
    // Filter out current product and limit to 4 items
    const filtered = viewed.filter((p: Product) => p.id !== currentProductId).slice(0, 4)
    setRecentlyViewed(filtered)
  }, [currentProductId])
  
  if (recentlyViewed.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No recently viewed products yet
      </Typography>
    )
  }
  
  return (
    <Grid container spacing={3}>
      {recentlyViewed.map((product) => (
        <Grid item xs={6} sm={4} md={3} key={product._id}>
          <RecentlyViewedProductCard product={product} />
        </Grid>
      ))}
    </Grid>
  )
}

// Recently Viewed Product Card Component
const RecentlyViewedProductCard = ({ product }: { product: Product }) => {
  const router = useRouter()
  
  return (
    <Card 
      elevation={0}
      sx={{ 
        height: '100%', 
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        border: '1px solid',
        borderColor: 'divider',
        backdropFilter: 'blur(10px)',
        background: (theme) => theme.palette.mode === 'dark' 
                      ? 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
                      : 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
        }
      }}
      onClick={() => router.push(`/product/${product.id}`)}
    >
      <CardMedia
        component="img"
        height={{ xs: 140, md: 160 }}
        image={product.images?.[0] || '/placeholder-product.jpg'}
        alt={product.title}
        sx={{ objectFit: 'cover' }}
      />
      <CardContent sx={{ p: { xs: 1.5, md: 2 }, pb: '16px !important' }}>
        <Typography 
          variant="body2" 
          fontWeight={600}
          sx={{ 
            mb: 1,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            fontSize: { xs: '0.8rem', md: '0.875rem' }
          }}
        >
          {product.title}
        </Typography>
        <Typography 
          variant="h6" 
          fontWeight={700} 
          color="primary"
          sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}
        >
          ${product.price}
        </Typography>
        {product.rating && (
          <Stack direction="row" alignItems="center" spacing={0.5} mt={1}>
            <Rating 
              size="small" 
              value={product.rating.average} 
              readOnly 
              precision={0.1}
            />
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}
            >
              ({product.rating.count})
            </Typography>
          </Stack>
        )}
      </CardContent>
    </Card>
  )
}