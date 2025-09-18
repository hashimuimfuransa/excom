"use client";
import React, { useEffect, useState, useMemo } from 'react';
import { 
  Box, Button, Chip, Container, Dialog, DialogActions, DialogContent, DialogTitle, 
  FormControl, Grid, IconButton, InputLabel, MenuItem, Paper, Select, Stack, 
  TextField, Tooltip, Typography, Alert, CircularProgress, InputAdornment,
  Card, CardMedia, CardContent, CardActions, Fab, Pagination, Divider, Avatar
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  CloudUpload as CloudUploadIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  GridView as GridViewIcon,
  ViewList as ListViewIcon,
  Sort as SortIcon,
  Visibility as ViewIcon,
  Clear as ClearIcon,
  TrendingUp,
  Inventory,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { apiDelete, apiGet, apiPost, apiPatch } from '@utils/api';

interface Product { 
  _id: string; 
  title: string; 
  price: number; 
  currency: string; 
  images?: string[]; 
  description?: string; 
  category?: string; 
  store?: {
    _id: string;
    name: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

interface Store {
  _id: string;
  name: string;
  description?: string;
  logo?: string;
  banner?: string;
  approved?: boolean;
  isActive?: boolean;
  category?: string;
}

const categories = [
  'Electronics',
  'Clothing & Fashion', 
  'Home & Garden',
  'Books & Media',
  'Sports & Outdoors',
  'Health & Beauty',
  'Toys & Games',
  'Automotive',
  'Art & Crafts',
  'Food & Beverages',
  'Office Supplies',
  'Pet Supplies',
  'Jewelry & Accessories',
  'Musical Instruments',
  'Other'
];

type ViewMode = 'grid' | 'list';
type SortBy = 'title' | 'price' | 'category' | 'createdAt';
type SortOrder = 'asc' | 'desc';

export default function VendorProductsPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [currency, setCurrency] = useState('USD');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [selectedStore, setSelectedStore] = useState(''); // Store for creating/editing products
  const [images, setImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [error, setError] = useState('');
  
  // Store management
  const [stores, setStores] = useState<Store[]>([]);
  const [storeFilter, setStoreFilter] = useState(''); // Store filter for listing products
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);

  useEffect(() => {
    const token = localStorage.getItem('excom_token');
    if (!token) { window.location.href = '/auth/login'; return; }
    
    // Fetch stores and products
    Promise.all([
      apiGet<Store[]>('/sellers/my-stores').catch(() => []),
      apiGet<Product[]>(storeFilter ? `/products/mine/list?store=${storeFilter}` : `/products/mine/list`).catch(() => [])
    ]).then(([storesData, productsData]) => {
      setStores(storesData);
      setItems(productsData);
    });
  }, [storeFilter]);

  // Filter and sort products
  const filteredAndSortedItems = useMemo(() => {
    let filtered = items.filter(product => {
      const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      const matchesCategory = !selectedCategory || product.category === selectedCategory;
      const matchesPriceMin = !priceRange.min || product.price >= parseFloat(priceRange.min);
      const matchesPriceMax = !priceRange.max || product.price <= parseFloat(priceRange.max);
      
      return matchesSearch && matchesCategory && matchesPriceMin && matchesPriceMax;
    });

    // Sort filtered results
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'category':
          aValue = a.category || '';
          bValue = b.category || '';
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt || '').getTime();
          bValue = new Date(b.createdAt || '').getTime();
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [items, searchQuery, selectedCategory, priceRange, sortBy, sortOrder]);

  // Paginated items
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedItems.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedItems, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedItems.length / itemsPerPage);

  function startCreate() {
    setEditing(null);
    setTitle('');
    setPrice('');
    setCurrency('USD');
    setDescription('');
    setCategory('');
    setSelectedStore('');
    setImages([]);
    setError('');
    setOpen(true);
  }

  function startEdit(p: Product) {
    setEditing(p);
    setTitle(p.title);
    setPrice(p.price);
    setCurrency(p.currency);
    setDescription(p.description || '');
    setCategory(p.category || '');
    setSelectedStore(p.store?._id || '');
    setImages(p.images || []);
    setError('');
    setOpen(true);
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    setError('');

    try {
      const uploadPromises = Array.from(files).map(file => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      const base64Images = await Promise.all(uploadPromises);
      
      // Upload to Cloudinary
      const response = await apiPost('/upload/images', {
        images: base64Images,
        folder: 'excom/products'
      });

      if (response.success) {
        const imageUrls = response.data.map((img: any) => img.secure_url);
        setImages(prev => [...prev, ...imageUrls]);
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload images. Please try again.');
    } finally {
      setUploadingImages(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  async function saveProduct() {
    if (!title.trim() || !price || !category || images.length === 0) {
      setError('Please fill in all required fields (title, price, category) and add at least one image');
      return;
    }

    const body = { 
      title: title.trim(), 
      price: Number(price), 
      currency, 
      description: description.trim(), 
      category, 
      images,
      store: selectedStore || undefined
    };
    try {
      if (!editing) {
        const created = await apiPost<Product>(`/products`, body);
        setItems([created, ...items]);
      } else {
        const updated = await apiPatch<Product>(`/products/${editing._id}`, body);
        setItems(items.map(it => it._id === editing._id ? { ...it, ...updated } : it));
      }
      setOpen(false);
    } catch (err) {
      console.error('Save product error:', err);
      setError('Failed to save product. Please try again.');
    }
  }

  async function remove(id: string) {
    if (confirm('Are you sure you want to delete this product?')) {
      await apiDelete(`/products/${id}`);
      setItems(items.filter(it => it._id !== id));
    }
  }

  function clearFilters() {
    setSearchQuery('');
    setSelectedCategory('');
    setStoreFilter('');
    setPriceRange({ min: '', max: '' });
    setCurrentPage(1);
  }

  const ProductCard = ({ product }: { product: Product }) => {
    if (viewMode === 'list') {
      return (
        <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', mb: 2 }}>
          <Stack direction="row" spacing={2}>
            <Box
              component="img"
              src={product.images?.[0] || '/placeholder-product.svg'}
              alt={product.title}
              sx={{
                width: 100,
                height: 100,
                objectFit: 'cover',
                borderRadius: 1
              }}
            />
            <Box flex={1}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    {product.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {product.description || 'No description'}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    <Chip label={`${product.price} ${product.currency}`} color="primary" size="small" />
                    {product.category && (
                      <Chip label={product.category} variant="outlined" size="small" />
                    )}
                    {product.store && (
                      <Chip label={`Store: ${product.store.name}`} color="secondary" size="small" />
                    )}
                    {product.createdAt && (
                      <Typography variant="caption" color="text.secondary">
                        Created {new Date(product.createdAt).toLocaleDateString()}
                      </Typography>
                    )}
                  </Stack>
                </Box>
                <Stack direction="row">
                  <Tooltip title="Edit">
                    <IconButton onClick={() => startEdit(product)} color="primary">
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton onClick={() => remove(product._id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>
            </Box>
          </Stack>
        </Paper>
      );
    }

    return (
      <Card sx={{ 
        borderRadius: 3, 
        border: '1px solid', 
        borderColor: 'divider',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
        }
      }}>
        <CardMedia
          component="img"
          height="200"
          image={product.images?.[0] || '/placeholder-product.svg'}
          alt={product.title}
          sx={{ objectFit: 'cover' }}
        />
        <CardContent>
          <Typography variant="h6" fontWeight={700} gutterBottom noWrap>
            {product.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ 
            mb: 1, 
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {product.description || 'No description'}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mb: 1 }} flexWrap="wrap">
            <Chip 
              label={`${product.price} ${product.currency}`} 
              color="primary" 
              size="small" 
            />
            {product.category && (
              <Chip 
                label={product.category} 
                variant="outlined" 
                size="small" 
              />
            )}
            {product.store && (
              <Chip 
                label={`Store: ${product.store.name}`} 
                color="secondary" 
                size="small" 
              />
            )}
          </Stack>
          {product.createdAt && (
            <Typography variant="caption" color="text.secondary">
              Created {new Date(product.createdAt).toLocaleDateString()}
            </Typography>
          )}
        </CardContent>
        <CardActions sx={{ justifyContent: 'space-between', px: 2 }}>
          <Button
            size="small"
            startIcon={<ViewIcon />}
            href={`/product/${product._id}`}
            target="_blank"
          >
            View
          </Button>
          <Stack direction="row">
            <Tooltip title="Edit">
              <IconButton size="small" onClick={() => startEdit(product)} color="primary">
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton size="small" onClick={() => remove(product._id)} color="error">
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </CardActions>
      </Card>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Stack 
        direction={{ xs: 'column', sm: 'row' }} 
        alignItems={{ xs: 'stretch', sm: 'center' }} 
        justifyContent="space-between" 
        mb={{ xs: 3, sm: 4 }}
        spacing={{ xs: 2, sm: 0 }}
      >
        <Stack direction="row" alignItems="center" spacing={{ xs: 1, sm: 2 }}>
          <IconButton 
            onClick={() => window.location.href = '/dashboard/vendor'}
            sx={{ 
              bgcolor: 'primary.main', 
              color: 'white',
              '&:hover': { bgcolor: 'primary.dark' },
              width: { xs: 40, sm: 48 },
              height: { xs: 40, sm: 48 }
            }}
          >
            <ArrowBackIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.75rem' } }} />
          </IconButton>
          <Box>
            <Typography 
              variant="h4" 
              fontWeight={900} 
              gutterBottom
              sx={{ 
                lineHeight: { xs: 1.2, sm: 1.167 },
                fontSize: { xs: '1.5rem', sm: '2.125rem' }
              }}
            >
              My Products
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{ 
                display: { xs: 'none', sm: 'block' },
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }}
            >
              Manage your product inventory and listings
            </Typography>
          </Box>
        </Stack>
        <Stack 
          direction={{ xs: 'row', sm: 'row' }} 
          spacing={{ xs: 1, sm: 2 }}
          justifyContent={{ xs: 'space-between', sm: 'flex-end' }}
          alignItems="center"
        >
          <Paper sx={{ 
            p: { xs: 0.5, sm: 1 }, 
            display: 'flex', 
            alignItems: 'center', 
            gap: { xs: 0.5, sm: 1 },
            minWidth: { xs: 'auto', sm: 'auto' }
          }}>
            <Avatar sx={{ 
              bgcolor: 'primary.main', 
              width: { xs: 24, sm: 32 }, 
              height: { xs: 24, sm: 32 } 
            }}>
              <Inventory fontSize="small" />
            </Avatar>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                Total Products
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                {items.length}
              </Typography>
            </Box>
            <Typography 
              variant="body2" 
              fontWeight={700}
              sx={{ display: { xs: 'block', sm: 'none' } }}
            >
              {items.length}
            </Typography>
          </Paper>
          <Fab 
            variant="extended" 
            color="primary" 
            onClick={startCreate}
            sx={{ 
              borderRadius: 3,
              minWidth: { xs: 'auto', sm: 'auto' },
              px: { xs: 2, sm: 3 },
              fontSize: { xs: '0.875rem', sm: '1rem' }
            }}
          >
            <AddIcon sx={{ 
              mr: { xs: 0.5, sm: 1 },
              fontSize: { xs: '1.125rem', sm: '1.25rem' }
            }} />
            <Typography 
              variant="body1"
              sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
            >
              Add Product
            </Typography>
          </Fab>
        </Stack>
      </Stack>

      {/* Search and Filter Controls */}
      <Paper sx={{ 
        p: { xs: 2, sm: 3 }, 
        borderRadius: 3, 
        border: '1px solid', 
        borderColor: 'divider', 
        mb: { xs: 2, sm: 3 } 
      }}>
        <Grid container spacing={{ xs: 1.5, sm: 2 }} alignItems="center">
          <Grid item xs={12} sm={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
                sx: { borderRadius: 2 }
              }}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Store</InputLabel>
              <Select
                value={storeFilter}
                label="Store"
                onChange={(e) => setStoreFilter(e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="">All Stores</MenuItem>
                {stores.map((store) => (
                  <MenuItem key={store._id} value={store._id}>
                    {store.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                label="Category"
                onChange={(e) => setSelectedCategory(e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={3} sm={2} md={1}>
            <TextField
              fullWidth
              label="Min Price"
              type="number"
              value={priceRange.min}
              onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
              size="small"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
          <Grid item xs={3} sm={2} md={1}>
            <TextField
              fullWidth
              label="Max Price"
              type="number"
              value={priceRange.max}
              onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
              size="small"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Sort By</InputLabel>
              <Select
                value={`${sortBy}-${sortOrder}`}
                label="Sort By"
                onChange={(e) => {
                  const [by, order] = e.target.value.split('-');
                  setSortBy(by as SortBy);
                  setSortOrder(order as SortOrder);
                }}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="createdAt-desc">Newest First</MenuItem>
                <MenuItem value="createdAt-asc">Oldest First</MenuItem>
                <MenuItem value="title-asc">Name A-Z</MenuItem>
                <MenuItem value="title-desc">Name Z-A</MenuItem>
                <MenuItem value="price-asc">Price Low-High</MenuItem>
                <MenuItem value="price-desc">Price High-Low</MenuItem>
                <MenuItem value="category-asc">Category A-Z</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={12} md={2}>
            <Stack 
              direction="row" 
              spacing={1} 
              justifyContent={{ xs: 'center', sm: 'flex-start', md: 'flex-end' }}
              sx={{ mt: { xs: 1, sm: 0 } }}
            >
              <Tooltip title="Grid View">
                <IconButton 
                  onClick={() => setViewMode('grid')}
                  color={viewMode === 'grid' ? 'primary' : 'default'}
                  size="small"
                >
                  <GridViewIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="List View">
                <IconButton 
                  onClick={() => setViewMode('list')}
                  color={viewMode === 'list' ? 'primary' : 'default'}
                  size="small"
                >
                  <ListViewIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Clear Filters">
                <IconButton 
                  onClick={clearFilters} 
                  color="error"
                  size="small"
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          </Grid>
        </Grid>
        
        {/* Filter Summary */}
        {(searchQuery || selectedCategory || storeFilter || priceRange.min || priceRange.max) && (
          <Stack direction="row" spacing={1} mt={2} flexWrap="wrap">
            <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
              Active filters:
            </Typography>
            {searchQuery && (
              <Chip 
                label={`Search: "${searchQuery}"`} 
                size="small" 
                onDelete={() => setSearchQuery('')} 
              />
            )}
            {storeFilter && (
              <Chip 
                label={`Store: ${stores.find(s => s._id === storeFilter)?.name || storeFilter}`} 
                size="small" 
                onDelete={() => setStoreFilter('')} 
              />
            )}
            {selectedCategory && (
              <Chip 
                label={`Category: ${selectedCategory}`} 
                size="small" 
                onDelete={() => setSelectedCategory('')} 
              />
            )}
            {(priceRange.min || priceRange.max) && (
              <Chip 
                label={`Price: ${priceRange.min || '0'} - ${priceRange.max || '∞'}`} 
                size="small" 
                onDelete={() => setPriceRange({ min: '', max: '' })} 
              />
            )}
          </Stack>
        )}
      </Paper>

      {/* Results Summary */}
      <Stack 
        direction={{ xs: 'column', sm: 'row' }} 
        justifyContent="space-between" 
        alignItems={{ xs: 'stretch', sm: 'center' }} 
        mb={2}
        spacing={{ xs: 1, sm: 0 }}
      >
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
          Showing {paginatedItems.length} of {filteredAndSortedItems.length} products
        </Typography>
        {totalPages > 1 && (
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(_, page) => setCurrentPage(page)}
            color="primary"
            size="small"
            sx={{ 
              display: 'flex', 
              justifyContent: { xs: 'center', sm: 'flex-end' },
              '& .MuiPagination-ul': { justifyContent: 'center' }
            }}
          />
        )}
      </Stack>

      {/* Products Grid/List */}
      {paginatedItems.length === 0 ? (
        <Paper sx={{ 
          p: { xs: 3, sm: 4 }, 
          textAlign: 'center', 
          borderRadius: 3,
          mx: { xs: 1, sm: 0 }
        }}>
          <Avatar sx={{ 
            bgcolor: 'grey.100', 
            width: { xs: 60, sm: 80 }, 
            height: { xs: 60, sm: 80 }, 
            mx: 'auto', 
            mb: 2 
          }}>
            <Inventory sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }} color="disabled" />
          </Avatar>
          <Typography 
            variant="h6" 
            color="text.secondary" 
            gutterBottom
            sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
          >
            {items.length === 0 ? 'No products yet' : 'No products match your filters'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {items.length === 0 
              ? 'Create your first product to get started selling'
              : 'Try adjusting your search criteria or clear filters'
            }
          </Typography>
          {items.length === 0 ? (
            <Button 
              variant="contained" 
              startIcon={<AddIcon />} 
              onClick={startCreate}
              size="medium"
            >
              Add Your First Product
            </Button>
          ) : (
            <Button 
              variant="outlined" 
              onClick={clearFilters}
              size="medium"
            >
              Clear Filters
            </Button>
          )}
        </Paper>
      ) : viewMode === 'grid' ? (
        <Grid container spacing={{ xs: 2, sm: 3 }}>
          {paginatedItems.map((product) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={product._id}>
              <ProductCard product={product} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box>
          {paginatedItems.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </Box>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Stack alignItems="center" mt={{ xs: 3, sm: 4 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(_, page) => setCurrentPage(page)}
            color="primary"
            size="medium"
            showFirstButton
            showLastButton
            sx={{
              '& .MuiPagination-ul': {
                flexWrap: 'wrap'
              },
              '& .MuiPaginationItem-root': {
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              }
            }}
          />
        </Stack>
      )}

      {/* Add/Edit Product Dialog */}
      <Dialog 
        open={open} 
        onClose={() => setOpen(false)} 
        fullWidth 
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: { xs: 0, sm: 2 },
            mx: { xs: 0, sm: 2 },
            my: { xs: 0, sm: 2 }
          }
        }}
      >
        <DialogTitle sx={{ pb: 1, px: { xs: 2, sm: 3 } }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ 
              bgcolor: 'primary.main',
              width: { xs: 32, sm: 40 },
              height: { xs: 32, sm: 40 }
            }}>
              {editing ? <EditIcon fontSize="small" /> : <AddIcon fontSize="small" />}
            </Avatar>
            <Typography 
              variant="h6" 
              fontWeight={700}
              sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
            >
              {editing ? 'Edit Product' : 'Add New Product'}
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ px: { xs: 2, sm: 3 } }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Stack spacing={{ xs: 2, sm: 3 }} mt={1}>
            <TextField 
              label="Product Title" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              fullWidth 
              required 
              size="small"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField 
                label="Price" 
                type="number" 
                value={price} 
                onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))} 
                required 
                fullWidth 
                size="small"
                inputProps={{ min: 0, step: 0.01 }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <TextField 
                label="Currency" 
                value={currency} 
                onChange={(e) => setCurrency(e.target.value)} 
                size="small"
                sx={{ 
                  width: { xs: '100%', sm: 140 }, 
                  '& .MuiOutlinedInput-root': { borderRadius: 2 } 
                }} 
              />
            </Stack>

            <FormControl fullWidth required>
              <InputLabel>Category</InputLabel>
              <Select
                value={category}
                label="Category"
                onChange={(e) => setCategory(e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Store (Optional)</InputLabel>
              <Select
                value={selectedStore}
                label="Store (Optional)"
                onChange={(e) => setSelectedStore(e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="">No Store</MenuItem>
                {stores.filter(store => store.approved).map((store) => (
                  <MenuItem key={store._id} value={store._id}>
                    {store.name}
                    {!store.approved && " (Pending Approval)"}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField 
              label="Description" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              multiline 
              rows={3} 
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />

            {/* Image Upload Section */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Product Images *
              </Typography>
              <Button
                variant="outlined"
                component="label"
                startIcon={uploadingImages ? <CircularProgress size={20} /> : <CloudUploadIcon />}
                disabled={uploadingImages}
                fullWidth
                sx={{ mb: 2, borderRadius: 2, borderStyle: 'dashed' }}
              >
                {uploadingImages ? 'Uploading...' : 'Upload Images'}
                <input
                  type="file"
                  hidden
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                />
              </Button>

              {images.length > 0 && (
                <Grid container spacing={2}>
                  {images.map((image, index) => (
                    <Grid item xs={6} sm={4} key={index}>
                      <Paper
                        sx={{
                          position: 'relative',
                          paddingTop: '100%',
                          overflow: 'hidden',
                          borderRadius: 2
                        }}
                      >
                        <Box
                          component="img"
                          src={image}
                          alt={`Product ${index + 1}`}
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveImage(index)}
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            bgcolor: 'rgba(255, 255, 255, 0.9)',
                            '&:hover': {
                              bgcolor: 'rgba(255, 255, 255, 1)'
                            }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                        {index === 0 && (
                          <Chip
                            label="Main"
                            size="small"
                            color="primary"
                            sx={{
                              position: 'absolute',
                              bottom: 8,
                              left: 8
                            }}
                          />
                        )}
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setOpen(false)} sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button 
            onClick={saveProduct} 
            variant="contained" 
            disabled={uploadingImages}
            sx={{ borderRadius: 2 }}
          >
            {editing ? 'Update Product' : 'Create Product'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}