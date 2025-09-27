"use client";
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  IconButton,
  Avatar,
  Chip,
  Button,
  useTheme,
  alpha,
  Fade,
  Zoom,
  Slide
} from '@mui/material';
import {
  Star as StarIcon,
  EmojiEvents as TrophyIcon,
  WorkspacePremium as BadgeIcon,
  Close as CloseIcon,
  TrendingUp as TrendingUpIcon,
  ShoppingCart as ShoppingCartIcon,
  AttachMoney as MoneyIcon,
  LocalFireDepartment as FireIcon,
  Diamond as DiamondIcon,
  AutoAwesome as SparkleIcon,
  Celebration as CelebrationIcon
} from '@mui/icons-material';
import { useGamification } from '@/contexts/GamificationContext';

interface PurchaseCelebrationProps {
  open: boolean;
  onClose: () => void;
  creditsEarned: number;
  experienceGained: number;
  levelUp?: boolean;
  newRank?: string;
  achievementUnlocked?: {
    id: string;
    name: string;
    description: string;
    points: number;
  };
}

export default function PurchaseCelebration({
  open,
  onClose,
  creditsEarned,
  experienceGained,
  levelUp = false,
  newRank,
  achievementUnlocked
}: PurchaseCelebrationProps) {
  const theme = useTheme();
  const [showConfetti, setShowConfetti] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (open) {
      setShowConfetti(true);
      setCurrentStep(0);
      
      // Auto-advance through celebration steps
      const timer = setTimeout(() => {
        setCurrentStep(1);
        if (levelUp) {
          setTimeout(() => setCurrentStep(2), 1500);
        }
        if (achievementUnlocked) {
          setTimeout(() => setCurrentStep(3), 1500);
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [open, levelUp, achievementUnlocked]);

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'Shopping Legend': return '#ffd700';
      case 'VIP Shopper': return '#c0c0c0';
      case 'Elite Buyer': return '#cd7f32';
      case 'Pro Shopper': return '#9c27b0';
      case 'Experienced Buyer': return '#2196f3';
      case 'Regular Customer': return '#4caf50';
      default: return '#757575';
    }
  };

  const getRankIcon = (rank: string) => {
    switch (rank) {
      case 'Shopping Legend': return <DiamondIcon />;
      case 'VIP Shopper': return <TrophyIcon />;
      case 'Elite Buyer': return <StarIcon />;
      case 'Pro Shopper': return <TrendingUpIcon />;
      case 'Experienced Buyer': return <ShoppingCartIcon />;
      case 'Regular Customer': return <MoneyIcon />;
      default: return <ShoppingCartIcon />;
    }
  };

  if (!open) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(5px)'
      }}
    >
      {/* Confetti Animation */}
      {showConfetti && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: '-10px',
              left: '50%',
              width: '10px',
              height: '10px',
              background: '#ffd700',
              borderRadius: '50%',
              animation: 'confetti-fall 3s linear infinite'
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              top: '-10px',
              left: '30%',
              width: '8px',
              height: '8px',
              background: '#ff6b6b',
              borderRadius: '50%',
              animation: 'confetti-fall 3s linear infinite 0.5s'
            }
          }}
        />
      )}

      <Fade in={open} timeout={500}>
        <Card
          sx={{
            maxWidth: 400,
            width: '90%',
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.95) 0%, rgba(6, 182, 212, 0.95) 100%)'
              : 'linear-gradient(135deg, rgba(124, 58, 237, 0.95) 0%, rgba(6, 182, 212, 0.95) 100%)',
            border: `2px solid ${alpha('#ffffff', 0.3)}`,
            borderRadius: 4,
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '6px',
              background: 'linear-gradient(90deg, #ffd700 0%, #ff6b6b 50%, #4ecdc4 100%)',
              borderRadius: '4px 4px 0 0'
            }
          }}
        >
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Stack spacing={3} alignItems="center">
              {/* Close Button */}
              <IconButton
                onClick={onClose}
                sx={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  color: 'white',
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' }
                }}
              >
                <CloseIcon />
              </IconButton>

              {/* Celebration Icon */}
              <Zoom in={currentStep >= 0} timeout={800}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    border: '3px solid rgba(255, 255, 255, 0.3)',
                    animation: 'pulse 2s infinite'
                  }}
                >
                  <CelebrationIcon sx={{ fontSize: 40, color: '#ffd700' }} />
                </Avatar>
              </Zoom>

              {/* Purchase Success */}
              <Zoom in={currentStep >= 0} timeout={800}>
                <Box>
                  <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
                    🎉 Purchase Complete!
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.9 }}>
                    Thank you for your purchase!
                  </Typography>
                </Box>
              </Zoom>

              {/* Credits Earned */}
              <Slide direction="up" in={currentStep >= 1} timeout={600}>
                <Box sx={{ 
                  p: 3, 
                  bgcolor: 'rgba(255, 255, 255, 0.1)', 
                  borderRadius: 3,
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  width: '100%'
                }}>
                  <Stack direction="row" alignItems="center" justifyContent="center" spacing={2}>
                    <MoneyIcon sx={{ fontSize: 32, color: '#10b981' }} />
                    <Box>
                      <Typography variant="h5" fontWeight={700}>
                        +{creditsEarned} Credits
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        Earned from your purchase
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Slide>

              {/* Experience Gained */}
              <Slide direction="up" in={currentStep >= 1} timeout={600}>
                <Box sx={{ 
                  p: 3, 
                  bgcolor: 'rgba(255, 255, 255, 0.1)', 
                  borderRadius: 3,
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  width: '100%'
                }}>
                  <Stack direction="row" alignItems="center" justifyContent="center" spacing={2}>
                    <StarIcon sx={{ fontSize: 32, color: '#f59e0b' }} />
                    <Box>
                      <Typography variant="h5" fontWeight={700}>
                        +{experienceGained} XP
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        Experience points gained
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Slide>

              {/* Level Up */}
              {levelUp && (
                <Slide direction="up" in={currentStep >= 2} timeout={600}>
                  <Box sx={{ 
                    p: 3, 
                    bgcolor: 'rgba(255, 215, 0, 0.2)', 
                    borderRadius: 3,
                    border: '2px solid #ffd700',
                    width: '100%'
                  }}>
                    <Stack direction="row" alignItems="center" justifyContent="center" spacing={2}>
                      <TrophyIcon sx={{ fontSize: 32, color: '#ffd700' }} />
                      <Box>
                        <Typography variant="h5" fontWeight={700} color="#ffd700">
                          🚀 Level Up!
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          {newRank && `You are now a ${newRank}!`}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                </Slide>
              )}

              {/* Achievement Unlocked */}
              {achievementUnlocked && (
                <Slide direction="up" in={currentStep >= 3} timeout={600}>
                  <Box sx={{ 
                    p: 3, 
                    bgcolor: 'rgba(236, 72, 153, 0.2)', 
                    borderRadius: 3,
                    border: '2px solid #ec4899',
                    width: '100%'
                  }}>
                    <Stack direction="row" alignItems="center" justifyContent="center" spacing={2}>
                      <BadgeIcon sx={{ fontSize: 32, color: '#ec4899' }} />
                      <Box>
                        <Typography variant="h5" fontWeight={700} color="#ec4899">
                          🏆 Achievement Unlocked!
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {achievementUnlocked.name}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                          {achievementUnlocked.description}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                </Slide>
              )}

              {/* Action Button */}
              <Button
                variant="contained"
                onClick={onClose}
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: 3,
                  px: 4,
                  py: 1.5,
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.3)',
                    transform: 'translateY(-2px)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                Awesome! 🎉
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Fade>
    </Box>
  );
}
