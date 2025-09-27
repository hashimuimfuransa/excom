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
          apiGet<{products: Product[], pagination: any}>("/products").then(response => response?.products || []).catch(() => []),
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
    <Box sx={{ 
      position: 'relative', 
      height: { xs: 400, sm: 450, md: 500 }, 
      overflow: 'hidden', 
      mx: { xs: 1, md: 0 }, 
      mt: 1,
      borderRadius: { xs: 2, md: 4 },
      boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
    }}>
      {/* Slide image */}
      <Box sx={{ 
        position: 'absolute', 
        inset: 0, 
        backgroundImage: `url(${img})`, 
        backgroundSize: 'cover', 
        backgroundPosition: 'center',
        filter: isRealImage ? 'none' : 'brightness(0.85) sepia(0.08)',
        transition: 'all 0.8s ease-in-out'
      }} />
      
      {/* Modern gradient overlay */}
      <Box sx={{ 
        position: 'absolute', 
        inset: 0, 
        background: 'linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.6) 100%)'
      }} />
      
      {/* Additional modern overlay */}
      <Box sx={{
        position: 'absolute', 
        inset: 0, 
        background: 'linear-gradient(45deg, rgba(255,107,53,0.1) 0%, transparent 50%, rgba(34,197,94,0.1) 100%)',
        zIndex: 1
      }} />
      
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

      {/* Amazon-like Search Bar */}
      <Box sx={{ 
        position: 'absolute', 
        top: { xs: 20, sm: 24, md: 32 }, 
        left: '50%', 
        transform: 'translateX(-50%)', 
        width: { xs: '90%', sm: '85%', md: '600px' },
        zIndex: 3
      }}>
        <Paper 
          component="form" 
          onSubmit={handleSearch}
          sx={{ 
            p: { xs: 0.5, sm: 0.8, md: 1 }, 
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            border: '2px solid rgba(255, 255, 255, 0.8)',
            borderRadius: { xs: 3, sm: 4, md: 6 },
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              boxShadow: '0 16px 50px rgba(0, 0, 0, 0.2), 0 6px 16px rgba(0, 0, 0, 0.15)',
              transform: 'translateY(-3px)',
              border: '2px solid rgba(255, 107, 53, 0.4)'
            },
            '&:focus-within': {
              boxShadow: '0 20px 60px rgba(255, 107, 53, 0.3), 0 8px 24px rgba(255, 107, 53, 0.2)',
              border: '2px solid rgba(255, 107, 53, 0.7)',
              transform: 'translateY(-4px) scale(1.02)'
            }
          }}
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
                    color: '#FF6B35', 
                    fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.6rem' },
                    filter: 'drop-shadow(0 2px 4px rgba(255, 107, 53, 0.4))'
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

      {/* Amazon-like Content */}
      <Stack spacing={3} sx={{ 
        position: 'relative', 
        height: '100%', 
        color: '#fff', 
        px: { xs: 4, sm: 6, md: 8 }, 
        py: { xs: 3, sm: 4, md: 5 }, 
        justifyContent: { xs: 'center', sm: 'center', md: 'center' }, 
        alignItems: { xs: 'center', sm: 'flex-start', md: 'flex-start' },
        textAlign: { xs: 'center', sm: 'left', md: 'left' },
        maxWidth: 1200,
        pt: { xs: 10, sm: 12, md: 14 },
        zIndex: 2
      }}>
        <Typography 
          variant="h1" 
          fontWeight={900}
          sx={{ 
            fontSize: { xs: '2rem', sm: '2.5rem', md: '3.5rem' },
            textShadow: '3px 3px 12px rgba(0,0,0,0.8), 0 0 30px rgba(0,0,0,0.6)',
            lineHeight: 1.1,
            background: 'linear-gradient(45deg, #fff, #f0f0f0)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            maxWidth: { xs: '90%', sm: '100%', md: '100%' },
            letterSpacing: '-0.02em'
          }}
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
        {/* Amazon-like CTA Button */}
        <Box sx={{ 
          mt: { xs: 4, sm: 3, md: 4 },
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
              px: { xs: 6, sm: 8, md: 10 },
              py: { xs: 2, sm: 2.5, md: 3 },
              fontSize: { xs: '1.1rem', sm: '1.2rem', md: '1.4rem' },
              fontWeight: 800,
              background: 'linear-gradient(45deg, #FF6B35, #F7931E)',
              boxShadow: '0 12px 35px rgba(255, 107, 53, 0.5)',
              borderRadius: { xs: 4, sm: 5, md: 6 },
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              minWidth: { xs: '200px', sm: '220px', md: '250px' },
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              border: '3px solid rgba(255,255,255,0.2)',
              '&:hover': {
                transform: 'translateY(-4px) scale(1.05)',
                boxShadow: '0 16px 45px rgba(255, 107, 53, 0.7)',
                background: 'linear-gradient(45deg, #F7931E, #FF8C42)',
                border: '3px solid rgba(255,255,255,0.4)'
              }
            }}
          >
            {current.type === 'collection' ? 'Explore Now' : 'Shop Now'}
          </Button>
        </Box>
      </Stack>

      {/* Amazon-like Controls */}
      <IconButton 
        onClick={() => setIndex((index - 1 + slides.length) % slides.length)} 
        sx={{ 
          position: 'absolute', 
          left: { xs: 8, sm: 12, md: 16 }, 
          top: '50%', 
          color: '#fff',
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(20px)',
          width: { xs: 48, sm: 56, md: 64 },
          height: { xs: 48, sm: 56, md: 64 },
          borderRadius: '50%',
          border: '2px solid rgba(255,255,255,0.3)',
          boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
          '&:hover': {
            backgroundColor: 'rgba(0,0,0,0.8)',
            transform: 'scale(1.1)',
            boxShadow: '0 12px 35px rgba(0,0,0,0.5)',
            border: '2px solid rgba(255,107,53,0.6)'
          }
        }} 
        aria-label="Previous slide"
      >
        <ChevronLeftIcon sx={{ fontSize: { xs: '1.4rem', sm: '1.6rem', md: '1.8rem' } }} />
      </IconButton>
      <IconButton 
        onClick={() => setIndex((index + 1) % slides.length)} 
        sx={{ 
          position: 'absolute', 
          right: { xs: 8, sm: 12, md: 16 }, 
          top: '50%', 
          color: '#fff',
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(20px)',
          width: { xs: 48, sm: 56, md: 64 },
          height: { xs: 48, sm: 56, md: 64 },
          borderRadius: '50%',
          border: '2px solid rgba(255,255,255,0.3)',
          boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
          '&:hover': {
            backgroundColor: 'rgba(0,0,0,0.8)',
            transform: 'scale(1.1)',
            boxShadow: '0 12px 35px rgba(0,0,0,0.5)',
            border: '2px solid rgba(255,107,53,0.6)'
          }
        }} 
        aria-label="Next slide"
      >
        <ChevronRightIcon sx={{ fontSize: { xs: '1.4rem', sm: '1.6rem', md: '1.8rem' } }} />
      </IconButton>

      {/* Amazon-like Dots */}
      <Stack direction="row" spacing={2} sx={{ position: 'absolute', bottom: { xs: 16, sm: 20, md: 24 }, left: '50%', transform: 'translateX(-50%)' }}>
        {slides.map((_, i) => (
          <Box 
            key={i} 
            onClick={() => setIndex(i)} 
            sx={{ 
              width: i === index ? { xs: 24, sm: 28, md: 32 } : { xs: 12, sm: 14, md: 16 }, 
              height: { xs: 8, sm: 10, md: 12 }, 
              borderRadius: { xs: 8, sm: 10, md: 12 }, 
              bgcolor: i === index 
                ? '#FF6B35' 
                : 'rgba(255,255,255,0.6)', 
              cursor: 'pointer', 
              transition: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)',
              border: i !== index ? '1px solid rgba(255,255,255,0.3)' : 'none',
              boxShadow: i === index ? '0 4px 12px rgba(255,107,53,0.4)' : 'none',
              '&:hover': {
                bgcolor: i === index 
                  ? '#F7931E' 
                  : 'rgba(255,255,255,0.8)',
                transform: 'scale(1.2)',
                boxShadow: i === index 
                  ? '0 6px 16px rgba(255,107,53,0.6)' 
                  : '0 4px 12px rgba(255,255,255,0.3)'
              }
            }} 
          />
        ))}
      </Stack>
    </Box>
  );
}