"use client";
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Breadcrumbs,
  Paper,
  Avatar
} from '@mui/material';
import {
  Add as AddIcon,
  Favorite as FavoriteIcon,
  Compare as CompareIcon,
  Share as ShareIcon,
  Star as StarIcon,
  TrendingUp as TrendingIcon,
  AutoAwesome as AiIcon,
  Home as HomeIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useSearchParams, useRouter } from 'next/navigation';
import NextLink from 'next/link';
import { apiPost } from '@utils/api';
import { getMainImage } from '@utils/imageHelpers';
import AiSearchBar from '@/components/AiSearchBar';
import { useTranslation } from 'react-i18next';

interface SearchResult {
  productId: string;
  relevanceScore: number;
  reason: string;
}

interface SmartSearchResponse {
  intent: string;
  recommendations: SearchResult[];
  products?: Product[]; // Add products array from backend
  suggestions: string[];
  priceRange: { 
    min: number; 
    max: number; 
    recommended?: string;
  };
  categories: string[];
  searchTips?: string[];
  totalProductsSearched?: number;
  fallbackUsed?: boolean;
  error?: string;
}

interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  seller?: { name: string };
}

export default function SearchPage() {
  const { t } = useTranslation('common');
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';

  const [searchResults, setSearchResults] = useState<SmartSearchResponse | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (query) {
      performSearch(query);
    }
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError(null);
    
    try {
      // Get user ID from localStorage if available
      const token = localStorage.getItem('excom_token');
      const userId = token ? JSON.parse(atob(token.split('.')[1])).userId : undefined;

      const response = await apiPost<SmartSearchResponse>('/ai/search', {
        query: searchQuery,
        userId
      });

      setSearchResults(response);
      
      // Use products directly from AI search response
      if (response.products && response.products.length > 0) {
        console.log(`Setting ${response.products.length} products from AI search:`, response.products);
        setProducts(response.products);
      } else if (response.recommendations && response.recommendations.length > 0) {
        // Fallback: If no products array but recommendations exist, fetch individually
        console.log('No products in response, fetching individually...');
        const productPromises = response.recommendations.map(async (rec) => {
          try {
            const productResponse = await fetch(`/api/products/${rec.productId}`);
            return productResponse.ok ? await productResponse.json() : null;
          } catch {
            return null;
          }
        });

        const productData = await Promise.all(productPromises);
        setProducts(productData.filter(Boolean));
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setError(t('searchPage.error', 'Failed to search. Please try again.'));
      setSearchResults(null);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewSearch = (newQuery: string) => {
    if (newQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(newQuery)}`);
    }
  };

  const addToCart = async (productId: string) => {
    try {
      await apiPost('/cart/add', {
        productId,
        quantity: 1
      });
      // TODO: Show success message
    } catch (error) {
      console.error('Add to cart error:', error);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50' }}>
      <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
        {/* Modern Breadcrumb Navigation */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
            borderRadius: 2,
            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.800' : 'white',
            border: '1px solid',
            borderColor: (theme) => theme.palette.mode === 'dark' ? 'grey.700' : 'divider'
          }}
        >
          <Breadcrumbs aria-label="breadcrumb">
            <NextLink href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <HomeIcon fontSize="small" />
                <Typography color="text.primary" fontWeight={500}>
                  {t('searchPage.breadcrumb.home', 'Home')}
                </Typography>
              </Stack>
            </NextLink>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <SearchIcon fontSize="small" />
              <Typography color="text.secondary" fontWeight={500}>
                {t('searchPage.breadcrumb.searchResults', 'Search Results')}
              </Typography>
            </Stack>
          </Breadcrumbs>
        </Paper>

        {/* Modern Search Header */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 4 },
            mb: 4,
            borderRadius: 3,
            background: (theme) => theme.palette.mode === 'dark' 
              ? 'linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(33, 203, 243, 0.1) 100%)'
              : 'linear-gradient(135deg, rgba(33, 150, 243, 0.05) 0%, rgba(33, 203, 243, 0.05) 100%)',
            border: '1px solid',
            borderColor: (theme) => theme.palette.mode === 'dark' ? 'grey.700' : 'divider'
          }}
        >
          <Stack direction="row" alignItems="center" spacing={2} mb={3}>
            <Avatar
              sx={{
                bgcolor: 'primary.main',
                background: 'linear-gradient(45deg, #2196F3, #21CBF3)',
                width: 48,
                height: 48
              }}
            >
              <AiIcon sx={{ fontSize: 24 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight={700} color="primary.main">
                {t('searchPage.title', 'AI-Powered Search Results')}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {t('searchPage.intelligentDiscovery', 'Intelligent product discovery powered by AI')}
              </Typography>
            </Box>
          </Stack>
          
          {query && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                {t('searchPage.searchingFor', 'Searching for:')}
              </Typography>
              <Chip
                label={`"${query}"`}
                color="primary"
                variant="outlined"
                sx={{ fontSize: '1rem', fontWeight: 600, px: 2, py: 1 }}
              />
            </Box>
          )}

          {/* Enhanced Search Bar */}
          <Box sx={{ maxWidth: 600 }}>
            <AiSearchBar 
              onSearch={handleNewSearch}
              placeholder={t('searchPage.placeholder', '🔍 Search for products...')}
              showSuggestions={true}
            />
          </Box>
        </Paper>

        {/* Enhanced Loading State */}
        {isLoading && (
          <Paper
            elevation={0}
            sx={{
              p: 6,
              textAlign: 'center',
              borderRadius: 3,
              bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.800' : 'white',
              border: '1px solid',
              borderColor: (theme) => theme.palette.mode === 'dark' ? 'grey.700' : 'divider'
            }}
          >
            <Stack alignItems="center" spacing={3}>
              <CircularProgress 
                size={64} 
                sx={{ 
                  color: 'primary.main',
                  '& .MuiCircularProgress-circle': {
                    strokeLinecap: 'round',
                  }
                }} 
              />
              <Box>
                <Typography variant="h5" fontWeight={600} color="text.primary" mb={1}>
                  {t('searchPage.loading', '🤖 AI is searching for the perfect products...')}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {t('searchPage.analyzingProducts', 'Analyzing products and finding the best matches for you')}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        )}

        {/* Enhanced Error State */}
        {error && (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              borderRadius: 3,
              bgcolor: (theme) => theme.palette.mode === 'dark' ? 'error.dark' : 'error.50',
              border: '1px solid',
              borderColor: (theme) => theme.palette.mode === 'dark' ? 'error.main' : 'error.200'
            }}
          >
            <Alert severity="error" sx={{ bgcolor: 'transparent', border: 'none' }}>
              <Typography variant="h6" fontWeight={600} mb={1}>
                {t('searchPage.searchError', 'Search Error')}
              </Typography>
              <Typography variant="body1">
                {error}
              </Typography>
            </Alert>
          </Paper>
        )}

      {/* Search Results */}
      {searchResults && !isLoading && (
        <Box>
          {/* AI Insight */}
          <Card sx={{ 
            mb: 4, 
            border: '2px solid', 
            borderColor: 'primary.main',
            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.800' : 'white',
            borderRadius: 3
          }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <AiIcon color="primary" />
                <Typography variant="h6" fontWeight={700} color="primary.main">
                  {t('searchPage.aiSearchAnalysis', '🤖 AI Search Analysis')}
                </Typography>
                {searchResults.fallbackUsed && (
                  <Chip size="small" label={t('searchPage.fallbackMode', 'Fallback Mode')} color="warning" variant="outlined" />
                )}
              </Stack>
              
              <Typography variant="body1" sx={{ fontStyle: 'italic', mb: 3 }}>
                "{searchResults.intent}"
              </Typography>
              
              <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" gap={1}>
                {searchResults.priceRange && (
                  <Chip
                    label={`💰 ${searchResults.priceRange.recommended || `$${searchResults.priceRange.min} - $${searchResults.priceRange.max}`}`}
                    variant="outlined"
                    color="primary"
                  />
                )}
                <Chip
                  label={`🎯 ${products.length} ${t('searchPage.results', 'Results')}`}
                  variant="outlined"
                  color="success"
                />
                {searchResults.totalProductsSearched && (
                  <Chip
                    label={`📊 ${t('searchPage.analyzedProducts', 'Analyzed {{count}} Products', { count: searchResults.totalProductsSearched })}`}
                    variant="outlined"
                    color="info"
                    size="small"
                  />
                )}
              </Stack>

              {/* Error Alert */}
              {searchResults.error && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  {searchResults.error}
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Product Results */}
          {products.length > 0 ? (
            <>
              <Stack direction="row" alignItems="center" spacing={1} mb={3}>
                <TrendingIcon color="primary" />
                <Typography variant="h5" fontWeight={700}>
                  {t('searchPage.foundProducts', 'Found Products')} ({products.length})
                </Typography>
              </Stack>

              <Grid container spacing={3}>
                {products.map((product, index) => {
                  // Try to get AI metadata from the product itself (new backend response)
                  // or fallback to the recommendations array (old method)
                  const aiRelevanceScore = (product as any).aiRelevanceScore || searchResults.recommendations[index]?.relevanceScore || 0;
                  const aiReason = (product as any).aiReason || searchResults.recommendations[index]?.reason || t('searchPage.aiRecommended', 'AI recommended');
                  const relevanceScore = Math.round(aiRelevanceScore * 100);
                  
                  return (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={product._id}>
                      <Card 
                        sx={{ 
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          transition: 'all 0.3s ease',
                          border: `2px solid transparent`,
                          bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.800' : 'white',
                          borderRadius: 3,
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: (theme) => theme.palette.mode === 'dark' 
                              ? '0 8px 25px rgba(0,0,0,0.3)' 
                              : '0 8px 25px rgba(0,0,0,0.12)',
                            border: '2px solid',
                            borderColor: 'primary.main'
                          }
                        }}
                      >
                        <Box sx={{ position: 'relative' }}>
                          <CardMedia
                            component="img"
                            height="200"
                            image={getMainImage(product.images, 'product', product._id)}
                            alt={product.title}
                          />
                          <Chip
                            label={`${relevanceScore}% Match`}
                            color="primary"
                            size="small"
                            sx={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              fontWeight: 'bold'
                            }}
                          />
                        </Box>
                        
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Typography gutterBottom variant="h6" component="h3" noWrap>
                            {product.title}
                          </Typography>
                          
                          <Box sx={{ 
                            mb: 2, 
                            p: 1.5, 
                            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'primary.dark' : 'primary.50', 
                            borderRadius: 1, 
                            border: '1px solid', 
                            borderColor: (theme) => theme.palette.mode === 'dark' ? 'primary.main' : 'primary.200' 
                          }}>
                            <Stack direction="row" alignItems="flex-start" spacing={1}>
                              <AiIcon sx={{ fontSize: '1rem', color: 'primary.main', mt: 0.1, flexShrink: 0 }} />
                              <Typography variant="body2" color={(theme) => theme.palette.mode === 'dark' ? 'primary.light' : 'primary.dark'} sx={{ fontStyle: 'italic' }}>
                                {aiReason}
                              </Typography>
                            </Stack>
                          </Box>

                          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                            <Typography variant="h6" color="primary.main" fontWeight={700}>
                              ${product.price.toFixed(2)}
                            </Typography>
                            <Chip label={product.category} size="small" variant="outlined" />
                          </Stack>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}>
                            <StarIcon sx={{ fontSize: '1rem', color: '#FFD700' }} />
                            <Typography variant="body2" color="text.secondary">
                              {(Math.random() * 2 + 3).toFixed(1)} ({Math.floor(Math.random() * 100) + 50} {t('searchPage.reviews', 'reviews')})
                            </Typography>
                          </Box>
                        </CardContent>

                        <CardActions sx={{ p: 2, pt: 0 }}>
                          <Stack direction="row" spacing={1} width="100%">
                            <Button
                              fullWidth
                              variant="contained"
                              startIcon={<AddIcon />}
                              onClick={() => addToCart(product._id)}
                            >
                              {t('searchPage.addToCart', 'Add to Cart')}
                            </Button>
                            <Button
                              component={NextLink}
                              href={`/product/${product._id}`}
                              variant="outlined"
                              fullWidth
                            >
                              {t('searchPage.view', 'View')}
                            </Button>
                          </Stack>
                        </CardActions>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </>
          ) : (
            <Paper
              elevation={0}
              sx={{
                p: 6,
                textAlign: 'center',
                borderRadius: 3,
                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.800' : 'white',
                border: '1px solid',
                borderColor: (theme) => theme.palette.mode === 'dark' ? 'grey.700' : 'divider'
              }}
            >
              <Stack alignItems="center" spacing={3}>
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.700' : 'grey.100',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <SearchIcon sx={{ fontSize: 40, color: (theme) => theme.palette.mode === 'dark' ? 'grey.400' : 'grey.400' }} />
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight={600} color="text.primary" mb={1}>
                    {t('searchPage.noProductsFound', 'No products found')}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" mb={3}>
                    {t('searchPage.tryDifferentKeywords', 'Try searching with different keywords or browse our categories.')}
                  </Typography>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => router.push('/')}
                    sx={{
                      borderRadius: 2,
                      px: 4,
                      py: 1.5,
                      fontWeight: 600
                    }}
                  >
                    {t('searchPage.browseCategories', 'Browse Categories')}
                  </Button>
                </Box>
              </Stack>
            </Paper>
          )}

          {/* Enhanced Search Suggestions */}
          {searchResults.suggestions && searchResults.suggestions.length > 0 && (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                mt: 4,
                borderRadius: 3,
                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.800' : 'white',
                border: '1px solid',
                borderColor: (theme) => theme.palette.mode === 'dark' ? 'grey.700' : 'divider'
              }}
            >
              <Typography variant="h6" fontWeight={700} mb={3} color="text.primary">
                {t('searchPage.youMightAlsoLike', '💡 You might also like:')}
              </Typography>
              <Stack direction="row" spacing={1.5} flexWrap="wrap" gap={1.5}>
                {searchResults.suggestions.slice(0, 6).map((suggestion) => (
                  <Chip
                    key={suggestion}
                    label={suggestion}
                    clickable
                    onClick={() => handleNewSearch(suggestion)}
                    sx={{
                      bgcolor: (theme) => theme.palette.mode === 'dark' ? 'primary.dark' : 'primary.50',
                      color: 'primary.main',
                      fontWeight: 600,
                      px: 2,
                      py: 1,
                      borderRadius: 2,
                      '&:hover': {
                        bgcolor: (theme) => theme.palette.mode === 'dark' ? 'primary.main' : 'primary.100',
                        transform: 'translateY(-1px)'
                      },
                      transition: 'all 0.2s ease'
                    }}
                  />
                ))}
              </Stack>
            </Paper>
          )}

          {/* Enhanced Category Suggestions */}
          {searchResults.categories && searchResults.categories.length > 0 && (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                mt: 3,
                borderRadius: 3,
                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.800' : 'white',
                border: '1px solid',
                borderColor: (theme) => theme.palette.mode === 'dark' ? 'grey.700' : 'divider'
              }}
            >
              <Typography variant="h6" fontWeight={700} mb={3} color="text.primary">
                {t('searchPage.relatedCategories', '🗂️ Related Categories:')}
              </Typography>
              <Stack direction="row" spacing={1.5} flexWrap="wrap" gap={1.5}>
                {searchResults.categories.map((category) => (
                  <Chip
                    key={category}
                    label={category}
                    variant="outlined"
                    clickable
                    onClick={() => handleNewSearch(`category:${category}`)}
                    sx={{
                      fontWeight: 600,
                      px: 2,
                      py: 1,
                      borderRadius: 2,
                      borderColor: 'primary.main',
                      color: 'primary.main',
                      '&:hover': {
                        bgcolor: (theme) => theme.palette.mode === 'dark' ? 'primary.dark' : 'primary.50',
                        transform: 'translateY(-1px)'
                      },
                      transition: 'all 0.2s ease'
                    }}
                  />
                ))}
              </Stack>
            </Paper>
          )}

          {/* Enhanced AI Search Tips */}
          {searchResults.searchTips && searchResults.searchTips.length > 0 && (
            <Paper
              elevation={0}
              sx={{
                mt: 4,
                p: 4,
                borderRadius: 3,
                background: (theme) => theme.palette.mode === 'dark' 
                  ? 'linear-gradient(135deg, rgba(33, 150, 243, 0.15) 0%, rgba(33, 203, 243, 0.15) 100%)'
                  : 'linear-gradient(135deg, rgba(33, 150, 243, 0.05) 0%, rgba(33, 203, 243, 0.05) 100%)',
                border: '1px solid',
                borderColor: (theme) => theme.palette.mode === 'dark' ? 'primary.main' : 'primary.200'
              }}
            >
              <Stack direction="row" alignItems="center" spacing={2} mb={3}>
                <Avatar
                  sx={{
                    bgcolor: 'primary.main',
                    background: 'linear-gradient(45deg, #2196F3, #21CBF3)',
                    width: 40,
                    height: 40
                  }}
                >
                  <AiIcon sx={{ fontSize: 20 }} />
                </Avatar>
                <Typography variant="h6" fontWeight={700} color="primary.main">
                  {t('searchPage.aiSearchTips', '💡 AI Search Tips')}
                </Typography>
              </Stack>
              <Grid container spacing={2}>
                {searchResults.searchTips.map((tip, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Box
                      sx={{
                        p: 2,
                        bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.800' : 'white',
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: (theme) => theme.palette.mode === 'dark' ? 'primary.main' : 'primary.100'
                      }}
                    >
                      <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500 }}>
                        • {tip}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          )}
        </Box>
      )}
    </Container>
    </Box>
  );
}