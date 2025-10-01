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
  LinearProgress
} from '@mui/material';
import {
  Dashboard,
  TrendingUp,
  Link,
  AttachMoney,
  Analytics,
  Settings,
  Logout,
  Menu as MenuIcon,
  People,
  Visibility,
  ShoppingCart,
  Assessment,
  Share,
  ContentCopy,
  Refresh,
  Notifications,
  AccountCircle,
  Home,
  Star,
  EmojiEvents,
  Timeline
} from '@mui/icons-material';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@utils/auth';
import { useTranslation } from 'react-i18next';
import DarkModeToggle from './DarkModeToggle';
import LanguageSwitcher from './LanguageSwitcher';

const drawerWidth = 280;

interface AffiliateLayoutProps {
  children: React.ReactNode;
}

const getMenuItems = (t: any) => [
  {
    text: t('affiliate.dashboard'),
    icon: <Dashboard />,
    path: '/dashboard/affiliate',
    badge: null
  },
  {
    text: t('affiliate.myLinks'),
    icon: <Link />,
    path: '/dashboard/affiliate/links',
    badge: null
  },
  {
    text: t('affiliate.earnings'),
    icon: <AttachMoney />,
    path: '/dashboard/affiliate/earnings',
    badge: null
  },
  {
    text: t('affiliate.analytics'),
    icon: <Analytics />,
    path: '/dashboard/affiliate/analytics',
    badge: null
  },
  {
    text: t('affiliate.products'),
    icon: <ShoppingCart />,
    path: '/dashboard/affiliate/products',
    badge: null
  },
  {
    text: t('affiliate.performance'),
    icon: <Assessment />,
    path: '/dashboard/affiliate/performance',
    badge: null
  },
  {
    text: t('affiliate.settings'),
    icon: <Settings />,
    path: '/dashboard/affiliate/settings',
    badge: null
  }
];

const getQuickActions = (t: any) => [
  {
    text: t('affiliate.generateLink'),
    icon: <Link />,
    path: '/dashboard/affiliate/links/generate',
    color: 'primary'
  },
  {
    text: t('affiliate.shareProducts'),
    icon: <Share />,
    path: '/dashboard/affiliate/share',
    color: 'success'
  },
  {
    text: t('affiliate.viewStats'),
    icon: <Timeline />,
    path: '/dashboard/affiliate/analytics',
    color: 'info'
  }
];

const getAchievementItems = (t: any) => [
  {
    text: t('affiliate.firstSale'),
    icon: <Star />,
    completed: true,
    color: 'gold'
  },
  {
    text: t('affiliate.hundredClicks'),
    icon: <Visibility />,
    completed: false,
    color: 'silver'
  },
  {
    text: t('affiliate.topPerformer'),
    icon: <EmojiEvents />,
    completed: false,
    color: 'bronze'
  }
];

