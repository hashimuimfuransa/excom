"use client";
import React, { useState } from 'react';
import { Box, Button, Container, Paper, Stack, TextField, Typography, Alert, InputAdornment } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import NextLink from 'next/link';
import { apiPost } from '@utils/api';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'buyer' | 'seller'>('buyer');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await apiPost<{ id: string }>("/auth/register", { name, email, password, role });
      setSuccess('Account created. You can log in now.');
    } catch (err) {
      setError('Registration failed. Email may be in use.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container sx={{ py: 8 }}>
      <Paper sx={{ p: 4, maxWidth: 520, mx: 'auto', borderRadius: 4, border: (t) => `1px solid ${t.palette.divider}` }}>
        <Typography variant="h4" fontWeight={900} gutterBottom>Create account</Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>Join Excom to start shopping or selling</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        <Box component="form" onSubmit={onSubmit}>
          <Stack spacing={2.5}>
            <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} required fullWidth InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon fontSize="small" /></InputAdornment> }} />
            <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required fullWidth InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon fontSize="small" /></InputAdornment> }} />
            <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required fullWidth InputProps={{ startAdornment: <InputAdornment position="start"><LockIcon fontSize="small" /></InputAdornment> }} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button variant={role === 'buyer' ? 'contained' : 'outlined'} onClick={() => setRole('buyer')} sx={{ flex: 1 }}>Buyer</Button>
              <Button variant={role === 'seller' ? 'contained' : 'outlined'} onClick={() => setRole('seller')} sx={{ flex: 1 }}>Vendor</Button>
            </Stack>
            <Button type="submit" variant="contained" size="large" disabled={loading}>{loading ? 'Creating...' : 'Create account'}</Button>
            <Typography variant="body2" color="text.secondary">Already have an account? <Typography component={NextLink as any} href="/auth/login" color="primary" sx={{ textDecoration: 'none', ml: 0.5 }}>Sign in</Typography></Typography>
          </Stack>
        </Box>
      </Paper>
    </Container>
  );
}