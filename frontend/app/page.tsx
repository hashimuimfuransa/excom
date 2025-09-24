"use client";
import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Stack,
  Chip,
  CardMedia,
  Avatar,
  Paper,
  Skeleton,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import StarIcon from '@mui/icons-material/Star';
import BoltIcon from '@mui/icons-material/Bolt';
import LocalMallIcon from '@mui/icons-material/LocalMall';
import HotelIcon from '@mui/icons-material/Hotel';
import BuildIcon from '@mui/icons-material/Build';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import SearchIcon from '@mui/icons-material/Search';
import Footer from '@components/Footer';
import HeroSlider from '@components/HeroSlider';
import CategorySlider from '@components/CategorySlider';
import AiSearchBar from '@components/AiSearchBar';
import AiChatBot from '@components/AiChatBot';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { apiGet } from '@utils/api';
import { getMainImage, hasRealImages } from '@utils/imageHelpers';

interface Product {
  _id: string;
  title: string;
  images: string[];
  price: number;
  category?: string;
  rating?: number;
  createdAt?: string;
}

export default function HomePage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { t } = useTranslation('common');

  const handleSearch = (query: string) => {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  useEffect(() => {
    let alive = true;
    apiGet<Product[]>("/products")
      .then((list) => {
        if (!alive) return;
        setProducts(list || []);
      })
      .catch((error) => {
        console.error('Failed to fetch products:', error);
        setProducts([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  const newArrivals = useMemo(() => {
    const list = (products || []).slice();
    // Prefer createdAt desc if available
    list.sort((a, b) => {
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return db - da;
    });
    return list.slice(0, 8);
  }, [products]);

  const topPicks = useMemo(() => {
    const list = (products || []).slice();
    // Prefer rating desc if available, fallback to price desc as a proxy for highlight
    list.sort((a, b) => {
      const ra = typeof a.rating === 'number' ? a.rating! : -1;
      const rb = typeof b.rating === 'number' ? b.rating! : -1;
      if (rb !== ra) return rb - ra;
      return (b.price || 0) - (a.price || 0);
    });
    return list.slice(0, 8);
  }, [products]);

  const ProductGrid = ({ title, items }: { title: string; items: Product[] | null }) => (
    <Box mt={6}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Typography 
            variant="h5" 
            fontWeight={800}
            sx={{ 
              background: 'linear-gradient(45deg, #22c55e, #16a34a)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: { xs: '1.5rem', md: '1.8rem' }
            }}
          >
            {title}
          </Typography>
          <Chip 
            label="🔥" 
            size="small" 
            sx={{ 
              bgcolor: '#FF4757', 
              color: 'white', 
              fontWeight: 700,
              fontSize: '0.7rem',
              height: 24,
              animation: 'pulse 2s infinite' 
            }} 
          />
        </Stack>
        <Button 
          size="small" 
          variant="outlined"
          endIcon={<ArrowForwardIcon />}
          href="/products"
                sx={{ 
                  borderRadius: 0,
                  px: 2,
                  py: 0.5,
                  fontSize: '0.8rem',
                  transition: 'all 0.3s ease',
                  border: '2px solid #22c55e',
                  color: '#22c55e',
                  '&:hover': {
                    transform: 'translateX(2px)',
                    boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)',
                    backgroundColor: '#22c55e',
                    color: 'white'
                  }
                }}
        >
          {t('actions.viewAll')}
        </Button>
      </Stack>
      
      {!products ? (
        <Grid container spacing={3}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Grid item xs={6} sm={4} md={3} key={i}>
              <Paper 
                sx={{ 
                  p: 2, 
                  borderRadius: 4, 
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <Skeleton 
                  variant="rectangular" 
                  height={200} 
                  sx={{ borderRadius: 3, mb: 2 }} 
                />
                <Skeleton width="90%" height={24} sx={{ mb: 1 }} />
                <Skeleton width="60%" height={20} sx={{ mb: 1 }} />
                <Skeleton width="40%" height={28} />
              </Paper>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Grid container spacing={2}>
          {(items || []).map((p) => {
            const img = getMainImage(p.images, 'product', p._id);
            const isRealImage = hasRealImages(p.images);
            const rating = typeof p.rating === 'number' ? p.rating : 4.5;
            const originalPrice = p.price * 1.2; // Simulate discount
            const discount = Math.round(((originalPrice - p.price) / originalPrice) * 100);
            
            return (
              <Grid item xs={6} sm={4} md={3} key={p._id}>
                <Card 
                  component={NextLink as any} 
                  href={`/product/${p._id}`} 
                sx={{ 
                  borderRadius: 0, 
                  textDecoration: 'none', 
                  overflow: 'hidden',
                  position: 'relative',
                  border: '2px solid',
                  borderColor: '#e5e7eb',
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(250,250,250,0.95) 100%)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  transition: 'all 0.3s ease',
                  '&:hover': { 
                    transform: 'translateY(-6px)',
                    boxShadow: '0 12px 32px rgba(34, 197, 94, 0.15)',
                    borderColor: '#22c55e'
                  } 
                }}
                >
                  <Box sx={{ position: 'relative', overflow: 'hidden' }}>
                    <CardMedia 
                      component="img" 
                      height="180" 
                      image={img} 
                      alt={p.title} 
                      sx={{
                        filter: isRealImage ? 'none' : 'brightness(0.9) sepia(0.1)',
                        transition: 'transform 0.3s ease',
                        '&:hover': {
                          transform: 'scale(1.05)'
                        }
                      }}
                    />
                    
                    {/* Discount Badge */}
                    {discount > 5 && (
                      <Chip
                        label={`-${discount}%`}
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 8,
                          left: 8,
                          bgcolor: '#FF4757',
                          color: 'white',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          boxShadow: '0 2px 8px rgba(255,71,87,0.3)'
                        }}
                      />
                    )}
                    
                    {/* New Badge */}
                    {p.createdAt && new Date(p.createdAt) > new Date(Date.now() - 7*24*60*60*1000) && (
                      <Chip
                        label={t('products.new')}
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          bgcolor: '#2ECC71',
                          color: 'white',
                          fontWeight: 700,
                          fontSize: '0.7rem',
                          boxShadow: '0 2px 8px rgba(46,204,113,0.3)'
                        }}
                      />
                    )}

                    {/* Bargaining Badge - Removed for now as property doesn't exist */}
                    
                    {!isRealImage && (
                      <Chip
                        label={t('products.demo')}
                        size="small"
                        sx={{
                          position: 'absolute',
                          bottom: 8,
                          left: 8,
                          backgroundColor: 'rgba(0,0,0,0.7)',
                          color: 'white',
                          fontSize: '0.6rem',
                          height: 20
                        }}
                      />
                    )}

                    {/* Quick View Overlay */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        bgcolor: 'rgba(33, 150, 243, 0.8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0,
                        transition: 'opacity 0.3s ease',
                        '&:hover': {
                          opacity: 1
                        }
                      }}
                      className="quick-view-overlay"
                    >
                      <Button
                        variant="contained"
                        size="small"
                        sx={{
                          bgcolor: 'white',
                          color: 'primary.main',
                          fontWeight: 700,
                          '&:hover': {
                            bgcolor: 'grey.100'
                          }
                        }}
                      >
                        {t('products.quickView')}
                      </Button>
                    </Box>
                  </Box>
                  
                  <CardContent sx={{ p: 2 }}>
                    <Typography 
                      variant="subtitle1" 
                      fontWeight={700} 
                      gutterBottom 
                      noWrap
                      sx={{ 
                        fontSize: { xs: '0.9rem', sm: '1rem' },
                        color: 'text.primary',
                        lineHeight: 1.3
                      }}
                    >
                      {p.title}
                    </Typography>
                    
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <StarIcon sx={{ color: '#FFD700', fontSize: '0.9rem' }} />
                        <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8rem' }}>
                          {rating.toFixed(1)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          ({Math.floor(Math.random() * 100) + 10})
                        </Typography>
                      </Stack>
                    </Stack>
                    
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography 
                            variant="h6" 
                            fontWeight={800} 
                            color="primary.main"
                            sx={{ fontSize: '1.1rem' }}
                          >
                            ${(p.price ?? 0).toFixed(2)}
                          </Typography>
                          {discount > 5 && (
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                textDecoration: 'line-through',
                                color: 'text.secondary',
                                fontSize: '0.8rem'
                              }}
                            >
                              ${originalPrice.toFixed(2)}
                            </Typography>
                          )}
                        </Stack>
                        <Typography variant="caption" color="success.main" fontWeight={600} sx={{ fontSize: '0.7rem' }}>
                          {t('products.freeShipping')} ✅
                        </Typography>
                      </Box>
                      
                      <IconButton
                        size="small"
                        sx={{
                          bgcolor: 'primary.main',
                          color: 'white',
                          width: 32,
                          height: 32,
                          '&:hover': {
                            bgcolor: 'primary.dark',
                            transform: 'scale(1.1)'
                          }
                        }}
                      >
                        <LocalMallIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );

  return (
    <Box>
      {/* Enhanced CSS Animations */}
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-15px) rotate(2deg); }
          50% { transform: translateY(-8px) rotate(0deg); }
          75% { transform: translateY(-20px) rotate(-2deg); }
        }
        
        @keyframes gamingGlow {
          0%, 100% { filter: drop-shadow(0 0 5px currentColor); }
          50% { filter: drop-shadow(0 0 20px currentColor) drop-shadow(0 0 30px currentColor); }
        }
        
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        
        @keyframes slideInUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes fadeInScale {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* Hero */}
      <HeroSlider />

      <Container sx={{ py: 4 }}>
        {/* Category Slider */}
        <Box mt={2}>
          <CategorySlider />
        </Box>

        {/* Featured Collections - Minimal Design */}
        <Box mt={6}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <LocalMallIcon sx={{ color: 'primary.main', fontSize: '1.5rem' }} />
              <Typography 
                variant="h5" 
                fontWeight={700}
                sx={{ 
                  background: 'linear-gradient(45deg, #22c55e, #16a34a)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontSize: { xs: '1.3rem', md: '1.5rem' }
                }}
              >
{t('home.shopByCategory')}
              </Typography>
              <Chip 
                label="Hot" 
                size="small" 
                sx={{ 
                  bgcolor: '#FF4757', 
                  color: 'white', 
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  height: 22,
                  borderRadius: 1
                }} 
              />
            </Stack>
            <Button 
              component={NextLink}
              href="/collections" 
              variant="contained"
              size="small"
              sx={{ 
                borderRadius: 0, 
                display: { xs: 'none', sm: 'flex' },
                background: 'linear-gradient(45deg, #22c55e, #16a34a)',
                fontWeight: 600,
                px: 3,
                py: 1,
                fontSize: '0.8rem',
                textTransform: 'none',
                '&:hover': {
                  background: 'linear-gradient(45deg, #16a34a, #15803d)'
                }
              }}
            >
              {t('actions.viewAll')}
            </Button>
          </Stack>
          
          {/* Minimal Collections Grid */}
          <Grid container spacing={2}>
            {[
              { 
                title: t('collectionsPage.types.hotels'), 
                icon: '🏨',
                href: '/collections?type=hotel',
                color: '#2196F3'
              },
              { 
                title: t('collectionsPage.types.restaurants'), 
                icon: '🍽️',
                href: '/collections?type=restaurant',
                color: '#FF9800'
              },
              { 
                title: t('collectionsPage.types.realEstate'), 
                icon: '🏡',
                href: '/collections?type=real-estate',
                color: '#4CAF50'
              },
              { 
                title: t('home.carRentals'), 
                icon: '🚗',
                href: '/collections?type=car-rental',
                color: '#E91E63'
              },
              { 
                title: t('home.tutorsAndCourses'), 
                icon: '🎓',
                href: '/collections?type=education',
                color: '#3F51B5'
              },
              { 
                title: t('home.shoppingLifestyle'), 
                icon: '🛍️',
                href: '/collections?type=shopping',
                color: '#9C27B0'
              },
            ].map((c) => (
              <Grid item xs={6} sm={4} md={2} key={c.title}>
                <Card 
                  component={NextLink as any} 
                  href={c.href} 
                  sx={{ 
                    textDecoration: 'none', 
                    transition: 'all 0.2s ease', 
                    height: 120,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': { 
                      borderColor: c.color,
                      transform: 'translateY(-2px)',
                      boxShadow: `0 4px 12px ${c.color}20`
                    } 
                  }}
                >
                  <Typography sx={{ fontSize: '2rem', mb: 1 }}>
                    {c.icon}
                  </Typography>
                  <Typography 
                    variant="subtitle2" 
                    fontWeight={600}
                    sx={{ 
                      fontSize: '0.9rem',
                      color: 'text.primary',
                      textAlign: 'center'
                    }}
                  >
                    {c.title}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* New Arrivals (real data) */}
        <ProductGrid title={`🔥 ${t('products.newArrivals')}`} items={newArrivals} />

        {/* Top Picks (real data) */}
        <ProductGrid title={`⭐ ${t('products.topPicks')}`} items={topPicks} />

        {/* Modern Testimonials Section */}
        <Box mt={8}>
          <Box textAlign="center" mb={6}>
            <Typography 
              variant="h4" 
              fontWeight={900} 
              gutterBottom
              sx={{
                background: 'linear-gradient(45deg, #22c55e, #16a34a)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: { xs: '1.8rem', md: '2.2rem' }
              }}
            >
              {t('home.customerTestimonials')}
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500, fontSize: '1.1rem' }}>
              {t('home.testimonialSubtitle')}
            </Typography>
          </Box>
          
          <Grid container spacing={4}>
            {[
              {
                name: t('testimonials.person1.name'),
                role: t('testimonials.person1.role'),
                avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
                rating: 5,
                text: t('testimonials.person1.text'),
                verified: true
              },
              {
                name: t('testimonials.person2.name'),
                role: t('testimonials.person2.role'),
                avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
                rating: 5,
                text: t('testimonials.person2.text'),
                verified: true
              },
              {
                name: t('testimonials.person3.name'),
                role: t('testimonials.person3.role'),
                avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
                rating: 5,
                text: t('testimonials.person3.text'),
                verified: true
              }
            ].map((testimonial, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Paper 
                  sx={{ 
                    p: 5, 
                    borderRadius: 0,
                    height: '100%',
                    position: 'relative',
                    background: (t) => t.palette.mode === 'light' 
                      ? 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)'
                      : 'linear-gradient(135deg, rgba(30,30,30,0.95) 0%, rgba(45,45,45,0.95) 100%)',
                    border: '2px solid',
                    borderColor: '#e5e7eb',
                    backdropFilter: 'blur(20px)',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'translateY(-12px)',
                      boxShadow: '0 24px 48px rgba(34, 197, 94, 0.15)',
                      borderColor: '#22c55e',
                      '& .testimonial-quote': {
                        transform: 'scale(1.05)',
                        color: '#22c55e'
                      },
                      '& .testimonial-avatar': {
                        transform: 'scale(1.1)',
                        boxShadow: '0 8px 24px rgba(34, 197, 94, 0.3)'
                      }
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 6,
                      background: 'linear-gradient(90deg, #22c55e, #16a34a)',
                      borderRadius: 0
                    }
                  }}
                >
                  <Stack spacing={4}>
                    <Stack direction="row" alignItems="center" spacing={3}>
                      <Avatar 
                        className="testimonial-avatar"
                        src={testimonial.avatar}
                        sx={{ 
                          width: 72, 
                          height: 72,
                          border: '4px solid',
                          borderColor: '#22c55e',
                          boxShadow: '0 6px 20px rgba(34, 197, 94, 0.2)',
                          transition: 'all 0.3s ease'
                        }}
                      />
                      <Box>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography variant="h6" fontWeight={800} color="text.primary">
                            {testimonial.name}
                          </Typography>
                          {testimonial.verified && (
                            <Chip 
                              label={`✓ ${t('collectionsPage.verification.verified')}`} 
                              size="small" 
                              sx={{ 
                                bgcolor: '#22c55e', 
                                color: 'white', 
                                fontSize: '0.7rem',
                                height: 20,
                                borderRadius: 0
                              }} 
                            />
                          )}
                        </Stack>
                        <Typography 
                          variant="body2" 
                          color="#22c55e" 
                          fontWeight={600}
                          sx={{ mt: 0.5 }}
                        >
                          {testimonial.role}
                        </Typography>
                      </Box>
                    </Stack>
                    
                    <Stack direction="row" spacing={0.5} justifyContent="center">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <StarIcon 
                          key={i} 
                          sx={{ 
                            color: '#FFD700', 
                            fontSize: '1.8rem',
                            filter: 'drop-shadow(0 3px 6px rgba(255,215,0,0.4))'
                          }} 
                        />
                      ))}
                    </Stack>
                    
                    <Box 
                      sx={{ 
                        position: 'relative',
                        p: 3,
                        borderRadius: 0,
                        bgcolor: 'rgba(34, 197, 94, 0.05)',
                        border: '2px solid',
                        borderColor: 'rgba(34, 197, 94, 0.1)',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: -2,
                          left: -2,
                          right: -2,
                          bottom: -2,
                          background: 'linear-gradient(45deg, #22c55e, #16a34a)',
                          zIndex: -1,
                          borderRadius: 0
                        }
                      }}
                    >
                      <Typography 
                        className="testimonial-quote"
                        variant="body1" 
                        sx={{ 
                          fontStyle: 'italic',
                          lineHeight: 1.7,
                          position: 'relative',
                          zIndex: 1,
                          fontSize: '1.1rem',
                          fontWeight: 500,
                          transition: 'all 0.3s ease'
                        }}
                      >
                        "{testimonial.text}"
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Modern Flash Deals */}
        <Box mt={8}>
          <Paper 
            sx={{ 
              p: 8, 
              borderRadius: 0,
              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 50%, #15803d 100%)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 24px 64px rgba(34, 197, 94, 0.3)',
              border: '4px solid',
              borderColor: '#15803d'
            }}
          >
            {/* Animated Background Pattern */}
            <Box
              sx={{
                position: 'absolute',
                top: -120,
                right: -120,
                width: 500,
                height: 500,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.08)',
                animation: 'float 12s ease-in-out infinite',
                zIndex: 0
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: -100,
                left: -100,
                width: 400,
                height: 400,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.06)',
                animation: 'float 15s ease-in-out infinite reverse',
                zIndex: 0
              }}
            />
            
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Stack direction="row" alignItems="center" justifyContent="center" spacing={3} mb={4}>
                <BoltIcon sx={{ fontSize: '4rem', animation: 'pulse 2s infinite', filter: 'drop-shadow(0 4px 8px rgba(255,255,255,0.3))' }} />
                <Typography variant="h2" fontWeight={900} sx={{ fontSize: { xs: '2.5rem', md: '3.5rem' }, textShadow: '2px 2px 8px rgba(0,0,0,0.3)' }}>
                  {t('home.flashDeals')}
                </Typography>
              </Stack>
              
              <Typography variant="h5" textAlign="center" sx={{ opacity: 0.95, mb: 6, fontWeight: 500, fontSize: { xs: '1.2rem', md: '1.4rem' } }}>
                {t('home.flashDealsSubtitle')}
              </Typography>
              
              <Grid container spacing={4}>
                {[
                  { title: t('home.electronics'), discount: '30%', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400', originalPrice: '$299', newPrice: '$209' },
                  { title: t('home.fashion'), discount: '25%', image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400', originalPrice: '$89', newPrice: '$67' },
                  { title: t('home.homeAndGarden'), discount: '20%', image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400', originalPrice: '$149', newPrice: '$119' },
                  { title: t('home.sports'), discount: '35%', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400', originalPrice: '$199', newPrice: '$129' }
                ].map((deal, index) => (
                  <Grid item xs={12} sm={6} md={3} key={index}>
                    <Card 
                      component={NextLink as any} 
                      href="/categories" 
                      sx={{ 
                        borderRadius: 0, 
                        textDecoration: 'none', 
                        overflow: 'hidden',
                        position: 'relative',
                        transition: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)',
                        border: '3px solid',
                        borderColor: 'rgba(255,255,255,0.2)',
                        background: 'rgba(255,255,255,0.95)',
                        backdropFilter: 'blur(20px)',
                        '&:hover': { 
                          transform: 'translateY(-12px) scale(1.03)', 
                          boxShadow: '0 24px 48px rgba(0,0,0,0.25)',
                          borderColor: 'rgba(255,255,255,0.8)',
                          '& .deal-image': {
                            transform: 'scale(1.1)',
                            filter: 'brightness(1.1)'
                          },
                          '& .deal-discount': {
                            transform: 'scale(1.2)',
                            animation: 'pulse 1s infinite'
                          }
                        } 
                      }}
                    >
                      <CardMedia 
                        className="deal-image"
                        component="img" 
                        height="140" 
                        image={deal.image}
                        alt={deal.title}
                        sx={{ 
                          filter: 'brightness(0.9)',
                          transition: 'all 0.4s ease'
                        }}
                      />
                      
                      {/* Discount Badge */}
                      <Box
                        className="deal-discount"
                        sx={{
                          position: 'absolute',
                          top: 12,
                          right: 12,
                          bgcolor: '#ef4444',
                          color: 'white',
                          px: 2,
                          py: 1,
                          borderRadius: 0,
                          fontWeight: 800,
                          fontSize: '0.9rem',
                          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
                          border: '2px solid white',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        -{deal.discount}
                      </Box>
                      
                      <CardContent sx={{ p: 3 }}>
                        <Typography fontWeight={800} variant="h6" sx={{ mb: 1, fontSize: '1.1rem' }}>
                          {deal.title}
                        </Typography>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                          <Typography variant="h6" fontWeight={800} color="#22c55e" sx={{ fontSize: '1.2rem' }}>
                            {deal.newPrice}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              textDecoration: 'line-through',
                              color: 'text.secondary',
                              fontSize: '0.9rem'
                            }}
                          >
                            {deal.originalPrice}
                          </Typography>
                        </Stack>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                          {t('deals.saveUpTo')} {deal.discount} {t('deals.todayOnly')}!
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              
              <Box textAlign="center" mt={6}>
                <Button
                  component={NextLink}
                  href="/categories"
                  variant="contained"
                  size="large"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.15)',
                    color: 'white',
                    backdropFilter: 'blur(20px)',
                    border: '3px solid rgba(255,255,255,0.3)',
                    borderRadius: 0,
                    px: 8,
                    py: 3,
                    fontSize: '1.3rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    boxShadow: '0 8px 32px rgba(255,255,255,0.2)',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.25)',
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 40px rgba(255,255,255,0.3)',
                      borderColor: 'rgba(255,255,255,0.5)'
                    }
                  }}
                >
                  {t('home.shopAllDeals')}
                </Button>
              </Box>
            </Box>
          </Paper>
        </Box>

        {/* Modern Newsletter Section */}
        <Box mt={8}>
          <Paper 
            sx={{ 
              p: 8, 
              borderRadius: 0,
              textAlign: 'center',
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(22, 163, 74, 0.1) 50%, rgba(21, 128, 61, 0.1) 100%)',
              border: '3px solid',
              borderColor: '#22c55e',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 24px 64px rgba(34, 197, 94, 0.15)'
            }}
          >
            {/* Background Elements */}
            <Box
              sx={{
                position: 'absolute',
                top: -80,
                right: -80,
                width: 300,
                height: 300,
                borderRadius: '50%',
                background: 'linear-gradient(45deg, rgba(34, 197, 94, 0.1), rgba(22, 163, 74, 0.1))',
                animation: 'float 8s ease-in-out infinite',
                zIndex: 0
              }}
            />
            
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Typography 
                variant="h3" 
                fontWeight={900} 
                gutterBottom
                sx={{
                  background: 'linear-gradient(45deg, #22c55e, #16a34a)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontSize: { xs: '2rem', md: '2.5rem' }
                }}
              >
                {t('home.newsletter')}
              </Typography>
              <Typography variant="h5" color="text.secondary" mb={5} sx={{ fontWeight: 500, fontSize: { xs: '1.1rem', md: '1.3rem' } }}>
                {t('home.newsletterSubtitle')}
              </Typography>
              
              <Stack 
                direction={{ xs: 'column', sm: 'row' }} 
                spacing={3} 
                justifyContent="center" 
                alignItems="center"
                sx={{ maxWidth: 700, mx: 'auto' }}
              >
                <TextField
                  placeholder={t('forms.email')}
                  variant="outlined"
                  sx={{ 
                    flex: 1,
                    '& .MuiInputBase-root': { 
                      borderRadius: 0,
                      bgcolor: 'background.paper',
                      fontSize: '1.1rem',
                      py: 1.5,
                      border: '2px solid',
                      borderColor: '#e5e7eb',
                      '&:focus-within': {
                        borderColor: '#22c55e',
                        boxShadow: '0 0 0 3px rgba(34, 197, 94, 0.1)'
                      }
                    }
                  }}
                />
                <Button
                  variant="contained"
                  size="large"
                  sx={{ 
                    px: 8,
                    py: 2,
                    borderRadius: 0,
                    minWidth: 200,
                    fontSize: '1.1rem',
                    fontWeight: 800,
                    background: 'linear-gradient(45deg, #22c55e, #16a34a)',
                    boxShadow: '0 8px 32px rgba(34, 197, 94, 0.4)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      boxShadow: '0 12px 40px rgba(34, 197, 94, 0.6)',
                      background: 'linear-gradient(45deg, #16a34a, #15803d)'
                    }
                  }}
                >
                  {t('home.subscribe')}
                </Button>
              </Stack>
              
              <Typography variant="caption" color="text.secondary" mt={4} display="block" sx={{ fontSize: '0.9rem', fontWeight: 500 }}>
                {t('home.privacyNote')}
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Container>

      {/* Footer */}
      <Footer />
      
      {/* AI Chatbot */}
      <AiChatBot 
        isOpen={isChatOpen} 
        onToggle={() => setIsChatOpen(!isChatOpen)} 
        position="bottom-right"
      />
    </Box>
  );
}