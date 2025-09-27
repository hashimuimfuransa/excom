"use client";
import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  LinearProgress,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Avatar,
  Badge,
  Tooltip,
  useTheme,
  alpha,
  Fade,
  Zoom
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
  AutoAwesome as SparkleIcon
} from '@mui/icons-material';
import { useGamification, getRankFromLevel, getLevelFromExperience } from '@/contexts/GamificationContext';

interface GamificationStatsProps {
  compact?: boolean;
  showDialog?: boolean;
  onClose?: () => void;
}

export default function GamificationStats({ 
  compact = false, 
  showDialog = false, 
  onClose 
}: GamificationStatsProps) {
  const theme = useTheme();
  const { userStats, isLoading } = useGamification();
  const [showAchievements, setShowAchievements] = useState(false);

  if (isLoading || !userStats) {
    return (
      <Card sx={{ 
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)'
          : 'linear-gradient(135deg, rgba(124, 58, 237, 0.05) 0%, rgba(6, 182, 212, 0.05) 100%)',
        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        borderRadius: 3
      }}>
        <CardContent>
          <LinearProgress sx={{ borderRadius: 2 }} />
        </CardContent>
      </Card>
    );
  }

  const { level, experienceToNext } = getLevelFromExperience(userStats.experience);
  const currentLevelExp = userStats.experience - (level - 1) * 100;
  const progressPercentage = (currentLevelExp / experienceToNext) * 100;

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

  const content = (
    <Card sx={{ 
      background: theme.palette.mode === 'dark'
        ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)'
        : 'linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(6, 182, 212, 0.08) 100%)',
      border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
      borderRadius: 3,
      backdropFilter: 'blur(10px)',
      boxShadow: theme.palette.mode === 'dark'
        ? '0 8px 32px rgba(124, 58, 237, 0.2)'
        : '0 8px 32px rgba(124, 58, 237, 0.1)',
      position: 'relative',
      overflow: 'hidden',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: `linear-gradient(90deg, #7c3aed 0%, #06b6d4 50%, #10b981 100%)`,
        borderRadius: '3px 3px 0 0'
      }
    }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack spacing={2}>
          {/* Header */}
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Avatar sx={{ 
                bgcolor: getRankColor(userStats.rank),
                width: { xs: 40, sm: 48 },
                height: { xs: 40, sm: 48 },
                boxShadow: `0 4px 12px ${alpha(getRankColor(userStats.rank), 0.3)}`
              }}>
                {getRankIcon(userStats.rank)}
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={700} sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                  Level {level}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  {userStats.rank}
                </Typography>
              </Box>
            </Stack>
            
            {!compact && (
              <Stack direction="row" spacing={1}>
                <Tooltip title="View Achievements">
                  <IconButton
                    onClick={() => setShowAchievements(true)}
                    sx={{
                      bgcolor: alpha(theme.palette.warning.main, 0.1),
                      '&:hover': { bgcolor: alpha(theme.palette.warning.main, 0.2) }
                    }}
                  >
                    <TrophyIcon sx={{ color: 'warning.main' }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="View Badges">
                  <IconButton
                    sx={{
                      bgcolor: alpha(theme.palette.info.main, 0.1),
                      '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.2) }
                    }}
                  >
                    <BadgeIcon sx={{ color: 'info.main' }} />
                  </IconButton>
                </Tooltip>
              </Stack>
            )}
          </Stack>

          {/* Experience Bar */}
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="body2" fontWeight={600} color="text.secondary">
                Experience
              </Typography>
              <Typography variant="body2" fontWeight={600} color="primary.main">
                {currentLevelExp} / {experienceToNext} XP
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={progressPercentage}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.1)' 
                  : 'rgba(0, 0, 0, 0.1)',
                '& .MuiLinearProgress-bar': {
                  background: 'linear-gradient(90deg, #7c3aed 0%, #06b6d4 100%)',
                  borderRadius: 4
                }
              }}
            />
          </Box>

          {/* Stats Grid */}
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={{ xs: 2, sm: 3 }}
            sx={{ mt: 1 }}
          >
            {/* Credits */}
            <Box sx={{ 
              flex: 1,
              p: 2,
              bgcolor: alpha(theme.palette.success.main, 0.1),
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
              textAlign: 'center'
            }}>
              <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ mb: 1 }}>
                <MoneyIcon sx={{ color: 'success.main', fontSize: 20 }} />
                <Typography variant="h6" fontWeight={700} color="success.main">
                  {userStats.credits}
                </Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Credits
              </Typography>
            </Box>

            {/* Purchases */}
            <Box sx={{ 
              flex: 1,
              p: 2,
              bgcolor: alpha(theme.palette.info.main, 0.1),
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
              textAlign: 'center'
            }}>
              <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ mb: 1 }}>
                <ShoppingCartIcon sx={{ color: 'info.main', fontSize: 20 }} />
                <Typography variant="h6" fontWeight={700} color="info.main">
                  {userStats.totalPurchases}
                </Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Purchases
              </Typography>
            </Box>

            {/* Total Spent */}
            <Box sx={{ 
              flex: 1,
              p: 2,
              bgcolor: alpha(theme.palette.warning.main, 0.1),
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
              textAlign: 'center'
            }}>
              <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ mb: 1 }}>
                <TrendingUpIcon sx={{ color: 'warning.main', fontSize: 20 }} />
                <Typography variant="h6" fontWeight={700} color="warning.main">
                  ${userStats.totalSpent.toFixed(0)}
                </Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Total Spent
              </Typography>
            </Box>
          </Stack>

          {/* Recent Achievements */}
          {!compact && userStats.achievements.length > 0 && (
            <Box>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                Recent Achievements
              </Typography>
              <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 1 }}>
                {userStats.achievements.slice(0, 3).map((achievement) => (
                  <Chip
                    key={achievement.id}
                    label={achievement.name}
                    size="small"
                    sx={{
                      bgcolor: alpha(theme.palette.success.main, 0.1),
                      color: 'success.main',
                      border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                      fontSize: '0.7rem'
                    }}
                  />
                ))}
              </Stack>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );

  if (showDialog) {
    return (
      <Dialog
        open={showDialog}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(26, 26, 46, 0.95) 0%, rgba(22, 33, 62, 0.95) 100%)'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          pb: 1
        }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <SparkleIcon color="primary" />
            <Typography variant="h6" fontWeight={600}>
              Your Shopping Stats
            </Typography>
          </Stack>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return content;
}
