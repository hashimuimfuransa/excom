import React from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Button,
  IconButton,
  useTheme,
  useMediaQuery,
  Typography,
  Badge,
  Collapse,
  Chip,
  Stack
} from '@mui/material';
import {
  Dashboard,
  Store,
  ShoppingBag,
  Receipt,
  Analytics,
  Settings,
  AttachMoney,
  Logout,
  Menu as MenuIcon,
  People as AffiliateIcon,
  TrendingUp,
  Inventory,
  LocalShipping,
  Chat,
  MonetizationOn,
  ExpandLess,
  ExpandMore,
  Notifications,
  AccountCircle,
  Home
} from '@mui/icons-material';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@utils/auth';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import DarkModeToggle from './DarkModeToggle';

const drawerWidth = 280;

interface VendorLayoutProps {
  children: React.ReactNode;
}

const getMenuItems = (t: any) => [
  {
    text: t('vendor.dashboard'),
    icon: <Dashboard />,
    path: '/dashboard/vendor',
    badge: null
  },
  {
    text: t('vendor.myStores'),
    icon: <Store />,
    path: '/dashboard/vendor/stores',
    badge: null
  },
  {
    text: t('vendor.products'),
    icon: <ShoppingBag />,
    path: '/dashboard/vendor/products',
    badge: null
  },
  {
    text: t('vendor.orders'),
    icon: <Receipt />,
    path: '/dashboard/vendor/orders',
    badge: null
  },
  {
    text: t('vendor.bargaining'),
    icon: <MonetizationOn />,
    path: '/dashboard/vendor/bargaining',
    badge: null
  },
  {
    text: t('vendor.analytics'),
    icon: <Analytics />,
    path: '/dashboard/vendor/analytics',
    badge: null
  },
  {
    text: t('vendor.affiliateProgram'),
    icon: <AffiliateIcon />,
    path: '/dashboard/vendor/affiliate',
    badge: null
  },
      {
        text: t('vendor.aiSupport'),
        icon: <Chat />,
        path: '/dashboard/vendor/ai-support-new',
        badge: null
      },
  {
    text: t('vendor.settings'),
    icon: <Settings />,
    path: '/dashboard/vendor/settings',
    badge: null
  }
];

const getQuickActions = (t: any) => [
  {
    text: t('vendor.addProduct'),
    icon: <Inventory />,
    path: '/dashboard/vendor/products/add',
    color: 'primary'
  },
  {
    text: t('vendor.createStore'),
    icon: <Store />,
    path: '/dashboard/vendor/stores',
    color: 'secondary'
  },
  {
    text: t('vendor.viewOrders'),
    icon: <LocalShipping />,
    path: '/dashboard/vendor/orders',
    color: 'success'
  },
      {
        text: t('vendor.aiSupport'),
        icon: <Chat />,
        path: '/dashboard/vendor/ai-support-new',
        color: 'info'
      },
  {
    text: t('vendor.bargaining'),
    icon: <MonetizationOn />,
    path: '/dashboard/vendor/bargaining',
    color: 'warning'
  }
];

