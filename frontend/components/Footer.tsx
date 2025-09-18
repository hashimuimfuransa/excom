"use client";
import React from 'react';
import { Box, Container, Grid, Link, Typography, Stack, Divider, IconButton } from '@mui/material';
import TwitterIcon from '@mui/icons-material/Twitter';
import InstagramIcon from '@mui/icons-material/Instagram';
import YouTubeIcon from '@mui/icons-material/YouTube';

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={(t) => ({
        mt: 8,
        borderTop: `1px solid ${t.palette.divider}`,
        background: t.palette.mode === 'dark'
          ? 'linear-gradient(180deg, rgba(12,18,34,0.7) 0%, rgba(12,18,34,1) 100%)'
          : 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)'
      })}
    >
      <Container sx={{ py: 6 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" fontWeight={900} gutterBottom>Excom</Typography>
            <Typography color="text.secondary">
              Your gateway to everything—products, stays, rentals, and services. 
              Built for creators, explorers, and entrepreneurs who demand excellence.
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3} md={2}>
            <Typography variant="subtitle1" fontWeight={800} gutterBottom>Discover</Typography>
            <Stack spacing={1}>
              <Link href="#" color="inherit" underline="hover">Products</Link>
              <Link href="#" color="inherit" underline="hover">Rentals</Link>
              <Link href="#" color="inherit" underline="hover">Stays</Link>
              <Link href="#" color="inherit" underline="hover">Services</Link>
            </Stack>
          </Grid>
          <Grid item xs={6} sm={3} md={2}>
            <Typography variant="subtitle1" fontWeight={800} gutterBottom>Company</Typography>
            <Stack spacing={1}>
              <Link href="#" color="inherit" underline="hover">About</Link>
              <Link href="#" color="inherit" underline="hover">Careers</Link>
              <Link href="#" color="inherit" underline="hover">Blog</Link>
              <Link href="#" color="inherit" underline="hover">Contact</Link>
            </Stack>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1" fontWeight={800} gutterBottom>Stay Connected</Typography>
            <Typography color="text.secondary" gutterBottom>
              Be first to know about new arrivals, exclusive deals, and insider stories.
            </Typography>
            <Stack direction="row" spacing={1} mt={1}>
              <IconButton aria-label="Twitter"><TwitterIcon /></IconButton>
              <IconButton aria-label="Instagram"><InstagramIcon /></IconButton>
              <IconButton aria-label="YouTube"><YouTubeIcon /></IconButton>
            </Stack>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" spacing={2}>
          <Typography variant="body2" color="text.secondary">© {new Date().getFullYear()} Excom. All rights reserved.</Typography>
          <Stack direction="row" spacing={2}>
            <Link href="#" color="inherit" underline="hover">Privacy</Link>
            <Link href="#" color="inherit" underline="hover">Terms</Link>
            <Link href="#" color="inherit" underline="hover">Cookies</Link>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}