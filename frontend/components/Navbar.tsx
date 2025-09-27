"use client";
import React, { useEffect, useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Box, 
  Link as MLink, 
  Button, 
  Menu, 
  MenuItem, 
  Avatar, 
  Badge, 
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Stack,
  Divider,
  useTheme,
  useMediaQuery,
  alpha,
  Chip
} from '@mui/material';
import {
  ShoppingCart as ShoppingCartIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  Store as StoreIcon,
  Dashboard as DashboardIcon,
  Login as LoginIcon,
  PersonAdd as PersonAddIcon,
  Logout as LogoutIcon,
  Collections as CollectionsIcon,
  Search as SearchIcon,
  Receipt as OrdersIcon,
  Favorite as FavoriteIcon,
  Person as PersonIcon,
  MonetizationOn as BargainIcon,
  TrendingUp as AffiliateIcon,
  Mic as MicIcon,
  EmojiEvents as EmojiEventsIcon,
  Diamond as DiamondIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import DarkModeToggle from './DarkModeToggle';
import LanguageSwitcher from './LanguageSwitcher';
import AiSearchBar from './AiSearchBar';
import NextLink from 'next/link';
import { useCart } from '@utils/cart';
import { useWishlist } from '@utils/wishlist';
import { useAuth } from '@utils/auth';

export default function Navbar() {
  const { user, logout: authLogout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [navMenuAnchor, setNavMenuAnchor] = useState<null | HTMLElement>(null);
  const [navLoading, setNavLoading] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const open = Boolean(anchorEl);
  const navMenuOpen = Boolean(navMenuAnchor);
  const { items, bookingItems, refreshCart } = useCart();
  const { count: wishlistCount } = useWishlist();
  const { t } = useTranslation('common');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    const handleCartUpdate = () => refreshCart();
    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, [refreshCart]);

  function logout() {
    setNavLoading(true);
    authLogout();
    setTimeout(() => {
      window.location.href = '/';
    }, 300);
  }

  const handleNavigation = (href: string) => {
    setNavLoading(true);
    setMobileOpen(false);
    setTimeout(() => {
      window.location.href = href;
    }, 300);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNavMenuAnchor(event.currentTarget);
  };

  const handleNavMenuClose = () => {
    setNavMenuAnchor(null);
  };

  const menuItems = [
    { text: t('navigation.collections'), href: '/collections', icon: <CollectionsIcon /> },
    { text: t('navigation.viewVendors'), href: '/vendors', icon: <StoreIcon /> },
    { text: t('navigation.products'), href: '/product', icon: <SearchIcon /> },
    { text: t('navigation.achievements'), href: '/achievements', icon: <EmojiEventsIcon /> },
    { text: t('wishlist.title'), href: '/wishlist', icon: <FavoriteIcon /> },
    { text: t('voiceAI.voiceShopping', 'Voice Shopping'), href: '#', icon: <MicIcon />, onClick: () => {
      // Open the AI assistant instead of voice popup
      console.log('Mobile voice button clicked - opening AI assistant');
      const aiButton = document.querySelector('[data-ai-assistant="true"]') as HTMLElement;
      if (aiButton) {
        aiButton.click();
      }
    }, dataVoiceTrigger: true },
  ];

  // Profile menu items for logged-in users
  const profileMenuItems = user ? [
    { text: t('navigation.profile'), href: '/profile', icon: <PersonIcon /> },
  ] : [];

  const MobileDrawer = () => (
    <Box
      sx={{ width: 280 }}
      role="presentation"
    >
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        borderBottom: 1,
        borderColor: 'divider'
      }}>
        <Box
          component="img"
          src="/excom.png"
          alt="Excom"
          sx={(theme) => ({ 
            height: 48, 
            width: 48,
            borderRadius: 1,
            // Add filters for better dark mode visibility
            filter: theme.palette.mode === 'dark' 
              ? 'invert(1) brightness(1.5) contrast(1.2) drop-shadow(0 0 8px rgba(255, 255, 255, 0.3))'
              : 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
            transition: 'all 0.3s ease'
          })}
        />
        <IconButton onClick={handleDrawerToggle}>
          <CloseIcon />
        </IconButton>
      </Box>
      
      <List sx={{ pt: 2 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton 
              component={item.onClick ? 'div' : NextLink}
              href={item.onClick ? undefined : item.href}
              data-voice-trigger={item.dataVoiceTrigger ? 'true' : undefined}
              onClick={() => {
                setMobileOpen(false);
                if (item.onClick) {
                  item.onClick();
                }
              }}
              sx={{ 
                borderRadius: 2, 
                mx: 2, 
                mb: 0.5,
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.1)
                }
              }}
            >
              <ListItemIcon sx={{ color: 'primary.main', minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
        
        {/* Profile menu items for logged-in users */}
        {profileMenuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton 
              component={NextLink}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              sx={{ 
                borderRadius: 2, 
                mx: 2, 
                mb: 0.5,
                '&:hover': {
                  bgcolor: alpha(theme.palette.secondary.main, 0.1)
                }
              }}
            >
              <ListItemIcon sx={{ color: 'secondary.main', minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
        
        <Divider sx={{ my: 2 }} />
        
        {/* Settings Section */}
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
            Settings
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <LanguageSwitcher />
            <DarkModeToggle />
          </Stack>
        </Box>
        
        <Divider sx={{ my: 1 }} />
        
        {!user ? (
          <>
            <ListItem disablePadding>
              <ListItemButton 
                component={NextLink}
                href="/auth/login"
                onClick={() => setMobileOpen(false)}
                sx={{ 
                  borderRadius: 2, 
                  mx: 2, 
                  mb: 0.5,
                  '&:hover': {
                    bgcolor: alpha(theme.palette.success.main, 0.1)
                  }
                }}
              >
                <ListItemIcon sx={{ color: 'success.main', minWidth: 40 }}>
                  <LoginIcon />
                </ListItemIcon>
                <ListItemText primary={t('navigation.login')} />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton 
                component={NextLink}
                href="/auth/register"
                onClick={() => setMobileOpen(false)}
                sx={{ 
                  borderRadius: 2, 
                  mx: 2, 
                  mb: 0.5,
                  '&:hover': {
                    bgcolor: alpha(theme.palette.info.main, 0.1)
                  }
                }}
              >
                <ListItemIcon sx={{ color: 'info.main', minWidth: 40 }}>
                  <PersonAddIcon />
                </ListItemIcon>
                <ListItemText primary={t('navigation.register')} />
              </ListItemButton>
            </ListItem>
          </>
        ) : (
          <>
            <ListItem>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ px: 2 }}>
                <Avatar 
                  src={user.avatar}
                  sx={{ 
                    width: 40, 
                    height: 40,
                    background: user.avatar ? 'transparent' : 'linear-gradient(45deg, #2196F3, #21CBF3)',
                    boxShadow: '0 2px 8px rgba(33, 150, 243, 0.3)'
                  }}
                >
                  {!user.avatar && (user.firstName?.[0] || user.lastName?.[0] || 'U')?.toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" fontWeight={600}>
                    {`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {user.email}
                  </Typography>
                </Box>
              </Stack>
            </ListItem>
            
            {user.role === 'admin' && (
              <ListItem disablePadding>
                <ListItemButton 
                  component={NextLink}
                  href="/dashboard/admin"
                  onClick={() => setMobileOpen(false)}
                  sx={{ 
                    borderRadius: 2, 
                    mx: 2, 
                    mb: 0.5,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.warning.main, 0.1)
                    }
                  }}
                >
                  <ListItemIcon sx={{ color: 'warning.main', minWidth: 40 }}>
                    <DashboardIcon />
                  </ListItemIcon>
                  <ListItemText primary={t('navigation.adminDashboard')} />
                </ListItemButton>
              </ListItem>
            )}
            
            {user.role === 'affiliate' && (
              <ListItem disablePadding>
                <ListItemButton 
                  component={NextLink}
                  href="/dashboard/affiliate"
                  onClick={() => setMobileOpen(false)}
                  sx={{ 
                    borderRadius: 2, 
                    mx: 2, 
                    mb: 0.5,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.success.main, 0.1)
                    }
                  }}
                >
                  <ListItemIcon sx={{ color: 'success.main', minWidth: 40 }}>
                    <AffiliateIcon />
                  </ListItemIcon>
                  <ListItemText primary={t('navigation.affiliateDashboard')} />
                </ListItemButton>
              </ListItem>
            )}
            
            {user.role !== 'admin' && user.role !== 'affiliate' && (
              <ListItem disablePadding>
                <ListItemButton 
                  component={NextLink}
                  href="/dashboard/vendor"
                  onClick={() => setMobileOpen(false)}
                  sx={{ 
                    borderRadius: 2, 
                    mx: 2, 
                    mb: 0.5,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.1)
                    }
                  }}
                >
                  <ListItemIcon sx={{ color: 'primary.main', minWidth: 40 }}>
                    <DashboardIcon />
                  </ListItemIcon>
                  <ListItemText primary={t('navigation.vendorDashboard')} />
                </ListItemButton>
              </ListItem>
            )}
            
            <ListItem disablePadding>
              <ListItemButton 
                component={NextLink}
                href="/orders"
                onClick={() => setMobileOpen(false)}
                sx={{ 
                  borderRadius: 2, 
                  mx: 2, 
                  mb: 0.5,
                  '&:hover': {
                    bgcolor: alpha(theme.palette.secondary.main, 0.1)
                  }
                }}
              >
                <ListItemIcon sx={{ color: 'secondary.main', minWidth: 40 }}>
                  <OrdersIcon />
                </ListItemIcon>
                <ListItemText primary={t('navigation.myOrders')} />
              </ListItemButton>
            </ListItem>
            
            <ListItem disablePadding>
              <ListItemButton 
                component={NextLink}
                href="/bargaining"
                onClick={() => setMobileOpen(false)}
                sx={{ 
                  borderRadius: 2, 
                  mx: 2, 
                  mb: 0.5,
                  '&:hover': {
                    bgcolor: alpha(theme.palette.warning.main, 0.1)
                  }
                }}
              >
                <ListItemIcon sx={{ color: 'warning.main', minWidth: 40 }}>
                  <BargainIcon />
                </ListItemIcon>
                <ListItemText primary={t('navigation.bargaining')} />
              </ListItemButton>
            </ListItem>
            
            <ListItem disablePadding>
              <ListItemButton 
                onClick={() => { logout(); setMobileOpen(false); }}
                sx={{ 
                  borderRadius: 2, 
                  mx: 2, 
                  mb: 0.5,
                  '&:hover': {
                    bgcolor: alpha(theme.palette.error.main, 0.1)
                  }
                }}
              >
                <ListItemIcon sx={{ color: 'error.main', minWidth: 40 }}>
                  <LogoutIcon />
                </ListItemIcon>
                <ListItemText primary={t('navigation.logout')} />
              </ListItemButton>
            </ListItem>
          </>
        )}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={(t) => ({
          borderRadius: 0,
          backdropFilter: 'saturate(180%) blur(20px)',
          background: t.palette.mode === 'dark' 
            ? 'linear-gradient(135deg, rgba(26, 26, 46, 0.95) 0%, rgba(22, 33, 62, 0.95) 50%, rgba(15, 52, 96, 0.95) 100%)'
            : 'linear-gradient(135deg, rgba(102, 126, 234, 0.95) 0%, rgba(118, 75, 162, 0.95) 50%, rgba(240, 147, 251, 0.95) 100%)',
          borderBottom: `1px solid ${alpha(t.palette.divider, 0.2)}`,
          transition: 'all 0.3s ease',
          color: 'white',
          boxShadow: t.palette.mode === 'dark' 
            ? '0 8px 32px rgba(0, 0, 0, 0.5)' 
            : '0 8px 32px rgba(102, 126, 234, 0.3)',
          // Modern enhanced styling
          '& .MuiIconButton-root': {
            color: 'white',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            borderRadius: 2,
            '&:hover': {
              backgroundColor: t.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'rgba(255, 255, 255, 0.15)', 
              transform: 'scale(1.05)',
              boxShadow: t.palette.mode === 'dark' 
                ? '0 4px 12px rgba(255, 255, 255, 0.1)' 
                : '0 4px 12px rgba(255, 255, 255, 0.2)'
            }
          },
          '& .MuiButton-root': {
            color: 'white',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            borderRadius: 2,
            fontWeight: 600,
            '&:hover': {
              backgroundColor: t.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'rgba(255, 255, 255, 0.15)', 
              transform: 'translateY(-2px)',
              boxShadow: t.palette.mode === 'dark' 
                ? '0 8px 25px rgba(255, 255, 255, 0.1)' 
                : '0 8px 25px rgba(255, 255, 255, 0.2)'
            }
          }
        })}
      >
        <Toolbar sx={{ px: { xs: 1, sm: 2 } }}>
          {/* Mobile Menu Button */}
          {isMobile && (
            <IconButton
              onClick={handleDrawerToggle}
              sx={{ 
                mr: 1,
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                }
              }}
              aria-label="menu"
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Logo */}
          <MLink 
            component={NextLink} 
            href="/" 
            underline="none" 
            color="inherit"
            sx={{
              display: 'flex',
              alignItems: 'center',
              transition: 'transform 0.2s ease',
              '&:hover': {
                transform: 'scale(1.05)'
              }
            }}
          >
            <Box
              component="img"
              src="/excom.png"
              alt="Excom"
              sx={(theme) => ({ 
                height: { xs: 48, sm: 52 }, 
                width: { xs: 48, sm: 52 },
                borderRadius: 1,
                // Add filters for better dark mode visibility
                filter: theme.palette.mode === 'dark' 
                  ? 'invert(1) brightness(1.5) contrast(1.2) drop-shadow(0 0 8px rgba(255, 255, 255, 0.3))'
                  : 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
                transition: 'all 0.3s ease',
                '&:hover': {
                  filter: theme.palette.mode === 'dark' 
                    ? 'invert(1) brightness(1.7) contrast(1.3) drop-shadow(0 0 12px rgba(255, 255, 255, 0.4))'
                    : 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15))'
                }
              })}
            />
          </MLink>

          {/* Desktop AI Search Bar */}
          {!isMobile && (
            <Box sx={{ flexGrow: 1, maxWidth: 500, mx: 3 }}>
              <AiSearchBar 
                placeholder={t('navigation.aiSearch')}
                sx={{
                  '& .MuiInputBase-root': {
                    borderRadius: 3,
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    '&:focus-within': {
                      bgcolor: 'rgba(255, 255, 255, 0.15)',
                      borderColor: 'rgba(255, 255, 255, 0.4)',
                      boxShadow: '0 0 0 2px rgba(255, 255, 255, 0.1)'
                    },
                    '& .MuiInputBase-input::placeholder': {
                      color: 'rgba(255, 255, 255, 0.7)',
                      opacity: 1
                    }
                  },
                  '& .MuiInputBase-input': {
                    color: 'white',
                    py: 1.5,
                    px: 2
                  }
                }}
              />
            </Box>
          )}

          {/* Desktop Menu - Compact Layout */}
          {!isMobile && (
            <Stack direction="row" spacing={1} alignItems="center">
              {/* Navigation Dropdown */}
              <Button
                onClick={handleNavMenuOpen}
                startIcon={<CollectionsIcon />}
                endIcon={<Box component="span" sx={{ fontSize: '0.8rem', ml: 0.5 }}>▼</Box>}
                sx={(theme) => ({ 
                  borderRadius: 3,
                  px: 3,
                  py: 1,
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  textTransform: 'none',
                  letterSpacing: '0.5px',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  background: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.08)' 
                    : 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: theme.palette.mode === 'dark' 
                    ? '1px solid rgba(255, 255, 255, 0.15)' 
                    : '1px solid rgba(255, 255, 255, 0.2)',
                  '&:hover': {
                    background: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.15)' 
                      : 'rgba(255, 255, 255, 0.2)', 
                    color: 'white',
                    transform: 'translateY(-2px)',
                    boxShadow: theme.palette.mode === 'dark' 
                      ? '0 8px 25px rgba(255, 255, 255, 0.1)' 
                      : '0 8px 25px rgba(255, 255, 255, 0.2)',
                    borderColor: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.3)' 
                      : 'rgba(255, 255, 255, 0.4)'
                  }
                })}
              >
                {t('navigation.browse')}
              </Button>
              
              {/* AI Assistant Button */}
              <Button 
                data-voice-trigger="true"
                onClick={() => {
                  // Open the AI assistant instead of voice popup
                  console.log('Desktop voice button clicked - opening AI assistant');
                  const aiButton = document.querySelector('[data-ai-assistant="true"]') as HTMLElement;
                  if (aiButton) {
                    aiButton.click();
                  }
                }}
                startIcon={<MicIcon />}
                sx={(theme) => ({ 
                  borderRadius: 3,
                  px: 3,
                  py: 1,
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  textTransform: 'none',
                  letterSpacing: '0.5px',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  background: theme.palette.mode === 'dark' 
                    ? 'linear-gradient(45deg, #FF6B35, #F7931E)' 
                    : 'linear-gradient(45deg, #FF6B35, #F7931E)',
                  boxShadow: theme.palette.mode === 'dark' 
                    ? '0 4px 15px rgba(255, 107, 53, 0.4)' 
                    : '0 4px 15px rgba(255, 107, 53, 0.3)',
                  border: theme.palette.mode === 'dark' 
                    ? '1px solid rgba(255, 255, 255, 0.15)' 
                    : '1px solid rgba(255, 255, 255, 0.2)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #F7931E, #FF6B35)', 
                    color: 'white',
                    transform: 'translateY(-2px)',
                    boxShadow: theme.palette.mode === 'dark' 
                      ? '0 8px 25px rgba(255, 107, 53, 0.6)' 
                      : '0 8px 25px rgba(255, 107, 53, 0.5)',
                    borderColor: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.3)' 
                      : 'rgba(255, 255, 255, 0.4)'
                  }
                })}
              >
                {t('navigation.aiAssistant')}
              </Button>
            </Stack>
          )}

          {/* Navigation Dropdown Menu */}
          <Menu
            anchorEl={navMenuAnchor}
            open={navMenuOpen}
            onClose={handleNavMenuClose}
            PaperProps={{
              sx: (theme) => ({
                borderRadius: 3,
                mt: 1,
                minWidth: 200,
                background: theme.palette.mode === 'dark' 
                  ? 'rgba(26, 26, 46, 0.95)' 
                  : 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                border: theme.palette.mode === 'dark' 
                  ? '1px solid rgba(255, 255, 255, 0.1)' 
                  : '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: theme.palette.mode === 'dark' 
                  ? '0 8px 32px rgba(0, 0, 0, 0.5)' 
                  : '0 8px 32px rgba(102, 126, 234, 0.3)'
              })
            }}
            transformOrigin={{ horizontal: 'left', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
          >
            <MenuItem 
              component={NextLink}
              href="/collections"
              onClick={handleNavMenuClose}
              sx={(theme) => ({
                py: 1.5,
                px: 2,
                borderRadius: 2,
                mx: 1,
                my: 0.5,
                transition: 'all 0.3s ease',
                '&:hover': {
                  bgcolor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.1)' 
                    : 'rgba(102, 126, 234, 0.1)',
                  transform: 'translateX(4px)'
                }
              })}
            >
              <CollectionsIcon sx={{ mr: 2, color: 'primary.main' }} />
              <Typography variant="body2" fontWeight={600}>
                {t('navigation.collections')}
              </Typography>
            </MenuItem>
            <MenuItem 
              component={NextLink}
              href="/vendors"
              onClick={handleNavMenuClose}
              sx={(theme) => ({
                py: 1.5,
                px: 2,
                borderRadius: 2,
                mx: 1,
                my: 0.5,
                transition: 'all 0.3s ease',
                '&:hover': {
                  bgcolor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.1)' 
                    : 'rgba(102, 126, 234, 0.1)',
                  transform: 'translateX(4px)'
                }
              })}
            >
              <StoreIcon sx={{ mr: 2, color: 'primary.main' }} />
              <Typography variant="body2" fontWeight={600}>
                {t('navigation.vendors')}
              </Typography>
            </MenuItem>
            <MenuItem 
              component={NextLink}
              href="/product"
              onClick={handleNavMenuClose}
              sx={(theme) => ({
                py: 1.5,
                px: 2,
                borderRadius: 2,
                mx: 1,
                my: 0.5,
                transition: 'all 0.3s ease',
                '&:hover': {
                  bgcolor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.1)' 
                    : 'rgba(102, 126, 234, 0.1)',
                  transform: 'translateX(4px)'
                }
              })}
            >
              <SearchIcon sx={{ mr: 2, color: 'primary.main' }} />
              <Typography variant="body2" fontWeight={600}>
                {t('navigation.products')}
              </Typography>
            </MenuItem>
            <MenuItem 
              component={NextLink}
              href="/achievements"
              onClick={handleNavMenuClose}
              sx={(theme) => ({
                py: 1.5,
                px: 2,
                borderRadius: 2,
                mx: 1,
                my: 0.5,
                transition: 'all 0.3s ease',
                '&:hover': {
                  bgcolor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.1)' 
                    : 'rgba(102, 126, 234, 0.1)',
                  transform: 'translateX(4px)'
                }
              })}
            >
              <EmojiEventsIcon sx={{ mr: 2, color: 'primary.main' }} />
              <Typography variant="body2" fontWeight={600}>
                {t('navigation.achievements')}
              </Typography>
            </MenuItem>
          </Menu>

          {/* Right side actions - Organized for mobile */}
          <Stack 
            direction="row" 
            spacing={{ xs: 0.5, sm: 1 }} 
            alignItems="center" 
            sx={{ ml: { xs: 1, sm: 2 } }}
          >
            {/* Gamification Stats */}
            {!isMobile && (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mr: 2 }}>
                <Chip
                  icon={<EmojiEventsIcon />}
                  label="Level 5"
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255, 215, 0, 0.2)',
                    color: '#FFD700',
                    fontWeight: 700,
                    border: '1px solid rgba(255, 215, 0, 0.3)',
                    fontSize: '0.7rem'
                  }}
                />
                <Chip
                  icon={<DiamondIcon />}
                  label="1,250"
                  size="small"
                  sx={{
                    bgcolor: 'rgba(138, 43, 226, 0.2)',
                    color: '#8A2BE2',
                    fontWeight: 700,
                    border: '1px solid rgba(138, 43, 226, 0.3)',
                    fontSize: '0.7rem'
                  }}
                />
              </Stack>
            )}
            
            {/* Settings Group - Language & Theme */}
            <Stack direction="row" spacing={0.5} alignItems="center">
              <LanguageSwitcher />
              <DarkModeToggle />
            </Stack>
            
            {/* User Actions Group */}
            {!user ? (
              <Stack direction="row" spacing={{ xs: 0.5, sm: 1 }}>
                {!isMobile && (
                  <Button 
                    component={NextLink} 
                    href="/auth/login" 
                    startIcon={<LoginIcon />}
                    sx={{ 
                      borderRadius: 2,
                      color: 'white',
                      fontWeight: 600,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.15)',
                        color: 'white'
                      }
                    }}
                  >
                    {t('navigation.login')}
                  </Button>
                )}
                <Button 
                  component={NextLink} 
                  href="/auth/register" 
                  variant="contained"
                  startIcon={!isMobile ? <PersonAddIcon /> : undefined}
                  sx={{ 
                    borderRadius: 2,
                    background: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s ease',
                    px: { xs: 1.5, sm: 2 },
                    fontSize: { xs: '0.8rem', sm: '0.9rem' },
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.3)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(255, 255, 255, 0.2)'
                    }
                  }}
                >
                  {isMobile ? t('navigation.join') : t('navigation.register')}
                </Button>
              </Stack>
            ) : (
              <IconButton 
                onClick={(e) => setAnchorEl(e.currentTarget)} 
                aria-label="account"
                sx={{
                  transition: 'transform 0.2s ease',
                  '&:hover': {
                    transform: 'scale(1.1)'
                  }
                }}
              >
                <Avatar 
                  src={user.avatar}
                  sx={{ 
                    width: { xs: 32, sm: 36 }, 
                    height: { xs: 32, sm: 36 },
                    background: user.avatar ? 'transparent' : 'linear-gradient(45deg, #2196F3, #21CBF3)',
                    boxShadow: '0 4px 15px rgba(33, 150, 243, 0.3)'
                  }}
                >
                  {!user.avatar && (user.firstName?.[0] || user.lastName?.[0] || 'U')?.toUpperCase()}
                </Avatar>
              </IconButton>
            )}

            {/* Shopping Actions Group */}
            <Stack direction="row" spacing={0.5} alignItems="center">
              {/* Wishlist */}
              <IconButton 
                component={NextLink} 
                href="/wishlist" 
                aria-label="wishlist"
                sx={{
                  color: 'white',
                  transition: 'all 0.2s ease',
                  p: { xs: 0.5, sm: 1 },
                  '&:hover': {
                    transform: 'scale(1.1)',
                    color: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  }
                }}
              >
                <Badge 
                  badgeContent={wishlistCount || 0} 
                  color="error"
                  sx={{
                    '& .MuiBadge-badge': {
                      right: 1,
                      top: 1,
                      fontSize: '0.7rem',
                      minWidth: '16px',
                      height: '16px',
                      borderRadius: '8px',
                      background: 'linear-gradient(45deg, #e91e63, #f06292)'
                    }
                  }}
                >
                  <FavoriteIcon fontSize="small" />
                </Badge>
              </IconButton>

              {/* Shopping Cart */}
              <IconButton 
                component={NextLink} 
                href="/cart" 
                aria-label="cart"
                sx={{
                  color: 'white',
                  transition: 'all 0.2s ease',
                  p: { xs: 0.5, sm: 1 },
                  '&:hover': {
                    transform: 'scale(1.1)',
                    color: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  }
                }}
              >
                <Badge 
                  badgeContent={items.length + bookingItems.length} 
                  color="primary"
                  sx={{
                    '& .MuiBadge-badge': {
                      right: 1,
                      top: 1,
                      fontSize: '0.7rem',
                      minWidth: '16px',
                      height: '16px',
                      borderRadius: '8px',
                      background: 'linear-gradient(45deg, #FF6B6B, #FF8E53)'
                    }
                  }}
                >
                  <ShoppingCartIcon fontSize="small" />
                </Badge>
              </IconButton>
            </Stack>
          </Stack>

          {/* User Menu */}
          {user && (
            <Menu 
              anchorEl={anchorEl} 
              open={open} 
              onClose={() => setAnchorEl(null)}
              sx={{
                '& .MuiPaper-root': {
                  borderRadius: 2,
                  minWidth: 200,
                  boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                }
              }}
            >
              <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="subtitle2" fontWeight={600}>
                  {`${user.firstName || ''} ${user.lastName || ''}`.trim() || t('user.user')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {user.email}
                </Typography>
              </Box>
              
              <MenuItem 
                component={NextLink} 
                href="/profile"
                sx={{ gap: 1 }}
              >
                <PersonIcon fontSize="small" />
                {t('navigation.profile')}
              </MenuItem>
              
              {user.role === 'admin' && (
                <MenuItem 
                  component={NextLink} 
                  href="/dashboard/admin"
                  sx={{ gap: 1 }}
                >
                  <DashboardIcon fontSize="small" />
                  {t('navigation.adminDashboard')}
                </MenuItem>
              )}
              {user.role === 'affiliate' && (
                <MenuItem 
                  component={NextLink} 
                  href="/dashboard/affiliate"
                  sx={{ gap: 1 }}
                >
                  <AffiliateIcon fontSize="small" />
                  {t('navigation.affiliateDashboard')}
                </MenuItem>
              )}
              {user.role !== 'admin' && user.role !== 'affiliate' && (
                <MenuItem 
                  component={NextLink} 
                  href="/dashboard/vendor"
                  sx={{ gap: 1 }}
                >
                  <DashboardIcon fontSize="small" />
                  {t('navigation.vendorDashboard')}
                </MenuItem>
              )}
              <MenuItem 
                component={NextLink} 
                href="/orders"
                sx={{ gap: 1 }}
              >
                <OrdersIcon fontSize="small" />
                {t('navigation.myOrders')}
              </MenuItem>
              <MenuItem 
                component={NextLink} 
                href="/bargaining"
                sx={{ gap: 1 }}
              >
                <BargainIcon fontSize="small" />
                {t('navigation.bargaining')}
              </MenuItem>
              <MenuItem onClick={logout} sx={{ gap: 1, color: 'error.main' }}>
                <LogoutIcon fontSize="small" />
                {t('navigation.logout')}
              </MenuItem>
            </Menu>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        sx={{
          '& .MuiDrawer-paper': {
            width: 280,
            borderRadius: '0 16px 16px 0',
            background: theme.palette.mode === 'dark' 
              ? 'linear-gradient(180deg, rgba(10, 15, 26, 0.98) 0%, rgba(5, 8, 15, 0.98) 100%)'
              : 'linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${theme.palette.divider}`,
            // Enhanced dark mode styling for drawer
            ...(theme.palette.mode === 'dark' && {
              '& .MuiListItemButton-root': {
                color: theme.palette.text.primary,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                },
                '&.Mui-selected': {
                  backgroundColor: 'rgba(124, 58, 237, 0.15)',
                  color: theme.palette.primary.main,
                }
              },
              '& .MuiListItemIcon-root': {
                color: theme.palette.text.secondary,
              }
            })
          }
        }}
      >
        <MobileDrawer />
      </Drawer>
    </>
  );
}