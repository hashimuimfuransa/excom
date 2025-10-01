import React from 'react';
import { Box } from '@mui/material';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: 'background.default',
      // Remove any padding that might be added by the main layout
      margin: 0,
      padding: 0,
      // Ensure full width and height
      width: '100%',
      height: '100%'
    }}>
      {children}
    </Box>
  );
}
