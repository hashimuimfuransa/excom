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
  Snackbar
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
  Star as StarIcon
} from '@mui/icons-material';
import { apiGet } from '@utils/api';
import { addToCart } from '@utils/cart';
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
  store?: string;
  createdAt?: string;
}

interface Store {
  _id: string;
  name: string;
  logo?: string;
  owner?: { name: string };
}

export default function ProductPage() {
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

  // Fetch product data
  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
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
      setSnackbar({ open: true, message: 'Product not found', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedProducts = async () => {
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
    
    try {
      setAddingToCart(true);
      const cartItem = {
        id: product._id,
        title: product.title,
        price: product.price,
        image: product.images[0],
        quantity
      };
      
      addToCart(cartItem);
      setSnackbar({ 
        open: true, 
        message: `${product.title} added to cart!`, 
        severity: 'success' 
      });
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: 'Failed to add to cart', 
        severity: 'error' 
      });
    } finally {
      setAddingToCart(false);
    }
  }, [product, quantity]);

  const handleBuyNow = useCallback(() => {
    if (!product) return;
    handleAddToCart().then(() => {
      router.push('/cart');
    });
  }, [product, handleAddToCart, router]);

  const ProductImageGallery = () => {
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

  const RelatedProductCard = ({ product: relatedProduct }: { product: Product }) => (
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
        <Typography variant="h5" gutterBottom>Product Not Found</Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          The product you're looking for doesn't exist or has been removed.
        </Typography>
        <Button variant="contained" onClick={() => router.push('/')} sx={{ mt: 2 }}>
          Go Home
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <MLink component={NextLink} href="/" underline="hover" color="inherit">
          Home
        </MLink>
        <MLink component={NextLink} href="/product" underline="hover" color="inherit">
          Products
        </MLink>
        <Typography color="text.primary">{product.category}</Typography>
        <Typography color="text.primary">{product.title}</Typography>
      </Breadcrumbs>

      <Grid container spacing={4}>
        {/* Product Images */}
        <Grid item xs={12} md={6}>
          <ProductImageGallery />
        </Grid>

        {/* Product Info */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3, height: 'fit-content', position: 'sticky', top: 20 }}>
            <Stack spacing={3}>
              {/* Title and Category */}
              <Box>
                <Chip 
                  label={product.category} 
                  size="small" 
                  color="primary" 
                  variant="outlined"
                  sx={{ mb: 1 }}
                />
                <Typography variant="h4" fontWeight={700} gutterBottom>
                  {product.title}
                </Typography>
              </Box>

              {/* Price */}
              <Box>
                <Typography variant="h3" color="primary.main" fontWeight={900}>
                  ${product.price.toFixed(2)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {product.currency || 'USD'}
                </Typography>
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
                          by {store.owner.name}
                        </Typography>
                      )}
                    </Box>
                    <Button
                      component={NextLink}
                      href={`/vendors/${store._id}`}
                      variant="outlined"
                      size="small"
                    >
                      Visit Store
                    </Button>
                  </Stack>
                </Paper>
              )}

              {/* Quantity Selector */}
              <Box>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Quantity
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

              {/* Action Buttons */}
              <Stack spacing={2}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={addingToCart ? <CircularProgress size={20} color="inherit" /> : <ShoppingCartIcon />}
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                  sx={{ borderRadius: 2, py: 1.5 }}
                >
                  {addingToCart ? 'Adding...' : 'Add to Cart'}
                </Button>
                
                <Button
                  variant="outlined"
                  size="large"
                  onClick={handleBuyNow}
                  sx={{ borderRadius: 2, py: 1.5 }}
                >
                  Buy Now
                </Button>
                
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="text"
                    startIcon={<FavoriteIcon />}
                    sx={{ flex: 1 }}
                  >
                    Save
                  </Button>
                  <Button
                    variant="text"
                    startIcon={<ShareIcon />}
                    sx={{ flex: 1 }}
                  >
                    Share
                  </Button>
                </Stack>
              </Stack>

              {/* Features */}
              <Paper sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <ShippingIcon fontSize="small" color="primary" />
                      <Typography variant="caption">Free Shipping</Typography>
                    </Stack>
                  </Grid>
                  <Grid item xs={6}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <SecurityIcon fontSize="small" color="primary" />
                      <Typography variant="caption">Secure Payment</Typography>
                    </Stack>
                  </Grid>
                  <Grid item xs={6}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <ReturnIcon fontSize="small" color="primary" />
                      <Typography variant="caption">Easy Returns</Typography>
                    </Stack>
                  </Grid>
                  <Grid item xs={6}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <StarIcon fontSize="small" color="primary" />
                      <Typography variant="caption">Quality Assured</Typography>
                    </Stack>
                  </Grid>
                </Grid>
              </Paper>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Product Details Tabs */}
      <Paper sx={{ mt: 4, borderRadius: 3 }}>
        <Tabs value={tabValue} onChange={(_, value) => setTabValue(value)} sx={{ px: 2 }}>
          <Tab label="Description" />
          <Tab label="Specifications" />
          <Tab label="Reviews" />
        </Tabs>
        
        <Box sx={{ p: 3 }}>
          {tabValue === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Product Description
              </Typography>
              <Typography variant="body1" color="text.secondary" lineHeight={1.8}>
                {product.description}
              </Typography>
            </Box>
          )}
          
          {tabValue === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Specifications
              </Typography>
              <Stack spacing={1}>
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
              </Stack>
            </Box>
          )}
          
          {tabValue === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Customer Reviews
              </Typography>
              <Typography variant="body2" color="text.secondary">
                No reviews yet. Be the first to review this product!
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Related Products */}
      <Box mt={6}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Related Products
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
                <RelatedProductCard product={relatedProduct} />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No related products found.
          </Typography>
        )}
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
    </Container>
  );
}