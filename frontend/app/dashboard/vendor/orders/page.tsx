"use client";
import React, { useEffect, useState, useMemo } from 'react';
import { 
  Container, Paper, Stack, Typography, Divider, Box, Chip, Grid,
  TextField, FormControl, InputLabel, Select, MenuItem, Button,
  InputAdornment, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Tooltip, Avatar, Card, CardContent,
  Tabs, Tab, Badge, Alert, Dialog, DialogTitle, DialogContent,
  DialogActions, Collapse
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  LocalShipping as ShippingIcon,
  CheckCircle as CompletedIcon,
  Schedule as PendingIcon,
  Cancel as CancelledIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ShoppingCart,
  TrendingUp,
  AccessTime,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { apiGet, apiPatch } from '@utils/api';
import { useTranslation } from 'react-i18next';
import VendorLayout from '@components/VendorLayout';

interface OrderItem {
  _id: string;
  title: string;
  price: number;
  quantity: number;
  image?: string;
}

interface Order { 
  _id: string; 
  total: number; 
  currency: string; 
  createdAt: string; 
  updatedAt: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  buyer: {
    name: string;
    email: string;
    address?: string;
  };
  items: OrderItem[];
  trackingNumber?: string;
  notes?: string;
}

const statusColors = {
  pending: 'warning',
  processing: 'info',
  shipped: 'primary',
  delivered: 'success',
  cancelled: 'error'
} as const;

const statusIcons = {
  pending: <PendingIcon />,
  processing: <AccessTime />,
  shipped: <ShippingIcon />,
  delivered: <CompletedIcon />,
  cancelled: <CancelledIcon />
};

export default function VendorOrdersPage() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    const token = localStorage.getItem('excom_token');
    if (!token) { 
      window.location.href = '/auth/login'; 
      return; 
    }
    
    // Fetch real vendor orders
    apiGet<Order[]>('/sellers/orders').then((data) => {
      setOrders(data);
      setLoading(false);
    }).catch((error) => {
      console.error('Failed to fetch orders:', error);
      setOrders([]);
      setLoading(false);
    });
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = 
        order._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.buyer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.buyer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.items.some(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      
      const matchesDateFrom = !dateRange.from || new Date(order.createdAt) >= new Date(dateRange.from);
      const matchesDateTo = !dateRange.to || new Date(order.createdAt) <= new Date(dateRange.to);
      
      return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo;
    });
  }, [orders, searchQuery, statusFilter, dateRange]);

  const orderStats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter(o => o.status === 'pending').length;
    const processing = orders.filter(o => o.status === 'processing').length;
    const shipped = orders.filter(o => o.status === 'shipped').length;
    const delivered = orders.filter(o => o.status === 'delivered').length;
    const cancelled = orders.filter(o => o.status === 'cancelled').length;
    const totalRevenue = orders
      .filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + o.total, 0);

    return { total, pending, processing, shipped, delivered, cancelled, totalRevenue };
  }, [orders]);

  const tabOrders = useMemo(() => {
    switch (selectedTab) {
      case 1: return filteredOrders.filter(o => o.status === 'pending');
      case 2: return filteredOrders.filter(o => o.status === 'processing');
      case 3: return filteredOrders.filter(o => o.status === 'shipped');
      case 4: return filteredOrders.filter(o => o.status === 'delivered');
      case 5: return filteredOrders.filter(o => o.status === 'cancelled');
      default: return filteredOrders;
    }
  }, [filteredOrders, selectedTab]);

  const updateOrderStatus = async (orderId: string, status: Order['status'], trackingNumber?: string) => {
    try {
      await apiPatch(`/orders/${orderId}`, { status, trackingNumber });
      setOrders(orders.map(order => 
        order._id === orderId 
          ? { ...order, status, trackingNumber, updatedAt: new Date().toISOString() }
          : order
      ));
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  const toggleRowExpansion = (orderId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedRows(newExpanded);
  };

  const StatCard = ({ title, value, subtitle, color, icon }: {
    title: string;
    value: string | number;
    subtitle?: string;
    color: string;
    icon: React.ReactNode;
  }) => (
    <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{ bgcolor: color, width: 48, height: 48 }}>
            {icon}
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight={700} color={color}>
              {value}
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Container sx={{ py: 4 }}>
        <Typography>{t('vendor.loadingOrders')}</Typography>
      </Container>
    );
  }

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
              {t('vendor.ordersManagement')}
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{ 
                display: { xs: 'none', sm: 'block' },
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }}
            >
              {t('vendor.trackAndManageOrders')}
            </Typography>
          </Box>
        </Stack>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          sx={{ 
            borderRadius: 2,
            px: { xs: 2, sm: 3 }
          }}
          size="small"
        >
          <Typography 
            variant="body1"
            sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
          >
            {t('vendor.exportOrders')}
          </Typography>
        </Button>
      </Stack>

      {/* Stats Cards */}
      <Grid container spacing={{ xs: 2, sm: 3 }} mb={{ xs: 3, sm: 4 }}>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title={t('vendor.totalOrders')}
            value={orderStats.total}
            color="#1976d2"
            icon={<ShoppingCart />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title={t('actions.pending')}
            value={orderStats.pending}
            color="#ed6c02"
            icon={<PendingIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title={t('vendor.processing')}
            value={orderStats.processing}
            color="#0288d1"
            icon={<AccessTime />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title={t('vendor.shipped')}
            value={orderStats.shipped}
            color="#9c27b0"
            icon={<ShippingIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title={t('vendor.delivered')}
            value={orderStats.delivered}
            color="#2e7d32"
            icon={<CompletedIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title={t('vendor.revenue')}
            value={`$${orderStats.totalRevenue.toFixed(2)}`}
            subtitle={t('vendor.deliveredOrders')}
            color="#2e7d32"
            icon={<TrendingUp />}
          />
        </Grid>
      </Grid>

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
              placeholder={t('vendor.searchOrders')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" fontSize="small" />
                  </InputAdornment>
                ),
                sx: { borderRadius: 2 }
              }}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>{t('vendor.status')}</InputLabel>
              <Select
                value={statusFilter}
                label={t('vendor.status')}
                onChange={(e) => setStatusFilter(e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="all">{t('vendor.allStatus')}</MenuItem>
                <MenuItem value="pending">{t('actions.pending')}</MenuItem>
                <MenuItem value="processing">{t('vendor.processing')}</MenuItem>
                <MenuItem value="shipped">{t('vendor.shipped')}</MenuItem>
                <MenuItem value="delivered">{t('vendor.delivered')}</MenuItem>
                <MenuItem value="cancelled">{t('vendor.cancelled')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3} md={2}>
            <TextField
              fullWidth
              label={t('vendor.fromDate')}
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
          <Grid item xs={12} sm={3} md={2}>
            <TextField
              fullWidth
              label={t('vendor.toDate')}
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setDateRange({ from: '', to: '' });
              }}
              sx={{ borderRadius: 2 }}
            >
              {t('vendor.clearFilters')}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Order Tabs */}
      <Paper sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Tabs 
          value={selectedTab} 
          onChange={(_, newValue) => setSelectedTab(newValue)}
          sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 2 }}
        >
          <Tab label={`All (${orderStats.total})`} />
          <Tab 
            label={
              <Badge badgeContent={orderStats.pending} color="warning">
                Pending
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={orderStats.processing} color="info">
                Processing
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={orderStats.shipped} color="primary">
                Shipped
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={orderStats.delivered} color="success">
                Delivered
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={orderStats.cancelled} color="error">
                Cancelled
              </Badge>
            } 
          />
        </Tabs>

        {/* Orders Table */}
        <TableContainer sx={{ 
          overflowX: 'auto',
          '& .MuiTable-root': {
            minWidth: { xs: 800, sm: 'auto' }
          }
        }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width="50px" sx={{ display: { xs: 'none', sm: 'table-cell' } }}></TableCell>
                <TableCell sx={{ minWidth: { xs: 100, sm: 'auto' } }}>Order #</TableCell>
                <TableCell sx={{ minWidth: { xs: 120, sm: 'auto' } }}>Customer</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, minWidth: 100 }}>Items</TableCell>
                <TableCell sx={{ minWidth: { xs: 80, sm: 'auto' } }}>Total</TableCell>
                <TableCell sx={{ minWidth: { xs: 80, sm: 'auto' } }}>Status</TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, minWidth: 100 }}>Date</TableCell>
                <TableCell width="120px" sx={{ minWidth: 100 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tabOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      No orders found matching your criteria
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                tabOrders.map((order) => (
                  <React.Fragment key={order._id}>
                    <TableRow hover>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => toggleRowExpansion(order._id)}
                        >
                          {expandedRows.has(order._id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        <Typography fontWeight={600}>
                          #{order._id.slice(-8)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography fontWeight={600}>
                            {order.customer.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {order.customer.email}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography>
                          {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography fontWeight={700}>
                          ${order.total.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={order.status}
                          color={statusColors[order.status]}
                          size="small"
                          icon={statusIcons[order.status]}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(order.createdAt).toLocaleTimeString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title="View Details">
                            <IconButton 
                              size="small"
                              onClick={() => {
                                setSelectedOrder(order);
                                setDetailsOpen(true);
                              }}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Update Status">
                            <IconButton size="small" color="primary">
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
                        <Collapse in={expandedRows.has(order._id)} timeout="auto" unmountOnExit>
                          <Box sx={{ margin: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Order Items:
                            </Typography>
                            <Grid container spacing={1}>
                              {order.items.map((item) => (
                                <Grid item xs={12} sm={6} md={4} key={item._id}>
                                  <Paper sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box>
                                      <Typography variant="body2" fontWeight={600}>
                                        {item.title}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        ${item.price} × {item.quantity} = ${(item.price * item.quantity).toFixed(2)}
                                      </Typography>
                                    </Box>
                                  </Paper>
                                </Grid>
                              ))}
                            </Grid>
                            {order.trackingNumber && (
                              <Alert severity="info" sx={{ mt: 1 }}>
                                Tracking Number: {order.trackingNumber}
                              </Alert>
                            )}
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Order Details Dialog */}
      <Dialog 
        open={detailsOpen} 
        onClose={() => setDetailsOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        {selectedOrder && (
          <>
            <DialogTitle>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <ShoppingCart />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    Order #{selectedOrder._id.slice(-8)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(selectedOrder.createdAt).toLocaleString()}
                  </Typography>
                </Box>
              </Stack>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Customer Information
                  </Typography>
                  <Stack spacing={1}>
                    <Typography><strong>Name:</strong> {selectedOrder.customer.name}</Typography>
                    <Typography><strong>Email:</strong> {selectedOrder.customer.email}</Typography>
                    {selectedOrder.customer.address && (
                      <Typography><strong>Address:</strong> {selectedOrder.customer.address}</Typography>
                    )}
                  </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Order Status
                  </Typography>
                  <Stack spacing={1}>
                    <Chip
                      label={selectedOrder.status}
                      color={statusColors[selectedOrder.status]}
                      icon={statusIcons[selectedOrder.status]}
                    />
                    {selectedOrder.trackingNumber && (
                      <Typography><strong>Tracking:</strong> {selectedOrder.trackingNumber}</Typography>
                    )}
                    <Typography variant="body2" color="text.secondary">
                      Last updated: {new Date(selectedOrder.updatedAt).toLocaleString()}
                    </Typography>
                  </Stack>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Order Items
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Product</TableCell>
                          <TableCell align="center">Quantity</TableCell>
                          <TableCell align="right">Price</TableCell>
                          <TableCell align="right">Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedOrder.items.map((item) => (
                          <TableRow key={item._id}>
                            <TableCell>{item.title}</TableCell>
                            <TableCell align="center">{item.quantity}</TableCell>
                            <TableCell align="right">${item.price.toFixed(2)}</TableCell>
                            <TableCell align="right">${(item.price * item.quantity).toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell colSpan={3}>
                            <Typography fontWeight={700}>Total</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography fontWeight={700}>${selectedOrder.total.toFixed(2)}</Typography>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailsOpen(false)}>Close</Button>
              <Button variant="contained">Update Order</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
      </Container>
    </VendorLayout>
  );
}