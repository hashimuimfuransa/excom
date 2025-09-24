"use client";
import React from 'react';
import { GlobalStyles } from '@mui/material';

export default function AppGlobalStyles() {
  return (
    <GlobalStyles
      styles={(theme) => ({
        body: {
          // Layered background: subtle grid + gradient, reacts to theme mode
          backgroundImage: `radial-gradient(rgba(124,58,237,0.08) 1px, transparent 1px), radial-gradient(rgba(6,182,212,0.06) 1px, transparent 1px), linear-gradient(180deg, ${theme.palette.mode === 'dark' ? '#0b1020' : '#f8fafc'} 0%, ${theme.palette.mode === 'dark' ? '#0a0f1a' : '#f1f5f9'} 100%)`,
          backgroundSize: '16px 16px, 24px 24px, 100% 100%',
          backgroundPosition: '0 0, 8px 8px, 0 0'
        },
        // Mobile-specific styles
        '@media (max-width: 900px)': {
          html: {
            // Ensure proper viewport handling on mobile
            height: '100%',
            overflowX: 'hidden'
          },
          body: {
            height: '100%',
            overflowX: 'hidden',
            // Prevent zoom on input focus
            touchAction: 'manipulation'
          },
          // Ensure bottom navbar doesn't interfere with content
          '#__next': {
            minHeight: '100vh',
            minHeight: '100dvh' // Dynamic viewport height for mobile
          }
        },
        // Voice AI Animations
        '@keyframes slide-down': {
          from: {
            transform: 'translateY(-100%)',
            opacity: 0
          },
          to: {
            transform: 'translateY(0)',
            opacity: 1
          }
        },
        '.animate-slide-down': {
          animation: 'slide-down 0.5s ease-out'
        },
        // Voice button pulse animation
        '@keyframes voice-pulse': {
          '0%': {
            boxShadow: '0 0 0 0 rgba(59, 130, 246, 0.7)'
          },
          '70%': {
            boxShadow: '0 0 0 10px rgba(59, 130, 246, 0)'
          },
          '100%': {
            boxShadow: '0 0 0 0 rgba(59, 130, 246, 0)'
          }
        },
        '.voice-pulse': {
          animation: 'voice-pulse 2s infinite'
        },
        // Popup animation
        '@keyframes popupIn': {
          '0%': {
            opacity: 0,
            transform: 'scale(0.8) translateY(-20px) rotateX(10deg)'
          },
          '50%': {
            opacity: 0.8,
            transform: 'scale(1.05) translateY(-5px) rotateX(2deg)'
          },
          '100%': {
            opacity: 1,
            transform: 'scale(1) translateY(0) rotateX(0deg)'
          }
        }
      })}
    />
  );
}