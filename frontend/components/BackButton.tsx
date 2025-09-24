"use client";
import React from 'react';
import { IconButton, Tooltip, useTheme } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useRouter } from 'next/navigation';

interface BackButtonProps {
  href?: string;
  onClick?: () => void;
  tooltip?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'contained' | 'outlined' | 'text';
}

export default function BackButton({ 
  href, 
  onClick, 
  tooltip = 'Go back', 
  size = 'medium',
  variant = 'outlined'
}: BackButtonProps) {
  const theme = useTheme();
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  const getButtonStyles = () => {
    const baseStyles = {
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateX(-2px)',
      }
    };

    switch (variant) {
      case 'contained':
        return {
          ...baseStyles,
          backgroundColor: theme.palette.mode === 'dark' 
            ? 'rgba(255, 255, 255, 0.1)' 
            : 'rgba(0, 0, 0, 0.05)',
          color: theme.palette.text.primary,
          border: `1px solid ${theme.palette.divider}`,
          '&:hover': {
            ...baseStyles['&:hover'],
            backgroundColor: theme.palette.mode === 'dark' 
              ? 'rgba(255, 255, 255, 0.15)' 
              : 'rgba(0, 0, 0, 0.08)',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 4px 12px rgba(0, 0, 0, 0.3)'
              : '0 4px 12px rgba(0, 0, 0, 0.1)',
          }
        };
      case 'outlined':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          color: theme.palette.text.primary,
          border: `1px solid ${theme.palette.divider}`,
          '&:hover': {
            ...baseStyles['&:hover'],
            backgroundColor: theme.palette.mode === 'dark' 
              ? 'rgba(255, 255, 255, 0.05)' 
              : 'rgba(0, 0, 0, 0.04)',
            borderColor: theme.palette.mode === 'dark' 
              ? 'rgba(255, 255, 255, 0.3)' 
              : 'rgba(0, 0, 0, 0.2)',
          }
        };
      case 'text':
      default:
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          color: theme.palette.text.primary,
          '&:hover': {
            ...baseStyles['&:hover'],
            backgroundColor: theme.palette.mode === 'dark' 
              ? 'rgba(255, 255, 255, 0.05)' 
              : 'rgba(0, 0, 0, 0.04)',
          }
        };
    }
  };

  return (
    <Tooltip title={tooltip} arrow>
      <IconButton
        onClick={handleClick}
        size={size}
        sx={getButtonStyles()}
        aria-label="Go back"
      >
        <ArrowBackIcon />
      </IconButton>
    </Tooltip>
  );
}
