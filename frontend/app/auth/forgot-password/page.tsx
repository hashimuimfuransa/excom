"use client";
import React, { useState } from 'react';
import {
  Box, Button, Container, Paper, Stack, TextField, Typography, Alert,
  InputAdornment, Card, CardContent, Divider, alpha, useTheme, CircularProgress
} from '@mui/material';
import {
  Email as EmailIcon, ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import NextLink from 'next/link';
import { apiPost } from '@utils/api';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  const { t } = useTranslation('common');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await apiPost('/auth/forgot-password', { email });
      setSuccess(true);
      setEmail('');
    } catch (err: any) {
      setError(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
      display: 'flex',
      alignItems: 'center',
      py: { xs: 2, sm: 4 },
      px: { xs: 1, sm: 2 }
    }}>
      {/* Language Switcher */}
      <Box sx={{
        position: 'fixed',
        top: { xs: 16, sm: 24 },
        right: { xs: 16, sm: 24 },
        zIndex: 1000
      }}>
        <LanguageSwitcher />
      </Box>

      <Container maxWidth="sm">
        <Card sx={{
          borderRadius: { xs: 2, sm: 4 },
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
        }}>
          <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
            {/* Back Button */}
            <Button
              component={NextLink}
              href="/auth/login"
              startIcon={<ArrowBackIcon />}
              sx={{ mb: 2, textTransform: 'none' }}
            >
              {t('common.backToLogin')}
            </Button>

            <Box textAlign="center" mb={3}>
              <Typography variant="h4" fontWeight={700} gutterBottom sx={{
                fontSize: { xs: '1.5rem', sm: '2rem' }
              }}>
                {t('auth.forgotPassword')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{
                fontSize: { xs: '0.8rem', sm: '0.875rem' }
              }}>
                {t('auth.forgotPasswordDescription')}
              </Typography>
            </Box>

            {success ? (
              <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                {t('auth.resetLinkSent')}
              </Alert>
            ) : (
              <>
                {error && (
                  <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                    {error}
                  </Alert>
                )}

                <Box component="form" onSubmit={onSubmit}>
                  <Stack spacing={3}>
                    <TextField
                      label={t('forms.email')}
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      fullWidth
                      variant="outlined"
                      disabled={loading}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon color="action" />
                          </InputAdornment>
                        )
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2
                        }
                      }}
                    />

                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      size="large"
                      disabled={loading || !email}
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontSize: '1rem',
                        py: 1.5
                      }}
                    >
                      {loading ? (
                        <>
                          <CircularProgress size={20} sx={{ mr: 1 }} />
                          {t('common.sending')}
                        </>
                      ) : (
                        t('auth.sendResetLink')
                      )}
                    </Button>
                  </Stack>
                </Box>
              </>
            )}

            <Divider sx={{ my: 3 }} />

            <Box textAlign="center">
              <Typography variant="body2" color="text.secondary">
                {t('auth.rememberPassword')}{' '}
                <NextLink href="/auth/login" style={{ color: theme.palette.primary.main, textDecoration: 'none' }}>
                  {t('auth.loginHere')}
                </NextLink>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}