export default function VendorLayout({ children }: VendorLayoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [expandedItems, setExpandedItems] = React.useState<string[]>([]);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  
  const menuItems = getMenuItems(t);
  const quickActions = getQuickActions(t);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  const isActive = (path: string) => {
    if (path === '/dashboard/vendor') {
      return pathname === path;
    }
    return pathname.startsWith(path);
  };

  const handleItemClick = (path: string) => {
    router.push(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ 
        p: 3, 
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%)'
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: theme.palette.mode === 'dark'
            ? 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.08"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
            : 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          animation: 'float 20s ease-in-out infinite',
        }
      }}>
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h6" fontWeight={800} gutterBottom sx={{ 
            background: 'linear-gradient(45deg, #ffffff 30%, #f0f0f0 90%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: 'glow 2s ease-in-out infinite alternate'
          }}>
            🏪 {t('vendor.vendor')}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            {t('vendor.manageBusiness')}
          </Typography>
        </Box>
        {/* Animated decorative elements */}
        <Box sx={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: theme.palette.mode === 'dark' 
            ? 'rgba(255,255,255,0.15)' 
            : 'rgba(255,255,255,0.1)',
          zIndex: 0,
          animation: 'pulse 3s ease-in-out infinite'
        }} />
        <Box sx={{
          position: 'absolute',
          bottom: -30,
          left: -30,
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: theme.palette.mode === 'dark' 
            ? 'rgba(255,255,255,0.08)' 
            : 'rgba(255,255,255,0.05)',
          zIndex: 0,
          animation: 'pulse 3s ease-in-out infinite 1.5s'
        }} />
      </Box>

      {/* User Profile Section */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ 
            bgcolor: 'primary.main',
            width: 48,
            height: 48,
            fontSize: '1.2rem'
          }}>
            {user?.name?.charAt(0) || 'V'}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight={600} noWrap>
              {user?.name || t('vendor.vendor')}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {user?.email || 'vendor@example.com'}
            </Typography>
          </Box>
          <IconButton size="small" color="primary">
            <Notifications />
          </IconButton>
        </Box>
      </Box>

      {/* Navigation Menu */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <List sx={{ px: 1, py: 1 }}>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={isActive(item.path)}
                onClick={() => handleItemClick(item.path)}
                sx={{
                  borderRadius: 2,
                  mx: 1,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'inherit',
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'action.hover',
                    transform: 'translateX(4px)',
                    transition: 'all 0.2s ease-in-out',
                  },
                  // Mobile touch feedback
                  '@media (hover: none)': {
                    '&:active': {
                      backgroundColor: 'action.selected',
                      transform: 'scale(0.98)',
                    }
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text}
                  primaryTypographyProps={{ 
                    fontWeight: isActive(item.path) ? 600 : 500,
                    fontSize: '0.9rem'
                  }}
                />
                {item.badge && (
                  <Badge badgeContent={item.badge} color="error" />
                )}
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Divider sx={{ mx: 2, my: 2 }} />

        {/* Quick Actions */}
        <Box sx={{ px: 2, mb: 2 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1, display: 'block' }}>
            {t('vendor.quickActions').toUpperCase()}
          </Typography>
          {quickActions.map((action) => (
            <Button
              key={action.text}
              fullWidth
              variant="outlined"
              size="small"
              startIcon={action.icon}
              onClick={() => handleItemClick(action.path)}
              sx={{
                mb: 1,
                justifyContent: 'flex-start',
                textTransform: 'none',
                borderColor: `${action.color}.main`,
                color: `${action.color}.main`,
                '&:hover': {
                  backgroundColor: `${action.color}.main`,
                  color: 'white',
                  transform: 'translateY(-1px)',
                  boxShadow: 2,
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              {action.text}
            </Button>
          ))}
        </Box>
      </Box>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<Logout />}
          onClick={handleLogout}
          sx={{
            color: 'error.main',
            borderColor: 'error.main',
            '&:hover': {
              backgroundColor: 'error.main',
              color: 'white',
            },
          }}
        >
          {t('vendor.logout')}
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ 
      display: 'flex', 
      minHeight: '100vh',
      '@keyframes float': {
        '0%, 100%': { transform: 'translateY(0px)' },
        '50%': { transform: 'translateY(-10px)' }
      },
      '@keyframes pulse': {
        '0%, 100%': { transform: 'scale(1)', opacity: 0.5 },
        '50%': { transform: 'scale(1.1)', opacity: 0.8 }
      },
      '@keyframes glow': {
        '0%': { textShadow: '0 0 5px rgba(255,255,255,0.5)' },
        '100%': { textShadow: '0 0 20px rgba(255,255,255,0.8)' }
      }
    }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          backgroundColor: 'background.paper',
          color: 'text.primary',
          boxShadow: 1,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {menuItems.find(item => isActive(item.path))?.text || 'Dashboard'}
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1}>
            <LanguageSwitcher />
            <DarkModeToggle />
            <IconButton color="inherit" onClick={() => router.push('/')}>
              <Home />
            </IconButton>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Navigation Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ 
            keepMounted: true,
            disableScrollLock: false
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              border: 'none',
              boxShadow: theme.shadows[8],
              // Mobile optimizations
              touchAction: 'pan-y',
              WebkitOverflowScrolling: 'touch'
            },
            // Better mobile backdrop
            '& .MuiBackdrop-root': {
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(4px)'
            }
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              border: 'none',
              boxShadow: theme.shadows[2],
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(180deg, #1a1a1a 0%, #2d2d2d 100%)'
                : 'linear-gradient(180deg, #fafafa 0%, #ffffff 100%)',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          backgroundColor: 'background.default',
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