export default function AffiliateLayout({ children }: AffiliateLayoutProps) {
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
  const achievementItems = getAchievementItems(t);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  const isActive = (path: string) => {
    if (path === '/dashboard/affiliate') {
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
          ? 'linear-gradient(135deg, #dc2626 0%, #f59e0b 100%)'
          : 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)',
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
            ? 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.08"%3E%3Cpolygon points="30,5 35,20 50,20 38,30 43,45 30,35 17,45 22,30 10,20 25,20"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
            : 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Cpolygon points="30,5 35,20 50,20 38,30 43,45 30,35 17,45 22,30 10,20 25,20"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          animation: 'sparkle 15s linear infinite',
        }
      }}>
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h6" fontWeight={800} gutterBottom sx={{ 
            background: 'linear-gradient(45deg, #ffffff 30%, #fff8dc 90%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: 'shimmer 2s ease-in-out infinite alternate'
          }}>
            🎯 {t('affiliate.affiliateHub')}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            {t('affiliate.maximizeEarnings')}
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
          animation: 'bounce 2s ease-in-out infinite'
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
          animation: 'bounce 2s ease-in-out infinite 1s'
        }} />
      </Box>

      {/* User Profile Section */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ 
            bgcolor: 'secondary.main',
            width: 48,
            height: 48,
            fontSize: '1.2rem'
          }}>
            {user?.name?.charAt(0) || 'A'}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight={600} noWrap>
              {user?.name || 'Affiliate'}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {user?.email || 'affiliate@example.com'}
            </Typography>
          </Box>
          <IconButton size="small" color="primary">
            <Notifications />
          </IconButton>
        </Box>
        
        {/* Performance Indicator */}
        <Box sx={{ 
          mt: 2, 
          p: 2, 
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, rgba(220,38,38,0.15) 0%, rgba(245,158,11,0.15) 100%)'
            : 'linear-gradient(135deg, rgba(255,107,107,0.1) 0%, rgba(254,202,87,0.1) 100%)',
          borderRadius: 2,
          border: theme.palette.mode === 'dark'
            ? '1px solid rgba(220,38,38,0.3)'
            : '1px solid rgba(255,107,107,0.2)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)'
              : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
            animation: 'shimmer 3s infinite'
          }
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, position: 'relative', zIndex: 1 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              {t('affiliate.performanceLevel')}
            </Typography>
            <Typography variant="caption" fontWeight={700} sx={{
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(45deg, #dc2626, #f59e0b)'
                : 'linear-gradient(45deg, #ff6b6b, #feca57)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              ⭐ {t('affiliate.risingStar')}
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={65} 
            sx={{ 
              height: 8, 
              borderRadius: 4,
              bgcolor: 'rgba(0,0,0,0.1)',
              position: 'relative',
              zIndex: 1,
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(90deg, #dc2626 0%, #f59e0b 50%, #dc2626 100%)'
                  : 'linear-gradient(90deg, #ff6b6b 0%, #feca57 50%, #ff6b6b 100%)',
                backgroundSize: '200% 100%',
                animation: 'gradient 2s ease infinite'
              }
            }} 
          />
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
                    backgroundColor: 'secondary.main',
                    color: 'secondary.contrastText',
                    '&:hover': {
                      backgroundColor: 'secondary.dark',
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

        {/* Theme and Language Controls */}
        <Box sx={{ px: 2, mb: 2 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1, display: 'block' }}>
            {t('affiliate.preferences').toUpperCase()}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <Box sx={{ flex: 1 }}>
              <DarkModeToggle />
            </Box>
            <Box sx={{ flex: 1 }}>
              <LanguageSwitcher />
            </Box>
          </Box>
        </Box>

        <Divider sx={{ mx: 2, my: 2 }} />

        {/* Quick Actions */}
        <Box sx={{ px: 2, mb: 2 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1, display: 'block' }}>
            {t('affiliate.quickActions').toUpperCase()}
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

        <Divider sx={{ mx: 2, my: 2 }} />

        {/* Achievements */}
        <Box sx={{ px: 2, mb: 2 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1, display: 'block' }}>
            {t('affiliate.achievements').toUpperCase()}
          </Typography>
          {achievementItems.map((achievement, index) => (
            <Box
              key={achievement.text}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 1,
                borderRadius: 1,
                bgcolor: achievement.completed 
                  ? (theme.palette.mode === 'dark' ? 'rgba(34,197,94,0.2)' : 'success.light')
                  : (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'action.hover'),
                mb: 1,
                opacity: achievement.completed ? 1 : 0.6,
                border: achievement.completed 
                  ? (theme.palette.mode === 'dark' ? '1px solid rgba(34,197,94,0.3)' : 'none')
                  : 'none'
              }}
            >
              <Box sx={{ 
                color: achievement.completed ? 'success.main' : 'text.disabled',
                display: 'flex',
                alignItems: 'center'
              }}>
                {achievement.icon}
              </Box>
              <Typography variant="caption" sx={{ flex: 1 }}>
                {achievement.text}
              </Typography>
              {achievement.completed && (
                <Chip 
                  label="✓" 
                  size="small" 
                  sx={{ 
                    height: 20, 
                    fontSize: '0.7rem',
                    bgcolor: 'success.main',
                    color: 'white'
                  }} 
                />
              )}
            </Box>
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
          {t('affiliate.logout')}
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ 
      display: 'flex', 
      minHeight: '100vh',
      '@keyframes sparkle': {
        '0%': { transform: 'rotate(0deg)' },
        '100%': { transform: 'rotate(360deg)' }
      },
      '@keyframes bounce': {
        '0%, 100%': { transform: 'translateY(0px)' },
        '50%': { transform: 'translateY(-15px)' }
      },
      '@keyframes shimmer': {
        '0%': { textShadow: '0 0 5px rgba(255,255,255,0.5)' },
        '100%': { textShadow: '0 0 20px rgba(255,255,255,0.8), 0 0 30px rgba(255,215,0,0.6)' }
      },
      '@keyframes gradient': {
        '0%': { backgroundPosition: '0% 50%' },
        '50%': { backgroundPosition: '100% 50%' },
        '100%': { backgroundPosition: '0% 50%' }
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
          
          {/* Theme and Language Controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DarkModeToggle />
            <LanguageSwitcher />
          </Box>
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
                ? 'linear-gradient(180deg, #1a0a0a 0%, #2d1b1b 100%)'
                : 'linear-gradient(180deg, #fff5f5 0%, #ffffff 100%)',
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
          minHeight: '100vh',
          // Enhanced responsive design
          '@media (max-width: 768px)': {
            width: '100%',
            padding: 0,
          },
          '@media (min-width: 769px) and (max-width: 1024px)': {
            padding: 1,
          },
          '@media (min-width: 1025px)': {
            padding: 2,
          }
        }}
      >
        <Toolbar />
        <Box sx={{ 
          width: '100%',
          height: '100%',
          overflow: 'auto',
          // Ensure proper scrolling on mobile
          WebkitOverflowScrolling: 'touch'
        }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
