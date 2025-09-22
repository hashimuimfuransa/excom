"use client";
import React, { useState, useEffect } from 'react';
import { 
  Box, Button, Container, Paper, Stack, TextField, Typography, Alert, 
  InputAdornment, Card, CardContent, Divider, Chip, Avatar, Grid,
  Fade, Slide, useTheme, alpha, Stepper, Step, StepLabel, StepContent,
  FormControl, FormLabel, RadioGroup, FormControlLabel, Radio
} from '@mui/material';
import { 
  Person as PersonIcon, Email as EmailIcon, Lock as LockIcon, Store as StoreIcon, TrendingUp as TrendingUpIcon, 
  Visibility as VisibilityIcon, VisibilityOff as VisibilityOffIcon, CheckCircle as CheckCircleIcon, ArrowForward as ArrowForwardIcon,
  PersonAdd as PersonAddIcon, ShoppingCart as ShoppingCartIcon, Business as BusinessIcon, AttachMoney as AttachMoneyIcon
} from '@mui/icons-material';
import NextLink from 'next/link';
import { apiPost } from '@utils/api';
import { useSearchParams, useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState<'buyer' | 'seller' | 'affiliate'>('buyer');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const theme = useTheme();
  
  const accountType = searchParams.get('type') as 'buyer' | 'seller' | 'affiliate' | null;

  useEffect(() => {
    if (accountType && ['buyer', 'seller', 'affiliate'].includes(accountType)) {
      setRole(accountType);
    }
  }, [accountType]);

  const steps = [
    'Account Type',
    'Basic Information', 
    'Account Creation'
  ];

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const validateForm = () => {
    if (!name.trim()) {
      setError('Name is required');
      return false;
    }
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      await apiPost<{ id: string }>("/auth/register", { name, email, password, role });
      setSuccess('Account created successfully!');
      
      // Redirect based on role
      setTimeout(() => {
        if (role === 'affiliate') {
          router.push('/affiliate/onboarding');
        } else {
          router.push('/auth/login');
        }
      }, 2000);
    } catch (err) {
      setError('Registration failed. Email may be in use.');
    } finally {
      setLoading(false);
    }
  }

  const getRoleIcon = (roleType: string) => {
    switch (roleType) {
      case 'buyer': return <ShoppingCartIcon />;
      case 'seller': return <BusinessIcon />;
      case 'affiliate': return <AttachMoneyIcon />;
      default: return <PersonIcon />;
    }
  };

  const getRoleDescription = (roleType: string) => {
    switch (roleType) {
      case 'buyer': return 'Shop and discover amazing products';
      case 'seller': return 'Sell your products and grow your business';
      case 'affiliate': return 'Earn commissions by promoting products';
      default: return '';
    }
  };

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
          {/* Left side - Account Type Selection */}
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
                  <PersonAddIcon fontSize="inherit" />
                </Avatar>
                <Typography variant="h3" fontWeight={800} gutterBottom sx={{ 
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Join Excom Today
                </Typography>
                <Typography variant="h6" color="text.secondary" paragraph>
                  Choose your account type and start your journey
                </Typography>
                
                {/* Account Type Cards */}
                <Stack spacing={2} sx={{ mt: 4 }}>
                  {['buyer', 'seller', 'affiliate'].map((roleType) => (
                    <Card 
                      key={roleType}
                      sx={{ 
                        cursor: 'pointer',
                        border: role === roleType ? `2px solid ${theme.palette.primary.main}` : '1px solid transparent',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                        }
                      }}
                      onClick={() => setRole(roleType as any)}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar sx={{ 
                            bgcolor: role === roleType ? 'primary.main' : 'grey.200',
                            color: role === roleType ? 'white' : 'grey.600'
                          }}>
                            {getRoleIcon(roleType)}
                          </Avatar>
                          <Box>
                            <Typography variant="h6" fontWeight={600} textTransform="capitalize">
                              {roleType === 'seller' ? 'Vendor' : roleType}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {getRoleDescription(roleType)}
                            </Typography>
                          </Box>
                          {role === roleType && (
                            <CheckCircleIcon color="primary" sx={{ ml: 'auto' }} />
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </Box>
            </Fade>
          </Grid>

          {/* Right side - Registration Form */}
          <Grid item xs={12} md={6}>
            <Slide direction="left" in timeout={800}>
              <Card sx={{ 
                maxWidth: 520, 
                mx: 'auto', 
                borderRadius: 4, 
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
              }}>
                <CardContent sx={{ p: 4 }}>
                  <Box textAlign="center" mb={3}>
                    <Typography variant="h4" fontWeight={700} gutterBottom>
                      Create Your Account
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {role === 'affiliate' ? 'Start earning commissions' : 'Join our community'}
                    </Typography>
                  </Box>

                  {error && (
                    <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                      {error}
                    </Alert>
                  )}

                  {success && (
                    <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                      {success}
                    </Alert>
                  )}

                  <Box component="form" onSubmit={onSubmit}>
                    <Stack spacing={3}>
                      <TextField
                        label="Full Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        fullWidth
                        variant="outlined"
                        InputProps={{ 
                          startAdornment: (
                            <InputAdornment position="start">
                              <PersonIcon color="action" />
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

                      <TextField
                        label="Confirm Password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
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
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                sx={{ minWidth: 'auto', p: 1 }}
                              >
                                {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
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

                      {role === 'affiliate' && (
                        <Paper sx={{ p: 2, bgcolor: 'info.light', borderRadius: 2 }}>
                          <Typography variant="subtitle2" fontWeight={600} color="info.dark" gutterBottom>
                            🎉 Affiliate Program Benefits
                          </Typography>
                          <Typography variant="body2" color="info.dark">
                            • Earn up to 10% commission on sales<br/>
                            • Access to exclusive promotional materials<br/>
                            • Real-time analytics and reporting<br/>
                            • Dedicated affiliate support team
                          </Typography>
                        </Paper>
                      )}

                      <Button 
                        type="submit" 
                        variant="contained" 
                        size="large" 
                        disabled={loading}
                        endIcon={<ArrowForwardIcon />}
                        sx={{ 
                          py: 1.5, 
                          borderRadius: 2,
                          background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                          '&:hover': {
                            background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                          }
                        }}
                      >
                        {loading ? 'Creating Account...' : `Create ${role === 'seller' ? 'Vendor' : role} Account`}
                      </Button>

                      <Divider sx={{ my: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Already have an account?
                        </Typography>
                      </Divider>

                      <Button 
                        component={NextLink as any} 
                        href="/auth/login"
                        variant="outlined"
                        fullWidth
                        sx={{ borderRadius: 2 }}
                      >
                        Sign In Instead
                      </Button>
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