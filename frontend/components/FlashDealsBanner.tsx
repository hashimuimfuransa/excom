"use client";
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Stack,
  Chip,
  IconButton,
  useTheme,
  useMediaQuery,
  alpha
} from '@mui/material';
import {
  Close as CloseIcon,
  LocalFireDepartment as FireIcon,
  Timer as TimerIcon,
  ArrowForward as ArrowForwardIcon,
  FlashOn as FlashIcon
} from '@mui/icons-material';
import NextLink from 'next/link';

export default function FlashDealsBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 59,
    seconds: 59
  });
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          return { hours: 23, minutes: 59, seconds: 59 };
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 50%, #FF8C42 100%)',
        color: 'white',
        py: { xs: 1, sm: 1.5 },
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(255, 107, 53, 0.3)',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("data:image/svg+xml,%3Csvg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="20" cy="20" r="1"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          animation: 'float 20s linear infinite'
        }
      }}
    >
      {/* Animated background elements */}
      <Box
        sx={{
          position: 'absolute',
          top: -10,
          left: '10%',
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          animation: 'float 6s ease-in-out infinite'
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: -5,
          right: '15%',
          width: 15,
          height: 15,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.08)',
          animation: 'float 8s ease-in-out infinite reverse'
        }}
      />

      <Box sx={{ position: 'relative', zIndex: 2 }}>
        {/* Desktop Layout */}
        {!isMobile ? (
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="center"
            spacing={2}
            sx={{ px: 3 }}
          >
            {/* Flash Icon */}
            <FlashIcon 
              sx={{ 
                fontSize: '1.5rem',
                animation: 'pulse 2s ease-in-out infinite',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
              }} 
            />

            {/* Main Text */}
            <Typography
              variant="body2"
              sx={{
                fontWeight: 700,
                fontSize: '0.9rem',
                textAlign: 'center',
                textShadow: '0 1px 3px rgba(0,0,0,0.3)'
              }}
            >
              🔥 FLASH DEALS - Up to 70% OFF!
            </Typography>

            {/* Timer */}
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.5}
              sx={{
                background: 'rgba(255, 255, 255, 0.15)',
                borderRadius: 2,
                px: 1,
                py: 0.5,
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              <TimerIcon sx={{ fontSize: '0.8rem' }} />
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  fontFamily: 'monospace'
                }}
              >
                {String(timeLeft.hours).padStart(2, '0')}:
                {String(timeLeft.minutes).padStart(2, '0')}:
                {String(timeLeft.seconds).padStart(2, '0')}
              </Typography>
            </Stack>

            {/* Shop Now Button */}
            <Chip
              component={NextLink}
              href="/collections"
              label="Shop Now"
              size="small"
              icon={<ArrowForwardIcon />}
              sx={{
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                fontWeight: 600,
                fontSize: '0.7rem',
                height: 24,
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.3)',
                  transform: 'scale(1.05)'
                },
                '& .MuiChip-icon': {
                  fontSize: '0.8rem'
                }
              }}
            />

            {/* Close Button */}
            <IconButton
              onClick={handleClose}
              size="small"
              sx={{
                color: 'white',
                opacity: 0.8,
                transition: 'all 0.3s ease',
                '&:hover': {
                  opacity: 1,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  transform: 'scale(1.1)'
                }
              }}
            >
              <CloseIcon sx={{ fontSize: '1rem' }} />
            </IconButton>
          </Stack>
        ) : (
          /* Mobile Layout */
          <Box sx={{ px: 2 }}>
            {/* Top Row - Icon, Text, Close */}
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 1 }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <FlashIcon 
                  sx={{ 
                    fontSize: '1.1rem',
                    animation: 'pulse 2s ease-in-out infinite',
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                  }} 
                />
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    textShadow: '0 1px 3px rgba(0,0,0,0.3)',
                    lineHeight: 1.2
                  }}
                >
                  🔥 FLASH DEALS
                </Typography>
              </Stack>
              
              <IconButton
                onClick={handleClose}
                size="small"
                sx={{
                  color: 'white',
                  opacity: 0.8,
                  transition: 'all 0.3s ease',
                  p: 0.5,
                  '&:hover': {
                    opacity: 1,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    transform: 'scale(1.1)'
                  }
                }}
              >
                <CloseIcon sx={{ fontSize: '0.9rem' }} />
              </IconButton>
            </Stack>

            {/* Bottom Row - Discount, Timer & Shop Button */}
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              spacing={1}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  textShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  flex: 1
                }}
              >
                Up to 70% OFF!
              </Typography>

              {/* Mobile Timer */}
              <Stack
                direction="row"
                alignItems="center"
                spacing={0.5}
                sx={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  borderRadius: 1.5,
                  px: 0.8,
                  py: 0.3,
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  minWidth: 'fit-content'
                }}
              >
                <TimerIcon sx={{ fontSize: '0.7rem' }} />
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.65rem',
                    fontFamily: 'monospace',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {String(timeLeft.hours).padStart(2, '0')}:
                  {String(timeLeft.minutes).padStart(2, '0')}:
                  {String(timeLeft.seconds).padStart(2, '0')}
                </Typography>
              </Stack>

              {/* Mobile Shop Button */}
              <Chip
                component={NextLink}
                href="/collections"
                label="Shop"
                size="small"
                icon={<ArrowForwardIcon />}
                sx={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.65rem',
                  height: 22,
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  minWidth: 'fit-content',
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.3)',
                    transform: 'scale(1.05)'
                  },
                  '& .MuiChip-icon': {
                    fontSize: '0.7rem'
                  }
                }}
              />
            </Stack>
          </Box>
        )}

      </Box>

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>
    </Box>
  );
}
