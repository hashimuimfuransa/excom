"use client";
import React, { useEffect, useState } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';

const KEY = 'excom_theme_mode';

export default function DarkModeToggle() {
  const [mode, setMode] = useState<'light' | 'dark'>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedMode = localStorage.getItem(KEY) as 'light' | 'dark';
    if (savedMode) {
      setMode(savedMode);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(KEY, mode);
    // Dispatch event for ThemeProvider to react
    window.dispatchEvent(new CustomEvent('excom-theme', { detail: { mode } }));
  }, [mode]);

  if (!mounted) {
    return (
      <IconButton disabled aria-label="Loading theme toggle">
        <DarkModeIcon />
      </IconButton>
    );
  }

  return (
    <Tooltip title={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
      <IconButton 
        onClick={() => setMode(mode === 'light' ? 'dark' : 'light')} 
        aria-label="Toggle dark mode"
        sx={{ 
          color: 'inherit',
          '&:hover': {
            backgroundColor: 'action.hover'
          }
        }}
      >
        {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
      </IconButton>
    </Tooltip>
  );
}