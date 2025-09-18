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
  Breadcrumbs
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
      setError('Failed to search. Please try again.');
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
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Breadcrumb Navigation */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        <NextLink href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <HomeIcon fontSize="small" />
            <Typography color="text.primary">Home</Typography>
          </Stack>
        </NextLink>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <SearchIcon fontSize="small" />
          <Typography color="text.secondary">Search Results</Typography>
        </Stack>
      </Breadcrumbs>

      {/* Search Header */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" alignItems="center" spacing={1} mb={2}>
          <AiIcon color="primary" />
          <Typography variant="h4" fontWeight={700} color="primary.main">
            AI-Powered Search Results
          </Typography>
        </Stack>
        
        {query && (
          <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
            Searching for: <strong>"{query}"</strong>
          </Typography>
        )}

        {/* Search Bar */}
        <AiSearchBar 
          onSearch={handleNewSearch}
          placeholder="🔍 Search for products..."
          showSuggestions={true}
        />
      </Box>

      {/* Loading State */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <Stack alignItems="center" spacing={2}>
            <CircularProgress size={48} />
            <Typography variant="h6" color="text.secondary">
              🤖 AI is searching for the perfect products...
            </Typography>
          </Stack>
        </Box>
      )}

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Search Results */}
      {searchResults && !isLoading && (
        <Box>
          {/* AI Insight */}
          <Card sx={{ mb: 4, border: '2px solid', borderColor: 'primary.main' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <AiIcon color="primary" />
                <Typography variant="h6" fontWeight={700} color="primary.main">
                  🤖 AI Search Analysis
                </Typography>
                {searchResults.fallbackUsed && (
                  <Chip size="small" label="Fallback Mode" color="warning" variant="outlined" />
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
                  label={`🎯 ${products.length} Results`}
                  variant="outlined"
                  color="success"
                />
                {searchResults.totalProductsSearched && (
                  <Chip
                    label={`📊 Analyzed ${searchResults.totalProductsSearched} Products`}
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
                  Recommended Products
                </Typography>
              </Stack>

              <Grid container spacing={3}>
                {products.map((product, index) => {
                  // Try to get AI metadata from the product itself (new backend response)
                  // or fallback to the recommendations array (old method)
                  const aiRelevanceScore = (product as any).aiRelevanceScore || searchResults.recommendations[index]?.relevanceScore || 0;
                  const aiReason = (product as any).aiReason || searchResults.recommendations[index]?.reason || 'AI recommended';
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
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: '0 8px 25px rgba(0,0,0,0.12)',
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
                          
                          <Box sx={{ mb: 2, p: 1.5, bgcolor: 'primary.50', borderRadius: 1, border: '1px solid', borderColor: 'primary.200' }}>
                            <Stack direction="row" alignItems="flex-start" spacing={1}>
                              <AiIcon sx={{ fontSize: '1rem', color: 'primary.main', mt: 0.1, flexShrink: 0 }} />
                              <Typography variant="body2" color="primary.dark" sx={{ fontStyle: 'italic' }}>
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
                              {(Math.random() * 2 + 3).toFixed(1)} ({Math.floor(Math.random() * 100) + 50} reviews)
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
                              Add to Cart
                            </Button>
                            <Button
                              component={NextLink}
                              href={`/product/${product._id}`}
                              variant="outlined"
                              fullWidth
                            >
                              View
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
            <Alert severity="info" sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                No products found
              </Typography>
              <Typography>
                Try searching with different keywords or browse our categories.
              </Typography>
            </Alert>
          )}

          {/* Search Suggestions */}
          {searchResults.suggestions && searchResults.suggestions.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Divider sx={{ mb: 3 }} />
              <Typography variant="h6" fontWeight={600} mb={2}>
                💡 You might also like:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                {searchResults.suggestions.slice(0, 6).map((suggestion) => (
                  <Chip
                    key={suggestion}
                    label={suggestion}
                    clickable
                    onClick={() => handleNewSearch(suggestion)}
                    sx={{
                      bgcolor: 'primary.50',
                      '&:hover': {
                        bgcolor: 'primary.100'
                      }
                    }}
                  />
                ))}
              </Stack>
            </Box>
          )}

          {/* Category Suggestions */}
          {searchResults.categories && searchResults.categories.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="body1" fontWeight={600} mb={2}>
                🗂️ Related Categories:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                {searchResults.categories.map((category) => (
                  <Chip
                    key={category}
                    label={category}
                    variant="outlined"
                    clickable
                    onClick={() => handleNewSearch(`category:${category}`)}
                  />
                ))}
              </Stack>
            </Box>
          )}

          {/* AI Search Tips */}
          {searchResults.searchTips && searchResults.searchTips.length > 0 && (
            <Box sx={{ mt: 4, p: 3, bgcolor: 'info.50', borderRadius: 2, border: '1px solid', borderColor: 'info.200' }}>
              <Typography variant="h6" fontWeight={600} mb={2} color="info.main">
                💡 AI Search Tips
              </Typography>
              <Grid container spacing={1}>
                {searchResults.searchTips.map((tip, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Typography variant="body2" color="info.dark">
                      • {tip}
                    </Typography>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Box>
      )}
    </Container>
  );
}