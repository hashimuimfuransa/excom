"use client";

import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  IconButton,
  Avatar,
  Chip,
  Button,
  Grid,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  Alert,
  Tooltip,
  Badge,
  useTheme,
  useMediaQuery,
  Snackbar,
  Fab
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as AIIcon,
  Person as PersonIcon,
  Lightbulb as LightbulbIcon,
  TrendingUp as TrendingUpIcon,
  Store as StoreIcon,
  Inventory as InventoryIcon,
  Analytics as AnalyticsIcon,
  Refresh as RefreshIcon,
  ContentCopy as CopyIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  KeyboardArrowDown
} from '@mui/icons-material';
import VendorLayout from '@components/VendorLayout';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@utils/auth';
import { apiPost } from '@utils/api';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type: 'text' | 'suggestion';
  suggestions?: string[];
}

const getInitialMessages = (t: any): Message[] => [
  {
    id: '1',
    text: t('aiSupport.welcomeMessage', "Hello! I'm your AI Store Assistant. I can help you optimize your store, analyze performance, suggest improvements, and answer questions about your business. How can I assist you today?"),
    sender: 'ai',
    timestamp: new Date(),
    type: 'text'
  }
];

const getQuickSuggestions = (t: any) => [
  t('aiSupport.suggestion1', "How can I increase my sales?"),
  t('aiSupport.suggestion2', "Analyze my store performance"),
  t('aiSupport.suggestion3', "Suggest product improvements"),
  t('aiSupport.suggestion4', "Help with pricing strategy"),
  t('aiSupport.suggestion5', "Review my store layout"),
  t('aiSupport.suggestion6', "Optimize product descriptions")
];

const getAiCapabilities = (t: any) => [
  {
    icon: <StoreIcon />,
    title: t('aiSupport.storeOptimization', 'Store Optimization'),
    description: t('aiSupport.storeOptimizationDesc', 'Improve your store layout and product organization')
  },
  {
    icon: <AnalyticsIcon />,
    title: t('aiSupport.performanceAnalysis', 'Performance Analysis'),
    description: t('aiSupport.performanceAnalysisDesc', 'Analyze sales data and customer behavior')
  },
  {
    icon: <InventoryIcon />,
    title: t('aiSupport.productManagement', 'Product Management'),
    description: t('aiSupport.productManagementDesc', 'Optimize product listings and inventory')
  },
  {
    icon: <TrendingUpIcon />,
    title: t('aiSupport.growthStrategies', 'Growth Strategies'),
    description: t('aiSupport.growthStrategiesDesc', 'Develop strategies to grow your business')
  }
];

const getProTips = (t: any) => [
  t('aiSupport.tip1', 'Use high-quality product images to increase conversions'),
  t('aiSupport.tip2', 'Respond to customer inquiries within 2 hours'),
  t('aiSupport.tip3', 'Offer bundle deals to increase average order value'),
  t('aiSupport.tip4', 'Use social media to promote your products'),
  t('aiSupport.tip5', 'Regularly update product descriptions and prices')
];

