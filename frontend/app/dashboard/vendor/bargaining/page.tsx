"use client";
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { 
  Box, Button, Card, CardContent, Container, Grid, Paper, Stack, 
  Typography, Avatar, Chip, Badge, IconButton, Alert, Divider,
  Tab, Tabs, TextField, InputAdornment, Skeleton, Fab, Pagination
} from '@mui/material';
import { 
  Chat as ChatIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  MonetizationOn as BargainIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useAuth } from '@utils/auth';
import { useTranslation } from 'react-i18next';
import BargainChat from '@/components/BargainChat';
import VendorLayout from '@components/VendorLayout';

interface BargainChatData {
  _id: string;
  product: {
    _id: string;
    title: string;
    price: number;
    currency: string;
    images: string[];
  };
  buyer: {
    _id: string;
    name: string;
    email: string;
  };
  seller: {
    _id: string;
    name: string;
    email: string;
  };
  status: 'active' | 'closed' | 'accepted' | 'rejected';
  messages: Array<{
    _id: string;
    sender: string;
    senderType: 'buyer' | 'seller';
    message: string;
    messageType: 'text' | 'price_offer' | 'counter_offer' | 'accept_offer' | 'reject_offer';
    priceOffer?: number;
    isRead: boolean;
    timestamp: string;
  }>;
  initialPrice: number;
  currentOffer?: number;
  finalPrice?: number;
  lastActivity: string;
}

