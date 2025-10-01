"use client";
import React, { useEffect, useState, useMemo } from 'react';
import { 
  Box, Button, Chip, Container, Dialog, DialogActions, DialogContent, DialogTitle, 
  FormControl, Grid, IconButton, InputLabel, MenuItem, Paper, Select, Stack, 
  TextField, Tooltip, Typography, Alert, CircularProgress, InputAdornment,
  Card, CardMedia, CardContent, CardActions, Fab, Pagination, Divider, Avatar,
  FormControlLabel, Switch, Collapse
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
  ArrowBack as ArrowBackIcon,
  MonetizationOn,
  ViewInAr as ArIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { apiDelete, apiGet, apiPost, apiPatch } from '@utils/api';
import { useTranslation } from 'react-i18next';
import Product3DManager from '@components/Product3DManager';
import VendorLayout from '@components/VendorLayout';
import LanguageSwitcher from '@components/LanguageSwitcher';
import DarkModeToggle from '@components/DarkModeToggle';

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
  bargainingEnabled?: boolean;
  minBargainPrice?: number;
  maxBargainDiscountPercent?: number;
  createdAt?: string;
  updatedAt?: string;
  // Product variants
  variants?: {
    sizes?: string[];
    colors?: string[];
    weight?: {
      value: number;
      unit: 'kg' | 'g' | 'lb' | 'oz';
      displayValue?: string;
    };
    dimensions?: {
      length: number;
      width: number;
      height: number;
      unit: 'cm' | 'in' | 'm';
    };
    material?: string;
    brand?: string;
    sku?: string;
    inventory?: number;
  };
  // AR/3D Model fields
  modelUrl?: string;
  modelType?: 'gltf' | 'glb' | 'usdz';
  modelStatus?: 'none' | 'generating' | 'ready' | 'failed';
  modelGeneratedAt?: string;
  modelGenerationId?: string;
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
  const { t } = useTranslation();
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
  const [bargainingEnabled, setBargainingEnabled] = useState(false);
  const [minBargainPrice, setMinBargainPrice] = useState<number | ''>('');
  const [maxBargainDiscountPercent, setMaxBargainDiscountPercent] = useState<number | ''>(20);
  
  // Product variants state
  const [variants, setVariants] = useState({
    sizes: [] as string[],
    colors: [] as string[],
    weight: {
      value: '' as number | '',
      unit: 'kg' as 'kg' | 'g' | 'lb' | 'oz',
      displayValue: ''
    },
    dimensions: {
      length: '' as number | '',
      width: '' as number | '',
      height: '' as number | '',
      unit: 'cm' as 'cm' | 'in' | 'm'
    },
    material: '',
    brand: '',
    sku: '',
    inventory: '' as number | ''
  });
  
  // 3D Model management state
  const [expanded3DSections, setExpanded3DSections] = useState<Set<string>>(new Set());
  
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
    setBargainingEnabled(false);
    setMinBargainPrice('');
    setMaxBargainDiscountPercent(20);
    setVariants({
      sizes: [],
      colors: [],
      weight: { value: '', unit: 'kg', displayValue: '' },
      dimensions: { length: '', width: '', height: '', unit: 'cm' },
      material: '',
      brand: '',
      sku: '',
      inventory: ''
    });
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
    setBargainingEnabled(p.bargainingEnabled || false);
    setMinBargainPrice(p.minBargainPrice || '');
    setMaxBargainDiscountPercent(p.maxBargainDiscountPercent || 20);
    setVariants({
      sizes: p.variants?.sizes || [],
      colors: p.variants?.colors || [],
      weight: p.variants?.weight || { value: '', unit: 'kg', displayValue: '' },
      dimensions: p.variants?.dimensions || { length: '', width: '', height: '', unit: 'cm' },
      material: p.variants?.material || '',
      brand: p.variants?.brand || '',
      sku: p.variants?.sku || '',
      inventory: p.variants?.inventory || ''
    });
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
      setError(t('products.requiredFields'));
      return;
    }

    // Validate bargaining settings
    if (bargainingEnabled) {
      if (minBargainPrice && Number(minBargainPrice) >= Number(price)) {
        setError('Minimum bargain price must be less than the product price');
        return;
      }
      if (maxBargainDiscountPercent && (Number(maxBargainDiscountPercent) < 0 || Number(maxBargainDiscountPercent) > 100)) {
        setError('Discount percentage must be between 0 and 100');
        return;
      }
    }

    // Process variants data
    const processedVariants: any = {};
    
    if (variants.sizes.length > 0) processedVariants.sizes = variants.sizes;
    if (variants.colors.length > 0) processedVariants.colors = variants.colors;
    
    if (variants.weight.value) {
      processedVariants.weight = {
        value: Number(variants.weight.value),
        unit: variants.weight.unit,
        displayValue: `${variants.weight.value}${variants.weight.unit}`
      };
    }
    
    if (variants.dimensions.length || variants.dimensions.width || variants.dimensions.height) {
      processedVariants.dimensions = {
        length: Number(variants.dimensions.length) || 0,
        width: Number(variants.dimensions.width) || 0,
        height: Number(variants.dimensions.height) || 0,
        unit: variants.dimensions.unit
      };
    }
    
    if (variants.material) processedVariants.material = variants.material;
    if (variants.brand) processedVariants.brand = variants.brand;
    if (variants.sku) processedVariants.sku = variants.sku;
    if (variants.inventory) processedVariants.inventory = Number(variants.inventory);

    const body = { 
      title: title.trim(), 
      price: Number(price), 
      currency, 
      description: description.trim(), 
      category, 
      images,
      store: selectedStore || undefined,
      bargainingEnabled,
      minBargainPrice: minBargainPrice ? Number(minBargainPrice) : undefined,
      maxBargainDiscountPercent: maxBargainDiscountPercent ? Number(maxBargainDiscountPercent) : undefined,
      variants: Object.keys(processedVariants).length > 0 ? processedVariants : undefined
    };
    try {
      if (!editing) {
        const created = await apiPost<Product>(`/products`, body);
        setItems([created, ...items]);
        
        // Automatically trigger AR generation for new products
        if (created._id && images.length > 0) {
          try {
            const token = localStorage.getItem('excom_token');
            if (token) {
              const arResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ar/${created._id}/generate-3d`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (arResponse.ok) {
                console.log('AR generation started automatically for product:', created.title);
                // Update the product in the list to show generating status
                setItems(prevItems => 
                  prevItems.map(item => 
                    item._id === created._id 
                      ? { ...item, modelStatus: 'generating' }
                      : item
                  )
                );
              } else {
                const errorText = await arResponse.text();
                console.warn('Failed to start AR generation automatically:', errorText);
                
                // Check if it's a subscription error
                if (arResponse.status === 402) {
                  console.warn('AR generation requires Meshy.ai subscription upgrade');
                }
              }
            }
          } catch (arError) {
            console.error('Error starting automatic AR generation:', arError);
            // Don't show error to user as this is automatic
          }
        }
      } else {
        const updated = await apiPatch<Product>(`/products/${editing._id}`, body);
        setItems(items.map(it => it._id === editing._id ? { ...it, ...updated } : it));
      }
      setOpen(false);
    } catch (err) {
      console.error('Save product error:', err);
      setError(t('products.failedToSave'));
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

  // 3D Model management functions
  const toggle3DSection = (productId: string) => {
    const newExpanded = new Set(expanded3DSections);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpanded3DSections(newExpanded);
  };

  const handle3DModelUpdate = (productId: string, modelData: {
    modelUrl?: string;
    modelType?: 'gltf' | 'glb' | 'usdz';
    modelStatus?: 'none' | 'generating' | 'ready' | 'failed';
  }) => {
    setItems(prevItems => 
      prevItems.map(item => 
        item._id === productId 
          ? { ...item, ...modelData }
          : item
      )
    );
  };

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
                  <Typography 
                    variant="h6" 
                    fontWeight={700} 
                    gutterBottom
                    sx={{ 
                      fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem', lg: '1.1rem' },
                      lineHeight: { xs: 1.3, sm: 1.4, md: 1.5, lg: 1.5 }
                    }}
                  >
                    {product.title}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                      mb: 1,
                      fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.875rem', lg: '0.875rem' },
                      lineHeight: { xs: 1.4, sm: 1.5, md: 1.6, lg: 1.6 }
                    }}
                  >
                    {product.description || t('products.noDescription')}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    <Chip label={`${product.price} ${product.currency}`} color="primary" size="small" />
                    {product.category && (
                      <Chip label={t(`categories.${product.category}`)} variant="outlined" size="small" />
                    )}
                    {product.store && (
                      <Chip label={`${t('products.store')}: ${product.store.name}`} color="secondary" size="small" />
                    )}
                    {product.bargainingEnabled && (
                      <Chip 
                        label={t('products.bargainEnabled')} 
                        color="warning" 
                        size="small" 
                        icon={<MonetizationOn fontSize="small" />}
                      />
                    )}
                    {/* 3D Model Status */}
                    {product.modelStatus && product.modelStatus !== 'none' && (
                      <Chip 
                        label={`3D: ${product.modelStatus}`} 
                        color={product.modelStatus === 'ready' ? 'success' : product.modelStatus === 'generating' ? 'warning' : 'error'}
                        size="small" 
                        icon={<ArIcon fontSize="small" />}
                      />
                    )}
                    {product.createdAt && (
                      <Typography variant="caption" color="text.secondary">
                        {t('products.created')} {new Date(product.createdAt).toLocaleDateString()}
                      </Typography>
                    )}
                  </Stack>
                </Box>
                <Stack direction="row">
                  <Tooltip title="3D Model Management">
                    <IconButton 
                      onClick={() => toggle3DSection(product._id)} 
                      color={expanded3DSections.has(product._id) ? "primary" : "default"}
                    >
                      {expanded3DSections.has(product._id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('common.edit')}>
                    <IconButton onClick={() => startEdit(product)} color="primary">
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('common.delete')}>
                    <IconButton onClick={() => remove(product._id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>
            </Box>
          </Stack>
          
          {/* 3D Model Management Section */}
          <Collapse in={expanded3DSections.has(product._id)}>
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Product3DManager
                productId={product._id}
                productTitle={product.title}
                productImage={product.images?.[0]}
                currentModelUrl={product.modelUrl}
                currentModelType={product.modelType}
                currentModelStatus={product.modelStatus}
                onModelUpdate={(modelData) => handle3DModelUpdate(product._id, modelData)}
              />
            </Box>
          </Collapse>
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
          <Typography 
            variant="h6" 
            fontWeight={700} 
            gutterBottom 
            noWrap
            sx={{ 
              fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem', lg: '1.1rem' },
              lineHeight: { xs: 1.3, sm: 1.4, md: 1.5, lg: 1.5 }
            }}
          >
            {product.title}
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mb: 1, 
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.875rem', lg: '0.875rem' },
              lineHeight: { xs: 1.4, sm: 1.5, md: 1.6, lg: 1.6 }
            }}
          >
            {product.description || t('products.noDescription')}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mb: 1 }} flexWrap="wrap">
            <Chip 
              label={`${product.price} ${product.currency}`} 
              color="primary" 
              size="small" 
            />
            {product.category && (
              <Chip 
                label={t(`categories.${product.category}`)} 
                variant="outlined" 
                size="small" 
              />
            )}
            {product.store && (
              <Chip 
                label={`${t('products.store')}: ${product.store.name}`} 
                color="secondary" 
                size="small" 
              />
            )}
            {product.bargainingEnabled && (
              <Chip 
                label={t('products.bargainEnabled')} 
                color="warning" 
                size="small" 
                icon={<MonetizationOn fontSize="small" />}
              />
            )}
            {/* 3D Model Status */}
            {product.modelStatus && product.modelStatus !== 'none' && (
              <Chip 
                label={`3D: ${product.modelStatus}`} 
                color={product.modelStatus === 'ready' ? 'success' : product.modelStatus === 'generating' ? 'warning' : 'error'}
                size="small" 
                icon={<ArIcon fontSize="small" />}
              />
            )}
          </Stack>
          {product.createdAt && (
            <Typography variant="caption" color="text.secondary">
              {t('products.created')} {new Date(product.createdAt).toLocaleDateString()}
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
            {t('common.view')}
          </Button>
          <Stack direction="row">
            <Tooltip title="3D Model Management">
              <IconButton 
                size="small"
                onClick={() => toggle3DSection(product._id)} 
                color={expanded3DSections.has(product._id) ? "primary" : "default"}
              >
                {expanded3DSections.has(product._id) ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
            <Tooltip title={t('common.edit')}>
              <IconButton size="small" onClick={() => startEdit(product)} color="primary">
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={t('common.delete')}>
              <IconButton size="small" onClick={() => remove(product._id)} color="error">
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </CardActions>
        
        {/* 3D Model Management Section */}
        <Collapse in={expanded3DSections.has(product._id)}>
          <Box sx={{ px: 2, pb: 2 }}>
            <Divider sx={{ mb: 2 }} />
            <Product3DManager
              productId={product._id}
              productTitle={product.title}
              productImage={product.images?.[0]}
              currentModelUrl={product.modelUrl}
              currentModelType={product.modelType}
              currentModelStatus={product.modelStatus}
              onModelUpdate={(modelData) => handle3DModelUpdate(product._id, modelData)}
            />
          </Box>
        </Collapse>
      </Card>
    );
  };

  return (
    <VendorLayout>
      <Container 
        maxWidth="xl" 
        sx={{ 
          py: { xs: 2, sm: 3, md: 4, lg: 4 }, 
          px: { xs: 2, sm: 3, md: 4, lg: 4 } 
        }}
      >
      {/* Header */}
      <Stack 
        direction={{ xs: 'column', sm: 'row' }} 
        alignItems={{ xs: 'stretch', sm: 'center' }} 
        justifyContent="space-between" 
        mb={{ xs: 3, sm: 4, md: 4, lg: 4 }}
        spacing={{ xs: 2, sm: 0 }}
      >
        <Stack direction="row" alignItems="center" spacing={{ xs: 1, sm: 2, md: 2, lg: 2 }}>
          <IconButton 
            onClick={() => window.location.href = '/dashboard/vendor'}
            sx={{ 
              bgcolor: 'primary.main', 
              color: 'white',
              '&:hover': { bgcolor: 'primary.dark' },
              width: { xs: 40, sm: 44, md: 48, lg: 48 },
              height: { xs: 40, sm: 44, md: 48, lg: 48 }
            }}
          >
            <ArrowBackIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem', lg: '1.75rem' } }} />
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
              {t('products.myProducts')}
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{ 
                display: { xs: 'none', sm: 'block' },
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }}
            >
              {t('products.manageInventory')}
            </Typography>
          </Box>
        </Stack>
        <Stack 
          direction={{ xs: 'row', sm: 'row' }} 
          spacing={{ xs: 1, sm: 2 }}
          justifyContent={{ xs: 'space-between', sm: 'flex-end' }}
          alignItems="center"
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <LanguageSwitcher />
            <DarkModeToggle />
          </Stack>
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
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ 
                  fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.875rem', lg: '0.875rem' },
                  lineHeight: { xs: 1.4, sm: 1.5, md: 1.6, lg: 1.6 }
                }}
              >
                {t('products.totalProducts')}
              </Typography>
              <Typography 
                variant="h6" 
                fontWeight={700}
                sx={{ 
                  fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem', lg: '1.25rem' },
                  lineHeight: { xs: 1.3, sm: 1.4, md: 1.5, lg: 1.5 }
                }}
              >
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
              {t('products.addProduct')}
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
              placeholder={t('products.searchProducts')}
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
              <InputLabel>{t('products.store')}</InputLabel>
              <Select
                value={storeFilter}
                label={t('products.store')}
                onChange={(e) => setStoreFilter(e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="">{t('products.allStores')}</MenuItem>
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
              <InputLabel>{t('products.category')}</InputLabel>
              <Select
                value={selectedCategory}
                label={t('products.category')}
                onChange={(e) => setSelectedCategory(e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="">{t('products.allCategories')}</MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {t(`categories.${cat}`)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={3} sm={2} md={1}>
            <TextField
              fullWidth
              label={t('products.minPrice')}
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
              label={t('products.maxPrice')}
              type="number"
              value={priceRange.max}
              onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
              size="small"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>{t('products.sortBy')}</InputLabel>
              <Select
                value={`${sortBy}-${sortOrder}`}
                label={t('products.sortBy')}
                onChange={(e) => {
                  const [by, order] = e.target.value.split('-');
                  setSortBy(by as SortBy);
                  setSortOrder(order as SortOrder);
                }}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="createdAt-desc">{t('products.newestFirst')}</MenuItem>
                <MenuItem value="createdAt-asc">{t('products.oldestFirst')}</MenuItem>
                <MenuItem value="title-asc">{t('products.nameAZ')}</MenuItem>
                <MenuItem value="title-desc">{t('products.nameZA')}</MenuItem>
                <MenuItem value="price-asc">{t('products.priceLowHigh')}</MenuItem>
                <MenuItem value="price-desc">{t('products.priceHighLow')}</MenuItem>
                <MenuItem value="category-asc">{t('products.categoryAZ')}</MenuItem>
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
              <Tooltip title={t('products.gridView')}>
                <IconButton 
                  onClick={() => setViewMode('grid')}
                  color={viewMode === 'grid' ? 'primary' : 'default'}
                  size="small"
                >
                  <GridViewIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title={t('products.listView')}>
                <IconButton 
                  onClick={() => setViewMode('list')}
                  color={viewMode === 'list' ? 'primary' : 'default'}
                  size="small"
                >
                  <ListViewIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title={t('products.clearFilters')}>
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
              {t('products.activeFilters')}
            </Typography>
            {searchQuery && (
              <Chip 
                label={`${t('products.searchFilter')} "${searchQuery}"`} 
                size="small" 
                onDelete={() => setSearchQuery('')} 
              />
            )}
            {storeFilter && (
              <Chip 
                label={`${t('products.storeFilter')} ${stores.find(s => s._id === storeFilter)?.name || storeFilter}`} 
                size="small" 
                onDelete={() => setStoreFilter('')} 
              />
            )}
            {selectedCategory && (
              <Chip 
                label={`${t('products.categoryFilter')} ${t(`categories.${selectedCategory}`)}`} 
                size="small" 
                onDelete={() => setSelectedCategory('')} 
              />
            )}
            {(priceRange.min || priceRange.max) && (
              <Chip 
                label={`${t('products.priceFilter')} ${priceRange.min || '0'} - ${priceRange.max || '∞'}`} 
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
          {t('products.showing')} {paginatedItems.length} {t('products.of')} {filteredAndSortedItems.length} {t('products.noProducts')}
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
            {items.length === 0 ? t('products.noProductsYet') : t('products.noMatchingProducts')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {items.length === 0 
              ? t('products.createFirstProduct')
              : t('products.adjustSearchCriteria')
            }
          </Typography>
          {items.length === 0 ? (
            <Button 
              variant="contained" 
              startIcon={<AddIcon />} 
              onClick={startCreate}
              size="medium"
            >
              {t('products.addFirstProduct')}
            </Button>
          ) : (
            <Button 
              variant="outlined" 
              onClick={clearFilters}
              size="medium"
            >
              {t('products.clearFilters')}
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
              {editing ? t('products.editProduct') : t('products.addProduct')}
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
              label={t('products.productTitle')} 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              fullWidth 
              required 
              size="small"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField 
                label={t('products.price')} 
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
                label={t('products.currency')} 
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
              <InputLabel>{t('products.category')}</InputLabel>
              <Select
                value={category}
                label={t('products.category')}
                onChange={(e) => setCategory(e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {t(`categories.${cat}`)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>{t('products.store')} (Optional)</InputLabel>
              <Select
                value={selectedStore}
                label={`${t('products.store')} (Optional)`}
                onChange={(e) => setSelectedStore(e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="">No Store</MenuItem>
                {stores.filter(store => store.approved).map((store) => (
                  <MenuItem key={store._id} value={store._id}>
                    {store.name}
                    {!store.approved && ` (${t('common.pending')})`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField 
              label={t('products.productDescription')} 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              multiline 
              rows={3} 
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />

            {/* Product Variants Section */}
            <Box>
              <Typography variant="h6" gutterBottom>
                {t('products.productVariants')}
              </Typography>
              
              {/* Sizes */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  {t('products.sizes')} (Optional)
                </Typography>
                <TextField
                  fullWidth
                  placeholder="Enter sizes separated by commas (e.g., S, M, L, XL)"
                  value={variants.sizes.join(', ')}
                  onChange={(e) => {
                    const sizes = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                    setVariants(prev => ({ ...prev, sizes }));
                  }}
                  size="small"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  helperText="For clothing and accessories"
                />
              </Box>

              {/* Colors */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  {t('products.colors')} (Optional)
                </Typography>
                <TextField
                  fullWidth
                  placeholder="Enter colors separated by commas (e.g., Red, Blue, Green)"
                  value={variants.colors.join(', ')}
                  onChange={(e) => {
                    const colors = e.target.value.split(',').map(c => c.trim()).filter(c => c);
                    setVariants(prev => ({ ...prev, colors }));
                  }}
                  size="small"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  helperText="Available color options"
                />
              </Box>

              {/* Weight */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  {t('products.weight')} (Optional)
                </Typography>
                <Stack direction="row" spacing={1}>
                  <TextField
                    label={t('products.weightValue')}
                    type="number"
                    value={variants.weight.value}
                    onChange={(e) => setVariants(prev => ({ 
                      ...prev, 
                      weight: { ...prev.weight, value: e.target.value === '' ? '' : Number(e.target.value) }
                    }))}
                    size="small"
                    sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                  <FormControl size="small" sx={{ minWidth: 80 }}>
                    <InputLabel>{t('products.unit')}</InputLabel>
                    <Select
                      value={variants.weight.unit}
                      label={t('products.unit')}
                      onChange={(e) => setVariants(prev => ({ 
                        ...prev, 
                        weight: { ...prev.weight, unit: e.target.value as 'kg' | 'g' | 'lb' | 'oz' }
                      }))}
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="kg">kg</MenuItem>
                      <MenuItem value="g">g</MenuItem>
                      <MenuItem value="lb">lb</MenuItem>
                      <MenuItem value="oz">oz</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>
              </Box>

              {/* Dimensions */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  {t('products.dimensions')} (Optional)
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                  <TextField
                    label={t('products.length')}
                    type="number"
                    value={variants.dimensions.length}
                    onChange={(e) => setVariants(prev => ({ 
                      ...prev, 
                      dimensions: { ...prev.dimensions, length: e.target.value === '' ? '' : Number(e.target.value) }
                    }))}
                    size="small"
                    sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    inputProps={{ min: 0, step: 0.1 }}
                  />
                  <TextField
                    label={t('products.width')}
                    type="number"
                    value={variants.dimensions.width}
                    onChange={(e) => setVariants(prev => ({ 
                      ...prev, 
                      dimensions: { ...prev.dimensions, width: e.target.value === '' ? '' : Number(e.target.value) }
                    }))}
                    size="small"
                    sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    inputProps={{ min: 0, step: 0.1 }}
                  />
                  <TextField
                    label={t('products.height')}
                    type="number"
                    value={variants.dimensions.height}
                    onChange={(e) => setVariants(prev => ({ 
                      ...prev, 
                      dimensions: { ...prev.dimensions, height: e.target.value === '' ? '' : Number(e.target.value) }
                    }))}
                    size="small"
                    sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    inputProps={{ min: 0, step: 0.1 }}
                  />
                </Stack>
                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <InputLabel>{t('products.dimensionUnit')}</InputLabel>
                  <Select
                    value={variants.dimensions.unit}
                    label={t('products.dimensionUnit')}
                    onChange={(e) => setVariants(prev => ({ 
                      ...prev, 
                      dimensions: { ...prev.dimensions, unit: e.target.value as 'cm' | 'in' | 'm' }
                    }))}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="cm">cm</MenuItem>
                    <MenuItem value="in">in</MenuItem>
                    <MenuItem value="m">m</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* Additional Info */}
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label={t('products.brand')}
                    value={variants.brand}
                    onChange={(e) => setVariants(prev => ({ ...prev, brand: e.target.value }))}
                    fullWidth
                    size="small"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label={t('products.material')}
                    value={variants.material}
                    onChange={(e) => setVariants(prev => ({ ...prev, material: e.target.value }))}
                    fullWidth
                    size="small"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label={t('products.sku')}
                    value={variants.sku}
                    onChange={(e) => setVariants(prev => ({ ...prev, sku: e.target.value }))}
                    fullWidth
                    size="small"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    helperText="Stock Keeping Unit"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label={t('products.inventory')}
                    type="number"
                    value={variants.inventory}
                    onChange={(e) => setVariants(prev => ({ 
                      ...prev, 
                      inventory: e.target.value === '' ? '' : Number(e.target.value) 
                    }))}
                    fullWidth
                    size="small"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    inputProps={{ min: 0 }}
                    helperText="Available quantity"
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Bargaining Settings */}
            <Box>
              <Typography variant="h6" gutterBottom>
                {t('products.bargainPrice')}
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={bargainingEnabled}
                    onChange={(e) => setBargainingEnabled(e.target.checked)}
                    color="primary"
                  />
                }
                label={t('products.bargainEnabled')}
                sx={{ mb: 2 }}
              />
              <Collapse in={bargainingEnabled}>
                <Stack spacing={2}>
                  <TextField
                    label={t('products.minimumPrice')}
                    type="number"
                    value={minBargainPrice}
                    onChange={(e) => setMinBargainPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    fullWidth
                    size="small"
                    inputProps={{ min: 0, step: 0.01 }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    helperText={t('products.minimumPriceHelper')}
                  />
                  <TextField
                    label={t('products.maxDiscount')}
                    type="number"
                    value={maxBargainDiscountPercent}
                    onChange={(e) => setMaxBargainDiscountPercent(e.target.value === '' ? '' : Number(e.target.value))}
                    fullWidth
                    size="small"
                    inputProps={{ min: 0, max: 100, step: 1 }}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    helperText={t('products.maxDiscountHelper')}
                  />
                </Stack>
              </Collapse>
            </Box>

            {/* Image Upload Section */}
            <Box>
              <Typography variant="h6" gutterBottom>
                {t('products.images')} *
              </Typography>
              <Button
                variant="outlined"
                component="label"
                startIcon={uploadingImages ? <CircularProgress size={20} /> : <CloudUploadIcon />}
                disabled={uploadingImages}
                fullWidth
                sx={{ mb: 2, borderRadius: 2, borderStyle: 'dashed' }}
              >
                {uploadingImages ? t('common.loading') : t('products.uploadImages')}
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
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={saveProduct} 
            variant="contained" 
            disabled={uploadingImages}
            sx={{ borderRadius: 2 }}
          >
            {editing ? t('common.update') : t('common.create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Bargaining Button */}
      <Fab
        href="/dashboard/vendor/bargaining"
        color="warning"
        aria-label="bargaining hub"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          bgcolor: '#ff9800',
          color: 'white',
          '&:hover': {
            bgcolor: '#f57f17',
            transform: 'scale(1.1)'
          },
          transition: 'all 0.3s ease',
          zIndex: 1000,
          animation: 'pulse 3s infinite',
          '@keyframes pulse': {
            '0%': {
              boxShadow: '0 4px 12px rgba(255, 152, 0, 0.4)',
            },
            '50%': {
              boxShadow: '0 6px 20px rgba(255, 152, 0, 0.8)',
              transform: 'scale(1.05)',
            },
            '100%': {
              boxShadow: '0 4px 12px rgba(255, 152, 0, 0.4)',
            }
          }
        }}
      >
        <MonetizationOn />
      </Fab>
      </Container>
    </VendorLayout>
  );
}