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
    sx={{ 
      height: '100%',
      borderRadius: 2,
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
      }
    }}
    onClick={() => router.push(`/product/${relatedProduct._id}`)}
  >
    <CardMedia
      component="img"
      height="150"
      image={relatedProduct.images[0]}
      alt={relatedProduct.title}
      sx={{ objectFit: 'cover' }}
    />
    <CardContent sx={{ p: 2 }}>
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
        }}
      >
        {relatedProduct.title}
      </Typography>
      <Typography variant="h6" color="primary.main" fontWeight={700}>
        ${relatedProduct.price.toFixed(2)}
      </Typography>
    </CardContent>
  </Card>
);

// Product Image Gallery Component
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
    <Paper sx={{ borderRadius: 3, overflow: 'hidden', p: 1 }}>
      {/* Main Image */}
      <Card 
        sx={{ 
          borderRadius: 2, 
          mb: 2, 
          position: 'relative',
          cursor: 'pointer',
          '&:hover .zoom-icon': { opacity: 1 }
        }}
        onClick={() => setImageDialogOpen(true)}
      >
        <CardMedia
          component="img"
          height="400"
          image={product.images[selectedImageIndex]}
          alt={product.title}
          sx={{ objectFit: 'cover' }}
        />
        <IconButton
          className="zoom-icon"
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            bgcolor: 'rgba(255,255,255,0.9)',
            opacity: 0,
            transition: 'opacity 0.3s',
            '&:hover': { bgcolor: 'rgba(255,255,255,1)' }
          }}
        >
          <ZoomInIcon />
        </IconButton>
      </Card>

      {/* Thumbnail Images */}
      {product.images.length > 1 && (
        <Stack direction="row" spacing={1} sx={{ overflowX: 'auto' }}>
          {product.images.map((image, index) => (
            <Card
              key={index}
              sx={{
                minWidth: 60,
                height: 60,
                cursor: 'pointer',
                border: selectedImageIndex === index ? '2px solid' : '1px solid',
                borderColor: selectedImageIndex === index ? 'primary.main' : 'divider',
                borderRadius: 1
              }}
              onClick={() => setSelectedImageIndex(index)}
            >
              <CardMedia
                component="img"
                height="100%"
                image={image}
                alt={`${product.title} ${index + 1}`}
                sx={{ objectFit: 'cover' }}
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
        ...recentlyViewed.filter((p: Product) => p.id !== product.id)
      ].slice(0, 10)
      localStorage.setItem('recentlyViewed', JSON.stringify(updated))

      // Simulate view count increment (would be backend API call)
      setMockProduct(prev => prev ? {
        ...prev,
        viewCount: (prev.viewCount || 0) + 1
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
        severity: 'warning' 
      });
      return;
    }
    
    if (product.variants?.colors?.length && !selectedColor) {
      setSnackbar({ 
        open: true, 
        message: t('productDetails.pleaseSelectColor'), 
        severity: 'warning' 
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
        setSnackbar({ open: true, message: t('productDetails.compareLimit'), severity: 'warning' });
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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Paper sx={{ p: 2, mb: 4, borderRadius: 2, bgcolor: 'grey.50' }}>
        <Breadcrumbs sx={{ fontSize: '0.875rem' }}>
          <MLink 
            component={NextLink} 
            href="/" 
            underline="hover" 
            color="inherit"
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            🏠 {t('productDetails.home')}
          </MLink>
          <MLink 
            component={NextLink} 
            href="/product" 
            underline="hover" 
            color="inherit"
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
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
              maxWidth: 200,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            ✨ {product.title}
          </Typography>
        </Breadcrumbs>
      </Paper>

      <Grid container spacing={4}>
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
            <Box sx={{ mt: 3 }}>
              <Paper sx={{ p: 3, borderRadius: 3, bgcolor: 'background.paper' }}>
                <Stack spacing={2}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="h6" fontWeight={700}>
                      🎯 View in 3D & AR
                    </Typography>
                    <Chip 
                      label={product.modelType?.toUpperCase()} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
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
          <Paper sx={{ p: 3, borderRadius: 3, height: 'fit-content', position: 'sticky', top: 20 }}>
            <Stack spacing={3}>
              {/* Title and Category */}
              <Box>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <Chip 
                    label={product.category} 
                    size="small" 
                    color="primary" 
                    variant="filled"
                    sx={{ 
                      background: 'linear-gradient(45deg, #2196F3, #21CBF3)',
                      fontWeight: 600
                    }}
                  />
                  <Chip 
                    label={`✨ ${t('productDetails.premium')}`}
                    size="small" 
                    color="warning" 
                    variant="outlined"
                    sx={{ fontWeight: 500 }}
                  />
                  {product.bargainingEnabled && (
                    <Chip 
                      label={`💬 ${t('productDetails.negotiable')}`}
                      size="small" 
                      color="success" 
                      variant="outlined"
                      sx={{ fontWeight: 500 }}
                    />
                  )}
                </Stack>
                <Typography 
                  variant="h4" 
                  fontWeight={800} 
                  gutterBottom
                  sx={{
                    background: 'linear-gradient(45deg, #1a1a1a, #4a4a4a)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    lineHeight: 1.2
                  }}
                >
                  {product.title}
                </Typography>
                {/* Enhanced Rating & Social Proof */}
                <Stack spacing={2}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Rating 
                      value={product.rating?.average || 4.2} 
                      precision={0.1} 
                      readOnly 
                      size="small"
                      sx={{ color: 'warning.main' }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      ({product.rating?.average || 4.2}) • {product.rating?.count || 127} {t('productDetails.reviews')}
                    </Typography>
                  </Stack>

                  {/* Social Proof Indicators */}
                  <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <ViewIcon fontSize="small" color="action" />
                      <Typography variant="caption" color="text.secondary">
                        {(product.views || productViews || 245).toLocaleString()} {t('productDetails.views')}
                      </Typography>
                    </Stack>
                    
                    {(product.sold || 0) > 0 && (
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <TrendingIcon fontSize="small" color="success" />
                        <Typography variant="caption" color="success.main" fontWeight={600}>
                          {product.sold} {t('productDetails.soldThisMonth')}
                        </Typography>
                      </Stack>
                    )}
                    
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <TimerIcon fontSize="small" color="warning" />
                      <Typography variant="caption" color="warning.main" fontWeight={600}>
                        ⚡ 23 {t('productDetails.peopleViewingThis')}
                      </Typography>
                    </Stack>
                  </Stack>
                </Stack>
              </Box>

              {/* Price */}
              <Box>
                <Paper sx={{ p: 2, bgcolor: 'primary.50', borderRadius: 2, border: '1px solid', borderColor: 'primary.200' }}>
                  <Stack spacing={1}>
                    <Box display="flex" alignItems="baseline" gap={1}>
                      <Typography 
                        variant="h2" 
                        fontWeight={900}
                        sx={{
                          background: 'linear-gradient(45deg, #2196F3, #21CBF3)',
                          backgroundClip: 'text',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                        }}
                      >
                        ${product.price.toFixed(2)}
                      </Typography>
                      <Typography variant="h6" color="text.secondary" fontWeight={500}>
                        {product.currency || t('productDetails.usd')}
                      </Typography>
                      {product.bargainingEnabled && (
                        <Chip 
                          icon={<BargainIcon />}
                          label={`💬 ${t('productDetails.negotiable')}`} 
                          size="small" 
                          color="warning" 
                          variant="filled"
                          sx={{ ml: 'auto' }}
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
                <Paper sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      {store.logo ? (
                        <Box 
                          component="img" 
                          src={store.logo} 
                          alt={store.name}
                          sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <StoreIcon />
                      )}
                    </Avatar>
                    <Box flex={1}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {store.name}
                      </Typography>
                      {store.owner && (
                        <Typography variant="body2" color="text.secondary">
                          {t('productDetails.by')} {store.owner.name}
                        </Typography>
                      )}
                    </Box>
                    <Button
                      component={NextLink}
                      href={`/vendors/${store._id}`}
                      variant="outlined"
                      size="small"
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
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(251, 191, 36, 0.15) 100%)',
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
                      bgcolor: 'rgba(255,255,255,0.7)', 
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
              <Stack spacing={2}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={addingToCart ? <CircularProgress size={20} color="inherit" /> : <ShoppingCartIcon />}
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                  sx={{ 
                    borderRadius: 3, 
                    py: 2,
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    background: 'linear-gradient(45deg, #2196F3, #21CBF3)',
                    boxShadow: '0 4px 20px rgba(33, 150, 243, 0.3)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(33, 150, 243, 0.4)',
                      background: 'linear-gradient(45deg, #1976D2, #2196F3)'
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
                    py: 2,
                    fontSize: '1.1rem',
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
                <Paper sx={{ p: 2, borderRadius: 3, bgcolor: 'background.paper', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom color="text.secondary" sx={{ mb: 2 }}>
                    🚀 {t('productDetails.quickActions') || 'Quick Actions'}
                  </Typography>
                  <Stack spacing={2}>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title={isWishlisted ? t('productDetails.removeFromWishlist') : t('productDetails.addToWishlist')}>
                        <Button
                          variant={isWishlisted ? "contained" : "outlined"}
                          startIcon={isWishlisted ? <FavoriteFilledIcon /> : <FavoriteIcon />}
                          onClick={handleToggleWishlist}
                          sx={{ 
                            flex: 1,
                            borderRadius: 2,
                            py: 1.5,
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
                            py: 1.5,
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

                  <Stack direction="row" spacing={1}>
                      <Tooltip title={isComparing ? t('productDetails.removeFromCompare') : t('productDetails.addToCompare')}>
                        <Button
                          variant={isComparing ? "contained" : "outlined"}
                          startIcon={<CompareIcon />}
                          onClick={handleToggleCompare}
                          sx={{ 
                            flex: 1,
                            borderRadius: 2,
                            py: 1.5,
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
                            py: 1.5,
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
              <Paper sx={{ p: 3, bgcolor: 'blue.50', borderRadius: 3, border: '1px solid', borderColor: 'blue.200' }}>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom color="primary.main">
                  🚚 {t('productDetails.deliveryOptions')}
                </Typography>
                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel>{t('productDetails.chooseDeliveryOption')}</InputLabel>
                  <Select
                    value={deliveryOption}
                    label={t('productDetails.chooseDeliveryOption')}
                    onChange={(e) => setDeliveryOption(e.target.value)}
                  >
                    <MenuItem value="standard">
                      <Stack direction="row" justifyContent="space-between" width="100%">
                        <span>📦 {t('productDetails.standardShipping')}</span>
                        <span>{t('productDetails.freeDelivery')}</span>
                      </Stack>
                    </MenuItem>
                    <MenuItem value="express">
                      <Stack direction="row" justifyContent="space-between" width="100%">
                        <span>⚡ {t('productDetails.expressShipping')}</span>
                        <span>{t('productDetails.fastDelivery')}</span>
                      </Stack>
                    </MenuItem>
                    <MenuItem value="overnight">
                      <Stack direction="row" justifyContent="space-between" width="100%">
                        <span>🚀 {t('productDetails.overnightShipping')}</span>
                        <span>{t('productDetails.overnightDelivery')}</span>
                      </Stack>
                    </MenuItem>
                  </Select>
                </FormControl>
                
                <Stack spacing={1}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <CheckIcon fontSize="small" color="success" />
                    <Typography variant="caption">{t('productDetails.freeReturns30Days')}</Typography>
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <VerifiedIcon fontSize="small" color="primary" />
                    <Typography variant="caption">{t('productDetails.securePackaging')}</Typography>
                  </Stack>
                </Stack>
              </Paper>

              {/* Inventory Status */}
              <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle1" fontWeight={700}>
                      📊 {t('productDetails.stockStatus')}
                    </Typography>
                    <Chip 
                      label={product.inventory && product.inventory > 0 ? `✅ ${t('productDetails.inStock')}` : `❌ ${t('productDetails.outOfStock')}`}
                      color={product.inventory && product.inventory > 0 ? 'success' : 'error'}
                      variant="filled"
                    />
                  </Stack>
                  
                  {product.inventory && product.inventory > 0 && (
                    <Box>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="body2" color="text.secondary">
                          {t('productDetails.available')}: {product.inventory} {t('productDetails.units')}
                        </Typography>
                        <Typography variant="body2" color="success.main" fontWeight={600}>
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
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">SKU:</Typography>
                      <Typography variant="body2" fontWeight={600}>{product.sku}</Typography>
                    </Stack>
                  )}
                </Stack>
              </Paper>

              {/* Features */}
              <Paper sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
                  🛡️ {t('productDetails.productGuarantees')}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <ShippingIcon fontSize="small" color="primary" />
                      <Typography variant="caption">{t('productDetails.freeShipping')}</Typography>
                    </Stack>
                  </Grid>
                  <Grid item xs={6}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <SecurityIcon fontSize="small" color="primary" />
                      <Typography variant="caption">{t('productDetails.securePayment')}</Typography>
                    </Stack>
                  </Grid>
                  <Grid item xs={6}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <ReturnIcon fontSize="small" color="primary" />
                      <Typography variant="caption">{t('productDetails.easyReturns')}</Typography>
                    </Stack>
                  </Grid>
                  <Grid item xs={6}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <VerifiedIcon fontSize="small" color="primary" />
                      <Typography variant="caption">{t('productDetails.qualityAssured')}</Typography>
                    </Stack>
                  </Grid>
                </Grid>
              </Paper>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Enhanced Product Details Tabs */}
      <Paper sx={{ mt: 4, borderRadius: 3, overflow: 'hidden' }}>
        <Tabs 
          value={tabValue} 
          onChange={(_, value) => setTabValue(value)} 
          sx={{ 
            px: 2, 
            bgcolor: 'grey.50',
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0'
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
        
        <Box sx={{ p: 3 }}>
          {/* Description Tab */}
          {tabValue === 0 && (
            <Stack spacing={3}>
              <Box>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  {t('productDetails.productDescription')}
                </Typography>
                <Typography variant="body1" color="text.secondary" lineHeight={1.8}>
                  {product.description}
                </Typography>
              </Box>
              
              {/* Key Features */}
              {product.features && product.features.length > 0 && (
                <Box>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    🎯 Key Features
                  </Typography>
                  <List>
                    {product.features.map((feature, index) => (
                      <ListItem key={index} disablePadding>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <CheckIcon fontSize="small" color="success" />
                        </ListItemIcon>
                        <ListItemText primary={feature} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {/* Tags */}
              {product.tags && product.tags.length > 0 && (
                <Box>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    🏷️ Tags
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {product.tags.map((tag, index) => (
                      <Chip 
                        key={index}
                        label={tag}
                        size="small"
                        variant="outlined"
                        color="primary"
                      />
                    ))}
                  </Stack>
                </Box>
              )}
            </Stack>
          )}
          
          {/* Enhanced Specifications Tab */}
          {tabValue === 1 && (
            <Stack spacing={3}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                📋 Detailed Specifications
              </Typography>
              
              {/* Basic Info */}
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography fontWeight={600}>📦 Basic Information</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={2}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">Category:</Typography>
                      <Typography variant="body2" fontWeight={600}>{product.category}</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">Price:</Typography>
                      <Typography variant="body2" fontWeight={600}>${product.price.toFixed(2)}</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">Currency:</Typography>
                      <Typography variant="body2" fontWeight={600}>{product.currency || 'USD'}</Typography>
                    </Stack>
                    {product.brand && (
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">Brand:</Typography>
                        <Typography variant="body2" fontWeight={600}>{product.brand}</Typography>
                      </Stack>
                    )}
                    {product.condition && (
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">Condition:</Typography>
                        <Chip label={product.condition} size="small" color="info" variant="outlined" />
                      </Stack>
                    )}
                  </Stack>
                </AccordionDetails>
              </Accordion>

              {/* Product Variants */}
              {(product.variants?.sizes?.length || product.variants?.colors?.length || product.variants?.weight || product.variants?.dimensions) && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography fontWeight={600}>🎨 Product Variants & Specifications</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={2}>
                      {product.variants?.sizes?.length && (
                        <Box>
                          <Typography variant="body2" color="text.secondary" gutterBottom>Available Sizes:</Typography>
                          <Stack direction="row" spacing={1} flexWrap="wrap">
                            {product.variants.sizes.map((size) => (
                              <Chip key={size} label={size} size="small" variant="outlined" />
                            ))}
                          </Stack>
                        </Box>
                      )}
                      
                      {product.variants?.colors?.length && (
                        <Box>
                          <Typography variant="body2" color="text.secondary" gutterBottom>Available Colors:</Typography>
                          <Stack direction="row" spacing={1} flexWrap="wrap">
                            {product.variants.colors.map((color) => (
                              <Chip key={color} label={color} size="small" variant="outlined" />
                            ))}
                          </Stack>
                        </Box>
                      )}
                      
                      {product.variants?.weight && (
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">Weight:</Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {product.variants.weight.displayValue || `${product.variants.weight.value}${product.variants.weight.unit}`}
                          </Typography>
                        </Stack>
                      )}
                      
                      {product.variants?.dimensions && (
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">Dimensions:</Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {product.variants.dimensions.length} × {product.variants.dimensions.width} × {product.variants.dimensions.height} {product.variants.dimensions.unit}
                          </Typography>
                        </Stack>
                      )}
                      
                      {product.variants?.material && (
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">Material:</Typography>
                          <Typography variant="body2" fontWeight={600}>{product.variants.material}</Typography>
                        </Stack>
                      )}
                      
                      {product.variants?.brand && (
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">Brand:</Typography>
                          <Typography variant="body2" fontWeight={600}>{product.variants.brand}</Typography>
                        </Stack>
                      )}
                      
                      {product.variants?.sku && (
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">SKU:</Typography>
                          <Typography variant="body2" fontWeight={600}>{product.variants.sku}</Typography>
                        </Stack>
                      )}
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              )}

              {/* Physical Details - Fallback for old products */}
              {(product.weight || product.dimensions) && !product.variants && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography fontWeight={600}>📏 Physical Details</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={2}>
                      {product.weight && (
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">Weight:</Typography>
                          <Typography variant="body2" fontWeight={600}>{product.weight} kg</Typography>
                        </Stack>
                      )}
                      {product.dimensions && (
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">Dimensions:</Typography>
                          <Typography variant="body2" fontWeight={600}>
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
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography fontWeight={600}>🛡️ Warranty & Support</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" color="text.secondary">
                      {product.warranty}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              )}
            </Stack>
          )}
          
          {/* Enhanced Reviews Tab */}
          {tabValue === 2 && (
            <Stack spacing={3}>
              <Box>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  ⭐ Customer Reviews & Ratings
                </Typography>
                
                {/* Rating Overview */}
                <Paper sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2, mb: 3 }}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                      <Stack alignItems="center" spacing={1}>
                        <Typography variant="h2" fontWeight={800} color="warning.main">
                          {product.rating?.average || 4.2}
                        </Typography>
                        <Rating value={product.rating?.average || 4.2} readOnly precision={0.1} />
                        <Typography variant="body2" color="text.secondary">
                          Based on {product.rating?.count || 127} reviews
                        </Typography>
                      </Stack>
                    </Grid>
                    
                    <Grid item xs={12} md={8}>
                      <Stack spacing={1}>
                        {[5, 4, 3, 2, 1].map((stars) => (
                          <Stack key={stars} direction="row" alignItems="center" spacing={1}>
                            <Typography variant="body2" sx={{ minWidth: 60 }}>
                              {stars} stars
                            </Typography>
                            <LinearProgress 
                              variant="determinate" 
                              value={((product.rating?.breakdown?.[stars] || Math.random() * 50) / (product.rating?.count || 127)) * 100}
                              sx={{ flex: 1, height: 6, borderRadius: 3 }}
                            />
                            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 40 }}>
                              {product.rating?.breakdown?.[stars] || Math.floor(Math.random() * 50)}
                            </Typography>
                          </Stack>
                        ))}
                      </Stack>
                    </Grid>
                  </Grid>
                </Paper>
                
                <Typography variant="body1" color="text.secondary" textAlign="center">
                  📝 Individual reviews will be displayed here when available
                </Typography>
              </Box>
            </Stack>
          )}
          
          {/* FAQ Tab */}
          {tabValue === 3 && (
            <Stack spacing={2}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
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
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography fontWeight={600}>{faq.question}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" color="text.secondary">
                      {faq.answer}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Stack>
          )}
          
          {/* Shipping Tab */}
          {tabValue === 4 && (
            <Stack spacing={3}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                🚚 Shipping & Delivery Information
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3, bgcolor: 'success.50', borderRadius: 2 }}>
                    <Stack spacing={2}>
                      <Typography variant="subtitle1" fontWeight={600} color="success.dark">
                        📦 Free Standard Shipping
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        • Delivery in 3-5 business days<br/>
                        • Available nationwide<br/>
                        • Package tracking included<br/>
                        • Signature required
                      </Typography>
                    </Stack>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3, bgcolor: 'warning.50', borderRadius: 2 }}>
                    <Stack spacing={2}>
                      <Typography variant="subtitle1" fontWeight={600} color="warning.dark">
                        ⚡ Express Options
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
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
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  📋 Important Shipping Notes
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                    <ListItemText primary="All orders are processed within 1 business day" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                    <ListItemText primary="Free packaging and handling" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                    <ListItemText primary="Secure and eco-friendly packaging" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                    <ListItemText primary="Real-time tracking updates via SMS and email" />
                  </ListItem>
                </List>
              </Box>
            </Stack>
          )}
        </Box>
      </Paper>

      {/* Related Products */}
      <Box mt={6}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          {t('productDetails.relatedProducts')}
        </Typography>
        
        {relatedLoading ? (
          <Grid container spacing={2}>
            {[...Array(4)].map((_, i) => (
              <Grid item xs={6} sm={4} md={3} key={i}>
                <Skeleton variant="rectangular" height={150} sx={{ borderRadius: 2 }} />
                <Skeleton variant="text" sx={{ mt: 1 }} />
                <Skeleton variant="text" width="60%" />
              </Grid>
            ))}
          </Grid>
        ) : relatedProducts.length > 0 ? (
          <Grid container spacing={3}>
            {relatedProducts.map((relatedProduct) => (
              <Grid item xs={6} sm={4} md={3} key={relatedProduct._id}>
                <RelatedProductCard product={relatedProduct} router={router} />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Typography variant="body2" color="text.secondary">
            {t('productDetails.noRelatedProducts')}
          </Typography>
        )}
      </Box>

      {/* Recently Viewed Products Section */}
      <Box sx={{ mt: 6 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          👁️ Recently Viewed Products
        </Typography>
        <RecentlyViewedProducts currentProductId={productId} />
      </Box>

      {/* Image Dialog */}
      <Dialog
        open={imageDialogOpen}
        onClose={() => setImageDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">{product.title}</Typography>
            <IconButton onClick={() => setImageDialogOpen(false)}>
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
            <Stack direction="row" spacing={1} justifyContent="center" mt={2}>
              {product.images.map((_, index) => (
                <Button
                  key={index}
                  variant={selectedImageIndex === index ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setSelectedImageIndex(index)}
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
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
          sx={{ borderRadius: 2 }}
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
              right: { xs: 20, md: 30 },
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
              right: { xs: 90, md: 120 },
              zIndex: 999,
              px: 2,
              py: 1,
              borderRadius: 3,
              bgcolor: 'warning.dark',
              color: 'white',
              fontWeight: 600,
              fontSize: '0.875rem',
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
                right: { xs: 15, md: 25 },
                zIndex: 1001,
                width: 24,
                height: 24,
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
              <Typography variant="caption" fontWeight="bold" color="white" fontSize="0.75rem">
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
      sx={{ 
        height: '100%', 
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4
        }
      }}
      onClick={() => router.push(`/product/${product.id}`)}
    >
      <CardMedia
        component="img"
        height="160"
        image={product.images?.[0] || '/placeholder-product.jpg'}
        alt={product.title}
        sx={{ objectFit: 'cover' }}
      />
      <CardContent sx={{ p: 2, pb: '16px !important' }}>
        <Typography 
          variant="body2" 
          fontWeight={600}
          sx={{ 
            mb: 1,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {product.title}
        </Typography>
        <Typography variant="h6" fontWeight={700} color="primary">
          ${product.price}
        </Typography>
        {product.rating && (
          <Stack direction="row" alignItems="center" spacing={0.5} mt={1}>
            <Rating size="small" value={product.rating.average} readOnly precision={0.1} />
            <Typography variant="caption" color="text.secondary">
              ({product.rating.count})
            </Typography>
          </Stack>
        )}
      </CardContent>
    </Card>
  )
}