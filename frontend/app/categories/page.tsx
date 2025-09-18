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
  Avatar
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  GridView as GridViewIcon,
  ViewList as ListViewIcon,
  ExpandMore as ExpandMoreIcon,
  Star as StarIcon,
  ShoppingCart as ShoppingCartIcon,
  Category as CategoryIcon
} from '@mui/icons-material';
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
  store?: string;
  createdAt?: string;
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
  'All Categories',
  'Electronics',
  'Fashion',
  'Home & Garden',
  'Sports & Outdoors',
  'Books',
  'Toys & Games',
  'Automotive',
  'Health & Beauty',
  'Food & Beverages',
  'Arts & Crafts',
  'Other'
];

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'popular', label: 'Most Popular' }
];

export default function CategoriesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12'
      });
      
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (selectedCategory !== 'All Categories') params.append('category', selectedCategory);
      
      // For now, use the general products endpoint
      const response = await apiGet<Product[]>(`/products?${params}`);
      
      // Simulate pagination response structure
      setProducts(response || []);
      setPagination({
        page,
        limit: 12,
        total: response?.length || 0,
        pages: Math.ceil((response?.length || 0) / 12)
      });
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const filteredProducts = products.filter(product => {
    const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
    return matchesPrice;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'newest':
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      default:
        return 0;
    }
  });

  const ProductCard = ({ product, isListView = false }: { product: Product; isListView?: boolean }) => (
    <Card 
      sx={{ 
        height: '100%',
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
          borderColor: 'primary.main'
        }
      }}
      onClick={() => window.open(`/product/${product._id}`, '_blank')}
    >
      {isListView ? (
        <Stack direction="row" sx={{ height: 200 }}>
          <CardMedia
            component="img"
            sx={{ width: 200, flexShrink: 0 }}
            image={product.images[0] || '/api/placeholder/200/200'}
            alt={product.title}
          />
          <CardContent sx={{ flex: 1, p: 3 }}>
            <Stack spacing={2} height="100%">
              <Box>
                <Chip 
                  label={product.category} 
                  size="small" 
                  color="primary" 
                  variant="outlined"
                  sx={{ mb: 1 }}
                />
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  {product.title}
                </Typography>
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
              </Box>
              <Box sx={{ mt: 'auto' }}>
                <Typography variant="h6" color="primary.main" fontWeight={700} gutterBottom>
                  ${product.price.toFixed(2)} {product.currency}
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<ShoppingCartIcon />}
                  size="small"
                  sx={{ borderRadius: 2 }}
                >
                  Add to Cart
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Stack>
      ) : (
        <>
          <CardMedia
            component="img"
            height="200"
            image={product.images[0] || '/api/placeholder/300/200'}
            alt={product.title}
            sx={{ objectFit: 'cover' }}
          />
          <CardContent>
            <Stack spacing={2}>
              <Box>
                <Chip 
                  label={product.category} 
                  size="small" 
                  color="primary" 
                  variant="outlined"
                  sx={{ mb: 1 }}
                />
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
              </Box>
              
              <Box>
                <Typography variant="h6" color="primary.main" fontWeight={700} gutterBottom>
                  ${product.price.toFixed(2)} {product.currency}
                </Typography>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<ShoppingCartIcon />}
                  sx={{ borderRadius: 2 }}
                >
                  Add to Cart
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </>
      )}
    </Card>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <MLink component={NextLink} href="/" underline="hover" color="inherit">
          Home
        </MLink>
        <Typography color="text.primary">Shop by Category</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={2} mb={4}>
        <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
          <CategoryIcon fontSize="large" />
        </Avatar>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Shop by Category
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Discover products from all categories with advanced filters
          </Typography>
        </Box>
      </Stack>

      <Grid container spacing={4}>
        {/* Filters Sidebar */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 3, borderRadius: 3, position: 'sticky', top: 20 }}>
            <Stack spacing={3}>
              {/* Search */}
              <Box component="form" onSubmit={handleSearchSubmit}>
                <TextField
                  fullWidth
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton type="submit" size="small">
                          <SearchIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                    sx: { borderRadius: 2 }
                  }}
                />
              </Box>

              {/* Category Filter */}
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={selectedCategory}
                  label="Category"
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Price Range */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Price Range
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={2}>
                    <Slider
                      value={priceRange}
                      onChange={(_, newValue) => setPriceRange(newValue as number[])}
                      valueLabelDisplay="auto"
                      min={0}
                      max={1000}
                      step={10}
                    />
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2">${priceRange[0]}</Typography>
                      <Typography variant="body2">${priceRange[1]}</Typography>
                    </Stack>
                  </Stack>
                </AccordionDetails>
              </Accordion>

              {/* Rating Filter */}
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
                        control={<Checkbox />}
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
            </Stack>
          </Paper>
        </Grid>

        {/* Products Grid */}
        <Grid item xs={12} md={9}>
          {/* Toolbar */}
          <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                {sortedProducts.length} product{sortedProducts.length !== 1 ? 's' : ''} found
              </Typography>
              
              <Stack direction="row" spacing={2} alignItems="center">
                {/* Sort */}
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Sort by</InputLabel>
                  <Select
                    value={sortBy}
                    label="Sort by"
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    {sortOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* View Toggle */}
                <Stack direction="row">
                  <IconButton
                    onClick={() => setViewMode('grid')}
                    color={viewMode === 'grid' ? 'primary' : 'default'}
                  >
                    <GridViewIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => setViewMode('list')}
                    color={viewMode === 'list' ? 'primary' : 'default'}
                  >
                    <ListViewIcon />
                  </IconButton>
                </Stack>
              </Stack>
            </Stack>
          </Paper>

          {loading ? (
            <Box textAlign="center" py={8}>
              <Typography variant="h6" color="text.secondary">
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
              <Typography color="text.secondary">
                Try adjusting your search or filters to find more products.
              </Typography>
            </Box>
          ) : (
            <>
              {/* Products */}
              <Grid container spacing={3}>
                {sortedProducts.map((product) => (
                  <Grid 
                    item 
                    xs={12} 
                    sm={viewMode === 'grid' ? 6 : 12} 
                    lg={viewMode === 'grid' ? 4 : 12} 
                    key={product._id}
                  >
                    <ProductCard product={product} isListView={viewMode === 'list'} />
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
    </Container>
  );
}