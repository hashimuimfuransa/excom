"use client";
import React, { useEffect, useState } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';

const KEY = 'excom_theme_mode';

export default function DarkModeToggle() {
  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    return (localStorage.getItem(KEY) as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(KEY, mode);
    // Dispatch event for ThemeProvider to react
    window.dispatchEvent(new CustomEvent('excom-theme', { detail: { mode } }));
  }, [mode]);

  return (
    <Tooltip title={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
      <IconButton onClick={() => setMode(mode === 'light' ? 'dark' : 'light')} aria-label="Toggle dark mode">
        {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
      </IconButton>
    </Tooltip>
  );
}