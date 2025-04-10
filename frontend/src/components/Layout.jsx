import { useState, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  AppBar, 
  Box, 
  CssBaseline, 
  Divider, 
  Drawer, 
  IconButton, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Toolbar, 
  Typography, 
  Button,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  VpnKey as KeyIcon,
  ExitToApp as LogoutIcon,
  Person as PersonIcon,
  SportsEsports as GamesIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  BarChart as StatsIcon,
  Gamepad as ModIcon,
  Security as SecurityIcon,
  Visibility as VisionIcon,
  GpsFixed as AimIcon,
  FlashOn as FlashOnIcon,
  Adjust as AdjustIcon,
  AccessTimeOutlined
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import GXClanLogo from '../assets/GX_Clan.jpg';
import styles from './Layout.module.css';

// Logo path (using local assets)
const CLAN_LOGO = GXClanLogo;

const DRAWER_WIDTH = 240;

// Navigation items for different user roles
const getNavItems = (userRole) => {
  let items = [];
  
  // Add Dashboard for all roles
  items.push({ text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' });
  
  // Add Key Management for non-owner roles only
  if (userRole !== 'owner') {
    items.push({ 
      text: 'Key Management', 
      icon: <KeyIcon />, 
      path: '/keys',
      mobileText: 'Keys', // Shorter text for mobile
    });
  }
  
  // Add owner-specific navigation items
  if (userRole === 'owner') {
    // Add mods section header (non-clickable divider)
    items.push({ 
      text: 'MODS MANAGEMENT', 
      divider: true 
    });
    
    // Add specific mods
    items.push({ text: 'WinStar', icon: <ModIcon />, path: '/mods/winstar' });
    items.push({ text: 'iOSZero', icon: <SecurityIcon />, path: '/mods/ioszero' });
    items.push({ text: 'Godeye', icon: <AdjustIcon />, path: '/mods/godeye' });
    items.push({ text: 'Vision', icon: <VisionIcon />, path: '/mods/vision' });
    items.push({ text: 'Lethal', icon: <FlashOnIcon />, path: '/mods/lethal' });
    items.push({ text: 'Deadeye', icon: <AimIcon />, path: '/mods/deadeye' });
  }
  
  return items;
};

const Layout = ({ children, title }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  
  const { currentUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const navItems = getNavItems(currentUser?.role);
  
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };
  
  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleLogout = () => {
    handleClose();
    logout();
  };
  
  const drawer = (
    <Box className={styles.drawer}>
      <Box className={styles.drawerHeader}>
        <Box className={styles.logoContainer}>
          <img 
            src={CLAN_LOGO} 
            alt="GX Clan Logo" 
            className={styles.logo}
          />
          <Box className={styles.statusDot} />
        </Box>
        <Typography 
          variant="h6" 
          component="div" 
          className={styles.title}
        >
          GX Clan Panel
        </Typography>
      </Box>
      
      <Divider className={styles.divider} />
      
      {/* Add reseller balance display */}
      {currentUser && currentUser.role === 'admin' && <ResellerBalance currentUser={currentUser} />}
      
      <List className={styles.navList}>
        {navItems.map((item, index) => (
          item.divider ? (
            <Typography key={`divider-${index}`} className={styles.sectionLabel}>
              {item.text}
            </Typography>
          ) : (
            <ListItem key={item.text} disablePadding className={styles.navListItem}>
              <ListItemButton
                className={`${styles.navListButton} ${location.pathname.includes(item.path) ? styles.navItemActive : ''}`}
                onClick={() => {
                  if (isMobile) handleDrawerToggle();
                }}
                component={Link}
                to={item.path}
              >
                <ListItemIcon className={styles.navListIcon}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={isMobile && item.mobileText ? item.mobileText : item.text} 
                  className={styles.navListText}
                  sx={{
                    '& .MuiTypography-root': {
                      fontSize: isMobile ? '0.85rem' : 'inherit'
                    }
                  }}
                />
              </ListItemButton>
            </ListItem>
          )
        ))}
      </List>
      
      {/* User profile section with logout */}
      {currentUser && (
        <Box className={styles.userProfileSection}>
          <Avatar 
            className={styles.userAvatar}
            alt={currentUser?.username?.toUpperCase() || 'U'}
          >
            {currentUser?.username?.[0]?.toUpperCase() || 'U'}
          </Avatar>
          <Box className={styles.userInfo}>
            <Typography className={styles.username}>
              {currentUser?.username || 'User'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography className={styles.userRole}>
                {currentUser?.role === 'owner' ? 'Owner' : 'Admin'}
              </Typography>
              {currentUser?.role === 'admin' && (
                <Tooltip title="Auto logout after 20 minutes of inactivity" arrow placement="top">
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      bgcolor: 'rgba(255,152,0,0.2)', 
                      borderRadius: '4px',
                      px: 0.5,
                      py: 0.2,
                      fontSize: '9px',
                      color: 'orange',
                      ml: 0.5
                    }}
                  >
                    <AccessTimeOutlined fontSize="inherit" sx={{ mr: 0.3, fontSize: '10px' }} />
                    AUTO
                  </Box>
                </Tooltip>
              )}
            </Box>
          </Box>
          <IconButton 
            className={styles.logoutButton}
            onClick={handleLogout}
            size="small"
            aria-label="logout"
            title="Logout"
          >
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        className={styles.appBar}
        sx={{
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { sm: `${DRAWER_WIDTH}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            className={styles.menuButton}
            sx={{ display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" className={styles.appBarTitle}>
            {title}
          </Typography>
          
          {/* Spacer to push the avatar to the right */}
          <Box sx={{ flexGrow: 1 }} />
          
          {/* User Account Menu */}
          <Tooltip title="Account Settings">
            <IconButton 
              onClick={handleMenu} 
              className={styles.headerAvatarButton}
              aria-controls="menu-appbar"
              aria-haspopup="true"
            >
              <Avatar 
                className={styles.userAvatar}
                alt={currentUser?.username?.toUpperCase() || 'U'}
              >
                {currentUser?.username?.[0]?.toUpperCase() || 'U'}
              </Avatar>
            </IconButton>
          </Tooltip>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            PaperProps={{
              elevation: 6,
              sx: {
                backgroundColor: '#1e1e2f',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                overflow: 'visible',
                filter: 'drop-shadow(0px 5px 15px rgba(0, 0, 0, 0.3))',
                mt: 1.5,
              }
            }}
          >
            <MenuItem className={styles.userMenuItem} onClick={handleClose}>
              <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
              {currentUser?.username || 'Profile'}
            </MenuItem>
            <Divider sx={{ my: 0.5, backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
            <MenuItem className={styles.userMenuItem} onClick={handleLogout}>
              <LogoutIcon className={styles.logoutIcon} />
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      
      {/* Mobile drawer */}
      <Box
        component="nav"
        sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
            BackdropProps: {
              className: styles.drawerBackdrop
            }
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
          PaperProps={{
            className: styles.mobileDrawerPaper
          }}
        >
          {drawer}
        </Drawer>
        
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              border: 'none',
              background: 'transparent'
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
          width: { xs: '100%', sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { sm: `${DRAWER_WIDTH}px` },
          overflow: 'hidden',
        }}
      >
        <Toolbar /> {/* Add space below the AppBar */}
        {children}
      </Box>
    </Box>
  );
};

// Add a balance display component for resellers
const ResellerBalance = ({ currentUser }) => {
  if (!currentUser || currentUser.role !== 'admin') return null;
  
  return (
    <Box 
      sx={{ 
        mt: 0.5, 
        mb: 2,
        mx: 2,
        p: 1.5,
        borderRadius: 1,
        bgcolor: 'rgba(0, 195, 255, 0.05)',
        border: '1px solid rgba(0, 195, 255, 0.2)',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Typography 
        variant="subtitle2" 
        color="text.secondary" 
        sx={{ fontSize: '0.75rem', mb: 0.5 }}
      >
        Your Balance:
      </Typography>
      <Typography 
        variant="h6" 
        sx={{ 
          fontWeight: 'bold',
          color: currentUser.unlimitedBalance ? 'success.main' : 'primary.main',
          fontSize: '1.25rem'
        }}
      >
        {currentUser.unlimitedBalance ? 'Unlimited' : currentUser.balance}
      </Typography>
    </Box>
  );
};

export default Layout; 