import React from 'react';
import { Box, Card, CardContent, Typography, Grid, Divider, LinearProgress, useMediaQuery, useTheme } from '@mui/material';
import { 
  Gamepad as ModIcon,
  Security as SecurityIcon,
  Visibility as VisionIcon,
  GpsFixed as AimIcon,
  FlashOn as FlashOnIcon,
  Adjust as AdjustIcon,
  AccountBalanceWallet as WalletIcon,
  People as PeopleIcon,
  VpnKey as KeyIcon
} from '@mui/icons-material';

// Styling
const styles = {
  card: {
    backgroundColor: 'rgba(16, 16, 26, 0.8)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  cardHeader: {
    p: 2,
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    display: 'flex',
    alignItems: 'center',
    gap: 1,
  },
  cardHeaderTitle: {
    color: '#00c3ff',
    fontWeight: 600,
    fontSize: '1.1rem',
  },
  cardContent: {
    backgroundColor: 'rgba(10, 10, 26, 0.4)',
    flexGrow: 1,
    p: { xs: 1, sm: 2 }, // Responsive padding
  },
  statItem: {
    display: 'flex',
    flexDirection: { xs: 'column', sm: 'row' }, // Stack vertically on mobile
    alignItems: { xs: 'flex-start', sm: 'center' },
    justifyContent: 'space-between',
    py: { xs: 2, sm: 1.5 }, // More vertical padding on mobile
    px: { xs: 1.5, sm: 2 },
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    gap: { xs: 1.5, sm: 0 }, // Add gap on mobile
  },
  statLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 1.5,
  },
  statValue: {
    fontWeight: 600,
    color: '#fff',
  },
  progressContainer: {
    mt: { xs: 1.5, sm: 1 },
    mb: 0.5,
    width: '100%', // Full width on all screens
  },
  progressBarWinstar: {
    backgroundColor: 'rgba(33, 150, 243, 0.2)',
    '& .MuiLinearProgress-bar': {
      backgroundColor: '#2196f3',
    },
    height: 8, // Thicker progress bar for better visibility
    borderRadius: 4,
  },
  progressBarIoszero: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    '& .MuiLinearProgress-bar': {
      backgroundColor: '#4caf50',
    },
    height: 8,
    borderRadius: 4,
  },
  progressBarGodeye: {
    backgroundColor: 'rgba(121, 85, 72, 0.2)',
    '& .MuiLinearProgress-bar': {
      backgroundColor: '#795548',
    },
    height: 8,
    borderRadius: 4,
  },
  progressBarVision: {
    backgroundColor: 'rgba(156, 39, 176, 0.2)',
    '& .MuiLinearProgress-bar': {
      backgroundColor: '#9c27b0',
    },
    height: 8,
    borderRadius: 4,
  },
  progressBarLethal: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    '& .MuiLinearProgress-bar': {
      backgroundColor: '#f44336',
    },
    height: 8,
    borderRadius: 4,
  },
  progressBarDeadeye: {
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
    '& .MuiLinearProgress-bar': {
      backgroundColor: '#ff9800',
    },
    height: 8,
    borderRadius: 4,
  },
  statsInfo: {
    mt: { xs: 0, sm: 1 },
    display: 'flex',
    flexDirection: { xs: 'row', sm: 'row' },
    alignItems: 'center',
    gap: { xs: 2, sm: 1.5 },
    justifyContent: { xs: 'flex-start', sm: 'flex-end' },
    flexWrap: 'wrap',
    width: '100%',
  },
  statsBoxWrapper: {
    width: { xs: '100%', sm: 'auto' }, // Full width on mobile
    display: 'flex',
    flexDirection: 'column',
    alignItems: { xs: 'flex-start', sm: 'flex-end' },
  }
};

// Get icon for each mod
const getModIcon = (mod) => {
  switch (mod.toLowerCase()) {
    case 'winstar':
      return <ModIcon sx={{ color: '#2196f3' }} />;
    case 'ioszero':
      return <SecurityIcon sx={{ color: '#4caf50' }} />;
    case 'godeye':
      return <AdjustIcon sx={{ color: '#795548' }} />;
    case 'vision':
      return <VisionIcon sx={{ color: '#9c27b0' }} />;
    case 'lethal':
      return <FlashOnIcon sx={{ color: '#f44336' }} />;
    case 'deadeye':
      return <AimIcon sx={{ color: '#ff9800' }} />;
    default:
      return <ModIcon />;
  }
};

// Get progress bar class for each mod
const getProgressBarClass = (mod) => {
  switch (mod.toLowerCase()) {
    case 'winstar':
      return styles.progressBarWinstar;
    case 'ioszero':
      return styles.progressBarIoszero;
    case 'godeye':
      return styles.progressBarGodeye;
    case 'vision':
      return styles.progressBarVision;
    case 'lethal':
      return styles.progressBarLethal;
    case 'deadeye':
      return styles.progressBarDeadeye;
    default:
      return '';
  }
};

const ModStats = ({ modsData }) => {
  // Use only the data provided through props
  const data = modsData || [];
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Card sx={styles.card}>
      <Box sx={styles.cardHeader}>
        <ModIcon sx={{ color: '#00c3ff' }} />
        <Typography sx={styles.cardHeaderTitle}>Mods Statistics</Typography>
      </Box>
      <CardContent sx={styles.cardContent}>
        {data.length > 0 ? (
          data.map((mod, index) => (
            <Box key={mod.name} sx={styles.statItem}>
              <Box sx={styles.statLabel}>
                {getModIcon(mod.name)}
                <Typography variant={isMobile ? "h6" : "body1"} sx={{ fontWeight: isMobile ? 'bold' : 'normal' }}>
                  {mod.name}
                </Typography>
              </Box>
              <Box sx={styles.statsBoxWrapper}>
                <Box sx={styles.statsInfo}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <KeyIcon fontSize="small" sx={{ color: '#2196f3', opacity: 0.9 }} />
                    <Typography variant="body2" fontWeight="medium">
                      {mod.activeKeys} Keys
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <PeopleIcon fontSize="small" sx={{ color: '#ff9800', opacity: 0.9 }} />
                    <Typography variant="body2" fontWeight="medium">
                      {mod.activeResellers} Resellers
                    </Typography>
                  </Box>
                  {mod.unlimitedResellers > 0 && (
                    <Typography variant="caption" color="text.secondary" sx={{ marginLeft: 1 }}>
                      ({mod.unlimitedResellers} unlimited)
                    </Typography>
                  )}
                </Box>
                <Box sx={styles.progressContainer}>
                  <LinearProgress 
                    variant="determinate" 
                    value={(mod.activeKeys / (mod.totalKeys || 1)) * 100} 
                    sx={getProgressBarClass(mod.name)}
                  />
                </Box>
              </Box>
            </Box>
          ))
        ) : (
          <Box sx={{ p: 2, textAlign: 'center', color: 'rgba(255, 255, 255, 0.7)' }}>
            <Typography>No mod statistics available</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ModStats; 