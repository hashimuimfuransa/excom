"use client";
import React, { useState, useEffect, useCallback } from 'react';
import {
  TextField,
  InputAdornment,
  IconButton,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Chip,
  Stack,
  Divider,
  Button,
  CircularProgress,
  Fade,
  Badge
} from '@mui/material';
import {
  Search as SearchIcon,
  AutoAwesome as AiIcon,
  TrendingUp as TrendingIcon,
  Category as CategoryIcon,
  Compare as CompareIcon,
  Close as CloseIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { apiPost } from '@utils/api';
import { getMainImage } from '@utils/imageHelpers';
import NextLink from 'next/link';

interface SearchResult {
  productId: string;
  relevanceScore: number;
  reason: string;
}

interface SmartSearchResponse {
  intent: string;
  recommendations: SearchResult[];
  suggestions: string[];
  priceRange: { min: number; max: number };
  categories: string[];
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

interface AiSearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  showSuggestions?: boolean;
  sx?: any;
}

export default function AiSearchBar({ 
  onSearch, 
  placeholder = "🎯 Ask AI: Find me the perfect product...",
  showSuggestions = true,
  sx = {}
}: AiSearchBarProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SmartSearchResponse | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  // Debounced search function
  const debounce = useCallback((func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }, []);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      // Get user ID from localStorage if available
      const token = localStorage.getItem('excom_token');
      const userId = token ? JSON.parse(atob(token.split('.')[1])).userId : undefined;

      const response = await apiPost<SmartSearchResponse>('/ai/search', {
        query: searchQuery,
        userId
      });

      setSearchResults(response);
      
      // Fetch actual product details for the recommendations
      if (response.recommendations && response.recommendations.length > 0) {
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

      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults(null);
      setProducts([]);
    } finally {
      setIsSearching(false);
    }
  };

  const debouncedSearch = useCallback(debounce(performSearch, 500), []);

  useEffect(() => {
    if (query) {
      debouncedSearch(query);
    } else {
      setShowResults(false);
    }
  }, [query, debouncedSearch]);

  const handleSearch = () => {
    if (onSearch) {
      onSearch(query);
    }
    setShowResults(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    performSearch(suggestion);
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId].slice(0, 3) // Max 3 products for comparison
    );
  };

  const compareProducts = async () => {
    if (selectedProducts.length < 2) return;

    try {
      const comparison = await apiPost('/ai/compare', {
        productIds: selectedProducts
      });
      
      // TODO: Show comparison in a modal or navigate to comparison page
      console.log('Comparison results:', comparison);
      
      // For now, just alert the user
      alert('Comparison results logged to console. Integration with comparison modal pending.');
    } catch (error) {
      console.error('Comparison error:', error);
    }
  };

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      <TextField
        fullWidth
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        size="medium"
        sx={{
          '& .MuiInputBase-root': {
            borderRadius: 3,
            bgcolor: 'background.paper',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            border: '2px solid transparent',
            transition: 'all 0.3s ease',
            '&:hover': {
              border: '2px solid rgba(33, 150, 243, 0.3)',
              transform: 'scale(1.02)'
            },
            '&:focus-within': {
              border: '2px solid #2196F3',
              boxShadow: '0 0 20px rgba(33, 150, 243, 0.3)'
            },
            ...(sx?.['& .MuiInputBase-root'] || {})
          },
          ...(sx?.['& .MuiInputBase-input'] ? { '& .MuiInputBase-input': sx['& .MuiInputBase-input'] } : {}),
          ...Object.fromEntries(
            Object.entries(sx || {}).filter(([key]) => 
              !key.startsWith('& .MuiInputBase-root') && 
              !key.startsWith('& .MuiInputBase-input')
            )
          )
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <AiIcon sx={{ color: 'primary.main', mr: 0.5 }} />
              {isSearching ? (
                <CircularProgress size={20} />
              ) : (
                <SearchIcon color="primary" />
              )}
            </InputAdornment>
          ),
          endAdornment: query && (
            <InputAdornment position="end">
              {selectedProducts.length > 1 && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<CompareIcon />}
                  onClick={compareProducts}
                  sx={{ mr: 1, minWidth: 'auto' }}
                >
                  Compare ({selectedProducts.length})
                </Button>
              )}
              <IconButton size="small" onClick={() => setQuery('')}>
                <CloseIcon />
              </IconButton>
            </InputAdornment>
          )
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleSearch();
          }
        }}
      />

      {/* Search Results Dropdown */}
      <Fade in={showResults && (searchResults || isSearching)}>
        <Paper
          elevation={8}
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            mt: 1,
            zIndex: 1300,
            maxHeight: '500px',
            overflow: 'auto',
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          {searchResults && (
            <Box sx={{ p: 2 }}>
              {/* AI Intent Understanding */}
              <Box sx={{ mb: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                  <AiIcon color="primary" fontSize="small" />
                  <Typography variant="body2" fontWeight={600} color="primary.main">
                    AI Understanding:
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  "{searchResults.intent}"
                </Typography>
              </Box>

              {/* Price Range */}
              {searchResults.priceRange && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    💰 Price Range: ${searchResults.priceRange.min} - ${searchResults.priceRange.max}
                  </Typography>
                </Box>
              )}

              {/* Product Recommendations */}
              {products.length > 0 && (
                <>
                  <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                    <TrendingIcon color="primary" fontSize="small" />
                    <Typography variant="subtitle2" fontWeight={700}>
                      AI-Powered Recommendations
                    </Typography>
                  </Stack>
                  
                  <List sx={{ p: 0 }}>
                    {products.map((product, index) => {
                      const result = searchResults.recommendations[index];
                      const isSelected = selectedProducts.includes(product._id);
                      
                      return (
                        <ListItem
                          key={product._id}
                          component={NextLink}
                          href={`/product/${product._id}`}
                          sx={{
                            borderRadius: 2,
                            mb: 1,
                            border: '1px solid',
                            borderColor: isSelected ? 'primary.main' : 'divider',
                            bgcolor: isSelected ? 'primary.50' : 'transparent',
                            '&:hover': {
                              bgcolor: 'action.hover',
                              transform: 'scale(1.02)'
                            },
                            transition: 'all 0.2s ease',
                            cursor: 'pointer',
                            textDecoration: 'none',
                            color: 'inherit'
                          }}
                          secondaryAction={
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleProductSelection(product._id);
                              }}
                              sx={{
                                bgcolor: isSelected ? 'primary.main' : 'transparent',
                                color: isSelected ? 'white' : 'text.secondary',
                                '&:hover': {
                                  bgcolor: isSelected ? 'primary.dark' : 'action.hover'
                                }
                              }}
                            >
                              {isSelected ? '✓' : '+'}
                            </IconButton>
                          }
                        >
                          <ListItemAvatar>
                            <Badge
                              badgeContent={`${Math.round((result?.relevanceScore || 0) * 100)}%`}
                              color="primary"
                              overlap="circular"
                              anchorOrigin={{
                                vertical: 'top',
                                horizontal: 'right'
                              }}
                            >
                              <Avatar
                                src={getMainImage(product.images, 'product', product._id)}
                                sx={{ width: 60, height: 60 }}
                              />
                            </Badge>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <Typography variant="subtitle2" fontWeight={600} noWrap>
                                  {product.title}
                                </Typography>
                                <Chip
                                  label={product.category}
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontSize: '0.7rem' }}
                                />
                              </Stack>
                            }
                            secondary={
                              <Box>
                                <Typography variant="body2" color="text.secondary" noWrap>
                                  {result?.reason || 'Recommended for you'}
                                </Typography>
                                <Stack direction="row" alignItems="center" spacing={1} mt={0.5}>
                                  <Typography variant="h6" color="primary.main" fontWeight={700}>
                                    ${product.price.toFixed(2)}
                                  </Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <StarIcon sx={{ fontSize: '1rem', color: '#FFD700' }} />
                                    <Typography variant="body2" color="text.secondary">
                                      {(Math.random() * 2 + 3).toFixed(1)}
                                    </Typography>
                                  </Box>
                                </Stack>
                              </Box>
                            }
                          />
                        </ListItem>
                      );
                    })}
                  </List>
                </>
              )}

              {/* Categories */}
              {searchResults.categories && searchResults.categories.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                    <CategoryIcon color="primary" fontSize="small" />
                    <Typography variant="body2" fontWeight={600}>
                      Suggested Categories:
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                    {searchResults.categories.map((category) => (
                      <Chip
                        key={category}
                        label={category}
                        size="small"
                        variant="outlined"
                        clickable
                        onClick={() => handleSuggestionClick(`category:${category}`)}
                      />
                    ))}
                  </Stack>
                </>
              )}

              {/* Search Suggestions */}
              {searchResults.suggestions && searchResults.suggestions.length > 0 && showSuggestions && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" fontWeight={600} mb={1}>
                    💡 Try searching for:
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                    {searchResults.suggestions.slice(0, 4).map((suggestion) => (
                      <Chip
                        key={suggestion}
                        label={suggestion}
                        size="small"
                        clickable
                        onClick={() => handleSuggestionClick(suggestion)}
                        sx={{
                          bgcolor: 'primary.50',
                          '&:hover': {
                            bgcolor: 'primary.100'
                          }
                        }}
                      />
                    ))}
                  </Stack>
                </>
              )}
            </Box>
          )}
        </Paper>
      </Fade>
    </Box>
  );
}