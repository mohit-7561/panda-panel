import axios from 'axios';
import logger from '../utils/logger';

// Get the API URL from environment or use default
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Get all mods
export const getAllMods = async () => {
  try {
    const response = await axios.get(`${API_URL}/mods`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get specific mod details
export const getModDetails = async (modId) => {
  try {
    const response = await axios.get(`${API_URL}/mods/${modId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get mod statistics
export const getModStats = async (modId) => {
  try {
    const response = await axios.get(`${API_URL}/mods/${modId}/stats`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    logger.log('Stats response:', response.data);
    
    // Return the data directly, with fallbacks for missing fields
    if (response.data && response.data.data) {
      return {
        totalKeys: response.data.data.totalKeys || 0,
        activeKeys: response.data.data.activeKeys || 0,
        totalResellers: response.data.data.totalResellers || 0,
        activeResellers: response.data.data.activeResellers || 0
      };
    }
    
    // Return default values if data is missing
    return {
      totalKeys: 0,
      activeKeys: 0,
      totalResellers: 0,
      activeResellers: 0
    };
  } catch (error) {
    logger.error('Error fetching mod stats:', error.response?.data || error.message);
    // Return default values if there's an error
    return {
      totalKeys: 0,
      activeKeys: 0,
      totalResellers: 0,
      activeResellers: 0
    };
  }
};

// Create a mod-specific reseller
export const createModReseller = async (modId, usernameOrData, password, balance, isUnlimited = false, duration = '30 days') => {
  try {
    let requestData;
    
    // Check if we're passing in a data object or individual params
    if (typeof usernameOrData === 'object') {
      // We received a data object
      requestData = usernameOrData;
    } else {
      // We received individual parameters
      requestData = { 
        username: usernameOrData,
        password,
        initialBalance: balance,
        unlimitedBalance: isUnlimited,
        duration
      };
    }
    
    const response = await axios.post(
      `${API_URL}/mods/${modId}/resellers`,
      requestData,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update a mod-specific reseller's balance (handles both regular and unlimited balance)
export const updateModResellerBalance = async (modId, resellerId, amount, isUnlimited = false) => {
  try {
    logger.log('Updating mod reseller balance with these parameters:', {
      modId,
      resellerId,
      amount,
      isUnlimited
    });

    // Validate required parameters
    if (!modId) {
      logger.error('Missing modId parameter');
      throw new Error('Missing modId parameter');
    }
    
    if (!resellerId) {
      logger.error('Missing resellerId parameter');
      throw new Error('Missing resellerId parameter');
    }

    const response = await axios.post(
      `${API_URL}/mods/${modId}/resellers/${resellerId}/update-balance`,
      { 
        amount, 
        isUnlimited 
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    
    logger.log('Update balance response:', response.data);
    return response.data;
  } catch (error) {
    logger.error('Error updating balance:', error.response?.data || error.message);
    throw error;
  }
};

// Add balance to a mod-specific reseller
export const addModBalance = async (modId, resellerId, amount) => {
  try {
    const response = await axios.post(
      `${API_URL}/mods/${modId}/resellers/${resellerId}/balance`,
      { amount },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    
    logger.log('Add balance response:', response.data);
    return response.data;
  } catch (error) {
    logger.error('Error adding balance:', error.response?.data || error.message);
    throw error;
  }
};

// Set unlimited balance for a mod-specific reseller
export const setModUnlimitedBalance = async (modId, resellerId, isUnlimited) => {
  try {
    const response = await axios.post(
      `${API_URL}/mods/${modId}/resellers/${resellerId}/unlimited`,
      { isUnlimited },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    
    logger.log('Set unlimited balance response:', response.data);
    return response.data;
  } catch (error) {
    logger.error('Error setting unlimited balance:', error.response?.data || error.message);
    throw error;
  }
};

// Extend balance expiry for a mod-specific reseller
export const extendModBalanceExpiry = async (modId, resellerId, days) => {
  try {
    logger.log(`Extending expiry by ${days} days for reseller ${resellerId} in mod ${modId}`);
    const numDays = parseInt(days);
    logger.log(`Days as number: ${numDays}, type: ${typeof numDays}`);
    
    const response = await axios.post(
      `${API_URL}/mods/${modId}/resellers/${resellerId}/extend`,
      { days: numDays },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    
    logger.log('Extend expiry response:', response.data);
    if (response.data.data && response.data.data.expiresAt) {
      logger.log(`New expiry date: ${response.data.data.expiresAt}`);
    }
    return response.data;
  } catch (error) {
    logger.error('Error extending expiry:', error.response?.data || error.message);
    throw error;
  }
};

// Extend balance expiry for ALL resellers of a specific mod
export const extendAllModBalanceExpiry = async (modId, days) => {
  try {
    logger.log(`Extending expiry by ${days} days for ALL resellers in mod ${modId}`);
    const numDays = parseInt(days);
    logger.log(`Days as number: ${numDays}, type: ${typeof numDays}`);
    
    const response = await axios.post(
      `${API_URL}/mods/${modId}/resellers/extend-all`,
      { days: numDays },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    
    logger.log('Extend all expiry response:', response.data);
    if (response.data.count) {
      logger.log(`Updated ${response.data.count} resellers with ${numDays} days extension`);
    }
    return response.data;
  } catch (error) {
    logger.error('Error extending all expiry dates:', error.response?.data || error.message);
    throw error;
  }
};

// Create a new referral code for a specific mod
export const createModReferralCode = async (modId, referralData) => {
  try {
    logger.log(`Creating referral code for mod ${modId} with data:`, referralData);
    const response = await axios.post(`${API_URL}/mods/${modId}/referrals`, referralData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    logger.log('Referral code creation response:', response.data);
    return response.data;
  } catch (error) {
    logger.error('Error creating referral code:', error.response?.data || error.message);
    throw error;
  }
};

// Get all resellers for a specific mod
export const getModResellers = async (modId) => {
  try {
    logger.log(`Fetching resellers for mod ${modId}`);
    const response = await axios.get(`${API_URL}/mods/${modId}/resellers`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.data.success && Array.isArray(response.data.data)) {
      const formattedResellers = response.data.data.map(reseller => {
        // Store the raw date for debugging
        const rawExpiryDate = reseller.expiresAt;
        logger.log(`Raw expiry date from API for ${reseller.username}: ${rawExpiryDate}`);
        logger.log(`Raw creation date from API for ${reseller.username}: ${reseller.createdAt}`);
        
        // Process expiry date
        let expiryDate = 'No expiry';
        if (rawExpiryDate) {
          try {
            const dateObj = new Date(rawExpiryDate);
            // Check if date is valid
            if (!isNaN(dateObj.getTime())) {
              // Use raw date string for formatting later
              expiryDate = rawExpiryDate;
              logger.log(`Using raw expiry date for ${reseller.username}: ${expiryDate}`);
            } else {
              logger.warn(`Invalid expiry date for ${reseller.username}: ${rawExpiryDate}`);
            }
          } catch (err) {
            logger.error(`Error formatting expiry date: ${err.message}`);
          }
        } else {
          logger.log(`No expiry date provided for ${reseller.username}`);
        }
        
        // Ensure balance is properly handled, forcing 0 when needed
        const balance = reseller.unlimited ? 0 : (reseller.balance === 0 ? 0 : (reseller.balance || 0));
        logger.log(`Reseller ${reseller.username} balance: ${balance} (raw: ${reseller.balance}, unlimited: ${reseller.unlimited})`);
        
        return {
          id: reseller._id,
          _id: reseller._id,
          username: reseller.username,
          balance: balance,
          unlimitedBalance: !!reseller.unlimited,
          expiryDate: expiryDate, // Use the raw date string or 'No expiry'
          expiresAt: rawExpiryDate, // Keep the raw date as well for reference
          expiry: rawExpiryDate, // Add this for backward compatibility
          active: reseller.active || false,
          createdAt: reseller.createdAt || new Date().toISOString() // Ensure createdAt is passed through
        };
      });
      
      logger.log(`Returning ${formattedResellers.length} formatted resellers`);
      return formattedResellers;
    } else {
      logger.error('Failed to fetch mod resellers or received unexpected data format');
      return [];
    }
  } catch (error) {
    logger.error('Error fetching mod resellers:', error.response?.data || error.message);
    throw error;
  }
};

// Get all mod-specific referral codes
export const getModReferralCodes = async (modId) => {
  try {
    logger.log(`Fetching referral codes for mod ${modId}`);
    const response = await axios.get(`${API_URL}/mods/${modId}/referrals`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    logger.log('Referral codes API response:', response.data);
    return response.data.data;
  } catch (error) {
    logger.error('Error fetching referral codes:', error);
    throw error;
  }
};

// Delete a mod-specific referral code
export const deleteModReferralCode = async (modId, codeId) => {
  try {
    logger.log(`Deleting referral code with ID: ${codeId} for mod: ${modId}`);
    const response = await axios.delete(`${API_URL}/mods/${modId}/referrals/${codeId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    logger.log('Referral code deletion response:', response.data);
    return response.data;
  } catch (error) {
    logger.error('Error deleting referral code:', error.response?.data || error.message);
    throw error;
  }
};

// Generate a mod-specific key
export const generateModKey = async (modId, duration) => {
  try {
    const response = await axios.post(
      `${API_URL}/mods/${modId}/keys`,
      { duration },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update mod API settings
export const updateModApiSettings = async (modId, settings) => {
  try {
    const response = await axios.put(
      `${API_URL}/mods/${modId}/settings`,
      settings,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Add function to generate keys for a specific mod
export const generateModKeys = async (modId, amount, duration, isUnlimited, maxDevices) => {
  try {
    // Log the token for debugging (don't do this in production)
    const token = localStorage.getItem('token');
    logger.log('Using token:', token ? token.substring(0, 15) + '...' : 'No token found');
    
    const response = await axios.post(`${API_URL}/keys/generate-mod-keys`, {
      modId,
      amount,
      duration,
      isUnlimited,
      maxDevices
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (response.data.success) {
      return {
        success: true,
        keys: response.data.keys,
        balance: response.data.balance,
        unlimitedBalance: response.data.unlimitedBalance,
        balanceExpiresAt: response.data.balanceExpiresAt
      };
    } else {
      throw new Error(response.data.message || 'Failed to generate keys');
    }
  } catch (error) {
    logger.error('Error generating mod keys:', error);
    logger.error('Status:', error.response?.status);
    logger.error('Error response:', error.response?.data);
    throw error;
  }
};

// Add function to get all keys for a specific mod
export const getModKeys = async (modId, filterByOwn = false, ownerKeysOnly = true) => {
  try {
    // Build URL with appropriate parameters
    let url = `${API_URL}/keys/mod/${modId}`;
    
    if (filterByOwn) {
      url += `?filterBy=own`;
    }
    
    if (ownerKeysOnly && !filterByOwn) {
      url += `?ownerKeysOnly=true`;
    }
    
    logger.log('Making request to:', url);
    
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.data.success) {
      // Return the keys with populated creator information
      logger.log('API response:', response.data);
      
      // Add a data source field to help identify where each key came from
      const keys = response.data.keys || [];
      
      // Process the keys to add a source field
      const processedKeys = keys.map(key => ({
        ...key,
        keySource: key.createdBy && key.createdBy.role === 'owner' ? 'owner' : 'admin'
      }));
      
      return processedKeys;
    }
    return [];
  } catch (error) {
    // If it's a 403 error, log a message but don't show an error to the user
    if (error.response && error.response.status === 403) {
      logger.log('User does not have permission to view keys for this mod');
      return [];
    }
    logger.error('Error fetching mod keys:', error);
    return [];
  }
};

// Delete a license key
export const deleteKey = async (keyId) => {
  try {
    const response = await axios.delete(`${API_URL}/keys/${keyId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    return response.data;
  } catch (error) {
    logger.error('Error deleting key:', error.response?.data || error.message);
    throw error;
  }
};

// Extend a key's expiry date
export const extendKeyExpiry = async (keyId, days) => {
  try {
    logger.log(`Extending key ${keyId} expiry by ${days} days`);
    
    // First try with the mods endpoint pattern
    try {
      const response = await axios.patch(
        `${API_URL}/mods/keys/${keyId}/extend`,
        { days: parseInt(days) },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      logger.log('Extend key expiry response:', response.data);
      return response.data;
    } catch (firstError) {
      logger.log('First attempt failed, trying alternate endpoint:', firstError.message);
      
      // Try the direct keys endpoint as fallback
      const response = await axios.patch(
        `${API_URL}/keys/${keyId}/extend`,
        { days: parseInt(days) },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      logger.log('Extend key expiry response (alternate endpoint):', response.data);
      return response.data;
    }
  } catch (error) {
    logger.error('Error extending key expiry:', error.response?.data || error.message);
    throw error;
  }
};

// Get keys created by the current user
export const getUserKeys = async (modId = null) => {
  try {
    const url = modId 
      ? `${API_URL}/keys/my-keys?modId=${modId}` 
      : `${API_URL}/keys/my-keys`;
      
    logger.log('Making request to:', url);
    
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.data.success) {
      logger.log('API response for user keys:', response.data);
      
      // Add a data source field to help identify where each key came from
      const keys = response.data.keys || [];
      
      // Process the keys to add a source field
      const processedKeys = keys.map(key => ({
        ...key,
        keySource: key.createdBy && key.createdBy.role === 'owner' ? 'owner' : 'admin'
      }));
      
      return processedKeys;
    }
    return [];
  } catch (error) {
    logger.error('Error fetching user keys:', error);
    return [];
  }
};