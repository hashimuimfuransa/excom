"use client";
import React, { useState } from 'react';
import { Box, Button, Container, Paper, Stack, TextField, Typography, Alert, InputAdornment } from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import NextLink from 'next/link';
import { apiPost } from '@utils/api';
import { useAuth } from '@utils/auth.tsx';
import { useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { token } = await apiPost<{ token: string }>("/auth/login", { email, password });
      await login(token);
      
      // Check if there's a redirect parameter
      if (redirect) {
        window.location.href = `/${redirect}`;
        return;
      }
      
      // fetch role and redirect accordingly
      const me = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000/api'}/auth/me`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
      if (me?.role === 'seller') {
        window.location.href = '/dashboard/vendor';
      } else if (me?.role === 'admin') {
        window.location.href = '/dashboard/admin';
      } else {
        window.location.href = '/';
      }
    } catch (err) {
      setError('Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container sx={{ py: 8 }}>
      <Paper sx={{ p: 4, maxWidth: 480, mx: 'auto', borderRadius: 4, border: (t) => `1px solid ${t.palette.divider}` }}>
        <Typography variant="h4" fontWeight={900} gutterBottom>Welcome back</Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>Sign in to continue to Excom</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box component="form" onSubmit={onSubmit}>
          <Stack spacing={2.5}>
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
              InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon fontSize="small" /></InputAdornment> }}
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              InputProps={{ startAdornment: <InputAdornment position="start"><LockIcon fontSize="small" /></InputAdornment> }}
            />
            <Button type="submit" variant="contained" size="large" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</Button>
            <Typography variant="body2" color="text.secondary">No account? <Typography component={NextLink as any} href="/auth/register" color="primary" sx={{ textDecoration: 'none', ml: 0.5 }}>Create one</Typography></Typography>
          </Stack>
        </Box>
      </Paper>
    </Container>
  );
}