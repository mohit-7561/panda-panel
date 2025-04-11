import axios from 'axios';
import logger from '../utils/logger';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create a new referral code
export const createReferralCode = async (balance, duration, deductionRates) => {
  try {
    const token = localStorage.getItem('token');
    
    const config = {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
    
    const requestData = {
      balance,
      duration
    };
    
    // Add deduction rates if provided
    if (deductionRates) {
      requestData.deductionRates = deductionRates;
    }
    
    const response = await axios.post(`${API_URL}/referral/create`, requestData, config);
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to create referral code'
    };
  }
};

// Get all referral codes
export const getReferralCodes = async () => {
  try {
    const token = localStorage.getItem('token');
    
    const config = {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
    
    const response = await axios.get(`${API_URL}/referral/codes`, config);
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to get referral codes'
    };
  }
};

// Delete a referral code
export const deleteReferralCode = async (id) => {
  try {
    const token = localStorage.getItem('token');
    
    const config = {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
    
    const response = await axios.delete(`${API_URL}/referral/${id}`, config);
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to delete referral code'
    };
  }
};

// Validate a referral code
export const validateReferralCode = async (code) => {
  try {
    // Normalize code by trimming whitespace and converting to uppercase
    const normalizedCode = code.trim().toUpperCase();
    logger.info(`Validating referral code: ${normalizedCode}`);
    const response = await axios.post(`${API_URL}/referral/validate`, { code: normalizedCode });
    logger.info('Validation response:', response.data);
    return response.data;
  } catch (error) {
    logger.error('Error validating referral code:', error.response?.data || error.message);
    // Preserve the isUsed flag if present in the error response
    if (error.response?.data?.isUsed) {
      return {
        success: false,
        message: error.response.data.message || 'This referral code has already been used',
        isUsed: true
      };
    }
    return {
      success: false,
      message: error.response?.data?.message || 'Invalid referral code'
    };
  }
};

// Register with a referral code
export const registerWithReferralCode = async (username, password, code) => {
  try {
    // Normalize code by trimming whitespace and converting to uppercase
    const normalizedCode = code.trim().toUpperCase();
    logger.info(`Registering with referral code: ${normalizedCode}`);
    
    // Get the mod ID from localStorage if it exists
    const modId = localStorage.getItem('registrationMod');
    
    const requestData = {
      username,
      password,
      code: normalizedCode
    };
    
    // Add modId to the request if it exists
    if (modId) {
      requestData.modId = modId;
    }
    
    const response = await axios.post(`${API_URL}/referral/register`, requestData);
    
    // Clean up after successful registration
    if (response.data.success) {
      localStorage.removeItem('registrationMod');
    }
    
    return response.data;
  } catch (error) {
    logger.error('Referral registration error:', error);
    
    // If we have a response with data from the server
    if (error.response && error.response.data) {
      return {
        success: false,
        message: error.response.data.message || 'Failed to register with referral code'
      };
    }
    
    // Network or other errors
    return {
      success: false,
      message: 'Network error occurred. Please try again.'
    };
  }
};

// Validate a mod-specific referral code
export const validateModReferralCode = async (modIdOrCode, codeOrModId) => {
  try {
    // Handle both parameter orders for backward compatibility
    // If the first parameter looks like a code and the second like a modId
    let modId, code;
    
    if (typeof modIdOrCode === 'string' && modIdOrCode.includes('-')) {
      // First parameter looks like a code, assume parameters are swapped
      code = modIdOrCode;
      modId = codeOrModId;
    } else {
      // Normal parameter order
      modId = modIdOrCode;
      code = codeOrModId;
    }
    
    // Normalize code by trimming whitespace and converting to uppercase
    const normalizedCode = code.trim().toUpperCase();
    logger.info(`Validating referral code ${normalizedCode} for mod ${modId}`);
    const response = await axios.post(`${API_URL}/mods/${modId}/referrals/validate`, { code: normalizedCode });
    logger.info('Validation response:', response.data);
    return response.data;
  } catch (error) {
    logger.error('Error validating mod referral code:', error.response?.data || error.message);
    // Preserve the isUsed flag if present in the error response
    if (error.response?.data?.isUsed) {
      return {
        success: false,
        message: error.response.data.message || 'This referral code has already been used',
        isUsed: true
      };
    }
    return {
      success: false,
      message: error.response?.data?.message || 'Invalid referral code'
    };
  }
};