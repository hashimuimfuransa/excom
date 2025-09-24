"use client";
import React, { useRef, useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Stack,
  Avatar,
  Button,
  useTheme,
  useMediaQuery,
  Chip,
  Tooltip,
  CardMedia,
  Skeleton
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  ArrowBackIos as ArrowBackIcon,
  ArrowForwardIos as ArrowForwardIcon,
  Computer as ElectronicsIcon,
  Person as FashionIcon,
  Home as HomeIcon,
  Sports as SportsIcon,
  Book as BooksIcon,
  Star as ToysIcon,
  DirectionsCar as AutomotiveIcon,
  LocalHospital as HealthIcon,
  Restaurant as FoodIcon,
  Palette as ArtsIcon,
  Build as ToolsIcon,
  Category as OtherIcon,
  Favorite as PetsIcon,
  MusicNote as MusicIcon,
  Computer as ComputerIcon,
  Home as KitchenIcon,
  Sports as FitnessIcon,
  Person as BeautyIcon,
  School as EducationIcon,
  Work as BusinessIcon,
  Flight as TravelIcon,
  Star as GamingIcon,
  ShoppingCart as GroceryIcon,
  AccessTime as WatchesIcon,
  Phone as MobileIcon,
  Camera as CameraIcon,
  MusicNote as AudioIcon,
  Person as ClothingIcon,
  Star as OutdoorIcon,
  Person as BabyIcon,
  Sports as ESportsIcon,
  Star as JewelryIcon,
  Star as MoviesIcon,
  Favorite as WellnessIcon,
  DirectionsCar as BikeIcon,
  Star as SwimmingIcon,
  Star as GardeningIcon
} from '@mui/icons-material';
import NextLink from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

// Icon mapping
const iconComponents: { [key: string]: JSX.Element } = {
  Computer: <ElectronicsIcon />,
  Person: <FashionIcon />,
  Home: <HomeIcon />,
  Sports: <SportsIcon />,
  Book: <BooksIcon />,
  Star: <ToysIcon />,
  DirectionsCar: <AutomotiveIcon />,
  LocalHospital: <HealthIcon />,
  Restaurant: <FoodIcon />,
  Palette: <ArtsIcon />,
  Build: <ToolsIcon />,
  Category: <OtherIcon />,
  Favorite: <PetsIcon />,
  MusicNote: <MusicIcon />,
  Flight: <TravelIcon />,
  ShoppingCart: <GroceryIcon />,
  AccessTime: <WatchesIcon />,
  Phone: <MobileIcon />,
  Camera: <CameraIcon />,
  School: <EducationIcon />,
  Work: <BusinessIcon />
};

interface Category {
  _id?: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  bgColor: string;
  badge: string;
  image: string;
  count: number;
  isActive?: boolean;
  sortOrder?: number;
}


// API base URL
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000/api';

