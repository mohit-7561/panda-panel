import React, { useState, useEffect, useCallback } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { 
  Grid, 
  Paper, 
  Typography, 
  Box, 
  Button,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  Divider,
  Alert,
  useMediaQuery,
  useTheme,
  Container,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  VpnKey as KeyIcon,
  Dashboard as DashboardIcon,
  Storage as StorageIcon,
  ArrowForward as ArrowForwardIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  AccessTime as AccessTimeIcon,
  AllInclusive as AllInclusiveIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { getKeys, getUserKeys } from '../api/keys';
import { getModStats } from '../api/mod';
import Layout from '../components/Layout';
import BalanceCard from '../components/Dashboard/BalanceCard';
import ModStats from '../components/Dashboard/ModStats';
import StatsSummary from '../components/Dashboard/StatsSummary';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import ResellerManagement from '../components/Owner/ResellerManagement';
import { useSocket } from '../context/SocketContext';
import { toast } from 'react-toastify';
import logger from '../utils/logger';

const formatTimeRemaining = (expiryDateStr) => {
  if (!expiryDateStr || expiryDateStr === 'No expiry') return 'No expiry';
  
  const expiryDate = new Date(expiryDateStr);
  const now = new Date();
  
  if (expiryDate <= now) return 'Expired';
  
  const diffMs = expiryDate - now;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const diffSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);
  
  // Format with leading zeros for hours, minutes and seconds
  const hours = diffHours.toString().padStart(2, '0');
  const minutes = diffMinutes.toString().padStart(2, '0');
  const seconds = diffSeconds.toString().padStart(2, '0');
  
  if (diffDays > 0) {
    return `${diffDays}d ${hours}h ${minutes}m ${seconds}s`;
  } else {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
};

// Live countdown component
const LiveCountdown = ({ expiryDateStr }) => {
  const [countdown, setCountdown] = useState(formatTimeRemaining(expiryDateStr));
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  
  useEffect(() => {
    // Update once immediately
    setCountdown(formatTimeRemaining(expiryDateStr));
    
    // Update every second for live countdown
    const timer = setInterval(() => {
      setCountdown(formatTimeRemaining(expiryDateStr));
    }, 1000);
    
    // Clean up interval on unmount
    return () => clearInterval(timer);
  }, [expiryDateStr]);
  
  if (countdown === 'No expiry') {
    return <span style={{ 
      color: '#4caf50', 
      fontWeight: 'bold', 
      fontSize: isXs ? '1.2rem' : '1.4rem' 
    }}>No expiry</span>;
  }
  
  if (countdown === 'Expired') {
    return <span style={{ 
      color: '#f44336', 
      fontWeight: 'bold', 
      fontSize: isXs ? '1.2rem' : '1.4rem' 
    }}>Expired</span>;
  }
  
  // For timer display, split the parts and style them
  const parts = countdown.split(' ');
  
  return (
    <Box sx={{ 
      display: 'inline-flex', 
      alignItems: 'center', 
      gap: { xs: 0.75, sm: 1.5 }, 
      fontWeight: 'medium',
      flexWrap: 'wrap',
      justifyContent: 'center'
    }}>
      {parts.map((part, index) => {
        const isValue = part.includes('d') || part.includes('h') || part.includes('m') || part.includes('s');
        
        return (
          <Box 
            key={index} 
            sx={{ 
              ...(isValue ? {
                backgroundColor: 'rgba(0, 195, 255, 0.15)',
                borderRadius: '8px',
                px: { xs: 0.8, sm: 1.6 },
                py: { xs: 0.6, sm: 0.9 },
                fontWeight: 'bold',
                color: '#00c3ff',
                display: 'inline-block',
                minWidth: part.includes('d') ? 'auto' : { xs: '2.4em', sm: '3em' },
                textAlign: 'center',
                fontSize: { xs: '1.2rem', sm: '1.7rem' },
                boxShadow: '0 3px 10px rgba(0, 195, 255, 0.25)',
                border: '1px solid rgba(0, 195, 255, 0.3)',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
                  pointerEvents: 'none'
                }
              } : {
                fontSize: { xs: '0.9rem', sm: '1.3rem' },
                color: 'text.secondary',
                opacity: 0.85,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: { xs: '0.8em', sm: '1.2em' },
                fontWeight: '500'
              })
            }}
          >
            {part}
          </Box>
        );
      })}
    </Box>
  );
};

// Export LiveCountdown for use in other components
export { LiveCountdown };

