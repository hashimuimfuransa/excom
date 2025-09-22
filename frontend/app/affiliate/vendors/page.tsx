'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, Button, Container, Paper, Stack, TextField, Typography, Alert, 
  Card, CardContent, Divider, Chip, Avatar, Grid, InputAdornment,
  Fade, Slide, useTheme, alpha, CircularProgress, Dialog,
  DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { 
  Search as SearchIcon, Store as StoreIcon, TrendingUp as TrendingUpIcon, People as PeopleIcon, 
  AttachMoney as AttachMoneyIcon, CheckCircle as CheckCircleIcon, Business as BusinessIcon,
  LocationOn as LocationOnIcon, Phone as PhoneIcon, Email as EmailIcon
} from '@mui/icons-material';
import { apiGet } from '@utils/api';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/utils/auth';

interface Vendor {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  country?: string;
  avatar?: string;
  affiliateProgram?: {
    isActive: boolean;
    globalSettings: {
      enabled: boolean;
      defaultCommissionRate: number;
      defaultCommissionType: string;
      autoApproveAffiliates: boolean;
    };
  };
}

export default function VendorSelectionPage() {
  const { user } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchVendors();
  }, []);

  useEffect(() => {
    filterVendors();
  }, [vendors, searchTerm]);

  const fetchVendors = async () => {
    try {
      const response = await apiGet('/sellers');
      setVendors(response);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterVendors = () => {
    if (!searchTerm.trim()) {
      setFilteredVendors(vendors);
      return;
    }

    const filtered = vendors.filter(vendor =>
      vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.country?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredVendors(filtered);
  };

  const handleVendorSelect = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setDialogOpen(true);
  };

  const handleApplyToVendor = () => {
    if (selectedVendor) {
      router.push(`/affiliate/register?vendorId=${selectedVendor._id}&vendorName=${selectedVendor.name}`);
    }
  };

  if (!user) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Please Login
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={3}>
            You need to be logged in to view vendors.
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
    <Box sx={{ 
      minHeight: '100vh', 
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
      py: 4
    }}>
      <Container maxWidth="lg">
        <Box textAlign="center" mb={4}>
          <Typography variant="h3" fontWeight={800} gutterBottom sx={{ 
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Choose Your Vendor Partner
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Browse vendors with active affiliate programs
          </Typography>
        </Box>

        <Card sx={{ borderRadius: 4, boxShadow: '0 20px 40px rgba(0,0,0,0.1)', mb: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <TextField
              fullWidth
              placeholder="Search vendors by name, city, or country..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                )
              }}
              sx={{ 
                mb: 3,
                '& .MuiOutlinedInput-root': { 
                  borderRadius: 2 
                } 
              }}
            />

            {loading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : (
              <Grid container spacing={3}>
                {filteredVendors.map((vendor) => (
                  <Grid item xs={12} md={6} lg={4} key={vendor._id}>
                    <Fade in timeout={800}>
                      <Card sx={{ 
                        height: '100%',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 12px 30px rgba(0,0,0,0.15)'
                        }
                      }}
                      onClick={() => handleVendorSelect(vendor)}
                      >
                        <CardContent sx={{ p: 3 }}>
                          <Box display="flex" alignItems="center" mb={2}>
                            <Avatar sx={{ 
                              width: 60, 
                              height: 60, 
                              mr: 2,
                              bgcolor: 'primary.main'
                            }}>
                              <StoreIcon fontSize="large" />
                            </Avatar>
                            <Box>
                              <Typography variant="h6" fontWeight={600}>
                                {vendor.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {vendor.city}, {vendor.country}
                              </Typography>
                            </Box>
                          </Box>

                          <Stack spacing={1} mb={2}>
                            {vendor.phone && (
                              <Box display="flex" alignItems="center">
                                <PhoneIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary">
                                  {vendor.phone}
                                </Typography>
                              </Box>
                            )}
                            <Box display="flex" alignItems="center">
                              <EmailIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                {vendor.email}
                              </Typography>
                            </Box>
                          </Stack>

                          {vendor.affiliateProgram?.globalSettings?.enabled ? (
                            <Paper sx={{ p: 2, bgcolor: 'success.light', borderRadius: 2 }}>
                              <Box display="flex" alignItems="center" mb={1}>
                                <CheckCircleIcon sx={{ mr: 1, color: 'success.dark' }} />
                                <Typography variant="subtitle2" fontWeight={600} color="success.dark">
                                  Affiliate Program Active
                                </Typography>
                              </Box>
                              <Typography variant="body2" color="success.dark">
                                Commission: {vendor.affiliateProgram.globalSettings.defaultCommissionRate}%
                              </Typography>
                              <Typography variant="body2" color="success.dark">
                                Auto-approval: {vendor.affiliateProgram.globalSettings.autoApproveAffiliates ? 'Yes' : 'No'}
                              </Typography>
                            </Paper>
                          ) : (
                            <Paper sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 2 }}>
                              <Typography variant="body2" color="text.secondary">
                                No active affiliate program
                              </Typography>
                            </Paper>
                          )}

                          <Button
                            variant="contained"
                            fullWidth
                            sx={{ mt: 2, borderRadius: 2 }}
                            disabled={!vendor.affiliateProgram?.globalSettings?.enabled}
                          >
                            {vendor.affiliateProgram?.globalSettings?.enabled ? 'Apply Now' : 'Program Inactive'}
                          </Button>
                        </CardContent>
                      </Card>
                    </Fade>
                  </Grid>
                ))}
              </Grid>
            )}

            {filteredVendors.length === 0 && !loading && (
              <Box textAlign="center" py={4}>
                <Typography variant="h6" color="text.secondary">
                  No vendors found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Try adjusting your search terms
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>

      {/* Vendor Selection Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <StoreIcon sx={{ mr: 1 }} />
            Apply to {selectedVendor?.name}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedVendor && (
            <Stack spacing={2}>
              <Typography variant="body1">
                You're about to apply to become an affiliate for <strong>{selectedVendor.name}</strong>.
              </Typography>
              
              {selectedVendor.affiliateProgram?.globalSettings && (
                <Paper sx={{ p: 2, bgcolor: 'info.light', borderRadius: 2 }}>
                  <Typography variant="subtitle1" fontWeight={600} color="info.dark" gutterBottom>
                    Program Details
                  </Typography>
                  <Stack spacing={1}>
                    <Typography variant="body2" color="info.dark">
                      • Commission Rate: {selectedVendor.affiliateProgram.globalSettings.defaultCommissionRate}%
                    </Typography>
                    <Typography variant="body2" color="info.dark">
                      • Commission Type: {selectedVendor.affiliateProgram.globalSettings.defaultCommissionType}
                    </Typography>
                    <Typography variant="body2" color="info.dark">
                      • Auto-approval: {selectedVendor.affiliateProgram.globalSettings.autoApproveAffiliates ? 'Yes' : 'No'}
                    </Typography>
                  </Stack>
                </Paper>
              )}

              <Typography variant="body2" color="text.secondary">
                You'll be redirected to complete your affiliate application with additional details.
              </Typography>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleApplyToVendor}
            variant="contained"
            disabled={!selectedVendor?.affiliateProgram?.globalSettings?.enabled}
          >
            Continue Application
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
