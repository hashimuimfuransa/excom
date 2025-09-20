"use client";
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Chip,
  Box,
  Stack,
  Tab,
  Tabs,
  Avatar,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  IconButton,
  Badge
} from '@mui/material';
import {
  Chat as ChatIcon,
  MonetizationOn as BargainIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  AccessTime as AccessTimeIcon,
  Person as PersonIcon,
  Store as StoreIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@utils/auth';
import { useRouter } from 'next/navigation';
import BargainChat from '@components/BargainChat';
import { formatDistanceToNow } from 'date-fns';

interface BargainChat {
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
    avatar?: string;
  };
  seller: {
    _id: string;
    name: string;
    avatar?: string;
  };
  status: 'active' | 'closed' | 'accepted' | 'rejected';
  initialPrice: number;
  currentOffer?: number;
  finalPrice?: number;
  createdAt: string;
  updatedAt: string;
  messagesCount: number;
  lastMessage?: {
    message: string;
    timestamp: string;
    senderType: 'buyer' | 'seller';
  };
}

export default function BargainingPage() {
  const { t } = useTranslation();
  const { user, token } = useAuth();
  const router = useRouter();
  
  const [bargains, setBargains] = useState<BargainChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    fetchBargains();
  }, [user, token]);

  const fetchBargains = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bargain/my-chats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBargains(data.chats || []);
      } else {
        console.error('Failed to fetch bargains');
      }
    } catch (error) {
      console.error('Error fetching bargains:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBargains();
  };

  const filterBargainsByStatus = (status?: string) => {
    switch (status) {
      case 'active':
        return bargains.filter(bargain => bargain.status === 'active');
      case 'completed':
        return bargains.filter(bargain => bargain.status === 'accepted');
      case 'rejected':
        return bargains.filter(bargain => bargain.status === 'rejected' || bargain.status === 'closed');
      default:
        return bargains;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'warning';
      case 'accepted': return 'success';
      case 'rejected': return 'error';
      case 'closed': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <AccessTimeIcon />;
      case 'accepted': return <CheckCircleIcon />;
      case 'rejected': return <CancelIcon />;
      case 'closed': return <CancelIcon />;
      default: return <ChatIcon />;
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const openChat = (chatId: string) => {
    setSelectedChat(chatId);
    setChatOpen(true);
  };

  const BargainCard = ({ bargain }: { bargain: BargainChat }) => {
    const isUserBuyer = user?._id === bargain.buyer._id;
    const otherParty = isUserBuyer ? bargain.seller : bargain.buyer;

    return (
      <Card 
        sx={{ 
          mb: 2, 
          borderRadius: 3,
          border: `1px solid`,
          borderColor: bargain.status === 'active' ? 'warning.main' : 'divider',
          boxShadow: bargain.status === 'active' ? '0 4px 20px rgba(245, 158, 11, 0.15)' : 1,
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
          }
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={2} alignItems="center">
            {/* Product Image */}
            <Grid item xs={12} sm={3}>
              <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <CardMedia
                  component="img"
                  height="120"
                  image={bargain.product.images[0] || '/placeholder-image.jpg'}
                  alt={bargain.product.title}
                  sx={{ objectFit: 'cover' }}
                />
              </Card>
            </Grid>

            {/* Bargain Details */}
            <Grid item xs={12} sm={6}>
              <Stack spacing={1}>
                <Typography 
                  variant="h6" 
                  fontWeight={600}
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {bargain.product.title}
                </Typography>

                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  <Chip
                    icon={getStatusIcon(bargain.status)}
                    label={bargain.status.charAt(0).toUpperCase() + bargain.status.slice(1)}
                    color={getStatusColor(bargain.status) as any}
                    size="small"
                    variant="filled"
                  />
                  <Typography variant="caption" color="text.secondary">
                    {formatDistanceToNow(new Date(bargain.updatedAt), { addSuffix: true })}
                  </Typography>
                </Stack>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Original Price: {formatCurrency(bargain.product.price, bargain.product.currency)}
                  </Typography>
                  {bargain.currentOffer && (
                    <Typography variant="body2" color="success.main" fontWeight={600}>
                      Current Offer: {formatCurrency(bargain.currentOffer, bargain.product.currency)}
                    </Typography>
                  )}
                  {bargain.finalPrice && bargain.status === 'accepted' && (
                    <Typography variant="body2" color="primary.main" fontWeight={700}>
                      Final Price: {formatCurrency(bargain.finalPrice, bargain.product.currency)}
                    </Typography>
                  )}
                </Box>

                <Stack direction="row" spacing={1} alignItems="center">
                  <Avatar 
                    src={otherParty.avatar} 
                    sx={{ width: 24, height: 24 }}
                  >
                    <PersonIcon fontSize="small" />
                  </Avatar>
                  <Typography variant="caption" color="text.secondary">
                    {isUserBuyer ? 'Seller' : 'Buyer'}: {otherParty.name}
                  </Typography>
                </Stack>

                {bargain.lastMessage && (
                  <Paper sx={{ p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Last message: "{bargain.lastMessage.message.substring(0, 50)}..."
                    </Typography>
                  </Paper>
                )}
              </Stack>
            </Grid>

            {/* Actions */}
            <Grid item xs={12} sm={3}>
              <Stack spacing={1} alignItems="flex-end">
                <Badge
                  badgeContent={bargain.messagesCount}
                  color="primary"
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: '0.75rem',
                      minWidth: '18px',
                      height: '18px'
                    }
                  }}
                >
                  <Button
                    variant="contained"
                    startIcon={<ChatIcon />}
                    onClick={() => openChat(bargain._id)}
                    sx={{ borderRadius: 2, minWidth: 120 }}
                    color={bargain.status === 'active' ? 'warning' : 'primary'}
                  >
                    {bargain.status === 'active' ? 'Continue' : 'View'}
                  </Button>
                </Badge>
                
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => router.push(`/product/${bargain.product._id}`)}
                  sx={{ borderRadius: 2, minWidth: 120 }}
                >
                  View Product
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress size={40} />
        </Box>
      </Container>
    );
  }

  const tabData = [
    { label: t('bargaining.activeBargains'), value: 'active', count: filterBargainsByStatus('active').length },
    { label: t('bargaining.completedBargains'), value: 'completed', count: filterBargainsByStatus('completed').length },
    { label: t('bargaining.rejectedBargains'), value: 'rejected', count: filterBargainsByStatus('rejected').length },
    { label: 'All Bargains', value: 'all', count: bargains.length }
  ];

  const currentBargains = filterBargainsByStatus(
    selectedTab === 0 ? 'active' : 
    selectedTab === 1 ? 'completed' :
    selectedTab === 2 ? 'rejected' : undefined
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <BargainIcon sx={{ fontSize: 32, color: 'warning.main' }} />
            <Typography variant="h4" fontWeight={700}>
              💬 {t('bargaining.myBargains')}
            </Typography>
          </Stack>
          <IconButton 
            onClick={handleRefresh}
            disabled={refreshing}
            sx={{ 
              bgcolor: 'primary.50',
              '&:hover': { bgcolor: 'primary.100' }
            }}
          >
            <RefreshIcon sx={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          </IconButton>
        </Stack>
        <Typography variant="subtitle1" color="text.secondary">
          Manage all your product negotiations in one place
        </Typography>
      </Box>

      {/* Tabs */}
      <Paper sx={{ borderRadius: 3, mb: 3 }}>
        <Tabs 
          value={selectedTab} 
          onChange={(_, value) => setSelectedTab(value)}
          sx={{ px: 2 }}
        >
          {tabData.map((tab, index) => (
            <Tab
              key={tab.value}
              label={
                <Stack direction="row" alignItems="center" spacing={1}>
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <Chip
                      label={tab.count}
                      size="small"
                      color={index === 0 ? 'warning' : index === 1 ? 'success' : index === 2 ? 'error' : 'default'}
                      sx={{ minWidth: 'auto', height: 20 }}
                    />
                  )}
                </Stack>
              }
            />
          ))}
        </Tabs>
      </Paper>

      {/* Content */}
      <Box>
        {currentBargains.length === 0 ? (
          <Paper 
            sx={{ 
              p: 6, 
              textAlign: 'center', 
              borderRadius: 3,
              border: '2px dashed',
              borderColor: 'divider'
            }}
          >
            <BargainIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {t('bargaining.noBargains')}
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              {t('bargaining.startFirstBargain')}
            </Typography>
            <Button
              variant="contained"
              onClick={() => router.push('/product')}
              startIcon={<StoreIcon />}
              sx={{ borderRadius: 2 }}
            >
              Browse Products
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={0}>
            <Grid item xs={12}>
              {currentBargains.map((bargain) => (
                <BargainCard key={bargain._id} bargain={bargain} />
              ))}
            </Grid>
          </Grid>
        )}
      </Box>

      {/* Bargain Chat Dialog */}
      {selectedChat && (
        <BargainChat
          isOpen={chatOpen}
          chatId={selectedChat}
          onClose={() => {
            setChatOpen(false);
            setSelectedChat(null);
            fetchBargains(); // Refresh the list
          }}
        />
      )}

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Container>
  );
}