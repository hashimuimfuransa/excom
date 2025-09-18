"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
  Stack,
  Avatar,
  Chip,
  Paper,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Divider,
  IconButton,
  Breadcrumbs,
  Link as MLink,
  Tabs,
  Tab,
  Alert
} from '@mui/material';
import {
  Store as StoreIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Category as CategoryIcon,
  ArrowBack as ArrowBackIcon,
  ShoppingCart as ShoppingCartIcon
} from '@mui/icons-material';
import { apiGet } from '@utils/api';
import NextLink from 'next/link';

interface Store {
  _id: string;
  name: string;
  description?: string;
  logo?: string;
  banner?: string;
  category?: string;
  owner?: { name: string; email: string };
  createdAt?: string;
}

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

export default function StoreDetailPage() {
  const params = useParams();
  const storeId = params.id as string;
  
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [productsLoading, setProductsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStore();
    fetchProducts();
  }, [storeId]);

  const fetchStore = async () => {
    try {
      setLoading(true);
      setError(null);
      const storeData = await apiGet<Store>(`/sellers/public/stores/${storeId}`);
      setStore(storeData);
    } catch (error: any) {
      setError('Store not found or unavailable');
      console.error('Failed to fetch store:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      const productsData = await apiGet<ProductsResponse>(`/products/store/${storeId}`);
      setProducts(productsData.products);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  const ProductCard = ({ product }: { product: Product }) => (
    <Card 
      sx={{ 
        height: '100%',
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
          borderColor: 'primary.main'
        }
      }}
    >
      <CardMedia
        component="img"
        height="200"
        image={product.images[0] || '/api/placeholder/300/200'}
        alt={product.title}
        sx={{ objectFit: 'cover' }}
      />
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            {product.title}
          </Typography>
          
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
          
          <Box>
            <Typography variant="h6" color="primary.main" fontWeight={700}>
              ${product.price.toFixed(2)} {product.currency}
            </Typography>
            <Chip 
              label={product.category}
              size="small"
              variant="outlined"
              sx={{ mt: 1 }}
            />
          </Box>
          
          <Button
            component={NextLink}
            href={`/product/${product._id}`}
            variant="contained"
            fullWidth
            startIcon={<ShoppingCartIcon />}
            sx={{ borderRadius: 2, mt: 'auto' }}
          >
            View Product
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary">
            Loading store...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error || !store) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box textAlign="center" py={8}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error || 'Store not found'}
          </Alert>
          <Button
            component={NextLink}
            href="/vendors"
            variant="contained"
            startIcon={<ArrowBackIcon />}
          >
            Back to Vendors
          </Button>
        </Box>
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
        <MLink component={NextLink} href="/vendors" underline="hover" color="inherit">
          Vendors
        </MLink>
        <Typography color="text.primary">{store.name}</Typography>
      </Breadcrumbs>

      {/* Store Banner */}
      {store.banner && (
        <Paper 
          sx={{ 
            height: 250, 
            borderRadius: 3, 
            mb: 4, 
            overflow: 'hidden',
            backgroundImage: `url(${store.banner})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            alignItems: 'end'
          }}
        >
          <Box 
            sx={{ 
              width: '100%', 
              background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
              p: 3 
            }}
          >
            <Typography variant="h4" color="white" fontWeight={700}>
              {store.name}
            </Typography>
          </Box>
        </Paper>
      )}

      {/* Store Info */}
      <Paper sx={{ p: 4, borderRadius: 3, mb: 4 }}>
        <Stack spacing={3}>
          <Stack direction="row" alignItems="center" spacing={3}>
            <Avatar 
              sx={{ 
                width: 80, 
                height: 80,
                bgcolor: 'primary.main'
              }}
            >
              {store.logo ? (
                <Box 
                  component="img" 
                  src={store.logo} 
                  alt={store.name}
                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <StoreIcon fontSize="large" />
              )}
            </Avatar>
            
            <Box flex={1}>
              {!store.banner && (
                <Typography variant="h4" fontWeight={700} gutterBottom>
                  {store.name}
                </Typography>
              )}
              
              <Stack direction="row" spacing={2} flexWrap="wrap">
                {store.category && (
                  <Chip 
                    icon={<CategoryIcon />}
                    label={store.category}
                    color="primary"
                    variant="outlined"
                  />
                )}
                {store.owner && (
                  <Chip 
                    icon={<PersonIcon />}
                    label={`By ${store.owner.name}`}
                    variant="outlined"
                  />
                )}
              </Stack>
            </Box>
          </Stack>

          {store.description && (
            <>
              <Divider />
              <Typography variant="body1" color="text.secondary" lineHeight={1.7}>
                {store.description}
              </Typography>
            </>
          )}

          {store.owner?.email && (
            <>
              <Divider />
              <Stack direction="row" alignItems="center" spacing={2}>
                <EmailIcon color="action" />
                <Typography variant="body2" color="text.secondary">
                  Contact: {store.owner.email}
                </Typography>
              </Stack>
            </>
          )}
        </Stack>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ borderRadius: 3, mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          sx={{ px: 2 }}
        >
          <Tab label={`Products (${products.length})`} />
          <Tab label="About" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* Products Tab */}
          {tabValue === 0 && (
            <>
              {productsLoading ? (
                <Box textAlign="center" py={4}>
                  <Typography variant="body1" color="text.secondary">
                    Loading products...
                  </Typography>
                </Box>
              ) : products.length === 0 ? (
                <Box textAlign="center" py={8}>
                  <Typography variant="h6" gutterBottom>
                    No products yet
                  </Typography>
                  <Typography color="text.secondary">
                    This store hasn't added any products yet. Check back later!
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={3}>
                  {products.map((product) => (
                    <Grid item xs={12} sm={6} md={4} key={product._id}>
                      <ProductCard product={product} />
                    </Grid>
                  ))}
                </Grid>
              )}
            </>
          )}

          {/* About Tab */}
          {tabValue === 1 && (
            <Stack spacing={3}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  About {store.name}
                </Typography>
                <Typography variant="body1" color="text.secondary" lineHeight={1.7}>
                  {store.description || 'No additional information available.'}
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="h6" gutterBottom>
                  Store Details
                </Typography>
                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Category:
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {store.category || 'Not specified'}
                    </Typography>
                  </Stack>
                  
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Owner:
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {store.owner?.name || 'Not specified'}
                    </Typography>
                  </Stack>
                  
                  {store.createdAt && (
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Joined:
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {new Date(store.createdAt).toLocaleDateString()}
                      </Typography>
                    </Stack>
                  )}
                </Stack>
              </Box>
            </Stack>
          )}
        </Box>
      </Paper>

      {/* Back Button */}
      <Box textAlign="center">
        <Button
          component={NextLink}
          href="/vendors"
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          size="large"
          sx={{ borderRadius: 2 }}
        >
          Back to All Vendors
        </Button>
      </Box>
    </Container>
  );
}