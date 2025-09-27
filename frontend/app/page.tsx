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
  Fade,
  Zoom,
  LinearProgress,
  Badge,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Divider,
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
import ComputerIcon from '@mui/icons-material/Computer';
import PhoneIcon from '@mui/icons-material/Phone';
import HomeIcon from '@mui/icons-material/Home';
import SportsIcon from '@mui/icons-material/Sports';
import BookIcon from '@mui/icons-material/Book';
import ToysIcon from '@mui/icons-material/Toys';
import HealthIcon from '@mui/icons-material/HealthAndSafety';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import PaletteIcon from '@mui/icons-material/Palette';
import CategoryIcon from '@mui/icons-material/Category';
import FavoriteIcon from '@mui/icons-material/Favorite';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import DiamondIcon from '@mui/icons-material/Diamond';
import RocketIcon from '@mui/icons-material/Rocket';
import GiftIcon from '@mui/icons-material/Redeem';
import TimerIcon from '@mui/icons-material/Timer';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import CasinoIcon from '@mui/icons-material/Casino';
import ConfettiIcon from '@mui/icons-material/Celebration';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import PsychologyIcon from '@mui/icons-material/Psychology';
import SpeedIcon from '@mui/icons-material/Speed';
import EmailIcon from '@mui/icons-material/Email';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SecurityIcon from '@mui/icons-material/Security';
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

interface GameStats {
  level: number;
  xp: number;
  xpToNext: number;
  coins: number;
  gems: number;
  streak: number;
  achievements: string[];
  dailyTasks: DailyTask[];
}

interface DailyTask {
  id: string;
  title: string;
  description: string;
  reward: number;
  type: 'xp' | 'coins' | 'gems';
  completed: boolean;
  progress: number;
  maxProgress: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlocked: boolean;
  reward: number;
}

// Amazon-like category data with high-quality images
const amazonCategories = [
  {
    id: 'electronics',
    name: 'Electronics',
    icon: <ComputerIcon />,
    color: '#2196F3',
    bgColor: 'rgba(33, 150, 243, 0.1)',
    image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=300&fit=crop&crop=center',
    description: 'Latest gadgets & devices',
    count: 1247,
    badge: '🔥 Hot',
    subcategories: [
      { name: 'Smartphones', count: 234, icon: '📱' },
      { name: 'Laptops', count: 189, icon: '💻' },
      { name: 'Audio', count: 156, icon: '🎧' },
      { name: 'Cameras', count: 98, icon: '📷' },
      { name: 'Gaming', count: 145, icon: '🎮' },
      { name: 'Smart Home', count: 89, icon: '🏠' }
    ]
  },
  {
    id: 'fashion',
    name: 'Fashion',
    icon: <LocalMallIcon />,
    color: '#E91E63',
    bgColor: 'rgba(233, 30, 99, 0.1)',
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=300&fit=crop&crop=center',
    description: 'Trendy clothing & accessories',
    count: 892,
    badge: '✨ New',
    subcategories: [
      { name: 'Women\'s Clothing', count: 345, icon: '👗' },
      { name: 'Men\'s Clothing', count: 234, icon: '👔' },
      { name: 'Shoes', count: 189, icon: '👟' },
      { name: 'Accessories', count: 156, icon: '👜' },
      { name: 'Jewelry', count: 98, icon: '💍' },
      { name: 'Watches', count: 67, icon: '⌚' }
    ]
  },
  {
    id: 'home',
    name: 'Home & Garden',
    icon: <HomeIcon />,
    color: '#4CAF50',
    bgColor: 'rgba(76, 175, 80, 0.1)',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop&crop=center',
    description: 'Everything for your home',
    count: 654,
    badge: '🏡 Cozy',
    subcategories: [
      { name: 'Furniture', count: 189, icon: '🪑' },
      { name: 'Decor', count: 156, icon: '🖼️' },
      { name: 'Kitchen', count: 134, icon: '🍳' },
      { name: 'Bedding', count: 98, icon: '🛏️' },
      { name: 'Garden', count: 67, icon: '🌱' },
      { name: 'Lighting', count: 45, icon: '💡' }
    ]
  },
  {
    id: 'sports',
    name: 'Sports & Fitness',
    icon: <SportsIcon />,
    color: '#FF9800',
    bgColor: 'rgba(255, 152, 0, 0.1)',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&crop=center',
    description: 'Sports equipment & gear',
    count: 423,
    badge: '⚡ Active',
    subcategories: [
      { name: 'Fitness Equipment', count: 123, icon: '🏋️' },
      { name: 'Outdoor Gear', count: 98, icon: '🏔️' },
      { name: 'Team Sports', count: 76, icon: '⚽' },
      { name: 'Water Sports', count: 54, icon: '🏄' },
      { name: 'Winter Sports', count: 43, icon: '⛷️' },
      { name: 'Athletic Wear', count: 67, icon: '👕' }
    ]
  },
  {
    id: 'books',
    name: 'Books & Media',
    icon: <BookIcon />,
    color: '#795548',
    bgColor: 'rgba(121, 85, 72, 0.1)',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&crop=center',
    description: 'Books & educational materials',
    count: 312,
    badge: '📚 Wisdom',
    subcategories: [
      { name: 'Books', count: 145, icon: '📖' },
      { name: 'Movies & TV', count: 98, icon: '🎬' },
      { name: 'Music', count: 67, icon: '🎵' },
      { name: 'Magazines', count: 45, icon: '📰' },
      { name: 'Audiobooks', count: 34, icon: '🎧' },
      { name: 'E-books', count: 23, icon: '📱' }
    ]
  },
  {
    id: 'toys',
    name: 'Toys & Games',
    icon: <ToysIcon />,
    color: '#F44336',
    bgColor: 'rgba(244, 67, 54, 0.1)',
    image: 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=400&h=300&fit=crop&crop=center',
    description: 'Fun toys for all ages',
    count: 567,
    badge: '🎮 Fun',
    subcategories: [
      { name: 'Action Figures', count: 123, icon: '🤖' },
      { name: 'Board Games', count: 98, icon: '🎲' },
      { name: 'Educational Toys', count: 89, icon: '🧩' },
      { name: 'Outdoor Toys', count: 76, icon: '🚲' },
      { name: 'Video Games', count: 67, icon: '🎮' },
      { name: 'Arts & Crafts', count: 54, icon: '🎨' }
    ]
  },
  {
    id: 'automotive',
    name: 'Automotive',
    icon: <DirectionsCarIcon />,
    color: '#607D8B',
    bgColor: 'rgba(96, 125, 139, 0.1)',
    image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&h=300&fit=crop&crop=center',
    description: 'Car parts & accessories',
    count: 234,
    badge: '🚗 Drive',
    subcategories: [
      { name: 'Car Parts', count: 89, icon: '🔧' },
      { name: 'Accessories', count: 67, icon: '🎵' },
      { name: 'Tools', count: 45, icon: '🛠️' },
      { name: 'Maintenance', count: 34, icon: '🛢️' },
      { name: 'Electronics', count: 23, icon: '📱' },
      { name: 'Interior', count: 18, icon: '🪑' }
    ]
  },
  {
    id: 'health',
    name: 'Health & Wellness',
    icon: <HealthIcon />,
    color: '#00BCD4',
    bgColor: 'rgba(0, 188, 212, 0.1)',
    image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop&crop=center',
    description: 'Health products & supplements',
    count: 189,
    badge: '💊 Wellness',
    subcategories: [
      { name: 'Supplements', count: 67, icon: '💊' },
      { name: 'Skincare', count: 45, icon: '🧴' },
      { name: 'Fitness', count: 34, icon: '🏃' },
      { name: 'Medical', count: 23, icon: '🩺' },
      { name: 'Personal Care', count: 18, icon: '🛁' },
      { name: 'Wellness', count: 12, icon: '🧘' }
    ]
  },
  {
    id: 'mobile',
    name: 'Mobile & Tech',
    icon: <PhoneIcon />,
    color: '#FF5722',
    bgColor: 'rgba(255, 87, 34, 0.1)',
    image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=300&fit=crop&crop=center',
    description: 'Smartphones & tablets',
    count: 445,
    badge: '📱 Smart',
    subcategories: [
      { name: 'Smartphones', count: 189, icon: '📱' },
      { name: 'Cases & Covers', count: 123, icon: '📱' },
      { name: 'Chargers', count: 89, icon: '🔌' },
      { name: 'Headphones', count: 67, icon: '🎧' },
      { name: 'Smartwatches', count: 45, icon: '⌚' },
      { name: 'Tablets', count: 34, icon: '📱' }
    ]
  },
  {
    id: 'music',
    name: 'Music & Audio',
    icon: <MusicNoteIcon />,
    color: '#9C27B0',
    bgColor: 'rgba(156, 39, 176, 0.1)',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop&crop=center',
    description: 'Headphones & speakers',
    count: 167,
    badge: '🎵 Sound',
    subcategories: [
      { name: 'Instruments', count: 67, icon: '🎸' },
      { name: 'Speakers', count: 45, icon: '🔊' },
      { name: 'Headphones', count: 34, icon: '🎧' },
      { name: 'Microphones', count: 23, icon: '🎤' },
      { name: 'Audio Equipment', count: 18, icon: '🎛️' },
      { name: 'Accessories', count: 12, icon: '🎵' }
    ]
  },
  {
    id: 'pets',
    name: 'Pets & Animals',
    icon: <FavoriteIcon />,
    color: '#8BC34A',
    bgColor: 'rgba(139, 195, 74, 0.1)',
    image: 'https://images.unsplash.com/photo-1415369629372-26f2fe60c467?w=400&h=300&fit=crop&crop=center',
    description: 'Pet supplies & accessories',
    count: 134,
    badge: '🐕 Cute'
  },
  {
    id: 'food',
    name: 'Food & Beverages',
    icon: <RestaurantIcon />,
    color: '#FF9800',
    bgColor: 'rgba(255, 152, 0, 0.1)',
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop&crop=center',
    description: 'Gourmet food & drinks',
    count: 298,
    badge: '🍳 Chef'
  }
];

