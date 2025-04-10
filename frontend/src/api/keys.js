import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Get authorization header
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  return {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };
};

// Get all keys
export const getKeys = async () => {
  try {
    const config = getAuthHeader();
    const response = await axios.get(`${API_URL}/keys`, config);
    
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      throw new Error(error.response.data.message);
    } else {
      throw new Error('Failed to fetch keys');
    }
  }
};

// Get key by ID
export const getKeyById = async (id) => {
  try {
    const config = getAuthHeader();
    const response = await axios.get(`${API_URL}/keys/${id}`, config);
    
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      throw new Error(error.response.data.message);
    } else {
      throw new Error('Failed to fetch key');
    }
  }
};

// Create new key
export const createKey = async (keyData) => {
  try {
    const config = getAuthHeader();
    const response = await axios.post(`${API_URL}/keys`, keyData, config);
    
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      throw new Error(error.response.data.message);
    } else {
      throw new Error('Failed to create key');
    }
  }
};

// Update key
export const updateKey = async (id, keyData) => {
  try {
    const config = getAuthHeader();
    const response = await axios.put(`${API_URL}/keys/${id}`, keyData, config);
    
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      throw new Error(error.response.data.message);
    } else {
      throw new Error('Failed to update key');
    }
  }
};

// Delete key
export const deleteKey = async (id) => {
  try {
    const config = getAuthHeader();
    const response = await axios.delete(`${API_URL}/keys/${id}`, config);
    
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      throw new Error(error.response.data.message);
    } else {
      throw new Error('Failed to delete key');
    }
  }
};

// Validate key (public API - no auth required)
export const validateKey = async (key) => {
  try {
    const response = await axios.post(`${API_URL}/keys/validate`, { key });
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to validate key'
    };
  }
};

// Validate a key for mod APK
export const validateKeyForMod = async (key, deviceId, gameId) => {
  try {
    const response = await axios.post(`${API_URL}/keys/validate-mod`, { 
      key, 
      deviceId,
      gameId 
    });
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to validate key'
    };
  }
};

// Get all keys created by the current user (admin/reseller can only see their own keys)
export const getUserKeys = async (modId = null) => {
  try {
    const config = getAuthHeader();
    let url = `${API_URL}/keys/my-keys`;
    
    // Add modId as query parameter if provided
    if (modId) {
      url += `?modId=${modId}`;
    }
    
    const response = await axios.get(url, config);
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      throw new Error(error.response.data.message);
    } else {
      throw new Error('Failed to fetch your keys');
    }
  }
}; 