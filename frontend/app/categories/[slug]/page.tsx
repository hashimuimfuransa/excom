"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
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
  Avatar,
  Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  GridView as GridViewIcon,
  ViewList as ListViewIcon,
  ExpandMore as ExpandMoreIcon,
  Star as StarIcon,
  ShoppingCart as ShoppingCartIcon,
  Devices as ElectronicsIcon,
  Checkroom as FashionIcon,
  Home as HomeIcon,
  SportsBasketball as SportsIcon,
  MenuBook as BooksIcon,
  Toys as ToysIcon,
  DirectionsCar as AutomotiveIcon,
  HealthAndSafety as HealthIcon,
  Restaurant as FoodIcon,
  Palette as ArtsIcon,
  Category as OtherIcon,
  Computer as ComputerIcon,
  Phone as MobileIcon,
  Camera as CameraIcon,
  MusicNote as MusicIcon,
  Person as BeautyIcon,
  Favorite as PetsIcon,
  LocalHospital as WellnessIcon,
  School as EducationIcon,
  Work as BusinessIcon,
  Flight as TravelIcon,
  ShoppingCart as GroceryIcon,
  AccessTime as WatchesIcon,
  Kitchen as KitchenIcon,
  FitnessCenter as FitnessIcon
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

const categoryData = {
  electronics: {
    name: 'Electronics',
    icon: <ElectronicsIcon />,
    color: '#2196F3',
    bgColor: 'rgba(33, 150, 243, 0.1)',
    description: 'Latest gadgets, devices, and electronic accessories'
  },
  fashion: {
    name: 'Fashion',
    icon: <FashionIcon />,
    color: '#E91E63',
    bgColor: 'rgba(233, 30, 99, 0.1)',
    description: 'Trendy clothing, accessories, and fashion items'
  },
  gaming: {
    name: 'Gaming',
    icon: <StarIcon />,
    color: '#9C27B0',
    bgColor: 'rgba(156, 39, 176, 0.1)',
    description: 'Gaming consoles, accessories, and epic gaming gear'
  },
  mobile: {
    name: 'Mobile & Tech',
    icon: <MobileIcon />,
    color: '#FF5722',
    bgColor: 'rgba(255, 87, 34, 0.1)',
    description: 'Smartphones, tablets, and mobile accessories'
  },
  home: {
    name: 'Home & Garden',
    icon: <HomeIcon />,
    color: '#4CAF50',
    bgColor: 'rgba(76, 175, 80, 0.1)',
    description: 'Everything for your home and garden needs'
  },
  sports: {
    name: 'Sports & Fitness',
    icon: <SportsIcon />,
    color: '#FF9800',
    bgColor: 'rgba(255, 152, 0, 0.1)',
    description: 'Sports equipment and fitness gear for active lifestyles'
  },
  books: {
    name: 'Books & Media',
    icon: <BooksIcon />,
    color: '#795548',
    bgColor: 'rgba(121, 85, 72, 0.1)',
    description: 'Books, magazines, and educational materials'
  },
  beauty: {
    name: 'Beauty & Care',
    icon: <BeautyIcon />,
    color: '#E91E63',
    bgColor: 'rgba(233, 30, 99, 0.1)',
    description: 'Beauty products, skincare, and personal care essentials'
  },
  audio: {
    name: 'Music & Audio',
    icon: <MusicIcon />,
    color: '#9C27B0',
    bgColor: 'rgba(156, 39, 176, 0.1)',
    description: 'Headphones, speakers, and audio equipment'
  },
  computers: {
    name: 'Computers',
    icon: <ComputerIcon />,
    color: '#607D8B',
    bgColor: 'rgba(96, 125, 139, 0.1)',
    description: 'Laptops, desktops, and computer accessories'
  },
  kitchen: {
    name: 'Kitchen & Dining',
    icon: <KitchenIcon />,
    color: '#FF5722',
    bgColor: 'rgba(255, 87, 34, 0.1)',
    description: 'Kitchen appliances, cookware, and dining essentials'
  },
  pets: {
    name: 'Pets & Animals',
    icon: <PetsIcon />,
    color: '#8BC34A',
    bgColor: 'rgba(139, 195, 74, 0.1)',
    description: 'Pet supplies, accessories, and care products'
  },
  toys: {
    name: 'Toys & Games',
    icon: <ToysIcon />,
    color: '#F44336',
    bgColor: 'rgba(244, 67, 54, 0.1)',
    description: 'Fun toys and games for all ages'
  },
  automotive: {
    name: 'Automotive',
    icon: <AutomotiveIcon />,
    color: '#607D8B',
    bgColor: 'rgba(96, 125, 139, 0.1)',
    description: 'Car parts, accessories, and automotive tools'
  },
  health: {
    name: 'Health & Wellness',
    icon: <WellnessIcon />,
    color: '#00BCD4',
    bgColor: 'rgba(0, 188, 212, 0.1)',
    description: 'Health products, supplements, and wellness essentials'
  }
};

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'popular', label: 'Most Popular' }
];

