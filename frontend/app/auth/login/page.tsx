"use client";
import React, { useState } from 'react';
import { 
  Box, Button, Container, Paper, Stack, TextField, Typography, Alert, 
  InputAdornment, Card, CardContent, Divider, Chip, Avatar, Grid,
  Fade, Slide, useTheme, alpha, IconButton, Tooltip, LinearProgress
} from '@mui/material';
import { 
  Email as EmailIcon, Lock as LockIcon, Login as LoginIcon, Person as PersonIcon, Store as StoreIcon, 
  TrendingUp as TrendingUpIcon, Visibility as VisibilityIcon, VisibilityOff as VisibilityOffIcon 
} from '@mui/icons-material';
import NextLink from 'next/link';
import { apiPost } from '@utils/api';
import { useAuth } from '@utils/auth.tsx';
import { useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginProgress, setLoginProgress] = useState(0);
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const theme = useTheme();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setLoginProgress(0);
    
    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setLoginProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      const { token } = await apiPost<{ token: string }>("/auth/login", { email, password });
      setLoginProgress(50);
      
      await login(token);
      setLoginProgress(75);
      
      // Check if there's a redirect parameter
      if (redirect) {
        setLoginProgress(100);
        setTimeout(() => {
          window.location.href = `/${redirect}`;
        }, 500);
        return;
      }
      
      // fetch role and redirect accordingly
      const me = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000/api'}/auth/me`, { 
        headers: { Authorization: `Bearer ${token}` } 
      }).then(r => r.json());
      
      setLoginProgress(100);
      
      setTimeout(() => {
        if (me?.role === 'seller') {
          window.location.href = '/dashboard/vendor';
        } else if (me?.role === 'admin') {
          window.location.href = '/dashboard/admin';
        } else if (me?.role === 'affiliate') {
          // Check if affiliate has completed onboarding
          if (!me?.affiliateOnboardingCompleted) {
            window.location.href = '/affiliate/onboarding';
          } else {
            window.location.href = '/dashboard/affiliate';
          }
        } else {
          window.location.href = '/';
        }
      }, 500);
    } catch (err) {
      setError('Login failed. Check your credentials.');
      setLoginProgress(0);
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
      py: 4
    }}>
      <Container maxWidth="lg">
        <Grid container spacing={4} alignItems="center">
          {/* Left side - Branding */}
          <Grid item xs={12} md={6}>
            <Fade in timeout={1000}>
              <Box textAlign="center" sx={{ mb: { xs: 4, md: 0 } }}>
                <Avatar sx={{ 
                  width: 120, 
                  height: 120, 
                  mx: 'auto', 
                  mb: 3,
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  fontSize: '3rem'
                }}>
                  <StoreIcon fontSize="inherit" />
                </Avatar>
                <Typography variant="h3" fontWeight={800} gutterBottom sx={{ 
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Welcome to Excom
                </Typography>
                <Typography variant="h6" color="text.secondary" paragraph>
                  Your gateway to seamless e-commerce and affiliate opportunities
                </Typography>
                
                {/* Feature highlights */}
                <Stack spacing={2} sx={{ mt: 4 }}>
                  <Box display="flex" alignItems="center" justifyContent="center" gap={2} flexWrap="wrap">
                    <Chip 
                      icon={<PersonIcon />} 
                      label="Buyer Account" 
                      variant="outlined" 
                      sx={{ 
                        transition: 'all 0.3s ease',
                        '&:hover': { 
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          transform: 'scale(1.05)'
                        }
                      }} 
                    />
                    <Chip 
                      icon={<StoreIcon />} 
                      label="Vendor Account" 
                      variant="outlined" 
                      sx={{ 
                        transition: 'all 0.3s ease',
                        '&:hover': { 
                          backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                          transform: 'scale(1.05)'
                        }
                      }} 
                    />
                    <Chip 
                      icon={<TrendingUpIcon />} 
                      label="Affiliate Program" 
                      variant="outlined" 
                      color="primary" 
                      sx={{ 
                        transition: 'all 0.3s ease',
                        '&:hover': { 
                          backgroundColor: alpha(theme.palette.success.main, 0.1),
                          transform: 'scale(1.05)'
                        }
                      }} 
                    />
                  </Box>
                  
                  {/* Stats */}
                  <Box sx={{ mt: 3 }}>
                    <Grid container spacing={2} textAlign="center">
                      <Grid item xs={4}>
                        <Typography variant="h4" fontWeight={700} color="primary">
                          10K+
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Active Users
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="h4" fontWeight={700} color="secondary">
                          500+
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Vendors
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="h4" fontWeight={700} color="success.main">
                          1K+
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Affiliates
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Stack>
              </Box>
            </Fade>
          </Grid>

          {/* Right side - Login Form */}
          <Grid item xs={12} md={6}>
            <Slide direction="left" in timeout={800}>
              <Card sx={{ 
                maxWidth: 480, 
                mx: 'auto', 
                borderRadius: 4, 
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
              }}>
                <CardContent sx={{ p: 4 }}>
                  <Box textAlign="center" mb={3}>
                    <Typography variant="h4" fontWeight={700} gutterBottom>
                      Welcome Back
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Sign in to continue your journey
                    </Typography>
                  </Box>

                  {error && (
                    <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                      {error}
                    </Alert>
                  )}

                  <Box component="form" onSubmit={onSubmit}>
                    <Stack spacing={3}>
                      <TextField
                        label="Email Address"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        fullWidth
                        variant="outlined"
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
                      
                      <TextField
                        label="Password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        fullWidth
                        variant="outlined"
                        InputProps={{ 
                          startAdornment: (
                            <InputAdornment position="start">
                              <LockIcon color="action" />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <Button
                                onClick={() => setShowPassword(!showPassword)}
                                sx={{ minWidth: 'auto', p: 1 }}
                              >
                                {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                              </Button>
                            </InputAdornment>
                          )
                        }}
                        sx={{ 
                          '& .MuiOutlinedInput-root': { 
                            borderRadius: 2 
                          } 
                        }}
                      />

                      {loading && (
                        <LinearProgress 
                          variant="determinate" 
                          value={loginProgress} 
                          sx={{ 
                            mb: 2, 
                            borderRadius: 1,
                            height: 6,
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 1,
                              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                            }
                          }} 
                        />
                      )}

                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                        <Box display="flex" alignItems="center">
                          <input
                            type="checkbox"
                            id="rememberMe"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            style={{ marginRight: 8 }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            Remember me
                          </Typography>
                        </Box>
                        <Typography 
                          variant="body2" 
                          color="primary" 
                          sx={{ cursor: 'pointer', textDecoration: 'underline' }}
                        >
                          Forgot password?
                        </Typography>
                      </Box>

                      <Button 
                        type="submit" 
                        variant="contained" 
                        size="large" 
                        disabled={loading}
                        startIcon={<LoginIcon />}
                        sx={{ 
                          py: 1.5, 
                          borderRadius: 2,
                          background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                          '&:hover': {
                            background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                            transform: 'translateY(-2px)',
                            boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                          },
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {loading ? `Signing in... ${loginProgress}%` : 'Sign In'}
                      </Button>

                      {/* Social Login Options */}
                      <Box sx={{ mt: 3 }}>
                        <Typography variant="body2" color="text.secondary" textAlign="center" mb={2}>
                          Or continue with
                        </Typography>
                        <Stack direction="row" spacing={2} justifyContent="center">
                          <Button
                            variant="outlined"
                            sx={{ 
                              borderRadius: 2,
                              flex: 1,
                              py: 1,
                              borderColor: '#db4437',
                              color: '#db4437',
                              '&:hover': {
                                borderColor: '#db4437',
                                backgroundColor: alpha('#db4437', 0.1)
                              }
                            }}
                          >
                            Google
                          </Button>
                          <Button
                            variant="outlined"
                            sx={{ 
                              borderRadius: 2,
                              flex: 1,
                              py: 1,
                              borderColor: '#1877f2',
                              color: '#1877f2',
                              '&:hover': {
                                borderColor: '#1877f2',
                                backgroundColor: alpha('#1877f2', 0.1)
                              }
                            }}
                          >
                            Facebook
                          </Button>
                        </Stack>
                      </Box>

                      <Divider sx={{ my: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                          New to Excom?
                        </Typography>
                      </Divider>

                      <Box textAlign="center">
                        <Typography variant="body2" color="text.secondary" mb={2}>
                          Choose your account type:
                        </Typography>
                        <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
                          <Button 
                            component={NextLink as any} 
                            href="/auth/register?type=buyer"
                            variant="outlined"
                            startIcon={<PersonIcon />}
                            sx={{ 
                              borderRadius: 2,
                              minWidth: 120,
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                                borderColor: theme.palette.primary.main,
                                color: theme.palette.primary.main
                              }
                            }}
                          >
                            Buyer
                          </Button>
                          <Button 
                            component={NextLink as any} 
                            href="/auth/register?type=seller"
                            variant="outlined"
                            startIcon={<StoreIcon />}
                            sx={{ 
                              borderRadius: 2,
                              minWidth: 120,
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                                borderColor: theme.palette.secondary.main,
                                color: theme.palette.secondary.main
                              }
                            }}
                          >
                            Vendor
                          </Button>
                          <Button 
                            component={NextLink as any} 
                            href="/auth/register?type=affiliate"
                            variant="contained"
                            startIcon={<TrendingUpIcon />}
                            sx={{ 
                              borderRadius: 2,
                              minWidth: 120,
                              background: `linear-gradient(45deg, ${theme.palette.success.main}, ${theme.palette.info.main})`,
                              '&:hover': {
                                background: `linear-gradient(45deg, ${theme.palette.success.dark}, ${theme.palette.info.dark})`,
                                transform: 'translateY(-2px)',
                                boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                              },
                              transition: 'all 0.3s ease'
                            }}
                          >
                            Affiliate
                          </Button>
                        </Stack>
                      </Box>
                    </Stack>
                  </Box>
                </CardContent>
              </Card>
            </Slide>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}