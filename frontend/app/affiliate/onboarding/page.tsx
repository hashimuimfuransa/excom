'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, Button, Container, Paper, Stack, TextField, Typography, Alert, 
  Card, CardContent, Divider, Chip, Avatar, Grid, Stepper, Step, StepLabel,
  FormControl, InputLabel, Select, MenuItem, FormControlLabel, Checkbox,
  Fade, Slide, useTheme, alpha, IconButton, Tooltip
} from '@mui/material';
import { 
  TrendingUp as TrendingUpIcon, ArrowForward as ArrowForwardIcon, ArrowBack as ArrowBackIcon, CheckCircle as CheckCircleIcon,
  Business as BusinessIcon, AttachMoney as AttachMoneyIcon, People as PeopleIcon, Description as DescriptionIcon,
  Phone as PhoneIcon, Email as EmailIcon, LocationOn as LocationOnIcon,
  Camera as InstagramIcon, Videocam as TikTokIcon, Group as FacebookIcon, Chat as TwitterIcon, PlayArrow as YouTubeIcon
} from '@mui/icons-material';
import { apiPost, apiGet } from '@utils/api';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/utils/auth';

// Vendor Selection Component
interface Vendor {
  id: string;
  name: string;
  storeName: string;
  description: string;
  commissionRate: number;
  commissionType: 'percentage' | 'fixed';
  minCommission: number;
  maxCommission: number;
  autoApproval: boolean;
  productCount: number;
  categoryCount: number;
  rating: number;
  logo?: string;
  categories: string[];
}

interface VendorSelectionSectionProps {
  selectedVendor: string;
  onVendorSelect: (vendorId: string, vendorName: string) => void;
}