// Mock products for demonstration
const mockProductsByCategory: { [key: string]: Product[] } = {
  electronics: [
    {
      _id: 'e1',
      title: 'Samsung Galaxy Smartphone',
      description: 'Latest Android smartphone with advanced camera features',
      images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300'],
      price: 699,
      currency: 'USD',
      category: 'Electronics',
      seller: 'TechStore',
      createdAt: '2024-01-15T00:00:00Z'
    },
    {
      _id: 'e2',
      title: 'Wireless Bluetooth Headphones',
      description: 'Premium noise-cancelling wireless headphones',
      images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300'],
      price: 199,
      currency: 'USD',
      category: 'Electronics',
      seller: 'AudioHub',
      createdAt: '2024-01-10T00:00:00Z'
    },
    {
      _id: 'e3',
      title: '4K Smart TV',
      description: '55-inch 4K Ultra HD Smart LED TV with streaming apps',
      images: ['https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=300'],
      price: 799,
      currency: 'USD',
      category: 'Electronics',
      seller: 'ElectroWorld',
      createdAt: '2024-01-12T00:00:00Z'
    }
  ],
  fashion: [
    {
      _id: 'f1',
      title: 'Designer Leather Jacket',
      description: 'Premium leather jacket with modern style',
      images: ['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=300'],
      price: 299,
      currency: 'USD',
      category: 'Fashion',
      seller: 'StyleHub',
      createdAt: '2024-01-14T00:00:00Z'
    },
    {
      _id: 'f2',
      title: 'Running Sneakers',
      description: 'Comfortable running shoes for daily workouts',
      images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300'],
      price: 129,
      currency: 'USD',
      category: 'Fashion',
      seller: 'SportStyle',
      createdAt: '2024-01-11T00:00:00Z'
    }
  ],
  gaming: [
    {
      _id: 'g1',
      title: 'Gaming Mechanical Keyboard',
      description: 'RGB mechanical keyboard for gaming enthusiasts',
      images: ['https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=400&h=300'],
      price: 149,
      currency: 'USD',
      category: 'Gaming',
      seller: 'GameGear',
      createdAt: '2024-01-13T00:00:00Z'
    },
    {
      _id: 'g2',
      title: 'Wireless Gaming Mouse',
      description: 'High-precision wireless gaming mouse',
      images: ['https://images.unsplash.com/photo-1527814050087-3793815479db?w=400&h=300'],
      price: 89,
      currency: 'USD',
      category: 'Gaming',
      seller: 'GameGear',
      createdAt: '2024-01-09T00:00:00Z'
    }
  ]
};

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  const categoryInfo = categoryData[slug as keyof typeof categoryData];

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [page, setPage] = useState(1);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Try to fetch products from API
      const response = await apiGet<{products: Product[], pagination: any}>('/products');
      
      if (response?.products && response.products.length > 0) {
        // Filter products by category from API response
        const filteredProducts = response.products.filter(product => 
          product.category.toLowerCase() === categoryInfo?.name.toLowerCase() ||
          product.category.toLowerCase().includes(slug.toLowerCase())
        );
        
        if (filteredProducts.length > 0) {
          setProducts(filteredProducts);
          return;
        }
      }
      
      // Fallback to mock products if API fails or no products found
      const mockProducts = mockProductsByCategory[slug] || [];
      setProducts(mockProducts);
      
    } catch (error) {
      console.error('Failed to fetch products, using fallback data:', error);
      // Use mock products as fallback
      const mockProducts = mockProductsByCategory[slug] || [];
      setProducts(mockProducts);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (categoryInfo) {
      fetchProducts();
    }
  }, [slug, categoryInfo]);

  if (!categoryInfo) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          Category not found
        </Alert>
        <Button
          component={NextLink}
          href="/categories"
          variant="contained"
        >
          Back to Categories
        </Button>
      </Container>
    );
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchQuery || 
      product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
    return matchesSearch && matchesPrice;
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is already handled by filteredProducts
  };

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
          borderColor: categoryInfo.color
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
                <Typography variant="h6" fontWeight={700} gutterBottom
                  sx={{ color: categoryInfo.color }}
                >
                  ${product.price.toFixed(2)} {product.currency}
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<ShoppingCartIcon />}
                  size="small"
                  sx={{ 
                    borderRadius: 2,
                    bgcolor: categoryInfo.color,
                    '&:hover': { bgcolor: categoryInfo.color }
                  }}
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
                <Typography variant="h6" fontWeight={700} gutterBottom
                  sx={{ color: categoryInfo.color }}
                >
                  ${product.price.toFixed(2)} {product.currency}
                </Typography>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<ShoppingCartIcon />}
                  sx={{ 
                    borderRadius: 2,
                    bgcolor: categoryInfo.color,
                    '&:hover': { bgcolor: categoryInfo.color }
                  }}
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
        <MLink component={NextLink} href="/categories" underline="hover" color="inherit">
          Categories
        </MLink>
        <Typography color="text.primary">{categoryInfo.name}</Typography>
      </Breadcrumbs>

      {/* Category Header */}
      <Paper 
        sx={{ 
          p: 4, 
          mb: 4, 
          borderRadius: 3,
          background: `linear-gradient(135deg, ${categoryInfo.bgColor}, transparent)`,
          border: '1px solid',
          borderColor: categoryInfo.color + '20'
        }}
      >
        <Stack direction="row" alignItems="center" spacing={3}>
          <Avatar 
            sx={{ 
              bgcolor: categoryInfo.color,
              width: 80,
              height: 80,
              boxShadow: `0 8px 24px ${categoryInfo.color}40`
            }}
          >
            {categoryInfo.icon}
          </Avatar>
          <Box>
            <Typography variant="h3" fontWeight={700} gutterBottom>
              {categoryInfo.name}
            </Typography>
            <Typography variant="h6" color="text.secondary">
              {categoryInfo.description}
            </Typography>
            {!loading && (
              <Chip 
                label={`${sortedProducts.length} items`}
                sx={{ mt: 1, bgcolor: categoryInfo.color, color: 'white' }}
              />
            )}
          </Box>
        </Stack>
      </Paper>

      <Grid container spacing={4}>
        {/* Filters Sidebar */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 3, borderRadius: 3, position: 'sticky', top: 20 }}>
            <Stack spacing={3}>
              {/* Search */}
              <Box component="form" onSubmit={handleSearchSubmit}>
                <TextField
                  fullWidth
                  placeholder="Search in this category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: 2 }
                  }}
                />
              </Box>

              {/* Price Range */}
              <Accordion defaultExpanded>
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
                      sx={{ color: categoryInfo.color }}
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
                        control={<Checkbox sx={{ color: categoryInfo.color }} />}
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
                {sortedProducts.length} product{sortedProducts.length !== 1 ? 's' : ''} found in {categoryInfo.name}
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
                    sx={{ color: viewMode === 'grid' ? categoryInfo.color : 'default' }}
                  >
                    <GridViewIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => setViewMode('list')}
                    sx={{ color: viewMode === 'list' ? categoryInfo.color : 'default' }}
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
                Loading {categoryInfo.name.toLowerCase()} products...
              </Typography>
            </Box>
          ) : sortedProducts.length === 0 ? (
            <Box textAlign="center" py={8}>
              <Avatar sx={{ 
                mx: 'auto', 
                mb: 2, 
                bgcolor: categoryInfo.bgColor, 
                width: 64, 
                height: 64 
              }}>
                {categoryInfo.icon}
              </Avatar>
              <Typography variant="h6" gutterBottom>
                No products found in {categoryInfo.name}
              </Typography>
              <Typography color="text.secondary" mb={3}>
                Try adjusting your search or price range to find more products.
              </Typography>
              <Button
                component={NextLink}
                href="/categories"
                variant="outlined"
                sx={{ borderColor: categoryInfo.color, color: categoryInfo.color }}
              >
                Browse Other Categories
              </Button>
            </Box>
          ) : (
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
          )}
        </Grid>
      </Grid>
    </Container>
  );
}