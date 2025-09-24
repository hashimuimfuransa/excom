"use client";
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Stack,
  Paper,
  Chip,
  Avatar,
  IconButton,
  Divider,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  CardMedia,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  AutoAwesome as AiIcon,
  Search as SearchIcon,
  Compare as CompareIcon,
  TrendingUp as TrendingIcon,
  Category as CategoryIcon,
  ShoppingCart as CartIcon,
  Star as StarIcon,
  Psychology as BrainIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { apiPost, apiGet } from '@utils/api';
import { getMainImage } from '@utils/imageHelpers';
import AiSearchBar from '@components/AiSearchBar';
import AiChatBot from '@components/AiChatBot';
import NextLink from 'next/link';
import { useTranslation } from 'react-i18next';

interface Product {
  _id: string;
  title: string;
  price: number;
  images: string[];
  category: string;
  description: string;
}

interface DemoSearch {
  query: string;
  description: string;
  icon: React.ReactNode;
}

const getDemoSearches = (t: any): DemoSearch[] => [
  {
    query: t('aiPage.searchDemo.examples.gamingLaptop.query', "I need a laptop for gaming under $1500"),
    description: t('aiPage.searchDemo.examples.gamingLaptop.description', "AI understands budget constraints and specific use cases"),
    icon: <BrainIcon color="primary" />
  },
  {
    query: t('aiPage.searchDemo.examples.ecoFriendly.query', "Show me eco-friendly products for home"),
    description: t('aiPage.searchDemo.examples.ecoFriendly.description', "Semantic understanding of product attributes"),
    icon: <CategoryIcon color="success" />
  },
  {
    query: t('aiPage.searchDemo.examples.phoneComparison.query', "Compare iPhone vs Samsung phones"),
    description: t('aiPage.searchDemo.examples.phoneComparison.description', "Intelligent product comparison with pros/cons"),
    icon: <CompareIcon color="warning" />
  },
  {
    query: t('aiPage.searchDemo.examples.fashionTrends.query', "What's trending in fashion this season?"),
    description: t('aiPage.searchDemo.examples.fashionTrends.description', "Real-time trend analysis and recommendations"),
    icon: <TrendingIcon color="error" />
  }
];