function VendorSelectionSection({ selectedVendor, onVendorSelect }: VendorSelectionSectionProps) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Fetch vendors from API
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (selectedCategory) params.append('category', selectedCategory);
        
        const data = await apiGet<{ vendors: Vendor[] }>(`/affiliate/vendors?${params.toString()}`);
        setVendors(data.vendors || []);
      } catch (error) {
        console.error('Error fetching vendors:', error);
        setVendors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVendors();
  }, [searchTerm, selectedCategory]);

  const allCategories = Array.from(new Set(vendors.flatMap(v => v.categories)));

  if (loading) {
    return (
      <Box textAlign="center" py={4}>
        <Typography>Loading vendors...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Search and Filter */}
      <Paper 
        sx={{ 
          p: { xs: 2, sm: 3 }, 
          mb: { xs: 3, sm: 4 },
          borderRadius: { xs: 2, sm: 3 },
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(0, 0, 0, 0.05)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}
      >
        <Typography 
          variant="h6" 
          fontWeight={600} 
          mb={{ xs: 2, sm: 2.5 }}
          sx={{ 
            fontSize: { xs: '1rem', sm: '1.25rem' },
            color: 'primary.main'
          }}
        >
          🔍 Find Your Perfect Partner
        </Typography>
        
        <Grid container spacing={{ xs: 2, sm: 3 }}>
          <Grid item xs={12} sm={8}>
            <TextField
              fullWidth
              label="Search vendors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, store, or description"
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: { xs: 2, sm: 2.5 },
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  },
                  '&.Mui-focused': {
                    backgroundColor: 'rgba(255, 255, 255, 1)',
                    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.15)'
                  }
                }
              }}
              InputProps={{
                startAdornment: (
                  <BusinessIcon 
                    sx={{ 
                      mr: 1, 
                      color: 'primary.main',
                      fontSize: { xs: '1.2rem', sm: '1.5rem' }
                    }} 
                  />
                )
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl 
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: { xs: 2, sm: 2.5 },
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  },
                  '&.Mui-focused': {
                    backgroundColor: 'rgba(255, 255, 255, 1)',
                    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.15)'
                  }
                }
              }}
            >
              <InputLabel>Category Filter</InputLabel>
              <Select
                value={selectedCategory}
                label="Category Filter"
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <MenuItem value="">
                  <Box display="flex" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      🌟 All Categories
                    </Typography>
                  </Box>
                </MenuItem>
                {allCategories.map(category => (
                  <MenuItem key={category} value={category}>
                    <Box display="flex" alignItems="center">
                      <Typography variant="body2">{category}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        
        {/* Results Count */}
        {vendors.length > 0 && (
          <Box 
            mt={{ xs: 2, sm: 2.5 }}
            textAlign="center"
          >
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
            >
              Found {vendors.length} vendor{vendors.length !== 1 ? 's' : ''} matching your criteria
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Vendor Cards */}
      <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
        {vendors.map((vendor) => (
          <Grid item xs={12} sm={6} lg={4} key={vendor.id}>
            <Card 
              sx={{ 
                height: '100%',
                cursor: 'pointer',
                border: selectedVendor === vendor.id ? 3 : 1,
                borderColor: selectedVendor === vendor.id ? 'primary.main' : 'divider',
                borderRadius: { xs: 2, sm: 3 },
                overflow: 'hidden',
                position: 'relative',
                background: selectedVendor === vendor.id 
                  ? 'linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(25, 118, 210, 0.02) 100%)'
                  : 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.8) 100%)',
                backdropFilter: 'blur(10px)',
                '&:hover': {
                  boxShadow: selectedVendor === vendor.id 
                    ? '0 20px 40px rgba(25, 118, 210, 0.15)' 
                    : '0 15px 35px rgba(0, 0, 0, 0.1)',
                  transform: 'translateY(-8px) scale(1.02)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  borderColor: selectedVendor === vendor.id ? 'primary.main' : 'primary.light'
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 4,
                  background: selectedVendor === vendor.id 
                    ? 'linear-gradient(90deg, #1976d2, #42a5f5)' 
                    : 'linear-gradient(90deg, #e0e0e0, #f5f5f5)',
                  transition: 'all 0.3s ease'
                }
              }}
              onClick={() => onVendorSelect(vendor.id, vendor.name)}
            >
              {/* Selection Badge */}
              {selectedVendor === vendor.id && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    zIndex: 2,
                    bgcolor: 'primary.main',
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                    animation: 'pulse 2s infinite'
                  }}
                >
                  <CheckCircleIcon sx={{ color: 'white', fontSize: 20 }} />
                </Box>
              )}

              <CardContent sx={{ p: { xs: 2.5, sm: 3, md: 3.5 } }}>
                {/* Vendor Header */}
                <Box display="flex" alignItems="center" mb={{ xs: 2, sm: 2.5 }}>
                  <Avatar 
                    sx={{ 
                      width: { xs: 45, sm: 55, md: 60 }, 
                      height: { xs: 45, sm: 55, md: 60 }, 
                      mr: { xs: 1.5, sm: 2 },
                      bgcolor: 'primary.main',
                      boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)',
                      fontSize: { xs: '1.2rem', sm: '1.5rem' }
                    }}
                  >
                    <BusinessIcon />
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography 
                      variant="h6" 
                      fontWeight={700} 
                      sx={{ 
                        fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
                        mb: 0.5,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {vendor.name}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ 
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {vendor.storeName}
                    </Typography>
                  </Box>
                </Box>

                {/* Description */}
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ 
                    mb: { xs: 2, sm: 2.5 }, 
                    minHeight: { xs: 36, sm: 40 },
                    fontSize: { xs: '0.8rem', sm: '0.875rem' },
                    lineHeight: 1.4,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  {vendor.description}
                </Typography>

                {/* Commission Info */}
                <Paper 
                  sx={{ 
                    p: { xs: 1.5, sm: 2 }, 
                    mb: { xs: 2, sm: 2.5 }, 
                    bgcolor: selectedVendor === vendor.id 
                      ? 'linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, rgba(25, 118, 210, 0.05) 100%)'
                      : 'linear-gradient(135deg, rgba(76, 175, 80, 0.08) 0%, rgba(76, 175, 80, 0.03) 100%)',
                    borderRadius: { xs: 2, sm: 2.5 },
                    border: `1px solid ${selectedVendor === vendor.id ? 'rgba(25, 118, 210, 0.2)' : 'rgba(76, 175, 80, 0.2)'}`,
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography 
                      variant="subtitle2" 
                      fontWeight={600}
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      Commission Rate
                    </Typography>
                    <Typography 
                      variant="h5" 
                      fontWeight={800}
                      sx={{
                        fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                        color: selectedVendor === vendor.id ? 'primary.main' : 'success.main',
                        textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    >
                      {vendor.commissionRate}%
                    </Typography>
                  </Box>
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                  >
                    Range: {vendor.minCommission}% - {vendor.maxCommission}%
                  </Typography>
                </Paper>

                {/* Stats Grid */}
                <Box 
                  display="grid" 
                  gridTemplateColumns="repeat(3, 1fr)" 
                  gap={{ xs: 1, sm: 2 }} 
                  mb={{ xs: 2, sm: 2.5 }}
                >
                  <Box 
                    textAlign="center" 
                    sx={{ 
                      p: { xs: 1, sm: 1.5 },
                      borderRadius: 2,
                      bgcolor: 'rgba(25, 118, 210, 0.05)',
                      border: '1px solid rgba(25, 118, 210, 0.1)'
                    }}
                  >
                    <Typography 
                      variant="h6" 
                      fontWeight={700} 
                      color="primary.main"
                      sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
                    >
                      {vendor.productCount.toLocaleString()}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                    >
                      Products
                    </Typography>
                  </Box>
                  <Box 
                    textAlign="center"
                    sx={{ 
                      p: { xs: 1, sm: 1.5 },
                      borderRadius: 2,
                      bgcolor: 'rgba(156, 39, 176, 0.05)',
                      border: '1px solid rgba(156, 39, 176, 0.1)'
                    }}
                  >
                    <Typography 
                      variant="h6" 
                      fontWeight={700} 
                      color="secondary.main"
                      sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
                    >
                      {vendor.categoryCount}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                    >
                      Categories
                    </Typography>
                  </Box>
                  <Box 
                    textAlign="center"
                    sx={{ 
                      p: { xs: 1, sm: 1.5 },
                      borderRadius: 2,
                      bgcolor: 'rgba(255, 152, 0, 0.05)',
                      border: '1px solid rgba(255, 152, 0, 0.1)'
                    }}
                  >
                    <Typography 
                      variant="h6" 
                      fontWeight={700} 
                      color="warning.main"
                      sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
                    >
                      {vendor.rating}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                    >
                      Rating
                    </Typography>
                  </Box>
                </Box>

                {/* Categories */}
                <Box mb={{ xs: 2, sm: 2.5 }}>
                  <Typography 
                    variant="caption" 
                    color="text.secondary" 
                    display="block" 
                    mb={1}
                    sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' }, fontWeight: 600 }}
                  >
                    Categories:
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={{ xs: 0.5, sm: 0.75 }}>
                    {vendor.categories.slice(0, 3).map(category => (
                      <Chip 
                        key={category} 
                        label={category} 
                        size="small" 
                        variant="outlined"
                        sx={{ 
                          fontSize: { xs: '0.65rem', sm: '0.75rem' },
                          height: { xs: 20, sm: 24 },
                          '& .MuiChip-label': {
                            px: { xs: 1, sm: 1.5 }
                          }
                        }}
                      />
                    ))}
                    {vendor.categories.length > 3 && (
                      <Chip 
                        label={`+${vendor.categories.length - 3}`} 
                        size="small" 
                        variant="outlined"
                        sx={{ 
                          fontSize: { xs: '0.65rem', sm: '0.75rem' },
                          height: { xs: 20, sm: 24 },
                          '& .MuiChip-label': {
                            px: { xs: 1, sm: 1.5 }
                          }
                        }}
                      />
                    )}
                  </Box>
                </Box>

                {/* Auto Approval Badge */}
                {vendor.autoApproval && (
                  <Chip 
                    label="Auto Approval" 
                    size="small" 
                    color="success" 
                    sx={{ 
                      mb: { xs: 1.5, sm: 2 },
                      fontSize: { xs: '0.65rem', sm: '0.75rem' },
                      height: { xs: 20, sm: 24 },
                      '& .MuiChip-label': {
                        px: { xs: 1, sm: 1.5 }
                      }
                    }}
                  />
                )}

                {/* Selection Indicator */}
                {selectedVendor === vendor.id && (
                  <Box 
                    display="flex" 
                    alignItems="center" 
                    justifyContent="center"
                    mt={{ xs: 1, sm: 1.5 }}
                    p={{ xs: 1, sm: 1.5 }}
                    bgcolor="primary.main"
                    borderRadius={2}
                    sx={{
                      background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                      boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                      animation: 'slideIn 0.3s ease-out'
                    }}
                  >
                    <CheckCircleIcon sx={{ mr: 1, color: 'white', fontSize: { xs: 16, sm: 18 } }} />
                    <Typography 
                      variant="body2" 
                      fontWeight={600} 
                      color="white"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      Selected Partner
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {vendors.length === 0 && !loading && (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="text.secondary">
            No vendors found matching your criteria
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            Try adjusting your search terms or category filter
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default function AffiliateOnboardingPage() {
  const { user, updateUser } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Add CSS animations
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
      }
      @keyframes slideIn {
        from { 
          opacity: 0; 
          transform: translateY(20px); 
        }
        to { 
          opacity: 1; 
          transform: translateY(0); 
        }
      }
      @keyframes fadeInUp {
        from { 
          opacity: 0; 
          transform: translateY(30px); 
        }
        to { 
          opacity: 1; 
          transform: translateY(0); 
        }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
  const [error, setError] = useState<string | null>(null);
  
  // Get vendor info from URL params
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const vendorIdFromUrl = searchParams.get('vendorId');
  const vendorNameFromUrl = searchParams.get('vendorName');
  
  const [formData, setFormData] = useState({
    // Step 1: Guidelines acceptance
    guidelinesAccepted: false,
    
    // Step 2: Personal details
    phone: '',
    country: '',
    city: '',
    address: '',
    zipCode: '',
    
    // Step 3: Social media handles
    socialMediaHandles: {
      instagram: '',
      tiktok: '',
      facebook: '',
      twitter: '',
      youtube: ''
    },
    
    // Step 4: Vendor selection
    vendorId: vendorIdFromUrl || '',
    vendorName: vendorNameFromUrl || '',
    commissionPreference: 'percentage' as 'percentage' | 'fixed',
    expectedMonthlySales: '',
    marketingExperience: '',
    preferredCategories: [] as string[]
  });

  const steps = [
    'Program Guidelines',
    'Personal Details', 
    'Social Media',
    'Vendor Selection',
    'Complete Setup'
  ];

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleInputChange = (field: string, value: any) => {
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

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiPost("/affiliate/register", {
        ...formData,
        userId: user?.id
      });
      
      if (response) {
        // Update the user context to reflect completed onboarding
        updateUser({ affiliateOnboardingCompleted: true });
        
        // Redirect to dashboard
        setTimeout(() => {
          router.push('/dashboard/affiliate');
        }, 1000);
      }
    } catch (error: any) {
      console.error('Error registering affiliate:', error);
      setError('Failed to complete affiliate registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Card sx={{ borderRadius: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 } }}>
            <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
              <Box textAlign="center" mb={{ xs: 3, sm: 4 }}>
                <Avatar sx={{ 
                  width: { xs: 60, sm: 80 }, 
                  height: { xs: 60, sm: 80 }, 
                  mx: 'auto', 
                  mb: 2,
                  bgcolor: 'primary.main'
                }}>
                  <DescriptionIcon fontSize="large" />
                </Avatar>
                <Typography 
                  variant="h4" 
                  fontWeight={700} 
                  gutterBottom
                  sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}
                >
                  Affiliate Program Guidelines
                </Typography>
                <Typography 
                  variant="body1" 
                  color="text.secondary"
                  sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                >
                  Please read and accept our affiliate program terms
                </Typography>
              </Box>

              <Paper sx={{ p: { xs: 2, sm: 3 }, bgcolor: 'grey.50', borderRadius: 2, mb: { xs: 2, sm: 3 } }}>
                <Typography 
                  variant="h6" 
                  fontWeight={600} 
                  gutterBottom
                  sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                >
                  📋 Program Overview
                </Typography>
                <Stack spacing={{ xs: 1.5, sm: 2 }}>
                  <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                    • <strong>Commission Rate:</strong> Earn 5-10% commission on qualified sales
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                    • <strong>Payment Terms:</strong> Monthly payouts via bank transfer or PayPal
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                    • <strong>Cookie Duration:</strong> 30-day tracking window for conversions
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                    • <strong>Minimum Payout:</strong> $50 minimum threshold
                  </Typography>
                </Stack>
              </Paper>

              <Paper sx={{ p: { xs: 2, sm: 3 }, bgcolor: 'info.light', borderRadius: 2, mb: { xs: 2, sm: 3 } }}>
                <Typography 
                  variant="h6" 
                  fontWeight={600} 
                  gutterBottom 
                  color="info.dark"
                  sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                >
                  ✅ What You Can Do
                </Typography>
                <Stack spacing={{ xs: 1, sm: 1 }}>
                  <Typography variant="body2" color="info.dark" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                    • Share affiliate links on social media platforms
                  </Typography>
                  <Typography variant="body2" color="info.dark" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                    • Create content featuring our products
                  </Typography>
                  <Typography variant="body2" color="info.dark" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                    • Use provided promotional materials
                  </Typography>
                  <Typography variant="body2" color="info.dark" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                    • Track performance through your dashboard
                  </Typography>
                </Stack>
              </Paper>

              <Paper sx={{ p: { xs: 2, sm: 3 }, bgcolor: 'warning.light', borderRadius: 2, mb: { xs: 2, sm: 3 } }}>
                <Typography 
                  variant="h6" 
                  fontWeight={600} 
                  gutterBottom 
                  color="warning.dark"
                  sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                >
                  ⚠️ Important Restrictions
                </Typography>
                <Stack spacing={{ xs: 1, sm: 1 }}>
                  <Typography variant="body2" color="warning.dark" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                    • No spam or misleading advertising
                  </Typography>
                  <Typography variant="body2" color="warning.dark" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                    • No bidding on branded keywords
                  </Typography>
                  <Typography variant="body2" color="warning.dark" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                    • No cookie stuffing or fraudulent activity
                  </Typography>
                  <Typography variant="body2" color="warning.dark" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                    • Must comply with FTC disclosure requirements
                  </Typography>
                </Stack>
              </Paper>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.guidelinesAccepted}
                    onChange={(e) => handleInputChange('guidelinesAccepted', e.target.checked)}
                    color="primary"
                  />
                }
                label="I have read and agree to the affiliate program guidelines and terms of service"
                sx={{ 
                  mb: { xs: 2, sm: 3 },
                  '& .MuiFormControlLabel-label': {
                    fontSize: { xs: '0.8rem', sm: '0.875rem' }
                  }
                }}
              />
            </CardContent>
          </Card>
        );

      case 1:
        return (
          <Card sx={{ borderRadius: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 } }}>
            <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
              <Box textAlign="center" mb={{ xs: 3, sm: 4 }}>
                <Avatar sx={{ 
                  width: { xs: 60, sm: 80 }, 
                  height: { xs: 60, sm: 80 }, 
                  mx: 'auto', 
                  mb: 2,
                  bgcolor: 'secondary.main'
                }}>
                  <PeopleIcon fontSize="large" />
                </Avatar>
                <Typography 
                  variant="h4" 
                  fontWeight={700} 
                  gutterBottom
                  sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}
                >
                  Personal Details
                </Typography>
                <Typography 
                  variant="body1" 
                  color="text.secondary"
                  sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                >
                  Help us get to know you better
                </Typography>
              </Box>

              <Grid container spacing={{ xs: 2, sm: 3 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    InputProps={{
                      startAdornment: <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                    sx={{ mb: { xs: 1.5, sm: 2 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth sx={{ mb: { xs: 1.5, sm: 2 } }}>
                    <InputLabel>Country</InputLabel>
                    <Select
                      value={formData.country}
                      label="Country"
                      onChange={(e) => handleInputChange('country', e.target.value)}
                    >
                      <MenuItem value="US">United States</MenuItem>
                      <MenuItem value="CA">Canada</MenuItem>
                      <MenuItem value="UK">United Kingdom</MenuItem>
                      <MenuItem value="AU">Australia</MenuItem>
                      <MenuItem value="DE">Germany</MenuItem>
                      <MenuItem value="FR">France</MenuItem>
                      <MenuItem value="RW">Rwanda</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="City"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    InputProps={{
                      startAdornment: <LocationOnIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                    sx={{ mb: { xs: 1.5, sm: 2 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="ZIP/Postal Code"
                    value={formData.zipCode}
                    onChange={(e) => handleInputChange('zipCode', e.target.value)}
                    sx={{ mb: { xs: 1.5, sm: 2 } }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address (Optional)"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    multiline
                    rows={2}
                    sx={{ mb: { xs: 1.5, sm: 2 } }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card sx={{ borderRadius: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 } }}>
            <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
              <Box textAlign="center" mb={{ xs: 3, sm: 4 }}>
                <Avatar sx={{ 
                  width: { xs: 60, sm: 80 }, 
                  height: { xs: 60, sm: 80 }, 
                  mx: 'auto', 
                  mb: 2,
                  bgcolor: 'success.main'
                }}>
                  <TrendingUpIcon fontSize="large" />
                </Avatar>
                <Typography 
                  variant="h4" 
                  fontWeight={700} 
                  gutterBottom
                  sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}
                >
                  Social Media Presence
                </Typography>
                <Typography 
                  variant="body1" 
                  color="text.secondary"
                  sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                >
                  Share your social media handles (optional but recommended)
                </Typography>
              </Box>

              <Grid container spacing={{ xs: 2, sm: 3 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Instagram"
                    value={formData.socialMediaHandles.instagram}
                    onChange={(e) => handleInputChange('socialMediaHandles.instagram', e.target.value)}
                    placeholder="@yourusername"
                    InputProps={{
                      startAdornment: <InstagramIcon sx={{ mr: 1, color: '#E4405F' }} />
                    }}
                    sx={{ mb: { xs: 1.5, sm: 2 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="TikTok"
                    value={formData.socialMediaHandles.tiktok}
                    onChange={(e) => handleInputChange('socialMediaHandles.tiktok', e.target.value)}
                    placeholder="@yourusername"
                    InputProps={{
                      startAdornment: <TikTokIcon sx={{ mr: 1, color: '#000000' }} />
                    }}
                    sx={{ mb: { xs: 1.5, sm: 2 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Facebook"
                    value={formData.socialMediaHandles.facebook}
                    onChange={(e) => handleInputChange('socialMediaHandles.facebook', e.target.value)}
                    placeholder="Your Facebook page name"
                    InputProps={{
                      startAdornment: <FacebookIcon sx={{ mr: 1, color: '#1877F2' }} />
                    }}
                    sx={{ mb: { xs: 1.5, sm: 2 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Twitter"
                    value={formData.socialMediaHandles.twitter}
                    onChange={(e) => handleInputChange('socialMediaHandles.twitter', e.target.value)}
                    placeholder="@yourusername"
                    InputProps={{
                      startAdornment: <TwitterIcon sx={{ mr: 1, color: '#1DA1F2' }} />
                    }}
                    sx={{ mb: { xs: 1.5, sm: 2 } }}
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
                      startAdornment: <YouTubeIcon sx={{ mr: 1, color: '#FF0000' }} />
                    }}
                    sx={{ mb: { xs: 1.5, sm: 2 } }}
                  />
                </Grid>
              </Grid>

              <Paper sx={{ p: { xs: 2, sm: 3 }, bgcolor: 'info.light', borderRadius: 2 }}>
                <Typography 
                  variant="subtitle1" 
                  fontWeight={600} 
                  color="info.dark" 
                  gutterBottom
                  sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
                >
                  💡 Pro Tip
                </Typography>
                <Typography 
                  variant="body2" 
                  color="info.dark"
                  sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                >
                  Providing your social media handles helps vendors understand your reach and audience. 
                  This can lead to better commission rates and exclusive promotional opportunities!
                </Typography>
              </Paper>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card sx={{ borderRadius: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 } }}>
            <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
              <Box textAlign="center" mb={{ xs: 3, sm: 4 }}>
                <Avatar sx={{ 
                  width: { xs: 60, sm: 80 }, 
                  height: { xs: 60, sm: 80 }, 
                  mx: 'auto', 
                  mb: 2,
                  bgcolor: 'warning.main'
                }}>
                  <BusinessIcon fontSize="large" />
                </Avatar>
                <Typography 
                  variant="h4" 
                  fontWeight={700} 
                  gutterBottom
                  sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}
                >
                  Choose Your Vendor Partner
                </Typography>
                <Typography 
                  variant="body1" 
                  color="text.secondary"
                  sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                >
                  Browse available vendors and their commission rates
                </Typography>
              </Box>

              {/* Vendor Selection */}
              <VendorSelectionSection 
                selectedVendor={formData.vendorId}
                onVendorSelect={(vendorId, vendorName) => {
                  handleInputChange('vendorId', vendorId);
                  handleInputChange('vendorName', vendorName);
                }}
              />

              {/* Additional Information */}
              <Box mt={{ xs: 3, sm: 4 }}>
                <Typography 
                  variant="h6" 
                  fontWeight={600} 
                  gutterBottom
                  sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                >
                  Additional Information
                </Typography>
                
                <Grid container spacing={{ xs: 2, sm: 3 }}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth sx={{ mb: { xs: 1.5, sm: 2 } }}>
                      <InputLabel>Commission Preference</InputLabel>
                      <Select
                        value={formData.commissionPreference}
                        label="Commission Preference"
                        onChange={(e) => handleInputChange('commissionPreference', e.target.value)}
                      >
                        <MenuItem value="percentage">Percentage (%)</MenuItem>
                        <MenuItem value="fixed">Fixed Amount ($)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Expected Monthly Sales"
                      value={formData.expectedMonthlySales}
                      onChange={(e) => handleInputChange('expectedMonthlySales', e.target.value)}
                      placeholder="e.g., $1000"
                      InputProps={{
                        startAdornment: <AttachMoneyIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                      sx={{ mb: { xs: 1.5, sm: 2 } }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Marketing Experience"
                      value={formData.marketingExperience}
                      onChange={(e) => handleInputChange('marketingExperience', e.target.value)}
                      placeholder="Tell us about your marketing experience..."
                      multiline
                      rows={3}
                      sx={{ mb: { xs: 1.5, sm: 2 } }}
                    />
                  </Grid>
                </Grid>
              </Box>

              <Paper sx={{ p: { xs: 2, sm: 3 }, bgcolor: 'success.light', borderRadius: 2 }}>
                <Typography 
                  variant="subtitle1" 
                  fontWeight={600} 
                  color="success.dark" 
                  gutterBottom
                  sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
                >
                  🎯 Next Steps
                </Typography>
                <Typography 
                  variant="body2" 
                  color="success.dark"
                  sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                >
                  After submitting your application, the vendor will review your profile and social media presence. 
                  Once approved, you'll receive your unique referral code and can start earning commissions!
                </Typography>
              </Paper>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card sx={{ borderRadius: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 } }}>
            <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
              <Box textAlign="center" mb={{ xs: 3, sm: 4 }}>
                <Avatar sx={{ 
                  width: { xs: 60, sm: 80 }, 
                  height: { xs: 60, sm: 80 }, 
                  mx: 'auto', 
                  mb: 2,
                  bgcolor: 'primary.main'
                }}>
                  <CheckCircleIcon fontSize="large" />
                </Avatar>
                <Typography 
                  variant="h4" 
                  fontWeight={700} 
                  gutterBottom
                  sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}
                >
                  Complete Your Setup
                </Typography>
                <Typography 
                  variant="body1" 
                  color="text.secondary"
                  sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                >
                  Review your information and submit your application
                </Typography>
              </Box>

              <Paper sx={{ p: { xs: 2, sm: 3 }, bgcolor: 'grey.50', borderRadius: 2, mb: { xs: 2, sm: 3 } }}>
                <Typography 
                  variant="h6" 
                  fontWeight={600} 
                  gutterBottom
                  sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                >
                  Application Summary
                </Typography>
                <Stack spacing={{ xs: 1.5, sm: 2 }}>
                  <Box display="flex" justifyContent="space-between" flexDirection={{ xs: 'column', sm: 'row' }} gap={{ xs: 0.5, sm: 0 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>Name:</Typography>
                    <Typography variant="body2" fontWeight={500} sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>{user?.name}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" flexDirection={{ xs: 'column', sm: 'row' }} gap={{ xs: 0.5, sm: 0 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>Email:</Typography>
                    <Typography variant="body2" fontWeight={500} sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>{user?.email}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" flexDirection={{ xs: 'column', sm: 'row' }} gap={{ xs: 0.5, sm: 0 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>Phone:</Typography>
                    <Typography variant="body2" fontWeight={500} sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>{formData.phone || 'Not provided'}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" flexDirection={{ xs: 'column', sm: 'row' }} gap={{ xs: 0.5, sm: 0 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>Location:</Typography>
                    <Typography variant="body2" fontWeight={500} sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                      {formData.city}, {formData.country}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" flexDirection={{ xs: 'column', sm: 'row' }} gap={{ xs: 0.5, sm: 0 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>Vendor:</Typography>
                    <Typography variant="body2" fontWeight={500} sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                      {formData.vendorName || formData.vendorId || 'Not specified'}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>

              {error && (
                <Alert severity="error" sx={{ mb: { xs: 2, sm: 3 } }}>
                  {error}
                </Alert>
              )}

              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handleSubmit}
                disabled={loading || !formData.guidelinesAccepted}
                endIcon={<CheckCircleIcon />}
                sx={{ 
                  py: { xs: 1.5, sm: 1.5 }, 
                  borderRadius: 2,
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  '&:hover': {
                    background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                  },
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }}
              >
                {loading ? 'Submitting Application...' : 'Submit Affiliate Application'}
              </Button>
            </CardContent>
          </Card>
        );

      default:
        return null;
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
            You need to be logged in to access the affiliate onboarding.
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
      py: { xs: 2, sm: 4 }
    }}>
      <Container maxWidth="md" sx={{ px: { xs: 2, sm: 3 } }}>
        <Box textAlign="center" mb={{ xs: 3, sm: 4 }}>
          <Typography 
            variant="h3" 
            fontWeight={800} 
            gutterBottom 
            sx={{ 
              fontSize: { xs: '1.8rem', sm: '2.5rem', md: '3rem' },
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Affiliate Onboarding
          </Typography>
          <Typography 
            variant="h6" 
            color="text.secondary"
            sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
          >
            Complete your affiliate application in just a few steps
          </Typography>
        </Box>

        <Card sx={{ borderRadius: { xs: 2, sm: 4 }, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
          <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
            <Stepper 
              activeStep={activeStep} 
              sx={{ 
                mb: { xs: 3, sm: 4 },
                '& .MuiStepLabel-label': {
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                }
              }}
              orientation="horizontal"
            >
              {steps.map((label, index) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {renderStepContent(activeStep)}

            <Box 
              display="flex" 
              justifyContent="space-between" 
              mt={{ xs: 3, sm: 4 }}
              flexDirection={{ xs: 'column', sm: 'row' }}
              gap={{ xs: 2, sm: 0 }}
            >
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                startIcon={<ArrowBackIcon />}
                sx={{ 
                  borderRadius: 2,
                  width: { xs: '100%', sm: 'auto' },
                  order: { xs: 2, sm: 1 }
                }}
              >
                Back
              </Button>
              
              {activeStep < steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  endIcon={<ArrowForwardIcon />}
                  disabled={activeStep === 0 && !formData.guidelinesAccepted}
                  sx={{ 
                    borderRadius: 2,
                    width: { xs: '100%', sm: 'auto' },
                    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    '&:hover': {
                      background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                    },
                    order: { xs: 1, sm: 2 }
                  }}
                >
                  Next
                </Button>
              ) : null}
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
