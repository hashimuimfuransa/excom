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
        }
      })}
    />
  );
}