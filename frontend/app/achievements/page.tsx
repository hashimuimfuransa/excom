"use client";
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Chip,
  LinearProgress,
  Avatar,
  Stack,
  Divider,
  Paper,
  IconButton,
  Tooltip,
  Badge,
  Button,
  Tabs,
  Tab,
  Alert,
  Skeleton
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Diamond as DiamondIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  ShoppingCart as ShoppingCartIcon,
  Favorite as FavoriteIcon,
  Share as ShareIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Lock as LockIcon,
  LocalFireDepartment as FireIcon,
  AttachMoney as MoneyIcon,
  Timeline as TimelineIcon,
  Group as GroupIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useGamification } from '@contexts/GamificationContext';
import { useAuth } from '@utils/auth';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: 'shopping' | 'social' | 'milestone' | 'special';
  progress?: number;
  maxProgress?: number;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`achievement-tabpanel-${index}`}
      aria-labelledby={`achievement-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function AchievementsPage() {
  const { t } = useTranslation('common');
  const { user } = useAuth();
  const { userStats, isLoading } = useGamification();
  const [tabValue, setTabValue] = useState(0);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

  // Mock achievements data - in real app, this would come from API
  const achievements: Achievement[] = [
    {
      id: 'first_purchase',
      name: 'First Purchase',
      description: 'Make your first purchase on the platform',
      icon: '🛒',
      points: 50,
      rarity: 'common',
      category: 'shopping',
      unlockedAt: userStats?.totalPurchases > 0 ? new Date().toISOString() : undefined,
      progress: userStats?.totalPurchases > 0 ? 1 : 0,
      maxProgress: 1
    },
    {
      id: 'big_spender',
      name: 'Big Spender',
      description: 'Spend over $500 in total purchases',
      icon: '💰',
      points: 200,
      rarity: 'rare',
      category: 'shopping',
      unlockedAt: (userStats?.totalSpent || 0) > 500 ? new Date().toISOString() : undefined,
      progress: Math.min((userStats?.totalSpent || 0) / 500, 1),
      maxProgress: 1
    },
    {
      id: 'level_10',
      name: 'Level 10 Master',
      description: 'Reach level 10 in the gamification system',
      icon: '⭐',
      points: 300,
      rarity: 'epic',
      category: 'milestone',
      unlockedAt: (userStats?.level || 0) >= 10 ? new Date().toISOString() : undefined,
      progress: Math.min((userStats?.level || 0) / 10, 1),
      maxProgress: 1
    },
    {
      id: 'credit_collector',
      name: 'Credit Collector',
      description: 'Earn 1000 credits through purchases',
      icon: '💎',
      points: 150,
      rarity: 'rare',
      category: 'shopping',
      unlockedAt: (userStats?.credits || 0) >= 1000 ? new Date().toISOString() : undefined,
      progress: Math.min((userStats?.credits || 0) / 1000, 1),
      maxProgress: 1
    },
    {
      id: 'shopping_legend',
      name: 'Shopping Legend',
      description: 'Reach the highest rank in the platform',
      icon: '👑',
      points: 500,
      rarity: 'legendary',
      category: 'milestone',
      unlockedAt: userStats?.rank === 'Shopping Legend' ? new Date().toISOString() : undefined,
      progress: userStats?.rank === 'Shopping Legend' ? 1 : 0,
      maxProgress: 1
    },
    {
      id: 'daily_shopper',
      name: 'Daily Shopper',
      description: 'Make purchases for 7 consecutive days',
      icon: '📅',
      points: 100,
      rarity: 'common',
      category: 'special',
      unlockedAt: undefined, // This would need streak tracking
      progress: 0,
      maxProgress: 7
    }
  ];

  const badges: Badge[] = [
    {
      id: 'newcomer',
      name: 'Newcomer',
      description: 'Welcome to the platform!',
      icon: '🌱',
      rarity: 'common',
      unlockedAt: user ? new Date().toISOString() : undefined
    },
    {
      id: 'bronze_buyer',
      name: 'Bronze Buyer',
      description: 'Completed 10 purchases',
      icon: '🥉',
      rarity: 'common',
      unlockedAt: (userStats?.totalPurchases || 0) >= 10 ? new Date().toISOString() : undefined
    },
    {
      id: 'silver_shopper',
      name: 'Silver Shopper',
      description: 'Completed 50 purchases',
      icon: '🥈',
      rarity: 'rare',
      unlockedAt: (userStats?.totalPurchases || 0) >= 50 ? new Date().toISOString() : undefined
    },
    {
      id: 'gold_master',
      name: 'Gold Master',
      description: 'Completed 100 purchases',
      icon: '🥇',
      rarity: 'epic',
      unlockedAt: (userStats?.totalPurchases || 0) >= 100 ? new Date().toISOString() : undefined
    },
    {
      id: 'platinum_legend',
      name: 'Platinum Legend',
      description: 'Completed 500 purchases',
      icon: '💎',
      rarity: 'legendary',
      unlockedAt: (userStats?.totalPurchases || 0) >= 500 ? new Date().toISOString() : undefined
    }
  ];

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return '#4CAF50';
      case 'rare': return '#2196F3';
      case 'epic': return '#9C27B0';
      case 'legendary': return '#FF9800';
      default: return '#757575';
    }
  };

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'common': return <CheckCircleIcon sx={{ color: '#4CAF50' }} />;
      case 'rare': return <StarIcon sx={{ color: '#2196F3' }} />;
      case 'epic': return <DiamondIcon sx={{ color: '#9C27B0' }} />;
      case 'legendary': return <TrophyIcon sx={{ color: '#FF9800' }} />;
      default: return <LockIcon sx={{ color: '#757575' }} />;
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const unlockedAchievements = achievements.filter(a => a.unlockedAt);
  const lockedAchievements = achievements.filter(a => !a.unlockedAt);
  const unlockedBadges = badges.filter(b => b.unlockedAt);
  const lockedBadges = badges.filter(b => !b.unlockedAt);

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Skeleton variant="text" width={300} height={60} />
          <Skeleton variant="text" width={500} height={30} />
        </Box>
        <Grid container spacing={3}>
          {[...Array(6)].map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Skeleton variant="rectangular" height={200} />
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ 
          fontWeight: 700,
          background: 'linear-gradient(45deg, #FF6B35, #F7931E)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          🏆 {t('achievements.title')}
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
          {t('achievements.subtitle')}
        </Typography>

        {/* Stats Overview */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <Typography variant="h4" fontWeight={700}>
                {userStats?.level || 1}
              </Typography>
              <Typography variant="body2">{t('achievements.level')}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
              <Typography variant="h4" fontWeight={700}>
                {userStats?.credits || 0}
              </Typography>
              <Typography variant="body2">{t('achievements.credits')}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
              <Typography variant="h4" fontWeight={700}>
                {unlockedAchievements.length}
              </Typography>
              <Typography variant="body2">{t('achievements.achievements')}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center', background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
              <Typography variant="h4" fontWeight={700}>
                {unlockedBadges.length}
              </Typography>
              <Typography variant="body2">{t('achievements.badges')}</Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="achievement tabs">
          <Tab label={`${t('achievements.achievements')} (${unlockedAchievements.length}/${achievements.length})`} />
          <Tab label={`${t('achievements.badges')} (${unlockedBadges.length}/${badges.length})`} />
          <Tab label={t('achievements.earningsCredits')} />
        </Tabs>
      </Box>

      {/* Achievements Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {achievements.map((achievement) => (
            <Grid item xs={12} sm={6} md={4} key={achievement.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  },
                  opacity: achievement.unlockedAt ? 1 : 0.6
                }}
                onClick={() => setSelectedAchievement(achievement)}
              >
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h2" sx={{ fontSize: '3rem' }}>
                      {achievement.icon}
                    </Typography>
                    {achievement.unlockedAt && (
                      <Chip
                        icon={getRarityIcon(achievement.rarity)}
                        label={achievement.rarity.toUpperCase()}
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          bgcolor: getRarityColor(achievement.rarity),
                          color: 'white',
                          fontWeight: 700
                        }}
                      />
                    )}
                  </Box>
                  
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    {achievement.name}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {achievement.description}
                  </Typography>

                  {achievement.progress !== undefined && achievement.maxProgress && (
                    <Box sx={{ mb: 2 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={(achievement.progress / achievement.maxProgress) * 100}
                        sx={{ 
                          height: 8, 
                          borderRadius: 4,
                          bgcolor: 'rgba(0,0,0,0.1)',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: getRarityColor(achievement.rarity)
                          }
                        }}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        {achievement.progress}/{achievement.maxProgress}
                      </Typography>
                    </Box>
                  )}

                  <Chip
                    icon={<StarIcon />}
                    label={`${achievement.points} pts`}
                    size="small"
                    sx={{ 
                      bgcolor: '#FFD700',
                      color: '#000',
                      fontWeight: 700
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Badges Tab */}
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          {badges.map((badge) => (
            <Grid item xs={12} sm={6} md={4} key={badge.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  },
                  opacity: badge.unlockedAt ? 1 : 0.6
                }}
              >
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h2" sx={{ fontSize: '3rem' }}>
                      {badge.icon}
                    </Typography>
                    {badge.unlockedAt && (
                      <Chip
                        icon={getRarityIcon(badge.rarity)}
                        label={badge.rarity.toUpperCase()}
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          bgcolor: getRarityColor(badge.rarity),
                          color: 'white',
                          fontWeight: 700
                        }}
                      />
                    )}
                  </Box>
                  
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    {badge.name}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary">
                    {badge.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Earnings & Credits Tab */}
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DiamondIcon color="primary" />
                {t('achievements.credits')} Overview
              </Typography>
              <Divider sx={{ my: 2 }} />
              
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1">{t('achievements.totalCreditsEarned')}</Typography>
                  <Typography variant="h6" fontWeight={600} color="primary">
                    {userStats?.credits || 0}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1">{t('achievements.creditsFromPurchases')}</Typography>
                  <Typography variant="body1">
                    {Math.floor((userStats?.totalSpent || 0) / 10)} credits
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1">{t('achievements.creditsFromAchievements')}</Typography>
                  <Typography variant="body1">
                    {unlockedAchievements.reduce((sum, a) => sum + a.points, 0)} credits
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MoneyIcon color="success" />
                Earnings Summary
              </Typography>
              <Divider sx={{ my: 2 }} />
              
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1">{t('achievements.totalSpent')}</Typography>
                  <Typography variant="h6" fontWeight={600} color="success.main">
                    ${userStats?.totalSpent || 0}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1">{t('achievements.totalPurchases')}</Typography>
                  <Typography variant="body1">
                    {userStats?.totalPurchases || 0}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1">{t('achievements.averageOrderValue')}</Typography>
                  <Typography variant="body1">
                    ${userStats?.totalPurchases ? Math.round((userStats.totalSpent || 0) / userStats.totalPurchases) : 0}
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Grid>
          
          <Grid item xs={12}>
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>{t('achievements.creditsExplanation')}</strong>
              </Typography>
            </Alert>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Achievement Detail Modal */}
      {selectedAchievement && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            p: 2
          }}
          onClick={() => setSelectedAchievement(null)}
        >
          <Card 
            sx={{ 
              maxWidth: 400, 
              width: '100%',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <IconButton
              onClick={() => setSelectedAchievement(null)}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 1
              }}
            >
              <CloseIcon />
            </IconButton>
            
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Typography variant="h1" sx={{ fontSize: '4rem', mb: 2 }}>
                {selectedAchievement.icon}
              </Typography>
              
              <Typography variant="h5" fontWeight={600} gutterBottom>
                {selectedAchievement.name}
              </Typography>
              
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {selectedAchievement.description}
              </Typography>
              
              <Chip
                icon={getRarityIcon(selectedAchievement.rarity)}
                label={`${selectedAchievement.rarity.toUpperCase()} - ${selectedAchievement.points} points`}
                sx={{
                  bgcolor: getRarityColor(selectedAchievement.rarity),
                  color: 'white',
                  fontWeight: 700
                }}
              />
            </CardContent>
          </Card>
        </Box>
      )}
    </Container>
  );
}
