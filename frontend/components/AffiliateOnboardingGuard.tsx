'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/utils/auth';
import { 
  Box, Container, Paper, Typography, Button, Avatar, Stack,
  Card, CardContent, Divider, Chip, useTheme, alpha
} from '@mui/material';
import { 
  TrendingUp as TrendingUpIcon, 
  CheckCircle as CheckCircleIcon,
  ArrowForward as ArrowForwardIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';

interface AffiliateOnboardingGuardProps {
  children: React.ReactNode;
}

export default function AffiliateOnboardingGuard({ children }: AffiliateOnboardingGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const theme = useTheme();

  useEffect(() => {
    if (!loading && user?.role === 'affiliate' && !user?.affiliateOnboardingCompleted) {
      router.push('/affiliate/onboarding');
    }
  }, [user, loading, router]);

  // Show loading while checking auth
  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <Typography>Loading...</Typography>
        </Box>
      </Container>
    );
  }

  // Show onboarding prompt if affiliate hasn't completed onboarding
  if (user?.role === 'affiliate' && !user?.affiliateOnboardingCompleted) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
        display: 'flex',
        alignItems: 'center',
        py: 4
      }}>
        <Container maxWidth="md">
          <Card sx={{ 
            borderRadius: 4, 
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
          }}>
            <CardContent sx={{ p: 6, textAlign: 'center' }}>
              <Avatar sx={{ 
                width: 100, 
                height: 100, 
                mx: 'auto', 
                mb: 3,
                bgcolor: 'warning.main'
              }}>
                <DescriptionIcon fontSize="large" />
              </Avatar>
              
              <Typography variant="h4" fontWeight={700} gutterBottom>
                Complete Your Affiliate Setup
              </Typography>
              
              <Typography variant="h6" color="text.secondary" paragraph>
                Welcome to the Excom Affiliate Program! Before you can access your dashboard, 
                please complete the onboarding process.
              </Typography>

              <Divider sx={{ my: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  What you'll need to complete:
                </Typography>
              </Divider>

              <Stack spacing={2} sx={{ mb: 4 }}>
                <Box display="flex" alignItems="center" gap={2}>
                  <CheckCircleIcon color="primary" />
                  <Typography variant="body1">
                    Read and accept our affiliate program guidelines
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={2}>
                  <CheckCircleIcon color="primary" />
                  <Typography variant="body1">
                    Provide your personal details and contact information
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={2}>
                  <CheckCircleIcon color="primary" />
                  <Typography variant="body1">
                    Share your social media handles (optional)
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={2}>
                  <CheckCircleIcon color="primary" />
                  <Typography variant="body1">
                    Select a vendor partner to work with
                  </Typography>
                </Box>
              </Stack>

              <Paper sx={{ p: 3, bgcolor: 'info.light', borderRadius: 2, mb: 4 }}>
                <Typography variant="subtitle1" fontWeight={600} color="info.dark" gutterBottom>
                  💡 Why Complete Onboarding?
                </Typography>
                <Typography variant="body2" color="info.dark">
                  Completing the onboarding process ensures you understand our guidelines, 
                  helps vendors learn about your reach, and gets you approved faster. 
                  You'll also receive your unique referral code to start earning commissions!
                </Typography>
              </Paper>

              <Button
                variant="contained"
                size="large"
                endIcon={<ArrowForwardIcon />}
                onClick={() => router.push('/affiliate/onboarding')}
                sx={{ 
                  py: 1.5, 
                  px: 4,
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
                Start Onboarding Process
              </Button>

              <Box mt={3}>
                <Typography variant="body2" color="text.secondary">
                  Need help? Contact our support team
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Container>
      </Box>
    );
  }

  // Render children if user has completed onboarding or is not an affiliate
  return <>{children}</>;
}
