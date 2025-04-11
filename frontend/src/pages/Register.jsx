import { useState, useContext, useEffect } from 'react';
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
  InputAdornment
} from '@mui/material';
import { 
  VpnKey as KeyIcon, 
  CheckCircle as CheckCircleIcon, 
  Cancel as CancelIcon,
  Person as PersonIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import { validateReferralCode, validateModReferralCode } from '../api/referral';
import styles from './Auth.module.css';

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [isCodeValid, setIsCodeValid] = useState(false);
  const [codeValidated, setCodeValidated] = useState(false);
  const [codeBalance, setCodeBalance] = useState(0);
  const [codeDuration, setCodeDuration] = useState('');
  const [validating, setValidating] = useState(false);
  const [modId, setModId] = useState(null);
  
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [referralCodeError, setReferralCodeError] = useState('');
  
  const { registerWithReferral, isLoading, error } = useContext(AuthContext);
  
  // Extract referral code from URL if present
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const codeFromUrl = searchParams.get('code');
    const modFromUrl = searchParams.get('mod');
    
    if (modFromUrl) {
      setModId(modFromUrl);
      localStorage.setItem('registrationMod', modFromUrl);
    }
    
    if (codeFromUrl) {
      setReferralCode(codeFromUrl);
      validateCode(codeFromUrl);
    }
  }, []);
  
  const validateCode = async (code) => {
    setValidating(true);
    setReferralCodeError('');
    
    try {
      const normalizedCode = code.trim().toUpperCase();
      
      let response;
      
      // If modId is present in URL, validate as mod-specific referral code
      if (modId) {
        response = await validateModReferralCode(modId, normalizedCode);
      } else {
        // Try regular validation first
        response = await validateReferralCode(normalizedCode);
        
        // If regular validation fails, it might be a mod-specific code
        if (!response.success && normalizedCode.includes('-')) {
          const storedModId = normalizedCode.split('-')[0].toLowerCase();
          
          // Try validating as a mod-specific code
          const modSpecificResponse = await validateModReferralCode(storedModId, normalizedCode);
          
          if (modSpecificResponse.success) {
            response = modSpecificResponse;
            setModId(storedModId);
          }
        }
      }
      
      if (response.success) {
        const data = response.data || response;
        setIsCodeValid(true);
        setCodeBalance(data.balance || response.balance || 0);
        setCodeDuration(data.duration || response.duration || '');
        setReferralCodeError('');
      } else {
        setIsCodeValid(false);
        // Specific error message for used codes
        if (response.isUsed) {
          setReferralCodeError('This referral code has already been used');
        } else {
          setReferralCodeError(response.message || 'Invalid referral code');
        }
      }
    } catch (error) {
      setIsCodeValid(false);
      setReferralCodeError('Error validating code');
    } finally {
      setCodeValidated(true);
      setValidating(false);
    }
  };
  
  const handleReferralCodeChange = (e) => {
    const value = e.target.value;
    setReferralCode(value);
    
    // Reset validation when code changes
    if (codeValidated) {
      setCodeValidated(false);
      setIsCodeValid(false);
      setCodeBalance(0);
      setCodeDuration('');
      setReferralCodeError('');
    }
  };
  
  const handleReferralCodeBlur = () => {
    if (referralCode) {
      validateCode(referralCode);
    }
  };
  
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
    
    // Confirm password validation
    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      isValid = false;
    } else {
      setConfirmPasswordError('');
    }
    
    // Referral code validation
    if (!referralCode) {
      setReferralCodeError('Referral code is required');
      isValid = false;
    } else if (!isCodeValid && codeValidated) {
      setReferralCodeError('Please enter a valid referral code');
      isValid = false;
    }
    
    return isValid;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      await registerWithReferral(username, password, referralCode);
    }
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
        <Typography 
          component="h1" 
          variant="h4" 
          className={styles['auth-title']}
        >
          Register Account
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
              id="referralCode"
              label="Referral Code"
              name="referralCode"
              autoComplete="off"
              value={referralCode}
              onChange={handleReferralCodeChange}
              onBlur={handleReferralCodeBlur}
              error={!!referralCodeError}
              helperText={referralCodeError}
              disabled={isLoading || codeValidated && isCodeValid}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <KeyIcon sx={{ color: 'primary.main' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    {codeValidated && (
                      isCodeValid ? (
                        <CheckCircleIcon color="success" />
                      ) : (
                        <CancelIcon color="error" />
                      )
                    )}
                    {validating && <CircularProgress size={20} />}
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
          <div className={styles['form-control-group']}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
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
              type="password"
              id="password"
              autoComplete="new-password"
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
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              id="confirmPassword"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={!!confirmPasswordError}
              helperText={confirmPasswordError}
              disabled={isLoading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: 'primary.main' }} />
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
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={isLoading || !isCodeValid}
            className={styles['submit-button']}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Register'}
          </Button>
          <Box className={styles['auth-footer']}>
            <Link 
              component={RouterLink} 
              to="/login" 
              variant="body2"
              className={styles['auth-link']}
            >
              {"Already have an account? Login"}
            </Link>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Register;