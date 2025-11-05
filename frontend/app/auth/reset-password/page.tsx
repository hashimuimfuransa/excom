"use client";
import React, { useState, useEffect } from 'react';
import {
  Box, Button, Container, Stack, TextField, Typography, Alert,
  InputAdornment, Card, CardContent, Divider, alpha, useTheme, CircularProgress,
  IconButton
} from '@mui/material';
import {
  Lock as LockIcon, ArrowBack as ArrowBackIcon, Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import NextLink from 'next/link';
import { apiPost } from '@utils/api';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);

  const theme = useTheme();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useTranslation('common');

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    // Validate token on page load
    const validateToken = async () => {
      if (!token || !email) {
        setError(t('auth.invalidResetLink'));
        setValidating(false);
        return;
      }

      try {
        await apiPost('/auth/validate-reset-token', { email, token });
        setIsTokenValid(true);
      } catch (err: any) {
        setError(t('auth.expiredResetLink'));
        setIsTokenValid(false);
      } finally {
        setValidating(false);
      }
    };

    validateToken();
  }, [token, email, t]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError(t('auth.passwordsMustMatch'));
      return;
    }

    if (newPassword.length < 6) {
      setError(t('auth.passwordMinLength'));
      return;
    }

    setLoading(true);

    try {
      if (!token || !email) {
        throw new Error(t('auth.invalidResetLink'));
      }

      await apiPost('/auth/reset-password', {
        email,
        token,
        newPassword
      });
      setSuccess(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  }

  if (validating) {
    return (
      <Box sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <CircularProgress />
      </Box>
    );
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
                {t('auth.resetPassword')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{
                fontSize: { xs: '0.8rem', sm: '0.875rem' }
              }}>
                {t('auth.enterNewPassword')}
              </Typography>
            </Box>

            {success ? (
              <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                {t('auth.passwordResetSuccess')}
              </Alert>
            ) : !isTokenValid ? (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {error || t('auth.expiredResetLink')}
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
                      label={t('forms.newPassword')}
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      fullWidth
                      variant="outlined"
                      disabled={loading}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon color="action" />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              sx={{ p: 1 }}
                            >
                              {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          </InputAdornment>
                        )
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2
                        }
                      }}
                    />

                    <TextField
                      label={t('forms.confirmPassword')}
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      fullWidth
                      variant="outlined"
                      disabled={loading}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon color="action" />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              sx={{ p: 1 }}
                            >
                              {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
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
                      disabled={loading || !newPassword || !confirmPassword}
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
                          {t('common.resetting')}
                        </>
                      ) : (
                        t('auth.resetPassword')
                      )}
                    </Button>
                  </Stack>
                </Box>
              </>
            )}

            <Divider sx={{ my: 3 }} />

            <Box textAlign="center">
              <Typography variant="body2" color="text.secondary">
                {t('auth.needHelp')}{' '}
                <NextLink href="/contact" style={{ color: theme.palette.primary.main, textDecoration: 'none' }}>
                  {t('common.contactSupport')}
                </NextLink>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}