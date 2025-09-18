"use client";
import React, { useEffect, useMemo, useState } from 'react';
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
  Divider
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
import NextLink from 'next/link';
import { apiGet } from '@utils/api';
import ProductFilters, { Filters } from './filters';
import { getMainImage, hasRealImages } from '@utils/imageHelpers';

interface Product {
  _id: string;
  title: string;
  images: string[];
  price: number;
  category?: string;
  description?: string;
  seller?: {
    name: string;
    _id: string;
  };
  createdAt?: string;
  rating?: number;
  reviewCount?: number;
}

type SortOption = 'newest' | 'price-low' | 'price-high' | 'rating' | 'popularity';
type ViewMode = 'grid' | 'list';

export default function ProductListPage() {
  const [items, setItems] = useState<Product[] | null>(null);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Filters>({});
  const [open, setOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showScrollTop, setShowScrollTop] = useState(false);
  const itemsPerPage = 12;
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    let alive = true;
    apiGet<Product[]>("/products").then((list) => {
      if (!alive) return;
      setItems(list);
    }).catch(() => setItems([]));
    return () => { alive = false; };
  }, []);

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

    // Sort products
    result.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'rating':
          return (b.rating || 4.5) - (a.rating || 4.5);
        case 'popularity':
          return (b.reviewCount || 0) - (a.reviewCount || 0);
        case 'newest':
        default:
          return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
      }
    });

    return result;
  }, [items, query, filters, sortBy]);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filtered.slice(startIndex, startIndex + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const toggleFavorite = (productId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(productId)) {
        newFavorites.delete(productId);
      } else {
        newFavorites.add(productId);
      }
      return newFavorites;
    });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <Container sx={{ py: 4 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 3 }}>
          <MuiLink component={NextLink} href="/" color="inherit" underline="hover">
            Home
          </MuiLink>
          <Typography color="text.primary" fontWeight={600}>Products</Typography>
        </Breadcrumbs>

        {/* Header with title and search */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            Discover Products
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Find amazing products from trusted sellers worldwide
          </Typography>
          
          <Paper
            elevation={0}
            sx={{
              p: 3,
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)'
                : 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%)',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              borderRadius: 3
            }}
          >
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              alignItems={{ xs: 'stretch', md: 'center' }}
              justifyContent="space-between"
            >
              <Stack direction="row" spacing={2} sx={{ flex: 1 }}>
                <TextField
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search for products..."
                  variant="outlined"
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="primary" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ maxWidth: { md: 400 } }}
                />
                
                <FormControl variant="outlined" sx={{ minWidth: 140 }}>
                  <InputLabel>Sort by</InputLabel>
                  <Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    label="Sort by"
                    startAdornment={<SortIcon sx={{ mr: 1, color: 'text.secondary' }} />}
                  >
                    <MenuItem value="newest">Newest</MenuItem>
                    <MenuItem value="price-low">Price: Low to High</MenuItem>
                    <MenuItem value="price-high">Price: High to Low</MenuItem>
                    <MenuItem value="rating">Highest Rated</MenuItem>
                    <MenuItem value="popularity">Most Popular</MenuItem>
                  </Select>
                </FormControl>
              </Stack>

              <Stack direction="row" spacing={1} alignItems="center">
                <Tooltip title="Grid View">
                  <IconButton
                    onClick={() => setViewMode('grid')}
                    color={viewMode === 'grid' ? 'primary' : 'default'}
                    sx={{
                      bgcolor: viewMode === 'grid' ? alpha(theme.palette.primary.main, 0.1) : 'transparent'
                    }}
                  >
                    <ViewModuleIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="List View">
                  <IconButton
                    onClick={() => setViewMode('list')}
                    color={viewMode === 'list' ? 'primary' : 'default'}
                    sx={{
                      bgcolor: viewMode === 'list' ? alpha(theme.palette.primary.main, 0.1) : 'transparent'
                    }}
                  >
                    <ViewListIcon />
                  </IconButton>
                </Tooltip>
                <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                <Button
                  variant="outlined"
                  startIcon={<FilterListIcon />}
                  onClick={() => setOpen(true)}
                  sx={{ borderRadius: 2 }}
                >
                  Filters
                </Button>
              </Stack>
            </Stack>
            
            {/* Results summary */}
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {items ? `${filtered.length} products found` : 'Loading products...'}
              </Typography>
              {query && (
                <Chip
                  label={`Search: "${query}"`}
                  onDelete={() => setQuery('')}
                  size="small"
                  variant="outlined"
                />
              )}
              {filters.categories && filters.categories.length > 0 && (
                <Chip
                  label={`Categories: ${filters.categories.length}`}
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>
          </Paper>
        </Box>

        {/* Filters Drawer */}
        <Drawer anchor="right" open={open} onClose={() => setOpen(false)}>
          <Box sx={{ width: 350, p: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Filter Products
            </Typography>
            <ProductFilters products={(items || [])} onChange={setFilters} />
          </Box>
        </Drawer>

        {/* Loading State */}
        {!items ? (
          <Grid container spacing={3}>
            {Array.from({ length: 12 }).map((_, i) => (
              <Grid item xs={6} sm={4} md={viewMode === 'grid' ? 3 : 12} key={i}>
                <Card sx={{ p: viewMode === 'list' ? 2 : 0 }}>
                  {viewMode === 'list' ? (
                    <Stack direction="row" spacing={2}>
                      <Skeleton variant="rectangular" width={120} height={120} sx={{ borderRadius: 2 }} />
                      <Box sx={{ flex: 1 }}>
                        <Skeleton width="80%" height={30} />
                        <Skeleton width="60%" height={20} />
                        <Skeleton width="40%" height={20} />
                        <Skeleton width="30%" height={35} sx={{ mt: 1 }} />
                      </Box>
                    </Stack>
                  ) : (
                    <>
                      <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
                      <CardContent>
                        <Skeleton width="80%" />
                        <Skeleton width="60%" />
                        <Skeleton width="40%" />
                      </CardContent>
                    </>
                  )}
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <>
            {/* Products Grid/List */}
            <Grid container spacing={3}>
              {paginatedItems.map((p) => {
                const img = getMainImage(p.images, 'product', p._id);
                const isRealImage = hasRealImages(p.images);
                const isFavorite = favorites.has(p._id);
                const rating = p.rating || 4.5;
                const reviewCount = p.reviewCount || Math.floor(Math.random() * 50) + 1;

                return (
                  <Grid item xs={6} sm={4} md={viewMode === 'grid' ? 3 : 12} key={p._id}>
                    <Card
                      sx={{
                        position: 'relative',
                        height: '100%',
                        display: 'flex',
                        flexDirection: viewMode === 'list' ? 'row' : 'column',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: theme.palette.mode === 'dark'
                            ? '0 20px 40px rgba(0,0,0,0.3)'
                            : '0 20px 40px rgba(0,0,0,0.1)',
                        }
                      }}
                    >
                      {/* Favorite Button */}
                      <Tooltip title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
                        <IconButton
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleFavorite(p._id);
                          }}
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            zIndex: 2,
                            bgcolor: 'rgba(255, 255, 255, 0.9)',
                            backdropFilter: 'blur(10px)',
                            '&:hover': {
                              bgcolor: 'rgba(255, 255, 255, 1)',
                              transform: 'scale(1.1)'
                            }
                          }}
                          size="small"
                        >
                          {isFavorite ? (
                            <FavoriteIcon color="error" />
                          ) : (
                            <FavoriteBorderIcon />
                          )}
                        </IconButton>
                      </Tooltip>

                      {viewMode === 'grid' ? (
                        /* Grid Layout */
                        <Box component={NextLink} href={`/product/${p._id}`} sx={{ textDecoration: 'none', color: 'inherit', height: '100%', display: 'flex', flexDirection: 'column' }}>
                          <Box sx={{ position: 'relative', overflow: 'hidden' }}>
                            <CardMedia
                              component="img"
                              height={isMobile ? 160 : 200}
                              image={img}
                              alt={p.title}
                              sx={{
                                filter: isRealImage ? 'none' : 'brightness(0.9) sepia(0.1)',
                                transition: 'transform 0.3s ease',
                                '&:hover': {
                                  transform: 'scale(1.05)'
                                }
                              }}
                            />
                            {!isRealImage && (
                              <Chip
                                label="Stock Photo"
                                size="small"
                                sx={{
                                  position: 'absolute',
                                  bottom: 8,
                                  left: 8,
                                  backgroundColor: 'rgba(0,0,0,0.7)',
                                  color: 'white',
                                  fontSize: '0.65rem',
                                  height: 20
                                }}
                              />
                            )}
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 8,
                                left: 8,
                                bgcolor: 'success.main',
                                color: 'white',
                                px: 1,
                                py: 0.5,
                                borderRadius: 1,
                                fontSize: '0.75rem',
                                fontWeight: 600
                              }}
                            >
                              ${p.price.toFixed(2)}
                            </Box>
                          </Box>
                          <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <Box>
                              <Typography
                                variant="h6"
                                fontWeight={700}
                                gutterBottom
                                sx={{
                                  fontSize: { xs: '1rem', sm: '1.1rem' },
                                  lineHeight: 1.2,
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden'
                                }}
                              >
                                {p.title}
                              </Typography>
                              {p.category && (
                                <Chip
                                  label={p.category}
                                  size="small"
                                  variant="outlined"
                                  sx={{ mb: 1, fontSize: '0.7rem' }}
                                />
                              )}
                            </Box>
                            
                            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 1 }}>
                              <Stack direction="row" alignItems="center" spacing={0.5}>
                                <StarIcon sx={{ color: 'warning.main', fontSize: 16 }} />
                                <Typography variant="body2" fontWeight={600}>
                                  {rating.toFixed(1)}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  ({reviewCount})
                                </Typography>
                              </Stack>
                            </Stack>
                          </CardContent>
                        </Box>
                      ) : (
                        /* List Layout */
                        <Box component={NextLink} href={`/product/${p._id}`} sx={{ textDecoration: 'none', color: 'inherit', display: 'flex', width: '100%', p: 2 }}>
                          <Box sx={{ position: 'relative', mr: 2, flexShrink: 0 }}>
                            <CardMedia
                              component="img"
                              sx={{ width: 120, height: 120, borderRadius: 2 }}
                              image={img}
                              alt={p.title}
                            />
                            {!isRealImage && (
                              <Chip
                                label="Stock"
                                size="small"
                                sx={{
                                  position: 'absolute',
                                  bottom: 4,
                                  left: 4,
                                  backgroundColor: 'rgba(0,0,0,0.7)',
                                  color: 'white',
                                  fontSize: '0.6rem',
                                  height: 16
                                }}
                              />
                            )}
                          </Box>
                          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <Box>
                              <Typography variant="h6" fontWeight={700} gutterBottom>
                                {p.title}
                              </Typography>
                              <Typography 
                                variant="body2" 
                                color="text.secondary" 
                                sx={{ 
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  mb: 1
                                }}
                              >
                                {p.description || 'High-quality product with excellent features and design.'}
                              </Typography>
                              {p.category && (
                                <Chip label={p.category} size="small" variant="outlined" sx={{ mb: 1 }} />
                              )}
                            </Box>
                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <Typography variant="h6" fontWeight={700} color="success.main">
                                  ${p.price.toFixed(2)}
                                </Typography>
                                <Stack direction="row" alignItems="center" spacing={0.5}>
                                  <StarIcon sx={{ color: 'warning.main', fontSize: 16 }} />
                                  <Typography variant="body2" fontWeight={600}>
                                    {rating.toFixed(1)}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    ({reviewCount})
                                  </Typography>
                                </Stack>
                              </Stack>
                            </Stack>
                          </Box>
                        </Box>
                      )}
                    </Card>
                  </Grid>
                );
              })}
            </Grid>

            {/* Pagination */}
            {totalPages > 1 && (
              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={(_, page) => {
                    setCurrentPage(page);
                    scrollToTop();
                  }}
                  color="primary"
                  size={isMobile ? 'small' : 'medium'}
                  sx={{
                    '& .MuiPaginationItem-root': {
                      borderRadius: 2,
                      fontWeight: 600
                    }
                  }}
                />
              </Box>
            )}

            {/* Empty State */}
            {filtered.length === 0 && (
              <Paper
                sx={{
                  py: 8,
                  textAlign: 'center',
                  background: 'transparent',
                  boxShadow: 'none',
                  border: `2px dashed ${alpha(theme.palette.primary.main, 0.3)}`
                }}
              >
                <SearchIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No products found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Try adjusting your search or filters
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setQuery('');
                    setFilters({});
                    setCurrentPage(1);
                  }}
                >
                  Clear All Filters
                </Button>
              </Paper>
            )}
          </>
        )}
      </Container>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <Fab
          color="primary"
          size="medium"
          onClick={scrollToTop}
          sx={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 1000,
            background: 'linear-gradient(45deg, #7c3aed, #06b6d4)',
            '&:hover': {
              transform: 'scale(1.1)'
            }
          }}
        >
          <ArrowUpwardIcon />
        </Fab>
      )}
    </>
  );
}