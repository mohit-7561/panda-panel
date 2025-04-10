import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Login API call
export const login = async (username, password) => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      username,
      password
    });
    
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      throw new Error(error.response.data.message);
    } else {
      throw new Error('Failed to login. Please try again.');
    }
  }
};

// Register API call
export const register = async (username, email, password) => {
  try {
    const userData = {
      username,
      password
    };
    
    // Add email only if provided
    if (email) {
      userData.email = email;
    }
    
    const response = await axios.post(`${API_URL}/auth/register`, userData);
    
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      throw new Error(error.response.data.message);
    } else {
      throw new Error('Failed to register. Please try again.');
    }
  }
};

// Create owner account (first time setup)
export const createOwner = async (username, password, setupCode) => {
  try {
    const response = await axios.post(`${API_URL}/auth/create-owner`, {
      username,
      password,
      setupCode
    });
    
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      throw new Error(error.response.data.message);
    } else {
      throw new Error('Failed to create owner account. Please try again.');
    }
  }
};

// Get user profile
export const getUserProfile = async () => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return {
        success: false,
        message: 'No authentication token found'
      };
    }
    
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    
    const response = await axios.get(`${API_URL}/auth/profile`, config);
    return response.data;
  } catch (error) {
    // Return more detailed error information
    if (error.response) {
      // Server responded with a status code outside of 2xx range
      return {
        success: false,
        status: error.response.status,
        message: error.response?.data?.message || 'Server error, please try again',
        error: error.response.data
      };
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Network error - no response:', error.request);
      return {
        success: false,
        message: 'Network error, please check your connection'
      };
    } else {
      // Something happened in setting up the request
      console.error('Request setup error:', error.message);
      return {
        success: false,
        message: `Error: ${error.message}`
      };
    }
  }
};

// Register a new reseller with a referral code
export const registerReseller = async (username, password, referralCode) => {
  try {// Check if this is a mod-specific registration
    const modId = localStorage.getItem('registrationMod');
    let response;
    
    if (modId) {const requestData = {
        username,
        password,
        code: referralCode
      };
      
      response = await axios.post(`${API_URL}/mods/${modId}/referrals/register`, requestData);
      
      // For mod-specific registrations, ensure user has proper modBalances
      if (response.data.success && response.data.user) {
        const { user } = response.data;
        
        // Initialize modBalances if needed
        if (!user.modBalances) {
          user.modBalances = [];
        }
        
        // Add this mod to modBalances if not already present
        if (!user.modBalances.some(mb => mb.modId === modId)) {user.modBalances.push({
            modId: modId,
            balance: user.balance || 0,
            unlimitedBalance: user.unlimitedBalance || false,
            expiresAt: user.balanceExpiresAt || null
          });
        }
      }
    } else {
      // Regular referral registration (non-mod specific)
      const requestData = {
        username,
        password,
        code: referralCode
      };
      
      response = await axios.post(`${API_URL}/referral/register`, requestData);
    }// Clean up after successful registration
    if (response.data.success) {
      localStorage.removeItem('registrationMod');
    }
    
    return response.data;
  } catch (error) {
        if (error.response && error.response.data) {
      throw new Error(error.response.data.message || 'Registration failed');
    } else {
      throw new Error('Network error occurred. Please try again.');
    }
  }
};