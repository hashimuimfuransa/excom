"use client";
import React from 'react';
import { usePathname } from 'next/navigation';
import { Box } from '@mui/material';
import Navbar from './Navbar';
import BottomNavbar from './BottomNavbar';
import FlashDealsBanner from './FlashDealsBanner';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  
  // Check if current path is a dashboard route
  const isDashboardRoute = pathname?.startsWith('/dashboard');
  
  if (isDashboardRoute) {
    // For dashboard routes, render only the children without navbar and bottom navbar
    return (
      <Box sx={{ 
        minHeight: '100vh',
        backgroundColor: 'background.default'
      }}>
        {children}
      </Box>
    );
  }
  
  // For non-dashboard routes, render with full layout including navbar
  return (
    <>
      <FlashDealsBanner />
      <Navbar />
      <Box component="main" sx={{ 
        minHeight: '100dvh',
        paddingBottom: { xs: 'calc(70px + env(safe-area-inset-bottom))', md: 0 } // Account for safe area and bottom navbar + SpeedDial
      }}>
        {children}
      </Box>
      <BottomNavbar />
    </>
  );
}
