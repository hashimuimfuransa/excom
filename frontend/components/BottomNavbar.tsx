"use client";
import React, { useState } from 'react';
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Badge,
  useTheme,
  useMediaQuery,
  Box,
  Fab,
  Zoom,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Tooltip
} from '@mui/material';
import {
  Home as HomeIcon,
  ShoppingCart as ShoppingCartIcon,
  Favorite as FavoriteIcon,
  Store as StoreIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  Collections as CollectionsIcon,
  MonetizationOn as BargainIcon,
  Add as AddIcon,
  Menu as MenuIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import NextLink from 'next/link';
import { useCart } from '@utils/cart';
import { useWishlist } from '@utils/wishlist';
import { useAuth } from '@utils/auth';
import { useRouter, usePathname } from 'next/navigation';

export default function BottomNavbar() {
  const { user } = useAuth();
  const { items, bookingItems } = useCart();
  const { count: wishlistCount } = useWishlist();
  const { t } = useTranslation('common');
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [speedDialOpen, setSpeedDialOpen] = useState(false);

  // Don't show on desktop
  if (!isMobile) return null;

  // Don't show on certain pages
  const hideOnPages = ['/auth/login', '/auth/register', '/auth/signin', '/auth/signup'];
  if (hideOnPages.some(page => pathname.includes(page))) return null;

  const getCurrentValue = () => {
    if (pathname === '/') return 0;
    if (pathname.includes('/collections')) return 1;
    if (pathname.includes('/product') || pathname.includes('/search')) return 2;
    if (pathname.includes('/wishlist')) return 3;
    if (pathname.includes('/cart')) return 4;
    if (pathname.includes('/profile') || pathname.includes('/dashboard')) return 5;
    return -1;
  };

  const handleNavigation = (event: React.SyntheticEvent, newValue: number) => {
    switch (newValue) {
      case 0:
        router.push('/');
        break;
      case 1:
        router.push('/collections');
        break;
      case 2:
        router.push('/product');
        break;
      case 3:
        router.push('/wishlist');
        break;
      case 4:
        router.push('/cart');
        break;
      case 5:
        if (user) {
          // Navigate to appropriate dashboard based on user role
          if (user.role === 'admin') {
            router.push('/dashboard/admin');
          } else if (user.role === 'affiliate') {
            router.push('/dashboard/affiliate');
          } else {
            router.push('/dashboard/vendor');
          }
        } else {
          router.push('/auth/login');
        }
        break;
    }
  };

  // Core navigation items (5 items max for better mobile UX)
  const coreNavigationItems = [
    {
      label: t('navigation.home'),
      icon: <HomeIcon />,
      value: 0
    },
    {
      label: t('navigation.collections'),
      icon: <CollectionsIcon />,
      value: 1
    },
    {
      label: t('navigation.products'),
      icon: <SearchIcon />,
      value: 2
    },
    {
      label: t('wishlist.title'),
      icon: <FavoriteIcon />,
      value: 3,
      badge: wishlistCount || 0
    },
    {
      label: t('navigation.cart'),
      icon: <ShoppingCartIcon />,
      value: 4,
      badge: items.length + bookingItems.length
    }
  ];

  // Additional actions for SpeedDial
  const speedDialActions = [
    {
      icon: <StoreIcon />,
      name: t('navigation.vendors'),
      action: () => router.push('/vendors')
    },
    {
      icon: <BargainIcon />,
      name: t('navigation.bargaining'),
      action: () => router.push('/bargaining')
    },
    {
      icon: user ? <PersonIcon /> : <PersonIcon />,
      name: user ? t('navigation.profile') : t('navigation.login'),
      action: () => {
        if (user) {
          if (user.role === 'admin') {
            router.push('/dashboard/admin');
          } else if (user.role === 'affiliate') {
            router.push('/dashboard/affiliate');
          } else {
            router.push('/dashboard/vendor');
          }
        } else {
          router.push('/auth/login');
        }
      }
    }
  ];

  return (
    <>
      {/* SpeedDial for Additional Actions */}
      <SpeedDial
        ariaLabel="Additional actions"
        sx={{
          position: 'fixed',
          bottom: isSmallMobile ? 120 : 140, // Moved higher to avoid conflicts with AI assistant
          right: 16,
          zIndex: 1000,
          '& .MuiFab-primary': {
            background: (theme) => theme.palette.mode === 'dark' 
              ? 'linear-gradient(45deg, #64B5F6, #42A5F5)' 
              : 'linear-gradient(45deg, #22c55e, #16a34a)',
            boxShadow: (theme) => theme.palette.mode === 'dark' 
              ? '0 8px 32px rgba(100, 181, 246, 0.3)' 
              : '0 8px 32px rgba(34, 197, 94, 0.3)',
            '&:hover': {
              background: (theme) => theme.palette.mode === 'dark' 
                ? 'linear-gradient(45deg, #42A5F5, #64B5F6)' 
                : 'linear-gradient(45deg, #16a34a, #15803d)',
              transform: 'scale(1.05)',
            },
            transition: 'all 0.3s ease',
            width: 56,
            height: 56,
          },
          '& .MuiSpeedDialAction-fab': {
            background: (theme) => theme.palette.mode === 'dark' 
              ? 'rgba(255, 255, 255, 0.1)' 
              : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            border: (theme) => theme.palette.mode === 'dark' 
              ? '1px solid rgba(255, 255, 255, 0.2)' 
              : '1px solid rgba(0, 0, 0, 0.1)',
            color: (theme) => theme.palette.mode === 'dark' 
              ? 'rgba(255, 255, 255, 0.9)' 
              : 'rgba(0, 0, 0, 0.7)',
            '&:hover': {
              background: (theme) => theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.2)' 
                : 'rgba(255, 255, 255, 1)',
              transform: 'scale(1.1)',
            },
            transition: 'all 0.3s ease',
          }
        }}
        icon={<SpeedDialIcon icon={<MenuIcon />} openIcon={<AddIcon />} />}
        onClose={() => setSpeedDialOpen(false)}
        onOpen={() => setSpeedDialOpen(true)}
        open={speedDialOpen}
      >
        {speedDialActions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            tooltipTitle={action.name}
            onClick={() => {
              action.action();
              setSpeedDialOpen(false);
            }}
            sx={{
              '& .MuiSpeedDialAction-staticTooltipLabel': {
                background: (theme) => theme.palette.mode === 'dark' 
                  ? 'rgba(0, 0, 0, 0.8)' 
                  : 'rgba(255, 255, 255, 0.9)',
                color: (theme) => theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.9)' 
                  : 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(10px)',
                border: (theme) => theme.palette.mode === 'dark' 
                  ? '1px solid rgba(255, 255, 255, 0.2)' 
                  : '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: 2,
                fontSize: '0.75rem',
                fontWeight: 500,
              }
            }}
          />
        ))}
      </SpeedDial>

      {/* Bottom Navigation */}
      <Paper
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          borderRadius: isSmallMobile ? '12px 12px 0 0' : '16px 16px 0 0',
          background: (theme) => theme.palette.mode === 'dark'
            ? 'linear-gradient(180deg, rgba(10, 15, 26, 0.98) 0%, rgba(5, 8, 15, 0.98) 100%)'
            : 'linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%)',
          backdropFilter: 'blur(20px)',
          border: (theme) => theme.palette.mode === 'dark' 
            ? '1px solid rgba(255, 255, 255, 0.1)' 
            : '1px solid rgba(0, 0, 0, 0.1)',
          borderBottom: 'none',
          boxShadow: (theme) => theme.palette.mode === 'dark' 
            ? '0 -8px 32px rgba(0, 0, 0, 0.3)' 
            : '0 -8px 32px rgba(0, 0, 0, 0.1)',
          '& .MuiBottomNavigation-root': {
            background: 'transparent',
            height: isSmallMobile ? 50 : 60,
            paddingBottom: 'env(safe-area-inset-bottom)',
          },
          '& .MuiBottomNavigationAction-root': {
            minWidth: 'auto',
            padding: isSmallMobile ? '8px 4px' : '12px 6px',
            color: (theme) => theme.palette.mode === 'dark' 
              ? 'rgba(255, 255, 255, 0.6)' 
              : 'rgba(0, 0, 0, 0.6)',
            transition: 'all 0.3s ease',
            borderRadius: isSmallMobile ? 8 : 12,
            margin: isSmallMobile ? '0 2px' : '0 4px',
            '&.Mui-selected': {
              color: (theme) => theme.palette.mode === 'dark' 
                ? 'rgba(100, 181, 246, 1)' 
                : 'rgba(34, 197, 94, 1)',
              transform: 'translateY(-2px)',
              background: (theme) => theme.palette.mode === 'dark' 
                ? 'rgba(100, 181, 246, 0.1)' 
                : 'rgba(34, 197, 94, 0.1)',
            },
            '&:hover': {
              color: (theme) => theme.palette.mode === 'dark' 
                ? 'rgba(100, 181, 246, 0.8)' 
                : 'rgba(34, 197, 94, 0.8)',
              backgroundColor: (theme) => theme.palette.mode === 'dark' 
                ? 'rgba(100, 181, 246, 0.05)' 
                : 'rgba(34, 197, 94, 0.05)',
            },
          },
        }}
        elevation={0}
      >
        <BottomNavigation
          value={getCurrentValue()}
          onChange={handleNavigation}
          showLabels={false}
        >
          {coreNavigationItems.map((item) => (
            <BottomNavigationAction
              key={item.value}
              icon={
                item.badge && item.badge > 0 ? (
                  <Badge
                    badgeContent={item.badge}
                    color="error"
                    sx={{
                      '& .MuiBadge-badge': {
                        fontSize: isSmallMobile ? '0.5rem' : '0.6rem',
                        minWidth: isSmallMobile ? '12px' : '14px',
                        height: isSmallMobile ? '12px' : '14px',
                        borderRadius: isSmallMobile ? '6px' : '7px',
                        background: (theme) => theme.palette.mode === 'dark' 
                          ? 'linear-gradient(45deg, #f06292, #e91e63)' 
                          : 'linear-gradient(45deg, #e91e63, #f06292)',
                        border: (theme) => theme.palette.mode === 'dark' 
                          ? `2px solid rgba(10, 15, 26, 0.98)` 
                          : `2px solid rgba(255, 255, 255, 0.98)`,
                        fontWeight: 600,
                      },
                    }}
                  >
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )
              }
              value={item.value}
            />
          ))}
        </BottomNavigation>
      </Paper>

      {/* Bottom padding to prevent content overlap */}
      <Box sx={{ 
        height: isSmallMobile ? '50px' : '60px', 
        mb: 'env(safe-area-inset-bottom)' 
      }} />
    </>
  );
}
