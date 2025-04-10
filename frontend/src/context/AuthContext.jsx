import { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as loginApi, register as registerApi, registerReseller, getUserProfile } from '../api/auth';
import * as jwt_decode from 'jwt-decode';
import logger from '../utils/logger';

// Create context
export const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const navigate = useNavigate();
  
  // Function to refresh user data from the server
  const refreshUserData = async (forceRefresh = false) => {
    // Prevent concurrent refreshes
    if (isRefreshing && !forceRefresh) {
      logger.info('Already refreshing user data, skipping duplicate request');
      return false;
    }
    
    // Check if we already have deduction rates and not forcing refresh
    if (!forceRefresh && currentUser?.deductionRates && 
        Object.keys(currentUser.deductionRates).length > 0) {
      logger.info('User already has deduction rates, skipping unnecessary refresh:', 
        currentUser.deductionRates);
      return true;
    }
    
    logger.info('Refreshing user data...');
    setIsRefreshing(true);
    
    try {
      const response = await getUserProfile();
      
      if (response.success) {
        const { user } = response;
        logger.info('Refreshed user data:', user);
        logger.info('Deduction rates in refreshed data:', user.deductionRates);
        
        // Force-set deduction rates if they exist on the server but not in local state
        if (user.deductionRates && (!currentUser || !currentUser.deductionRates || 
            JSON.stringify(user.deductionRates) !== JSON.stringify(currentUser.deductionRates))) {
          logger.info('Updating deduction rates from server:', user.deductionRates);
          // Force-sync with server data for deduction rates
          user.deductionRates = {
            day1: Number(user.deductionRates.day1) || 100,
            day3: Number(user.deductionRates.day3) || 150,
            day7: Number(user.deductionRates.day7) || 200,
            day15: Number(user.deductionRates.day15) || 300,
            day30: Number(user.deductionRates.day30) || 500,
            day60: Number(user.deductionRates.day60) || 800
          };
          logger.info('Normalized deduction rates:', user.deductionRates);
        }
        
        // Update localStorage with fresh data
        localStorage.setItem('user', JSON.stringify(user));
        
        // Update state
        setCurrentUser(user);
        setIsRefreshing(false);
        return true;
      } else {
        logger.error('Failed to refresh user data:', response.message);
        setIsRefreshing(false);
        return false;
      }
    } catch (error) {
      logger.error('Error refreshing user data:', error);
      // Don't update the user's active status on network/server errors
      setIsRefreshing(false);
      return false;
    }
  };
  
  // Function to refresh specific mod balance
  const refreshModBalance = async (modId) => {
    logger.info(`Refreshing balance for mod: ${modId}`);
    try {
      // Get fresh user data
      const response = await getUserProfile();
      
      if (response.success && response.user) {
        const { user } = response;
        logger.info('User data with updated mod balance:', user);
        
        // Update currentUser state - only if we have mod balances
        if (user.modBalances && user.modBalances.length > 0) {
          // Update the user in local storage
          localStorage.setItem('user', JSON.stringify(user));
          
          // Update the user in state
          setCurrentUser(user);
          
          // Log the specific mod balance that was updated
          const updatedModBalance = user.modBalances.find(mb => mb.modId === modId);
          if (updatedModBalance) {
            logger.info(`Updated ${modId} balance:`, updatedModBalance.balance, 
              updatedModBalance.unlimitedBalance ? '(unlimited)' : '');
          }
          
          return true;
        }
      }
      return false;
    } catch (error) {
      logger.error('Error refreshing mod balance:', error);
      return false;
    }
  };
  
  // Check if user is logged in on page load
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (token) {
          // Check if token is expired
          const decodedToken = jwt_decode.jwtDecode(token);
          const currentTime = Date.now() / 1000;
          
          if (decodedToken.exp < currentTime) {
            // Token expired, log out user
            logout();
          } else {
            // Token valid, set user from localStorage first (for fast loading)
            const userData = JSON.parse(localStorage.getItem('user'));
            
            // Ensure balanceExpiresAt is available for resellers right after registration
            if (userData && userData.role === 'admin' && !userData.balanceExpiresAt) {
              logger.info('New reseller detected, checking for expiry date data...');
              
              // Force refresh on initial load to ensure we have latest data with expiry dates
              setCurrentUser(userData);
              setIsAuthenticated(true);
              await refreshUserData(true);
            } else {
              setCurrentUser(userData);
              setIsAuthenticated(true);
              
              // Then refresh data from server (to get latest balance)
              // Force refresh on initial load to ensure we have latest data
              await refreshUserData(true);
            }
          }
        }
      } catch (error) {
        logger.error('Auth check error:', error);
        logout();
      } finally {
        setIsLoading(false);
      }
    };
    
    checkLoggedIn();
  }, []);
  
  // Login function
  const login = async (username, password) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await loginApi(username, password);
      
      if (response.success) {
        const { user } = response;
        
        // Log deduction rates for debugging
        logger.info('LOGIN - User data received:', user);
        logger.info('LOGIN - Deduction rates:', user.deductionRates);
        
        if (user.deductionRates) {
          logger.info('User has custom deduction rates:', JSON.stringify(user.deductionRates, null, 2));
          // Make sure all rates are properly normalized as numbers
          user.deductionRates = {
            day1: Number(user.deductionRates.day1) || 100,
            day3: Number(user.deductionRates.day3) || 150,
            day7: Number(user.deductionRates.day7) || 200,
            day15: Number(user.deductionRates.day15) || 300,
            day30: Number(user.deductionRates.day30) || 500,
            day60: Number(user.deductionRates.day60) || 800
          };
          logger.info('Normalized deduction rates:', user.deductionRates);
        } else {
          logger.info('User has no custom deduction rates, using defaults');
        }
        
        // Save token and basic user info to localStorage
        localStorage.setItem('token', user.token);
        
        // Update state with the initial login info
        setCurrentUser(user);
        setIsAuthenticated(true);
        
        // Force a fresh profile fetch from the server when a reseller logs in
        // This ensures we get the actual current balance, not the initial balance
        if (user.role === 'admin') {
          logger.info('Reseller detected, getting latest balance data from server...');
          // Don't save user to localStorage yet, wait for refresh
          await refreshUserData(true);
        } else {
          // For non-resellers, save directly to localStorage
          localStorage.setItem('user', JSON.stringify(user));
        }
        
        // Redirect to dashboard
        navigate('/dashboard');
        return true;
      } else {
        setError(response.message || 'Login failed');
        return false;
      }
    } catch (error) {
      setError(error.message || 'Login failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Register function
  const register = async (username, email, password) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await registerApi(username, email, password);
      
      if (response.success) {
        const { user } = response;
        
        // Save to localStorage
        localStorage.setItem('token', user.token);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Update state
        setCurrentUser(user);
        setIsAuthenticated(true);
        
        // Redirect to dashboard
        navigate('/dashboard');
        return true;
      } else {
        setError(response.message || 'Registration failed');
        return false;
      }
    } catch (error) {
      setError(error.message || 'Registration failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Register with referral code function
  const registerWithReferral = async (username, password, referralCode) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await registerReseller(username, password, referralCode);
      
      if (response.success) {
        const { user } = response;
        logger.info('Registration successful, user data:', user);
        
        // If the user was registered with a mod-specific referral code,
        // make sure we have modBalances data properly initialized
        if (user.role === 'admin') {
          // Ensure modBalances is initialized if not present
          if (!user.modBalances || user.modBalances.length === 0) {
            logger.info('Initializing modBalances for new reseller');
            
            // Check for the mod ID from localStorage to make sure we have the right mod
            const registrationMod = localStorage.getItem('registrationMod');
            
            if (registrationMod) {
              // Make sure user object has a modBalances array
              if (!user.modBalances) {
                user.modBalances = [];
              }
              
              // Add mod-specific balance info if missing
              if (!user.modBalances.some(mb => mb.modId === registrationMod)) {
                logger.info(`Adding ${registrationMod} to user's modBalances`);
                user.modBalances.push({
                  modId: registrationMod,
                  balance: user.balance || 0,
                  unlimitedBalance: user.unlimitedBalance || false,
                  expiresAt: user.balanceExpiresAt || null
                });
              }
            }
          }
        }
        
        // Save to localStorage
        localStorage.setItem('token', user.token);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Update state
        setCurrentUser(user);
        setIsAuthenticated(true);
        
        // Redirect to dashboard
        navigate('/dashboard');
        return true;
      } else {
        setError(response.message || 'Registration failed');
        return false;
      }
    } catch (error) {
      logger.error('Registration error:', error);
      setError(error.message || 'Registration failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Logout function
  const logout = () => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Update state
    setCurrentUser(null);
    setIsAuthenticated(false);
    
    // Redirect to login
    navigate('/login');
  };
  
  // Function to update current user data
  const updateCurrentUser = (userData) => {
    if (!userData) return;
    
    try {
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Update state
      setCurrentUser(userData);
    } catch (error) {
      logger.error('Error updating user data:', error);
    }
  };
  
  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        isLoading,
        error,
        login,
        register,
        registerWithReferral,
        logout,
        updateCurrentUser,
        refreshUserData,
        refreshModBalance,
        setCurrentUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 