export default function BargainingChatsPage() {
  const { user, token } = useAuth();
  const { t } = useTranslation();
  const [chats, setChats] = useState<BargainChatData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12); // Show 12 chats per page

  // Debounced search to improve performance
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1); // Reset to first page when searching
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchChats();
  }, [token]);

  const fetchChats = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/bargain/my-chats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setChats(data.chats || []);
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch bargain chats' }));
        console.error('Failed to fetch bargain chats:', errorData.message);
      }
    } catch (error) {
      console.error('Error fetching bargain chats:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Memoized chat statistics for better performance
  const chatStats = useMemo(() => {
    const activeChats = chats.filter(c => c.status === 'active').length;
    const acceptedChats = chats.filter(c => c.status === 'accepted').length;
    const closedChats = chats.filter(c => c.status === 'closed' || c.status === 'rejected').length;
    
    return {
      total: chats.length,
      active: activeChats,
      accepted: acceptedChats,
      closed: closedChats
    };
  }, [chats]);

  // Memoized filtered and paginated chats
  const { filteredChats, paginatedChats, totalPages } = useMemo(() => {
    let filtered = chats;

    // Filter by status based on active tab
    switch (activeTab) {
      case 0: // All
        break;
      case 1: // Active
        filtered = filtered.filter(chat => chat.status === 'active');
        break;
      case 2: // Accepted
        filtered = filtered.filter(chat => chat.status === 'accepted');
        break;
      case 3: // Closed/Rejected
        filtered = filtered.filter(chat => chat.status === 'closed' || chat.status === 'rejected');
        break;
    }

    // Filter by search query
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(chat => 
        chat.product.title.toLowerCase().includes(query) ||
        chat.buyer.name.toLowerCase().includes(query) ||
        chat.buyer.email.toLowerCase().includes(query)
      );
    }

    // Calculate pagination
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginated = filtered.slice(startIndex, endIndex);
    const totalPages = Math.ceil(filtered.length / pageSize);

    return {
      filteredChats: filtered,
      paginatedChats: paginated,
      totalPages
    };
  }, [chats, activeTab, debouncedSearchQuery, currentPage, pageSize]);

  const handleOpenChat = useCallback((chatId: string) => {
    setSelectedChat(chatId);
    setChatOpen(true);
  }, []);

  const handlePageChange = useCallback((_: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
  }, []);

  const handleTabChange = useCallback((_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setCurrentPage(1); // Reset to first page when changing tabs
  }, []);

  // Memoized utility functions for better performance
  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'accepted': return 'primary';
      case 'rejected':
      case 'closed': return 'error';
      default: return 'default';
    }
  }, []);

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'active': return <ScheduleIcon fontSize="small" />;
      case 'accepted': return <CheckIcon fontSize="small" />;
      case 'rejected':
      case 'closed': return <CancelIcon fontSize="small" />;
      default: return null;
    }
  }, []);

  // Memoized formatters for better performance
  const formatters = useMemo(() => ({
    currency: new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'RWF'
    }),
    formatLastActivity: (timestamp: string) => {
      const now = Date.now();
      const activity = new Date(timestamp).getTime();
      const diff = now - activity;
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      return `${days}d ago`;
    }
  }), []);

  const getUnreadCount = useCallback((chat: BargainChatData) => {
    return chat.messages.filter(msg => 
      !msg.isRead && msg.senderType === 'buyer'
    ).length;
  }, []);

  const handleCloseChat = useCallback(() => {
    setChatOpen(false);
    setSelectedChat(null);
    // Refresh chats to update read status only if needed
    if (selectedChat) {
      fetchChats();
    }
  }, [selectedChat, fetchChats]);

  // Memoized ChatCard component for better performance
  const ChatCard = React.memo(({ chat }: { chat: BargainChatData }) => {
    const unreadCount = getUnreadCount(chat);

    return (
      <Card 
        sx={{ 
          borderRadius: 3,
          cursor: 'pointer',
          transition: 'all 0.2s ease-in-out',
          border: '1px solid',
          borderColor: 'divider',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
            borderColor: 'primary.main'
          }
        }}
        onClick={() => handleOpenChat(chat._id)}
      >
        <CardContent>
          <Stack spacing={2}>
            {/* Header */}
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar 
                  src={chat.product.images?.[0]} 
                  sx={{ width: 50, height: 50 }}
                  variant="rounded"
                >
                  <BargainIcon />
                </Avatar>
                <Box flex={1}>
                  <Typography variant="subtitle1" fontWeight={600} noWrap>
                    {chat.product.title}
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <PersonIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {chat.buyer.name}
                    </Typography>
                  </Stack>
                </Box>
              </Stack>
              <Stack alignItems="flex-end" spacing={1}>
                <Chip
                  icon={getStatusIcon(chat.status)}
                  label={chat.status.charAt(0).toUpperCase() + chat.status.slice(1)}
                  color={getStatusColor(chat.status) as any}
                  size="small"
                />
                {unreadCount > 0 && (
                  <Badge badgeContent={unreadCount} color="error">
                    <ChatIcon fontSize="small" />
                  </Badge>
                )}
              </Stack>
            </Stack>

            {/* Price Information */}
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Original Price
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {formatters.currency.format(chat.product.price)}
                </Typography>
              </Box>
              
              {chat.currentOffer && (
                <Box textAlign="center">
                  <Typography variant="caption" color="text.secondary">
                    Current Offer
                  </Typography>
                  <Typography variant="body2" fontWeight={600} color="warning.main">
                    {formatters.currency.format(chat.currentOffer)}
                  </Typography>
                </Box>
              )}

              {chat.finalPrice && (
                <Box textAlign="right">
                  <Typography variant="caption" color="text.secondary">
                    Final Price
                  </Typography>
                  <Typography variant="body2" fontWeight={600} color="success.main">
                    {formatters.currency.format(chat.finalPrice)}
                  </Typography>
                </Box>
              )}
            </Stack>

            <Divider />

            {/* Last Activity */}
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Stack direction="row" alignItems="center" spacing={1}>
                <ScheduleIcon fontSize="small" color="action" />
                <Typography variant="caption" color="text.secondary">
                  {formatters.formatLastActivity(chat.lastActivity)}
                </Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                {chat.messages.length} msg
              </Typography>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    );
  });

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header Skeleton */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Skeleton variant="text" width={200} height={40} />
            <Skeleton variant="text" width={300} height={24} />
          </Box>
          <Skeleton variant="circular" width={40} height={40} />
        </Stack>

        {/* Filters Skeleton */}
        <Paper sx={{ p: 3, borderRadius: 3, mb: 4 }}>
          <Stack spacing={3}>
            <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 1 }} />
            <Stack direction="row" spacing={1}>
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} variant="rectangular" width={100} height={48} sx={{ borderRadius: 2 }} />
              ))}
            </Stack>
          </Stack>
        </Paper>

        {/* Cards Skeleton */}
        <Grid container spacing={3}>
          {[...Array(8)].map((_, i) => (
            <Grid item xs={12} md={6} key={i}>
              <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  return (
    <VendorLayout>
      <Container 
        maxWidth="lg" 
        sx={{ 
          py: { xs: 2, sm: 3, md: 4, lg: 4 },
          px: { xs: 2, sm: 3, md: 4, lg: 4 }
        }}
      >
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={{ xs: 3, sm: 4, md: 4, lg: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            {t('products.bargainHistory')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your bargaining conversations with customers
          </Typography>
        </Box>
        <IconButton onClick={fetchChats} color="primary">
          <RefreshIcon />
        </IconButton>
      </Stack>

      {/* Filters */}
      <Paper sx={{ p: 3, borderRadius: 3, mb: 4 }}>
        <Stack spacing={3}>
          {/* Search */}
          <TextField
            placeholder="Search by product name or customer name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            fullWidth
          />

          {/* Tabs */}
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                borderRadius: 2,
                mr: 1,
                '&.Mui-selected': {
                  bgcolor: 'primary.light',
                  color: 'primary.contrastText'
                }
              }
            }}
          >
            <Tab label={`All (${chatStats.total})`} />
            <Tab label={`Active (${chatStats.active})`} />
            <Tab label={`Accepted (${chatStats.accepted})`} />
            <Tab label={`Closed (${chatStats.closed})`} />
          </Tabs>
        </Stack>
      </Paper>

      {/* Results Summary */}
      {filteredChats.length > 0 && (
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="body2" color="text.secondary">
            Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, filteredChats.length)} of {filteredChats.length} conversations
          </Typography>
          {debouncedSearchQuery && (
            <Typography variant="body2" color="text.secondary">
              Search: "{debouncedSearchQuery}"
            </Typography>
          )}
        </Stack>
      )}

      {/* Chats Grid */}
      {paginatedChats.length > 0 ? (
        <>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {paginatedChats.map((chat) => (
              <Grid item xs={12} md={6} lg={4} key={chat._id}>
                <ChatCard chat={chat} />
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {totalPages > 1 && (
            <Stack alignItems="center" mt={4}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                size="large"
                showFirstButton
                showLastButton
                sx={{
                  '& .MuiPagination-ul': {
                    justifyContent: 'center'
                  }
                }}
              />
            </Stack>
          )}
        </>
      ) : (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
          <BargainIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            {debouncedSearchQuery ? 'No conversations match your search' : 'No bargaining conversations found'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {debouncedSearchQuery 
              ? 'Try adjusting your search terms or filters.'
              : 'When customers start bargaining on your products, they\'ll appear here.'
            }
          </Typography>
        </Paper>
      )}

      {/* Bargain Chat Dialog */}
      <BargainChat
        isOpen={chatOpen}
        onClose={handleCloseChat}
        chatId={selectedChat || undefined}
      />

      {/* Floating Action Button for refreshing */}
      <Fab
        color="warning"
        aria-label="refresh bargains"
        onClick={fetchChats}
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
          transition: 'all 0.3s ease'
        }}
      >
        <RefreshIcon />
      </Fab>
      </Container>
    </VendorLayout>
  );
}