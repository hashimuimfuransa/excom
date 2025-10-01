import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Avatar,
  Chip,
  useTheme
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown
} from '@mui/icons-material';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  trend?: {
    value: number;
    period: string;
  };
}

export default function StatsCard({
  title,
  value,
  subtitle,
  icon,
  color = 'primary',
  trend
}: StatsCardProps) {
  const theme = useTheme();
  const isPositiveTrend = trend && trend.value >= 0;
  
  return (
    <Card 
      elevation={0}
      sx={{ 
        borderRadius: 3,
        border: 1,
        borderColor: 'divider',
        height: '100%',
        transition: 'all 0.2s ease-in-out',
        background: theme.palette.mode === 'dark' 
          ? 'rgba(26, 31, 46, 0.8)' 
          : 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)',
        '&:hover': {
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 8px 32px rgba(0, 0, 0, 0.5)' 
            : '0 8px 32px rgba(0, 0, 0, 0.1)',
          transform: 'translateY(-2px)'
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              {title}
            </Typography>
            <Typography 
              variant="h4" 
              fontWeight={800} 
              sx={{ mt: 1, mb: 0.5 }}
              color={`${color}.main`}
            >
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
            
            {trend && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                <Chip
                  size="small"
                  icon={isPositiveTrend ? <TrendingUp /> : <TrendingDown />}
                  label={`${isPositiveTrend ? '+' : ''}${trend.value}%`}
                  color={isPositiveTrend ? 'success' : 'error'}
                  variant="filled"
                  sx={{ 
                    height: 24,
                    '& .MuiChip-icon': { fontSize: 16 }
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  {trend.period}
                </Typography>
              </Box>
            )}
          </Box>
          
          <Avatar
            sx={{
              bgcolor: `${color}.main`,
              color: `${color}.contrastText`,
              width: 56,
              height: 56,
              ml: 2
            }}
          >
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
}