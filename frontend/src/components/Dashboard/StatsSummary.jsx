import React from 'react';
import { Grid, Paper, Typography, Box, useMediaQuery, useTheme } from '@mui/material';
import { PeopleAlt, VpnKey, Person, CheckCircle } from '@mui/icons-material';

const StatItem = ({ title, value, icon, color }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <Grid item xs={6} sm={6} md={3}>
      <Paper 
        elevation={2}
        sx={{
          p: { xs: 1.5, sm: 2 },
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          borderLeft: `5px solid ${color}`,
          borderRadius: '4px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          transition: 'transform 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)'
          }
        }}
      >
        <Box display="flex" alignItems="center" mb={0.5}>
          {React.cloneElement(icon, { fontSize: isMobile ? 'small' : 'medium' })}
          <Typography 
            variant={isMobile ? "subtitle1" : "h6"} 
            component="div" 
            sx={{ 
              ml: 1, 
              fontWeight: 'medium',
              fontSize: { xs: '0.85rem', sm: '1rem' }
            }}
          >
            {title}
          </Typography>
        </Box>
        <Typography 
          variant={isMobile ? "h5" : "h4"} 
          component="div" 
          sx={{ 
            fontWeight: 'bold',
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.25rem' }
          }}
        >
          {value}
        </Typography>
      </Paper>
    </Grid>
  );
};

const StatsSummary = ({ stats }) => {
  return (
    <Grid 
      container 
      spacing={{ xs: 2, sm: 3 }} 
      sx={{ 
        mb: 3,
        px: { xs: 0.5, sm: 0 } // Add slight padding on mobile
      }}
    >
      <StatItem 
        title="Total Keys" 
        value={stats.totalKeys || 0} 
        icon={<VpnKey sx={{ color: '#1976d2' }} />} 
        color="#1976d2"
      />
      <StatItem 
        title="Active Keys" 
        value={stats.activeKeys || 0} 
        icon={<CheckCircle sx={{ color: '#4caf50' }} />} 
        color="#4caf50"
      />
      <StatItem 
        title="Total Resellers" 
        value={stats.totalResellers || 0} 
        icon={<PeopleAlt sx={{ color: '#ff9800' }} />} 
        color="#ff9800"
      />
      <StatItem 
        title="Active Resellers" 
        value={stats.activeResellers || 0} 
        icon={<Person sx={{ color: '#9c27b0' }} />} 
        color="#9c27b0"
      />
    </Grid>
  );
};

export default StatsSummary; 