"use client";
import React from 'react';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Stack,
  Typography,
  Button,
  Grid,
  Chip,
  Rating,
  useTheme,
  useMediaQuery,
  Skeleton,
  Paper,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ShoppingCart as CartIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Star as StarIcon,
  TrendingUp as TrendingIcon,
  LocalOffer as OfferIcon
} from '@mui/icons-material';
import NextLink from 'next/link';
import { formatPrice } from '@utils/currency';
import { addToCart } from '@utils/cart';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

interface Product {
  _id: string;
  title: string;
  description?: string;
  images: string[];
  price: number;
  currency: string;
  category?: string;
  seller?: string;
  rating?: { average: number; count: number };
  sold?: number;
  views?: number;
  tags?: string[];
  condition?: string;
}

interface MostlyPurchasedProductsProps {
  products: Product[];
  loading?: boolean;
}

const ProductCard = ({ 
  product, 
  onAddToCart, 
  onWishlist, 
  router 
}: { 
  product: Product;
  onAddToCart: (productId: string) => void;
  onWishlist?: (productId: string) => void;
  router: any;
}) => {
  const [isWishlisted, setIsWishlisted] = React.useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        borderRadius: 2.5,
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        border: '1px solid',
        borderColor: 'divider',
        backdropFilter: 'blur(10px)',
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
            : 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
          borderColor: 'primary.main'
        }
      }}
    >
      {/* Image Container */}
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '2.5px 2.5px 0 0',
          height: { xs: 180, sm: 200, md: 220 },
          backgroundColor: '#f5f5f5',
          cursor: 'pointer',
          group: 'hover',
          '&:hover img': {
            transform: 'scale(1.05)'
          }
        }}
        onClick={() => router.push(`/product/${product._id}`)}
      >
        <CardMedia
          component="img"
          image={product.images[0] || '/placeholder-product.png'}
          alt={product.title}
          sx={{
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.3s ease'
          }}
        />

        {/* Badge - Trending/Hot */}
        {(product.sold || 0) > 100 && (
          <Chip
            icon={<TrendingIcon sx={{ fontSize: '0.9rem' }} />}
            label="Trending"
            size="small"
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
              color: 'white',
              fontWeight: 700,
              fontSize: '0.65rem',
              height: 24,
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              '& .MuiChip-icon': {
                color: 'white',
                fontSize: '0.85rem'
              }
            }}
          />
        )}

        {/* Wishlist Button */}
        <Tooltip title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}>
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              setIsWishlisted(!isWishlisted);
              onWishlist?.(product._id);
            }}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              color: isWishlisted ? 'error.main' : 'inherit',
              transition: 'all 0.3s ease',
              width: 36,
              height: 36,
              '&:hover': {
                background: 'rgba(255, 255, 255, 1)',
                transform: 'scale(1.1)'
              }
            }}
          >
            {isWishlisted ? (
              <FavoriteIcon sx={{ fontSize: 20 }} />
            ) : (
              <FavoriteBorderIcon sx={{ fontSize: 20 }} />
            )}
          </IconButton>
        </Tooltip>

        {/* Stock Status / Sold Count */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 8,
            left: 8,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(10px)',
            borderRadius: 1.5,
            px: 1,
            py: 0.5
          }}
        >
          <Typography variant="caption" color="white" fontWeight={600}>
            {product.sold || 0} sold
          </Typography>
        </Box>
      </Box>

      {/* Content */}
      <CardContent sx={{ p: { xs: 1.25, sm: 1.5 }, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Product Title */}
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
            fontSize: { xs: '0.8rem', sm: '0.875rem' },
            mb: 0.75
          }}
        >
          {product.title}
        </Typography>

        {/* Rating and Reviews */}
        {product.rating && product.rating.count > 0 && (
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.75 }}>
            <Rating
              value={product.rating.average}
              readOnly
              size="small"
              precision={0.5}
              sx={{ fontSize: '0.8rem' }}
            />
            <Typography variant="caption" color="textSecondary">
              ({product.rating.count})
            </Typography>
          </Stack>
        )}

        {/* Condition Tag */}
        {product.condition && (
          <Chip
            label={product.condition}
            size="small"
            variant="outlined"
            sx={{
              height: 20,
              fontSize: '0.65rem',
              mb: 0.75,
              width: 'fit-content'
            }}
          />
        )}

        {/* Spacer */}
        <Box sx={{ flex: 1 }} />

        {/* Price */}
        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 1 }}>
          <Typography
            variant="h6"
            color="primary.main"
            fontWeight={700}
            sx={{
              fontSize: { xs: '0.95rem', sm: '1.1rem' }
            }}
          >
            {formatPrice(product.price, product.currency || 'USD')}
          </Typography>
        </Stack>

        {/* Add to Cart Button */}
        <Button
          variant="contained"
          color="primary"
          size="small"
          fullWidth
          startIcon={<CartIcon sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }} />}
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart(product._id);
          }}
          sx={{
            py: 0.75,
            fontSize: { xs: '0.75rem', sm: '0.8rem' },
            fontWeight: 600,
            borderRadius: 1.5,
            textTransform: 'none',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }
          }}
        >
          Add to Cart
        </Button>
      </CardContent>
    </Card>
  );
};

export default function MostlyPurchasedProducts({ products, loading = false }: MostlyPurchasedProductsProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleAddToCart = (productId: string) => {
    const product = products.find(p => p._id === productId);
    if (product) {
      addToCart({
        id: product._id,
        title: product.title,
        price: product.price,
        image: product.images[0],
        quantity: 1
      });
    }
  };

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mt: { xs: 2, sm: 3, md: 4 } }}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          p: { xs: 2, sm: 2.5, md: 3 },
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          backdropFilter: 'blur(10px)',
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
              : 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)'
        }}
      >
        {/* Header */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: { xs: 2, sm: 2.5 } }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
                color: 'white'
              }}
            >
              <CartIcon sx={{ fontSize: 20 }} />
            </Box>
            <Typography
              variant="h6"
              fontWeight={700}
              sx={{
                fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
                background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              {t('productDetails.mostlyPurchasedProducts') || 'Most Purchased Products'}
            </Typography>
          </Stack>

          {products.length > 8 && !isMobile && (
            <Button
              component={NextLink}
              href="/collections"
              variant="outlined"
              size="small"
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              View All
            </Button>
          )}
        </Stack>

        <Divider sx={{ mb: { xs: 2, sm: 2.5 } }} />

        {/* Products Grid */}
        {loading ? (
          <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }}>
            {[...Array(4)].map((_, i) => (
              <Grid item xs={6} sm={6} md={3} key={i}>
                <Card
                  sx={{
                    borderRadius: 2.5,
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  <Skeleton
                    variant="rectangular"
                    height={{ xs: 180, sm: 200, md: 220 }}
                  />
                  <CardContent>
                    <Skeleton height={20} sx={{ mb: 1 }} />
                    <Skeleton height={20} width="80%" sx={{ mb: 1.5 }} />
                    <Skeleton variant="rectangular" height={36} />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }}>
            {products.slice(0, 8).map((product) => (
              <Grid item xs={6} sm={6} md={3} key={product._id}>
                <ProductCard
                  product={product}
                  onAddToCart={handleAddToCart}
                  router={router}
                />
              </Grid>
            ))}
          </Grid>
        )}

        {/* View All Mobile Button */}
        {products.length > 4 && isMobile && (
          <Button
            component={NextLink}
            href="/collections"
            variant="outlined"
            fullWidth
            sx={{
              mt: 2,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              py: 1
            }}
          >
            View All Products
          </Button>
        )}
      </Paper>
    </Box>
  );
}