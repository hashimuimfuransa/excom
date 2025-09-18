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
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Paper
} from '@mui/material';
import {
  ShoppingBag,
  Person,
  Store,
  LocalShipping,
  CheckCircle,
  Cancel,
  Schedule,
  AttachMoney,
  Visibility,
  Edit,
  TrendingUp,
  Receipt
} from '@mui/icons-material';
import { apiGet, apiPatch } from '@utils/api';
import AdminLayout from '@/components/admin/AdminLayout';
import DataTable, { Column } from '@/components/admin/DataTable';

interface OrderItem {
  product: {
    _id: string;
    title: string;
    price: number;
    images?: string[];
  };
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  orderNumber: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  seller?: {
    _id: string;
    name: string;
    email: string;
  };
  store?: {
    _id: string;
    name: string;
  };
  items: OrderItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  createdAt: string;
  updatedAt: string;
  deliveredAt?: string;
  trackingNumber?: string;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailDialog, setDetailDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('excom_token');
      if (!token) {
        window.location.href = '/auth/login';
        return;
      }

      // Fetch orders from backend - try different endpoints
      try {
        const data = await apiGet<Order[]>('/orders');
        setOrders(data);
      } catch (orderError) {
        // If orders endpoint fails, try admin endpoint
        try {
          const adminData = await apiGet<Order[]>('/admin/orders');
          setOrders(adminData);
        } catch (adminError) {
          // If both fail, use mock data
          console.warn('Backend endpoints not available, using mock data');
          setOrders(generateMockOrders());
        }
      }
    } catch (error) {
      setError('Failed to fetch orders');
      console.error('Error fetching orders:', error);
      // Use mock data as fallback
      setOrders(generateMockOrders());
    } finally {
      setLoading(false);
    }
  };

  const generateMockOrders = (): Order[] => {
    const statuses: Order['status'][] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    const paymentStatuses: Order['paymentStatus'][] = ['pending', 'paid', 'failed'];
    
    return Array.from({ length: 25 }, (_, i) => ({
      _id: `order_${i + 1}`,
      orderNumber: `ORD-${1000 + i}`,
      user: {
        _id: `user_${i + 1}`,
        name: `Customer ${i + 1}`,
        email: `customer${i + 1}@example.com`
      },
      seller: {
        _id: `seller_${(i % 5) + 1}`,
        name: `Seller ${(i % 5) + 1}`,
        email: `seller${(i % 5) + 1}@example.com`
      },
      store: {
        _id: `store_${(i % 5) + 1}`,
        name: `Store ${(i % 5) + 1}`
      },
      items: [
        {
          product: {
            _id: `product_${i + 1}`,
            title: `Product ${i + 1}`,
            price: 29.99 + (i * 5),
            images: ['https://via.placeholder.com/300']
          },
          quantity: Math.floor(Math.random() * 3) + 1,
          price: 29.99 + (i * 5)
        }
      ],
      total: (29.99 + (i * 5)) * (Math.floor(Math.random() * 3) + 1),
      status: statuses[Math.floor(Math.random() * statuses.length)],
      paymentStatus: paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)],
      deliveryAddress: {
        street: `${123 + i} Main Street`,
        city: 'Sample City',
        state: 'Sample State',
        zipCode: `${12345 + i}`,
        country: 'USA'
      },
      createdAt: new Date(Date.now() - (i * 86400000)).toISOString(),
      updatedAt: new Date(Date.now() - (i * 43200000)).toISOString(),
      deliveredAt: Math.random() > 0.5 ? new Date(Date.now() - (i * 21600000)).toISOString() : undefined,
      trackingNumber: Math.random() > 0.3 ? `TRK${1000000 + i}` : undefined
    }));
  };

  const handleOrderAction = async (action: string, order: Order) => {
    setSelectedOrder(order);

    switch (action) {
      case 'view':
        setDetailDialog(true);
        break;
      case 'update_status':
        await handleUpdateOrderStatus(order._id, 'shipped');
        break;
      case 'mark_delivered':
        await handleUpdateOrderStatus(order._id, 'delivered');
        break;
      case 'cancel':
        await handleUpdateOrderStatus(order._id, 'cancelled');
        break;
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: Order['status']) => {
    if (!confirm(`Are you sure you want to mark this order as ${status}?`)) return;
    
    try {
      await apiPatch(`/admin/orders/${orderId}/status`, { status });
      setOrders(prev => prev.map(o => 
        o._id === orderId 
          ? { 
              ...o, 
              status, 
              deliveredAt: status === 'delivered' ? new Date().toISOString() : o.deliveredAt 
            }
          : o
      ));
    } catch (error) {
      setError('Failed to update order status');
      // Update locally for demo
      setOrders(prev => prev.map(o => 
        o._id === orderId 
          ? { 
              ...o, 
              status, 
              deliveredAt: status === 'delivered' ? new Date().toISOString() : o.deliveredAt 
            }
          : o
      ));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'success';
      case 'shipped': return 'info';
      case 'processing': return 'warning';
      case 'confirmed': return 'primary';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'success';
      case 'failed': return 'error';
      case 'refunded': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle />;
      case 'shipped': return <LocalShipping />;
      case 'processing': return <Schedule />;
      case 'cancelled': return <Cancel />;
      default: return <Receipt />;
    }
  };

  const columns: Column[] = [
    {
      id: 'orderNumber',
      label: 'Order',
      format: (value, order: Order) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <Receipt />
          </Avatar>
          <Box>
            <Typography variant="subtitle2" fontWeight={600}>
              {order.orderNumber}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {new Date(order.createdAt).toLocaleDateString()}
            </Typography>
          </Box>
        </Box>
      )
    },
    {
      id: 'user',
      label: 'Customer',
      format: (value, order: Order) => (
        <Box>
          <Typography variant="subtitle2" fontWeight={600}>
            {order.user.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {order.user.email}
          </Typography>
        </Box>
      )
    },
    {
      id: 'store',
      label: 'Store',
      format: (value, order: Order) => order.store ? (
        <Box>
          <Typography variant="subtitle2" fontWeight={600}>
            {order.store.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {order.seller?.name || 'Unknown Seller'}
          </Typography>
        </Box>
      ) : 'Direct Sale'
    },
    {
      id: 'total',
      label: 'Total',
      format: (value: number) => (
        <Typography variant="body1" fontWeight={600} color="success.main">
          ${value.toFixed(2)}
        </Typography>
      )
    },
    {
      id: 'paymentStatus',
      label: 'Payment',
      format: (value: string) => (
        <Chip
          size="small"
          label={value.charAt(0).toUpperCase() + value.slice(1)}
          color={getPaymentStatusColor(value) as any}
        />
      )
    },
    {
      id: 'status',
      label: 'Status',
      format: (value, order: Order) => (
        <Chip
          size="small"
          label={order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          color={getStatusColor(order.status) as any}
          icon={getStatusIcon(order.status)}
        />
      )
    }
  ];

  const getRowActions = (order: Order) => {
    const actions = [
      { label: 'View Details', action: 'view', icon: <Visibility /> }
    ];

    if (order.status === 'confirmed' || order.status === 'processing') {
      actions.push({ label: 'Mark as Shipped', action: 'update_status', icon: <LocalShipping /> });
    }
    
    if (order.status === 'shipped') {
      actions.push({ label: 'Mark as Delivered', action: 'mark_delivered', icon: <CheckCircle /> });
    }

    if (order.status !== 'cancelled' && order.status !== 'delivered') {
      actions.push({ label: 'Cancel Order', action: 'cancel', icon: <Cancel /> });
    }
    
    return actions;
  };

  // Stats calculations
  const totalOrders = orders.length;
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'confirmed').length;
  const totalRevenue = orders
    .filter(o => o.paymentStatus === 'paid' && o.status === 'delivered')
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            Orders Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Monitor and manage all orders across the platform
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
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <ShoppingBag />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight={700}>
                      {totalOrders}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Orders
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
                    <CheckCircle />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight={700}>
                      {deliveredOrders}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Delivered
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
                    <Schedule />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight={700}>
                      {pendingOrders}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pending
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
                      Revenue
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Orders Table */}
        <DataTable
          title={`All Orders (${orders.length})`}
          columns={columns}
          rows={orders}
          loading={loading}
          searchable
          onRowAction={handleOrderAction}
          rowActions={getRowActions(orders[0] || {} as Order)}
          emptyMessage="No orders found"
        />

        {/* Order Details Dialog */}
        <Dialog open={detailDialog} onClose={() => setDetailDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            Order Details - {selectedOrder?.orderNumber}
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            {selectedOrder && (
              <Box>
                {/* Order Status */}
                <Box sx={{ mb: 3 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Order Status
                      </Typography>
                      <Chip 
                        label={selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                        color={getStatusColor(selectedOrder.status) as any}
                        icon={getStatusIcon(selectedOrder.status)}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Payment Status
                      </Typography>
                      <Chip 
                        label={selectedOrder.paymentStatus.charAt(0).toUpperCase() + selectedOrder.paymentStatus.slice(1)}
                        color={getPaymentStatusColor(selectedOrder.paymentStatus) as any}
                      />
                    </Grid>
                  </Grid>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Customer Information */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Customer Information
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar>
                      <Person />
                    </Avatar>
                    <Box>
                      <Typography variant="body1" fontWeight={600}>
                        {selectedOrder.user.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedOrder.user.email}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Delivery Address
                    </Typography>
                    <Typography variant="body2">
                      {selectedOrder.deliveryAddress.street}<br />
                      {selectedOrder.deliveryAddress.city}, {selectedOrder.deliveryAddress.state} {selectedOrder.deliveryAddress.zipCode}<br />
                      {selectedOrder.deliveryAddress.country}
                    </Typography>
                  </Paper>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Store Information */}
                {selectedOrder.store && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Store Information
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'warning.main' }}>
                        <Store />
                      </Avatar>
                      <Box>
                        <Typography variant="body1" fontWeight={600}>
                          {selectedOrder.store.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Seller: {selectedOrder.seller?.name || 'Unknown'}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                )}

                <Divider sx={{ my: 3 }} />

                {/* Order Items */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Order Items
                  </Typography>
                  <List>
                    {selectedOrder.items.map((item, index) => (
                      <ListItem key={index} sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar 
                            src={item.product.images?.[0]} 
                            sx={{ bgcolor: 'primary.main' }}
                          >
                            <ShoppingBag />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={item.product.title}
                          secondary={`Quantity: ${item.quantity} × $${item.price.toFixed(2)}`}
                        />
                        <Typography variant="body1" fontWeight={600}>
                          ${(item.quantity * item.price).toFixed(2)}
                        </Typography>
                      </ListItem>
                    ))}
                  </List>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2 }}>
                    <Typography variant="h6">Total:</Typography>
                    <Typography variant="h6" color="success.main">
                      ${selectedOrder.total.toFixed(2)}
                    </Typography>
                  </Box>
                </Box>

                {/* Tracking Information */}
                {selectedOrder.trackingNumber && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Tracking Information
                    </Typography>
                    <Typography variant="body1">
                      <strong>Tracking Number:</strong> {selectedOrder.trackingNumber}
                    </Typography>
                  </Box>
                )}

                {/* Timestamps */}
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Timeline
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Order Placed
                      </Typography>
                      <Typography variant="body1">
                        {new Date(selectedOrder.createdAt).toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Last Updated
                      </Typography>
                      <Typography variant="body1">
                        {new Date(selectedOrder.updatedAt).toLocaleString()}
                      </Typography>
                    </Grid>
                    {selectedOrder.deliveredAt && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                          Delivered At
                        </Typography>
                        <Typography variant="body1" color="success.main">
                          {new Date(selectedOrder.deliveredAt).toLocaleString()}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailDialog(false)}>Close</Button>
            {selectedOrder?.status === 'confirmed' && (
              <Button 
                variant="contained" 
                onClick={() => {
                  setDetailDialog(false);
                  handleOrderAction('update_status', selectedOrder);
                }}
              >
                Mark as Shipped
              </Button>
            )}
            {selectedOrder?.status === 'shipped' && (
              <Button 
                variant="contained" 
                color="success"
                onClick={() => {
                  setDetailDialog(false);
                  handleOrderAction('mark_delivered', selectedOrder);
                }}
              >
                Mark as Delivered
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </Box>
    </AdminLayout>
  );
}