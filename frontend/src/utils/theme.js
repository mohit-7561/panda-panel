import { createTheme } from '@mui/material/styles';

// GX Clan color palette
// Primary: #00c3ff (cyan blue from GX logo)
// Secondary: #0d64a6 (darker blue from GX logo)
// Background: #0a0a1a (dark blue-black theme)
// Accents: #ffffff (white text from GX logo)

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00c3ff',
      light: '#5cf6ff',
      dark: '#0092cc',
      contrastText: '#000',
    },
    secondary: {
      main: '#0d64a6',
      light: '#4590d9',
      dark: '#003b76',
      contrastText: '#fff',
    },
    background: {
      default: '#0a0a1a',
      paper: '#101026',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b0b0b0',
    },
    error: {
      main: '#ff5252',
    },
    warning: {
      main: '#ffb74d',
    },
    info: {
      main: '#64b5f6',
    },
    success: {
      main: '#66bb6a',
    },
    divider: 'rgba(255, 255, 255, 0.12)',
  },
  typography: {
    fontFamily: [
      'Rajdhani',
      'Roboto',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      letterSpacing: '0.05em',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      letterSpacing: '0.05em',
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      letterSpacing: '0.05em',
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      letterSpacing: '0.05em',
    },
    button: {
      fontWeight: 600,
      letterSpacing: '0.05em',
    },
  },
  shape: {
    borderRadius: 4,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'uppercase',
          borderRadius: 4,
          padding: '10px 24px',
          fontWeight: 600,
          letterSpacing: '0.05em',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 2px 8px rgba(0, 195, 255, 0.4)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #00c3ff 0%, #0d64a6 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #5cf6ff 0%, #4590d9 100%)',
          }
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundImage: 'linear-gradient(rgba(30, 30, 30, 0.9), rgba(30, 30, 30, 0.9))',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.5)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.2)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(244, 180, 26, 0.5)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#f4b41a',
            },
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        },
        head: {
          fontSize: '0.875rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: '#f4b41a',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          fontWeight: 600,
        },
        colorSuccess: {
          backgroundColor: 'rgba(102, 187, 106, 0.2)',
        },
        colorError: {
          backgroundColor: 'rgba(255, 82, 82, 0.2)',
        },
      },
    },
  },
});

export default theme; 