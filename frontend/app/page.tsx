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
    <Box mt={8}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={4}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography 
            variant="h4" 
            fontWeight={900}
            sx={{ 
              background: 'linear-gradient(45deg, #2196F3, #21CBF3)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            {title}
          </Typography>
          <Chip 
            label="HOT" 
            size="small" 
            sx={{ 
              bgcolor: '#FF4757', 
              color: 'white', 
              fontWeight: 700,
              animation: 'pulse 2s infinite' 
            }} 
          />
        </Stack>
        <Button 
          size="medium" 
          variant="outlined"
          endIcon={<ArrowForwardIcon />}
          href="/products"
          sx={{ 
            borderRadius: 3,
            px: 3,
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateX(4px)',
              boxShadow: '0 8px 25px rgba(33, 150, 243, 0.3)'
            }
          }}
        >
          {t('products.viewAll')}
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
        <Grid container spacing={3}>
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
                    borderRadius: 4, 
                    textDecoration: 'none', 
                    overflow: 'hidden',
                    position: 'relative',
                    border: '1px solid',
                    borderColor: 'divider',
                    background: 'linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(250,250,250,0.9) 100%)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    '&:hover': { 
                      transform: 'translateY(-8px) scale(1.02)',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                      borderColor: 'primary.main'
                    } 
                  }}
                >
                  <Box sx={{ position: 'relative', overflow: 'hidden' }}>
                    <CardMedia 
                      component="img" 
                      height="200" 
                      image={img} 
                      alt={p.title} 
                      sx={{
                        filter: isRealImage ? 'none' : 'brightness(0.9) sepia(0.1)',
                        transition: 'transform 0.4s ease',
                        '&:hover': {
                          transform: 'scale(1.1)'
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

                    {/* Bargaining Badge */}
                    {p.bargainingEnabled && (
                      <Chip
                        label="💬 Bargain!"
                        size="small"
                        sx={{
                          position: 'absolute',
                          bottom: 8,
                          left: 8,
                          bgcolor: 'warning.main',
                          color: 'white',
                          fontWeight: 700,
                          fontSize: '0.7rem',
                          boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)',
                          animation: 'pulse 2s infinite',
                          '@keyframes pulse': {
                            '0%': {
                              boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)',
                            },
                            '50%': {
                              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.6)',
                              transform: 'scale(1.05)',
                            },
                            '100%': {
                              boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)',
                            }
                          }
                        }}
                      />
                    )}
                    
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
                  
                  <CardContent sx={{ p: 2.5 }}>
                    <Typography 
                      variant="h6" 
                      fontWeight={700} 
                      gutterBottom 
                      noWrap
                      sx={{ 
                        fontSize: { xs: '1rem', sm: '1.1rem' },
                        color: 'text.primary'
                      }}
                    >
                      {p.title}
                    </Typography>
                    
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <StarIcon sx={{ color: '#FFD700', fontSize: '1rem' }} />
                        <Typography variant="body2" fontWeight={600}>
                          {rating.toFixed(1)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ({Math.floor(Math.random() * 100) + 10})
                        </Typography>
                      </Stack>
                      
                      {p.category && (
                        <Chip 
                          label={p.category} 
                          size="small" 
                          variant="outlined"
                          sx={{ 
                            fontSize: '0.7rem',
                            height: 20
                          }}
                        />
                      )}
                    </Stack>
                    
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography 
                            variant="h6" 
                            fontWeight={800} 
                            color="primary.main"
                            sx={{ fontSize: '1.2rem' }}
                          >
                            ${(p.price ?? 0).toFixed(2)}
                          </Typography>
                          {discount > 5 && (
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                textDecoration: 'line-through',
                                color: 'text.secondary',
                                fontSize: '0.9rem'
                              }}
                            >
                              ${originalPrice.toFixed(2)}
                            </Typography>
                          )}
                        </Stack>
                        <Typography variant="caption" color="success.main" fontWeight={600}>
                          {t('products.freeShipping')} ✅
                        </Typography>
                      </Box>
                      
                      <IconButton
                        size="small"
                        sx={{
                          bgcolor: 'primary.main',
                          color: 'white',
                          width: 36,
                          height: 36,
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
      {/* Gaming CSS Animations */}
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-10px) rotate(1deg); }
          50% { transform: translateY(-5px) rotate(0deg); }
          75% { transform: translateY(-15px) rotate(-1deg); }
        }
        
        @keyframes gamingGlow {
          0%, 100% { filter: drop-shadow(0 0 5px currentColor); }
          50% { filter: drop-shadow(0 0 20px currentColor) drop-shadow(0 0 30px currentColor); }
        }
      `}</style>

      {/* Hero */}
      <HeroSlider />

      <Container sx={{ py: 6 }}>
        {/* Enhanced Search Section */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: 4, 
            borderRadius: 4, 
            border: (t) => `1px solid ${t.palette.divider}`,
            background: (t) => t.palette.mode === 'light' 
              ? 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(250,250,250,0.9) 100%)'
              : 'linear-gradient(135deg, rgba(30,30,30,0.9) 0%, rgba(20,20,20,0.9) 100%)',
            backdropFilter: 'blur(10px)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Background decoration */}
          <Box
            sx={{
              position: 'absolute',
              top: -50,
              right: -50,
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: 'linear-gradient(45deg, #2196F3, #21CBF3)',
              opacity: 0.05,
              zIndex: 0
            }}
          />
          
          <Stack spacing={3} sx={{ position: 'relative', zIndex: 1 }}>
            <Box textAlign="center">
              <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} mb={1}>
                <Typography variant="h5" fontWeight={800}>
                  🎯 {t('home.questTitle')}
                </Typography>
                <Chip 
                  label={t('home.powerUp')} 
                  size="small" 
                  sx={{ 
                    bgcolor: '#FF4757', 
                    color: 'white', 
                    fontWeight: 700,
                    animation: 'pulse 2s infinite' 
                  }} 
                />
              </Stack>
              <Typography variant="body1" color="text.secondary">
                🚀 {t('home.discoverEpicDeals')} • ⚡ {t('home.unlockExclusiveItems')} • 🏆 {t('home.levelUpShopping')}
              </Typography>
            </Box>
            
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
              <AiSearchBar 
                onSearch={handleSearch}
                placeholder={`🎯 ${t('home.aiSearchPlaceholder')}`}
                showSuggestions={true}
              />
              <Button 
                variant="contained" 
                size="large"
                endIcon={<ArrowForwardIcon />} 
                component={NextLink}
                href="/categories" 
                sx={{ 
                  px: 4, 
                  py: 1.5,
                  borderRadius: 3,
                  minWidth: 160,
                  background: 'linear-gradient(45deg, #2196F3, #21CBF3)',
                  fontWeight: 700,
                  fontSize: '1rem',
                  boxShadow: '0 6px 20px rgba(33, 150, 243, 0.4)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px) scale(1.05)',
                    boxShadow: '0 12px 30px rgba(33, 150, 243, 0.6)'
                  }
                }}
              >
                🚀 {t('home.questOn')}
              </Button>
            </Stack>
            
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
                🔥 {t('home.popularQuests')}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                {[
                  {label:`⚡ ${t('home.electronics')}`, href:'/categories/electronics', color: '#2196F3'},
                  {label:`👗 ${t('home.fashion')}`, href:'/categories/fashion', color: '#E91E63'},
                  {label:`🏡 ${t('home.homeAndGarden')}`, href:'/categories/home', color: '#4CAF50'},
                  {label:`🏃 ${t('home.sports')}`, href:'/categories/sports', color: '#FF9800'},
                  {label:`📚 ${t('home.books')}`, href:'/categories/books', color: '#795548'}
                ].map((q) => (
                  <Chip 
                    key={q.label} 
                    label={q.label} 
                    size="small" 
                    variant="outlined" 
                    clickable 
                    component={NextLink as any} 
                    href={q.href} 
                    sx={{ 
                      borderRadius: 3,
                      fontWeight: 600,
                      border: `2px solid ${q.color}30`,
                      color: q.color,
                      transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                      '&:hover': {
                        transform: 'translateY(-3px) scale(1.05)',
                        boxShadow: `0 8px 25px ${q.color}40`,
                        borderColor: q.color,
                        bgcolor: q.color,
                        color: 'white'
                      }
                    }} 
                  />
                ))}
              </Stack>
            </Box>
          </Stack>
        </Paper>





        {/* Category Slider */}
        <Box mt={8}>
          <CategorySlider />
        </Box>

        {/* Featured collections */}
        <Box mt={8}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={4}>
            <Box>
              <Stack direction="row" alignItems="center" spacing={2} mb={1}>
                <Typography variant="h5" fontWeight={900}>
                  🎮 {t('home.epicCollections')}
                </Typography>
                <Chip 
                  label={t('home.legendaryTier')} 
                  size="small" 
                  sx={{ 
                    bgcolor: '#FFD700', 
                    color: 'black', 
                    fontWeight: 800,
                    fontSize: '0.65rem',
                    animation: 'pulse 3s infinite'
                  }} 
                />
              </Stack>
              <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                🏨 {t('home.collectionCategories')}
              </Typography>
            </Box>
            <Button 
              component={NextLink}
              href="/collections" 
              variant="contained"
              sx={{ 
                borderRadius: 3, 
                display: { xs: 'none', sm: 'flex' },
                background: 'linear-gradient(45deg, #FF6B35, #F7931E)',
                fontWeight: 700,
                px: 3,
                boxShadow: '0 4px 15px rgba(255, 107, 53, 0.4)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(255, 107, 53, 0.6)'
                }
              }}
            >
              🏆 {t('home.browseAll')}
            </Button>
          </Stack>
          <Grid container spacing={3}>
            {[
              { 
                title: `🏨 ${t('home.premiumHotels')}`, 
                subtitle: t('home.luxuryAccommodations'),
                img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200&auto=format&fit=crop', 
                href: '/collections?type=hotel',
                badge: `🔥 ${t('home.badgeTrending')}`,
                badgeColor: '#2196F3',
                powerLevel: t('home.powerLevelEpic')
              },
              { 
                title: `🍽️ ${t('home.topRestaurants')}`, 
                subtitle: t('home.fineDining'),
                img: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1200&auto=format&fit=crop', 
                href: '/collections?type=restaurant',
                badge: `⭐ ${t('home.badgeNewSpots')}`,
                badgeColor: '#FF9800',
                powerLevel: t('home.powerLevelRare')
              },
              { 
                title: `🏡 ${t('home.realEstate')}`, 
                subtitle: t('home.primeProperties'),
                img: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=1200&auto=format&fit=crop', 
                href: '/collections?type=real-estate',
                badge: `👑 ${t('home.badgePremium')}`,
                badgeColor: '#4CAF50',
                powerLevel: t('home.powerLevelLegendary')
              },
              { 
                title: `🚗 ${t('home.carRentals')}`, 
                subtitle: t('home.premiumVehicles'),
                img: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?q=80&w=1200&auto=format&fit=crop', 
                href: '/collections?type=car-rental',
                badge: `🚀 ${t('home.badgeFast')}`,
                badgeColor: '#E91E63',
                powerLevel: t('home.powerLevelRare')
              },
              { 
                title: `🎓 ${t('home.tutorsAndCourses')}`, 
                subtitle: t('home.expertKnowledge'),
                img: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop&crop=center', 
                href: '/collections?type=education',
                badge: `📚 ${t('home.badgeLearn')}`,
                badgeColor: '#3F51B5',
                powerLevel: t('home.powerLevelEpic')
              },
              { 
                title: `🛍️ ${t('home.shoppingLifestyle')}`, 
                subtitle: t('home.curatedProducts'),
                img: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200&auto=format&fit=crop', 
                href: '/collections?type=shopping',
                badge: `💎 ${t('home.badgeLuxury')}`,
                badgeColor: '#9C27B0',
                powerLevel: t('home.powerLevelLegendary')
              },
            ].map((c) => (
              <Grid key={c.title} item xs={12} md={4}>
                <Card 
                  component={NextLink as any} 
                  href={c.href} 
                  sx={{ 
                    borderRadius: 3, 
                    overflow: 'hidden', 
                    textDecoration: 'none', 
                    transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)', 
                    position: 'relative',
                    height: 280,
                    '&:hover': { 
                      transform: 'translateY(-8px) scale(1.02)', 
                      boxShadow: '0 20px 40px rgba(0,0,0,0.15)' 
                    } 
                  }}
                >
                  <CardMedia 
                    component="img" 
                    height="200" 
                    image={c.img} 
                    alt={c.title}
                    sx={{ 
                      filter: 'brightness(0.9)',
                      transition: 'filter 300ms',
                      '&:hover': { filter: 'brightness(1.1)' }
                    }}
                  />
                  {/* Gaming Badge */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      zIndex: 2
                    }}
                  >
                    <Chip 
                      label={c.badge} 
                      size="small" 
                      sx={{ 
                        backdropFilter: 'blur(8px)',
                        bgcolor: c.badgeColor,
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '0.7rem',
                        animation: 'pulse 2s infinite',
                        border: '2px solid rgba(255,255,255,0.3)'
                      }}
                    />
                  </Box>
                  
                  {/* Power Level Indicator */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 12,
                      left: 12,
                      zIndex: 2
                    }}
                  >
                    <Chip 
                      label={c.powerLevel} 
                      size="small" 
                      sx={{ 
                        bgcolor: 'rgba(0,0,0,0.7)',
                        color: '#FFD700',
                        fontWeight: 800,
                        fontSize: '0.65rem',
                        border: '1px solid #FFD700'
                      }}
                    />
                  </Box>
                  <CardContent sx={{ height: 80 }}>
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      {c.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {c.subtitle}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          {/* Mobile Browse All Button */}
          <Box sx={{ display: { xs: 'block', sm: 'none' }, textAlign: 'center', mt: 3 }}>
            <Button
              component={NextLink}
              href="/categories"
              variant="outlined"
              fullWidth
              sx={{ borderRadius: 2 }}
            >
              Browse All Collections
            </Button>
          </Box>
        </Box>

        {/* New Arrivals (real data) */}
        <ProductGrid title={t('products.newArrivals')} items={newArrivals} />

        {/* Top Picks (real data) */}
        <Box mt={6}>
          <Stack direction="row" alignItems="center" spacing={1} mb={2}>
            <TrendingUpIcon color="primary" />
            <Typography variant="h5" fontWeight={800}>{t('products.topPicks')}</Typography>
          </Stack>
          <Grid container spacing={2}>
            {(!products ? Array.from({ length: 8 }) : topPicks).map((p: any, idx: number) => {
              if (!products) {
                return (
                  <Grid item xs={6} sm={4} md={3} key={idx}>
                    <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 2, mb: 1 }} />
                    <Skeleton width="80%" />
                    <Skeleton width="40%" />
                  </Grid>
                );
              }
              const img = getMainImage(p.images, 'product', p._id);
              const isRealImage = hasRealImages(p.images);
              const rating = typeof p.rating === 'number' ? p.rating : 4.7;
              return (
                <Grid item xs={6} sm={4} md={3} key={p._id}>
                  <Card component={NextLink as any} href={`/product/${p._id}`} sx={{ borderRadius: 3, textDecoration: 'none', overflow: 'hidden', transition: 'transform 200ms', position: 'relative', '&:hover': { transform: 'translateY(-2px)' } }}>
                    <Box sx={{ position: 'relative' }}>
                      <CardMedia 
                        component="img" 
                        height="160" 
                        image={img} 
                        alt={p.title} 
                        sx={{
                          filter: isRealImage ? 'none' : 'brightness(0.9) sepia(0.1)',
                        }}
                      />
                      {!isRealImage && (
                        <Chip
                          label="Stock Photo"
                          size="small"
                          sx={{
                            position: 'absolute',
                            bottom: 4,
                            left: 4,
                            backgroundColor: 'rgba(0,0,0,0.6)',
                            color: 'white',
                            fontSize: '0.6rem',
                            height: 16
                          }}
                        />
                      )}
                    </Box>
                    <CardContent>
                      <Typography fontWeight={700} gutterBottom noWrap>{p.title}</Typography>
                      <Stack direction="row" spacing={0.5} alignItems="center" color="warning.main">
                        <StarIcon fontSize="small" />
                        <Typography variant="body2">{rating.toFixed(1)}</Typography>
                      </Stack>
                      <Typography variant="body2" color="text.secondary">${(p.price ?? 0).toFixed(2)}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>

        {/* Testimonials Section */}
        <Box mt={8}>
          <Typography variant="h5" fontWeight={800} textAlign="center" gutterBottom>
            {t('home.customerTestimonials')}
          </Typography>
          <Typography variant="body1" color="text.secondary" textAlign="center" mb={4}>
            {t('home.testimonialSubtitle')}
          </Typography>
          
          <Grid container spacing={4}>
            {[
              {
                name: t('testimonials.person1.name'),
                role: t('testimonials.person1.role'),
                avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
                rating: 5,
                text: t('testimonials.person1.text')
              },
              {
                name: t('testimonials.person2.name'),
                role: t('testimonials.person2.role'),
                avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
                rating: 5,
                text: t('testimonials.person2.text')
              },
              {
                name: t('testimonials.person3.name'),
                role: t('testimonials.person3.role'),
                avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
                rating: 5,
                text: t('testimonials.person3.text')
              }
            ].map((testimonial, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Paper 
                  sx={{ 
                    p: 4, 
                    borderRadius: 4,
                    height: '100%',
                    position: 'relative',
                    background: (t) => t.palette.mode === 'light' 
                      ? 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%)'
                      : 'linear-gradient(135deg, rgba(30,30,30,0.9) 0%, rgba(45,45,45,0.9) 100%)',
                    border: '1px solid',
                    borderColor: 'divider',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'translateY(-8px) scale(1.02)',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
                      borderColor: 'primary.main'
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 4,
                      background: (t) => `linear-gradient(90deg, ${t.palette.primary.main}, ${t.palette.secondary.main})`,
                      borderRadius: '4px 4px 0 0'
                    }
                  }}
                >
                  <Stack spacing={3}>
                    <Stack direction="row" alignItems="center" spacing={3}>
                      <Avatar 
                        src={testimonial.avatar}
                        sx={{ 
                          width: 64, 
                          height: 64,
                          border: '3px solid',
                          borderColor: 'primary.main',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                        }}
                      />
                      <Box>
                        <Typography variant="h6" fontWeight={700} color="text.primary">
                          {testimonial.name}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="primary.main" 
                          fontWeight={500}
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
                            fontSize: '1.5rem',
                            filter: 'drop-shadow(0 2px 4px rgba(255,215,0,0.3))'
                          }} 
                        />
                      ))}
                    </Stack>
                    
                    <Box 
                      sx={{ 
                        position: 'relative',
                        p: 2,
                        borderRadius: 2,
                        bgcolor: 'rgba(0,0,0,0.02)',
                        border: '1px solid',
                        borderColor: 'divider'
                      }}
                    >
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontStyle: 'italic',
                          lineHeight: 1.6,
                          position: 'relative',
                          zIndex: 1
                        }}
                      >
                        "{testimonial.text}"
                      </Typography>
                      <Box
                        sx={{
                          position: 'absolute',
                          top: -8,
                          left: 12,
                          width: 24,
                          height: 24,
                          bgcolor: 'primary.main',
                          clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                          opacity: 0.8
                        }}
                      />
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Enhanced Flash Deals */}
        <Box mt={8}>
          <Paper 
            sx={{ 
              p: 4, 
              borderRadius: 4,
              background: (t) => t.palette.mode === 'light' 
                ? 'linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%)'
                : 'linear-gradient(135deg, #E53E3E 0%, #38B2AC 100%)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Background Pattern */}
            <Box
              sx={{
                position: 'absolute',
                top: -100,
                right: -100,
                width: 300,
                height: 300,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)',
                zIndex: 0
              }}
            />
            
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Stack direction="row" alignItems="center" justifyContent="center" spacing={2} mb={2}>
                <BoltIcon sx={{ fontSize: '2rem' }} />
                <Typography variant="h4" fontWeight={800}>{t('home.flashDeals')}</Typography>
              </Stack>
              
              <Typography variant="h6" textAlign="center" sx={{ opacity: 0.9, mb: 4 }}>
                {t('home.flashDealsSubtitle')}
              </Typography>
              
              <Grid container spacing={3}>
                {[
                  { title: t('deals.electronicsTitle'), discount: '30%', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400' },
                  { title: t('deals.fashionTitle'), discount: '25%', image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400' },
                  { title: t('deals.homeTitle'), discount: '20%', image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400' },
                  { title: t('deals.sportsTitle'), discount: '35%', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400' }
                ].map((deal, index) => (
                  <Grid item xs={12} sm={6} md={3} key={index}>
                    <Card 
                      component={NextLink as any} 
                      href="/categories" 
                      sx={{ 
                        borderRadius: 3, 
                        textDecoration: 'none', 
                        overflow: 'hidden',
                        position: 'relative',
                        transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': { 
                          transform: 'translateY(-8px) scale(1.05)', 
                          boxShadow: '0 20px 40px rgba(0,0,0,0.2)' 
                        } 
                      }}
                    >
                      <CardMedia 
                        component="img" 
                        height="120" 
                        image={deal.image}
                        alt={deal.title}
                        sx={{ filter: 'brightness(0.8)' }}
                      />
                      
                      {/* Discount Badge */}
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          bgcolor: '#FF4757',
                          color: 'white',
                          px: 1,
                          py: 0.5,
                          borderRadius: 2,
                          fontWeight: 700,
                          fontSize: '0.75rem'
                        }}
                      >
                        -{deal.discount}
                      </Box>
                      
                      <CardContent>
                        <Typography fontWeight={700} variant="subtitle1">
                          {deal.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {t('deals.saveUpTo')} {deal.discount} {t('deals.todayOnly')}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              
              <Box textAlign="center" mt={3}>
                <Button
                  component={NextLink}
                  href="/categories"
                  variant="contained"
                  size="large"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: 3,
                    px: 4,
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.3)',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  {t('home.shopAllDeals')}
                </Button>
              </Box>
            </Box>
          </Paper>
        </Box>

        {/* Newsletter Section */}
        <Box mt={8}>
          <Paper 
            sx={{ 
              p: 6, 
              borderRadius: 4,
              textAlign: 'center',
              background: (t) => t.palette.mode === 'light' 
                ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)'
                : 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)',
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Typography variant="h5" fontWeight={700} gutterBottom>
              {t('home.newsletter')}
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={3}>
              {t('home.newsletterSubtitle')}
            </Typography>
            
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={2} 
              justifyContent="center" 
              alignItems="center"
              sx={{ maxWidth: 500, mx: 'auto' }}
            >
              <TextField
                placeholder="Enter your email address"
                variant="outlined"
                sx={{ 
                  flex: 1,
                  '& .MuiInputBase-root': { 
                    borderRadius: 3,
                    bgcolor: 'background.paper'
                  }
                }}
              />
              <Button
                variant="contained"
                size="large"
                sx={{ 
                  px: 4,
                  borderRadius: 3,
                  minWidth: 140
                }}
              >
                {t('home.subscribe')}
              </Button>
            </Stack>
            
            <Typography variant="caption" color="text.secondary" mt={2} display="block">
              {t('home.privacyNote')}
            </Typography>
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