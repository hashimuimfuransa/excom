"use client";
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  Chip,
  Grid,
  Stack,
  CircularProgress,
  Alert,
  Divider,
  useTheme,
  alpha,
  Paper,
  Avatar
} from '@mui/material';
import {
  ShoppingBag as ShoppingBagIcon,
  LocalShipping as ShippingIcon,
  CheckCircle as CompleteIcon,
  Cancel as CancelIcon,
  Schedule as PendingIcon,
  Payment as PaidIcon
} from '@mui/icons-material';
import { apiGet } from '@utils/api';

interface OrderItem {
  product: {
    _id: string;
    name: string;
    images: string[];
    price: number;
  };
  quantity: number;
  price: number;
  vendor: string;
}

interface Order {
  _id: string;
  items: OrderItem[];
  total: number;
  currency: string;
  status: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const data = await apiGet<Order[]>('/orders');
        setOrders(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <PendingIcon sx={{ color: 'warning.main' }} />;
      case 'paid':
        return <PaidIcon sx={{ color: 'info.main' }} />;
      case 'shipped':
        return <ShippingIcon sx={{ color: 'primary.main' }} />;
      case 'completed':
        return <CompleteIcon sx={{ color: 'success.main' }} />;
      case 'cancelled':
        return <CancelIcon sx={{ color: 'error.main' }} />;
      default:
        return <PendingIcon sx={{ color: 'grey.500' }} />;
    }
  };

  const getStatusColor = (status: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'paid':
        return 'info';
      case 'shipped':
        return 'primary';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
          <Avatar 
            sx={{ 
              bgcolor: 'primary.main',
              background: 'linear-gradient(45deg, #2196F3, #21CBF3)',
              width: 48,
              height: 48
            }}
          >
            <ShoppingBagIcon />
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              My Orders
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Track and manage your order history
            </Typography>
          </Box>
        </Stack>
      </Box>

      {orders.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: 3,
            background: theme.palette.mode === 'dark' 
              ? alpha(theme.palette.background.paper, 0.6)
              : alpha(theme.palette.background.paper, 0.8),
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
          }}
        >
          <ShoppingBagIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No orders yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            When you place your first order, it will appear here.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {orders.map((order) => (
            <Grid item xs={12} key={order._id}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 3,
                  background: theme.palette.mode === 'dark' 
                    ? alpha(theme.palette.background.paper, 0.6)
                    : alpha(theme.palette.background.paper, 0.8),
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: theme.palette.mode === 'dark'
                      ? '0 8px 30px rgba(0,0,0,0.3)'
                      : '0 8px 30px rgba(0,0,0,0.1)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  {/* Order Header */}
                  <Stack 
                    direction={{ xs: 'column', sm: 'row' }} 
                    justifyContent="space-between" 
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                    spacing={2}
                    sx={{ mb: 3 }}
                  >
                    <Box>
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        Order #{order._id.slice(-8).toUpperCase()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Placed on {formatDate(order.createdAt)}
                      </Typography>
                    </Box>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Chip
                        icon={getStatusIcon(order.status)}
                        label={order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        color={getStatusColor(order.status)}
                        variant="outlined"
                        sx={{
                          fontWeight: 600,
                          borderRadius: 2,
                          '& .MuiChip-icon': {
                            fontSize: '1rem'
                          }
                        }}
                      />
                      <Typography variant="h6" fontWeight={700} color="primary.main">
                        ${order.total.toFixed(2)} {order.currency}
                      </Typography>
                    </Stack>
                  </Stack>

                  <Divider sx={{ mb: 3 }} />

                  {/* Order Items */}
                  <Stack spacing={2}>
                    {order.items.map((item, index) => (
                      <Box key={index}>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Box
                            component="img"
                            src={item.product.images?.[0] || '/placeholder-product.png'}
                            alt={item.product.name}
                            sx={{
                              width: 60,
                              height: 60,
                              objectFit: 'cover',
                              borderRadius: 2,
                              border: `1px solid ${alpha(theme.palette.divider, 0.2)}`
                            }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder-product.png';
                            }}
                          />
                          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Typography variant="subtitle1" fontWeight={600} noWrap>
                              {item.product.name || 'Product Name'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Vendor: {item.vendor}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Qty: {item.quantity} × ${item.price.toFixed(2)}
                            </Typography>
                          </Box>
                          <Typography variant="subtitle1" fontWeight={600}>
                            ${(item.price * item.quantity).toFixed(2)}
                          </Typography>
                        </Stack>
                        {index < order.items.length - 1 && (
                          <Divider sx={{ mt: 2 }} />
                        )}
                      </Box>
                    ))}
                  </Stack>

                  {/* Order Footer */}
                  <Box sx={{ mt: 3, pt: 2, borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">
                        Last updated: {formatDate(order.updatedAt)}
                      </Typography>
                      <Typography variant="h6" fontWeight={700}>
                        Total: ${order.total.toFixed(2)} {order.currency}
                      </Typography>
                    </Stack>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}