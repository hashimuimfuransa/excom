import { createTheme } from '@mui/material/styles';

// Modern base theme; actual color mode (light/dark) is applied in ThemeProviderClient
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#22c55e' }, // green-500
    secondary: { main: '#16a34a' }, // green-600
    success: { main: '#15803d' }, // green-700
    warning: { main: '#f59e0b' }, // amber-500
    error: { main: '#ef4444' }, // red-500
    // Ensure proper contrast for both light and dark modes
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.6)',
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    },
  },
  shape: {
    borderRadius: 14
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 16,
          backgroundImage: 'none',
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
        })
      }
    },
    MuiCard: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 18,
          transition: 'transform 200ms ease, box-shadow 200ms ease',
          willChange: 'transform',
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 10px 30px rgba(0, 0, 0, 0.5)' 
              : '0 10px 30px rgba(0, 0, 0, 0.1)',
          }
        })
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          textTransform: 'none',
          fontWeight: 700,
          paddingLeft: 16,
          paddingRight: 16
        },
        containedPrimary: {
          // Soft gradient for primary actions
          backgroundImage: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
          boxShadow: '0 8px 20px rgba(34, 197, 94, 0.25)',
          '&:hover': {
            filter: 'brightness(0.95)'
          }
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999
        }
      }
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 3,
          borderRadius: 3
        }
      }
    }
  },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
    h1: { fontWeight: 900, letterSpacing: -1, fontSize: 'clamp(2.25rem, 1rem + 4vw, 3.5rem)' },
    h2: { fontWeight: 800, letterSpacing: -0.5, fontSize: 'clamp(1.75rem, 0.8rem + 3vw, 2.5rem)' },
    h3: { fontWeight: 800 },
    h4: { fontWeight: 800 },
    h5: { fontWeight: 800 },
    button: { textTransform: 'none', fontWeight: 700 }
  }
});

export default theme;