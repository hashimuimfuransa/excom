import React from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
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
  Chip,
  Collapse,
  Badge
} from '@mui/material';
import {
  Dashboard,
  People,
  Store,
  ShoppingBag,
  Receipt,
  Analytics,
  Settings,
  AttachMoney,
  Logout,
  Menu as MenuIcon,
  Group as AffiliateIcon,
  ExpandLess,
  ExpandMore,
  AdminPanelSettings,
  TrendingUp,
  Security,
  NotificationsActive
} from '@mui/icons-material';
import { usePathname, useRouter } from 'next/navigation';

const drawerWidth = 300;

interface AdminLayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  {
    category: 'Overview',
    items: [
      {
        text: 'Dashboard',
        icon: <Dashboard />,
        path: '/dashboard/admin',
        color: 'primary'
      }
    ]
  },
  {
    category: 'Management',
    items: [
      {
        text: 'Users',
        icon: <People />,
        path: '/dashboard/admin/users',
        color: 'info',
        badge: 12
      },
      {
        text: 'Stores',
        icon: <Store />,
        path: '/dashboard/admin/stores',
        color: 'success',
        submenu: [
          { text: 'All Stores', path: '/dashboard/admin/stores/all' },
          { text: 'Pending Stores', path: '/dashboard/admin/stores', badge: 3 }
        ]
      },
      {
        text: 'Products',
        icon: <ShoppingBag />,
        path: '/dashboard/admin/products',
        color: 'warning'
      },
      {
        text: 'Orders',
        icon: <Receipt />,
        path: '/dashboard/admin/orders',
        color: 'secondary',
        badge: 5
      }
    ]
  },
  {
    category: 'Business',
    items: [
      {
        text: 'Earnings',
        icon: <AttachMoney />,
        path: '/dashboard/admin/earnings',
        color: 'success'
      },
      {
        text: 'Affiliate Management',
        icon: <AffiliateIcon />,
        path: '/dashboard/admin/affiliate',
        color: 'info'
      },
      {
        text: 'Analytics',
        icon: <Analytics />,
        path: '/dashboard/admin/analytics',
        color: 'primary'
      }
    ]
  },
  {
    category: 'System',
    items: [
      {
        text: 'Settings',
        icon: <Settings />,
        path: '/dashboard/admin/settings',
        color: 'default'
      }
    ]
  }
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [expandedItems, setExpandedItems] = React.useState<{ [key: string]: boolean }>({});
  const pathname = usePathname();
  const router = useRouter();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleToggleExpand = (itemText: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemText]: !prev[itemText]
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem('excom_token');
    localStorage.removeItem('excom_user');
    router.push('/auth/login');
  };

  const isActive = (path: string) => {
    if (path === '/dashboard/admin') {
      return pathname === path;
    }
    return pathname.startsWith(path);
  };

  const drawer = (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      background: theme.palette.mode === 'dark' 
        ? 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)'
        : 'linear-gradient(180deg, #ffffff 0%, #f8fafc 50%, #e2e8f0 100%)',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: theme.palette.mode === 'dark'
          ? 'radial-gradient(circle at 30% 20%, rgba(120, 119, 198, 0.15) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(255, 119, 198, 0.1) 0%, transparent 50%)'
          : 'radial-gradient(circle at 30% 20%, rgba(59, 130, 246, 0.08) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(147, 51, 234, 0.05) 0%, transparent 50%)',
        pointerEvents: 'none'
      }
    }}>
      {/* Header Section */}
      <Box sx={{ 
        p: 3, 
        position: 'relative',
        zIndex: 1,
        borderBottom: `1px solid ${theme.palette.divider}`,
        background: theme.palette.mode === 'dark' 
          ? 'rgba(26, 26, 46, 0.8)' 
          : 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)'
          }}>
            <AdminPanelSettings sx={{ color: 'white', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: '1.1rem'
            }}>
              ExCom Admin
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
              Platform Management
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Navigation Menu */}
      <Box sx={{ flex: 1, overflow: 'auto', position: 'relative', zIndex: 1 }}>
        {menuItems.map((category, categoryIndex) => (
          <Box key={category.category} sx={{ mb: categoryIndex === menuItems.length - 1 ? 0 : 2 }}>
            {/* Category Header */}
            <Box sx={{ px: 3, py: 1.5 }}>
              <Typography variant="caption" sx={{ 
                fontWeight: 700, 
                textTransform: 'uppercase', 
                letterSpacing: 1,
                color: 'text.secondary',
                fontSize: '0.7rem'
              }}>
                {category.category}
              </Typography>
            </Box>

            {/* Category Items */}
            <List sx={{ px: 2 }}>
              {category.items.map((item) => (
                <React.Fragment key={item.text}>
                  <ListItem disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                      selected={isActive(item.path)}
                      onClick={() => {
                        if (item.submenu) {
                          handleToggleExpand(item.text);
                        } else {
                          router.push(item.path);
                        }
                      }}
                      sx={{
                        borderRadius: 2,
                        py: 1.2,
                        px: 2,
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
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
                            ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)'
                            : 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 51, 234, 0.05) 100%)',
                          opacity: 0,
                          transition: 'opacity 0.2s ease'
                        },
                        '&:hover': {
                          transform: 'translateX(4px)',
                          '&::before': {
                            opacity: 1
                          },
                          '& .MuiListItemIcon-root': {
                            transform: 'scale(1.1)',
                            color: `${item.color}.main`
                          }
                        },
                        '&.Mui-selected': {
                          background: theme.palette.mode === 'dark'
                            ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)'
                            : 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)',
                          border: `1px solid ${theme.palette[item.color as keyof typeof theme.palette]?.main || theme.palette.primary.main}20`,
                          '&::before': {
                            opacity: 1
                          },
                          '& .MuiListItemIcon-root': {
                            color: `${item.color}.main`
                          },
                          '& .MuiListItemText-primary': {
                            fontWeight: 700,
                            color: `${item.color}.main`
                          }
                        },
                        '& .MuiListItemIcon-root': {
                          minWidth: 44,
                          transition: 'all 0.2s ease',
                          color: 'text.secondary'
                        },
                        '& .MuiListItemText-primary': {
                          fontWeight: 600,
                          fontSize: '0.9rem',
                          transition: 'all 0.2s ease'
                        }
                      }}
                    >
                      <ListItemIcon>
                        {item.badge ? (
                          <Badge badgeContent={item.badge} color="error" sx={{ '& .MuiBadge-badge': { fontSize: '0.7rem', height: 18, minWidth: 18 } }}>
                            {item.icon}
                          </Badge>
                        ) : (
                          item.icon
                        )}
                      </ListItemIcon>
                      <ListItemText primary={item.text} />
                      {item.submenu && (
                        expandedItems[item.text] ? <ExpandLess /> : <ExpandMore />
                      )}
                    </ListItemButton>
                  </ListItem>

                  {/* Submenu Items */}
                  {item.submenu && (
                    <Collapse in={expandedItems[item.text]} timeout="auto" unmountOnExit>
                      <List component="div" disablePadding>
                        {item.submenu.map((subItem) => (
                          <ListItem key={subItem.text} disablePadding sx={{ mb: 0.5, ml: 2 }}>
                            <ListItemButton
                              selected={pathname === subItem.path}
                              onClick={() => router.push(subItem.path)}
                              sx={{
                                borderRadius: 2,
                                py: 1,
                                px: 2,
                                transition: 'all 0.2s ease',
                                '&.Mui-selected': {
                                  background: theme.palette.mode === 'dark'
                                    ? 'rgba(102, 126, 234, 0.15)'
                                    : 'rgba(59, 130, 246, 0.08)',
                                  border: `1px solid ${theme.palette[item.color as keyof typeof theme.palette]?.main || theme.palette.primary.main}30`,
                                  '& .MuiListItemText-primary': {
                                    fontWeight: 600,
                                    color: `${item.color}.main`
                                  }
                                },
                                '&:hover': {
                                  background: theme.palette.mode === 'dark'
                                    ? 'rgba(102, 126, 234, 0.1)'
                                    : 'rgba(59, 130, 246, 0.05)',
                                  transform: 'translateX(2px)'
                                },
                                '& .MuiListItemText-primary': {
                                  fontSize: '0.85rem',
                                  fontWeight: 500
                                }
                              }}
                            >
                              <ListItemText primary={subItem.text} />
                              {subItem.badge && (
                                <Chip 
                                  label={subItem.badge} 
                                  size="small" 
                                  color="error" 
                                  sx={{ 
                                    height: 20, 
                                    fontSize: '0.7rem',
                                    '& .MuiChip-label': { px: 1 }
                                  }} 
                                />
                              )}
                            </ListItemButton>
                          </ListItem>
                        ))}
                      </List>
                    </Collapse>
                  )}
                </React.Fragment>
              ))}
            </List>
          </Box>
        ))}
      </Box>

      {/* Footer Section */}
      <Box sx={{ 
        p: 2, 
        position: 'relative',
        zIndex: 1,
        borderTop: `1px solid ${theme.palette.divider}`,
        background: theme.palette.mode === 'dark' 
          ? 'rgba(26, 26, 46, 0.8)' 
          : 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar sx={{ 
            width: 44, 
            height: 44, 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)'
          }}>
            <AdminPanelSettings />
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight={700} noWrap sx={{ fontSize: '0.9rem' }}>
              Admin User
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: '0.75rem' }}>
              admin@excom.local
            </Typography>
          </Box>
          <IconButton 
            size="small" 
            onClick={handleLogout}
            sx={{ 
              color: 'text.secondary',
              transition: 'all 0.2s ease',
              '&:hover': {
                color: 'error.main',
                transform: 'scale(1.1)'
              }
            }}
          >
            <Logout fontSize="small" />
          </IconButton>
        </Box>
        
        {/* Quick Stats */}
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between' }}>
          <Chip 
            icon={<TrendingUp />} 
            label="Active" 
            size="small" 
            color="success" 
            variant="outlined"
            sx={{ fontSize: '0.7rem', height: 24 }}
          />
          <Chip 
            icon={<Security />} 
            label="Secure" 
            size="small" 
            color="info" 
            variant="outlined"
            sx={{ fontSize: '0.7rem', height: 24 }}
          />
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ 
      display: 'flex', 
      minHeight: '100vh', 
      bgcolor: 'background.default',
      background: theme.palette.mode === 'dark' 
        ? 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)'
        : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: theme.palette.mode === 'dark'
          ? 'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.1) 0%, transparent 50%)'
          : 'radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(147, 51, 234, 0.05) 0%, transparent 50%)',
        pointerEvents: 'none'
      }
    }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: theme.palette.mode === 'dark' 
            ? 'rgba(26, 31, 46, 0.95)' 
            : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: 1,
          borderColor: 'divider',
          color: 'text.primary',
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 8px 32px rgba(0, 0, 0, 0.5)' 
            : '0 8px 32px rgba(0, 0, 0, 0.1)'
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
          
          <Box sx={{ flexGrow: 1 }} />
          
          <Button
            color="inherit"
            startIcon={<Logout />}
            onClick={handleLogout}
            sx={{ display: { xs: 'none', sm: 'flex' } }}
          >
            Logout
          </Button>
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
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              bgcolor: 'transparent',
              backdropFilter: 'blur(20px)',
              border: 'none'
            },
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
              bgcolor: 'transparent',
              backdropFilter: 'blur(20px)',
              boxShadow: theme.palette.mode === 'dark' 
                ? '0 8px 32px rgba(0, 0, 0, 0.5)' 
                : '0 8px 32px rgba(0, 0, 0, 0.1)'
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
          position: 'relative',
          zIndex: 1
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}