import { useState, useContext } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { 
  Container, 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper, 
  Link, 
  CircularProgress,
  Alert,
  InputAdornment,
  IconButton
} from '@mui/material';
import { 
  VpnKey as KeyIcon,
  Person as PersonIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import GXClanLogo from '../assets/GX_Clan.jpg';
import styles from './Auth.module.css';

// Logo path
const CLAN_LOGO = GXClanLogo;

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const { login, isLoading, error } = useContext(AuthContext);
  
  const validateForm = () => {
    let isValid = true;
    
    // Username validation
    if (!username) {
      setUsernameError('Username is required');
      isValid = false;
    } else if (username.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      isValid = false;
    } else {
      setUsernameError('');
    }
    
    // Password validation
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    } else {
      setPasswordError('');
    }
    
    return isValid;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      await login(username, password);
    }
  };
  
  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  return (
    <Container className={styles['auth-container']} maxWidth={false} disableGutters>
      {/* Matrix code rain animation */}
      <div className={styles['animated-bg']}>
        {/* Matrix columns */}
        <div className={styles['matrix-column']}>01001010110100101110</div>
        <div className={styles['matrix-column']}>10110100111010110010</div>
        <div className={styles['matrix-column']}>01010001101010110101</div>
        <div className={styles['matrix-column']}>11010101001011001010</div>
        <div className={styles['matrix-column']}>10010101100101101001</div>
        <div className={styles['matrix-column']}>01101010010110101001</div>
        <div className={styles['matrix-column']}>10100101011010010110</div>
        <div className={styles['matrix-column']}>01011001010110101001</div>
        <div className={styles['matrix-column']}>10101001011001010101</div>
        <div className={styles['matrix-column']}>01010101001010101010</div>
        
        {/* Particles */}
        <div className={styles['particle']}></div>
        <div className={styles['particle']}></div>
        <div className={styles['particle']}></div>
        <div className={styles['particle']}></div>
        <div className={styles['particle']}></div>
        <div className={styles['particle']}></div>
        <div className={styles['particle']}></div>
        <div className={styles['particle']}></div>
        <div className={styles['particle']}></div>
        <div className={styles['particle']}></div>
        
        {/* Additional particles with different colors/sizes */}
        <div className={styles['particle']}></div>
        <div className={styles['particle']}></div>
        <div className={styles['particle']}></div>
        <div className={styles['particle']}></div>
        <div className={styles['particle']}></div>
        <div className={styles['particle']}></div>
        <div className={styles['particle']}></div>
        <div className={styles['particle']}></div>
        <div className={styles['particle']}></div>
        <div className={styles['particle']}></div>
        
        {/* Extra particles with special animations */}
        <div className={styles['particle']}></div>
        <div className={styles['particle']}></div>
        <div className={styles['particle']}></div>
        <div className={styles['particle']}></div>
        <div className={styles['particle']}></div>
        <div className={styles['particle']}></div>
        <div className={styles['particle']}></div>
        <div className={styles['particle']}></div>
        <div className={styles['particle']}></div>
        <div className={styles['particle']}></div>
        
        {/* Falling stars */}
        <div className={styles['particle']}></div>
        <div className={styles['particle']}></div>
        <div className={styles['particle']}></div>
        <div className={styles['particle']}></div>
        <div className={styles['particle']}></div>
      </div>
      
      <Paper 
        className={styles['auth-paper']} 
        sx={{ 
          animation: `${styles.fadeIn} 0.5s ease-out, ${styles.glow} 3s infinite`,
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '150%',
            height: '150%',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0, 195, 255, 0.2) 0%, rgba(0, 195, 255, 0.1) 30%, transparent 70%)',
            transform: 'translate(-50%, -50%)',
            zIndex: -1,
            animation: 'pulse 4s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite',
            '@keyframes pulse': {
              '0%': { opacity: 0.3, transform: 'translate(-50%, -50%) scale(0.8)' },
              '50%': { opacity: 0.6, transform: 'translate(-50%, -50%) scale(1)' },
              '100%': { opacity: 0.3, transform: 'translate(-50%, -50%) scale(0.8)' }
            }
          }
        }} 
        elevation={3}
      >
        <img 
          src={CLAN_LOGO} 
          alt="GX Clan Logo" 
          className={styles['auth-logo']}
        />
        
        <Typography 
          component="h1" 
          variant="h4" 
          className={styles['auth-title']}
        >
          Admin Login
        </Typography>
        
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              width: '100%', 
              mb: 2,
              backgroundColor: 'rgba(255, 82, 82, 0.1)',
              color: '#ff5252',
              border: '1px solid rgba(255, 82, 82, 0.3)',
              '& .MuiAlert-icon': {
                color: '#ff5252'
              }
            }}
          >
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} className={styles['auth-form']}>
          <div className={styles['form-control-group']}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              error={!!usernameError}
              helperText={usernameError}
              disabled={isLoading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon sx={{ color: 'primary.main' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '4px',
                },
              }}
            />
          </div>
          <div className={styles['form-control-group']}>
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!passwordError}
              helperText={passwordError}
              disabled={isLoading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: 'primary.main' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleTogglePasswordVisibility}
                      edge="end"
                      size="small"
                    >
                      {showPassword ? 
                        <VisibilityOffIcon sx={{ color: 'text.secondary' }} /> : 
                        <VisibilityIcon sx={{ color: 'text.secondary' }} />
                      }
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '4px',
                },
              }}
            />
          </div>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={isLoading}
            className={styles['submit-button']}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Login to Dashboard'}
          </Button>
          <Box className={styles['auth-footer']}>
            <Link 
              component={RouterLink} 
              to="/register" 
              variant="body2"
              className={styles['auth-link']}
            >
              {"Don't have an account? Register"}
            </Link>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login; 