export default function AIConcierge() {
  const { t } = useTranslation('common');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchDemo, setSearchDemo] = useState<string>('');

  useEffect(() => {
    loadPersonalizedRecommendations();
  }, []);

  const loadPersonalizedRecommendations = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('excom_token');
      const userId = token ? JSON.parse(atob(token.split('.')[1])).userId : undefined;

      const response = await apiPost<{ recommendations: Product[] }>('/ai/recommend', { userId });
      setRecommendations(response.recommendations || []);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoSearch = (query: string) => {
    setSearchDemo(query);
    // In a real implementation, this would trigger the search
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      <Container maxWidth="xl" sx={{ py: 6 }}>
        {/* Hero Section */}
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Stack direction="row" justifyContent="center" alignItems="center" spacing={2} mb={3}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: 'primary.main',
                background: 'linear-gradient(45deg, #2196F3, #21CBF3)'
              }}
            >
              <AiIcon sx={{ fontSize: 40 }} />
            </Avatar>
            <Box textAlign="left">
              <Typography variant="h2" fontWeight={900} color="primary.main">
                {t('aiPage.title', 'AI Shopping Assistant')}
              </Typography>
              <Typography variant="h6" color="text.secondary" fontWeight={400}>
                {t('aiPage.subtitle', 'Powered by Google Gemini AI')}
              </Typography>
            </Box>
          </Stack>

          <Typography variant="h5" color="text.secondary" maxWidth={600} mx="auto" mb={4}>
            {t('aiPage.description', 'Experience the future of e-commerce with our intelligent AI that understands your needs, compares products, and provides personalized recommendations.')}
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              variant="contained"
              size="large"
              startIcon={<AiIcon />}
              onClick={() => setIsChatOpen(true)}
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: 3,
                background: 'linear-gradient(45deg, #2196F3, #21CBF3)',
                fontWeight: 700
              }}
            >
              {t('aiPage.startChat', 'Start AI Chat')}
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<SearchIcon />}
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: 3,
                fontWeight: 700
              }}
            >
              {t('aiPage.trySearch', 'Try Smart Search')}
            </Button>
          </Stack>
        </Box>

        {/* Features Grid */}
        <Grid container spacing={4} mb={8}>
          <Grid item xs={12} md={4}>
            <Card
              sx={{
                height: '100%',
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.1)'
                }
              }}
            >
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                <Avatar
                  sx={{
                    width: 60,
                    height: 60,
                    bgcolor: 'primary.50',
                    color: 'primary.main',
                    mx: 'auto',
                    mb: 3
                  }}
                >
                  <BrainIcon sx={{ fontSize: 30 }} />
                </Avatar>
                <Typography variant="h5" fontWeight={700} mb={2}>
                  {t('aiPage.features.intelligentSearch.title', 'Intelligent Search')}
                </Typography>
                <Typography color="text.secondary" mb={3}>
                  {t('aiPage.features.intelligentSearch.description', 'Our AI understands natural language queries and finds exactly what you\'re looking for, even with vague descriptions.')}
                </Typography>
                <Chip
                  label={t('aiPage.features.intelligentSearch.chip', 'Smart Understanding')}
                  color="primary"
                  variant="outlined"
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card
              sx={{
                height: '100%',
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.1)'
                }
              }}
            >
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                <Avatar
                  sx={{
                    width: 60,
                    height: 60,
                    bgcolor: 'success.50',
                    color: 'success.main',
                    mx: 'auto',
                    mb: 3
                  }}
                >
                  <CompareIcon sx={{ fontSize: 30 }} />
                </Avatar>
                <Typography variant="h5" fontWeight={700} mb={2}>
                  {t('aiPage.features.smartComparison.title', 'Smart Comparison')}
                </Typography>
                <Typography color="text.secondary" mb={3}>
                  {t('aiPage.features.smartComparison.description', 'Compare products with detailed analysis of features, price-to-value ratios, and personalized recommendations.')}
                </Typography>
                <Chip
                  label={t('aiPage.features.smartComparison.chip', 'Detailed Analysis')}
                  color="success"
                  variant="outlined"
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card
              sx={{
                height: '100%',
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.1)'
                }
              }}
            >
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                <Avatar
                  sx={{
                    width: 60,
                    height: 60,
                    bgcolor: 'warning.50',
                    color: 'warning.main',
                    mx: 'auto',
                    mb: 3
                  }}
                >
                  <TrendingIcon sx={{ fontSize: 30 }} />
                </Avatar>
                <Typography variant="h5" fontWeight={700} mb={2}>
                  {t('aiPage.features.personalizedRecommendations.title', 'Personalized Recommendations')}
                </Typography>
                <Typography color="text.secondary" mb={3}>
                  {t('aiPage.features.personalizedRecommendations.description', 'Get tailored product suggestions based on your purchase history, preferences, and browsing behavior.')}
                </Typography>
                <Chip
                  label={t('aiPage.features.personalizedRecommendations.chip', 'Personal Touch')}
                  color="warning"
                  variant="outlined"
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Interactive Search Demo */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'divider',
            mb: 6,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(250,250,250,0.9) 100%)'
          }}
        >
          <Typography variant="h4" fontWeight={700} mb={3} textAlign="center">
            {t('aiPage.searchDemo.title', '🎯 Try AI-Powered Search')}
          </Typography>
          
          <Box mb={4}>
            <AiSearchBar 
              placeholder={t('aiPage.searchDemo.placeholder', 'Ask AI: Find me products that match my style and budget...')}
              showSuggestions={true}
            />
          </Box>

          <Typography variant="h6" fontWeight={600} mb={3}>
            {t('aiPage.searchDemo.examplesTitle', '💡 Try these example searches:')}
          </Typography>

          <Grid container spacing={2}>
            {getDemoSearches(t).map((demo, index) => (
              <Grid item xs={12} sm={6} key={index}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'scale(1.02)',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                    }
                  }}
                  onClick={() => handleDemoSearch(demo.query)}
                >
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      {demo.icon}
                      <Box flex={1}>
                        <Typography variant="body1" fontWeight={600} mb={0.5}>
                          "{demo.query}"
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {demo.description}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* Personalized Recommendations */}
        {recommendations.length > 0 && (
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
              mb: 6
            }}
          >
            <Stack direction="row" alignItems="center" spacing={2} mb={4}>
              <TrendingIcon color="primary" sx={{ fontSize: 30 }} />
              <Typography variant="h4" fontWeight={700}>
                {t('aiPage.recommendations.title', 'Your AI-Curated Picks')}
              </Typography>
            </Stack>

            <Grid container spacing={3}>
              {recommendations.slice(0, 6).map((product) => (
                <Grid item xs={12} sm={6} md={4} key={product._id}>
                  <NextLink href={`/product/${product._id}`} style={{ textDecoration: 'none' }}>
                    <Card
                      sx={{
                        textDecoration: 'none',
                        borderRadius: 3,
                        border: '1px solid',
                        borderColor: 'divider',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 12px 40px rgba(0,0,0,0.15)'
                        }
                      }}
                    >
                      <CardMedia
                        component="img"
                        height="200"
                        image={getMainImage(product.images, 'product', product._id)}
                        alt={product.title}
                      />
                      <CardContent>
                        <Typography variant="h6" fontWeight={700} mb={1} noWrap>
                          {product.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mb={2}>
                          {product.description.substring(0, 80)}...
                        </Typography>
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Typography variant="h6" color="primary.main" fontWeight={700}>
                            ${product.price.toFixed(2)}
                          </Typography>
                          <Chip
                            label={product.category}
                            size="small"
                            variant="outlined"
                          />
                        </Stack>
                      </CardContent>
                    </Card>
                  </NextLink>
                </Grid>
              ))}
            </Grid>

            <Box textAlign="center" mt={4}>
              <Button
                variant="outlined"
                size="large"
                onClick={loadPersonalizedRecommendations}
                disabled={isLoading}
                startIcon={isLoading ? <CircularProgress size={20} /> : <TrendingIcon />}
                sx={{ borderRadius: 3, px: 4 }}
              >
                {isLoading ? t('aiPage.recommendations.loadingButton', 'Getting Fresh Picks...') : t('aiPage.recommendations.refreshButton', 'Refresh Recommendations')}
              </Button>
            </Box>
          </Paper>
        )}

        {/* AI Statistics */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'divider',
            background: 'linear-gradient(135deg, #2196F3 0%, #21CBF3 100%)',
            color: 'white'
          }}
        >
          <Typography variant="h4" fontWeight={700} mb={4} textAlign="center">
            {t('aiPage.metrics.title', '🚀 AI Performance Metrics')}
          </Typography>

          <Grid container spacing={4}>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <SpeedIcon sx={{ fontSize: 40, mb: 2 }} />
                <Typography variant="h3" fontWeight={900}>
                  0.5s
                </Typography>
                <Typography variant="body1">
                  {t('aiPage.metrics.responseTime', 'Average Response Time')}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <BrainIcon sx={{ fontSize: 40, mb: 2 }} />
                <Typography variant="h3" fontWeight={900}>
                  95%
                </Typography>
                <Typography variant="body1">
                  {t('aiPage.metrics.accuracy', 'Search Accuracy')}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <TrendingIcon sx={{ fontSize: 40, mb: 2 }} />
                <Typography variant="h3" fontWeight={900}>
                  87%
                </Typography>
                <Typography variant="body1">
                  {t('aiPage.metrics.hitRate', 'Recommendation Hit Rate')}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <SecurityIcon sx={{ fontSize: 40, mb: 2 }} />
                <Typography variant="h3" fontWeight={900}>
                  100%
                </Typography>
                <Typography variant="body1">
                  {t('aiPage.metrics.privacy', 'Privacy Protected')}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Container>

      {/* AI Chatbot */}
      <AiChatBot 
        isOpen={isChatOpen} 
        onToggle={() => setIsChatOpen(!isChatOpen)} 
        position="bottom-right"
      />
    </Box>
  );
}