const StatCard = ({ title, value, icon, color }) => {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <Card 
      sx={{ 
        height: '100%', 
        width: '100%',
        display: 'flex', 
        flexDirection: 'column',
        p: 0,
        overflow: 'hidden',
        borderRadius: '10px',
        boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 10px 20px rgba(0, 0, 0, 0.2)'
        }
      }} 
      className="dashboard-stat-card"
    >
      <CardContent sx={{ 
        flexGrow: 1, 
        p: { xs: 1.5, sm: 2.5, md: 3 }, 
        pb: { xs: 1.5, sm: 2.5, md: 3 },
        display: 'flex',
        alignItems: 'center'
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: 2,
          width: '100%',
          flexDirection: { xs: 'row', sm: 'row' },
          textAlign: { xs: 'left', sm: 'left' }
        }}>
          <Box 
            sx={{ 
              backgroundColor: `${color}.dark`, 
              p: { xs: 1.5, sm: 2 }, 
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              mb: { xs: 0, sm: 0 }
            }}
            className="dashboard-stat-icon"
          >
            {icon}
          </Box>
          
          <Box sx={{ 
            display: 'flex',
            flexDirection: 'column',
            width: { xs: '100%', sm: 'auto' }
          }}>
            <Typography 
              variant="h6" 
              color="text.secondary" 
              sx={{ 
                fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.9rem' },
                fontWeight: 'medium',
                opacity: 0.8,
                mb: 0.5,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              {title}
            </Typography>
            <Typography 
              variant="h3" 
              component="div"
              className="dashboard-stat-value"
              sx={{ 
                fontSize: { xs: '1.5rem', sm: '1.8rem', md: '2.2rem' },
                fontWeight: 'bold',
                lineHeight: 1.2
              }}
            >
              {value}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const KeyRow = ({ keyData, isXs, index, total }) => (
  <Box 
    sx={{ 
      px: { xs: 1.5, sm: 3 },
      py: { xs: 2, sm: 3 },
      '&:hover': { backgroundColor: 'rgba(0, 195, 255, 0.05)' },
      transition: 'background-color 0.2s',
      borderRadius: index === 0 ? '8px 8px 0 0' : index === total - 1 ? '0 0 8px 8px' : '0'
    }}
  >
    <Grid container spacing={{ xs: 1.5, sm: 3 }} alignItems="stretch">
      {/* Key name and description - Mobile view shows differently */}
      <Grid item xs={12} md={5} sx={{ 
        mb: { xs: 1, md: 0 }
      }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          height: '100%',
          pb: { xs: 1.5, md: 0 },
          borderBottom: { xs: '1px solid rgba(255, 255, 255, 0.05)', md: 'none' }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box component="span" sx={{ 
              width: '10px', 
              height: '10px', 
              borderRadius: '50%', 
              backgroundColor: 'primary.main',
              display: { xs: 'inline-block', md: 'none' },
            }} />
            <Typography 
              variant="subtitle1" 
              fontWeight="bold"
              sx={{ fontSize: { xs: '0.95rem', sm: '1.15rem' } }}
            >
              {keyData.name}
            </Typography>
          </Box>
          
          {isXs && (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mt: 1, 
              backgroundColor: 'rgba(0, 0, 0, 0.15)',
              py: 0.75, 
              px: 1.5, 
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <Typography 
                variant="caption" 
                sx={{ 
                  fontFamily: 'monospace',
                  fontSize: '0.7rem',
                  color: 'rgba(255, 255, 255, 0.7)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '100%'
                }}
              >
                {keyData.key?.substring(0, 16)}...
              </Typography>
            </Box>
          )}
          
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              fontSize: { xs: '0.8rem', sm: '0.9rem' },
              mt: 0.5,
              display: { xs: 'none', md: '-webkit-box' },
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {keyData.description || 'No description'}
          </Typography>
        </Box>
      </Grid>
      
      {/* Key status and date information */}
      <Grid item xs={12} md={4} sx={{
        display: 'flex',
        alignItems: 'center'
      }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'row', md: 'column' },
          justifyContent: { xs: 'space-between', md: 'flex-start' },
          alignItems: { xs: 'flex-start', md: 'flex-start' },
          width: '100%',
          gap: { xs: 0, md: 1 },
          pb: { xs: 1.5, md: 0 },
          borderBottom: { xs: '1px solid rgba(255, 255, 255, 0.05)', md: 'none' }
        }}>
          <Box sx={{ width: { xs: '48%', md: '100%' } }}>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ 
                fontSize: { xs: '0.7rem', sm: '0.85rem' },
                display: 'flex',
                alignItems: 'center',
                mb: 0.5
              }}
            >
              <Box component="span" sx={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                backgroundColor: 'primary.main',
                display: 'inline-block',
                mr: 1 
              }} />
              Created: {new Date(keyData.createdAt).toLocaleDateString()}
            </Typography>
          </Box>
          
          <Box sx={{ 
            width: { xs: '48%', md: '100%' },
            mt: { xs: 0, md: 1 }
          }}>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ 
                fontSize: { xs: '0.7rem', sm: '0.85rem' },
                display: 'flex',
                alignItems: 'center',
                mb: 0.5
              }}
            >
              <Box component="span" sx={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                backgroundColor: isKeyExpired(keyData) ? '#f44336' : '#00c3ff',
                display: 'inline-block',
                mr: 1 
              }} />
              Expires:
            </Typography>
            <Box sx={{ 
              py: { xs: 0.75, sm: 1 }, 
              px: { xs: 1, sm: 1.2 }, 
              borderRadius: '6px', 
              backgroundColor: 'rgba(0, 0, 0, 0.15)',
              display: 'flex',
              justifyContent: 'center',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 'medium',
                  fontSize: { xs: '0.75rem', sm: '0.9rem' },
                  color: isKeyExpired(keyData) ? '#f44336' : '#00c3ff'
                }}
              >
                {new Date(keyData.expiresAt).toLocaleDateString()} 
              </Typography>
            </Box>
          </Box>
        </Box>
      </Grid>
      
      {/* Action button */}
      <Grid 
        item 
        xs={12} 
        md={3} 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center',
          alignItems: { xs: 'center', md: 'center' },
          mt: { xs: 0, md: 0 }
        }}
      >
        <Button 
          variant="outlined" 
          fullWidth={isXs}
          size="medium"
          component={RouterLink}
          to={`/keys/${keyData._id}`}
          endIcon={<ArrowForwardIcon />}
          sx={{ 
            borderRadius: '8px',
            textTransform: 'none',
            fontSize: { xs: '0.75rem', sm: '0.85rem' },
            py: { xs: 1.2, sm: 1.2 },
            px: { xs: 1.5, sm: 2.5 },
            maxWidth: { xs: '100%', md: '80%' },
            borderColor: 'rgba(0, 195, 255, 0.3)',
            color: 'primary.light',
            '&:hover': {
              borderColor: 'rgba(0, 195, 255, 0.6)',
              backgroundColor: 'rgba(0, 195, 255, 0.05)'
            }
          }}
        >
          View Details
        </Button>
      </Grid>
    </Grid>
  </Box>
);

