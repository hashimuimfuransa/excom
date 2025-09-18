"use client";
import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Grid,
  Alert,
  Divider,
  Paper,
  ImageList,
  ImageListItem,
  List,
  ListItem,
  ListItemText,
  Rating
} from '@mui/material';
import {
  ShoppingBag,
  Store,
  Visibility,
  Edit,
  Delete,
  Block,
  CheckCircle,
  AttachMoney,
  Inventory,
  Category,
  Star
} from '@mui/icons-material';
import { apiGet, apiPatch, apiDelete } from '@utils/api';
import AdminLayout from '@/components/admin/AdminLayout';
import DataTable, { Column } from '@/components/admin/DataTable';

interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  subcategory?: string;
  images: string[];
  stock: number;
  isActive: boolean;
  seller: {
    _id: string;
    name: string;
    email: string;
  };
  store?: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
  rating?: number;
  reviewCount?: number;
  sales?: number;
  revenue?: number;
  status?: 'active' | 'inactive' | 'suspended' | 'pending';
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailDialog, setDetailDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('excom_token');
      if (!token) {
        window.location.href = '/auth/login';
        return;
      }

      // Fetch all products from backend
      const data = await apiGet<Product[]>('/products');
      
      // Transform backend data to match our Product interface
      const transformedProducts = data.map(product => ({
        ...product,
        status: (product.status || (product.isActive ? 'active' : 'inactive')) as Product['status'],
        sales: product.sales || 0, // Will be populated from orders data
        revenue: product.revenue || 0, // Will be populated from orders data
        reviewCount: product.reviewCount || 0, // Will be populated from reviews data
        rating: product.rating || 0
      }));

      setProducts(transformedProducts);
    } catch (error) {
      setError('Failed to fetch products');
      console.error('Error fetching products:', error);
      // Use mock data as fallback
      setProducts(generateMockProducts());
    } finally {
      setLoading(false);
    }
  };

  const generateMockProducts = (): Product[] => {
    const categories = ['Electronics', 'Fashion', 'Home & Garden', 'Sports', 'Books', 'Beauty'];
    const statuses: Product['status'][] = ['active', 'inactive', 'suspended', 'pending'];
    
    return Array.from({ length: 30 }, (_, i) => ({
      _id: `product_${i + 1}`,
      title: `Product ${i + 1} - Sample Item`,
      description: `This is a detailed description for Product ${i + 1}. It includes all the important features and specifications that customers need to know.`,
      price: 29.99 + (i * 10),
      originalPrice: 39.99 + (i * 10),
      category: categories[Math.floor(Math.random() * categories.length)],
      subcategory: 'Subcategory',
      images: [
        'https://via.placeholder.com/400x300',
        'https://via.placeholder.com/400x300/0000FF/808080',
        'https://via.placeholder.com/400x300/FF0000/FFFF00'
      ],
      stock: Math.floor(Math.random() * 100) + 1,
      isActive: Math.random() > 0.2,
      seller: {
        _id: `seller_${(i % 5) + 1}`,
        name: `Seller ${(i % 5) + 1}`,
        email: `seller${(i % 5) + 1}@example.com`
      },
      store: {
        _id: `store_${(i % 5) + 1}`,
        name: `Store ${(i % 5) + 1}`
      },
      createdAt: new Date(Date.now() - (i * 86400000)).toISOString(),
      updatedAt: new Date(Date.now() - (i * 43200000)).toISOString(),
      rating: 3.5 + Math.random() * 1.5,
      reviewCount: Math.floor(Math.random() * 50) + 1,
      sales: Math.floor(Math.random() * 200) + 5,
      revenue: (29.99 + (i * 10)) * (Math.floor(Math.random() * 200) + 5),
      status: statuses[Math.floor(Math.random() * statuses.length)] || 'inactive'
    }));
  };

  const handleProductAction = async (action: string, product: Product) => {
    setSelectedProduct(product);

    switch (action) {
      case 'view':
        setDetailDialog(true);
        break;
      case 'edit':
        // TODO: Navigate to product edit page
        console.log('Edit product:', product.title);
        break;
      case 'suspend':
        await handleSuspendProduct(product._id);
        break;
      case 'activate':
        await handleActivateProduct(product._id);
        break;
      case 'delete':
        await handleDeleteProduct(product._id);
        break;
    }
  };

  const handleSuspendProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to suspend this product?')) return;
    
    try {
      // Try different endpoint patterns
      await apiPatch(`/products/${productId}`, { isActive: false, status: 'suspended' })
        .catch(() => apiPatch(`/admin/products/${productId}/suspend`, { suspended: true }))
        .catch(() => apiPatch(`/admin/products/${productId}`, { isActive: false, status: 'suspended' }));
      
      setProducts(prev => prev.map(p => 
        p._id === productId 
          ? { ...p, status: 'suspended', isActive: false }
          : p
      ));
    } catch (error) {
      setError('Failed to suspend product');
      console.error('Error suspending product:', error);
      // Update locally for demo
      setProducts(prev => prev.map(p => 
        p._id === productId 
          ? { ...p, status: 'suspended', isActive: false }
          : p
      ));
    }
  };

  const handleActivateProduct = async (productId: string) => {
    try {
      // Try different endpoint patterns
      await apiPatch(`/products/${productId}`, { isActive: true, status: 'active' })
        .catch(() => apiPatch(`/admin/products/${productId}/activate`, { suspended: false }))
        .catch(() => apiPatch(`/admin/products/${productId}`, { isActive: true, status: 'active' }));
      
      setProducts(prev => prev.map(p => 
        p._id === productId 
          ? { ...p, status: 'active', isActive: true }
          : p
      ));
    } catch (error) {
      setError('Failed to activate product');
      console.error('Error activating product:', error);
      // Update locally for demo
      setProducts(prev => prev.map(p => 
        p._id === productId 
          ? { ...p, status: 'active', isActive: true }
          : p
      ));
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to permanently delete this product? This action cannot be undone.')) return;
    
    try {
      await apiDelete(`/admin/products/${productId}`);
      setProducts(prev => prev.filter(p => p._id !== productId));
    } catch (error) {
      setError('Failed to delete product');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'pending': return 'warning';
      case 'suspended': return 'error';
      case 'inactive': return 'default';
      default: return 'default';
    }
  };

  const getProductStatus = (product: Product): 'active' | 'inactive' | 'suspended' | 'pending' => {
    return product.status || (product.isActive ? 'active' : 'inactive');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle />;
      case 'suspended': return <Block />;
      case 'pending': return <Inventory />;
      default: return <ShoppingBag />;
    }
  };

  const columns: Column[] = [
    {
      id: 'title',
      label: 'Product',
      format: (value, product: Product) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar 
            src={product.images[0]} 
            sx={{ width: 50, height: 50, borderRadius: 2 }}
            variant="rounded"
          >
            <ShoppingBag />
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="subtitle2" fontWeight={600} noWrap>
              {product.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {product.category}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <Rating value={product.rating || 0} size="small" readOnly />
              <Typography variant="caption" color="text.secondary">
                ({product.reviewCount || 0})
              </Typography>
            </Box>
          </Box>
        </Box>
      )
    },
    {
      id: 'seller',
      label: 'Seller',
      format: (value, product: Product) => (
        <Box>
          <Typography variant="subtitle2" fontWeight={600}>
            {product.seller.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {product.store?.name || 'Direct Sale'}
          </Typography>
        </Box>
      )
    },
    {
      id: 'price',
      label: 'Price',
      format: (value: number, product: Product) => (
        <Box>
          <Typography variant="body1" fontWeight={600} color="success.main">
            ${value.toFixed(2)}
          </Typography>
          {product.originalPrice && product.originalPrice > value && (
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ textDecoration: 'line-through' }}
            >
              ${product.originalPrice.toFixed(2)}
            </Typography>
          )}
        </Box>
      )
    },
    {
      id: 'stock',
      label: 'Stock',
      format: (value: number) => (
        <Typography 
          variant="body2" 
          fontWeight={600}
          color={value > 10 ? 'success.main' : value > 0 ? 'warning.main' : 'error.main'}
        >
          {value} units
        </Typography>
      )
    },
    {
      id: 'sales',
      label: 'Sales',
      format: (value: number) => (
        <Typography variant="body2" fontWeight={600}>
          {value || 0} sold
        </Typography>
      )
    },
    {
      id: 'revenue',
      label: 'Revenue',
      format: (value: number) => (
        <Typography variant="body2" fontWeight={600} color="success.main">
          ${(value || 0).toLocaleString()}
        </Typography>
      )
    },
    {
      id: 'status',
      label: 'Status',
      format: (value, product: Product) => {
        const status = getProductStatus(product);
        return (
          <Chip
            size="small"
            label={status.charAt(0).toUpperCase() + status.slice(1)}
            color={getStatusColor(status) as any}
            icon={getStatusIcon(status)}
          />
        );
      }
    }
  ];

  const getRowActions = (product: Product) => {
    const actions = [
      { label: 'View Details', action: 'view', icon: <Visibility /> },
      { label: 'Edit Product', action: 'edit', icon: <Edit /> }
    ];

    const status = getProductStatus(product);
    
    if (status === 'active') {
      actions.push({ label: 'Suspend Product', action: 'suspend', icon: <Block /> });
    } else if (['suspended', 'inactive'].includes(status)) {
      actions.push({ label: 'Activate Product', action: 'activate', icon: <CheckCircle /> });
    }

    actions.push({ label: 'Delete Product', action: 'delete', icon: <Delete /> });
    
    return actions;
  };

  const handleBulkAction = (action: string, selectedProducts: Product[]) => {
    console.log('Bulk action:', action, 'on products:', selectedProducts);
    // Implement bulk actions here
  };

  const bulkActions = [
    { label: 'Suspend Selected', action: 'suspend_bulk', icon: <Block /> },
    { label: 'Delete Selected', action: 'delete_bulk', icon: <Delete /> }
  ];

  // Stats calculations
  const activeProducts = products.filter(p => getProductStatus(p) === 'active').length;
  const suspendedProducts = products.filter(p => getProductStatus(p) === 'suspended').length;
  const lowStockProducts = products.filter(p => p.stock <= 5).length;
  const totalRevenue = products.reduce((sum, p) => sum + (p.revenue || 0), 0);

  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            Products Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Monitor and manage all products across stores and sellers
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Stats Overview */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'success.main' }}>
                    <CheckCircle />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight={700}>
                      {activeProducts}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Products
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'error.main' }}>
                    <Block />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight={700}>
                      {suspendedProducts}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Suspended
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'warning.main' }}>
                    <Inventory />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight={700}>
                      {lowStockProducts}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Low Stock
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'success.main' }}>
                    <AttachMoney />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight={700}>
                      ${totalRevenue.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Revenue
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Products Table */}
        <DataTable
          title={`All Products (${products.length})`}
          columns={columns}
          rows={products}
          loading={loading}
          searchable
          selectable
          onRowAction={handleProductAction}
          onBulkAction={handleBulkAction}
          rowActions={getRowActions(products[0] || {} as Product)}
          bulkActions={bulkActions}
          emptyMessage="No products found"
        />

        {/* Product Details Dialog */}
        <Dialog open={detailDialog} onClose={() => setDetailDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>Product Details</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            {selectedProduct && (
              <Box>
                {/* Product Images */}
                <Box sx={{ mb: 3 }}>
                  <ImageList cols={3} rowHeight={150} sx={{ mb: 2 }}>
                    {selectedProduct.images.slice(0, 3).map((image, index) => (
                      <ImageListItem key={index}>
                        <img
                          src={image}
                          alt={`Product ${index + 1}`}
                          loading="lazy"
                          style={{ borderRadius: 8 }}
                        />
                      </ImageListItem>
                    ))}
                  </ImageList>
                </Box>

                {/* Product Info */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    {selectedProduct.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" paragraph>
                    {selectedProduct.description}
                  </Typography>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Seller & Store Info */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Seller Information
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <Store />
                    </Avatar>
                    <Box>
                      <Typography variant="body1" fontWeight={600}>
                        {selectedProduct.seller.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedProduct.seller.email}
                      </Typography>
                      {selectedProduct.store && (
                        <Typography variant="body2" color="primary.main">
                          Store: {selectedProduct.store.name}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Product Stats */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Product Statistics
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={6} md={3}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6" color="success.main">
                          ${selectedProduct.price.toFixed(2)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Current Price
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6">
                          {selectedProduct.stock}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          In Stock
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6">
                          {selectedProduct.sales || 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Total Sales
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                          <Typography variant="h6">
                            {selectedProduct.rating?.toFixed(1) || '0.0'}
                          </Typography>
                          <Star sx={{ color: 'warning.main', fontSize: 18 }} />
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          Rating ({selectedProduct.reviewCount || 0} reviews)
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Additional Details */}
                <Box>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Additional Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Category
                      </Typography>
                      <Typography variant="body1">
                        {selectedProduct.category}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Status
                      </Typography>
                      <Chip 
                        size="small" 
                        label={getProductStatus(selectedProduct).charAt(0).toUpperCase() + getProductStatus(selectedProduct).slice(1)}
                        color={getStatusColor(getProductStatus(selectedProduct)) as any}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Created Date
                      </Typography>
                      <Typography variant="body1">
                        {new Date(selectedProduct.createdAt).toLocaleDateString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Last Updated
                      </Typography>
                      <Typography variant="body1">
                        {new Date(selectedProduct.updatedAt).toLocaleDateString()}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailDialog(false)}>Close</Button>
            {selectedProduct && getProductStatus(selectedProduct) === 'active' && (
              <Button 
                variant="outlined" 
                color="error"
                onClick={() => {
                  setDetailDialog(false);
                  handleProductAction('suspend', selectedProduct);
                }}
              >
                Suspend Product
              </Button>
            )}
            {selectedProduct && ['suspended', 'inactive'].includes(getProductStatus(selectedProduct)) && (
              <Button 
                variant="contained" 
                color="success"
                onClick={() => {
                  setDetailDialog(false);
                  handleProductAction('activate', selectedProduct);
                }}
              >
                Activate Product
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </Box>
    </AdminLayout>
  );
}