// Mock categories as fallback
const mockCategories: Category[] = [
  { 
    _id: '1',
    name: 'Electronics', 
    icon: 'Computer', 
    color: '#2196F3', 
    bgColor: 'rgba(33, 150, 243, 0.1)',
    slug: 'electronics',
    count: 542,
    badge: '🔥 Hot',
    image: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=400&h=300&fit=crop&crop=center',
    sortOrder: 1
  },
  { 
    _id: '2',
    name: 'Fashion', 
    icon: 'Person', 
    color: '#E91E63', 
    bgColor: 'rgba(233, 30, 99, 0.1)',
    slug: 'fashion',
    count: 387,
    badge: '✨ Trending',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop&crop=center',
    sortOrder: 2
  },
  { 
    _id: '3',
    name: 'Gaming', 
    icon: 'Star', 
    color: '#9C27B0', 
    bgColor: 'rgba(156, 39, 176, 0.1)',
    slug: 'gaming',
    count: 678,
    badge: '🎮 Epic',
    image: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400&h=300&fit=crop&crop=center',
    sortOrder: 3
  },
  { 
    _id: '4',
    name: 'Mobile & Tech', 
    icon: 'Phone', 
    color: '#FF5722', 
    bgColor: 'rgba(255, 87, 34, 0.1)',
    slug: 'mobile',
    count: 445,
    badge: '📱 Smart',
    image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=300&fit=crop&crop=center',
    sortOrder: 4
  },
  { 
    _id: '5',
    name: 'Home & Garden', 
    icon: 'Home', 
    color: '#4CAF50', 
    bgColor: 'rgba(76, 175, 80, 0.1)',
    slug: 'home',
    count: 298,
    badge: '🏡 Cozy',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop&crop=center',
    sortOrder: 5
  },
  { 
    _id: '6',
    name: 'Sports & Fitness', 
    icon: 'Sports', 
    color: '#FF9800', 
    bgColor: 'rgba(255, 152, 0, 0.1)',
    slug: 'sports',
    count: 234,
    badge: '⚡ Active',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&crop=center',
    sortOrder: 6
  },
  { 
    _id: '7',
    name: 'Books & Media', 
    icon: 'Book', 
    color: '#795548', 
    bgColor: 'rgba(121, 85, 72, 0.1)',
    slug: 'books',
    count: 189,
    badge: '📚 Wisdom',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&crop=center',
    sortOrder: 7
  },
  { 
    _id: '8',
    name: 'Beauty & Care', 
    icon: 'Person', 
    color: '#E91E63', 
    bgColor: 'rgba(233, 30, 99, 0.1)',
    slug: 'beauty',
    count: 312,
    badge: '💄 Glam',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=300&fit=crop&crop=center',
    sortOrder: 8
  },
  { 
    _id: '9',
    name: 'Music & Audio', 
    icon: 'MusicNote', 
    color: '#9C27B0', 
    bgColor: 'rgba(156, 39, 176, 0.1)',
    slug: 'audio',
    count: 167,
    badge: '🎵 Sound',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop&crop=center',
    sortOrder: 9
  },
  { 
    _id: '10',
    name: 'Computers', 
    icon: 'Computer', 
    color: '#607D8B', 
    bgColor: 'rgba(96, 125, 139, 0.1)',
    slug: 'computers',
    count: 89,
    badge: '💻 Tech',
    image: 'https://images.unsplash.com/photo-1547082299-de196ea013d6?w=400&h=300&fit=crop&crop=center',
    sortOrder: 10
  },
  { 
    _id: '11',
    name: 'Kitchen & Dining', 
    icon: 'Home', 
    color: '#FF5722', 
    bgColor: 'rgba(255, 87, 34, 0.1)',
    slug: 'kitchen',
    count: 203,
    badge: '🍳 Chef',
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop&crop=center',
    sortOrder: 11
  },
  { 
    _id: '12',
    name: 'Pets & Animals', 
    icon: 'Favorite', 
    color: '#8BC34A', 
    bgColor: 'rgba(139, 195, 74, 0.1)',
    slug: 'pets',
    count: 134,
    badge: '🐕 Cute',
    image: 'https://images.unsplash.com/photo-1415369629372-26f2fe60c467?w=400&h=300&fit=crop&crop=center',
    sortOrder: 12
  },
  { 
    _id: '13',
    name: 'Toys & Games', 
    icon: 'Star', 
    color: '#F44336', 
    bgColor: 'rgba(244, 67, 54, 0.1)',
    slug: 'toys',
    count: 156,
    badge: '🎮 Fun',
    image: 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=400&h=300&fit=crop&crop=center',
    sortOrder: 13
  },
  { 
    _id: '14',
    name: 'Automotive', 
    icon: 'DirectionsCar', 
    color: '#607D8B', 
    bgColor: 'rgba(96, 125, 139, 0.1)',
    slug: 'automotive',
    count: 143,
    badge: '🚗 Drive',
    image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&h=300&fit=crop&crop=center',
    sortOrder: 14
  },
  { 
    _id: '15',
    name: 'Health & Wellness', 
    icon: 'LocalHospital', 
    color: '#00BCD4', 
    bgColor: 'rgba(0, 188, 212, 0.1)',
    slug: 'health',
    count: 172,
    badge: '💊 Wellness',
    image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop&crop=center',
    sortOrder: 15
  }
];

// Create an infinite looping array
const getInfiniteCategories = (categories: Category[]) => {
  if (categories.length === 0) return [];
  return [...categories, ...categories, ...categories];
};

