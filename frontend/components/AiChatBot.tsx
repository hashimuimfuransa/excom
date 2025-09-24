"use client";
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  Stack,
  Avatar,
  Chip,
  Button,
  Card,
  CardContent,
  CardMedia,
  Fade,
  Zoom,
  CircularProgress,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as BotIcon,
  Person as PersonIcon,
  Close as CloseIcon,
  Minimize as MinimizeIcon,
  ShoppingCart as CartIcon,
  Compare as CompareIcon,
  Star as StarIcon,
  TrendingUp as TrendingIcon,
  Category as CategoryIcon,
  AutoAwesome as AiIcon
} from '@mui/icons-material';
import { apiPost } from '@utils/api';
import { getMainImage } from '@utils/imageHelpers';
import NextLink from 'next/link';
import { useTranslation } from 'react-i18next';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  data?: any; // For structured data like product recommendations
}

interface Product {
  _id: string;
  title: string;
  price: number;
  images: string[];
  category: string;
  recommendationReason?: string;
  recommendationScore?: number;
}

interface AiChatBotProps {
  isOpen: boolean;
  onToggle: () => void;
  position?: 'bottom-right' | 'bottom-left';
}

const PREDEFINED_PROMPTS = [
  { text: "🛍️ Find me the best deals today", key: "ai.prompts.bestDeals" },
  { text: "💡 Recommend products based on my purchases", key: "ai.prompts.recommendations" },
  { text: "⚖️ Compare these products for quality", key: "ai.prompts.compare" },
  { text: "🎯 What's trending in electronics?", key: "ai.prompts.trending" },
  { text: "💰 Show me budget-friendly options", key: "ai.prompts.budget" },
  { text: "⭐ Find highly rated products", key: "ai.prompts.rated" }
];