export default function HomePage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { t } = useTranslation('common');
  
  // Gamification State
  const [gameStats, setGameStats] = useState<GameStats>({
    level: 1,
    xp: 0,
    xpToNext: 100,
    coins: 150,
    gems: 25,
    streak: 3,
    achievements: [],
    dailyTasks: [
      {
        id: '1',
        title: 'First Purchase',
        description: 'Make your first purchase',
        reward: 50,
        type: 'coins',
        completed: false,
        progress: 0,
        maxProgress: 1
      },
      {
        id: '2',
        title: 'Browse Categories',
        description: 'Visit 5 different categories',
        reward: 25,
        type: 'xp',
        completed: false,
        progress: 2,
        maxProgress: 5
      },
      {
        id: '3',
        title: 'Daily Login',
        description: 'Login for 7 consecutive days',
        reward: 10,
        type: 'gems',
        completed: false,
        progress: 3,
        maxProgress: 7
      }
    ]
  });
  const [showAchievement, setShowAchievement] = useState(false);
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);
  const [spinWheelOpen, setSpinWheelOpen] = useState(false);

  const handleSearch = (query: string) => {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  useEffect(() => {
    let alive = true;
    apiGet<{products: Product[], pagination: any}>("/products")
      .then((response) => {
        if (!alive) return;
        setProducts(response?.products || []);
      })
      .catch((error) => {
        console.error('Failed to fetch products:', error);
        setProducts([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  const completeTask = (taskId: string) => {
    setGameStats(prev => ({
      ...prev,
      dailyTasks: prev.dailyTasks.map(task => 
        task.id === taskId 
          ? { ...task, completed: true, progress: task.maxProgress }
          : task
      )
    }));
  };

  const spinWheel = () => {
    const rewards = ['coins', 'gems', 'xp'] as const;
    const amounts = [50, 100, 25];
    const randomReward = rewards[Math.floor(Math.random() * rewards.length)];
    const randomAmount = amounts[Math.floor(Math.random() * amounts.length)];
    
    setGameStats(prev => {
      const newStats = { ...prev };
      if (randomReward === 'coins') {
        newStats.coins += randomAmount;
      } else if (randomReward === 'gems') {
        newStats.gems += randomAmount;
      } else if (randomReward === 'xp') {
        newStats.xp += randomAmount;
      }
      return newStats;
    });
    
    setSpinWheelOpen(false);
  };

  // Gamified Components
  const GameStatsHeader = () => (
    <Box sx={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: 3,
      p: 3,
      mb: 4,
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)'
    }}>
      {/* Animated Background */}
      <Box sx={{
        position: 'absolute',
        top: -50,
        right: -50,
        width: 200,
        height: 200,
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.1)',
        animation: 'float 6s ease-in-out infinite'
      }} />
      
      <Grid container spacing={3} sx={{ position: 'relative', zIndex: 2 }}>
        <Grid item xs={12} md={8}>
          <Stack direction="row" alignItems="center" spacing={2} mb={2}>
            <Avatar sx={{
              bgcolor: '#FFD700',
              width: 48,
              height: 48,
              fontSize: '1.5rem',
              fontWeight: 800,
              animation: 'pulse 2s ease-in-out infinite'
            }}>
              {gameStats.level}
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight={800} color="white">
                Level {gameStats.level} Shopper
              </Typography>
              <Typography variant="body2" color="rgba(255,255,255,0.8)">
                {gameStats.xp} / {gameStats.xpToNext} XP to next level
              </Typography>
            </Box>
          </Stack>
          
          <LinearProgress
            variant="determinate"
            value={(gameStats.xp / gameStats.xpToNext) * 100}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: 'rgba(255,255,255,0.2)',
              '& .MuiLinearProgress-bar': {
                background: 'linear-gradient(90deg, #FFD700, #FFA500)',
                borderRadius: 4
              }
            }}
          />
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Stack direction="row" spacing={2} justifyContent="center">
            <Tooltip title="Coins">
              <Chip
                icon={<DiamondIcon />}
                label={gameStats.coins}
                sx={{
                  bgcolor: 'rgba(255, 215, 0, 0.2)',
                  color: '#FFD700',
                  fontWeight: 700,
                  border: '1px solid rgba(255, 215, 0, 0.3)'
                }}
              />
            </Tooltip>
            <Tooltip title="Gems">
              <Chip
                icon={<DiamondIcon />}
                label={gameStats.gems}
                sx={{
                  bgcolor: 'rgba(138, 43, 226, 0.2)',
                  color: '#8A2BE2',
                  fontWeight: 700,
                  border: '1px solid rgba(138, 43, 226, 0.3)'
                }}
              />
            </Tooltip>
            <Tooltip title="Login Streak">
              <Chip
                icon={<TimerIcon />}
                label={`${gameStats.streak} days`}
                sx={{
                  bgcolor: 'rgba(255, 99, 132, 0.2)',
                  color: '#FF6384',
                  fontWeight: 700,
                  border: '1px solid rgba(255, 99, 132, 0.3)'
                }}
              />
            </Tooltip>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );

  const DailyTasksPanel = () => (
    <Card sx={{
      borderRadius: 3,
      background: 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(250,250,250,0.95) 100%)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
      border: '1px solid rgba(255,255,255,0.2)'
    }}>
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2} mb={3}>
          <EmojiEventsIcon sx={{ color: '#FFD700', fontSize: '2rem' }} />
          <Typography variant="h6" fontWeight={700}>
            Daily Missions
          </Typography>
          <Chip
            label="Complete for rewards!"
            size="small"
            sx={{
              bgcolor: '#4CAF50',
              color: 'white',
              fontWeight: 600,
              animation: 'pulse 2s ease-in-out infinite'
            }}
          />
        </Stack>
        
        <Stack spacing={2}>
          {gameStats.dailyTasks.map((task) => (
            <Card
              key={task.id}
              sx={{
                p: 2,
                borderRadius: 2,
                border: task.completed ? '2px solid #4CAF50' : '1px solid #E0E0E0',
                bgcolor: task.completed ? 'rgba(76, 175, 80, 0.05)' : 'transparent',
                transition: 'all 0.3s ease'
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {task.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {task.description}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={(task.progress / task.maxProgress) * 100}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      bgcolor: 'rgba(0,0,0,0.1)',
                      '& .MuiLinearProgress-bar': {
                        background: task.completed ? '#4CAF50' : '#2196F3',
                        borderRadius: 3
                      }
                    }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                    {task.progress} / {task.maxProgress}
                  </Typography>
                </Box>
                
                <Stack alignItems="center" spacing={1}>
                  <Chip
                    icon={task.type === 'coins' ? <DiamondIcon /> : task.type === 'gems' ? <DiamondIcon /> : <StarIcon />}
                    label={`+${task.reward}`}
                    size="small"
                    sx={{
                      bgcolor: task.type === 'coins' ? '#FFD700' : task.type === 'gems' ? '#8A2BE2' : '#4CAF50',
                      color: 'white',
                      fontWeight: 700
                    }}
                  />
                  {!task.completed && (
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => completeTask(task.id)}
                      sx={{
                        bgcolor: '#2196F3',
                        fontSize: '0.7rem',
                        px: 2,
                        py: 0.5
                      }}
                    >
                      Complete
                    </Button>
                  )}
                </Stack>
              </Stack>
            </Card>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );

  const SpinWheelDialog = () => (
    <Dialog
      open={spinWheelOpen}
      onClose={() => setSpinWheelOpen(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
        <CasinoIcon sx={{ fontSize: '3rem', color: '#FFD700', mb: 1 }} />
        <Typography variant="h5" fontWeight={700}>
          Daily Spin Wheel
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Spin to win rewards!
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ textAlign: 'center', py: 3 }}>
        <Box sx={{
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4, #45B7D1, #96CEB4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mx: 'auto',
          mb: 3,
          animation: 'spin 3s linear infinite',
          '@keyframes spin': {
            '0%': { transform: 'rotate(0deg)' },
            '100%': { transform: 'rotate(360deg)' }
          }
        }}>
          <Typography variant="h4" fontWeight={800} color="white">
            🎯
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Click spin to get your daily reward!
        </Typography>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
        <Button
          variant="contained"
          onClick={spinWheel}
          sx={{
            bgcolor: '#FF6B6B',
            px: 4,
            py: 1.5,
            fontSize: '1.1rem',
            fontWeight: 700,
            borderRadius: 3,
            '&:hover': {
              bgcolor: '#FF5252',
              transform: 'scale(1.05)'
            }
          }}
        >
          🎰 SPIN NOW!
        </Button>
      </DialogActions>
    </Dialog>
  );

  const newArrivals = useMemo(() => {
    if (!Array.isArray(products)) return [];
    const list = products.slice();
    list.sort((a, b) => {
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return db - da;
    });
    return list.slice(0, 8);
  }, [products]);

  const topPicks = useMemo(() => {
    if (!Array.isArray(products)) return [];
    const list = products.slice();
    list.sort((a, b) => {
      const ra = typeof a.rating === 'number' ? a.rating! : -1;
      const rb = typeof b.rating === 'number' ? b.rating! : -1;
      if (rb !== ra) return rb - ra;
      return (b.price || 0) - (a.price || 0);
    });
    return list.slice(0, 8);
  }, [products]);

  // Amazon-like Category Grid Component with Urgency
  const CategoryGrid = () => (
    <Box mt={6}>
      {/* Title and Chips Row */}
      <Stack direction="row" alignItems="center" spacing={2} mb={3}>
        <Typography 
          variant="h4" 
          fontWeight={800}
          sx={{ 
            background: 'linear-gradient(45deg, #FF6B35, #F7931E)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: { xs: '1.8rem', md: '2.2rem' },
            animation: 'heartbeat 3s ease-in-out infinite'
          }}
        >
          {t('home.categoriesTitle')}
        </Typography>
        <Chip 
          label="🔥 HOT DEALS" 
          size="small" 
          sx={{ 
            bgcolor: '#FF4757', 
            color: 'white', 
            fontWeight: 700,
            fontSize: '0.8rem',
            height: 28,
            animation: 'pulseUrgent 1.5s infinite',
            boxShadow: '0 4px 12px rgba(255, 71, 87, 0.4)'
          }} 
        />
        <Chip 
          label="⚡ LIMITED TIME" 
          size="small" 
          sx={{ 
            bgcolor: '#FF6B35', 
            color: 'white', 
            fontWeight: 700,
            fontSize: '0.7rem',
            height: 24,
            animation: 'wiggle 2s ease-in-out infinite'
          }} 
        />
      </Stack>
      
      {/* View All Categories Button - New Line */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
        <Button 
          component={NextLink}
          href="/categories"
          variant="contained"
          size="large"
          endIcon={<ArrowForwardIcon />}
          sx={{ 
            borderRadius: { xs: 1.5, sm: 2 },
            px: { xs: 3, sm: 6 },
            py: { xs: 1.2, sm: 1.8 },
            fontSize: { xs: '0.9rem', sm: '1.1rem' },
            fontWeight: 700,
            background: 'linear-gradient(45deg, #FF6B35, #F7931E)',
            boxShadow: { xs: '0 6px 20px rgba(255, 107, 53, 0.3)', sm: '0 8px 25px rgba(255, 107, 53, 0.4)' },
            minWidth: { xs: '200px', sm: '250px' },
            '&:hover': {
              transform: { xs: 'translateY(-1px)', sm: 'translateY(-2px)' },
              boxShadow: { xs: '0 8px 25px rgba(255, 107, 53, 0.5)', sm: '0 12px 35px rgba(255, 107, 53, 0.6)' },
              background: 'linear-gradient(45deg, #F7931E, #FF6B35)'
            }
          }}
        >
          {t('home.viewAllCategories')}
        </Button>
      </Box>
      
      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {amazonCategories.map((category, index) => (
          <Grid item xs={6} sm={4} md={3} lg={2} key={category.id}>
            <Fade in timeout={300 + index * 100}>
              <Card 
                component={NextLink as any} 
                href={`/categories/${category.id}`} 
                sx={{ 
                  borderRadius: { xs: 2, sm: 3 }, 
                  textDecoration: 'none', 
                  overflow: 'hidden',
                  position: 'relative',
                  height: { xs: 280, sm: 300 },
                  border: '3px solid transparent',
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(250,250,250,0.98) 100%)',
                  boxShadow: { xs: '0 8px 25px rgba(0,0,0,0.12)', sm: '0 12px 35px rgba(0,0,0,0.15)' },
                  transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  animation: index < 3 ? 'bounce 3s ease-in-out infinite' : 'none',
                  animationDelay: `${index * 0.5}s`,
                  '&:hover': { 
                    transform: { xs: 'translateY(-8px) scale(1.02)', sm: 'translateY(-12px) scale(1.05)' },
                    boxShadow: `0 25px 50px ${category.color}40`,
                    borderColor: category.color,
                    animation: 'none',
                    '& .category-image': {
                      transform: 'scale(1.15)',
                      filter: 'brightness(1.2) saturate(1.3)'
                    },
                    '& .category-overlay': {
                      opacity: 0.9
                    },
                    '& .category-icon': {
                      transform: 'scale(1.2) rotate(10deg)',
                      bgcolor: category.color,
                      color: 'white',
                      boxShadow: `0 12px 35px ${category.color}60`,
                      animation: 'wiggle 0.5s ease-in-out'
                    },
                    '& .urgency-badge': {
                      animation: 'pulseUrgent 0.5s ease-in-out infinite'
                    }
                  } 
                }}
              >
                {/* Background Image */}
                <Box sx={{ position: 'relative', height: { xs: 120, sm: 140 }, overflow: 'hidden' }}>
                  <CardMedia 
                    className="category-image"
                    component="img" 
                    height="140" 
                    image={category.image} 
                    alt={category.name}
                    sx={{
                      transition: 'all 0.4s ease',
                      objectFit: 'cover',
                      height: { xs: 120, sm: 140 }
                    }}
                  />
                  
                  {/* Gradient Overlay */}
                  <Box
                    className="category-overlay"
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: `linear-gradient(45deg, ${category.color}60, transparent 70%)`,
                      opacity: 0.3,
                      transition: 'all 0.4s ease',
                      zIndex: 1
                    }}
                  />
                  
                  {/* Urgency Badge */}
                  <Chip
                    className="urgency-badge"
                    label={t(`categories.${category.id}.badge`)}
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: { xs: 8, sm: 12 },
                      left: { xs: 8, sm: 12 },
                      bgcolor: index < 4 ? '#FF4757' : `${category.color}20`,
                      color: index < 4 ? 'white' : category.color,
                      fontSize: { xs: '0.6rem', sm: '0.7rem' },
                      height: { xs: 22, sm: 26 },
                      fontWeight: 800,
                      border: `2px solid ${index < 4 ? '#FF6B35' : category.color}40`,
                      zIndex: 2,
                      backdropFilter: 'blur(10px)',
                      boxShadow: index < 4 ? '0 4px 12px rgba(255, 71, 87, 0.4)' : 'none',
                      animation: index < 4 ? 'pulseUrgent 2s ease-in-out infinite' : 'none'
                    }}
                  />
                  
                  {/* Discount Badge for Top Categories */}
                  {index < 4 && (
                    <Chip
                      label={`-${Math.floor(Math.random() * 30) + 20}%`}
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: { xs: 8, sm: 12 },
                        right: { xs: 8, sm: 12 },
                        bgcolor: '#2ECC71',
                        color: 'white',
                        fontSize: { xs: '0.5rem', sm: '0.6rem' },
                        height: { xs: 18, sm: 22 },
                        fontWeight: 800,
                        zIndex: 2,
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 4px 12px rgba(46, 204, 113, 0.4)',
                        animation: 'bounce 2s ease-in-out infinite'
                      }}
                    />
                  )}
                  
                  {/* Item Count */}
                  <Chip
                    label={`${category.count}+ items`}
                    size="small"
                    sx={{
                      position: 'absolute',
                      bottom: { xs: 8, sm: 12 },
                      right: { xs: 8, sm: 12 },
                      bgcolor: 'rgba(0,0,0,0.8)',
                      color: 'white',
                      fontSize: { xs: '0.5rem', sm: '0.6rem' },
                      height: { xs: 16, sm: 20 },
                      fontWeight: 600,
                      zIndex: 2,
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.2)'
                    }}
                  />
                </Box>
                
                <CardContent sx={{ 
                  p: { xs: 1.5, sm: 2 }, 
                  height: { xs: 160, sm: 160 },
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  textAlign: 'center'
                }}>
                  {/* Icon */}
                  <Avatar
                    className="category-icon"
                    sx={{
                      bgcolor: `${category.color}15`,
                      color: category.color,
                      width: { xs: 40, sm: 48 },
                      height: { xs: 40, sm: 48 },
                      mb: 1,
                      transition: 'all 0.4s ease',
                      border: `3px solid ${category.color}20`,
                      fontSize: { xs: '1rem', sm: '1.2rem' }
                    }}
                  >
                    {category.icon}
                  </Avatar>
                  
                  <Typography
                    variant="h6"
                    fontWeight={700}
                    sx={{
                      fontSize: { xs: '0.8rem', sm: '0.9rem' },
                      lineHeight: 1.2,
                      mb: 1,
                      color: 'text.primary'
                    }}
                  >
                    {t(`categories.${category.id}.name`)}
                  </Typography>
                  
                  {/* Subcategories */}
                  <Box sx={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: { xs: 0.3, sm: 0.5 }, 
                    justifyContent: 'center',
                    maxHeight: { xs: 35, sm: 40 },
                    overflow: 'hidden'
                  }}>
                    {category.subcategories?.slice(0, 3).map((subcat, subIndex) => {
                      // Map subcategory names to translation keys
                      const subcatKeyMap: { [key: string]: string } = {
                        'Smartphones': 'smartphones',
                        'Laptops': 'laptops',
                        'Audio': 'audio',
                        'Cameras': 'cameras',
                        'Gaming': 'gaming',
                        'Smart Home': 'smartHome',
                        'Women\'s Clothing': 'womensClothing',
                        'Men\'s Clothing': 'mensClothing',
                        'Shoes': 'shoes',
                        'Accessories': 'accessories',
                        'Jewelry': 'jewelry',
                        'Watches': 'watches',
                        'Furniture': 'furniture',
                        'Decor': 'decor',
                        'Kitchen': 'kitchen',
                        'Bedding': 'bedding',
                        'Garden': 'garden',
                        'Lighting': 'lighting',
                        'Fitness Equipment': 'fitnessEquipment',
                        'Outdoor Gear': 'outdoorGear',
                        'Team Sports': 'teamSports',
                        'Water Sports': 'waterSports',
                        'Winter Sports': 'winterSports',
                        'Athletic Wear': 'athleticWear',
                        'Books': 'books',
                        'Movies & TV': 'moviesTv',
                        'Music': 'music',
                        'Magazines': 'magazines',
                        'Audiobooks': 'audiobooks',
                        'E-books': 'ebooks',
                        'Action Figures': 'actionFigures',
                        'Board Games': 'boardGames',
                        'Educational Toys': 'educationalToys',
                        'Outdoor Toys': 'outdoorToys',
                        'Video Games': 'videoGames',
                        'Arts & Crafts': 'artsCrafts',
                        'Car Parts': 'carParts',
                        'Tools': 'tools',
                        'Maintenance': 'maintenance',
                        'Electronics': 'electronics',
                        'Interior': 'interior',
                        'Supplements': 'supplements',
                        'Skincare': 'skincare',
                        'Fitness': 'fitness',
                        'Medical': 'medical',
                        'Personal Care': 'personalCare',
                        'Wellness': 'wellness',
                        'Cases & Covers': 'casesCovers',
                        'Chargers': 'chargers',
                        'Headphones': 'headphones',
                        'Smartwatches': 'smartwatches',
                        'Tablets': 'tablets',
                        'Instruments': 'instruments',
                        'Speakers': 'speakers',
                        'Microphones': 'microphones',
                        'Audio Equipment': 'audioEquipment'
                      };
                      
                      const subcatKey = subcatKeyMap[subcat.name] || subcat.name.toLowerCase().replace(/\s+/g, '');
                      
                      return (
                        <Chip
                          key={subIndex}
                          label={subcat.icon}
                          size="small"
                          sx={{
                            fontSize: { xs: '0.5rem', sm: '0.6rem' },
                            height: { xs: 16, sm: 18 },
                            minWidth: { xs: 16, sm: 18 },
                            bgcolor: `${category.color}10`,
                            color: category.color,
                            border: `1px solid ${category.color}20`,
                            '& .MuiChip-label': {
                              px: { xs: 0.3, sm: 0.5 },
                              fontSize: { xs: '0.5rem', sm: '0.6rem' }
                            }
                          }}
                          title={t(`categories.${category.id}.subcategories.${subcatKey}`)}
                        />
                      );
                    })}
                    {category.subcategories && category.subcategories.length > 3 && (
                      <Chip
                        label={`+${category.subcategories.length - 3}`}
                        size="small"
                        sx={{
                          fontSize: { xs: '0.5rem', sm: '0.6rem' },
                          height: { xs: 16, sm: 18 },
                          minWidth: { xs: 16, sm: 18 },
                          bgcolor: `${category.color}20`,
                          color: category.color,
                          fontWeight: 600,
                          '& .MuiChip-label': {
                            px: { xs: 0.3, sm: 0.5 },
                            fontSize: { xs: '0.5rem', sm: '0.6rem' }
                          }
                        }}
                      />
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Fade>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  // Enhanced Product Grid Component with Urgency
  const ProductGrid = ({ title, items }: { title: string; items: Product[] | null }) => (
    <Box mt={8}>
      {/* Title and Chips Row */}
      <Stack direction="row" alignItems="center" spacing={2} mb={3}>
        <Typography 
          variant="h4" 
          fontWeight={800}
          sx={{ 
            background: 'linear-gradient(45deg, #22c55e, #16a34a)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: { xs: '1.8rem', md: '2.2rem' },
            animation: 'heartbeat 4s ease-in-out infinite'
          }}
        >
          {title}
        </Typography>
        <Chip 
          label={t('home.hotLabel')} 
          size="small" 
          sx={{ 
            bgcolor: '#FF4757', 
            color: 'white', 
            fontWeight: 800,
            fontSize: '0.8rem',
            height: 30,
            animation: 'pulseUrgent 1.5s infinite',
            boxShadow: '0 4px 12px rgba(255, 71, 87, 0.4)'
          }} 
        />
        <Chip 
          label={t('home.saleLabel')} 
          size="small" 
          sx={{ 
            bgcolor: '#FF6B35', 
            color: 'white', 
            fontWeight: 800,
            fontSize: '0.7rem',
            height: 26,
            animation: 'wiggle 2s ease-in-out infinite'
          }} 
        />
      </Stack>
      
      {/* View All Products Button - New Line */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
        <Button 
          component={NextLink}
          href="/product"
          variant="contained"
          size="large"
          endIcon={<ArrowForwardIcon />}
          sx={{ 
            borderRadius: { xs: 1.5, sm: 2 },
            px: { xs: 3, sm: 6 },
            py: { xs: 1.2, sm: 1.8 },
            fontSize: { xs: '0.9rem', sm: '1.1rem' },
            fontWeight: 700,
            background: 'linear-gradient(45deg, #22c55e, #16a34a)',
            boxShadow: { xs: '0 6px 20px rgba(34, 197, 94, 0.3)', sm: '0 8px 25px rgba(34, 197, 94, 0.4)' },
            minWidth: { xs: '200px', sm: '250px' },
            '&:hover': {
              transform: { xs: 'translateY(-1px)', sm: 'translateY(-2px)' },
              boxShadow: { xs: '0 8px 25px rgba(34, 197, 94, 0.5)', sm: '0 12px 35px rgba(34, 197, 94, 0.6)' },
              background: 'linear-gradient(45deg, #16a34a, #15803d)'
            }
          }}
        >
          {t('home.viewAllProducts')}
        </Button>
      </Box>
      
      {!products ? (
        <Grid container spacing={3}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Grid item xs={6} sm={4} md={3} key={i}>
              <Paper 
                sx={{ 
                  p: 2, 
                  borderRadius: 3, 
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <Skeleton 
                  variant="rectangular" 
                  height={200} 
                  sx={{ borderRadius: 2, mb: 2 }} 
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
          {(items || []).map((p, index) => {
            const img = getMainImage(p.images, 'product', p._id);
            const isRealImage = hasRealImages(p.images);
            const rating = typeof p.rating === 'number' ? p.rating : 4.5;
            const originalPrice = p.price * (1.2 + Math.random() * 0.3);
            const discount = Math.round(((originalPrice - p.price) / originalPrice) * 100);
            const isHotItem = index < 3;
            
            return (
              <Grid item xs={6} sm={4} md={3} key={p._id}>
                <Zoom in timeout={300 + index * 100}>
                  <Card 
                    component={NextLink as any} 
                    href={`/product/${p._id}`} 
                    sx={{ 
                      borderRadius: 4, 
                      textDecoration: 'none', 
                      overflow: 'hidden',
                      position: 'relative',
                      border: '3px solid transparent',
                      background: 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(250,250,250,0.98) 100%)',
                      boxShadow: '0 12px 35px rgba(0,0,0,0.15)',
                      transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                      animation: isHotItem ? 'bounce 4s ease-in-out infinite' : 'none',
                      animationDelay: `${index * 0.3}s`,
                      '&:hover': { 
                        transform: 'translateY(-12px) scale(1.05)',
                        boxShadow: '0 25px 50px rgba(34, 197, 94, 0.3)',
                        borderColor: '#22c55e',
                        animation: 'none',
                        '& .product-image': {
                          transform: 'scale(1.1)'
                        },
                        '& .price-flash': {
                          animation: 'priceFlash 0.5s ease-in-out infinite'
                        },
                        '& .cart-button': {
                          animation: 'wiggle 0.5s ease-in-out'
                        }
                      } 
                    }}
                  >
                  <Box sx={{ position: 'relative', overflow: 'hidden' }}>
                    <CardMedia 
                        className="product-image"
                      component="img" 
                        height="200" 
                      image={img} 
                      alt={p.title} 
                      sx={{
                        filter: isRealImage ? 'none' : 'brightness(0.9) sepia(0.1)',
                          transition: 'transform 0.4s ease',
                          objectFit: 'cover'
                      }}
                    />
                    
                    {/* Hot Item Badge */}
                    {isHotItem && (
                      <Chip
                        label="🔥 HOT"
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 12,
                          left: 12,
                          bgcolor: '#FF4757',
                          color: 'white',
                          fontSize: '0.7rem',
                          height: 26,
                          fontWeight: 800,
                          zIndex: 2,
                          backdropFilter: 'blur(10px)',
                          boxShadow: '0 4px 12px rgba(255, 71, 87, 0.4)',
                          animation: 'pulseUrgent 2s ease-in-out infinite'
                        }}
                      />
                    )}
                    
                    {/* Discount Badge */}
                    {discount > 5 && (
                      <Chip
                        label={`-${discount}%`}
                        size="small"
                        sx={{
                          position: 'absolute',
                            top: 12,
                            left: isHotItem ? 80 : 12,
                          bgcolor: '#2ECC71',
                          color: 'white',
                          fontWeight: 800,
                          fontSize: '0.75rem',
                          height: 24,
                          zIndex: 2,
                          backdropFilter: 'blur(10px)',
                          boxShadow: '0 4px 12px rgba(46, 204, 113, 0.4)',
                          animation: isHotItem ? 'bounce 2s ease-in-out infinite' : 'none'
                        }}
                      />
                    )}
                    
                    {/* Limited Stock Badge */}
                    {Math.random() > 0.7 && (
                      <Chip
                        label="⚡ Limited Stock"
                        size="small"
                        sx={{
                          position: 'absolute',
                          bottom: 12,
                          left: 12,
                          bgcolor: '#FF6B35',
                          color: 'white',
                          fontSize: '0.6rem',
                          height: 20,
                          fontWeight: 700,
                          zIndex: 2,
                          backdropFilter: 'blur(10px)',
                          animation: 'urgency 2s ease-in-out infinite'
                        }}
                      />
                    )}
                    
                    {/* New Badge */}
                    {p.createdAt && new Date(p.createdAt) > new Date(Date.now() - 7*24*60*60*1000) && (
                      <Chip
                          label="✨ NEW"
                        size="small"
                        sx={{
                          position: 'absolute',
                            top: 12,
                            right: 12,
                          bgcolor: '#8B5CF6',
                          color: 'white',
                          fontWeight: 800,
                          fontSize: '0.7rem',
                          height: 24,
                          zIndex: 2,
                          backdropFilter: 'blur(10px)',
                          boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
                          animation: 'sparkle 2s ease-in-out infinite'
                        }}
                      />
                    )}
                    
                    {!isRealImage && (
                      <Chip
                          label="DEMO"
                        size="small"
                        sx={{
                          position: 'absolute',
                            bottom: 12,
                            left: 12,
                            backgroundColor: 'rgba(0,0,0,0.8)',
                          color: 'white',
                          fontSize: '0.6rem',
                            height: 20,
                            borderRadius: 2
                        }}
                      />
                    )}
                  </Box>
                  
                    <CardContent sx={{ p: 3 }}>
                    <Typography 
                        variant="h6" 
                      fontWeight={700} 
                      gutterBottom 
                      sx={{ 
                          fontSize: '1rem',
                        color: 'text.primary',
                          lineHeight: 1.3,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                      }}
                    >
                      {p.title}
                    </Typography>
                    
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                          <StarIcon sx={{ color: '#FFD700', fontSize: '1rem' }} />
                          <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.85rem' }}>
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
                            className="price-flash"
                            variant="h6" 
                            fontWeight={800} 
                            color="primary.main"
                            sx={{ 
                              fontSize: '1.2rem',
                              animation: isHotItem ? 'priceFlash 3s ease-in-out infinite' : 'none'
                            }}
                          >
                            ${(p.price ?? 0).toFixed(2)}
                          </Typography>
                          {discount > 5 && (
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                textDecoration: 'line-through',
                                color: 'text.secondary',
                                fontSize: '0.8rem',
                                opacity: 0.7
                              }}
                            >
                              ${originalPrice.toFixed(2)}
                            </Typography>
                          )}
                        </Stack>
                        <Typography 
                          variant="caption" 
                          color="success.main" 
                          fontWeight={600} 
                          sx={{ 
                            fontSize: '0.7rem',
                            animation: 'heartbeat 4s ease-in-out infinite'
                          }}
                        >
                          {t('home.freeShipping')}
                        </Typography>
                        {isHotItem && (
                          <Typography 
                            variant="caption" 
                            color="error.main" 
                            fontWeight={700} 
                            sx={{ 
                              fontSize: '0.6rem',
                              display: 'block',
                              animation: 'pulseUrgent 2s ease-in-out infinite'
                            }}
                          >
                            {t('home.limitedTimeOffer')}
                          </Typography>
                        )}
                      </Box>
                      
                      <IconButton
                        className="cart-button"
                        size="small"
                        sx={{
                          bgcolor: 'primary.main',
                          color: 'white',
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            bgcolor: 'primary.dark',
                            transform: 'scale(1.15)',
                            boxShadow: '0 8px 20px rgba(34, 197, 94, 0.5)'
                          }
                        }}
                      >
                        <LocalMallIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </CardContent>
                </Card>
                </Zoom>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );

  return (
    <Box>
      {/* Modern CSS Animations */}
      <style jsx global>{`
        @keyframes fadeInUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes fadeInLeft {
          from { transform: translateX(-30px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes fadeInRight {
          from { transform: translateX(30px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .fade-in-up {
          animation: fadeInUp 0.8s ease-out;
        }
        
        .fade-in-left {
          animation: fadeInLeft 0.8s ease-out;
        }
        
        .fade-in-right {
          animation: fadeInRight 0.8s ease-out;
        }
        
        .float-animation {
          animation: float 6s ease-in-out infinite;
        }
        
        .pulse-animation {
          animation: pulse 2s ease-in-out infinite;
        }
        
        .shimmer-effect {
          background-size: 200% 200%;
          animation: shimmer 3s ease-in-out infinite;
        }
        
        .gradient-shift {
          background-size: 200% 200%;
          animation: gradientShift 4s ease infinite;
        }
      `}</style>

      {/* Enhanced Attractive Hero Section with Product Slider */}
      <Box sx={(theme) => ({
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        minHeight: { xs: '80vh', sm: '75vh', md: '70vh' },
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: theme.palette.mode === 'dark'
            ? 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.02"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
            : 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.03"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          animation: 'float 20s linear infinite'
        }
      })}>
        {/* Floating Background Elements */}
        <Box sx={(theme) => ({
          position: 'absolute',
          top: { xs: '5%', md: '10%' },
          left: { xs: '5%', md: '10%' },
          width: { xs: 60, md: 100 },
          height: { xs: 60, md: 100 },
          borderRadius: '50%',
          background: theme.palette.mode === 'dark' 
            ? 'rgba(255, 255, 255, 0.05)' 
            : 'rgba(255, 255, 255, 0.08)',
          animation: 'float 8s ease-in-out infinite',
          backdropFilter: 'blur(10px)'
        })} />
        <Box sx={(theme) => ({
          position: 'absolute',
          top: { xs: '15%', md: '20%' },
          right: { xs: '10%', md: '15%' },
          width: { xs: 40, md: 80 },
          height: { xs: 40, md: 80 },
          borderRadius: '50%',
          background: theme.palette.mode === 'dark' 
            ? 'rgba(255, 255, 255, 0.03)' 
            : 'rgba(255, 255, 255, 0.06)',
          animation: 'float 6s ease-in-out infinite reverse',
          backdropFilter: 'blur(10px)'
        })} />
        
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2, py: { xs: 4, md: 0 } }}>
          <Grid container spacing={{ xs: 3, md: 4 }} alignItems="center">
            {/* Left Side - Enhanced Text */}
            <Grid item xs={12} md={5}>
              <Box className="fade-in-left" sx={{ textAlign: { xs: 'center', md: 'left' } }}>
                {/* Badge */}
                <Chip
                  label={`✨ ${t('home.aiPoweredShopping')}`}
                  sx={(theme) => ({
                    mb: 3,
                    background: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.15)' 
                      : 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    fontWeight: 600,
                    backdropFilter: 'blur(10px)',
                    border: theme.palette.mode === 'dark' 
                      ? '1px solid rgba(255, 255, 255, 0.2)' 
                      : '1px solid rgba(255, 255, 255, 0.3)',
                    animation: 'pulse 2s ease-in-out infinite'
                  })}
                />
                
                <Typography 
                  variant="h1" 
                  fontWeight={900}
                  sx={{ 
                    color: 'white',
                    fontSize: { xs: '2.2rem', sm: '2.8rem', md: '3.5rem', lg: '4rem' },
                    lineHeight: { xs: 1.1, md: 1.2 },
                    textShadow: '0 4px 20px rgba(0,0,0,0.3)',
                    mb: 3,
                    background: 'linear-gradient(45deg, #ffffff, #f0f0f0, #ffffff)',
                    backgroundSize: '200% 200%',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    animation: 'shimmer 3s ease-in-out infinite'
                  }}
                >
                  {t('home.heroTitle')}
                </Typography>
                
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: 'rgba(255,255,255,0.9)',
                      fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem' },
                      fontWeight: 400,
                      mb: 3,
                      lineHeight: 1.6,
                      maxWidth: { xs: '100%', md: '400px' },
                      mx: { xs: 'auto', md: 0 }
                    }}
                  >
                    {t('home.heroSubtitle')}
                  </Typography>
                  
                  {/* Mobile AI Search Bar */}
                  <Box sx={{ 
                    display: { xs: 'block', md: 'none' }, 
                    mb: 3,
                    maxWidth: '100%'
                  }}>
                    <AiSearchBar 
                      placeholder={t('navigation.aiSearch')}
                      sx={{
                        '& .MuiInputBase-root': {
                          borderRadius: 3,
                          bgcolor: 'rgba(255, 255, 255, 0.15)',
                          backdropFilter: 'blur(10px)',
                          border: '2px solid rgba(255, 255, 255, 0.3)',
                          color: 'white',
                          '&:focus-within': {
                            bgcolor: 'rgba(255, 255, 255, 0.2)',
                            borderColor: 'rgba(255, 255, 255, 0.5)',
                            boxShadow: '0 0 0 3px rgba(255, 255, 255, 0.1)'
                          },
                          '& .MuiInputBase-input::placeholder': {
                            color: 'rgba(255, 255, 255, 0.7)',
                            opacity: 1
                          }
                        },
                        '& .MuiInputBase-input': {
                          color: 'white',
                          py: 2,
                          px: 2,
                          fontSize: '1rem'
                        }
                      }}
                    />
                  </Box>
                
                {/* Feature Icons */}
                <Stack 
                  direction="row" 
                  spacing={{ xs: 2, sm: 3 }} 
                  sx={{ 
                    mb: 4,
                    justifyContent: { xs: 'center', md: 'flex-start' },
                    flexWrap: 'wrap',
                    gap: 2
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AutoAwesomeIcon sx={{ color: '#FFD700', fontSize: '1.2rem' }} />
                    <Typography variant="body2" color="rgba(255,255,255,0.8)" fontWeight={500}>
                      AI Search
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ViewInArIcon sx={{ color: '#FFD700', fontSize: '1.2rem' }} />
                    <Typography variant="body2" color="rgba(255,255,255,0.8)" fontWeight={500}>
                      {t('home.arTryOn')}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SecurityIcon sx={{ color: '#FFD700', fontSize: '1.2rem' }} />
                    <Typography variant="body2" color="rgba(255,255,255,0.8)" fontWeight={500}>
                      {t('home.secureShopping')}
                    </Typography>
                  </Box>
                </Stack>
                
                <Stack 
                  direction={{ xs: 'column', sm: 'row' }} 
                  spacing={2} 
                  sx={{ 
                    justifyContent: { xs: 'center', md: 'flex-start' },
                    alignItems: 'center'
                  }}
                >
                  <Button
                    variant="contained"
                    size="large"
                    component={NextLink}
                    href="/collections"
                    sx={{
                      background: 'linear-gradient(45deg, #FF6B35, #F7931E)',
                      color: 'white',
                      px: { xs: 3, sm: 4 },
                      py: { xs: 1.5, sm: 2 },
                      fontSize: { xs: '0.9rem', sm: '1rem' },
                      fontWeight: 700,
                      borderRadius: 3,
                      textTransform: 'none',
                      boxShadow: '0 8px 25px rgba(255, 107, 53, 0.4)',
                      minWidth: { xs: '140px', sm: '160px' },
                      '&:hover': {
                        background: 'linear-gradient(45deg, #F7931E, #FF6B35)',
                        transform: 'translateY(-3px)',
                        boxShadow: '0 12px 30px rgba(255, 107, 53, 0.6)'
                      }
                    }}
                  >
                    Start Shopping
                  </Button>
                  
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => {
                      const aiButton = document.querySelector('[data-ai-assistant="true"]') as HTMLElement;
                      if (aiButton) aiButton.click();
                    }}
                    sx={{
                      borderColor: 'rgba(255, 255, 255, 0.7)',
                      color: 'white',
                      px: { xs: 3, sm: 4 },
                      py: { xs: 1.5, sm: 2 },
                      fontSize: { xs: '0.9rem', sm: '1rem' },
                      fontWeight: 600,
                      borderRadius: 3,
                      textTransform: 'none',
                      backdropFilter: 'blur(10px)',
                      borderWidth: 2,
                      minWidth: { xs: '140px', sm: '160px' },
                      '&:hover': {
                        borderColor: 'white',
                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                        transform: 'translateY(-3px)',
                        boxShadow: '0 8px 25px rgba(255, 255, 255, 0.2)'
                      }
                    }}
                  >
                    AI Search
                  </Button>
                </Stack>
              </Box>
            </Grid>
            
            {/* Right Side - Enhanced Product Slider */}
            <Grid item xs={12} md={7}>
              <Box className="fade-in-right" sx={{ position: 'relative', px: { xs: 1, md: 0 } }}>
                {/* Product Image Slider */}
                <Box sx={(theme) => ({
                  position: 'relative',
                  borderRadius: { xs: 2, md: 3 },
                  overflow: 'hidden',
                  boxShadow: theme.palette.mode === 'dark' 
                    ? '0 25px 50px rgba(0,0,0,0.5)' 
                    : '0 25px 50px rgba(0,0,0,0.3)',
                  background: theme.palette.mode === 'dark' 
                    ? 'rgba(255,255,255,0.05)' 
                    : 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(20px)',
                  border: theme.palette.mode === 'dark' 
                    ? '1px solid rgba(255,255,255,0.1)' 
                    : '1px solid rgba(255,255,255,0.2)'
                })}>
                  <Box sx={{
                    display: 'flex',
                    animation: 'slideShow 20s infinite',
                    '@keyframes slideShow': {
                      '0%, 20%': { transform: 'translateX(0)' },
                      '25%, 45%': { transform: 'translateX(-100%)' },
                      '50%, 70%': { transform: 'translateX(-200%)' },
                      '75%, 95%': { transform: 'translateX(-300%)' },
                      '100%': { transform: 'translateX(0)' }
                    }
                  }}>
                    {[
                      {
                        image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500&h=400&fit=crop',
                        name: 'Premium Wireless Headphones',
                        price: '$199.99',
                        category: 'Electronics'
                      },
                      {
                        image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=500&h=400&fit=crop',
                        name: 'Designer Fashion Collection',
                        price: '$89.99',
                        category: 'Fashion'
                      },
                      {
                        image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&h=400&fit=crop',
                        name: 'Modern Home Decor Set',
                        price: '$149.99',
                        category: 'Home & Garden'
                      },
                      {
                        image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&h=400&fit=crop',
                        name: 'Professional Sports Gear',
                        price: '$299.99',
                        category: 'Sports & Fitness'
                      }
                    ].map((product, index) => (
                      <Box
                        key={index}
                        sx={{
                          minWidth: '100%',
                          height: { xs: 280, sm: 320, md: 380 },
                          position: 'relative'
                        }}
                      >
                        <CardMedia 
                          component="img"
                          height="100%"
                          image={product.image}
                          alt={product.name}
                          sx={{
                            objectFit: 'cover',
                            filter: 'brightness(0.9)',
                            transition: 'transform 0.3s ease'
                          }}
                        />
                        
                        {/* Enhanced Product Info Overlay */}
                        <Box sx={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                          p: { xs: 2, md: 3 },
                          color: 'white'
                        }}>
                          <Chip
                            label={product.category}
                            size="small"
                            sx={{
                              mb: 1,
                              background: 'rgba(255, 107, 53, 0.9)',
                              color: 'white',
                              fontWeight: 600,
                              fontSize: '0.7rem'
                            }}
                          />
                          <Typography 
                            variant="h6" 
                            fontWeight={700} 
                            sx={{ 
                              mb: 1,
                              fontSize: { xs: '1rem', md: '1.1rem' },
                              lineHeight: 1.2
                            }}
                          >
                            {product.name}
                          </Typography>
                          <Typography 
                            variant="h5" 
                            fontWeight={800}
                            sx={{ 
                              color: '#FFD700',
                              fontSize: { xs: '1.2rem', md: '1.4rem' }
                            }}
                          >
                            {product.price}
                          </Typography>
                        </Box>
                        
                        {/* Floating Rating Badge */}
                        <Box sx={(theme) => ({
                          position: 'absolute',
                          top: 16,
                          right: 16,
                          background: theme.palette.mode === 'dark' 
                            ? 'rgba(0,0,0,0.8)' 
                            : 'rgba(255,255,255,0.95)',
                          borderRadius: 2,
                          p: 1,
                          backdropFilter: 'blur(10px)',
                          boxShadow: theme.palette.mode === 'dark' 
                            ? '0 4px 12px rgba(0,0,0,0.3)' 
                            : '0 4px 12px rgba(0,0,0,0.1)',
                          border: theme.palette.mode === 'dark' 
                            ? '1px solid rgba(255,255,255,0.1)' 
                            : 'none'
                        })}>
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <StarIcon sx={{ color: '#FFD700', fontSize: '1rem' }} />
                            <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8rem' }}>
                              4.8
                            </Typography>
                          </Stack>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                  
                  {/* Enhanced Slider Indicators */}
                  <Box sx={{
                    position: 'absolute',
                    bottom: 20,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: 1
                  }}>
                    {[0, 1, 2, 3].map((index) => (
                      <Box
                        key={index}
                        sx={{
                          width: { xs: 6, md: 8 },
                          height: { xs: 6, md: 8 },
                          borderRadius: '50%',
                          background: 'rgba(255,255,255,0.6)',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            background: 'rgba(255,255,255,0.9)',
                            transform: 'scale(1.3)'
                          }
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: 6 }}>
        {/* Amazon-like Category Grid */}
        <CategoryGrid />

        {/* New Arrivals */}
        <ProductGrid title={t('home.newArrivalsTitle')} items={newArrivals} />

        {/* Top Picks */}
        <ProductGrid title={t('home.topPicksTitle')} items={topPicks} />

        {/* Enhanced Modern Flash Deals Section */}
        <Box mt={8}>
          <Paper 
            sx={(theme) => ({ 
              p: { xs: 4, md: 6 }, 
              borderRadius: 4,
              background: theme.palette.mode === 'dark' 
                ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
                : 'linear-gradient(135deg, #FF6B35 0%, #F7931E 50%, #FF8C42 100%)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: theme.palette.mode === 'dark' 
                ? '0 24px 64px rgba(0, 0, 0, 0.5)' 
                : '0 24px 64px rgba(255, 107, 53, 0.3)',
              border: '3px solid',
              borderColor: theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.1)' 
                : '#FF8C42'
            })}
          >
            {/* Enhanced Animated Background Pattern */}
            <Box
              sx={(theme) => ({
                position: 'absolute',
                top: -120,
                right: -120,
                width: 500,
                height: 500,
                borderRadius: '50%',
                background: theme.palette.mode === 'dark' 
                  ? 'rgba(255,255,255,0.03)' 
                  : 'rgba(255,255,255,0.08)',
                animation: 'float 12s ease-in-out infinite',
                zIndex: 0
              })}
            />
            <Box
              sx={(theme) => ({
                position: 'absolute',
                bottom: -100,
                left: -100,
                width: 400,
                height: 400,
                borderRadius: '50%',
                background: theme.palette.mode === 'dark' 
                  ? 'rgba(255,255,255,0.02)' 
                  : 'rgba(255,255,255,0.06)',
                animation: 'float 15s ease-in-out infinite reverse',
                zIndex: 0
              })}
            />
            
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Stack direction="row" alignItems="center" justifyContent="center" spacing={3} mb={4}>
                <BoltIcon sx={{ 
                  fontSize: '4rem', 
                  animation: 'pulseUrgent 1.5s infinite', 
                  filter: 'drop-shadow(0 4px 8px rgba(255,255,255,0.3))',
                  color: '#FFD700'
                }} />
                <Typography 
                  variant="h2" 
                  fontWeight={900} 
                  sx={{ 
                    fontSize: { xs: '2.5rem', md: '3.5rem' }, 
                    textShadow: '4px 4px 8px rgba(0,0,0,0.3)',
                    background: 'linear-gradient(45deg, #FFD700, #FFA500, #FFD700)',
                    backgroundSize: '200% 200%',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    animation: 'shimmer 3s ease-in-out infinite, pulseUrgent 2s ease-in-out infinite'
                  }}
                >
                  {t('home.flashDealsTitle')}
                </Typography>
                <BoltIcon sx={{ 
                  fontSize: '4rem', 
                  animation: 'pulseUrgent 1.5s infinite', 
                  filter: 'drop-shadow(0 4px 8px rgba(255,255,255,0.3))',
                  color: '#FFD700'
                }} />
              </Stack>
              
              <Typography 
                variant="h5" 
                textAlign="center" 
                sx={{ 
                  opacity: 0.95, 
                  mb: 6, 
                  fontWeight: 600, 
                  fontSize: { xs: '1.2rem', md: '1.4rem' },
                  animation: 'heartbeat 4s ease-in-out infinite',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
                }}
              >
                ⚡ {t('home.flashDealsSubtitle')} 🕐
              </Typography>
              
              <Grid container spacing={4}>
                {[
                  { title: 'Electronics', discount: '30%', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400', originalPrice: '$299', newPrice: '$209' },
                  { title: 'Fashion', discount: '25%', image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400', originalPrice: '$89', newPrice: '$67' },
                  { title: 'Home & Garden', discount: '20%', image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400', originalPrice: '$149', newPrice: '$119' },
                  { title: 'Sports', discount: '35%', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400', originalPrice: '$199', newPrice: '$129' }
                ].map((deal, index) => (
                  <Grid item xs={12} sm={6} md={3} key={index}>
                    <Card 
                      component={NextLink as any} 
                      href="/categories" 
                      sx={(theme) => ({ 
                        borderRadius: 3, 
                        textDecoration: 'none', 
                        overflow: 'hidden',
                        position: 'relative',
                        transition: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)',
                        border: '3px solid',
                        borderColor: theme.palette.mode === 'dark' 
                          ? 'rgba(255,255,255,0.1)' 
                          : 'rgba(255,255,255,0.2)',
                        background: theme.palette.mode === 'dark' 
                          ? 'rgba(255,255,255,0.05)' 
                          : 'rgba(255,255,255,0.95)',
                        backdropFilter: 'blur(20px)',
                        '&:hover': { 
                          transform: 'translateY(-12px) scale(1.03)', 
                          boxShadow: theme.palette.mode === 'dark' 
                            ? '0 24px 48px rgba(0,0,0,0.4)' 
                            : '0 24px 48px rgba(0,0,0,0.25)',
                          borderColor: theme.palette.mode === 'dark' 
                            ? 'rgba(255,255,255,0.3)' 
                            : 'rgba(255,255,255,0.8)',
                          '& .deal-image': {
                            transform: 'scale(1.1)',
                            filter: 'brightness(1.1)'
                          },
                          '& .deal-discount': {
                            transform: 'scale(1.2)',
                            animation: 'pulse 1s infinite'
                          }
                        } 
                      })}
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
                          borderRadius: 2,
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
                        <Typography 
                          fontWeight={800} 
                          variant="h6" 
                          sx={{ 
                            mb: 1, 
                            fontSize: '1.1rem',
                            color: 'white'
                          }}
                        >
                          {deal.title}
                        </Typography>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                          <Typography 
                            variant="h6" 
                            fontWeight={800} 
                            sx={{ 
                              fontSize: '1.2rem',
                              color: '#FFD700'
                            }}
                          >
                            {deal.newPrice}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              textDecoration: 'line-through',
                              color: 'rgba(255,255,255,0.7)',
                              fontSize: '0.9rem'
                            }}
                          >
                            {deal.originalPrice}
                          </Typography>
                        </Stack>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontSize: '0.85rem',
                            color: 'rgba(255,255,255,0.8)',
                            mb: 2
                          }}
                        >
                          Save up to {deal.discount} today only!
                        </Typography>
                        <Button
                          variant="contained"
                          size="small"
                          sx={{
                            bgcolor: '#FFD700',
                            color: '#333',
                            fontWeight: 700,
                            borderRadius: 2,
                            px: 3,
                            py: 1,
                            '&:hover': {
                              bgcolor: '#FFA500',
                              transform: 'translateY(-2px)',
                              boxShadow: '0 8px 25px rgba(255, 215, 0, 0.4)'
                            }
                          }}
                        >
                          {t('home.shopNow')}
                        </Button>
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
                    borderRadius: 3,
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
                  Shop All Deals
                </Button>
              </Box>
            </Box>
          </Paper>
        </Box>

        {/* Enhanced Modern Newsletter Section */}
        <Box mt={8}>
          <Paper 
            sx={(theme) => ({ 
              p: { xs: 4, md: 6 }, 
              borderRadius: 4,
              textAlign: 'center',
              background: theme.palette.mode === 'dark' 
                ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 50%, rgba(240, 147, 251, 0.15) 100%)'
                : 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 50%, rgba(240, 147, 251, 0.1) 100%)',
              border: '2px solid',
              borderColor: theme.palette.mode === 'dark' 
                ? 'rgba(102, 126, 234, 0.3)' 
                : 'rgba(102, 126, 234, 0.2)',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: theme.palette.mode === 'dark' 
                ? '0 20px 60px rgba(102, 126, 234, 0.25)' 
                : '0 20px 60px rgba(102, 126, 234, 0.15)',
              backdropFilter: 'blur(20px)'
            })}
          >
            {/* Enhanced Background Elements */}
            <Box
              sx={(theme) => ({
                position: 'absolute',
                top: -100,
                right: -100,
                width: 400,
                height: 400,
                borderRadius: '50%',
                background: theme.palette.mode === 'dark' 
                  ? 'linear-gradient(45deg, rgba(102, 126, 234, 0.12), rgba(118, 75, 162, 0.12))'
                  : 'linear-gradient(45deg, rgba(102, 126, 234, 0.08), rgba(118, 75, 162, 0.08))',
                animation: 'float 12s ease-in-out infinite',
                zIndex: 0
              })}
            />
            <Box
              sx={(theme) => ({
                position: 'absolute',
                bottom: -80,
                left: -80,
                width: 300,
                height: 300,
                borderRadius: '50%',
                background: theme.palette.mode === 'dark' 
                  ? 'linear-gradient(45deg, rgba(240, 147, 251, 0.08), rgba(102, 126, 234, 0.08))'
                  : 'linear-gradient(45deg, rgba(240, 147, 251, 0.06), rgba(102, 126, 234, 0.06))',
                animation: 'float 10s ease-in-out infinite reverse',
                zIndex: 0
              })}
            />
            
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              {/* Enhanced Header */}
              <Stack direction="row" alignItems="center" justifyContent="center" spacing={2} mb={3}>
                <Box sx={{
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  borderRadius: '50%',
                  p: 1.5,
                  boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)'
                }}>
                  <EmailIcon sx={{ color: 'white', fontSize: '2rem' }} />
                </Box>
                <Typography 
                  variant="h3" 
                  fontWeight={900} 
                  sx={{
                    background: 'linear-gradient(45deg, #667eea, #764ba2)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontSize: { xs: '1.8rem', md: '2.5rem' },
                    textShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  {t('home.newsletterTitle')}
                </Typography>
              </Stack>
              
              <Typography 
                variant="h5" 
                color="text.secondary" 
                mb={5} 
                sx={{ 
                  fontWeight: 500, 
                  fontSize: { xs: '1rem', md: '1.2rem' },
                  maxWidth: 600,
                  mx: 'auto',
                  lineHeight: 1.6
                }}
              >
                {t('home.newsletterDescription')}
              </Typography>
              
              {/* Enhanced Form */}
              <Box sx={{ maxWidth: 600, mx: 'auto' }}>
                <Stack 
                  direction={{ xs: 'column', sm: 'row' }} 
                  spacing={2} 
                  alignItems="center"
                >
                  <TextField
                    placeholder={t('home.enterEmail')}
                    variant="outlined"
                    fullWidth
                    sx={(theme) => ({ 
                      '& .MuiInputBase-root': { 
                        borderRadius: 3,
                        bgcolor: theme.palette.mode === 'dark' 
                          ? 'rgba(255, 255, 255, 0.1)' 
                          : 'rgba(255, 255, 255, 0.9)',
                        fontSize: '1rem',
                        py: 1.5,
                        border: '2px solid',
                        borderColor: theme.palette.mode === 'dark' 
                          ? 'rgba(102, 126, 234, 0.3)' 
                          : 'rgba(102, 126, 234, 0.2)',
                        backdropFilter: 'blur(10px)',
                        color: theme.palette.mode === 'dark' ? 'white' : 'inherit',
                        '&:focus-within': {
                          borderColor: '#667eea',
                          boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
                          bgcolor: theme.palette.mode === 'dark' 
                            ? 'rgba(255, 255, 255, 0.15)' 
                            : 'white'
                        },
                        '& .MuiInputBase-input::placeholder': {
                          color: theme.palette.mode === 'dark' 
                            ? 'rgba(255, 255, 255, 0.7)' 
                            : 'rgba(0, 0, 0, 0.6)',
                          opacity: 1
                        }
                      },
                      '& .MuiInputBase-input': {
                        px: 2,
                        color: theme.palette.mode === 'dark' ? 'white' : 'inherit'
                      }
                    })}
                  />
                  <Button
                    variant="contained"
                    size="large"
                    sx={{ 
                      px: 6,
                      py: 2,
                      borderRadius: 3,
                      minWidth: { xs: '100%', sm: 180 },
                      fontSize: '1rem',
                      fontWeight: 700,
                      background: 'linear-gradient(45deg, #667eea, #764ba2)',
                      boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)',
                      textTransform: 'none',
                      letterSpacing: '0.5px',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 12px 35px rgba(102, 126, 234, 0.6)',
                        background: 'linear-gradient(45deg, #764ba2, #667eea)'
                      }
                    }}
                  >
                    {t('home.subscribeNow')}
                  </Button>
                </Stack>
              </Box>
              
              {/* Enhanced Benefits */}
              <Stack 
                direction={{ xs: 'column', sm: 'row' }} 
                spacing={4} 
                justifyContent="center" 
                alignItems="center"
                sx={{ mt: 5 }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <CheckCircleIcon sx={{ color: '#22c55e', fontSize: '1.2rem' }} />
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Weekly exclusive deals
                  </Typography>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <CheckCircleIcon sx={{ color: '#22c55e', fontSize: '1.2rem' }} />
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Early access to new products
                  </Typography>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <CheckCircleIcon sx={{ color: '#22c55e', fontSize: '1.2rem' }} />
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Unsubscribe anytime
                  </Typography>
                </Stack>
              </Stack>
              
              <Typography 
                variant="caption" 
                color="text.secondary" 
                mt={3} 
                display="block" 
                sx={{ 
                  fontSize: '0.8rem', 
                  fontWeight: 500,
                  opacity: 0.7
                }}
              >
                Join 50,000+ happy customers who get our best deals first
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
      
      {/* Gamification Dialogs */}
      <SpinWheelDialog />
      
      {/* Achievement Dialog */}
      <Dialog
        open={showAchievement}
        onClose={() => setShowAchievement(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
          <ConfettiIcon sx={{ fontSize: '3rem', color: '#FFD700', mb: 1 }} />
          <Typography variant="h5" fontWeight={700}>
            🎉 Achievement Unlocked!
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', py: 3 }}>
          {newAchievement && (
            <>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                {newAchievement.title}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {newAchievement.description}
              </Typography>
              <Chip
                label={`+${newAchievement.reward} ${newAchievement.rarity.toUpperCase()}`}
                sx={{
                  bgcolor: newAchievement.rarity === 'legendary' ? '#FFD700' : 
                           newAchievement.rarity === 'epic' ? '#8A2BE2' :
                           newAchievement.rarity === 'rare' ? '#2196F3' : '#4CAF50',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '1rem',
                  px: 3,
                  py: 1
                }}
              />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button
            variant="contained"
            onClick={() => setShowAchievement(false)}
            sx={{
              bgcolor: '#4CAF50',
              px: 4,
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 700,
              borderRadius: 3
            }}
          >
            Awesome! 🎉
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}