export default function CategorySlider() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [isHovered, setIsHovered] = useState(false);
  const [scrollDirection, setScrollDirection] = useState<'right' | 'left'>('right');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation('common');

  // Fetch categories from API with fallback to mock data
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/categories`);
        const data = await response.json();
        
        if (data.success && data.data && data.data.length > 0) {
          setCategories(data.data);
        } else {
          // Use mock categories as fallback
          setCategories(mockCategories);
        }
      } catch (error) {
        console.error('Error fetching categories, using fallback data:', error);
        // Use mock categories as fallback when API fails
        setCategories(mockCategories);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);
  
  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    
    const scrollAmount = isMobile ? 200 : 320;
    const scrollLeft = scrollRef.current.scrollLeft;
    const newScrollLeft = direction === 'left' 
      ? scrollLeft - scrollAmount 
      : scrollLeft + scrollAmount;
    
    scrollRef.current.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    });
  };

  // Auto-scroll animation with smooth back-and-forth movement
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isHovered && scrollRef.current) {
        const container = scrollRef.current;
        const scrollSpeed = 1.5; // Smooth continuous scroll
        const currentScrollLeft = container.scrollLeft;
        const maxScrollLeft = container.scrollWidth - container.clientWidth;
        
        // Determine new scroll position based on current direction
        let newScrollLeft;
        if (scrollDirection === 'right') {
          newScrollLeft = currentScrollLeft + scrollSpeed;
          
          // Check if we've reached the end, then reverse direction
          if (newScrollLeft >= maxScrollLeft - 5) { // Small buffer to avoid edge cases
            setScrollDirection('left');
            newScrollLeft = maxScrollLeft;
          }
        } else {
          newScrollLeft = currentScrollLeft - scrollSpeed;
          
          // Check if we've reached the beginning, then reverse direction
          if (newScrollLeft <= 5) { // Small buffer to avoid edge cases
            setScrollDirection('right');
            newScrollLeft = 0;
          }
        }
        
        // Apply the scroll smoothly
        container.scrollTo({
          left: newScrollLeft,
          behavior: 'auto' // No built-in animation to maintain smooth custom animation
        });
      }
    }, 20); // ~50fps for smooth animation

    return () => clearInterval(interval);
  }, [isHovered, scrollDirection]);

  // Use regular categories for back-and-forth scrolling
  const displayCategories = loading 
    ? Array(10).fill(null).map((_, i) => ({ 
        _id: `skeleton-${i}`,
        name: '',
        slug: '',
        icon: '',
        color: '#ccc',
        bgColor: 'rgba(204, 204, 204, 0.1)',
        badge: '',
        image: '',
        count: 0
      }))
    : getInfiniteCategories(categories);

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Minimal Category Header */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
          <Stack direction="row" alignItems="center" spacing={2}>
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
            href="/categories"
            variant="contained"
            size="small"
            sx={{ 
              borderRadius: 1,
              background: 'linear-gradient(45deg, #22c55e, #16a34a)',
              fontWeight: 600,
              px: 3,
              py: 1,
              fontSize: '0.8rem',
              textTransform: 'none',
              display: { xs: 'none', sm: 'flex' },
              '&:hover': {
                background: 'linear-gradient(45deg, #16a34a, #15803d)'
              }
            }}
          >
            {t('actions.viewAll')}
          </Button>
        </Stack>
      </Box>

      {/* Scroll Container */}
      <Box sx={{ position: 'relative' }}>
        {/* Navigation Buttons */}
        <IconButton
          onClick={() => scroll('left')}
          sx={{
            position: 'absolute',
            left: -16,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 2,
            bgcolor: 'background.paper',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: { xs: 'none', md: 'flex' },
            '&:hover': {
              bgcolor: 'background.paper',
              boxShadow: '0 6px 20px rgba(0,0,0,0.2)'
            }
          }}
        >
          <ArrowBackIcon />
        </IconButton>
        
        <IconButton
          onClick={() => scroll('right')}
          sx={{
            position: 'absolute',
            right: -16,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 2,
            bgcolor: 'background.paper',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: { xs: 'none', md: 'flex' },
            '&:hover': {
              bgcolor: 'background.paper',
              boxShadow: '0 6px 20px rgba(0,0,0,0.2)'
            }
          }}
        >
          <ArrowForwardIcon />
        </IconButton>

        {/* Categories Slider with Infinite Scroll */}
        <Box
          ref={scrollRef}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          sx={{
            display: 'flex',
            gap: 2,
            overflowX: 'auto',
            scrollBehavior: 'smooth',
            pb: 2,
            '&::-webkit-scrollbar': {
              height: 8,
            },
            '&::-webkit-scrollbar-track': {
              bgcolor: 'grey.100',
              borderRadius: 4,
            },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: 'grey.400',
              borderRadius: 4,
              '&:hover': {
                bgcolor: 'grey.600',
              },
            },
          }}
        >
          <AnimatePresence>
            {displayCategories.map((category, index) => (
              <motion.div
                key={`${category.name}-${index}`}
                initial={{ opacity: 0, x: 100, rotateY: 90 }}
                animate={{ opacity: 1, x: 0, rotateY: 0 }}
                exit={{ opacity: 0, x: -100, rotateY: -90 }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.1,
                  type: "spring",
                  stiffness: 100
                }}
                whileHover={{
                  scale: 1.05,
                  y: -8,
                  rotateZ: 2,
                  transition: { duration: 0.2 }
                }}
                whileTap={{ scale: 0.95 }}
              >
                <Tooltip title={`Discover ${category.count} amazing ${category.name.toLowerCase()} items!`}>
                  <Card
                    component={NextLink}
                    href={`/categories/${category.slug}`}
                    sx={{
                      minWidth: { xs: 180, md: 240 },
                      height: 280,
                      borderRadius: 4,
                      textDecoration: 'none',
                      position: 'relative',
                      cursor: 'pointer',
                      border: '2px solid transparent',
                      overflow: 'hidden',
                      background: `linear-gradient(135deg, ${category.color}08, ${category.color}15)`,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        borderColor: category.color,
                        boxShadow: `0 8px 32px ${category.color}40`,
                        '& .category-image': {
                          transform: 'scale(1.1)',
                          filter: 'brightness(1.1) saturate(1.2)'
                        },
                        '& .category-overlay': {
                          opacity: 0.7
                        },
                        '& .category-icon': {
                          transform: 'scale(1.1) rotate(10deg)',
                          bgcolor: category.color,
                          color: 'white',
                          boxShadow: `0 4px 20px ${category.color}60`
                        },
                        '& .count-chip': {
                          transform: 'scale(1.1)',
                          bgcolor: category.color,
                          color: 'white'
                        }
                      }
                    }}
                  >
                    {/* Background Image */}
                    {loading ? (
                      <Skeleton variant="rectangular" width="100%" height={120} />
                    ) : (
                      <CardMedia
                        className="category-image"
                        component="img"
                        height="120"
                        image={category.image}
                        alt={category.name}
                        sx={{
                          transition: 'all 0.3s ease',
                          objectFit: 'cover'
                        }}
                      />
                    )}

                    {/* Gradient Overlay */}
                    <Box
                      className="category-overlay"
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 120,
                        background: `linear-gradient(45deg, ${category.color}60, transparent 70%)`,
                        opacity: 0.3,
                        transition: 'all 0.3s ease',
                        zIndex: 1
                      }}
                    />

                    {/* Badge */}
                    {!loading && (
                      <motion.div
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Chip
                          label={category.badge}
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: 8,
                            left: 8,
                            bgcolor: `${category.color}20`,
                            color: category.color,
                            fontSize: '0.7rem',
                            height: 24,
                            fontWeight: 700,
                            border: `1px solid ${category.color}40`,
                            zIndex: 2,
                            backdropFilter: 'blur(8px)'
                          }}
                        />
                      </motion.div>
                    )}

                    <CardContent sx={{ 
                      textAlign: 'center', 
                      height: '160px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      position: 'relative',
                      pt: 2
                    }}>
                      {/* Animated Background Orbs */}
                      <motion.div
                        animate={{
                          scale: [1, 1.2, 1],
                          rotate: [0, 360],
                          opacity: [0.3, 0.6, 0.3]
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        style={{
                          position: 'absolute',
                          top: -10,
                          right: -10,
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          background: `radial-gradient(circle, ${category.color}40, transparent)`,
                          zIndex: 0
                        }}
                      />
                      
                      {/* Icon */}
                      <Avatar
                        className="category-icon"
                        sx={{
                          bgcolor: `${category.color}25`,
                          color: category.color,
                          width: 64,
                          height: 64,
                          mb: 2,
                          transition: 'all 0.4s ease',
                          zIndex: 1,
                          border: `3px solid ${category.color}30`,
                          fontSize: '2rem'
                        }}
                      >
                        {loading ? (
                          <Skeleton variant="circular" width={64} height={64} />
                        ) : (
                          iconComponents[category.icon] || <OtherIcon />
                        )}
                      </Avatar>
                      
                      <Typography
                        variant="subtitle1"
                        fontWeight={700}
                        sx={{
                          zIndex: 1,
                          textAlign: 'center',
                          lineHeight: 1.2,
                          mb: 1,
                          fontSize: '0.95rem'
                        }}
                      >
                        {loading ? (
                          <Skeleton variant="text" width={100} height={24} />
                        ) : (
                          category.name
                        )}
                      </Typography>

                      {/* Item Count Chip */}
                      {loading ? (
                        <Skeleton variant="rectangular" width={60} height={18} sx={{ borderRadius: 2 }} />
                      ) : (
                        <Chip
                          className="count-chip"
                          label={`${category.count}`}
                          size="small"
                          sx={{
                            bgcolor: `${category.color}15`,
                            color: category.color,
                            fontWeight: 600,
                            fontSize: '0.65rem',
                            height: 18,
                            transition: 'all 0.3s ease'
                          }}
                        />
                      )}
                    </CardContent>
                  </Card>
                </Tooltip>
              </motion.div>
            ))}
          </AnimatePresence>
        </Box>
      </Box>

      {/* Mobile View All Button */}
      <Box sx={{ display: { xs: 'block', sm: 'none' }, textAlign: 'center', mt: 2 }}>
        <Button
          component={NextLink}
          href="/categories"
          variant="outlined"
          fullWidth
          sx={{ borderRadius: 2 }}
        >
          {t('actions.viewAll')} {t('categories.title')}
        </Button>
      </Box>
    </Box>
  );
}