"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import base from '../utils/theme';

const KEY = 'excom_theme_mode';

export default function ThemeProviderClient({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'dark';
    return (localStorage.getItem(KEY) as 'light' | 'dark') || 'dark';
  });

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { mode: 'light' | 'dark' };
      if (detail?.mode) setMode(detail.mode);
    };
    window.addEventListener('excom-theme', handler as any);
    return () => window.removeEventListener('excom-theme', handler as any);
  }, []);

  const theme = useMemo(() => createTheme({
    ...base,
    palette: {
      ...base.palette,
      mode,
      ...(mode === 'dark' ? {
        // Dark mode specific colors
        text: {
          primary: '#ffffff',
          secondary: 'rgba(255, 255, 255, 0.7)',
        },
        background: {
          default: '#0a0f1a',
          paper: '#1a1f2e',
        },
        divider: 'rgba(255, 255, 255, 0.12)',
      } : {
        // Light mode specific colors
        text: {
          primary: 'rgba(0, 0, 0, 0.87)',
          secondary: 'rgba(0, 0, 0, 0.6)',
        },
        background: {
          default: '#ffffff',
          paper: '#ffffff',
        },
        divider: 'rgba(0, 0, 0, 0.12)',
      }),
    },
  } as any), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}