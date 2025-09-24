"use client";
import React, { useState, useEffect } from 'react';
import { Box, IconButton, Stack, Typography, Button, Skeleton, Chip, TextField, InputAdornment, Paper } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SearchIcon from '@mui/icons-material/Search';
import NextLink from 'next/link';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { apiGet } from '@utils/api';
import { getMainImage, hasRealImages } from '@utils/imageHelpers';

interface Product {
  _id: string;
  title: string;
  images: string[];
  price: number;
}

interface Collection {
  _id: string;
  title: string;
  description?: string;
  type: string;
  images: string[];
  price?: number;
  priceType?: string;
  location: {
    city: string;
    state: string;
    country: string;
  };
}

interface SlideItem extends Product {
  type?: 'product' | 'collection';
  location?: Collection['location'];
  priceType?: string;
}

export default function HeroSlider() {
  const [index, setIndex] = useState(0);
  const [items, setItems] = useState<SlideItem[] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useTranslation();
  const router = useRouter();

  useEffect(() => {
    let alive = true;
    
    const fetchSlideContent = async () => {
      try {
        // Fetch both products and collections
        const [products, collectionsResponse] = await Promise.all([
          apiGet<Product[]>("/products").catch(() => []),
          apiGet<{ collections: Collection[] }>("/collections").catch(() => ({ collections: [] }))
        ]);
        
        if (!alive) return;
        
        // Transform collections to slide format
        const transformedCollections: SlideItem[] = (collectionsResponse.collections || [])
          .slice(0, 2)
          .map(collection => ({
            _id: collection._id,
            title: collection.title,
            images: collection.images,
            price: collection.price || 0,
            type: 'collection' as const,
            location: collection.location,
            priceType: collection.priceType
          }));
        
        // Transform products to slide format
        const transformedProducts: SlideItem[] = (products || [])
          .slice(0, 2)
          .map(product => ({
            ...product,
            type: 'product' as const
          }));
        
        // Combine collections and products, prioritizing collections
        const slides = [...transformedCollections, ...transformedProducts].slice(0, 3);
        setItems(slides);
      } catch (error) {
        if (alive) setItems([]);
      }
    };
    
    fetchSlideContent();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!items || items.length === 0) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % items.length), 5000);
    return () => clearInterval(t);
  }, [items]);

  // Loading skeleton
  if (!items) {
    return (
      <Box sx={{ position: 'relative', height: { xs: 350, sm: 380, md: 420 }, overflow: 'hidden', mx: { xs: 1, md: 0 }, mt: 1 }}>
        <Skeleton variant="rectangular" height="100%" />
      </Box>
    );
  }

  const slides = items.length > 0 ? items : [
    { _id: 'placeholder-1', title: t('home.heroDiscoverExceptional'), images: [], price: 0, type: 'collection' as const },
    { _id: 'placeholder-2', title: t('home.heroBookStays'), images: [], price: 0, type: 'collection' as const },
    { _id: 'placeholder-3', title: t('home.heroProductsReimagined'), images: [], price: 0, type: 'product' as const },
  ];

  const current = slides[index];
  const img = getMainImage(current.images, current.type, current._id, 'hero');
  const isRealImage = hasRealImages(current.images);

  const getActionHref = () => {
    if (current._id.startsWith('placeholder')) {
      return current.type === 'collection' ? '/collections' : '/product';
    }
    return current.type === 'collection' ? `/collections/${current._id}` : `/product/${current._id}`;
  };

  const getPriceDisplay = () => {
    if (current.price <= 0) return null;
    
    if (current.type === 'collection' && current.priceType) {
      const priceTypeDisplay = current.priceType.replace('-', ' ');
      return `${t('home.heroFrom')} $${current.price.toFixed(2)} ${priceTypeDisplay}`;
    }
    return `${t('home.heroFrom')} $${current.price.toFixed(2)}`;
  };

  const getLocationDisplay = () => {
    if (current.type === 'collection' && current.location) {
      return `${current.location.city}, ${current.location.state}`;
    }
    return null;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <Box sx={{ position: 'relative', height: { xs: 350, sm: 380, md: 420 }, overflow: 'hidden', mx: { xs: 1, md: 0 }, mt: 1 }}>
      {/* Slide image */}
      <Box sx={{ 
        position: 'absolute', 
        inset: 0, 
        backgroundImage: `url(${img})`, 
        backgroundSize: 'cover', 
        backgroundPosition: 'center',
        filter: isRealImage ? 'none' : 'brightness(0.85) sepia(0.08)',
      }} />
      {/* Enhanced overlay for better text readability in both modes */}
      <Box sx={(t) => ({ 
        position: 'absolute', 
        inset: 0, 
        background: t.palette.mode === 'dark' 
          ? 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.7) 100%)'
          : 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.5) 100%)'
      })} />
      
      {/* Additional dark mode overlay for better contrast */}
      <Box sx={(t) => t.palette.mode === 'dark' && ({
        position: 'absolute', 
        inset: 0, 
        background: 'linear-gradient(45deg, rgba(0,0,0,0.2) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)',
        zIndex: 1
      })} />
      
      {/* Animated Background Elements */}
      <Box
        sx={{
          position: 'absolute',
          top: -100,
          right: -100,
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'linear-gradient(45deg, rgba(34, 197, 94, 0.1), rgba(22, 163, 74, 0.1))',
          animation: 'float 6s ease-in-out infinite',
          zIndex: 1
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -80,
          left: -80,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'linear-gradient(45deg, rgba(255, 107, 53, 0.1), rgba(247, 147, 30, 0.1))',
          animation: 'float 8s ease-in-out infinite reverse',
          zIndex: 1
        }}
      />
      
      {/* Stock Photo Indicator */}
      {!isRealImage && (
        <Chip
          label={t('home.heroStockPhoto')}
          size="small"
          sx={{
            position: 'absolute',
            top: 20,
            right: 20,
            backgroundColor: 'rgba(0,0,0,0.8)',
            color: 'white',
            fontSize: '0.7rem',
            height: 24,
            zIndex: 3,
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)'
          }}
        />
      )}

      {/* Attractive Modern Search Bar */}
      <Box sx={{ 
        position: 'absolute', 
        top: { xs: 16, sm: 20, md: 24 }, 
        left: '50%', 
        transform: 'translateX(-50%)', 
        width: { xs: '90%', sm: '85%', md: '500px' },
        zIndex: 3
      }}>
        <Paper 
          component="form" 
          onSubmit={handleSearch}
          sx={(t) => ({ 
            p: { xs: 0.5, sm: 0.8, md: 1 }, 
            background: t.palette.mode === 'dark' 
              ? 'rgba(30, 30, 30, 0.95)' 
              : 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            border: t.palette.mode === 'dark' 
              ? '2px solid rgba(255, 255, 255, 0.2)' 
              : '2px solid rgba(255, 255, 255, 0.6)',
            borderRadius: { xs: 3, sm: 4, md: 6 },
            boxShadow: t.palette.mode === 'dark' 
              ? '0 8px 32px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.2)' 
              : '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              boxShadow: t.palette.mode === 'dark' 
                ? '0 12px 40px rgba(0, 0, 0, 0.5), 0 4px 12px rgba(0, 0, 0, 0.3)' 
                : '0 12px 40px rgba(0, 0, 0, 0.18), 0 4px 12px rgba(0, 0, 0, 0.12)',
              transform: 'translateY(-2px)',
              border: '2px solid rgba(33, 150, 243, 0.3)'
            },
            '&:focus-within': {
              boxShadow: '0 16px 48px rgba(33, 150, 243, 0.25), 0 8px 24px rgba(33, 150, 243, 0.15)',
              border: '2px solid rgba(33, 150, 243, 0.6)',
              transform: 'translateY(-3px) scale(1.02)'
            }
          })}
        >
          <TextField
            fullWidth
            placeholder="Search products, collections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            variant="standard"
            InputProps={{
              disableUnderline: true,
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ 
                    color: 'primary.main', 
                    fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.6rem' },
                    filter: 'drop-shadow(0 2px 4px rgba(33, 150, 243, 0.3))'
                  }} />
                </InputAdornment>
              ),
              sx: {
                px: { xs: 1.5, sm: 2, md: 2.5 },
                py: { xs: 1, sm: 1.2, md: 1.5 },
                fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' },
                '& input': {
                  color: 'text.primary',
                  fontWeight: 500,
                  '&::placeholder': {
                    color: 'text.secondary',
                    opacity: 0.8,
                    fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' },
                    fontWeight: 400
                  }
                }
              }
            }}
          />
        </Paper>
      </Box>

      {/* Content */}
      <Stack spacing={2.5} sx={{ 
        position: 'relative', 
        height: '100%', 
        color: '#fff', 
        px: { xs: 3, sm: 4, md: 6 }, 
        py: { xs: 2.5, sm: 3, md: 4 }, 
        justifyContent: { xs: 'center', sm: 'center', md: 'center' }, 
        alignItems: { xs: 'center', sm: 'flex-start', md: 'flex-start' },
        textAlign: { xs: 'center', sm: 'left', md: 'left' },
        maxWidth: 1200,
        pt: { xs: 8, sm: 9, md: 10 },
        zIndex: 2
      }}>
        <Typography 
          variant="h1" 
          fontWeight={900}
          sx={(t) => ({ 
            fontSize: { xs: '1.6rem', sm: '2rem', md: '2.8rem' },
            textShadow: t.palette.mode === 'dark' 
              ? '2px 2px 8px rgba(0,0,0,0.9), 0 0 20px rgba(0,0,0,0.5)' 
              : '2px 2px 4px rgba(0,0,0,0.7)',
            lineHeight: 1.1,
            background: t.palette.mode === 'dark' 
              ? 'linear-gradient(45deg, #fff, #e0e0e0)' 
              : 'linear-gradient(45deg, #fff, #f0f0f0)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            maxWidth: { xs: '90%', sm: '100%', md: '100%' }
          })}
        >
          {current.title}
        </Typography>
        {getPriceDisplay() && (
          <Typography 
            variant="h3" 
            fontWeight={700}
            sx={(t) => ({ 
              fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.6rem' },
              textShadow: t.palette.mode === 'dark' 
                ? '1px 1px 6px rgba(0,0,0,0.8), 0 0 15px rgba(0,0,0,0.4)' 
                : '1px 1px 3px rgba(0,0,0,0.6)',
              color: '#FFD700',
              textAlign: { xs: 'center', sm: 'left', md: 'left' }
            })}
          >
            {getPriceDisplay()}
          </Typography>
        )}
        {getLocationDisplay() && (
          <Typography 
            variant="h5" 
            sx={(t) => ({ 
              opacity: t.palette.mode === 'dark' ? 0.9 : 0.95,
              textShadow: t.palette.mode === 'dark' 
                ? '1px 1px 4px rgba(0,0,0,0.8), 0 0 10px rgba(0,0,0,0.3)' 
                : '1px 1px 2px rgba(0,0,0,0.6)',
              fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem' },
              fontWeight: 500,
              textAlign: { xs: 'center', sm: 'left', md: 'left' }
            })}
          >
            📍 {getLocationDisplay()}
          </Typography>
        )}
        {/* Enhanced Centered Button */}
        <Box sx={{ 
          mt: { xs: 3, sm: 2.5, md: 3 },
          display: 'flex',
          justifyContent: { xs: 'center', sm: 'flex-start', md: 'flex-start' },
          width: '100%'
        }}>
          <Button
            variant="contained"
            size="large"
            component={NextLink}
            href={getActionHref()}
            sx={{
              px: { xs: 4, sm: 5, md: 6 },
              py: { xs: 1.5, sm: 1.8, md: 2 },
              fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem' },
              fontWeight: 700,
              background: 'linear-gradient(45deg, #22c55e, #16a34a)',
              boxShadow: '0 8px 25px rgba(34, 197, 94, 0.4)',
              borderRadius: { xs: 3, sm: 4, md: 5 },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              minWidth: { xs: '160px', sm: '180px', md: '200px' },
              '&:hover': {
                transform: 'translateY(-3px) scale(1.05)',
                boxShadow: '0 12px 35px rgba(34, 197, 94, 0.6)',
                background: 'linear-gradient(45deg, #16a34a, #15803d)'
              }
            }}
          >
            {current.type === 'collection' ? t('home.heroExplore') : t('home.heroShopNow')}
          </Button>
        </Box>
      </Stack>

      {/* Controls */}
      <IconButton 
        onClick={() => setIndex((index - 1 + slides.length) % slides.length)} 
        sx={(t) => ({ 
          position: 'absolute', 
          left: { xs: 4, sm: 6, md: 8 }, 
          top: '50%', 
          color: '#fff',
          backgroundColor: t.palette.mode === 'dark' 
            ? 'rgba(0,0,0,0.6)' 
            : 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(15px)',
          width: { xs: 36, sm: 44, md: 48 },
          height: { xs: 36, sm: 44, md: 48 },
          borderRadius: { xs: 2, sm: 3, md: 4 },
          border: t.palette.mode === 'dark' 
            ? '1px solid rgba(255,255,255,0.2)' 
            : 'none',
          '&:hover': {
            backgroundColor: t.palette.mode === 'dark' 
              ? 'rgba(0,0,0,0.8)' 
              : 'rgba(0,0,0,0.6)',
            transform: 'scale(1.1)',
            boxShadow: t.palette.mode === 'dark' 
              ? '0 4px 12px rgba(0,0,0,0.5)' 
              : '0 4px 12px rgba(0,0,0,0.3)'
          }
        })} 
        aria-label="Previous slide"
      >
        <ChevronLeftIcon sx={{ fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.5rem' } }} />
      </IconButton>
      <IconButton 
        onClick={() => setIndex((index + 1) % slides.length)} 
        sx={(t) => ({ 
          position: 'absolute', 
          right: { xs: 4, sm: 6, md: 8 }, 
          top: '50%', 
          color: '#fff',
          backgroundColor: t.palette.mode === 'dark' 
            ? 'rgba(0,0,0,0.6)' 
            : 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(15px)',
          width: { xs: 36, sm: 44, md: 48 },
          height: { xs: 36, sm: 44, md: 48 },
          borderRadius: { xs: 2, sm: 3, md: 4 },
          border: t.palette.mode === 'dark' 
            ? '1px solid rgba(255,255,255,0.2)' 
            : 'none',
          '&:hover': {
            backgroundColor: t.palette.mode === 'dark' 
              ? 'rgba(0,0,0,0.8)' 
              : 'rgba(0,0,0,0.6)',
            transform: 'scale(1.1)',
            boxShadow: t.palette.mode === 'dark' 
              ? '0 4px 12px rgba(0,0,0,0.5)' 
              : '0 4px 12px rgba(0,0,0,0.3)'
          }
        })} 
        aria-label="Next slide"
      >
        <ChevronRightIcon sx={{ fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.5rem' } }} />
      </IconButton>

      {/* Dots */}
      <Stack direction="row" spacing={1} sx={{ position: 'absolute', bottom: { xs: 10, sm: 12, md: 16 }, left: { xs: 12, sm: 16, md: 20 } }}>
        {slides.map((_, i) => (
          <Box 
            key={i} 
            onClick={() => setIndex(i)} 
            sx={(t) => ({ 
              width: i === index ? { xs: 20, sm: 24, md: 28 } : { xs: 8, sm: 10, md: 12 }, 
              height: { xs: 6, sm: 8, md: 10 }, 
              borderRadius: { xs: 6, sm: 8, md: 10 }, 
              bgcolor: i === index 
                ? 'primary.main' 
                : t.palette.mode === 'dark' 
                  ? 'rgba(255,255,255,0.5)' 
                  : 'rgba(255,255,255,0.7)', 
              cursor: 'pointer', 
              transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
              border: t.palette.mode === 'dark' && i !== index 
                ? '1px solid rgba(255,255,255,0.2)' 
                : 'none',
              '&:hover': {
                bgcolor: i === index 
                  ? 'primary.dark' 
                  : t.palette.mode === 'dark' 
                    ? 'rgba(255,255,255,0.8)' 
                    : 'rgba(255,255,255,0.9)',
                transform: 'scale(1.2)',
                boxShadow: t.palette.mode === 'dark' 
                  ? '0 2px 8px rgba(0,0,0,0.5)' 
                  : '0 2px 8px rgba(0,0,0,0.3)'
              }
            })} 
          />
        ))}
      </Stack>
    </Box>
  );
}