import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Get users created by current user
export const getCreatedUsers = async () => {
  try {
    const token = localStorage.getItem('token');
    
    const config = {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
    
    const response = await axios.get(`${API_URL}/balance/users`, config);
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to get users'
    };
  }
};

// Create a new admin (reseller)
export const createAdmin = async (userData) => {
  try {
    const token = localStorage.getItem('token');
    
    const config = {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
    
    const response = await axios.post(`${API_URL}/balance/create-admin`, userData, config);
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to create admin'
    };
  }
};

// Add balance to admin
export const addBalance = async (userId, amount) => {
  try {
    const token = localStorage.getItem('token');
    
    const config = {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
    
    const response = await axios.post(`${API_URL}/balance/add-balance`, { userId, amount }, config);
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to add balance'
    };
  }
};

// Update admin balance
export const updateBalance = async (userId, balance) => {
  try {
    const token = localStorage.getItem('token');
    
    const config = {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
    
    const response = await axios.put(`${API_URL}/balance/update-balance`, { userId, balance }, config);
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to update balance'
    };
  }
};

// Update admin balance and duration
export const updateBalanceWithDuration = async (userId, balance, duration) => {
  try {
    const token = localStorage.getItem('token');
    
    const config = {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
    
    const response = await axios.put(`${API_URL}/balance/update-balance-with-duration`, { 
      userId, 
      balance, 
      balanceDuration: duration 
    }, config);
    
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to update balance and duration'
    };
  }
};

// Set unlimited balance for reseller
export const setUnlimitedBalance = async (userId, unlimited) => {
  try {
    const token = localStorage.getItem('token');
    
    const config = {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
    
    const response = await axios.put(`${API_URL}/balance/set-unlimited`, { 
      userId, 
      unlimited
    }, config);
    
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to update unlimited balance status'
    };
  }
};

// Extend balance expiry
export const extendBalanceExpiry = async (userId, days) => {
  try {
    const token = localStorage.getItem('token');
    
    const config = {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
    
    const response = await axios.put(`${API_URL}/balance/extend-expiry`, { 
      userId, 
      days
    }, config);
    
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to extend balance expiry'
    };
  }
};