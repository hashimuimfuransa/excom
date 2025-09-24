"use client";
import React from 'react';
import { Box, Container, Grid, Link, Typography, Stack, Divider, IconButton, Chip, Button } from '@mui/material';
import TwitterIcon from '@mui/icons-material/Twitter';
import InstagramIcon from '@mui/icons-material/Instagram';
import YouTubeIcon from '@mui/icons-material/YouTube';
import FacebookIcon from '@mui/icons-material/Facebook';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import NextLink from 'next/link';

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={(t) => ({
        mt: 8,
        borderTop: `4px solid #22c55e`,
        background: t.palette.mode === 'dark'
          ? 'linear-gradient(180deg, rgba(12,18,34,0.95) 0%, rgba(8,12,20,1) 100%)'
          : 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 6,
          background: 'linear-gradient(90deg, #22c55e, #16a34a, #15803d)',
          borderRadius: 0
        }
      })}
    >
      {/* Background Pattern */}
      <Box
        sx={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'rgba(34, 197, 94, 0.05)',
          animation: 'float 8s ease-in-out infinite',
          zIndex: 0
        }}
      />
      
      <Container sx={{ py: 8, position: 'relative', zIndex: 1 }}>
        <Grid container spacing={6}>
          {/* Company Info */}
          <Grid item xs={12} md={4}>
            <Stack spacing={3}>
              <Box>
                <Typography 
                  variant="h4" 
                  fontWeight={900} 
                  sx={{
                    background: 'linear-gradient(45deg, #22c55e, #16a34a)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontSize: { xs: '1.8rem', md: '2.2rem' }
                  }}
                >
                  Excom
                </Typography>
                <Chip 
                  label="Universal Marketplace" 
                  size="small" 
                  sx={{ 
                    bgcolor: '#22c55e', 
                    color: 'white', 
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    height: 24,
                    borderRadius: 0,
                    mt: 1
                  }} 
                />
              </Box>
              <Typography 
                color="text.secondary" 
                sx={{ 
                  lineHeight: 1.7, 
                  fontSize: '1rem',
                  fontWeight: 500
                }}
              >
                Your gateway to everything—products, stays, rentals, and services. 
                Built for creators, explorers, and entrepreneurs who demand excellence.
              </Typography>
              
              {/* Contact Info */}
              <Stack spacing={2}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <EmailIcon sx={{ color: '#22c55e', fontSize: '1.2rem' }} />
                  <Typography variant="body2" color="text.secondary">
                    hello@excom.com
                  </Typography>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <PhoneIcon sx={{ color: '#22c55e', fontSize: '1.2rem' }} />
                  <Typography variant="body2" color="text.secondary">
                    +1 (555) 123-4567
                  </Typography>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <LocationOnIcon sx={{ color: '#22c55e', fontSize: '1.2rem' }} />
                  <Typography variant="body2" color="text.secondary">
                    San Francisco, CA
                  </Typography>
                </Stack>
              </Stack>
            </Stack>
          </Grid>
          
          {/* Quick Links */}
          <Grid item xs={6} sm={3} md={2}>
            <Typography variant="h6" fontWeight={800} gutterBottom sx={{ color: '#22c55e' }}>
              Discover
            </Typography>
            <Stack spacing={2}>
              <Link 
                component={NextLink}
                href="/products" 
                color="inherit" 
                underline="hover"
                sx={{ 
                  fontWeight: 500,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    color: '#22c55e',
                    transform: 'translateX(4px)'
                  }
                }}
              >
                Products
              </Link>
              <Link 
                component={NextLink}
                href="/rentals" 
                color="inherit" 
                underline="hover"
                sx={{ 
                  fontWeight: 500,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    color: '#22c55e',
                    transform: 'translateX(4px)'
                  }
                }}
              >
                Rentals
              </Link>
              <Link 
                component={NextLink}
                href="/stays" 
                color="inherit" 
                underline="hover"
                sx={{ 
                  fontWeight: 500,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    color: '#22c55e',
                    transform: 'translateX(4px)'
                  }
                }}
              >
                Stays
              </Link>
              <Link 
                component={NextLink}
                href="/services" 
                color="inherit" 
                underline="hover"
                sx={{ 
                  fontWeight: 500,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    color: '#22c55e',
                    transform: 'translateX(4px)'
                  }
                }}
              >
                Services
              </Link>
            </Stack>
          </Grid>
          
          {/* Company */}
          <Grid item xs={6} sm={3} md={2}>
            <Typography variant="h6" fontWeight={800} gutterBottom sx={{ color: '#22c55e' }}>
              Company
            </Typography>
            <Stack spacing={2}>
              <Link 
                component={NextLink}
                href="/about" 
                color="inherit" 
                underline="hover"
                sx={{ 
                  fontWeight: 500,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    color: '#22c55e',
                    transform: 'translateX(4px)'
                  }
                }}
              >
                About
              </Link>
              <Link 
                component={NextLink}
                href="/careers" 
                color="inherit" 
                underline="hover"
                sx={{ 
                  fontWeight: 500,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    color: '#22c55e',
                    transform: 'translateX(4px)'
                  }
                }}
              >
                Careers
              </Link>
              <Link 
                component={NextLink}
                href="/blog" 
                color="inherit" 
                underline="hover"
                sx={{ 
                  fontWeight: 500,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    color: '#22c55e',
                    transform: 'translateX(4px)'
                  }
                }}
              >
                Blog
              </Link>
              <Link 
                component={NextLink}
                href="/contact" 
                color="inherit" 
                underline="hover"
                sx={{ 
                  fontWeight: 500,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    color: '#22c55e',
                    transform: 'translateX(4px)'
                  }
                }}
              >
                Contact
              </Link>
            </Stack>
          </Grid>
          
          {/* Newsletter */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" fontWeight={800} gutterBottom sx={{ color: '#22c55e' }}>
              Stay Connected
            </Typography>
            <Typography color="text.secondary" gutterBottom sx={{ mb: 3, lineHeight: 1.6 }}>
              Be first to know about new arrivals, exclusive deals, and insider stories.
            </Typography>
            
            {/* Social Media */}
            <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
              <IconButton 
                aria-label="Facebook"
                sx={{
                  bgcolor: '#22c55e',
                  color: 'white',
                  borderRadius: 0,
                  width: 48,
                  height: 48,
                  '&:hover': {
                    bgcolor: '#16a34a',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 16px rgba(34, 197, 94, 0.3)'
                  }
                }}
              >
                <FacebookIcon />
              </IconButton>
              <IconButton 
                aria-label="Twitter"
                sx={{
                  bgcolor: '#22c55e',
                  color: 'white',
                  borderRadius: 0,
                  width: 48,
                  height: 48,
                  '&:hover': {
                    bgcolor: '#16a34a',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 16px rgba(34, 197, 94, 0.3)'
                  }
                }}
              >
                <TwitterIcon />
              </IconButton>
              <IconButton 
                aria-label="Instagram"
                sx={{
                  bgcolor: '#22c55e',
                  color: 'white',
                  borderRadius: 0,
                  width: 48,
                  height: 48,
                  '&:hover': {
                    bgcolor: '#16a34a',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 16px rgba(34, 197, 94, 0.3)'
                  }
                }}
              >
                <InstagramIcon />
              </IconButton>
              <IconButton 
                aria-label="LinkedIn"
                sx={{
                  bgcolor: '#22c55e',
                  color: 'white',
                  borderRadius: 0,
                  width: 48,
                  height: 48,
                  '&:hover': {
                    bgcolor: '#16a34a',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 16px rgba(34, 197, 94, 0.3)'
                  }
                }}
              >
                <LinkedInIcon />
              </IconButton>
            </Stack>
            
            {/* Newsletter Signup */}
            <Button
              component={NextLink}
              href="/newsletter"
              variant="contained"
              sx={{
                bgcolor: '#22c55e',
                color: 'white',
                borderRadius: 0,
                px: 4,
                py: 1.5,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                boxShadow: '0 4px 16px rgba(34, 197, 94, 0.3)',
                '&:hover': {
                  bgcolor: '#16a34a',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 24px rgba(34, 197, 94, 0.4)'
                }
              }}
            >
              Subscribe Newsletter
            </Button>
          </Grid>
        </Grid>

        <Divider sx={{ my: 6, borderColor: '#e5e7eb', borderWidth: 2 }} />

        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          alignItems={{ xs: 'flex-start', sm: 'center' }} 
          justifyContent="space-between" 
          spacing={3}
        >
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ fontWeight: 500 }}
          >
            © {new Date().getFullYear()} Excom. All rights reserved.
          </Typography>
          <Stack direction="row" spacing={4}>
            <Link 
              href="/privacy" 
              color="inherit" 
              underline="hover"
              sx={{ 
                fontWeight: 500,
                transition: 'all 0.3s ease',
                '&:hover': {
                  color: '#22c55e'
                }
              }}
            >
              Privacy
            </Link>
            <Link 
              href="/terms" 
              color="inherit" 
              underline="hover"
              sx={{ 
                fontWeight: 500,
                transition: 'all 0.3s ease',
                '&:hover': {
                  color: '#22c55e'
                }
              }}
            >
              Terms
            </Link>
            <Link 
              href="/cookies" 
              color="inherit" 
              underline="hover"
              sx={{ 
                fontWeight: 500,
                transition: 'all 0.3s ease',
                '&:hover': {
                  color: '#22c55e'
                }
              }}
            >
              Cookies
            </Link>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}