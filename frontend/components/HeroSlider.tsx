"use client";
import React, { useState, useEffect } from 'react';
import { Box, IconButton, Stack, Typography, Button, Skeleton, Chip } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import NextLink from 'next/link';
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
      <Box sx={{ position: 'relative', height: { xs: 260, md: 360 }, overflow: 'hidden', borderRadius: 3, mx: { xs: 2, md: 0 }, mt: 2 }}>
        <Skeleton variant="rectangular" height="100%" sx={{ borderRadius: 3 }} />
      </Box>
    );
  }

  const slides = items.length > 0 ? items : [
    { _id: 'placeholder-1', title: 'Discover exceptional collections', images: [], price: 0, type: 'collection' as const },
    { _id: 'placeholder-2', title: 'Book stays that inspire', images: [], price: 0, type: 'collection' as const },
    { _id: 'placeholder-3', title: 'Products reimagined', images: [], price: 0, type: 'product' as const },
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
      return `From $${current.price.toFixed(2)} ${priceTypeDisplay}`;
    }
    return `From $${current.price.toFixed(2)}`;
  };

  const getLocationDisplay = () => {
    if (current.type === 'collection' && current.location) {
      return `${current.location.city}, ${current.location.state}`;
    }
    return null;
  };

  return (
    <Box sx={{ position: 'relative', height: { xs: 260, md: 420 }, overflow: 'hidden', borderRadius: 3, mx: { xs: 2, md: 0 }, mt: 2 }}>
      {/* Slide image */}
      <Box sx={{ 
        position: 'absolute', 
        inset: 0, 
        backgroundImage: `url(${img})`, 
        backgroundSize: 'cover', 
        backgroundPosition: 'center',
        filter: isRealImage ? 'none' : 'brightness(0.85) sepia(0.08)',
      }} />
      {/* Overlay adapts to theme */}
      <Box sx={(t) => ({ position: 'absolute', inset: 0, bgcolor: t.palette.mode === 'dark' ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.30)' })} />
      
      {/* Stock Photo Indicator */}
      {!isRealImage && (
        <Chip
          label="Stock Photo"
          size="small"
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            backgroundColor: 'rgba(0,0,0,0.7)',
            color: 'white',
            fontSize: '0.7rem',
            height: 20,
            zIndex: 1
          }}
        />
      )}

      {/* Content */}
      <Stack spacing={1.5} sx={{ position: 'relative', height: '100%', color: '#fff', px: { xs: 2, md: 6 }, py: { xs: 2, md: 6 }, justifyContent: 'center', maxWidth: 980 }}>
        <Typography variant="h3" fontWeight={900}>{current.title}</Typography>
        {getPriceDisplay() && (
          <Typography variant="h6" fontWeight={700}>{getPriceDisplay()}</Typography>
        )}
        {getLocationDisplay() && (
          <Typography variant="body1" sx={{ opacity: 0.9 }}>📍 {getLocationDisplay()}</Typography>
        )}
        <Stack direction="row" spacing={1.5} mt={1}>
          <Button
            variant="contained"
            color="primary"
            component={NextLink}
            href={getActionHref()}
          >
            {current.type === 'collection' ? 'Explore' : 'Shop Now'}
          </Button>
          <Button variant="outlined" color="inherit" component={NextLink} href={current.type === 'collection' ? '/collections' : '/product'}>
            {current.type === 'collection' ? 'Browse Collections' : 'Browse All'}
          </Button>
        </Stack>
      </Stack>

      {/* Controls */}
      <IconButton onClick={() => setIndex((index - 1 + slides.length) % slides.length)} sx={{ position: 'absolute', left: 8, top: '50%', color: '#fff' }} aria-label="Previous slide"><ChevronLeftIcon /></IconButton>
      <IconButton onClick={() => setIndex((index + 1) % slides.length)} sx={{ position: 'absolute', right: 8, top: '50%', color: '#fff' }} aria-label="Next slide"><ChevronRightIcon /></IconButton>

      {/* Dots */}
      <Stack direction="row" spacing={1} sx={{ position: 'absolute', bottom: 10, left: 16 }}>
        {slides.map((_, i) => (
          <Box key={i} onClick={() => setIndex(i)} sx={{ width: i === index ? 22 : 10, height: 8, borderRadius: 8, bgcolor: i === index ? 'primary.main' : 'rgba(255,255,255,0.7)', cursor: 'pointer', transition: 'all 200ms' }} />
        ))}
      </Stack>
    </Box>
  );
}