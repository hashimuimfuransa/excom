import React from 'react';
import ThemeProviderClient from '../components/ThemeProviderClient';
import I18nProvider from '../components/I18nProvider';
import { AuthProvider } from '@utils/auth.tsx';
import { NotificationProvider } from '@contexts/NotificationContext';
import Navbar from '../components/Navbar';
import { CssBaseline, Box } from '@mui/material';
import AppGlobalStyles from '../components/AppGlobalStyles';

export const metadata = {
  metadataBase: new URL('https://excom.local'),
  title: 'Excom – Universal Marketplace',
  description: 'AI-powered marketplace for products, rentals, services, and more.',
  openGraph: {
    title: 'Excom – Universal Marketplace',
    description: 'Discover products, rentals, hotels, and services in one place.',
    url: 'https://excom.local/',
    siteName: 'Excom',
    images: [
      { url: '/og.jpg', width: 1200, height: 630, alt: 'Excom' }
    ],
    locale: 'en_US',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Excom – Universal Marketplace',
    description: 'Discover products, rentals, hotels, and services in one place.',
    images: ['/og.jpg']
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProviderClient>
          <I18nProvider>
            <AuthProvider>
              <NotificationProvider>
                <CssBaseline />
                <AppGlobalStyles />
                <Navbar />
                <Box component="main" sx={{ minHeight: '100dvh' }}>
                  {children}
                </Box>
              </NotificationProvider>
            </AuthProvider>
          </I18nProvider>
        </ThemeProviderClient>
      </body>
    </html>
  );
}