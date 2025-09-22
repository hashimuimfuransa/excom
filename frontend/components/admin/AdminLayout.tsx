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
  useMediaQuery
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
  Group as AffiliateIcon
} from '@mui/icons-material';
import { usePathname, useRouter } from 'next/navigation';

const drawerWidth = 280;

interface AdminLayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  {
    text: 'Dashboard',
    icon: <Dashboard />,
    path: '/dashboard/admin'
  },
  {
    text: 'Users',
    icon: <People />,
    path: '/dashboard/admin/users'
  },
  {
    text: 'Stores',
    icon: <Store />,
    path: '/dashboard/admin/stores',
    submenu: [
      { text: 'All Stores', path: '/dashboard/admin/stores/all' },
      { text: 'Pending Stores', path: '/dashboard/admin/stores' }
    ]
  },
  {
    text: 'Products',
    icon: <ShoppingBag />,
    path: '/dashboard/admin/products'
  },
  {
    text: 'Orders',
    icon: <Receipt />,
    path: '/dashboard/admin/orders'
  },
  {
    text: 'Earnings',
    icon: <AttachMoney />,
    path: '/dashboard/admin/earnings'
  },
  {
    text: 'Affiliate Management',
    icon: <AffiliateIcon />,
    path: '/dashboard/admin/affiliate'
  },
  {
    text: 'Analytics',
    icon: <Analytics />,
    path: '/dashboard/admin/analytics'
  },
  {
    text: 'Settings',
    icon: <Settings />,
    path: '/dashboard/admin/settings'
  }
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
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
    <Box>
      <Toolbar sx={{ px: 3, py: 2 }}>
        <Typography variant="h6" noWrap component="div" fontWeight={800}>
          ExCom Admin
        </Typography>
      </Toolbar>
      <Divider />
      
      <List sx={{ px: 2 }}>
        {menuItems.map((item) => (
          <React.Fragment key={item.text}>
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={isActive(item.path)}
                onClick={() => router.push(item.path)}
                sx={{
                  borderRadius: 2,
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
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text}
                  primaryTypographyProps={{ fontWeight: 600 }}
                />
              </ListItemButton>
            </ListItem>
            
            {/* Submenu items */}
            {item.submenu && item.submenu.map((subItem) => (
              <ListItem key={subItem.text} disablePadding sx={{ mb: 0.5, ml: 2 }}>
                <ListItemButton
                  selected={pathname === subItem.path}
                  onClick={() => router.push(subItem.path)}
                  sx={{
                    borderRadius: 2,
                    py: 1,
                    '&.Mui-selected': {
                      backgroundColor: 'primary.light',
                      color: 'primary.contrastText',
                    },
                  }}
                >
                  <ListItemText 
                    primary={subItem.text}
                    primaryTypographyProps={{ 
                      variant: 'body2',
                      fontWeight: 500 
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </React.Fragment>
        ))}
      </List>

      <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 2 }}>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 1 }}>
          <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}>
            A
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight={600} noWrap>
              Admin User
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              admin@excom.local
            </Typography>
          </Box>
          <IconButton 
            size="small" 
            onClick={handleLogout}
            sx={{ color: 'text.secondary' }}
          >
            <Logout />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
          color: 'text.primary'
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
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
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
              boxShadow: theme.shadows[1]
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
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}