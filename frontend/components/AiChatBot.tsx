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
  "🛍️ Find me the best deals today",
  "💡 Recommend products based on my purchases",
  "⚖️ Compare these products for quality",
  "🎯 What's trending in electronics?",
  "💰 Show me budget-friendly options",
  "⭐ Find highly rated products"
];

export default function AiChatBot({ isOpen, onToggle, position = 'bottom-right' }: AiChatBotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: 'Hi! I\'m your AI shopping assistant. I can help you find products, compare prices, and make smart shopping decisions. What are you looking for today?',
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
        content: 'I apologize, but I\'m having trouble processing your request right now. Please try again in a moment.',
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
            bottom: 24,
            zIndex: 1300
          }}
        >
          <Tooltip title="Chat with AI Assistant" placement="left">
            <IconButton
              onClick={onToggle}
              sx={{
                width: 60,
                height: 60,
                bgcolor: 'primary.main',
                color: 'white',
                boxShadow: '0 8px 25px rgba(33, 150, 243, 0.3)',
                '&:hover': {
                  bgcolor: 'primary.dark',
                  transform: 'scale(1.1)',
                  boxShadow: '0 12px 35px rgba(33, 150, 243, 0.4)'
                },
                animation: 'pulse 2s infinite'
              }}
            >
              <BotIcon sx={{ fontSize: 30 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Zoom>
    );
  }

  return (
    <Fade in={isOpen}>
      <Paper
        elevation={16}
        sx={{
          position: 'fixed',
          [position.includes('right') ? 'right' : 'left']: 24,
          bottom: 24,
          width: { xs: 'calc(100vw - 48px)', sm: 400 },
          height: isMinimized ? 60 : { xs: 'calc(100vh - 100px)', sm: 600 },
          maxHeight: 600,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 4,
          overflow: 'hidden',
          zIndex: 1300,
          border: '1px solid',
          borderColor: 'divider',
          transition: 'all 0.3s ease'
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2,
            bgcolor: 'primary.main',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Avatar sx={{ bgcolor: 'primary.dark', width: 32, height: 32 }}>
              <AiIcon fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="subtitle2" fontWeight={700}>
                AI Shopping Assistant
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Powered by Gemini AI
              </Typography>
            </Box>
          </Stack>
          
          <Stack direction="row" spacing={0.5}>
            <IconButton
              size="small"
              onClick={() => setIsMinimized(!isMinimized)}
              sx={{ color: 'white' }}
            >
              <MinimizeIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={onToggle}
              sx={{ color: 'white' }}
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
                bgcolor: 'grey.50',
                display: 'flex',
                flexDirection: 'column',
                gap: 2
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
                          bgcolor: message.type === 'user' ? 'primary.main' : 'white',
                          color: message.type === 'user' ? 'white' : 'text.primary',
                          borderRadius: 2,
                          borderTopLeftRadius: message.type === 'bot' ? 0 : 2,
                          borderTopRightRadius: message.type === 'user' ? 0 : 2
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
                        bgcolor: 'white',
                        borderRadius: 2,
                        borderTopLeftRadius: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}
                    >
                      <CircularProgress size={16} />
                      <Typography variant="body2" color="text.secondary">
                        AI is thinking...
                      </Typography>
                    </Paper>
                  </Stack>
                </Box>
              )}

              <div ref={messagesEndRef} />
            </Box>

            {/* Quick Actions */}
            {messages.length <= 1 && (
              <Box sx={{ p: 2, bgcolor: 'white', borderTop: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary" mb={1} display="block">
                  Quick Actions:
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                  {PREDEFINED_PROMPTS.slice(0, 3).map((prompt) => (
                    <Chip
                      key={prompt}
                      label={prompt}
                      size="small"
                      clickable
                      onClick={() => sendMessage(prompt)}
                      sx={{
                        fontSize: '0.7rem',
                        bgcolor: 'primary.50',
                        '&:hover': { bgcolor: 'primary.100' }
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
                bgcolor: 'white',
                borderTop: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'flex-end',
                gap: 1
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
                placeholder="Ask me anything about products, prices, or recommendations..."
                variant="outlined"
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3
                  }
                }}
              />
              <IconButton
                onClick={() => sendMessage()}
                disabled={!input.trim() || isTyping}
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'primary.dark'
                  },
                  '&:disabled': {
                    bgcolor: 'grey.300'
                  }
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