export default function AiChatBot({ isOpen, onToggle, position = 'bottom-right' }: AiChatBotProps) {
  const { t } = useTranslation('common');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: t('ai.welcomeMessage', 'Hi! I\'m your AI shopping assistant. I can help you find products, compare prices, and make smart shopping decisions. What are you looking for today?'),
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      // Load personalized recommendations when chat opens
      loadRecommendations();
    }
  }, [isOpen, isMinimized]);

  const loadRecommendations = async () => {
    try {
      const token = localStorage.getItem('excom_token');
      const userId = token ? JSON.parse(atob(token.split('.')[1])).userId : undefined;

      const response = await apiPost<{ recommendations: Product[] }>('/ai/recommend', { userId });
      setRecommendations(response.recommendations || []);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    }
  };

  const sendMessage = async (messageContent?: string) => {
    const content = messageContent || input.trim();
    if (!content) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      // Get user context
      const token = localStorage.getItem('excom_token');
      const userId = token ? JSON.parse(atob(token.split('.')[1])).userId : undefined;
      
      const context = {
        userId,
        recentMessages: messages.slice(-5).map(m => `${m.type}: ${m.content}`),
        hasRecommendations: recommendations.length > 0
      };

      const response = await apiPost<{ 
        reply: string; 
        recommendedProducts?: Product[];
        hasProductRecommendations?: boolean;
      }>('/ai/chat', {
        message: content,
        context
      });

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: response.reply,
        timestamp: new Date(),
        data: response.hasProductRecommendations ? {
          products: response.recommendedProducts || []
        } : undefined
      };

      setMessages(prev => [...prev, botMessage]);

      // If AI found specific products, update recommendations with those
      if (response.recommendedProducts && response.recommendedProducts.length > 0) {
        setRecommendations(response.recommendedProducts);
      } else if (content.toLowerCase().includes('recommend') || content.toLowerCase().includes('suggest')) {
        // Fallback to general recommendations
        await loadRecommendations();
      }

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: t('ai.errorMessage', 'I apologize, but I\'m having trouble processing your request right now. Please try again in a moment.'),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) {
    return (
      <Zoom in={!isOpen}>
        <Box
          sx={{
            position: 'fixed',
            [position.includes('right') ? 'right' : 'left']: 24,
            bottom: 180, // Positioned well above the bottom menu (which is at 120-140px)
            zIndex: 1300
          }}
        >
          <Tooltip title={t('ai.tooltipTitle', 'Chat with AI Assistant')} placement="left">
            <IconButton
              onClick={onToggle}
              sx={{
                width: 64,
                height: 64,
                background: (theme) => theme.palette.mode === 'dark' 
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : 'linear-gradient(135deg, #2196F3 0%, #21CBF3 100%)',
                color: 'white',
                boxShadow: (theme) => theme.palette.mode === 'dark'
                  ? '0 8px 32px rgba(102, 126, 234, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                  : '0 8px 32px rgba(33, 150, 243, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                border: (theme) => theme.palette.mode === 'dark'
                  ? '1px solid rgba(255, 255, 255, 0.1)'
                  : '1px solid rgba(255, 255, 255, 0.2)',
                '&:hover': {
                  background: (theme) => theme.palette.mode === 'dark' 
                    ? 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)'
                    : 'linear-gradient(135deg, #21CBF3 0%, #2196F3 100%)',
                  transform: 'scale(1.1) translateY(-2px)',
                  boxShadow: (theme) => theme.palette.mode === 'dark'
                    ? '0 12px 40px rgba(102, 126, 234, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.2)'
                    : '0 12px 40px rgba(33, 150, 243, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.3)',
                },
                animation: 'aiFloat 3s ease-in-out infinite',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '@keyframes aiFloat': {
                  '0%, 100%': {
                    transform: 'translateY(0px)',
                    boxShadow: (theme) => theme.palette.mode === 'dark'
                      ? '0 8px 32px rgba(102, 126, 234, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                      : '0 8px 32px rgba(33, 150, 243, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.2)',
                  },
                  '50%': {
                    transform: 'translateY(-4px)',
                    boxShadow: (theme) => theme.palette.mode === 'dark'
                      ? '0 12px 40px rgba(102, 126, 234, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.15)'
                      : '0 12px 40px rgba(33, 150, 243, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.25)',
                  }
                }
              }}
            >
              <BotIcon sx={{ 
                fontSize: 32,
                filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))'
              }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Zoom>
    );
  }

  return (
    <Fade in={isOpen}>
      <Paper
        elevation={24}
        sx={{
          position: 'fixed',
          [position.includes('right') ? 'right' : 'left']: 24,
          bottom: 180, // Positioned well above the bottom menu (which is at 120-140px)
          width: { xs: 'calc(100vw - 48px)', sm: 420 },
          height: isMinimized ? 60 : { xs: 'calc(100vh - 200px)', sm: 'calc(100vh - 220px)' }, // Responsive height that fits screen
          maxHeight: { xs: 'calc(100vh - 200px)', sm: 'calc(100vh - 220px)' },
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 3,
          overflow: 'hidden',
          zIndex: 1300,
          background: (theme) => theme.palette.mode === 'dark'
            ? 'rgba(15, 15, 15, 0.98)'
            : 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px)',
          border: (theme) => theme.palette.mode === 'dark'
            ? '1px solid rgba(255, 255, 255, 0.1)'
            : '1px solid rgba(0, 0, 0, 0.05)',
          boxShadow: (theme) => theme.palette.mode === 'dark'
            ? '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)'
            : '0 20px 60px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2.5,
            background: (theme) => theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              : 'linear-gradient(135deg, #2196F3 0%, #21CBF3 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: (theme) => theme.palette.mode === 'dark'
              ? '1px solid rgba(255, 255, 255, 0.1)'
              : '1px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar 
              sx={{ 
                bgcolor: 'rgba(255, 255, 255, 0.2)', 
                width: 36, 
                height: 36,
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              <AiIcon fontSize="small" sx={{ filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))' }} />
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight={700} sx={{ fontSize: '1rem' }}>
                {t('ai.headerTitle', 'AI Shopping Assistant')}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.75rem' }}>
                {t('ai.headerSubtitle', 'Powered by Gemini AI')}
              </Typography>
            </Box>
          </Stack>
          
          <Stack direction="row" spacing={0.5}>
            <IconButton
              size="small"
              onClick={() => setIsMinimized(!isMinimized)}
              sx={{ 
                color: 'white',
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  transform: 'scale(1.1)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              <MinimizeIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={onToggle}
              sx={{ 
                color: 'white',
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  transform: 'scale(1.1)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Box>

        {!isMinimized && (
          <>
            {/* Messages */}
            <Box
              sx={{
                flex: 1,
                overflow: 'auto',
                p: 2,
                bgcolor: (theme) => theme.palette.mode === 'dark' 
                  ? 'rgba(20, 20, 20, 0.8)' 
                  : 'rgba(248, 249, 250, 0.8)',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                backdropFilter: 'blur(10px)'
              }}
            >
              {messages.map((message) => (
                <Box
                  key={message.id}
                  sx={{
                    display: 'flex',
                    justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
                    mb: 1
                  }}
                >
                  <Stack
                    direction={message.type === 'user' ? 'row-reverse' : 'row'}
                    spacing={1}
                    alignItems="flex-start"
                    sx={{ maxWidth: '85%' }}
                  >
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: message.type === 'user' ? 'primary.main' : 'secondary.main'
                      }}
                    >
                      {message.type === 'user' ? (
                        <PersonIcon fontSize="small" />
                      ) : (
                        <BotIcon fontSize="small" />
                      )}
                    </Avatar>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Paper
                        elevation={1}
                        sx={{
                          p: 1.5,
                          bgcolor: message.type === 'user' 
                            ? 'primary.main' 
                            : (theme) => theme.palette.mode === 'dark' 
                              ? 'rgba(255, 255, 255, 0.1)' 
                              : 'white',
                          color: message.type === 'user' 
                            ? 'white' 
                            : (theme) => theme.palette.mode === 'dark' 
                              ? 'rgba(255, 255, 255, 0.9)' 
                              : 'text.primary',
                          borderRadius: 2,
                          borderTopLeftRadius: message.type === 'bot' ? 0 : 2,
                          borderTopRightRadius: message.type === 'user' ? 0 : 2,
                          backdropFilter: 'blur(10px)',
                          border: (theme) => theme.palette.mode === 'dark' && message.type === 'bot'
                            ? '1px solid rgba(255, 255, 255, 0.1)' 
                            : 'none'
                        }}
                      >
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                          {message.content}
                        </Typography>
                      </Paper>
                      
                      {/* Inline Product Recommendations */}
                      {message.type === 'bot' && message.data?.products && (
                        <Box sx={{ mt: 1 }}>
                          <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                            <CartIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                            <Typography variant="caption" fontWeight={600} color="primary.main">
                              Recommended Products
                            </Typography>
                          </Stack>
                          <Stack spacing={0.5}>
                            {message.data.products.slice(0, 3).map((product: Product) => (
                              <Card
                                key={product._id}
                                component={NextLink}
                                href={`/product/${product._id}`}
                                sx={{
                                  display: 'flex',
                                  textDecoration: 'none',
                                  maxWidth: 280,
                                  '&:hover': {
                                    transform: 'scale(1.02)',
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.15)'
                                  },
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                <CardMedia
                                  component="img"
                                  sx={{ width: 50, height: 50 }}
                                  image={getMainImage(product.images, 'product', product._id)}
                                  alt={product.title}
                                />
                                <CardContent sx={{ flex: 1, py: 0.5, px: 1, '&:last-child': { pb: 0.5 } }}>
                                  <Typography variant="caption" fontWeight={600} noWrap>
                                    {product.title}
                                  </Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" color="primary.main" fontWeight={700}>
                                      ${product.price.toFixed(2)}
                                    </Typography>
                                    <Chip 
                                      label={product.category} 
                                      size="small" 
                                      variant="outlined" 
                                      sx={{ fontSize: '0.6rem', height: 18 }}
                                    />
                                  </Box>
                                </CardContent>
                              </Card>
                            ))}
                          </Stack>
                        </Box>
                      )}
                    </Box>
                  </Stack>
                </Box>
              ))}

              {/* Recommendations Section */}
              {recommendations.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                    <TrendingIcon color="primary" fontSize="small" />
                    <Typography variant="subtitle2" fontWeight={700}>
                      Personalized for You
                    </Typography>
                  </Stack>
                  
                  <Stack spacing={1}>
                    {recommendations.slice(0, 3).map((product) => (
                      <Card
                        key={product._id}
                        component={NextLink}
                        href={`/product/${product._id}`}
                        sx={{
                          display: 'flex',
                          textDecoration: 'none',
                          '&:hover': {
                            transform: 'scale(1.02)',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.15)'
                          },
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <CardMedia
                          component="img"
                          sx={{ width: 60, height: 60 }}
                          image={getMainImage(product.images, 'product', product._id)}
                          alt={product.title}
                        />
                        <CardContent sx={{ flex: 1, py: 1, px: 1.5, '&:last-child': { pb: 1 } }}>
                          <Typography variant="body2" fontWeight={600} noWrap>
                            {product.title}
                          </Typography>
                          <Stack direction="row" alignItems="center" justifyContent="space-between">
                            <Typography variant="h6" color="primary.main" fontWeight={700}>
                              ${product.price.toFixed(2)}
                            </Typography>
                            {product.recommendationScore && (
                              <Chip
                                label={`${Math.round(product.recommendationScore * 100)}% match`}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            )}
                          </Stack>
                          {product.recommendationReason && (
                            <Typography variant="caption" color="text.secondary" noWrap>
                              {product.recommendationReason}
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                </Box>
              )}

              {/* Typing indicator */}
              {isTyping && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 1 }}>
                  <Stack direction="row" spacing={1} alignItems="flex-start">
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                      <BotIcon fontSize="small" />
                    </Avatar>
                    <Paper
                      elevation={1}
                      sx={{
                        p: 1.5,
                        bgcolor: (theme) => theme.palette.mode === 'dark' 
                          ? 'rgba(255, 255, 255, 0.1)' 
                          : 'white',
                        borderRadius: 2,
                        borderTopLeftRadius: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        backdropFilter: 'blur(10px)',
                        border: (theme) => theme.palette.mode === 'dark'
                          ? '1px solid rgba(255, 255, 255, 0.1)' 
                          : 'none'
                      }}
                    >
                      <CircularProgress size={16} />
                      <Typography variant="body2" color="text.secondary">
                        {t('ai.thinkingMessage', 'AI is thinking...')}
                      </Typography>
                    </Paper>
                  </Stack>
                </Box>
              )}

              <div ref={messagesEndRef} />
            </Box>

            {/* Quick Actions */}
            {messages.length <= 1 && (
              <Box sx={{ 
                p: 2, 
                bgcolor: (theme) => theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.05)' 
                  : 'white', 
                borderTop: '1px solid', 
                borderColor: (theme) => theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'divider',
                backdropFilter: 'blur(10px)'
              }}>
                <Typography variant="caption" color="text.secondary" mb={1} display="block">
                  {t('ai.quickActions', 'Quick Actions:')}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                  {PREDEFINED_PROMPTS.slice(0, 3).map((prompt) => (
                    <Chip
                      key={prompt.key}
                      label={t(prompt.key, prompt.text)}
                      size="small"
                      clickable
                      onClick={() => sendMessage(t(prompt.key, prompt.text))}
                      sx={{
                        fontSize: '0.7rem',
                        bgcolor: (theme) => theme.palette.mode === 'dark' 
                          ? 'rgba(255, 255, 255, 0.1)' 
                          : 'rgba(33, 150, 243, 0.1)',
                        color: (theme) => theme.palette.mode === 'dark' 
                          ? 'rgba(255, 255, 255, 0.9)' 
                          : 'primary.main',
                        border: (theme) => theme.palette.mode === 'dark' 
                          ? '1px solid rgba(255, 255, 255, 0.2)' 
                          : '1px solid rgba(33, 150, 243, 0.2)',
                        backdropFilter: 'blur(10px)',
                        '&:hover': { 
                          bgcolor: (theme) => theme.palette.mode === 'dark' 
                            ? 'rgba(255, 255, 255, 0.2)' 
                            : 'rgba(33, 150, 243, 0.2)',
                          transform: 'scale(1.05)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    />
                  ))}
                </Stack>
              </Box>
            )}

            {/* Input */}
            <Box
              sx={{
                p: 2,
                bgcolor: (theme) => theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.05)' 
                  : 'white',
                borderTop: '1px solid',
                borderColor: (theme) => theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'divider',
                display: 'flex',
                alignItems: 'flex-end',
                gap: 1,
                backdropFilter: 'blur(10px)'
              }}
            >
              <TextField
                ref={inputRef}
                fullWidth
                multiline
                maxRows={3}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={t('ai.inputPlaceholder', 'Ask me anything about products, prices, or recommendations...')}
                variant="outlined"
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    bgcolor: (theme) => theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.05)' 
                      : 'rgba(0, 0, 0, 0.02)',
                    backdropFilter: 'blur(10px)',
                    border: (theme) => theme.palette.mode === 'dark' 
                      ? '1px solid rgba(255, 255, 255, 0.1)' 
                      : '1px solid rgba(0, 0, 0, 0.1)',
                    '&:hover': {
                      border: (theme) => theme.palette.mode === 'dark' 
                        ? '1px solid rgba(255, 255, 255, 0.2)' 
                        : '1px solid rgba(0, 0, 0, 0.2)',
                    },
                    '&.Mui-focused': {
                      border: (theme) => theme.palette.mode === 'dark' 
                        ? '2px solid rgba(102, 126, 234, 0.5)' 
                        : '2px solid rgba(33, 150, 243, 0.5)',
                    }
                  },
                  '& .MuiInputBase-input': {
                    color: (theme) => theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.9)' 
                      : 'text.primary',
                    '&::placeholder': {
                      color: (theme) => theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.6)' 
                        : 'text.secondary',
                      opacity: 1
                    }
                  }
                }}
              />
              <IconButton
                onClick={() => sendMessage()}
                disabled={!input.trim() || isTyping}
                sx={{
                  bgcolor: (theme) => theme.palette.mode === 'dark' 
                    ? 'rgba(102, 126, 234, 0.8)' 
                    : 'primary.main',
                  color: 'white',
                  '&:hover': {
                    bgcolor: (theme) => theme.palette.mode === 'dark' 
                      ? 'rgba(102, 126, 234, 1)' 
                      : 'primary.dark',
                    transform: 'scale(1.1)'
                  },
                  '&:disabled': {
                    bgcolor: (theme) => theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.1)' 
                      : 'grey.300',
                    color: (theme) => theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.3)' 
                      : 'grey.500'
                  },
                  transition: 'all 0.2s ease',
                  backdropFilter: 'blur(10px)',
                  border: (theme) => theme.palette.mode === 'dark' 
                    ? '1px solid rgba(255, 255, 255, 0.1)' 
                    : 'none'
                }}
              >
                <SendIcon />
              </IconButton>
            </Box>
          </>
        )}
      </Paper>
    </Fade>
  );
}