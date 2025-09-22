'use client';

import React, { useState } from 'react';
import { 
  Alert, Box, Button, Card, CardContent, Container, Grid, LinearProgress, 
  Paper, Stack, TextField, Typography, Divider, Avatar, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, FormControl, InputLabel,
  Select, MenuItem, IconButton, Tooltip
} from '@mui/material';
import { 
  PersonAdd,
  Instagram,
  VideoLibrary,
  Facebook,
  Twitter,
  YouTube
} from '@mui/icons-material';
import { apiPost } from '@utils/api';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/utils/auth';
import { useTranslation } from 'react-i18next';

export default function AffiliateRegisterPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    vendorId: '',
    socialMediaHandles: {
      instagram: '',
      tiktok: '',
      facebook: '',
      twitter: '',
      youtube: ''
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await apiPost("/affiliate/register", formData);
      if (response) {
        router.push('/dashboard/affiliate');
      }
    } catch (error: any) {
      console.error('Error registering affiliate:', error);
      // Handle error - you could show a snackbar or alert
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('socialMediaHandles.')) {
      const socialField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        socialMediaHandles: {
          ...prev.socialMediaHandles,
          [socialField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  if (!user) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 2, width: 80, height: 80 }}>
            <PersonAdd fontSize="large" />
          </Avatar>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Please Login
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={3}>
            You need to be logged in to register as an affiliate.
          </Typography>
          <Button 
            variant="contained" 
            size="large"
            onClick={() => router.push('/auth/login')}
          >
            Login
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box mb={4} textAlign="center">
        <Typography variant="h3" fontWeight={700} gutterBottom>
          Become an Affiliate
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Join our affiliate program and start earning commissions
        </Typography>
      </Box>

      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Affiliate Application
          </Typography>
          
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="Vendor ID"
                value={formData.vendorId}
                onChange={(e) => handleInputChange('vendorId', e.target.value)}
                placeholder="Enter the vendor ID you want to affiliate with"
                required
                helperText="You can find vendor IDs in the vendors page or by asking the vendor directly."
              />

              <Divider>
                <Typography variant="subtitle1" fontWeight={600}>
                  Social Media Handles (Optional)
                </Typography>
              </Divider>
              
              <Typography variant="body2" color="text.secondary">
                Share your social media profiles to help vendors understand your reach
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Instagram"
                    value={formData.socialMediaHandles.instagram}
                    onChange={(e) => handleInputChange('socialMediaHandles.instagram', e.target.value)}
                    placeholder="@yourusername"
                    InputProps={{
                      startAdornment: <Instagram sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="TikTok"
                    value={formData.socialMediaHandles.tiktok}
                    onChange={(e) => handleInputChange('socialMediaHandles.tiktok', e.target.value)}
                    placeholder="@yourusername"
                    InputProps={{
                      startAdornment: <VideoLibrary sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Facebook"
                    value={formData.socialMediaHandles.facebook}
                    onChange={(e) => handleInputChange('socialMediaHandles.facebook', e.target.value)}
                    placeholder="Your Facebook page name"
                    InputProps={{
                      startAdornment: <Facebook sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Twitter"
                    value={formData.socialMediaHandles.twitter}
                    onChange={(e) => handleInputChange('socialMediaHandles.twitter', e.target.value)}
                    placeholder="@yourusername"
                    InputProps={{
                      startAdornment: <Twitter sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="YouTube"
                    value={formData.socialMediaHandles.youtube}
                    onChange={(e) => handleInputChange('socialMediaHandles.youtube', e.target.value)}
                    placeholder="Your YouTube channel name"
                    InputProps={{
                      startAdornment: <YouTube sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>
              </Grid>

              <Paper sx={{ p: 3, bgcolor: 'info.light', borderRadius: 2 }}>
                <Typography variant="subtitle1" fontWeight={600} color="info.dark" gutterBottom>
                  What happens next?
                </Typography>
                <Stack spacing={1}>
                  <Typography variant="body2" color="info.dark">
                    • Your application will be reviewed by the vendor
                  </Typography>
                  <Typography variant="body2" color="info.dark">
                    • Once approved, you'll receive a unique referral code
                  </Typography>
                  <Typography variant="body2" color="info.dark">
                    • You can start sharing affiliate links and earning commissions
                  </Typography>
                  <Typography variant="body2" color="info.dark">
                    • Track your performance in your affiliate dashboard
                  </Typography>
                </Stack>
              </Paper>

              <Button 
                type="submit" 
                variant="contained" 
                size="large" 
                fullWidth
                disabled={loading}
                sx={{ py: 1.5 }}
              >
                {loading ? 'Submitting...' : 'Submit Application'}
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}