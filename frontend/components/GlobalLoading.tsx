"use client";
import React, { useState, useEffect } from 'react';
import { Backdrop, CircularProgress } from '@mui/material';
import { useRouter } from 'next/navigation';

export default function GlobalLoading() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleStart = () => setLoading(true);
    const handleComplete = () => setLoading(false);

    // Listen for custom loading events
    window.addEventListener('navigationStart', handleStart);
    window.addEventListener('navigationComplete', handleComplete);

    return () => {
      window.removeEventListener('navigationStart', handleStart);
      window.removeEventListener('navigationComplete', handleComplete);
    };
  }, []);

  return (
    <Backdrop
      sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
      open={loading}
    >
      <CircularProgress color="inherit" />
    </Backdrop>
  );
}