export default function NewVendorAISupportPage() {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const { user } = useAuth();

  // Add CSS animations
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
  
  const [messages, setMessages] = useState<Message[]>(getInitialMessages(t));
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [feedback, setFeedback] = useState<{ [key: string]: 'like' | 'dislike' }>({});
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const quickSuggestions = getQuickSuggestions(t);
  const aiCapabilities = getAiCapabilities(t);
  const proTips = getProTips(t);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handle scroll detection to show/hide scroll button
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: text.trim(),
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    setError(null);

    try {
      console.log('🚀 Sending AI request...');
      
      const response = await apiPost('/ai/vendor-support', {
        message: text.trim(),
        userId: user?.id || 'anonymous',
        context: 'vendor_dashboard'
      });

      console.log('✅ AI Response received:', response);

      if (response.success && response.data && response.data.response) {
        console.log('🎯 Adding AI response to chat');
        
        const aiResponse: Message = {
          id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          text: response.data.response,
          sender: 'ai',
          timestamp: new Date(),
          type: 'suggestion',
          suggestions: response.data.suggestions || []
        };
        
        setMessages(prev => [...prev, aiResponse]);
        
        // Auto-scroll only if user is already at the bottom
        setTimeout(() => {
          const container = messagesContainerRef.current;
          if (container) {
            const { scrollTop, scrollHeight, clientHeight } = container;
            const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
            if (isAtBottom) {
              scrollToBottom();
            }
          }
        }, 100);
      } else {
        throw new Error('Invalid API response structure');
      }
    } catch (error) {
      console.error('❌ AI Error:', error);
      setError(t('aiSupport.errorMessage', 'Failed to get AI response. Please try again.'));
      
      // Add error message to chat
      const errorMessage: Message = {
        id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: t('aiSupport.errorMessage', 'Sorry, I encountered an error. Please try again.'),
        sender: 'ai',
        timestamp: new Date(),
        type: 'text'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSnackbarMessage(t('aiSupport.copied', 'Copied to clipboard!'));
    setSnackbarOpen(true);
  };

  const handleFeedback = async (messageId: string, type: 'like' | 'dislike') => {
    setFeedback(prev => ({ ...prev, [messageId]: type }));
    
    try {
      await apiPost('/ai/vendor-feedback', {
        userId: user?.id || 'anonymous',
        messageId: messageId,
        feedback: type
      });
      
      setSnackbarMessage(t('aiSupport.feedbackSubmitted', 'Thank you for your feedback!'));
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setSnackbarMessage(t('aiSupport.feedbackError', 'Failed to submit feedback. Please try again.'));
      setSnackbarOpen(true);
    }
  };

  return (
    <VendorLayout>
      <Container 
        maxWidth={isDesktop ? "xl" : "lg"} 
        sx={{ 
          py: isMobile ? 2 : isTablet ? 3 : 4,
          px: isMobile ? 1 : isTablet ? 2 : 3
        }}
      >
        {/* Header */}
        <Box mb={isMobile ? 2 : isTablet ? 3 : 4}>
          <Typography 
            variant={isMobile ? "h5" : isTablet ? "h4" : "h3"} 
            fontWeight={700} 
            gutterBottom
            sx={{ 
              fontSize: isMobile ? '1.5rem' : isTablet ? '2rem' : '2.5rem',
              textAlign: isMobile ? 'left' : 'center'
            }}
          >
            🤖 {t('aiSupport.title')}
          </Typography>
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{ 
              fontSize: isMobile ? '0.875rem' : isTablet ? '1rem' : '1.125rem',
              textAlign: isMobile ? 'left' : 'center',
              maxWidth: isDesktop ? '600px' : 'none',
              mx: isDesktop ? 'auto' : 0
            }}
          >
            {t('aiSupport.subtitle')}
          </Typography>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: isMobile ? 2 : 3,
              fontSize: isMobile ? '0.75rem' : '0.875rem'
            }}
            onClose={() => setError(null)}
            icon={<ErrorIcon />}
          >
            {error}
          </Alert>
        )}

        <Grid container spacing={isMobile ? 2 : 3}>
          {/* Chat Interface */}
          <Grid item xs={12} lg={8} xl={9}>
            <Paper sx={{ 
              height: isMobile ? 'calc(100vh - 200px)' : isTablet ? '75vh' : '70vh', 
              display: 'flex', 
              flexDirection: 'column',
              minHeight: isMobile ? '300px' : isTablet ? '450px' : '500px',
              maxHeight: isMobile ? 'calc(100vh - 200px)' : 'none'
            }}>
              {/* Messages */}
              <Box 
                ref={messagesContainerRef}
                sx={{ 
                  flex: 1, 
                  overflow: 'auto', 
                  p: isMobile ? 1 : 2,
                  position: 'relative',
                  scrollBehavior: 'smooth',
                  '&::-webkit-scrollbar': {
                    width: isMobile ? '4px' : '6px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: 'transparent',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: '3px',
                  },
                  '&::-webkit-scrollbar-thumb:hover': {
                    background: 'rgba(0,0,0,0.3)',
                  },
                }}
              >
                {messages.map((message) => (
                  <Box key={message.id} sx={{ mb: isMobile ? 2 : 3 }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      gap: isMobile ? 1 : 2,
                      flexDirection: isMobile && message.sender === 'user' ? 'row-reverse' : 'row'
                    }}>
                      <Avatar sx={{ 
                        bgcolor: message.sender === 'ai' ? 'primary.main' : 'secondary.main',
                        width: isMobile ? 32 : 40,
                        height: isMobile ? 32 : 40,
                        fontSize: isMobile ? '0.8rem' : '1rem'
                      }}>
                        {message.sender === 'ai' ? <AIIcon /> : <PersonIcon />}
                      </Avatar>
                      
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 1, 
                          mb: 1,
                          flexDirection: isMobile ? 'column' : 'row',
                          alignItems: isMobile ? 'flex-start' : 'center'
                        }}>
                          <Typography 
                            variant="subtitle2" 
                            fontWeight={600}
                            sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                          >
                            {message.sender === 'ai' ? t('aiSupport.aiAssistant', 'AI Assistant') : t('aiSupport.you', 'You')}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            color="text.secondary"
                            sx={{ fontSize: isMobile ? '0.65rem' : '0.75rem' }}
                          >
                            {message.timestamp.toLocaleTimeString()}
                          </Typography>
                          {message.sender === 'ai' && (
                            <Box sx={{ 
                              display: 'flex', 
                              gap: 0.5,
                              mt: isMobile ? 0.5 : 0
                            }}>
                              <Tooltip title={t('aiSupport.copy')}>
                                <IconButton 
                                  size="small" 
                                  onClick={() => copyToClipboard(message.text)}
                                  sx={{ 
                                    width: isMobile ? 24 : 32,
                                    height: isMobile ? 24 : 32
                                  }}
                                >
                                  <CopyIcon fontSize={isMobile ? 'small' : 'medium'} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title={t('aiSupport.like')}>
                                <IconButton 
                                  size="small" 
                                  color={feedback[message.id] === 'like' ? 'primary' : 'default'}
                                  onClick={() => handleFeedback(message.id, 'like')}
                                  sx={{ 
                                    width: isMobile ? 24 : 32,
                                    height: isMobile ? 24 : 32
                                  }}
                                >
                                  <ThumbUpIcon fontSize={isMobile ? 'small' : 'medium'} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title={t('aiSupport.dislike')}>
                                <IconButton 
                                  size="small" 
                                  color={feedback[message.id] === 'dislike' ? 'error' : 'default'}
                                  onClick={() => handleFeedback(message.id, 'dislike')}
                                  sx={{ 
                                    width: isMobile ? 24 : 32,
                                    height: isMobile ? 24 : 32
                                  }}
                                >
                                  <ThumbDownIcon fontSize={isMobile ? 'small' : 'medium'} />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          )}
                        </Box>
                        
                        <Paper sx={{ 
                          p: isMobile ? 1.5 : 2,
                          bgcolor: message.sender === 'ai' ? 'primary.light' : 'secondary.light',
                          color: message.sender === 'ai' ? 'primary.contrastText' : 'secondary.contrastText',
                          maxWidth: '100%',
                          wordBreak: 'break-word',
                          whiteSpace: 'pre-line',
                          fontSize: isMobile ? '0.875rem' : '1rem',
                          lineHeight: isMobile ? 1.4 : 1.5,
                          borderRadius: 2,
                          boxShadow: 1,
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            boxShadow: 2,
                            transform: 'translateY(-1px)'
                          }
                        }}>
                          {message.text}
                        </Paper>
                        
                        {/* Suggestions */}
                        {message.suggestions && message.suggestions.length > 0 && (
                          <Box sx={{ 
                            mt: isMobile ? 1.5 : 2, 
                            display: 'flex', 
                            flexWrap: 'wrap', 
                            gap: isMobile ? 0.5 : 1 
                          }}>
                            {message.suggestions.map((suggestion, index) => (
                              <Chip
                                key={index}
                                label={suggestion}
                                onClick={() => handleSendMessage(suggestion)}
                                sx={{ 
                                  bgcolor: 'primary.light',
                                  color: 'primary.contrastText',
                                  '&:hover': { 
                                    bgcolor: 'primary.main',
                                    transform: 'scale(1.05)',
                                    cursor: 'pointer'
                                  },
                                  fontSize: isMobile ? '0.7rem' : '0.75rem',
                                  height: isMobile ? '24px' : '28px',
                                  maxWidth: isMobile ? '100%' : 'auto',
                                  transition: 'all 0.2s ease-in-out',
                                  border: '1px solid transparent',
                                  '&:hover': {
                                    border: '1px solid',
                                    borderColor: 'primary.main'
                                  }
                                }}
                              />
                            ))}
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Box>
                ))}
                
                {isLoading && (
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: isMobile ? 1 : 2, 
                    mb: isMobile ? 2 : 3,
                    p: isMobile ? 1.5 : 2,
                    bgcolor: 'primary.light',
                    borderRadius: 2,
                    boxShadow: 1
                  }}>
                    <Avatar sx={{ 
                      bgcolor: 'primary.main',
                      width: isMobile ? 32 : 40,
                      height: isMobile ? 32 : 40,
                      animation: 'pulse 2s infinite'
                    }}>
                      <AIIcon />
                    </Avatar>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress 
                        size={isMobile ? 16 : 20} 
                        sx={{ 
                          color: 'primary.main',
                          animation: 'spin 1s linear infinite'
                        }} 
                      />
                      <Typography 
                        variant="body2" 
                        color="primary.contrastText"
                        sx={{ 
                          fontSize: isMobile ? '0.75rem' : '0.875rem',
                          fontWeight: 500
                        }}
                      >
                        {t('aiSupport.aiThinking', 'AI is analyzing your request...')}
                      </Typography>
                    </Box>
                  </Box>
                )}
                
                <div ref={messagesEndRef} />
                
                {/* Floating Scroll to Bottom Button - Only show when not at bottom */}
                {showScrollButton && (
                  <Fab
                    size="small"
                    onClick={scrollToBottom}
                    sx={{
                      position: 'absolute',
                      bottom: 20,
                      right: 20,
                      bgcolor: 'primary.main',
                      color: 'white',
                      boxShadow: 3,
                      '&:hover': {
                        bgcolor: 'primary.dark',
                        transform: 'scale(1.1)',
                        boxShadow: 4,
                      },
                      opacity: 0.9,
                      transition: 'all 0.3s ease-in-out',
                      zIndex: 10,
                      animation: 'pulse 2s infinite',
                    }}
                    title="Scroll to bottom"
                  >
                    <KeyboardArrowDown />
                  </Fab>
                )}
              </Box>
              
              <Divider />
              
              {/* Input */}
              <Box sx={{ 
                p: isMobile ? 1 : 2,
                borderTop: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper'
              }}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                  <TextField
                    fullWidth
                    multiline
                    maxRows={4}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={t('aiSupport.placeholder', 'Ask me anything about your store...')}
                    disabled={isLoading}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(inputText);
                      }
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontSize: isMobile ? '0.875rem' : '1rem',
                        borderRadius: 2,
                        '&:hover': {
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'primary.main',
                          },
                        },
                        '&.Mui-focused': {
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderWidth: 2,
                          },
                        },
                      }
                    }}
                  />
                  <IconButton
                    color="primary"
                    onClick={() => handleSendMessage(inputText)}
                    disabled={!inputText.trim() || isLoading}
                    sx={{
                      bgcolor: 'primary.main',
                      color: 'white',
                      borderRadius: 2,
                      minWidth: 48,
                      height: 48,
                      '&:hover': { 
                        bgcolor: 'primary.dark',
                        transform: 'scale(1.05)'
                      },
                      '&:disabled': { 
                        bgcolor: 'grey.300',
                        transform: 'none'
                      },
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    <SendIcon />
                  </IconButton>
                </Box>
                
                {/* Quick Suggestions */}
                <Box sx={{ 
                  mt: 2, 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: 1,
                  maxHeight: isMobile ? '100px' : 'auto',
                  overflowY: isMobile ? 'auto' : 'visible'
                }}>
                  {quickSuggestions.map((suggestion, index) => (
                    <Chip
                      key={index}
                      label={suggestion}
                      onClick={() => handleSendMessage(suggestion)}
                      variant="outlined"
                      size="small"
                      sx={{ 
                        fontSize: isMobile ? '0.7rem' : '0.75rem',
                        height: isMobile ? '24px' : '28px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          bgcolor: 'primary.light',
                          color: 'primary.contrastText',
                          transform: 'translateY(-1px)',
                          boxShadow: 1
                        }
                      }}
                    />
                  ))}
                </Box>
              </Box>
            </Paper>
          </Grid>
          
          {/* AI Capabilities - Responsive sidebar */}
          <Grid item xs={12} lg={4} xl={3}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: isMobile ? 2 : isTablet ? 2.5 : 3,
              mt: isMobile ? 2 : 0,
              position: isTablet ? 'sticky' : 'static',
              top: isTablet ? 20 : 'auto'
            }}>
              {/* AI Capabilities */}
              <Card sx={{ display: { xs: 'none', md: 'block' } }}>
                <CardContent sx={{ p: isMobile ? 2 : isTablet ? 2.5 : 3 }}>
                  <Typography 
                    variant="h6" 
                    fontWeight={600} 
                    gutterBottom
                    sx={{ fontSize: isMobile ? '1rem' : '1.25rem' }}
                  >
                    {t('aiSupport.aiCapabilities', 'AI Capabilities')}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 1.5 : 2 }}>
                    {aiCapabilities.map((capability, index) => (
                      <Box key={index} sx={{ display: 'flex', gap: isMobile ? 1 : 2 }}>
                        <Box sx={{
                          bgcolor: 'primary.light',
                          color: 'primary.contrastText',
                          borderRadius: 1,
                          p: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: 40,
                          height: 40
                        }}>
                          {capability.icon}
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={600} sx={{ fontSize: isMobile ? '0.8rem' : '0.875rem' }}>
                            {capability.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: isMobile ? '0.7rem' : '0.75rem' }}>
                            {capability.description}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
              
              {/* Tips */}
              <Card sx={{ display: { xs: 'none', md: 'block' } }}>
                <CardContent sx={{ p: isMobile ? 2 : isTablet ? 2.5 : 3 }}>
                  <Typography 
                    variant="h6" 
                    fontWeight={600} 
                    gutterBottom
                    sx={{ fontSize: isMobile ? '1rem' : '1.25rem' }}
                  >
                    {t('aiSupport.proTips', 'Pro Tips')}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 1.5 : 2 }}>
                    {proTips.map((tip, index) => (
                      <Box key={index} sx={{ display: 'flex', gap: isMobile ? 1 : 2 }}>
                        <LightbulbIcon sx={{ color: 'warning.main', fontSize: isMobile ? '1rem' : '1.25rem' }} />
                        <Typography variant="body2" sx={{ fontSize: isMobile ? '0.8rem' : '0.875rem' }}>
                          {tip}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Grid>
        </Grid>

        {/* Snackbar */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ 
            vertical: isMobile ? 'bottom' : 'top', 
            horizontal: 'center' 
          }}
        >
          <Alert 
            onClose={() => setSnackbarOpen(false)} 
            severity="success" 
            sx={{ width: '100%' }}
            icon={<CheckCircleIcon />}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Container>
    </VendorLayout>
  );
}