// Helper function to check if a key is expired
const isKeyExpired = (key) => {
  return new Date(key.expiresAt) <= new Date();
};

const Dashboard = () => {
  const [showConfirmDisable, setShowConfirmDisable] = useState(false);
  const location = useLocation();
  const { currentUser, setCurrentUser, refreshUserData } = useAuth();
  const socket = useSocket();
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modsData, setModsData] = useState([]);
  const [modStats, setModStats] = useState({});
  
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const isMd = useMediaQuery(theme.breakpoints.down('md'));
  
  // Listen for balance updates from socket
  useEffect(() => {
    if (!socket || !currentUser || currentUser.role !== 'admin') return;
    
    // Handler for balance update events
    const handleBalanceUpdate = (data) => {
      logger.info('Received balance update:', data);
      
      // Set status information
      const status = data.status || 'active';
      
      try {
        // Update local status display without full refresh
        if (data && typeof data === 'object') {
          // Directly update the currentUser state with the new balance data
          setCurrentUser(prev => ({
            ...prev,
            balance: data.balance,
            unlimitedBalance: data.unlimitedBalance,
            balanceExpiresAt: data.balanceExpiresAt,
            status: data.status
          }));
          
          // This will also trigger a full refresh of user data through API
          refreshUserData(true);
          
          // Show notification to user
          toast.success('Your balance has been updated!', {
            position: "top-right",
            autoClose: 3000
          });
        }
      } catch (error) {
        logger.error('Error handling balance update:', error);
      }
    };
    
    // Handler for status update events
    const handleStatusUpdate = (data) => {
      logger.info("Status update received:", data);
      
      // If the update is for the current user
      if (data.user_id === currentUser._id) {
        // Update the current user data with new status
        setCurrentUser({
          ...currentUser,
          active: data.active,
          status: data.status
        });
        
        // Show appropriate notification based on status
        if (data.active) {
          toast.success("Your account has been activated! You can now use all features.");
        } else {
          toast.error("Your account has been deactivated by the owner. Some features will be limited.");
        }
      }
    };
    
    // Subscribe to events
    socket.on('balance_updated', handleBalanceUpdate);
    socket.on('status_updated', handleStatusUpdate);
    logger.info('Subscribed to socket events');
    
    // Cleanup
    return () => {
      socket.off('balance_updated', handleBalanceUpdate);
      socket.off('status_updated', handleStatusUpdate);
      logger.info('Unsubscribed from socket events');
    };
  }, [socket, currentUser, refreshUserData, setCurrentUser]);
  
  // Fetch fresh user data when the dashboard loads or when user navigates back to it
  useEffect(() => {
    const fetchUserData = async () => {// Check if we need to force load mod balances for a new reseller
      const isNewReseller = currentUser?.role === 'admin' && 
                           (!currentUser.modBalances || currentUser.modBalances.length === 0);
                           
      if (isNewReseller) {// Force refresh for new resellers to ensure we get mod balances
        await refreshUserData(true);
      } else {
        await refreshUserData();
      }
    };
    
    fetchUserData();
  }, [refreshUserData, location.pathname, currentUser?.role]);
  
  // Fetch data based on user role
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        if (currentUser.role === 'admin') {
          // For admin/reseller users, only fetch their own keys
          const response = await getUserKeys();
          if (response.success) {
            setKeys(response.keys);
          }
          
          // For newly registered resellers, explicitly check for modBalances if we don't have any
          if (!currentUser.modBalances || currentUser.modBalances.length === 0) {// Force refresh to ensure we get mod balances for new users
            await refreshUserData(true);
          }
        } else {
          // For owners, fetch mod statistics
          // Fetch stats for each mod
          const mods = ['winstar', 'ioszero', 'godeye', 'vision', 'lethal', 'deadeye'];
          const modDataPromises = mods.map(async (modId) => {
            try {
              const stats = await getModStats(modId);
              
              // Also get resellers to calculate total balance
              let modResellers = [];
              try {
                const resellersResponse = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/mods/${modId}/resellers`, {
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                  }
                });
                
                if (resellersResponse.data.success) {
                  modResellers = resellersResponse.data.data || [];
                }
              } catch (error) {
                                modResellers = [];
              }
              
              // Calculate total balance and count unlimited resellers
              const totalBalance = modResellers.reduce((sum, reseller) => {
                return sum + (reseller.balance || 0);
              }, 0);
              
              const unlimitedResellers = modResellers.filter(r => r.unlimited).length;
              
              return {
                name: modId.charAt(0).toUpperCase() + modId.slice(1),
                totalKeys: stats.totalKeys || 0,
                activeKeys: stats.activeKeys || 0,
                totalResellers: stats.totalResellers || 0,
                activeResellers: stats.activeResellers || 0,
                totalBalance: totalBalance,
                unlimitedResellers: unlimitedResellers
              };
            } catch (err) {
                            return null;
            }
          });
          
          const modResults = await Promise.all(modDataPromises);
          const validModData = modResults.filter(mod => mod !== null);
          
          // Format mod names for display
          const formattedModData = validModData.map(mod => {
            if (mod.name === 'Winstar') return { ...mod, name: 'WinStar' };
            if (mod.name === 'Ioszero') return { ...mod, name: 'iOS Zero' };
            if (mod.name === 'Godeye') return { ...mod, name: 'Godeye' };
            return mod;
          });
          
          setModsData(formattedModData);
          
          // Calculate total stats across all mods
          const totalStats = formattedModData.reduce((acc, mod) => {
            return {
              totalKeys: acc.totalKeys + mod.totalKeys,
              activeKeys: acc.activeKeys + mod.activeKeys,
              totalResellers: acc.totalResellers + mod.totalResellers,
              activeResellers: acc.activeResellers + mod.activeResellers,
              totalBalance: acc.totalBalance + mod.totalBalance,
              unlimitedResellers: acc.unlimitedResellers + mod.unlimitedResellers
            };
          }, { 
            totalKeys: 0, 
            activeKeys: 0, 
            totalResellers: 0, 
            activeResellers: 0, 
            totalBalance: 0,
            unlimitedResellers: 0
          });
          
          setModStats(totalStats);
        }
      } catch (error) {
                setError('Failed to load data: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (currentUser && currentUser.role) {
      fetchData();
    }
  }, [currentUser?.role]);
  
  // Calculate statistics for reseller panel
  const totalKeys = keys.length;
  const activeKeys = keys.filter(key => key.isActive && new Date(key.expiresAt) > new Date()).length;
  const expiredKeys = keys.filter(key => !key.isActive || new Date(key.expiresAt) <= new Date()).length;
  
  // Get recent keys (up to 5) for reseller panel
  const recentKeys = [...keys]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);
  
  return (
    <Layout title="Dashboard">
      <Container maxWidth="xl" disableGutters sx={{ px: { xs: 0.75, sm: 2, md: 3 } }}>
        <Box 
          mb={{ xs: 2.5, sm: 4 }} 
          pb={2} 
          className="fade-in"
          sx={{
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: { xs: 'center', sm: 'flex-start' },
            textAlign: { xs: 'center', sm: 'left' }
          }}
        >
          <Typography 
            variant="h4" 
            gutterBottom
            sx={{
              fontSize: { xs: '1.35rem', sm: '1.75rem', md: '2rem' },
              fontWeight: 'bold',
              color: 'primary.main',
              textShadow: '0 0 10px rgba(0, 195, 255, 0.3)',
              mb: 1,
              mt: { xs: 2, sm: 3 }
            }}
          >
            Welcome, {currentUser?.username}!
          </Typography>
        </Box>
        
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              backgroundColor: 'rgba(255, 82, 82, 0.1)',
              color: '#ff5252',
              border: '1px solid rgba(255, 82, 82, 0.3)',
              '& .MuiAlert-icon': {
                color: '#ff5252'
              },
              borderRadius: '10px'
            }}
          >
            {error}
          </Alert>
        )}
        
        {loading ? (
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              flexDirection: 'column',
              my: { xs: 6, sm: 10 },
              gap: 1.5
            }} 
            className="pulse"
          >
            <CircularProgress sx={{ color: 'primary.main' }} size={isXs ? 35 : 50} />
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>
              Loading your dashboard...
            </Typography>
          </Box>
        ) : (
          <>
            {/* Different content based on user role */}
            {currentUser?.role === 'owner' ? (
              // Owner Panel Dashboard
              <>
                {/* Overall Statistics */}
                <Box 
                  mb={{ xs: 3, sm: 4 }}
                  mt={{ xs: 1, sm: 2 }}
                >
                  <Typography 
                    variant="h5"
                    sx={{ 
                      fontSize: { xs: '1.15rem', sm: '1.5rem' },
                      fontWeight: 'bold',
                      mb: { xs: 1.5, sm: 2 },
                      position: 'relative',
                      pl: { xs: 0, sm: 2 },
                      textAlign: { xs: 'center', sm: 'left' },
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        left: { xs: 'calc(50% - 25px)', sm: 0 },
                        top: { xs: 'calc(100% + 5px)', sm: '50%' },
                        transform: { xs: 'translateY(0)', sm: 'translateY(-50%)' },
                        width: { xs: '50px', sm: '4px' },
                        height: { xs: '4px', sm: '24px' },
                        backgroundColor: 'primary.main',
                        borderRadius: '4px'
                      }
                    }}
                  >
                    Overall Statistics
                  </Typography>
                  <StatsSummary stats={modStats} />
                </Box>
                
                {/* Mod Statistics */}
                <Box mb={{ xs: 3, sm: 4 }}>
                  <Typography 
                    variant="h5"
                    sx={{ 
                      fontSize: { xs: '1.15rem', sm: '1.5rem' },
                      fontWeight: 'bold',
                      mb: { xs: 1.5, sm: 2 },
                      position: 'relative',
                      pl: { xs: 0, sm: 2 },
                      textAlign: { xs: 'center', sm: 'left' },
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        left: { xs: 'calc(50% - 25px)', sm: 0 },
                        top: { xs: 'calc(100% + 5px)', sm: '50%' },
                        transform: { xs: 'translateY(0)', sm: 'translateY(-50%)' },
                        width: { xs: '50px', sm: '4px' },
                        height: { xs: '4px', sm: '24px' },
                        backgroundColor: 'primary.main',
                        borderRadius: '4px'
                      }
                    }}
                  >
                    Mods Performance
                  </Typography>
                  <ModStats modsData={modsData} />
                </Box>
                
                {/* Reseller Management Section - NEW */}
                <Box mb={{ xs: 3, sm: 4 }}>
                  <Typography 
                    variant="h5"
                    sx={{ 
                      fontSize: { xs: '1.15rem', sm: '1.5rem' },
                      fontWeight: 'bold',
                      mb: { xs: 1.5, sm: 2 },
                      position: 'relative',
                      pl: { xs: 0, sm: 2 },
                      textAlign: { xs: 'center', sm: 'left' },
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        left: { xs: 'calc(50% - 25px)', sm: 0 },
                        top: { xs: 'calc(100% + 5px)', sm: '50%' },
                        transform: { xs: 'translateY(0)', sm: 'translateY(-50%)' },
                        width: { xs: '50px', sm: '4px' },
                        height: { xs: '4px', sm: '24px' },
                        backgroundColor: 'primary.main',
                        borderRadius: '4px'
                      }
                    }}
                  >
                    Resellers
                  </Typography>
                  <ResellerManagement />
                </Box>
              </>
            ) : (
              // Reseller Panel Dashboard - Keeping existing content
              <>
                {/* Reseller Balance Card - New prominent display */}
                {currentUser?.role === 'admin' && (
                  <Box 
                    sx={{ 
                      p: { xs: 2, sm: 3 },
                      width: '100%' 
                    }}
                  >
                    <Card 
                      sx={{ 
                        width: '100%',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, rgba(0, 195, 255, 0.05) 0%, rgba(0, 195, 255, 0.2) 100%)',
                        border: '1px solid rgba(0, 195, 255, 0.3)',
                        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
                        overflow: 'hidden',
                        position: 'relative',
                        mb: 3,
                        py: 2
                      }}
                    >
                      <Box 
                        sx={{ 
                          position: 'absolute', 
                          top: 0, 
                          left: 0, 
                          right: 0, 
                          height: '4px',
                          background: 'linear-gradient(90deg, #00c3ff, #0d47a1)'
                        }} 
                      />
                      <CardContent sx={{ p: { xs: 2, sm: 3 }, textAlign: 'center' }}>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            color: 'text.secondary',
                            fontSize: { xs: '1rem', sm: '1.25rem' },
                            mb: 2,
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                          }}
                        >
                          Reseller Balance
                        </Typography>
                        
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          mb: { xs: 1, sm: 0 },
                          bgcolor: 'rgba(0, 0, 0, 0.2)',
                          py: 3,
                          px: 4,
                          borderRadius: 2,
                          maxWidth: '300px',
                          mx: 'auto',
                          border: '1px solid rgba(0, 195, 255, 0.2)'
                        }}>
                          <AccountBalanceWalletIcon 
                            sx={{ 
                              fontSize: { xs: 40, sm: 48 }, 
                              color: 'primary.main',
                              mr: 2
                            }}
                          />
                          <Typography 
                            variant="h3" 
                            sx={{ 
                              fontWeight: 'bold',
                              color: currentUser?.unlimitedBalance ? 'success.main' : 'primary.main',
                              fontSize: { xs: '2.25rem', sm: '3rem' }
                            }}
                          >
                            {currentUser?.unlimitedBalance ? (
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <AllInclusiveIcon sx={{ mr: 1, fontSize: '2.5rem' }} />
                                Unlimited
                              </Box>
                            ) : (
                              currentUser?.balance
                            )}
                          </Typography>
                        </Box>
                        
                        {/* Status indicator */}
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                          {(() => {
                            // Determine status
                            let status = 'active';
                            let label = 'Active';
                            let color = 'success';
                            
                            if (!currentUser?.active) {
                              status = 'inactive';
                              label = 'Inactive';
                              color = 'error';
                            } else if (currentUser?.balance === 0 && !currentUser?.unlimitedBalance) {
                              status = 'finished';
                              label = 'Finished';
                              color = 'warning';
                            } else if (currentUser?.balanceExpiresAt && new Date(currentUser.balanceExpiresAt) < new Date()) {
                              status = 'expired';
                              label = 'Expired';
                              color = 'error';
                            }
                            
                            return (
                              <Chip
                                label={label}
                                color={color}
                                size="small"
                                sx={{ fontWeight: 'medium' }}
                              />
                            );
                          })()}
                        </Box>
                        
                        {!currentUser?.unlimitedBalance && currentUser?.balance === 0 && (
                          <Box 
                            sx={{ 
                              mt: 2, 
                              p: 2, 
                              borderRadius: 2, 
                              backgroundColor: 'rgba(211, 47, 47, 0.15)',
                              border: '1px solid rgba(211, 47, 47, 0.3)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexDirection: 'column',
                              maxWidth: '400px',
                              mx: 'auto'
                            }}
                          >
                            <Typography 
                              variant="subtitle1" 
                              sx={{ 
                                color: '#ff5252', 
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                mb: 1
                              }}
                            >
                              <WarningIcon sx={{ mr: 1 }} />
                              Balance Empty
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#ff5252', textAlign: 'center' }}>
                              Your balance is currently at 0. Please contact the owner to request additional balance for your account.
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Box>
                )}
                
                {/* Inactive Account Alert */}
                {currentUser?.role === 'admin' && currentUser?.active === false && (
                  <Box 
                    sx={{ 
                      p: { xs: 2, sm: 3 },
                      width: '100%',
                      mb: 3 
                    }}
                  >
                    <Alert 
                      severity="error"
                      variant="filled"
                      sx={{ 
                        borderRadius: 2,
                        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15)'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', flexDirection: 'column', gap: 1 }}>
                        <Typography 
                          variant="subtitle1" 
                          sx={{ 
                            fontWeight: 'bold',
                            fontSize: { xs: '1rem', sm: '1.1rem' }
                          }}
                        >
                          Account Deactivated
                        </Typography>
                        <Typography variant="body2">
                          Your account has been deactivated by the owner. You cannot generate keys or access other features 
                          until your account is reactivated. Please contact the owner for assistance.
                        </Typography>
                      </Box>
                    </Alert>
                  </Box>
                )}
                
                {/* Display balance information for admin/reseller users */}
                <Box 
                  sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    gap: 2,
                    width: '100%',
                    mb: 2
                  }}
                >
                  {/* Check for mod-specific balances first */}
                  {currentUser?.modBalances && currentUser.modBalances.length > 0 ? (
                    <>
                      <Typography 
                        variant="h5" 
                        sx={{ 
                          fontWeight: 'bold', 
                          color: 'primary.main',
                          mt: 2,
                          textAlign: { xs: 'center', sm: 'left' }
                        }}
                      >
                        Your Licensed Mods
                      </Typography>
                      
                      <Grid container spacing={2} sx={{ 
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: { xs: 'stretch', sm: 'flex-start' },
                        '& .MuiGrid-item': { 
                          width: { xs: '100%', sm: 'auto' },
                          display: 'flex'
                        }
                      }}>
                        {currentUser.modBalances.map((modBalance) => {
                          // Convert mod IDs to proper names based on common patterns
                          let modName = modBalance.modId.charAt(0).toUpperCase() + modBalance.modId.slice(1);
                          
                          // Special formatting for known mod IDs
                          if (modBalance.modId === 'winstar') modName = 'WinStar';
                          if (modBalance.modId === 'ioszero') modName = 'iOS Zero';
                          if (modBalance.modId === 'godeye') modName = 'GodEye';
                          
                          // Format expiry date
                          const expiryDate = modBalance.expiresAt || 'No expiry';
                          
                          return (
                            <Grid item xs={12} sm={6} md={4} key={modBalance.modId} sx={{ display: 'flex', flex: '1 0 auto' }}>
                              <Card 
                                sx={{ 
                                  p: { xs: 1.5, sm: 2 },
                                  width: '100%',
                                  borderRadius: '10px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  background: 'linear-gradient(135deg, rgba(13, 71, 161, 0.15) 0%, rgba(33, 150, 243, 0.15) 100%)',
                                  border: '1px solid rgba(33, 150, 243, 0.25)',
                                  boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15)',
                                  transition: 'transform 0.2s, box-shadow 0.2s',
                                  position: 'relative',
                                  overflow: 'hidden',
                                  '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: '0 12px 20px rgba(0, 0, 0, 0.2)'
                                  },
                                  '&::before': {
                                    content: '""',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '3px',
                                    background: 'linear-gradient(90deg, #0d47a1, #2196f3)'
                                  }
                                }}
                              >
                                <Box sx={{ 
                                  display: 'flex', 
                                  justifyContent: 'space-between', 
                                  alignItems: 'center', 
                                  mb: 1.5,
                                  p: 0.5
                                }}>
                                  <Typography 
                                    variant="h6" 
                                    fontWeight="bold" 
                                    color="primary.main" 
                                    sx={{ 
                                      fontSize: { xs: '1rem', sm: '1.1rem' },
                                      textShadow: '0 0 8px rgba(33, 150, 243, 0.3)'
                                    }}
                                  >
                                    {modName}
                                  </Typography>
                                  
                                  {modBalance.unlimitedBalance ? (
                                    <Chip 
                                      label="Unlimited" 
                                      color="success" 
                                      size="small"
                                      sx={{ 
                                        fontWeight: 'bold', 
                                        fontSize: '0.7rem',
                                        height: '20px',
                                        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)'
                                      }} 
                                    />
                                  ) : null}
                                </Box>
                                
                                {!modBalance.unlimitedBalance && modBalance.balance === 0 && (
                                  <Box 
                                    sx={{ 
                                      mt: 1, 
                                      mb: 1.5, 
                                      p: 1, 
                                      borderRadius: 1, 
                                      backgroundColor: 'rgba(211, 47, 47, 0.15)',
                                      border: '1px solid rgba(211, 47, 47, 0.3)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      flexDirection: 'column'
                                    }}
                                  >
                                    <Typography 
                                      variant="caption" 
                                      sx={{ 
                                        color: '#ff5252', 
                                        fontWeight: 'bold',
                                        display: 'flex',
                                        alignItems: 'center',
                                        fontSize: '0.7rem'
                                      }}
                                    >
                                      <WarningIcon fontSize="small" sx={{ mr: 0.5, fontSize: '0.9rem' }} />
                                      Contact owner for more balance
                                    </Typography>
                                  </Box>
                                )}
                                
                                <Divider sx={{ mb: 1.5, opacity: 0.6 }} />
                                
                                <Box sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  flexDirection: 'column',
                                  gap: 0.5, 
                                  mb: 1.5,
                                  mt: 1,
                                  width: '100%'
                                }}>
                                  <Typography 
                                    variant="body2" 
                                    color="text.secondary" 
                                    sx={{ 
                                      display: 'flex', 
                                      alignItems: 'center',
                                      gap: 0.5,
                                      mb: 0.5,
                                      fontSize: { xs: '0.75rem', sm: '0.9rem' },
                                      fontWeight: 500
                                    }}
                                  >
                                    <AccessTimeIcon 
                                      fontSize="small" 
                                      sx={{ 
                                        color: 'primary.light', 
                                        opacity: 0.8 
                                      }} 
                                    />
                                    Expires:
                                  </Typography>
                                  <Box sx={{ 
                                    py: { xs: 1.5, sm: 2.5 }, 
                                    px: { xs: 1.5, sm: 2.5 }, 
                                    borderRadius: '12px', 
                                    backgroundColor: 'rgba(0, 0, 0, 0.25)',
                                    width: '100%',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    border: '1px solid rgba(33, 150, 243, 0.15)',
                                    boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.2)'
                                  }}>
                                    <LiveCountdown expiryDateStr={expiryDate} />
                                  </Box>
                                </Box>
                                
                                <Box sx={{ mt: 'auto', pt: 0.5 }}>
                                  {/* Removed mod management buttons for reseller panel */}
                                </Box>
                              </Card>
                            </Grid>
                          );
                        })}
                      </Grid>
                    </>
                  ) : (
                    // For normal resellers or when mod balances are not yet loaded
                    <BalanceCard 
                      balance={currentUser?.balance || 0} 
                      unlimitedBalance={currentUser?.unlimitedBalance || false}
                      expiryDate={currentUser?.balanceExpiresAt || null}
                    />
                  )}
                </Box>

                {/* Stats Cards */}
                <Grid 
                  container 
                  spacing={{ xs: 2, sm: 3 }} 
                  mb={{ xs: 3, sm: 5 }} 
                  className="fade-in"
                  justifyContent="center"
                  sx={{
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: 'stretch',
                    '& .MuiGrid-item': { 
                      display: 'flex',
                      flex: '1 0 auto'
                    }
                  }}
                >
                  <Grid item xs={12} sm={6} md={4} sx={{ display: 'flex' }}>
                    <StatCard 
                      title="Total Keys" 
                      value={totalKeys}
                      icon={<KeyIcon sx={{ color: 'primary.light', fontSize: { xs: 20, sm: 24, md: 28 } }} />}
                      color="primary"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4} sx={{ display: 'flex' }}>
                    <StatCard 
                      title="Active Keys" 
                      value={activeKeys}
                      icon={<DashboardIcon sx={{ color: '#66bb6a', fontSize: { xs: 20, sm: 24, md: 28 } }} />}
                      color="success"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4} sx={{ display: 'flex' }}>
                    <StatCard 
                      title="Expired Keys" 
                      value={expiredKeys}
                      icon={<StorageIcon sx={{ color: '#ff5252', fontSize: { xs: 20, sm: 24, md: 28 } }} />}
                      color="error"
                    />
                  </Grid>
                </Grid>
                
                {/* Recent Keys section */}
                <Box 
                  mb={{ xs: 2, sm: 3 }} 
                  display="flex" 
                  justifyContent="space-between" 
                  alignItems="center" 
                  className="fade-in"
                  sx={{ 
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: { xs: 2, sm: 0 },
                    width: '100%'
                  }}
                >
                  <Typography 
                    variant="h5"
                    sx={{ 
                      fontSize: { xs: '1.2rem', sm: '1.5rem' },
                      fontWeight: 'bold',
                      position: 'relative',
                      pl: { xs: 0, sm: 2 },
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        left: { xs: 'calc(50% - 25px)', sm: 0 },
                        top: { xs: 'calc(100% + 5px)', sm: '50%' },
                        transform: { xs: 'translateY(0)', sm: 'translateY(-50%)' },
                        width: { xs: '50px', sm: '4px' },
                        height: { xs: '4px', sm: '24px' },
                        backgroundColor: 'primary.main',
                        borderRadius: '4px'
                      }
                    }}
                  >
                    Recent Keys
                  </Typography>
                  <Button 
                    variant="contained" 
                    startIcon={<AddIcon />}
                    component={RouterLink}
                    to="/keys"
                    className="generate-key-btn"
                    sx={{ 
                      width: { xs: '100%', sm: 'auto' },
                      py: { xs: 1.2, sm: 1.2 },
                      px: { xs: 2, sm: 3 },
                      borderRadius: '8px',
                      textTransform: 'none',
                      fontSize: { xs: '0.85rem', sm: '0.95rem' },
                      fontWeight: 'bold',
                      boxShadow: '0 4px 10px rgba(0, 195, 255, 0.2)',
                      background: 'linear-gradient(90deg, rgba(0, 195, 255, 1), rgba(0, 118, 255, 1))',
                      border: '1px solid rgba(0, 195, 255, 0.3)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        background: 'linear-gradient(90deg, rgba(0, 195, 255, 0.9), rgba(0, 118, 255, 0.9))',
                        boxShadow: '0 6px 15px rgba(0, 195, 255, 0.3)',
                        transform: 'translateY(-2px)'
                      },
                      '&:active': {
                        transform: 'translateY(1px)',
                        boxShadow: '0 2px 5px rgba(0, 195, 255, 0.2)'
                      }
                    }}
                  >
                    Manage Keys
                  </Button>
                </Box>
                
                {/* Recent Keys Table */}
                <Paper 
                  sx={{ 
                    p: 0, 
                    mb: { xs: 4, sm: 6 },
                    backgroundColor: 'rgba(25, 25, 35, 0.8)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: { xs: '8px', sm: '12px' },
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    overflow: 'hidden',
                    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)'
                  }} 
                  className="key-table-container fade-in"
                  elevation={4}
                >
                  {recentKeys.length > 0 ? (
                    <Box>
                      <Box sx={{ 
                        backgroundColor: 'rgba(0, 120, 215, 0.15)', 
                        py: { xs: 1.8, sm: 2.5 },
                        px: { xs: 2, sm: 3 },
                        borderBottom: '1px solid rgba(0, 120, 215, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}>
                        <KeyIcon 
                          sx={{ 
                            color: 'primary.light', 
                            fontSize: { xs: '1.2rem', sm: '1.4rem' },
                            opacity: 0.9
                          }} 
                        />
                        <Typography 
                          variant="subtitle1" 
                          sx={{ 
                            fontWeight: 'bold', 
                            fontSize: { xs: '0.95rem', sm: '1.1rem' },
                            color: 'primary.light',
                            textAlign: { xs: 'center', sm: 'left' }
                          }}
                        >
                          Your Latest Keys
                        </Typography>
                      </Box>
                      <Box sx={{ 
                        maxHeight: { xs: '320px', sm: '500px' },
                        overflow: 'auto',
                        position: 'relative',
                        '&::-webkit-scrollbar': {
                          width: { xs: '4px', sm: '8px' },
                          height: { xs: '4px', sm: '8px' },
                        },
                        '&::-webkit-scrollbar-track': {
                          background: 'rgba(0, 0, 0, 0.15)',
                          borderRadius: '5px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                          background: 'rgba(0, 195, 255, 0.5)',
                          borderRadius: '5px',
                          border: { xs: 'none', sm: '2px solid rgba(0, 0, 0, 0.15)' },
                        },
                        '&::-webkit-scrollbar-thumb:hover': {
                          background: 'rgba(0, 195, 255, 0.7)',
                        }
                      }}>
                        {recentKeys.map((key, index) => (
                          <React.Fragment key={key._id}>
                            <KeyRow 
                              keyData={key}
                              index={index} 
                              total={recentKeys.length} 
                              isXs={isXs} 
                            />
                            {index < recentKeys.length - 1 && (
                              <Divider 
                                sx={{ 
                                  opacity: 0.15, 
                                  mx: { xs: 2, sm: 3 } 
                                }} 
                              />
                            )}
                          </React.Fragment>
                        ))}
                      </Box>
                    </Box>
                  ) : (
                    <Box 
                      sx={{ 
                        py: { xs: 4, sm: 6 },
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: { xs: 1.5, sm: 2.5 },
                        px: { xs: 2, sm: 3 }
                      }}
                    >
                      <Box 
                        sx={{ 
                          width: { xs: '50px', sm: '80px' },
                          height: { xs: '50px', sm: '80px' },
                          borderRadius: '50%',
                          backgroundColor: 'rgba(0, 195, 255, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: { xs: 0.5, sm: 1 },
                          boxShadow: '0 0 25px rgba(0, 195, 255, 0.2)'
                        }}
                      >
                        <KeyIcon sx={{ fontSize: { xs: 24, sm: 40 }, color: 'primary.main' }} />
                      </Box>
                      <Typography 
                        variant="body1" 
                        color="text.secondary"
                        sx={{ 
                          fontSize: { xs: '0.85rem', sm: '1.15rem' },
                          maxWidth: '350px',
                          margin: '0 auto',
                          lineHeight: 1.5
                        }}
                      >
                        No keys created yet. Start by creating a new license key.
                      </Typography>
                      <Button 
                        variant="contained" 
                        startIcon={<AddIcon />}
                        component={RouterLink}
                        to="/keys"
                        className="generate-key-btn"
                        sx={{ 
                          width: { xs: '100%', sm: '220px' },
                          py: { xs: 1.2, sm: 1.5 },
                          px: { xs: 2, sm: 3 },
                          borderRadius: '8px',
                          textTransform: 'none',
                          fontSize: { xs: '0.85rem', sm: '1rem' },
                          fontWeight: 'bold',
                          mt: { xs: 1, sm: 2 },
                          boxShadow: '0 4px 10px rgba(0, 195, 255, 0.2)',
                          background: 'linear-gradient(90deg, rgba(0, 195, 255, 1), rgba(0, 118, 255, 1))',
                          '&:hover': {
                            background: 'linear-gradient(90deg, rgba(0, 195, 255, 0.9), rgba(0, 118, 255, 0.9))',
                            boxShadow: '0 6px 15px rgba(0, 195, 255, 0.3)',
                            transform: 'translateY(-2px)'
                          }
                        }}
                      >
                        Create New Key
                      </Button>
                    </Box>
                  )}
                </Paper>
              </>
            )}
          </>
        )}
      </Container>
    </Layout>
  );
};

export default Dashboard; 