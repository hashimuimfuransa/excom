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
  alpha
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
  Person as PersonIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import DarkModeToggle from './DarkModeToggle';
import LanguageSwitcher from './LanguageSwitcher';
import NextLink from 'next/link';
import { useCart } from '@utils/cart';
import { useWishlist } from '@utils/wishlist';
import { useAuth } from '@utils/auth.tsx';

export default function Navbar() {
  const { user, logout: authLogout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [navLoading, setNavLoading] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const open = Boolean(anchorEl);
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

  const menuItems = [
    { text: t('navigation.collections'), href: '/collections', icon: <CollectionsIcon /> },
    { text: t('navigation.viewVendors'), href: '/vendors', icon: <StoreIcon /> },
    { text: t('navigation.products'), href: '/product', icon: <SearchIcon /> },
    { text: t('wishlist.title'), href: '/wishlist', icon: <FavoriteIcon /> },
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
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box
            component="img"
            src="/excom.png"
            alt="Excom"
            sx={{ height: 32, width: 32 }}
          />
          <Typography variant="h6" fontWeight={700}>
            Excom
          </Typography>
        </Stack>
        <IconButton onClick={handleDrawerToggle}>
          <CloseIcon />
        </IconButton>
      </Box>
      
      <List sx={{ pt: 2 }}>
        {menuItems.map((item) => (
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
        
        {/* Language Switcher in Mobile */}
        <ListItem sx={{ px: 2, py: 1 }}>
          <LanguageSwitcher />
        </ListItem>
        
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
            
            {user.role !== 'admin' && (
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
          backgroundColor: t.palette.mode === 'dark' 
            ? alpha(t.palette.background.paper, 0.85)
            : alpha('#ffffff', 0.95),
          borderBottom: `1px solid ${alpha(t.palette.divider, 0.3)}`,
          transition: 'all 0.3s ease',
          color: t.palette.mode === 'dark' ? t.palette.text.primary : '#1a1a1a'
        })}
      >
        <Toolbar sx={{ px: { xs: 1, sm: 2 } }}>
          {/* Mobile Menu Button */}
          {isMobile && (
            <IconButton
              onClick={handleDrawerToggle}
              sx={{ 
                mr: 1,
                color: theme.palette.mode === 'dark' ? 'inherit' : '#1a1a1a'
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
              gap: 1,
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
              sx={{ 
                height: { xs: 32, sm: 36 }, 
                width: { xs: 32, sm: 36 },
                borderRadius: 1
              }}
            />
            <Typography 
              variant="h6" 
              fontWeight={800}
              sx={{ 
                background: 'linear-gradient(45deg, #2196F3, #21CBF3)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: { xs: isMobile ? 'none' : 'block', sm: 'block' }
              }}
            >
              Excom
            </Typography>
          </MLink>

          <Box sx={{ flexGrow: 1 }} />

          {/* Desktop Menu */}
          {!isMobile && (
            <Stack direction="row" spacing={1} alignItems="center">
              <Button 
                component={NextLink}
                href="/collections" 
                startIcon={<CollectionsIcon />}
                sx={{ 
                  borderRadius: 2,
                  px: 2,
                  color: theme.palette.mode === 'dark' ? 'inherit' : '#1a1a1a',
                  fontWeight: 600,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    transform: 'translateY(-1px)'
                  }
                }}
              >
                {t('navigation.collections')}
              </Button>
              <Button 
                component={NextLink}
                href="/vendors" 
                startIcon={<StoreIcon />}
                sx={{ 
                  borderRadius: 2,
                  px: 2,
                  color: theme.palette.mode === 'dark' ? 'inherit' : '#1a1a1a',
                  fontWeight: 600,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    transform: 'translateY(-1px)'
                  }
                }}
              >
                {t('navigation.vendors')}
              </Button>
              <Button 
                component={NextLink}
                href="/product" 
                startIcon={<SearchIcon />}
                sx={{ 
                  borderRadius: 2,
                  px: 2,
                  color: theme.palette.mode === 'dark' ? 'inherit' : '#1a1a1a',
                  fontWeight: 600,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    transform: 'translateY(-1px)'
                  }
                }}
              >
                {t('navigation.products')}
              </Button>
            </Stack>
          )}

          {/* Right side actions */}
          <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: 2 }}>
            <LanguageSwitcher />
            <DarkModeToggle />
            
            {!user ? (
              <Stack direction="row" spacing={1}>
                {!isMobile && (
                  <Button 
                    component={NextLink} 
                    href="/auth/login" 
                    startIcon={<LoginIcon />}
                    sx={{ 
                      borderRadius: 2,
                      color: theme.palette.mode === 'dark' ? 'inherit' : '#1a1a1a',
                      fontWeight: 600,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.success.main, 0.1),
                        color: theme.palette.success.main
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
                    background: 'linear-gradient(45deg, #2196F3, #21CBF3)',
                    boxShadow: '0 4px 15px rgba(33, 150, 243, 0.3)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(33, 150, 243, 0.4)'
                    }
                  }}
                >
                  {isMobile ? t('navigation.join') : t('navigation.register')}
                </Button>
              </Stack>
            ) : (
              <>
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
                      width: { xs: 36, sm: 40 }, 
                      height: { xs: 36, sm: 40 },
                      background: user.avatar ? 'transparent' : 'linear-gradient(45deg, #2196F3, #21CBF3)',
                      boxShadow: '0 4px 15px rgba(33, 150, 243, 0.3)'
                    }}
                  >
                    {!user.avatar && (user.firstName?.[0] || user.lastName?.[0] || 'U')?.toUpperCase()}
                  </Avatar>
                </IconButton>
                
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
                  {user.role !== 'admin' && (
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
                  <MenuItem onClick={logout} sx={{ gap: 1, color: 'error.main' }}>
                    <LogoutIcon fontSize="small" />
                    {t('navigation.logout')}
                  </MenuItem>
                </Menu>
              </>
            )}

            {/* Wishlist */}
            <IconButton 
              component={NextLink} 
              href="/wishlist" 
              aria-label="wishlist"
              sx={{
                color: theme.palette.mode === 'dark' ? 'inherit' : '#1a1a1a',
                transition: 'transform 0.2s ease',
                '&:hover': {
                  transform: 'scale(1.1)',
                  color: theme.palette.primary.main
                }
              }}
            >
              <Badge 
                badgeContent={wishlistCount || 0} 
                color="error"
                sx={{
                  '& .MuiBadge-badge': {
                    right: 2,
                    top: 2,
                    fontSize: '0.75rem',
                    minWidth: '20px',
                    height: '20px',
                    borderRadius: '10px',
                    background: 'linear-gradient(45deg, #e91e63, #f06292)'
                  }
                }}
              >
                <FavoriteIcon />
              </Badge>
            </IconButton>

            {/* Shopping Cart */}
            <IconButton 
              component={NextLink} 
              href="/cart" 
              aria-label="cart"
              sx={{
                color: theme.palette.mode === 'dark' ? 'inherit' : '#1a1a1a',
                transition: 'transform 0.2s ease',
                '&:hover': {
                  transform: 'scale(1.1)',
                  color: theme.palette.primary.main
                }
              }}
            >
              <Badge 
                badgeContent={items.length + bookingItems.length} 
                color="primary"
                sx={{
                  '& .MuiBadge-badge': {
                    right: 2,
                    top: 2,
                    fontSize: '0.75rem',
                    minWidth: '20px',
                    height: '20px',
                    borderRadius: '10px',
                    background: 'linear-gradient(45deg, #FF6B6B, #FF8E53)'
                  }
                }}
              >
                <ShoppingCartIcon />
              </Badge>
            </IconButton>
          </Stack>
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
              ? 'linear-gradient(180deg, rgba(30,30,30,0.95) 0%, rgba(15,15,15,0.95) 100%)'
              : 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(250,250,250,0.95) 100%)',
            backdropFilter: 'blur(20px)'
          }
        }}
      >
        <MobileDrawer />
      </Drawer>
    </>
  );
}