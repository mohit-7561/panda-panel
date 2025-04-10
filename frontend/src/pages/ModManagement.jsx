import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { useParams, Navigate, useLocation } from 'react-router-dom';
import logger from '../utils/logger';
import {
  Container,
  Card,
  CardHeader,
  CardContent,
  Typography,
  Button,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Switch,
  FormControlLabel,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Menu,
  InputAdornment,
  Avatar,
  Tooltip,
  Box,
  CircularProgress,
  alpha,
  TablePagination,
  Alert,
  Tabs,
  Tab,
  Collapse
} from '@mui/material';
import {
  Gamepad as ModIcon,
  Security as SecurityIcon,
  Visibility as VisionIcon,
  GpsFixed as AimIcon,
  FlashOn as FlashOnIcon,
  Adjust as AdjustIcon,
  VpnKey as KeyIcon,
  People as PeopleIcon,
  BarChart as StatsIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FileCopy as CopyIcon,
  Code as CodeIcon,
  Speed as SpeedIcon,
  Radar as RadarIcon,
  Api as ApiIcon,
  Add as AddIcon,
  AccessTime as AccessTimeIcon,
  ContentCopy as ContentCopyIcon,
  AllInclusive as AllInclusiveIcon,
  Update as UpdateIcon,
  Menu as MenuIcon,
  Refresh as RefreshIcon,
  CalendarToday as CalendarTodayIcon,
  ManageAccounts as ManageAccountsIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  Event as EventIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  ErrorOutline as ErrorOutlineIcon,
  ViewList as ViewListIcon,
  VpnKey as VpnKeyIcon,
  Search as SearchIcon,
  GroupOff as GroupOffIcon,
  PersonAdd as PersonAddIcon,
  VisibilityOff as VisibilityOff,
  Visibility as Visibility
} from '@mui/icons-material';
import Layout from '../components/Layout';
import ModStats from '../components/Dashboard/ModStats';
import StatsSummary from '../components/Dashboard/StatsSummary';
import ModBalanceManager from '../components/Dashboard/ModBalanceManager';
import KeyDisplay from '../components/KeyDisplay';
import { AuthContext } from '../context/AuthContext';
import { 
  getModDetails, 
  getModStats, 
  getModResellers,
  getModReferralCodes,
  createModReseller,
  addModBalance,
  setModUnlimitedBalance,
  extendModBalanceExpiry,
  extendAllModBalanceExpiry,
  createModReferralCode,
  deleteModReferralCode,
  generateModKeys,
  getModKeys,
  deleteKey,
  getUserKeys,
  extendKeyExpiry,
  updateModResellerBalance
} from '../api/mod';
import { toast } from 'react-toastify';
import axios from 'axios';
import styles from './ModManagement.module.css';
// Define mods structure but without hardcoded values
const MOD_TEMPLATES = {
  winstar: {
    name: 'WinStar',
    icon: <ModIcon sx={{ color: '#2196f3' }} />,
    description: 'Professional gaming enhancement for Windows platform.',
    color: '#2196f3',
  },
  ioszero: {
    name: 'iOSZero',
    icon: <SecurityIcon sx={{ color: '#4caf50' }} />,
    description: 'Advanced iOS device enhancement toolkit.',
    color: '#4caf50',
  },
  godeye: {
    name: 'Godeye',
    icon: <AdjustIcon sx={{ color: '#795548' }} />,
    description: 'Ultimate precision enhancement tool for gaming.',
    color: '#795548',
  },
  vision: {
    name: 'Vision',
    icon: <VisionIcon sx={{ color: '#9c27b0' }} />,
    description: 'Advanced visual enhancement for competitive gaming.',
    color: '#9c27b0',
  },
  lethal: {
    name: 'Lethal',
    icon: <FlashOnIcon sx={{ color: '#f44336' }} />,
    description: 'Performance booster for extreme gaming scenarios.',
    color: '#f44336',
  },
  deadeye: {
    name: 'Deadeye',
    icon: <AimIcon sx={{ color: '#ff9800' }} />,
    description: 'Precision targeting enhancement toolkit.',
    color: '#ff9800',
  },
  speedhack: {
    name: 'Speed Hack',
    icon: <SpeedIcon />,
    color: '#00b381'
  },
  esp: {
    name: 'ESP',
    icon: <VisionIcon />,
    color: '#00c3ff'
  },
  radar: {
    name: 'Radar',
    icon: <RadarIcon />,
    color: '#ffaa00'
  }
};

// Tab Panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`mod-tabpanel-${index}`}
      aria-labelledby={`mod-tab-${index}`}
      className={styles.tabPanel}
      {...other}
    >
      {value === index && (
        <Box>
          {children}
        </Box>
      )}
    </div>
  );
}

// Utility functions
const formatDate = (dateString) => {
  // Log the input for debugging
  logger.info('formatDate input:', dateString, 'type:', typeof dateString);

  // If the date string is null/undefined, return 'No expiry'
  if (!dateString) {
    logger.info('formatDate returning: No expiry (undefined/null input)');
    return 'No expiry';
  }
  
  // If the date string is explicitly 'No expiry', return as is
  if (dateString === 'No expiry') {
    logger.info('formatDate returning: No expiry (explicit string)');
    return 'No expiry';
  }
  
  try {
    // Attempt to parse the date
    const date = new Date(dateString);
    logger.info('formatDate parsed date:', date);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      logger.warn(`Invalid date string provided: ${dateString}`);
      return 'Invalid date';
    }
    
    // Format the date consistently across all mod sections
    // Use 'numeric' for year to display full year (e.g., 2023 instead of 23)
    const formatted = date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC' // Use UTC to avoid timezone issues
    });
    logger.info('formatDate returned formatted date:', formatted);
    return formatted;
  } catch (error) {
    logger.error(`Error formatting date (${dateString}):`, error);
    return 'Date error'; // Return a clear error message
  }
};

// Add a detailed date formatter function for when more detail is needed
const formatDetailedDate = (dateString) => {
  if (!dateString) {
    return 'Not available';
  }
  
  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    // Format with day, month, year, and time
    return date.toLocaleString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC'
    });
  } catch (error) {
    logger.error(`Error formatting detailed date (${dateString}):`, error);
    return 'Date error';
  }
};

// Check if a date is expired (in the past)
const isExpired = (dateString) => {
  if (!dateString || dateString === 'No expiry') return false;
  
  try {
  const expiryDate = new Date(dateString);
  if (isNaN(expiryDate.getTime())) return false;
  
  const now = new Date();
  return expiryDate < now;
  } catch (error) {
    logger.error(`Error checking if date is expired (${dateString}):`, error);
    return false;
  }
};

// Get API URL from environment or use default
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ModManagement = () => {
  const { modId } = useParams();
  const location = useLocation();
  const [tabValue, setTabValue] = useState(0);
  const { currentUser, refreshModBalance } = useContext(AuthContext);
  const [loading, setLoading] = useState(true); // Set initial loading to true
  const [modData, setModData] = useState(null);
  const [resellers, setResellers] = useState([]);
  const [filteredResellers, setFilteredResellers] = useState([]);
  const [resellerDateFilter, setResellerDateFilter] = useState('all');
  const [customResellerStartDate, setCustomResellerStartDate] = useState('');
  const [customResellerEndDate, setCustomResellerEndDate] = useState('');
  const [stats, setStats] = useState({
    totalKeys: 0,
    activeKeys: 0,
    totalResellers: 0
  });
  const [referralCodes, setReferralCodes] = useState([]);
  const [filteredReferralCodes, setFilteredReferralCodes] = useState([]);
  const [referralDateFilter, setReferralDateFilter] = useState('all');
  const [customReferralStartDate, setCustomReferralStartDate] = useState('');
  const [customReferralEndDate, setCustomReferralEndDate] = useState('');
  const [newCode, setNewCode] = useState('');
  const [codeBalance, setCodeBalance] = useState('');
  const [codeUnlimited, setCodeUnlimited] = useState(false);
  const [codeDuration, setCodeDuration] = useState('30 days');
  const [resellersLoading, setResellersLoading] = useState(false);
  const [referralLoading, setReferralLoading] = useState(false);
  const [expandedResellerCard, setExpandedResellerCard] = useState(true);
  const [expandedReferralCard, setExpandedReferralCard] = useState(true);
  
  // Form states
  const [selectedReseller, setSelectedReseller] = useState('');
  const [balanceAmount, setBalanceAmount] = useState('');
  const [expiryDays, setExpiryDays] = useState(30);
  const [unlimitedEnabled, setUnlimitedEnabled] = useState(false);
  const [referralDuration, setReferralDuration] = useState('30 days');
  const [resellerUsername, setResellerUsername] = useState('');
  const [resellerPassword, setResellerPassword] = useState('');
  const [newResellerUnlimited, setNewResellerUnlimited] = useState(false);
  const [newResellerDuration, setNewResellerDuration] = useState('30 days');
  const [referralUnlimited, setReferralUnlimited] = useState(false);
  const [referralBalance, setReferralBalance] = useState('');
  
  // Edit balance modal state
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [selectedResellerForEdit, setSelectedResellerForEdit] = useState(null);
  const [editBalanceForm, setEditBalanceForm] = useState({
    balance: '',
    unlimited: false,
    duration: '30 days',
    expiryDays: 30, // Default 30 days for extension
    dailyDeduction: 0,
    weeklyDeduction: 0,
    monthlyDeduction: 0
  });
  
  // Key generation states
  const [keyGenAmount, setKeyGenAmount] = useState(1);
  const [keyDuration, setKeyDuration] = useState(30);
  const [keyUnlimited, setKeyUnlimited] = useState(false);
  const [showKeyGenModal, setShowKeyGenModal] = useState(false);
  
  // Add showReferralModal state
  const [showReferralModal, setShowReferralModal] = useState(false);
  
  // Add new state for manual reseller creation modal
  const [showCreateResellerModal, setShowCreateResellerModal] = useState(false);
  const [newResellerForm, setNewResellerForm] = useState({
    username: '',
    password: '',
    balance: '',
    unlimited: false,
    duration: '30 days',
    deductionRates: {
      day1: 100,
      day3: 150,
      day7: 200, 
      day15: 300,
      day30: 500,
      day60: 800
    }
  });
  
  // Add state for generated keys
  const [keys, setKeys] = useState([]);
  const [filteredKeys, setFilteredKeys] = useState([]);
  const [generatedKeys, setGeneratedKeys] = useState([]);
  const [keyGenLoading, setKeyGenLoading] = useState(false);
  
  // Add state for key statistics
  const [keyStats, setKeyStats] = useState({
    total: 0,
    active: 0,
    expired: 0
  });
  
  // Add state for key-related dialogs
  const [deleteKeyDialogOpen, setDeleteKeyDialogOpen] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState(null);
  const [deleteKeyLoading, setDeleteKeyLoading] = useState(false);
  
  // Add state for edit key dialog
  const [editKeyDialogOpen, setEditKeyDialogOpen] = useState(false);
  const [keyToEdit, setKeyToEdit] = useState(null);
  const [editKeyLoading, setEditKeyLoading] = useState(false);
  const [keyExtensionDays, setKeyExtensionDays] = useState(30);
  
  // Add state for bulk action confirmation dialog
  const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false);
  const [pendingBulkAction, setPendingBulkAction] = useState(null);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [extensionDays, setExtensionDays] = useState(30);
  const [selectedResellerIds, setSelectedResellerIds] = useState([]);
  
  // First, add a new state variable for the key type filter
  const [keyTypeFilter, setKeyTypeFilter] = useState('all'); // 'all', 'owner', 'admin'
  
  // Add state for key date filtering
  const [keyDateFilter, setKeyDateFilter] = useState('all'); // 'all', 'today', 'yesterday', 'custom'
  const [customKeyStartDate, setCustomKeyStartDate] = useState('');
  const [customKeyEndDate, setCustomKeyEndDate] = useState('');
  
  // Add deductionRates state
  const [deductionRates, setDeductionRates] = useState({
    day1: 100,
    day3: 150,
    day7: 200, 
    day15: 300,
    day30: 500,
    day60: 800
  });
  
  // Get mod template
  const modTemplate = MOD_TEMPLATES[modId] || {
    name: 'Unknown Mod',
    icon: <CodeIcon />,
    color: '#6c757d'
  };
  
  // If mod doesn't exist in templates, redirect
  if (!modTemplate) {
    return <Navigate to="/dashboard" />;
  }
  
  // Tab change handler
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Handler functions for reseller management
  const handleCreateReseller = async () => {
    if (!resellerUsername || !resellerPassword || (!balanceAmount && !newResellerUnlimited)) {
      toast.error('Please enter a username, password, and either a balance amount or enable unlimited balance');
      return;
    }
    
    try {
      setLoading(true);
      const balanceValue = newResellerUnlimited ? 0 : Number(balanceAmount);
      await createModReseller(modId, resellerUsername, resellerPassword, balanceValue, newResellerUnlimited, newResellerDuration);
      toast.success(`Created reseller with ${newResellerUnlimited ? 'unlimited' : balanceAmount} ${modTemplate.name} balance for ${newResellerDuration}`);
      
      // Refresh resellers list
      const updatedResellers = await getModResellers(modId);
      setResellers(updatedResellers);
      
      // Reset form
      setResellerUsername('');
      setResellerPassword('');
      setBalanceAmount('');
      setNewResellerUnlimited(false);
      setNewResellerDuration('30 days');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create reseller');
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddBalance = async () => {
    if (!selectedReseller || !balanceAmount) {
      toast.error('Please select a reseller and enter a balance amount');
      return;
    }
    
    try {
      setLoading(true);
      await addModBalance(modId, selectedReseller, balanceAmount);
      toast.success(`Added ${balanceAmount} ${modTemplate.name} balance to reseller`);
      
      // Refresh resellers list
      const updatedResellers = await getModResellers(modId);
      setResellers(updatedResellers);
      
      // Reset form
      setSelectedReseller('');
      setBalanceAmount(0);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add balance');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSetUnlimitedBalance = async () => {
    if (!selectedReseller) {
      toast.error('Please select a reseller');
      return;
    }
    
    try {
      setLoading(true);
      await setModUnlimitedBalance(modId, selectedReseller, unlimitedEnabled);
      toast.success(`Set unlimited ${modTemplate.name} balance: ${unlimitedEnabled ? 'Enabled' : 'Disabled'}`);
      
      // Refresh resellers list
      const updatedResellers = await getModResellers(modId);
      setResellers(updatedResellers);
      
      // Reset form
      setSelectedReseller('');
      setUnlimitedEnabled(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update unlimited status');
    } finally {
      setLoading(false);
    }
  };
  
  const handleExtendExpiry = async () => {
    if (!selectedReseller || !expiryDays) {
      toast.error('Please select a reseller and enter days to extend');
      return;
    }
    
    try {
      setLoading(true);
      await extendModBalanceExpiry(modId, selectedReseller, expiryDays);
      toast.success(`Extended ${modTemplate.name} balance expiry by ${expiryDays} days`);
      
      // Refresh resellers list
      const updatedResellers = await getModResellers(modId);
      setResellers(updatedResellers);
      
      // Reset form
      setSelectedReseller('');
      setExpiryDays(30);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to extend expiry');
    } finally {
      setLoading(false);
    }
  };
  
  // Handler for creating referral code
  const handleCreateReferralCode = async () => {
    if (!referralBalance && !referralUnlimited) {
      toast.error('Please enter an initial balance or enable unlimited balance');
      return;
    }
    
    try {
      setLoading(true);
      const balanceValue = referralUnlimited ? 0 : Number(referralBalance);
      
      // Ensure all deduction rates are properly set with proper number conversion
      const normalizedDeductionRates = {
        day1: deductionRates.day1 === '' || deductionRates.day1 === undefined ? 100 : Number(deductionRates.day1),
        day3: deductionRates.day3 === '' || deductionRates.day3 === undefined ? 150 : Number(deductionRates.day3),
        day7: deductionRates.day7 === '' || deductionRates.day7 === undefined ? 200 : Number(deductionRates.day7),
        day15: deductionRates.day15 === '' || deductionRates.day15 === undefined ? 300 : Number(deductionRates.day15),
        day30: deductionRates.day30 === '' || deductionRates.day30 === undefined ? 500 : Number(deductionRates.day30),
        day60: deductionRates.day60 === '' || deductionRates.day60 === undefined ? 800 : Number(deductionRates.day60)
      };
      
      // Create a referralData object to match the updated API function
      const referralData = {
        balance: balanceValue,
        duration: referralDuration,
        unlimited: referralUnlimited,
        deductionRates: normalizedDeductionRates
      };
      
      const result = await createModReferralCode(modId, referralData);
      toast.success(`Created ${modTemplate.name} referral code with ${referralUnlimited ? 'unlimited' : referralBalance} balance for ${referralDuration}`);
      
      // Refresh referral codes list
      if (result.success) {
        const updatedCodes = await getModReferralCodes(modId);
        setReferralCodes(updatedCodes);
        
        // Reset form
        setReferralBalance('');
        setReferralDuration('30 days');
        setReferralUnlimited(false);
        
        // Close the modal
        setShowReferralModal(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create referral code');
    } finally {
      setLoading(false);
    }
  };

  // Handler for copying referral code
  const handleCopyReferralCode = (code) => {
    const baseUrl = window.location.origin;
    // Include modId in the referral link so the registration process knows which mod
    const referralLink = `${baseUrl}/register?code=${code}&mod=${modId}`;
    
    navigator.clipboard.writeText(referralLink)
      .then(() => toast.success('Referral link copied to clipboard'))
      .catch(() => toast.error('Failed to copy referral code'));
  };

  // Handler for deleting referral code
  const handleDeleteReferralCode = async (codeId) => {
    if (!codeId) {
      console.error('Attempted to delete referral code with undefined ID');
      toast.error('Cannot delete referral code: Invalid ID');
      return;
    }
    
    try {
      setLoading(true);await deleteModReferralCode(modId, codeId);
      toast.success('Referral code deleted successfully');
      
      // Refresh referral codes list
      const updatedCodes = await getModReferralCodes(modId);
      setReferralCodes(updatedCodes);
    } catch (error) {
      console.error('Error deleting referral code:', error);
      toast.error(error.response?.data?.message || 'Failed to delete referral code');
    } finally {
      setLoading(false);
    }
  };
  
  // Edit reseller balance
  const handleEditReseller = (reseller) => {
    setSelectedResellerForEdit({
      _id: reseller.id, // Make sure we're using the id property here
      username: reseller.username,
      balance: reseller.balance,
      unlimitedBalance: reseller.unlimitedBalance
    });
    setEditBalanceForm({
      balance: reseller.unlimitedBalance ? 0 : parseInt(reseller.balance) || 0,
      unlimited: !!reseller.unlimitedBalance,
      duration: '30 days',
      expiryDays: 30, // Default 30 days for extension
    });
    setShowBalanceModal(true);
  };
  
  // Handle clicking on a reseller row
  const handleResellerClick = (reseller) => {
    // Disabled editing functionality
    // No action when clicking on a row
  };
  
  const handleCloseBalanceModal = () => {
    setShowBalanceModal(false);
    setSelectedResellerForEdit(null);
  };
  
  const handleEditBalanceInputChange = (e) => {
    const { name, value, checked } = e.target;
    setEditBalanceForm({
      ...editBalanceForm,
      [name]: name === 'unlimited' ? checked : value
    });
  };
  
  const handleEditBalanceSubmit = async () => {
    if (!selectedResellerForEdit) {
      toast.error('No reseller selected');
      return;
    }
    
    if (!selectedResellerForEdit._id) {
      toast.error('Invalid reseller ID');
      console.error('Selected reseller has no ID:', selectedResellerForEdit);
      return;
    }
    
    setLoading(true);
    try {
      const result = await updateModResellerBalance(
        modId, 
        selectedResellerForEdit._id, 
        Number(editBalanceForm.balance), 
        editBalanceForm.unlimited
      );
      
      if (result.success) {
        toast.success('Balance updated successfully');
        
        // Update the reseller's balance in the local state
        const formattedResellers = resellers.map(r => {
          if (r.id === selectedResellerForEdit._id) {
            return {
              ...r,
              balance: editBalanceForm.unlimited ? 0 : Number(editBalanceForm.balance),
              unlimitedBalance: editBalanceForm.unlimited
            };
          }
          return r;
        });
        
        setResellers(formattedResellers);
        
        // Also refresh the mod balance in the auth context
        refreshModBalance(modId);
      } else {
        toast.error(result.message || 'Failed to update balance');
      }
    } catch (error) {
      console.error('Error updating reseller balance:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update reseller balance';
      toast.error(errorMessage);
    } finally {
      handleCloseBalanceModal();
      setLoading(false);
    }
  };
  
  // Add handler for manual reseller creation
  const handleManualResellerCreate = async () => {
    if (!newResellerForm.username || !newResellerForm.password || (!newResellerForm.balance && !newResellerForm.unlimited)) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const balanceValue = newResellerForm.unlimited ? 0 : Number(newResellerForm.balance);
      
      // Create the reseller with deduction rates
      const resellerData = {
        username: newResellerForm.username,
        password: newResellerForm.password,
        balance: balanceValue,
        unlimited: newResellerForm.unlimited,
        duration: newResellerForm.duration,
        deductionRates: newResellerForm.deductionRates
      };
      
      await createModReseller(modId, resellerData);
      toast.success(`Created admin reseller account for ${newResellerForm.username}`);
      
      // Refresh resellers list
      const updatedResellers = await getModResellers(modId);
      setResellers(updatedResellers);
      
      // Reset form and close modal
      setNewResellerForm({
        username: '',
        password: '',
        balance: '',
        unlimited: false,
        duration: '30 days',
        deductionRates: {
          day1: 100,
          day3: 150,
          day7: 200, 
          day15: 300,
          day30: 500,
          day60: 800
        }
      });
      setShowCreateResellerModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create reseller account');
    } finally {
      setLoading(false);
    }
  };

  // Add handler for form changes
  const handleNewResellerFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewResellerForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Function to fetch all keys for the current mod
  const fetchKeys = async () => {
    try {
      setLoading(true);
      
      let keys = [];
      
      // If user is an admin/reseller, use getUserKeys to fetch only their keys
      if (currentUser && currentUser.role === 'admin') {
        keys = await getUserKeys(modId);
      } else {
        // For owners, use getModKeys to see all keys
        // Make sure we don't filter out any keys (filterByOwn=false, ownerKeysOnly=false)
        const modKeys = await getModKeys(modId, false, false);
        keys = modKeys;
        
        // If we have keys but keySource is missing, try to infer it from createdBy
        if (Array.isArray(keys) && keys.length > 0) {
          keys = keys.map(key => {
            // If keySource is missing but we have createdBy info, set it based on role
            if (!key.keySource && key.createdBy) {
              return {
                ...key,
                keySource: key.createdBy.role === 'owner' ? 'owner' : 'admin'
              };
            }
            return key;
          });}
      }
      
      // Set the keys in state
      setKeys(keys);
      setFilteredKeys(keys); // Make sure filteredKeys is also set
      
      // Update key stats
      setKeyStats({
        total: keys.length,
        active: keys.filter(key => !isExpired(key.expiresAt) && key.isActive).length,
        expired: keys.filter(key => isExpired(key.expiresAt) || !key.isActive).length
      });
      
      return keys;
    } catch (error) {
      console.error('Error fetching keys:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };
  
  // Add function to fetch user's own keys
  const fetchUserKeys = async () => {
    try {
      // For admins, we'll use strict filtering to ensure they only see their own keys
      const userKeys = await getUserKeys(modId);
      // Log each key's creator for debugging
      if (userKeys && userKeys.length > 0) {
        userKeys.forEach((key, index) => {
          if (key.createdBy) {
            const creatorId = key.createdBy._id;
            const isOwnKey = creatorId === currentUser._id;
          } else {
            // No creator info
          }
        });
      }
      
      if (Array.isArray(userKeys)) {
        // CRITICAL: Always apply strict client-side filtering to ensure admins only see their own keys
        // This ensures admins cannot see keys created by the owner under any circumstances
        const strictlyFilteredKeys = userKeys.filter(key => 
          key.createdBy && key.createdBy._id === currentUser._id
        );
        
        if (strictlyFilteredKeys.length !== userKeys.length) {
          logger.warn(`WARNING: Received ${userKeys.length} keys but only ${strictlyFilteredKeys.length} were created by current user!`);
          logger.warn('This indicates a potential backend filtering issue. Applying strict client-side filtering.');
          logger.warn('Keys that should not be visible to this admin were filtered out.');
        }
        
        // Make absolutely sure we're only setting keys created by the current admin
        if (currentUser.role !== 'owner') {
          const doubleCheckedKeys = strictlyFilteredKeys.filter(key => {
            if (!key.createdBy) return false;
            return key.createdBy._id === currentUser._id;
          });
          
          setKeys(doubleCheckedKeys);
          setFilteredKeys(doubleCheckedKeys); // For admins, filtered keys = their own keys only
        } else {
          setKeys(strictlyFilteredKeys);
          setFilteredKeys(strictlyFilteredKeys);
        }
      } else {
        setKeys([]);
        setFilteredKeys([]);
      }
    } catch (error) {
      console.error('Error details:', error);
      setKeys([]);
      setFilteredKeys([]);
    }
  };
  
  // Use the useEffect with proper cleanup
  useEffect(() => {
    logger.info('ModManagement component mounted/updated for modId:', modId, 'with key:', window.location.pathname);
    let isMounted = true; // Flag to prevent state updates after unmount
    
    // Reset state values first when mounting or changing mods
    setTabValue(0);
    setKeys([]);
    setFilteredKeys([]);
    setResellers([]);
    setFilteredResellers([]);
    setReferralCodes([]);
    setFilteredReferralCodes([]);
    setGeneratedKeys([]);
    setLoading(true); // Start with loading state
    
    const fetchModData = async () => {
      if (!isMounted) return;
      
      try {
        // Use real API calls to fetch data from the database
        const [modDetails, modStats, modResellers, modReferralCodes] = await Promise.all([
          getModDetails(modId),
          getModStats(modId),
          getModResellers(modId),
          getModReferralCodes(modId)
        ]);
        
        if (!isMounted) return;
        
        // Set the fetched data from API with proper type checking
        setStats(modStats || {
          totalKeys: 0,
          activeKeys: 0,
          totalResellers: 0
        });
        
        if (Array.isArray(modResellers)) {
          setResellers(modResellers);
          setFilteredResellers(modResellers); // Initialize filtered resellers
        }
        
        if (Array.isArray(modReferralCodes)) {
          setReferralCodes(modReferralCodes);
          setFilteredReferralCodes(modReferralCodes); // Initialize filtered referral codes
        }
  
        setModData(modDetails || null);
        
        // Add call to fetch keys based on user role
        if (currentUser.role === 'owner' && isMounted) {
          await fetchKeys();
        } else if (isMounted) {
          await fetchUserKeys();
        }
      } catch (error) {
        logger.error('Error fetching mod data:', error);
        if (isMounted) {
        toast.error('Failed to load mod data');
        }
      } finally {
        if (isMounted) {
        setLoading(false);
        }
      }
    };
    
    fetchModData();
    
    // Cleanup function to prevent memory leaks
    return () => {
      logger.info('ModManagement component unmounting for modId:', modId);
      isMounted = false;
    };
  }, [modId]); // Only depend on modId, not location.pathname
  
  // Add another useEffect to periodically refresh referral codes
  useEffect(() => {
    // Only run this effect if we're on the reseller tab (index 0)
    if (tabValue !== 0) return;
    
    const refreshReferralCodes = async () => {
      try {
        const modReferralCodes = await getModReferralCodes(modId);
        if (Array.isArray(modReferralCodes)) {
          // Log the structure of the first code if it exists
          if (modReferralCodes.length > 0) {
            logger.info('Sample referral code object structure:', 
              Object.keys(modReferralCodes[0]).reduce((acc, key) => {
                acc[key] = typeof modReferralCodes[0][key];
                return acc;
              }, {})
            );
          }
          setReferralCodes(modReferralCodes);
          setFilteredReferralCodes(modReferralCodes); // Initialize filtered referral codes
        } else {
          logger.error('Received non-array referral codes:', modReferralCodes);
          setReferralCodes([]);
          setFilteredReferralCodes([]);
        }
      } catch (error) {
        logger.error('Error refreshing referral codes:', error);
      }
    };
    
    // Refresh immediately
    refreshReferralCodes();
    
    // Then refresh every 15 seconds
    const intervalId = setInterval(refreshReferralCodes, 15000);
    
    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, [modId, tabValue]);
  
  // Remove the original useEffect for showOnlyMyKeys that used to filter keys client-side
  
  // Handler for date filters
  const handleResellerDateFilterChange = (event) => {
    const filterValue = event.target.value;
    setResellerDateFilter(filterValue);
    
    if (filterValue === 'custom') {
      // Keep the custom date fields active but don't filter until dates are selected
      return;
    }
    
    filterResellers(filterValue, customResellerStartDate, customResellerEndDate);
  };
  
  const handleReferralDateFilterChange = (event) => {
    const filterValue = event.target.value;
    setReferralDateFilter(filterValue);
    
    // Clear custom dates if not using custom filter
    if (filterValue !== 'custom') {
      setCustomReferralStartDate('');
      setCustomReferralEndDate('');
    }
  };
  
  const handleCustomResellerDateChange = (type, value) => {
    if (type === 'start') {
      setCustomResellerStartDate(value);
      if (customResellerEndDate) {
        filterResellers('custom', value, customResellerEndDate);
      }
    } else {
      setCustomResellerEndDate(value);
      if (customResellerStartDate) {
        filterResellers('custom', customResellerStartDate, value);
      }
    }
  };
  
  const handleCustomReferralDateChange = (type, value) => {
    if (type === 'start') {
      setCustomReferralStartDate(value);
      if (customReferralEndDate) {
        filterReferralCodes('custom', value, customReferralEndDate);
      }
    } else {
      setCustomReferralEndDate(value);
      if (customReferralStartDate) {
        filterReferralCodes('custom', customReferralStartDate, value);
      }
    }
  };
  
  const filterResellers = (filterType, startDate, endDate) => {
    if (!resellers || !resellers.length) return;
    
    if (filterType === 'all') {
      setFilteredResellers(resellers);
      return;
    }
    
    const now = new Date();
    let filterDate = new Date();
    
    switch (filterType) {
      case 'today':
        filterDate.setHours(0, 0, 0, 0);
        break;
      case 'yesterday':
        filterDate.setDate(filterDate.getDate() - 1);
        filterDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        filterDate.setDate(filterDate.getDate() - 7);
        break;
      case 'month':
        filterDate.setMonth(filterDate.getMonth() - 1);
        break;
      case 'custom':
        const startDateTime = new Date(startDate);
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999); // End of the selected day
        
        setFilteredResellers(resellers.filter(reseller => {
          if (!reseller.createdAt) return false;
          const createdDate = new Date(reseller.createdAt);
          return createdDate >= startDateTime && createdDate <= endDateTime;
        }));
        return;
      default:
        setFilteredResellers(resellers);
        return;
    }
    
    setFilteredResellers(resellers.filter(reseller => {
      if (!reseller.createdAt) return false;
      const createdDate = new Date(reseller.createdAt);
      
      if (filterType === 'today' || filterType === 'yesterday') {
        // For today/yesterday, check if the date part matches
        return createdDate.getDate() === filterDate.getDate() && 
               createdDate.getMonth() === filterDate.getMonth() && 
               createdDate.getFullYear() === filterDate.getFullYear();
      }
      
      return createdDate >= filterDate && createdDate <= now;
    }));
  };
  
  // Add function to refresh reseller data
  const handleRefresh = async () => {
    try {
      setResellersLoading(true);
      // Refresh resellers list
      const updatedResellers = await getModResellers(modId);
      setResellers(updatedResellers);
      // Apply current filter
      filterResellers(resellerDateFilter, customResellerStartDate, customResellerEndDate);
      toast.success('Reseller data refreshed');
    } catch (error) {
      toast.error('Failed to refresh reseller data');
      logger.error('Error refreshing reseller data:', error);
    } finally {
      setResellersLoading(false);
    }
  };
  
  const filterReferralCodes = (filterType, startDate, endDate) => {
    if (!referralCodes || !referralCodes.length) return;
    
    if (filterType === 'all') {
      setFilteredReferralCodes(referralCodes);
      return;
    }
    
    const now = new Date();
    let filterDate = new Date();
    
    switch (filterType) {
      case 'today':
        filterDate.setHours(0, 0, 0, 0);
        break;
      case 'yesterday':
        filterDate.setDate(filterDate.getDate() - 1);
        filterDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        filterDate.setDate(filterDate.getDate() - 7);
        break;
      case 'month':
        filterDate.setMonth(filterDate.getMonth() - 1);
        break;
      case 'custom':
        const startDateTime = new Date(startDate);
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999); // End of the selected day
        
        setFilteredReferralCodes(referralCodes.filter(code => {
          if (!code.createdAt) return false;
          const createdDate = new Date(code.createdAt);
          return createdDate >= startDateTime && createdDate <= endDateTime;
        }));
        return;
      default:
        setFilteredReferralCodes(referralCodes);
        return;
    }
    
    setFilteredReferralCodes(referralCodes.filter(code => {
      if (!code.createdAt) return false;
      const createdDate = new Date(code.createdAt);
      
      if (filterType === 'today' || filterType === 'yesterday') {
        // For today/yesterday, check if the date part matches
        return createdDate.getDate() === filterDate.getDate() && 
               createdDate.getMonth() === filterDate.getMonth() && 
               createdDate.getFullYear() === filterDate.getFullYear();
      }
      
      return createdDate >= filterDate && createdDate <= now;
    }));
  };
  
  // Additional useEffect to update filtered data when date filter or data changes
  useEffect(() => {
    filterResellers(resellerDateFilter, customResellerStartDate, customResellerEndDate);
    
  }, [resellers, resellerDateFilter, customResellerStartDate, customResellerEndDate]);
  
  // Update filtered referral codes when referral date filter changes
  useEffect(() => {
    filterReferralCodes(referralDateFilter, customReferralStartDate, customReferralEndDate);
    
  }, [referralCodes, referralDateFilter, customReferralStartDate, customReferralEndDate]);
  
  // Update filtered keys when key date filter changes
  useEffect(() => {
    filterKeys(keyDateFilter, customKeyStartDate, customKeyEndDate);
    
  }, [keys, keyDateFilter, customKeyStartDate, customKeyEndDate]);
  
  // When component loads, fetch data
  useEffect(() => {
    // Add this new function to fetch only the user's generated keys for the "Recent Keys" section
    const fetchGeneratedKeys = async () => {
      try {
        if (currentUser.role === 'admin') {
          // For admin/reseller users, get only their keys
          const userKeys = await getUserKeys(modId);
          if (Array.isArray(userKeys)) {
            // Filter keys to ensure they are created by the current user
            const ownKeys = userKeys.filter(key => 
              key.createdBy && key.createdBy._id === currentUser._id
            );
            
            // Sort by creation date, newest first
            ownKeys.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            
            // Set to generatedKeys state for display in the Recent Keys section
            setGeneratedKeys(ownKeys);}
        } else if (currentUser.role === 'owner') {
          // For owner users, get their keys too for the Recent Keys section
          const ownerKeys = await getModKeys(modId, true, false); // filterByOwn=true to get owner's keys only
          if (Array.isArray(ownerKeys)) {
            // Sort by creation date, newest first (take most recent 5)
            const sortedKeys = ownerKeys
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .slice(0, 5);
              
            setGeneratedKeys(sortedKeys);}
        }
      } catch (error) {
        logger.error('Error fetching generated keys:', error);
      }
    };
    
    // Call the function
    fetchGeneratedKeys();
    
    // ... rest of useEffect code ...
  }, [modId, currentUser._id, currentUser.role]);
  
  // Add filter function that will be used in the render method
  const getFilteredKeysList = () => {
    const filteredList = filteredKeys.filter(key => {
      // If admin, only show keys created by current user
      if (currentUser.role !== 'owner') {
        return key.createdBy && key.createdBy._id === currentUser._id;
      }
      
      // For owners, show all keys without filtering by type
      return true;
    });return filteredList;
  };
  
  // Filter keys based on date
  const filterKeys = (dateFilter, startDate, endDate) => {
    if (!dateFilter || dateFilter === 'all') {
      setFilteredKeys(keys);
      return;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let filtered = [];
    
    switch (dateFilter) {
      case 'today':
        filtered = keys.filter(key => {
          const createdDate = new Date(key.createdAt);
          return createdDate >= today && createdDate < tomorrow;
        });
        break;
      case 'yesterday':
        filtered = keys.filter(key => {
          const createdDate = new Date(key.createdAt);
          return createdDate >= yesterday && createdDate < today;
        });
        break;
      case 'custom':
        if (startDate && endDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          
          filtered = keys.filter(key => {
            const createdDate = new Date(key.createdAt);
            return createdDate >= start && createdDate <= end;
          });
        } else {
          filtered = keys;
        }
        break;
      default:
        filtered = keys;
    }
    
    setFilteredKeys(filtered);
  };
  
  // Handle date filter changes
  const handleKeyDateFilterChange = (event) => {
    const filterValue = event.target.value;
    setKeyDateFilter(filterValue);
    
    // Clear custom dates if not using custom filter
    if (filterValue !== 'custom') {
      setCustomKeyStartDate('');
      setCustomKeyEndDate('');
    }
  };
  
  // Toggle card expansion functions
  const toggleResellerCard = () => {
    setExpandedResellerCard(prev => !prev);
  };
  
  const toggleReferralCard = () => {
    setExpandedReferralCard(prev => !prev);
  };
  
  // Add handler functions for key deletion
  const handleOpenDeleteKeyDialog = (key) => {
    setKeyToDelete(key);
    setDeleteKeyDialogOpen(true);
  };
  
  const handleCloseDeleteKeyDialog = () => {
    setDeleteKeyDialogOpen(false);
    setKeyToDelete(null);
  };
  
  const handleDeleteKey = async () => {
    if (!keyToDelete) return;
    
    try {
      setDeleteKeyLoading(true);
      const response = await deleteKey(keyToDelete._id);
      
      if (response.success) {
        // Clear existing keys before refreshing
        setKeys([]);
        setFilteredKeys([]);
        
        // Refresh keys based on user role
        if (currentUser.role === 'owner') {
          await fetchKeys();
        } else {
          // Ensure admins only see their own keys
          await fetchUserKeys();
        }
        
        toast.success('Key deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting key:', error);
      toast.error(error.response?.data?.message || 'Failed to delete key');
    } finally {
      setDeleteKeyLoading(false);
      handleCloseDeleteKeyDialog();
    }
  };
  
  // Handlers for edit key dialog
  const handleOpenEditKeyDialog = (key) => {
    setKeyToEdit(key);
    setEditKeyDialogOpen(true);
  };
  
  const handleCloseEditKeyDialog = () => {
    setEditKeyDialogOpen(false);
    setKeyToEdit(null);
    setKeyExtensionDays(30);
  };
  
  const handleKeyExtensionDaysChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d+$/.test(value)) {
      setKeyExtensionDays(value === '' ? '' : parseInt(value));
    }
  };

  const handleExtendKeyExpiry = async () => {
    if (!keyToEdit) return;
    
    try {
      setEditKeyLoading(true);// Helper function to try multiple endpoints
      const tryEndpoints = async () => {
        const endpoints = [
          `${API_URL}/mods/${modId}/keys/${keyToEdit._id}/extend`, // Try mod-specific endpoint first
          `${API_URL}/keys/${keyToEdit._id}/extend`,                // Try direct keys endpoint
          `${API_URL}/keys/extend/${keyToEdit._id}`                 // Try alternative pattern
        ];
        
        const methods = ['PATCH', 'POST']; // Try PATCH first, then POST
        
        let lastError = null;
        
        // Try each endpoint with each method
        for (const endpoint of endpoints) {
          for (const method of methods) {
            try {
              const response = await axios({
                method,
                url: endpoint,
                data: { days: parseInt(keyExtensionDays) },
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
              });
              return response; // Return on first success
            } catch (error) {
              lastError = error;
              // Continue to next endpoint/method
            }
          }
        }
        
        // If we get here, all attempts failed
        throw lastError;
      };
      
      // Try all endpoint patterns
      const response = await tryEndpoints();
      
      // Calculate and display the new expiry date
      const currentExpiryDate = new Date(keyToEdit.expiresAt);
      const newExpiryDate = new Date(currentExpiryDate);
      newExpiryDate.setDate(newExpiryDate.getDate() + parseInt(keyExtensionDays));
      
      toast.success(`Key expiry extended by ${keyExtensionDays} days to ${newExpiryDate.toLocaleDateString()}`);
      
      // Refresh keys
      if (currentUser.role === 'owner') {
        await fetchKeys();
      } else {
        await fetchUserKeys();
      }
    } catch (error) {
      logger.error('Error extending key expiry after trying all endpoints:', error.response?.data || error.message);
      toast.error('Failed to extend key expiry. The API endpoint might not be implemented.');
    } finally {
      setEditKeyLoading(false);
      handleCloseEditKeyDialog();
    }
  };
  
  // Handler for bulk actions like extending all expiry dates
  const handleBulkAction = async (action) => {
    // Open confirmation dialog instead of executing immediately
    setPendingBulkAction(action);
    setBulkActionDialogOpen(true);
  };
  
  // Execute bulk action after confirmation
  const executeBulkAction = async () => {
    if (!pendingBulkAction) return;
    
    if (pendingBulkAction === 'extend') {
      try {
        setBulkActionLoading(true);
        const days = parseInt(extensionDays);
        
        if (isNaN(days) || days < 1) {
          toast.error('Please enter a valid number of days');
          setBulkActionLoading(false);
          return;
        }
        
        const response = await extendAllModBalanceExpiry(modId, days);
        if (response.success) {
          toast.success(`Extended all reseller expiry dates by ${days} days`);
          
          // Instead of filtering with selectedResellerIds, update all resellers
          setResellers(prevResellers => 
            prevResellers.map(reseller => {
              // Calculate new expiry date
              let newExpiryDate;
              
              if (reseller.expiryDate && reseller.expiryDate !== 'No expiry') {
                // Parse the existing date and add days
                const currentDate = new Date(reseller.expiryDate);
                if (!isNaN(currentDate.getTime())) {
                  newExpiryDate = new Date(currentDate);
                  newExpiryDate.setDate(newExpiryDate.getDate() + days);
                } else {
                  // If current date is invalid, set from today
                  newExpiryDate = new Date();
                  newExpiryDate.setDate(newExpiryDate.getDate() + days);
                }
              } else {
                // If no existing date, set from today
                newExpiryDate = new Date();
                newExpiryDate.setDate(newExpiryDate.getDate() + days);
              }
              
              // Format the new date
              const formattedDate = newExpiryDate.toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short',
                year: '2-digit'
              });
              return {
                ...reseller,
                expiryDate: formattedDate
              };
            })
          );
        } else {
          toast.error(response.message || 'Failed to extend expiry dates');
        }
      } catch (error) {
        logger.error('Error performing bulk action:', error);
        toast.error(error.response?.data?.message || 'Failed to perform bulk action');
      } finally {
        setBulkActionLoading(false);
        setBulkActionDialogOpen(false);
        setPendingBulkAction(null);
      }
    }
  };
  
  // Cancel bulk action
  const cancelBulkAction = () => {
    setBulkActionDialogOpen(false);
    setPendingBulkAction(null);
  };
  
  // Handle extension days input change
  const handleExtensionDaysChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d+$/.test(value)) {
      setExtensionDays(value === '' ? '' : parseInt(value));
    }
  };
  
  // Update handleGenerateKey to fix the keyMaxDevices value and handle inactive account errors
  const handleGenerateKey = async () => {
    // Check if user is inactive
    const isAccountActive = currentUser?.active !== false;
    if (currentUser?.role === 'admin' && !isAccountActive) {
      toast.error('Your account has been deactivated. Please contact the owner for assistance.');
      return;
    }
    
    try {
      setKeyGenLoading(true);
      
      // Ensure values are valid numbers without using logical OR which causes issues with single digits
      let numDuration = Number(keyDuration);
      if (isNaN(numDuration) || numDuration <= 0) {
        numDuration = 30; // Default to 30 if invalid
      }
      
      let numAmount = Number(keyGenAmount);
      if (isNaN(numAmount) || numAmount <= 0) {
        numAmount = 1; // Default to 1 if invalid
      }
      
      logger.info("Using keyGenAmount:", numAmount, "Type:", typeof numAmount);
      
      // Validate input
      if (numDuration <= 0 && !keyUnlimited) {
        toast.error('Duration must be greater than 0');
        setKeyGenLoading(false);
        return;
      }
      
      // Fix maxDevices to always be 1
      const maxDevicesValue = 1;
      
      // Call API to generate keys
      const result = await generateModKeys(
        modId,
        numAmount,
        keyUnlimited ? 365 : numDuration, // Use a year for unlimited keys
        keyUnlimited,
        maxDevicesValue // Always use 1 here
      );
      
      if (result.success) {
        // Add newly generated keys to the state
        setGeneratedKeys(result.keys);
        
        // Clear any existing keys first before reloading to prevent mixing
        setKeys([]);
        setFilteredKeys([]);
        
        // Reload all keys from the database based on user role
        if (currentUser.role === 'owner') {
          await fetchKeys();
        } else {
          // Admins should only see their own keys
          await fetchUserKeys();
        }
        
        // Close the modal
        setShowKeyGenModal(false);
        
        // Show success message
        toast.success(`Generated ${keyGenAmount} key(s) successfully`);
        
        // Reset form
        setKeyGenAmount(1);
        setKeyDuration(30);
        setKeyUnlimited(false);
        // No need to update keyMaxDevices anymore
      }
    } catch (error) {
      logger.error('Key generation error:', error);
      
      // Check for inactive account error
      if (error.response?.status === 403 && error.response?.data?.message?.includes('deactivated')) {
        toast.error('Your account has been deactivated. Please contact the owner for assistance.');
      } else {
      toast.error(error.response?.data?.message || 'Failed to generate keys');
      }
    } finally {
      setKeyGenLoading(false);
    }
  };
  
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '70vh'
        }}>
          <CircularProgress sx={{ color: modTemplate.color }} />
          <Typography sx={{ mt: 2, color: '#fff' }}>
            Loading {modTemplate.name} management...
          </Typography>
        </Box>
      </Container>
    );
  }
  
  return (
    <Layout title={`${modTemplate.name} Management`}>
      <Box sx={{ 
        p: { xs: 1.5, sm: 2, md: 3 },
        maxWidth: '100%',
        overflowX: 'hidden'
      }}>
        {/* Page Header */}
        <Box sx={{ 
          flexDirection: { xs: 'column', sm: 'row' }, 
          alignItems: { xs: 'center', sm: 'flex-start' },
          mb: { xs: 3, sm: 4 },
          p: { xs: 2, sm: 3 },
          borderRadius: { xs: '10px', sm: '12px' },
          background: 'linear-gradient(135deg, rgba(16,16,26,0.9) 0%, rgba(16,16,26,0.8) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
          display: 'flex',
          gap: { xs: 2, sm: 3 },
          transition: 'all 0.3s ease',
        }}>
          <Box sx={{ 
            mb: { xs: 1, sm: 0 },
            display: 'flex',
            justifyContent: { xs: 'center', sm: 'flex-start' }
          }}>
            {React.cloneElement(modTemplate.icon, { 
              sx: { 
                fontSize: { xs: '2.5rem', sm: '3rem' },
                filter: 'drop-shadow(0 0 15px rgba(33,150,243,0.3))',
                transition: 'all 0.3s ease',
                color: modTemplate.color || 'primary.main'
              } 
            })}
          </Box>
          <Box sx={{ 
            textAlign: { xs: 'center', sm: 'left' },
            width: '100%'
          }}>
            <Typography 
              variant="h1" 
              sx={{ 
                fontSize: { xs: '1.5rem', sm: '1.8rem', md: '2.2rem' },
                fontWeight: 700,
                mb: { xs: 0.5, sm: 1 },
                background: `linear-gradient(90deg, ${modTemplate.color || '#03a9f4'}, #81d4fa)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}
            >
              {modTemplate.name} Management
            </Typography>
            <Typography 
              sx={{ 
                fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' },
                color: 'text.secondary',
                maxWidth: '700px'
              }}
            >
              {modTemplate.description}
            </Typography>
          </Box>
        </Box>
        
        {/* Mod-specific stats */}
        <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 3, sm: 4 } }}>
          <Grid item xs={12}>
        <StatsSummary stats={stats} />
          </Grid>
        </Grid>
        
        {/* Tabs Navigation */}
        <Box sx={{ 
          mb: { xs: 2, sm: 3 },
          borderRadius: { xs: '8px', sm: '10px' },
          overflow: 'hidden',
          background: 'rgba(16,16,26,0.6)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            aria-label="mod management tabs"
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            TabIndicatorProps={{
              style: { 
                background: `linear-gradient(90deg, ${modTemplate.color || '#03a9f4'}, #81d4fa)`,
                height: 3
              }
            }}
            sx={{
              '& .MuiTabs-scrollButtons': {
                color: 'rgba(255, 255, 255, 0.5)'
              },
              '& .MuiTabs-scrollButtons.Mui-disabled': {
                opacity: 0.3
              },
              minHeight: { xs: '48px', sm: '56px' }
            }}
          >
            <Tab 
              icon={<PeopleIcon sx={{ fontSize: { xs: '1.3rem', sm: '1.5rem' } }} />} 
              label="Reseller Balances" 
              iconPosition="start" 
              sx={{
                textTransform: 'none',
                minHeight: { xs: '48px', sm: '56px' },
                fontSize: { xs: '0.85rem', sm: '0.95rem' },
                fontWeight: 500,
                opacity: 0.7,
                '&.Mui-selected': {
                  color: modTemplate.color || 'primary.main',
                  opacity: 1
                },
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  opacity: 1
                },
                '& .MuiSvgIcon-root': {
                  mr: { xs: 0.5, sm: 1 }
                }
              }}
              disableRipple
            />
            <Tab 
              icon={<KeyIcon sx={{ fontSize: { xs: '1.3rem', sm: '1.5rem' } }} />} 
              label="Key Management" 
              iconPosition="start" 
              sx={{
                textTransform: 'none',
                minHeight: { xs: '48px', sm: '56px' },
                fontSize: { xs: '0.85rem', sm: '0.95rem' },
                fontWeight: 500,
                opacity: 0.7,
                '&.Mui-selected': {
                  color: modTemplate.color || 'primary.main',
                  opacity: 1
                },
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  opacity: 1
                },
                '& .MuiSvgIcon-root': {
                  mr: { xs: 0.5, sm: 1 }
                }
              }}
              disableRipple
            />
          </Tabs>
        </Box>
        
        {/* Tab Content */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={{ xs: 2, sm: 3 }}>
            {/* Quick Actions Card */}
            <Grid item xs={12} md={4} lg={3}>
              <Card sx={{ 
                height: '100%',
                borderRadius: { xs: '10px', sm: '12px' },
                background: 'rgba(16,16,26,0.6)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.06)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '3px',
                  background: `linear-gradient(90deg, ${modTemplate.color || '#03a9f4'}, #81d4fa)`
                },
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.25)'
                }
              }}>
                <CardHeader 
                  title={
                    <Typography 
                      variant="h6" 
                      sx={{
                        fontSize: { xs: '1.1rem', sm: '1.2rem' },
                        fontWeight: 600,
                        color: modTemplate.color || 'primary.main'
                      }}
                    >
                      Quick Actions
                    </Typography>
                  }
                  sx={{
                    p: { xs: 2, sm: 2.5 },
                    borderBottom: '1px solid rgba(255,255,255,0.06)'
                  }}
                />
                <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                  <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                    <Grid item xs={12} sm={6} md={12}>
                    <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<KeyIcon />}
                        onClick={() => {
                          setShowKeyGenModal(true);}}
                      sx={{
                          py: { xs: 1, sm: 1.25 },
                          textTransform: 'none',
                          fontWeight: 500,
                          fontSize: { xs: '0.85rem', sm: '0.9rem' },
                          borderRadius: '8px',
                          borderColor: 'rgba(255, 255, 255, 0.1)',
                          color: modTemplate.color || 'primary.main',
                          '&:hover': {
                            borderColor: modTemplate.color || 'primary.main',
                            backgroundColor: 'rgba(3, 169, 244, 0.05)'
                          }
                        }}
                      >
                        Generate Key
                    </Button>
                    </Grid>
                    <Grid item xs={12} sm={6} md={12}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => {
                          setShowReferralModal(true);
                          setDeductionRates({
                            day1: 100,
                            day3: 150,
                            day7: 200,
                            day15: 300,
                            day30: 500,
                            day60: 800
                          });
                        }}
                        sx={{
                          py: { xs: 1, sm: 1.25 },
                          textTransform: 'none',
                          fontWeight: 500,
                          fontSize: { xs: '0.85rem', sm: '0.9rem' },
                          borderRadius: '8px',
                          borderColor: 'rgba(255, 255, 255, 0.1)',
                          color: modTemplate.color || 'primary.main',
                          '&:hover': {
                            borderColor: modTemplate.color || 'primary.main',
                            backgroundColor: 'rgba(3, 169, 244, 0.05)'
                          }
                        }}
                      >
                        Create Referral Code
                    </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Reseller Management Card */}
            <Grid item xs={12} md={8} lg={9}>
              <Card sx={{ 
                borderRadius: { xs: '10px', sm: '12px' },
                background: 'rgba(16,16,26,0.6)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.06)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '3px',
                  background: `linear-gradient(90deg, ${modTemplate.color || '#03a9f4'}, #81d4fa)`
                }
              }}>
                <CardHeader
                  title={
                    <Typography 
                      variant="h6" 
                      sx={{
                        fontSize: { xs: '1.1rem', sm: '1.2rem' },
                        fontWeight: 600,
                        color: modTemplate.color || 'primary.main'
                      }}
                    >
                      Reseller Management
                    </Typography>
                  }
                  action={
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <FormControl size="small" sx={{ width: { xs: 150, sm: 180 } }}>
                      <Select
                        value={resellerDateFilter}
                        onChange={handleResellerDateFilterChange}
                            className={styles.selectInput}
                            variant="outlined"
                        displayEmpty
                          sx={{ 
                            bgcolor: 'rgba(0,0,0,0.15)', 
                            borderRadius: '8px',
                            fontSize: { xs: '0.85rem', sm: '0.9rem' },
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'rgba(255,255,255,0.1)'
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'rgba(255,255,255,0.2)'
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: modTemplate.color || 'primary.main'
                            }
                          }}
                          startAdornment={
                            <InputAdornment position="start">
                              <CalendarTodayIcon sx={{ fontSize: '1.1rem', color: 'text.secondary' }} />
                            </InputAdornment>
                          }
                            MenuProps={{
                              PaperProps: {
                                style: {
                                  backgroundColor: 'rgb(30, 30, 40)',
                                  borderRadius: '8px',
                                  boxShadow: '0 8px 16px rgba(0, 0, 0, 0.25)',
                                border: '1px solid rgba(255,255,255,0.05)'
                                }
                          }
                        }}
                      >
                        <MenuItem value="all">All Time</MenuItem>
                        <MenuItem value="today">Today</MenuItem>
                        <MenuItem value="yesterday">Yesterday</MenuItem>
                          <MenuItem value="week">This Week</MenuItem>
                          <MenuItem value="month">This Month</MenuItem>
                          <MenuItem value="custom">Custom Range</MenuItem>
                      </Select>
                    </FormControl>
                      <IconButton 
                        onClick={handleRefresh}
                        sx={{
                          color: 'text.secondary',
                          bgcolor: 'rgba(0,0,0,0.15)',
                          borderRadius: '8px',
                          '&:hover': {
                            bgcolor: 'rgba(0,0,0,0.25)',
                            color: modTemplate.color || 'primary.main'
                          }
                        }}
                      >
                        <RefreshIcon />
                      </IconButton>
                    </Box>
                  }
                  sx={{
                    p: { xs: 2, sm: 2.5 },
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: { xs: 1.5, sm: 0 }
                  }}
                />
                
                {/* Custom date range selector - visible only when 'custom' is selected */}
                    {resellerDateFilter === 'custom' && (
                  <Box sx={{ 
                    px: 2, 
                    pb: 1.5, 
                    pt: 1.5, 
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: 2,
                    alignItems: { xs: 'stretch', sm: 'center' }
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EventIcon sx={{ color: 'text.secondary', fontSize: '1.1rem' }} />
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                        Custom date range:
                      </Typography>
                    </Box>
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: { xs: 'column', sm: 'row' }, 
                      gap: 2,
                      flex: 1
                    }}>
                        <TextField
                          type="date"
                          size="small"
                          label="Start Date"
                          value={customResellerStartDate}
                          onChange={(e) => handleCustomResellerDateChange('start', e.target.value)}
                              variant="outlined"
                              className={styles.textField}
                          InputLabelProps={{ shrink: true }}
                              inputProps={{
                                style: { color: '#fff' }
                              }}
                          sx={{ 
                            width: { xs: '100%', sm: '180px' },
                            bgcolor: 'rgba(0,0,0,0.1)',
                            borderRadius: '8px'
                          }}
                        />
                        <TextField
                          type="date"
                          size="small"
                          label="End Date"
                          value={customResellerEndDate}
                          onChange={(e) => handleCustomResellerDateChange('end', e.target.value)}
                              variant="outlined"
                              className={styles.textField}
                          InputLabelProps={{ shrink: true }}
                              inputProps={{
                                style: { color: '#fff' }
                              }}
                          sx={{ 
                            width: { xs: '100%', sm: '180px' },
                            bgcolor: 'rgba(0,0,0,0.1)',
                            borderRadius: '8px'
                          }}
                        />
                      </Box>
                  </Box>
                )}
                  
                <CardContent sx={{ p: 0 }}>
                  <Box sx={{ overflowX: 'auto', width: '100%' }}>
                    <Table sx={{ minWidth: { xs: 600, md: 800 } }}>
                      <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.2)' }}>
                        <TableRow>
                          <TableCell 
                            sx={{ 
                              py: { xs: 1.5, sm: 2 }, 
                              fontSize: { xs: '0.85rem', sm: '0.9rem' },
                              fontWeight: 600,
                              color: 'text.primary',
                              borderBottom: '1px solid rgba(255,255,255,0.08)'
                            }}
                          >
                            Username
                          </TableCell>
                          <TableCell 
                            sx={{ 
                              py: { xs: 1.5, sm: 2 }, 
                              fontSize: { xs: '0.85rem', sm: '0.9rem' },
                              fontWeight: 600,
                              color: 'text.primary',
                              borderBottom: '1px solid rgba(255,255,255,0.08)'
                            }}
                          >
                            Balance
                          </TableCell>
                          <TableCell 
                            sx={{ 
                              py: { xs: 1.5, sm: 2 }, 
                              fontSize: { xs: '0.85rem', sm: '0.9rem' },
                              fontWeight: 600,
                              color: 'text.primary',
                              borderBottom: '1px solid rgba(255,255,255,0.08)',
                              display: { xs: 'table-cell', md: 'table-cell' }
                            }}
                          >
                            Expiry
                          </TableCell>
                          <TableCell 
                            sx={{ 
                              py: { xs: 1.5, sm: 2 }, 
                              fontSize: { xs: '0.85rem', sm: '0.9rem' },
                              fontWeight: 600,
                              color: 'text.primary',
                              borderBottom: '1px solid rgba(255,255,255,0.08)',
                              display: { xs: 'table-cell', md: 'table-cell' }
                            }}
                          >
                            Registered
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {resellersLoading ? (
                          <TableRow>
                            <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                              <CircularProgress size={40} />
                              </TableCell>
                          </TableRow>
                        ) : filteredResellers.length > 0 ? (
                          filteredResellers.map((reseller) => {
                            const isExpired = new Date(reseller.expiryDate || reseller.expiresAt) < new Date();
                            return (
                              <TableRow 
                                key={reseller.id}
                                    sx={{
                                  '&:hover': { 
                                    bgcolor: 'rgba(255,255,255,0.03)' 
                                  },
                                  transition: 'background-color 0.2s ease',
                                  cursor: 'default'
                                }}
                                // onClick={() => handleResellerClick(reseller)}
                              >
                                <TableCell 
                                  sx={{ 
                                    py: { xs: 1.5, sm: 2 },
                                    fontSize: { xs: '0.85rem', sm: '0.9rem' },
                                    borderBottom: '1px solid rgba(255,255,255,0.03)'
                                  }}
                                >
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Avatar 
                                      sx={{ 
                                        width: { xs: 30, sm: 35 }, 
                                        height: { xs: 30, sm: 35 }, 
                                        bgcolor: isExpired ? 'error.dark' : modTemplate.color || 'primary.main',
                                        fontSize: { xs: '0.9rem', sm: '1rem' }
                                      }}
                                    >
                                      {reseller.username.charAt(0).toUpperCase()}
                                    </Avatar>
                                    <Box>
                                      <Typography 
                                        variant="body2" 
                                        sx={{ 
                                          fontWeight: 500,
                                          fontSize: { xs: '0.85rem', sm: '0.9rem' },
                                          color: isExpired ? 'text.disabled' : 'text.primary',
                                          textDecoration: isExpired ? 'line-through' : 'none'
                                        }}
                                      >
                                        {reseller.username}
                                      </Typography>
                                      
                                      {/* Mobile view: Expiry date shown here for xs and sm screens - hidden now */}
                                      <Box sx={{ 
                                        display: { xs: 'none', md: 'none' }, 
                                        alignItems: 'center', 
                                        mt: 0.5,
                                        backgroundColor: isExpired ? 'rgba(244, 67, 54, 0.08)' : 'rgba(33, 150, 243, 0.08)',
                                        borderRadius: '4px',
                                        py: 0.5,
                                        px: 0.75
                                      }}>
                                        <AccessTimeIcon 
                                          sx={{ 
                                            fontSize: '0.85rem', 
                                            color: isExpired ? 'error.main' : 'primary.main',
                                            mr: 0.5
                                          }} 
                                        />
                                        <Typography 
                                          variant="caption" 
                                          sx={{ 
                                            fontSize: '0.75rem',
                                            fontWeight: 500,
                                            color: isExpired ? 'error.main' : 'primary.main'
                                          }}
                                          title={formatDetailedDate(reseller.expiryDate || reseller.expiresAt)}
                                        >
                                          Exp: {formatDate(reseller.expiryDate || reseller.expiresAt)}
                                        </Typography>
                                      </Box>
                                    </Box>
                                  </Box>
                              </TableCell>
                                
                                <TableCell 
                                  sx={{ 
                                    py: { xs: 1.5, sm: 2 },
                                    fontSize: { xs: '0.85rem', sm: '0.9rem' },
                                    borderBottom: '1px solid rgba(255,255,255,0.03)'
                                  }}
                                >
                                  {reseller.balance === -1 ? (
                                    <Chip 
                                      label="Unlimited" 
                                      size="small" 
                                  sx={{
                                        bgcolor: 'rgba(76, 175, 80, 0.15)',
                                        color: '#4caf50',
                                        fontSize: '0.75rem',
                                        height: 24,
                                        '.MuiChip-label': { px: 1 }
                                      }}
                                    />
                                  ) : reseller.balance === 0 ? (
                                    <Chip 
                                      label="Finished" 
                                      size="small" 
                                    sx={{
                                        bgcolor: 'rgba(244, 67, 54, 0.15)',
                                        color: '#f44336',
                                        fontSize: '0.75rem',
                                        height: 24,
                                        '.MuiChip-label': { px: 1 }
                                      }}
                                    />
                                  ) : reseller.balance < 300 ? (
                                    <Chip 
                                      label={`Low (${reseller.balance})`}
                                      size="small" 
                                      sx={{ 
                                        bgcolor: 'rgba(255, 152, 0, 0.15)',
                                        color: '#ff9800',
                                        fontSize: '0.75rem',
                                        height: 24,
                                        '.MuiChip-label': { px: 1 }
                                      }}
                                    />
                                  ) : (
                                    <Chip 
                                      label={`Available (${reseller.balance})`}
                                      size="small" 
                                      sx={{ 
                                        bgcolor: 'rgba(33, 150, 243, 0.15)',
                                        color: '#2196f3',
                                        fontSize: '0.75rem',
                                        height: 24,
                                        '.MuiChip-label': { px: 1 }
                                      }}
                                    />
                                  )}
                                  
                                  {/* Mobile view: Registration date shown here for xs and sm screens - hidden now */}
                                  <Box sx={{ 
                                    display: { xs: 'none', md: 'none' }, 
                                    alignItems: 'center', 
                                    mt: 1,
                                    backgroundColor: 'rgba(76, 175, 80, 0.08)',
                                    borderRadius: '4px',
                                    py: 0.5,
                                    px: 0.75
                                  }}>
                                    <EventIcon 
                                      sx={{ 
                                        fontSize: '0.85rem', 
                                        color: 'success.main',
                                        mr: 0.5
                                      }} 
                                    />
                                    <Typography 
                                      variant="caption" 
                                      sx={{ 
                                        fontSize: '0.75rem',
                                        fontWeight: 500,
                                        color: 'success.main'
                                      }}
                                      title={formatDetailedDate(reseller.createdAt)}
                                    >
                                      Reg: {formatDate(reseller.createdAt)}
                                    </Typography>
                                </Box>
                              </TableCell>
                                
                                <TableCell 
                                  sx={{ 
                                    py: { xs: 1.5, sm: 2 },
                                    fontSize: { xs: '0.85rem', sm: '0.9rem' },
                                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                                    display: { xs: 'table-cell', md: 'table-cell' }
                                  }}
                                >
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <AccessTimeIcon 
                                      sx={{ 
                                        fontSize: '1rem', 
                                        color: isExpired ? 'error.main' : 'text.secondary' 
                                      }} 
                                    />
                                    <Typography sx={{ color: isExpired ? 'error.main' : 'text.primary' }}
                                      title={formatDetailedDate(reseller.expiryDate || reseller.expiresAt)}
                                    >
                                      {formatDate(reseller.expiryDate || reseller.expiresAt)}
                                    </Typography>
                                </Box>
                              </TableCell>
                                
                                <TableCell 
                                  sx={{ 
                                    py: { xs: 1.5, sm: 2 },
                                    fontSize: { xs: '0.85rem', sm: '0.9rem' },
                                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                                    display: { xs: 'table-cell', md: 'table-cell' }
                                  }}
                                >
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <EventIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                                    <Typography
                                      title={formatDetailedDate(reseller.createdAt)}
                                    >
                                    {formatDate(reseller.createdAt)}
                                    </Typography>
                                </Box>
                              </TableCell>
                              {/* Actions column removed */}
                            </TableRow>
                            );
                          })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                <GroupOffIcon sx={{ fontSize: '2.5rem', color: 'text.disabled' }} />
                                <Typography sx={{ color: 'text.secondary' }}>
                                  No resellers found
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                                  {resellerDateFilter !== 'all' ? 'Try a different date filter' : 'Create a new reseller to get started'}
                                  </Typography>
                                </Box>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                    </Box>
                </CardContent>
              </Card>
          </Grid>
          
            {/* Active Referral Codes Card */}
            <Grid item xs={12}>
              <Card className={styles.card}>
                <CardHeader 
                  title={
                    <Typography variant="h6" className={styles.cardTitle}>
                      <KeyIcon className={styles.cardIcon} sx={{ mr: 1.5 }} />
                      Active Referral Codes
                    </Typography>
                  }
                  className={styles.cardHeader}
                  action={
                    <IconButton 
                      onClick={toggleReferralCard} 
                      className={styles.actionButton}
                    >
                      {expandedReferralCard ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  }
                />
                <Collapse in={expandedReferralCard} timeout="auto" unmountOnExit>
                  <CardContent className={styles.cardContent}>
                    {/* Date filter controls for referral codes */}
                    <Box className={styles.dateFilter} sx={{
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: { xs: 'flex-start', sm: 'center' },
                      gap: { xs: 1, sm: 2 }
                    }}>
                      <Box className={styles.dateFilterItem}>
                        <CalendarTodayIcon className={styles.dateFilterIcon} />
                        <Typography variant="body2" className={styles.dateFilterText}>
                        Filter by creation date:
                      </Typography>
                    </Box>
                      <Box className={styles.dateFilterCustom} sx={{
                        flexDirection: { xs: 'column', md: 'row' },
                        width: { xs: '100%', sm: 'auto' },
                        gap: { xs: 1, md: 2 }
                      }}>
                        <FormControl size="small" sx={{ width: { xs: '100%', md: 'auto' } }}>
                      <Select
                        value={referralDateFilter}
                        onChange={handleReferralDateFilterChange}
                            className={styles.selectInput}
                            variant="outlined"
                        displayEmpty
                            MenuProps={{
                              PaperProps: {
                                style: {
                                  backgroundColor: 'rgb(30, 30, 40)',
                                  borderRadius: '8px',
                                  boxShadow: '0 8px 16px rgba(0, 0, 0, 0.25)',
                                  border: '1px solid rgba(255, 255, 255, 0.05)'
                                }
                          }
                        }}
                      >
                        <MenuItem value="all">All Time</MenuItem>
                        <MenuItem value="today">Today</MenuItem>
                        <MenuItem value="yesterday">Yesterday</MenuItem>
                        <MenuItem value="week">This Week</MenuItem>
                        <MenuItem value="month">This Month</MenuItem>
                        <MenuItem value="custom">Custom Range</MenuItem>
                      </Select>
                    </FormControl>
                    {referralDateFilter === 'custom' && (
                          <>
                        <TextField
                          type="date"
                          size="small"
                          value={customReferralStartDate}
                          onChange={(e) => handleCustomReferralDateChange('start', e.target.value)}
                              variant="outlined"
                              className={styles.textField}
                          InputLabelProps={{ shrink: true }}
                              inputProps={{
                                style: { color: '#fff' }
                              }}
                              sx={{ width: { xs: '100%', md: 'auto' } }}
                        />
                        <TextField
                          type="date"
                          size="small"
                          value={customReferralEndDate}
                          onChange={(e) => handleCustomReferralDateChange('end', e.target.value)}
                              variant="outlined"
                              className={styles.textField}
                          InputLabelProps={{ shrink: true }}
                              inputProps={{
                                style: { color: '#fff' }
                              }}
                              sx={{ width: { xs: '100%', md: 'auto' } }}
                            />
                          </>
                        )}
                      </Box>
                  </Box>
                
                    <Box className={styles.tableContainer} sx={{ 
                      overflowX: 'auto',
                      px: { xs: 0, sm: 1 },
                      mx: { xs: -1.5, sm: 0 },
                      '&::-webkit-scrollbar': {
                        height: 8
                      },
                      '&::-webkit-scrollbar-thumb': {
                        backgroundColor: 'rgba(255,255,255,0.2)', 
                        borderRadius: 4
                      },
                      '&::-webkit-scrollbar-track': {
                        backgroundColor: 'rgba(0,0,0,0.1)',
                        borderRadius: 4
                      }
                    }}>
                      <Table size="small">
                    <TableHead>
                      <TableRow>
                            <TableCell className={styles.tableHeader}>Code</TableCell>
                            <TableCell className={styles.tableHeader}>Balance</TableCell>
                            <TableCell className={styles.tableHeader} sx={{ display: { xs: 'table-cell', md: 'table-cell' } }}>Duration</TableCell>
                            <TableCell className={styles.tableHeader}>Status</TableCell>
                            <TableCell className={styles.tableHeader} sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Created</TableCell>
                            <TableCell className={styles.tableHeader} align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredReferralCodes.length > 0 ? (
                          filteredReferralCodes.map((code) => (
                              <TableRow key={code._id} className={styles.tableRow}>
                                <TableCell className={styles.tableCell}>
                                  <Box className={styles.resellerInfo}>
                                    <KeyIcon className={styles.resellerIcon} />
                                    <Typography sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                  {code.code}
                                    </Typography>
                                </Box>
                              </TableCell>
                                <TableCell className={styles.tableCell}>
                                {code.unlimited ? (
                                  <Chip 
                                    label="Unlimited" 
                                    variant="outlined" 
                                      size="small" 
                                    sx={{
                                        height: { xs: '24px', sm: '32px' },
                                        '& .MuiChip-label': { 
                                          px: { xs: 1, sm: 1.5 },
                                          fontSize: { xs: '0.65rem', sm: '0.75rem' }
                                        }
                                      }}
                                      className={styles.chip}
                                  />
                                ) : (
                                    <span className={styles.balance} style={{ 
                                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                    }}>
                                    {code.balance}
                                    </span>
                                )}
                              </TableCell>
                                <TableCell className={styles.tableCell} sx={{ display: { xs: 'table-cell', md: 'table-cell' } }}>
                                  <Box className={styles.expiryInfo}>
                                    <AccessTimeIcon className={styles.icon} sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }} />
                                    <Typography sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                      {code.duration || '30 days'}
                                    </Typography>
                                </Box>
                              </TableCell>
                                <TableCell className={styles.tableCell}>
                                  <Box className={styles.statusBox} style={{
                                    backgroundColor: code.usedCount > 0 
                                      ? 'rgba(244, 67, 54, 0.1)' 
                                      : 'rgba(76, 175, 80, 0.1)',
                                    borderColor: code.usedCount > 0 
                                      ? 'rgba(244, 67, 54, 0.2)' 
                                      : 'rgba(76, 175, 80, 0.2)',
                                  }}>
                                    <span 
                                      className={styles.statusDot} 
                                      style={{
                                        backgroundColor: code.usedCount > 0 ? '#f44336' : '#4caf50',
                                        boxShadow: code.usedCount > 0 
                                          ? '0 0 8px rgba(244, 67, 54, 0.4)' 
                                          : '0 0 8px rgba(76, 175, 80, 0.4)',
                                      }}
                                    />
                                    <Typography sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
                                      {code.usedCount > 0 ? 'Used' : 'Unused'}
                                    </Typography>
                                  </Box>
                            </TableCell>
                                <TableCell className={styles.tableCell} sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                                  <Box className={styles.registrationInfo}>
                                    <EventIcon className={styles.icon} sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }} />
                                    <Typography sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                      {formatDate(code.createdAt)}
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell className={styles.tableCell} align="right">
                                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                    <Tooltip title="Copy Referral Link" arrow placement="top">
                                  <IconButton
                                size="small" 
                                        onClick={() => handleCopyReferralCode(code.code)}
                                        className={styles.editButton}
                                  >
                                        <ContentCopyIcon fontSize="small" />
                                  </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete Code" arrow placement="top">
                                  <IconButton
                                    size="small"
                                        onClick={() => handleDeleteReferralCode(code._id)}
                                        className={styles.deleteButton}
                              >
                                        <DeleteIcon fontSize="small" />
                                  </IconButton>
                                    </Tooltip>
                                </Box>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                              <TableCell colSpan={6} className={styles.noData} sx={{ textAlign: 'center', py: 4 }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                  <KeyIcon sx={{ fontSize: '2rem', opacity: 0.5 }} />
                                  <Typography variant="body1">
                                    No referral codes found for the selected time period.
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                    </Box>
                </CardContent>
                </Collapse>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" className={styles.title}>
            Key Management
                  </Typography>
          <Typography className={styles.subtitle}>
            Manage license keys for the {modTemplate.name} mod.
          </Typography>
          
          <Grid container spacing={3} className={styles.gridContainer}>
            {/* Recent Keys section - show for both owner and admin users */}
            {generatedKeys.length > 0 && (
              <Grid item xs={12} className={styles.gridItem}>
                <Card className={styles.card}>
                  <CardHeader 
                    title={
                      <Typography variant="h6" className={styles.cardTitle}>
                        <VpnKeyIcon className={styles.cardIcon} sx={{ mr: 1.5 }} />
                        Recent Keys
                      </Typography>
                    }
                    className={styles.cardHeader}
                  />
                  <CardContent className={styles.cardContent}>
                    <Box className={styles.recentKeysContainer}>
                      <Typography variant="subtitle2" className={styles.subtitle} gutterBottom>
                        {currentUser.role === 'owner' 
                          ? `Recent Keys (${generatedKeys.length})` 
                          : `Recently Generated Keys (${generatedKeys.length})`
                        }
                      </Typography>
                      <Box className={styles.tableContainer} sx={{ 
                        overflowX: 'auto',
                        '&::-webkit-scrollbar': {
                          height: 8
                        },
                        '&::-webkit-scrollbar-thumb': {
                          backgroundColor: 'rgba(255,255,255,0.2)',
                          borderRadius: 4
                        },
                        '&::-webkit-scrollbar-track': {
                          backgroundColor: 'rgba(0,0,0,0.1)',
                          borderRadius: 4
                        }
                      }}>
                        <Table size="small" sx={{ minWidth: { xs: 500, sm: 650, md: 750 } }}>
                          <TableHead>
                            <TableRow>
                              <TableCell className={styles.tableHeader} width="40%">License Key</TableCell>
                              <TableCell className={styles.tableHeader} width="35%">Expiry</TableCell>
                              <TableCell className={styles.tableHeader} width="25%" align="right">Actions</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {generatedKeys.map(key => (
                              <TableRow key={key._id} className={styles.tableRow}>
                                <TableCell className={styles.tableCell}>
                                  <Box className={styles.key} sx={{
                                    display: 'flex',
                                    alignItems: 'center', 
                                    backgroundColor: 'rgba(0,0,0,0.1)',
                                    py: { xs: 0.5, sm: 0.75 },
                                    px: { xs: 1, sm: 1.5 },
                                    borderRadius: '4px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    maxWidth: { xs: '150px', sm: '100%' },
                                    width: '100%',
                                    cursor: 'pointer',
                                    '&:hover': {
                                      backgroundColor: 'rgba(0,0,0,0.2)',
                                    }
                                  }}>
                                    <Typography 
                                      className={styles.keyText}
                                      sx={{ 
                                        fontFamily: 'monospace',
                                        display: { xs: 'none', sm: 'block' },
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        fontSize: { xs: '0.8rem', sm: '0.95rem' },
                                        width: '100%'
                                      }}
                                    >
                                      {key.key}
                                    </Typography>
                                    <Typography 
                                      className={styles.keyText}
                                      sx={{ 
                                        fontFamily: 'monospace',
                                        display: { xs: 'block', sm: 'none' },
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        fontSize: '0.8rem'
                                      }}
                                    >
                                      {key.key.substring(0, 5)}...
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell className={styles.tableCell}>
                                  <Typography sx={{ fontSize: { xs: '0.8rem', sm: '0.95rem' } }} title={formatDetailedDate(key.expiresAt)}>
                                    {formatDate(key.expiresAt)}
                                  </Typography>
                                </TableCell>
                                <TableCell className={styles.tableCell} align="right">
                                  <IconButton 
                                    size="medium"
                                    onClick={() => {
                                      navigator.clipboard.writeText(key.key);
                                      toast.success('Key copied to clipboard');
                                    }}
                                    className={styles.editButton}
                                    sx={{
                                      backgroundColor: 'rgba(33, 150, 243, 0.1)',
                                      '&:hover': {
                                        backgroundColor: 'rgba(33, 150, 243, 0.2)',
                                      }
                                    }}
                                  >
                                    <ContentCopyIcon sx={{ fontSize: '1.1rem', color: '#2196f3' }} />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Main Keys List - always show */}
            <Grid item xs={12} className={styles.gridItem}>
              <Card className={styles.card}>
                <CardHeader 
                  title={
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="h6" className={styles.cardTitle}>
                        <ViewListIcon className={styles.cardIcon} sx={{ mr: 1.5 }} />
                        {currentUser.role === 'owner' 
                          ? `License Keys for ${modTemplate.name}`
                          : `My Generated Keys for ${modTemplate.name}`}
                      </Typography>
                      
                      {/* Remove the filter options for owner */}
                    </Box>
                  }
                  className={styles.cardHeader}
                />
                <CardContent className={styles.cardContent}>
                  {/* Add date filter UI */}
                  <Box className={styles.dateFilter} sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    mb: 2,
                    gap: { xs: 1, sm: 2 }
                  }}>
                    <Box className={styles.dateFilterItem}>
                      <CalendarTodayIcon className={styles.dateFilterIcon} />
                      <Typography variant="body2" className={styles.dateFilterText}>
                        Filter by creation date:
                      </Typography>
                    </Box>
                    <Box className={styles.dateFilterCustom} sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      gap: { xs: 1, sm: 2 },
                      alignItems: { xs: 'stretch', sm: 'center' },
                      flex: 1
                    }}>
                      <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 200 } }}>
                        <Select
                          value={keyDateFilter}
                          onChange={handleKeyDateFilterChange}
                          displayEmpty
                          className={styles.filterSelect}
                          sx={{
                            backgroundColor: 'rgba(0,0,0,0.2)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            '& .MuiSelect-select': {
                              py: 0.75
                            }
                          }}
                        >
                          <MenuItem value="all">All Time</MenuItem>
                          <MenuItem value="today">Today</MenuItem>
                          <MenuItem value="yesterday">Yesterday</MenuItem>
                          <MenuItem value="custom">Custom Date Range</MenuItem>
                        </Select>
                      </FormControl>
                      
                      {keyDateFilter === 'custom' && (
                        <Box sx={{ 
                          display: 'flex', 
                          flexDirection: { xs: 'column', sm: 'row' }, 
                          gap: 1,
                          width: { xs: '100%', sm: 'auto' }
                        }}>
                          <TextField
                            type="date"
                            size="small"
                            label="Start Date"
                            value={customKeyStartDate}
                            onChange={(e) => {
                              const value = e.target.value;
                              setCustomKeyStartDate(value);
                              if (value) {
                                filterKeys('custom', value, customKeyEndDate);
                              }
                            }}
                            InputLabelProps={{ shrink: true }}
                            className={styles.dateInput}
                            sx={{
                              backgroundColor: 'rgba(0,0,0,0.2)',
                              borderRadius: 1,
                              '& .MuiOutlinedInput-root': {
                                '& fieldset': {
                                  borderColor: 'rgba(255,255,255,0.1)',
                                }
                              },
                              '& .MuiInputBase-input': {
                                color: '#fff'
                              },
                              '& .MuiInputLabel-root': {
                                color: 'rgba(255,255,255,0.7)'
                              }
                            }}
                          />
                          <TextField
                            type="date"
                            size="small"
                            label="End Date"
                            value={customKeyEndDate}
                            onChange={(e) => {
                              const value = e.target.value;
                              setCustomKeyEndDate(value);
                              if (value) {
                                filterKeys('custom', customKeyStartDate, value);
                              }
                            }}
                            InputLabelProps={{ shrink: true }}
                            className={styles.dateInput}
                            sx={{
                              backgroundColor: 'rgba(0,0,0,0.2)',
                              borderRadius: 1,
                              '& .MuiOutlinedInput-root': {
                                '& fieldset': {
                                  borderColor: 'rgba(255,255,255,0.1)',
                                }
                              },
                              '& .MuiInputBase-input': {
                                color: '#fff'
                              },
                              '& .MuiInputLabel-root': {
                                color: 'rgba(255,255,255,0.7)'
                              }
                            }}
                          />
                        </Box>
                      )}
                    </Box>
                  </Box>
                  
                  {filteredKeys.length > 0 ? (
                    <Box className={styles.tableContainer} sx={{ 
                      overflowX: 'auto',
                      px: { xs: 0, sm: 1 },
                      mx: { xs: -1.5, sm: 0 },
                      '&::-webkit-scrollbar': {
                        height: 8
                      },
                      '&::-webkit-scrollbar-thumb': {
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        borderRadius: 4
                      },
                      '&::-webkit-scrollbar-track': {
                        backgroundColor: 'rgba(0,0,0,0.1)',
                        borderRadius: 4
                      }
                    }}>
                      <Table size="small" sx={{ 
                        minWidth: { xs: 500, sm: 650, md: 750 },
                        // Add styling for reseller panel
                        ...(currentUser.role === 'admin' && {
                          '& .MuiTableCell-root': {
                            borderRight: '1px solid rgba(255, 255, 255, 0.1)',
                            '&:last-child': {
                              borderRight: 'none'
                            }
                          },
                          '& .MuiTableCell-head': {
                            borderBottom: '2px solid rgba(0, 195, 255, 0.3)',
                            backgroundColor: 'rgba(20, 20, 30, 0.95)',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          },
                          '& .MuiTableRow-root': {
                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                          },
                          border: '1px solid rgba(0, 195, 255, 0.2)',
                          borderRadius: '4px'
                        })
                      }}>
                    <TableHead>
                      <TableRow>
                            <TableCell className={styles.tableHeader}>License Key</TableCell>
                            <TableCell className={styles.tableHeader}>Created</TableCell>
                            <TableCell className={styles.tableHeader}>Expires</TableCell>
                            <TableCell className={styles.tableHeader}>Status</TableCell>
                            <TableCell className={styles.tableHeader}>Devices</TableCell>
                            {currentUser.role === 'owner' && (
                              <TableCell className={styles.tableHeader} sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Creator</TableCell>
                            )}
                            <TableCell className={styles.tableHeader} align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                          {filteredKeys.length > 0 ? (
                            // Use the new KeyDisplay component instead of inline JSX
                            getFilteredKeysList().map((key) => (
                              <KeyDisplay 
                                key={key._id}
                                keyData={key} 
                                currentUser={currentUser}
                                styles={styles}
                                handleOpenDeleteKeyDialog={handleOpenDeleteKeyDialog}
                                handleOpenEditKeyDialog={handleOpenEditKeyDialog}
                              />
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={currentUser.role === 'owner' ? 7 : 6} className={styles.noData} sx={{ textAlign: 'center', py: 4 }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                  <KeyIcon sx={{ fontSize: '2rem', opacity: 0.5 }} />
                                  <Typography variant="body1">
                                    No owner keys found for this mod.
                                  </Typography>
                                </Box>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                    </Box>
                  ) : (
                    <Box className={styles.emptyState}>
                      <KeyIcon className={styles.emptyIcon} fontSize="large" />
                      <Typography className={styles.emptyText}>
                        {currentUser.role === 'owner'
                          ? "No owner-generated keys found for this mod."
                          : "You haven't created any keys for this mod yet."}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
                </Box>
      
      {/* Add bulk action confirmation dialog */}
      <Dialog
        open={bulkActionDialogOpen}
        onClose={cancelBulkAction}
        aria-labelledby="bulk-action-confirmation-title"
        aria-describedby="bulk-action-confirmation-description"
      >
        <DialogTitle id="bulk-action-confirmation-title">
          Confirm Bulk Action
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="bulk-action-confirmation-description" sx={{ mb: 2 }}>
            {pendingBulkAction === 'extend' && 
              `This will extend the expiry date for ALL resellers of ${modTemplate.name}. Please specify how many days to extend:`}
          </DialogContentText>
          
          {pendingBulkAction === 'extend' && (
                      <TextField
              autoFocus
              margin="dense"
              id="extensionDays"
              label="Days to Extend"
                        type="number"
                        fullWidth
              variant="outlined"
              value={extensionDays}
              onChange={handleExtensionDaysChange}
                        InputProps={{
                inputProps: { min: 1, max: 365 }
              }}
              helperText="Enter a number between 1 and 365 days"
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelBulkAction} disabled={bulkActionLoading}>
            Cancel
          </Button>
                      <Button
            onClick={executeBulkAction} 
            color="primary" 
            disabled={bulkActionLoading || (pendingBulkAction === 'extend' && (extensionDays < 1 || extensionDays > 365))} 
            autoFocus
          >
            {bulkActionLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Confirm'
            )}
                      </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete key confirmation dialog */}
      <Dialog
        open={deleteKeyDialogOpen}
        onClose={handleCloseDeleteKeyDialog}
        aria-labelledby="delete-key-dialog-title"
        aria-describedby="delete-key-dialog-description"
      >
        <DialogTitle id="delete-key-dialog-title">
          Delete Key
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-key-dialog-description">
            Are you sure you want to delete this key? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteKeyDialog} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteKey} 
            color="primary"
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Edit Key Dialog */}
      <Dialog
        open={editKeyDialogOpen}
        onClose={handleCloseEditKeyDialog}
        aria-labelledby="edit-key-dialog-title"
        aria-describedby="edit-key-dialog-description"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="edit-key-dialog-title">
          Edit Key Expiry
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, mb: 2 }}>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Key: <span style={{ fontFamily: 'monospace' }}>{keyToEdit?.key}</span>
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Current Expiry: {keyToEdit ? new Date(keyToEdit.expiresAt).toLocaleDateString() : ''}
            </Typography>
            
            <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
              Extend Expiry By
            </Typography>
            
            <TextField
              autoFocus
              margin="dense"
              id="keyExtensionDays"
              label="Days to Extend"
              type="number"
              fullWidth
              variant="outlined"
              value={keyExtensionDays}
              onChange={handleKeyExtensionDaysChange}
              InputProps={{
                inputProps: { min: 1, max: 365 }
              }}
              helperText="Enter a number between 1 and 365 days"
            />
            
            {keyToEdit && keyExtensionDays > 0 && (
              <Typography variant="body2" sx={{ mt: 2, fontWeight: 500, color: 'success.main' }}>
                New Expiry Date: {(() => {
                  const currentExpiryDate = new Date(keyToEdit.expiresAt);
                  const newExpiryDate = new Date(currentExpiryDate);
                  newExpiryDate.setDate(newExpiryDate.getDate() + keyExtensionDays);
                  return newExpiryDate.toLocaleDateString();
                })()}
              </Typography>
            )}
            
            <Typography variant="caption" color="error" sx={{ display: 'block', mt: 2 }}>
              Note: If the extend operation fails, the backend API might need to be updated to support key extension.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditKeyDialog} disabled={editKeyLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleExtendKeyExpiry}
            color="primary" 
            disabled={editKeyLoading || !keyExtensionDays || keyExtensionDays < 1 || keyExtensionDays > 365}
            autoFocus
          >
            {editKeyLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Extend Expiry'
            )}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Edit Reseller Balance Modal */}
      <Dialog 
        open={showBalanceModal} 
        onClose={handleCloseBalanceModal}
        aria-labelledby="edit-balance-dialog-title"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="edit-balance-dialog-title">
          Edit {selectedResellerForEdit?.username}'s Balance
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, mb: 2 }}>
          <FormControlLabel
            control={
              <Switch 
                checked={editBalanceForm.unlimited} 
                onChange={handleEditBalanceInputChange}
                name="unlimited"
                color="primary"
              />
            }
            label="Unlimited Balance"
          />
          
          {!editBalanceForm.unlimited && (
            <TextField
                margin="dense"
                name="balance"
              label="Balance"
              type="number"
                fullWidth
                variant="outlined"
              value={editBalanceForm.balance}
              onChange={handleEditBalanceInputChange}
                sx={{ mt: 2 }}
              InputProps={{
                inputProps: { min: 0 }
              }}
              />
            )}
            
            <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
              Extend Expiry Date
            </Typography>
            
            <TextField
              margin="dense"
              name="expiryDays"
              label="Extend Expiry"
              type="number"
              fullWidth
              variant="outlined"
              value={editBalanceForm.expiryDays}
              onChange={handleEditBalanceInputChange}
              InputProps={{
                inputProps: { min: 0, max: 365 }
              }}
              helperText="Enter number of days to extend expiry (0-365)"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBalanceModal} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleEditBalanceSubmit}
            color="primary" 
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Update Balance'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Create Reseller Modal */}
      <Dialog 
        open={showCreateResellerModal}
        onClose={() => setShowCreateResellerModal(false)}
        aria-labelledby="create-reseller-dialog-title"
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle id="create-reseller-dialog-title">
          Create New Admin Reseller
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, mb: 2 }}>
            <TextField
              margin="dense"
              name="username"
              label="Username"
              type="text"
              fullWidth
              variant="outlined"
              value={newResellerForm.username}
              onChange={handleNewResellerFormChange}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              name="password"
              label="Password"
              type="password"
              fullWidth
              variant="outlined"
              value={newResellerForm.password}
              onChange={handleNewResellerFormChange}
              sx={{ mb: 2 }}
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={newResellerForm.unlimited}
                  onChange={handleNewResellerFormChange}
                  name="unlimited"
                />
              }
              label="Unlimited Balance"
              sx={{ mb: 2 }}
            />

            {!newResellerForm.unlimited && (
              <TextField
                margin="dense"
                name="balance"
                label="Initial Balance"
                type="number"
                fullWidth
                variant="outlined"
                value={newResellerForm.balance}
                onChange={handleNewResellerFormChange}
                InputProps={{
                  inputProps: { min: 0 }
                }}
                helperText="Enter initial balance"
                sx={{ mb: 2 }}
              />
            )}

            <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
              Deduction Rates
            </Typography>

            <TextField
              margin="dense"
              name="day1Deduction"
              label="1 Day Deduction Rate"
              type="number"
              fullWidth
              variant="outlined"
              value={newResellerForm.deductionRates.day1}
              onChange={(e) => {
                setNewResellerForm(prev => ({
                  ...prev,
                  deductionRates: {
                    ...prev.deductionRates,
                    day1: parseInt(e.target.value) || 0
                  }
                }));
              }}
              InputProps={{
                inputProps: { min: 0 }
              }}
              helperText="Amount to deduct for 1 day access"
              sx={{ mb: 2 }}
            />

            <TextField
              margin="dense"
              name="day3Deduction"
              label="3 Days Deduction Rate"
              type="number"
              fullWidth
              variant="outlined"
              value={newResellerForm.deductionRates.day3}
              onChange={(e) => {
                setNewResellerForm(prev => ({
                  ...prev,
                  deductionRates: {
                    ...prev.deductionRates,
                    day3: parseInt(e.target.value) || 0
                  }
                }));
              }}
              InputProps={{
                inputProps: { min: 0 }
              }}
              helperText="Amount to deduct for 3 days access"
              sx={{ mb: 2 }}
            />

            <TextField
              margin="dense"
              name="day7Deduction"
              label="7 Days Deduction Rate"
              type="number"
              fullWidth
              variant="outlined"
              value={newResellerForm.deductionRates.day7}
              onChange={(e) => {
                setNewResellerForm(prev => ({
                  ...prev,
                  deductionRates: {
                    ...prev.deductionRates,
                    day7: parseInt(e.target.value) || 0
                  }
                }));
              }}
              InputProps={{
                inputProps: { min: 0 }
              }}
              helperText="Amount to deduct for 7 days access"
              sx={{ mb: 2 }}
            />

            <TextField
              margin="dense"
              name="day15Deduction"
              label="15 Days Deduction Rate"
              type="number"
              fullWidth
              variant="outlined"
              value={newResellerForm.deductionRates.day15}
              onChange={(e) => {
                setNewResellerForm(prev => ({
                  ...prev,
                  deductionRates: {
                    ...prev.deductionRates,
                    day15: parseInt(e.target.value) || 0
                  }
                }));
              }}
              InputProps={{
                inputProps: { min: 0 }
              }}
              helperText="Amount to deduct for 15 days access"
              sx={{ mb: 2 }}
            />

            <TextField
              margin="dense"
              name="day30Deduction"
              label="30 Days Deduction Rate"
              type="number"
              fullWidth
              variant="outlined"
              value={newResellerForm.deductionRates.day30}
              onChange={(e) => {
                setNewResellerForm(prev => ({
                  ...prev,
                  deductionRates: {
                    ...prev.deductionRates,
                    day30: parseInt(e.target.value) || 0
                  }
                }));
              }}
              InputProps={{
                inputProps: { min: 0 }
              }}
              helperText="Amount to deduct for 30 days access"
              sx={{ mb: 2 }}
            />

            <TextField
              margin="dense"
              name="day60Deduction"
              label="60 Days Deduction Rate"
              type="number"
              fullWidth
              variant="outlined"
              value={newResellerForm.deductionRates.day60}
              onChange={(e) => {
                setNewResellerForm(prev => ({
                  ...prev,
                  deductionRates: {
                    ...prev.deductionRates,
                    day60: parseInt(e.target.value) || 0
                  }
                }));
              }}
              InputProps={{
                inputProps: { min: 0 }
              }}
              helperText="Amount to deduct for 60 days access"
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="duration-label">Duration</InputLabel>
              <Select
                labelId="duration-label"
                name="duration"
                value={newResellerForm.duration}
                onChange={handleNewResellerFormChange}
                label="Duration"
              >
                <MenuItem value="30 days">30 Days</MenuItem>
                <MenuItem value="60 days">60 Days</MenuItem>
                <MenuItem value="90 days">90 Days</MenuItem>
                <MenuItem value="180 days">180 Days</MenuItem>
                <MenuItem value="365 days">365 Days</MenuItem>
                <MenuItem value="unlimited">Unlimited</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateResellerModal(false)} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleManualResellerCreate} 
            color="primary" 
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Create Reseller'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Generate Key Modal */}
      <Dialog 
        open={showKeyGenModal}
        onClose={() => setShowKeyGenModal(false)}
        aria-labelledby="generate-key-dialog-title"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="generate-key-dialog-title">
          Generate License Keys
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, mb: 2 }}>
            <TextField
              margin="dense"
              label="Number of Keys"
              type="number"
              fullWidth
              variant="outlined"
              value={keyGenAmount}
              onChange={(e) => {
                // First handle empty input
                if (e.target.value === '') {
                  setKeyGenAmount('');
                  return;
                }
                
                // Then convert to number directly
                const numValue = Number(e.target.value);
                
                // Set the value directly without any || operator
                setKeyGenAmount(numValue);
                
                // For debugging, log the value being set
                logger.info("Setting keyGenAmount:", numValue, "Type:", typeof numValue);
              }}
              sx={{ mb: 2 }}
              InputProps={{
                inputProps: { min: 1, max: 10 }
              }}
              helperText="Number of keys to generate"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={keyUnlimited}
                  onChange={(e) => setKeyUnlimited(e.target.checked)}
                  color="primary"
                />
              }
              label="Unlimited Duration"
              sx={{ mb: 1 }}
            />
            
            {!keyUnlimited && (
              <TextField
                margin="dense"
                label="Duration (Days)"
                type="number"
                fullWidth
                variant="outlined"
                value={keyDuration}
                onChange={(e) => {
                  const value = e.target.value === '' ? '' : Number(e.target.value);
                  setKeyDuration(value === '' ? 30 : value);
                }}
                sx={{ mb: 2 }}
                InputProps={{
                  inputProps: { min: 1, max: 365 }
                }}
                helperText="Key will expire after this many days"
              />
            )}
            
            {/* Max Devices field hidden and set to fixed value of 1 */}
            <input type="hidden" value="1" />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowKeyGenModal(false)} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleGenerateKey} 
            color="primary" 
            disabled={keyGenLoading}
          >
            {keyGenLoading ? <CircularProgress size={24} /> : 'Generate Keys'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Add Create Referral Code Modal */}
      <Dialog
        open={showReferralModal}
        onClose={() => setShowReferralModal(false)}
        aria-labelledby="create-referral-dialog-title"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="create-referral-dialog-title">
          Create Referral Code
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, mb: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={referralUnlimited}
                  onChange={(e) => setReferralUnlimited(e.target.checked)}
                  color="primary"
                />
              }
              label="Unlimited Balance"
              sx={{ mb: 1 }}
            />
            
            {!referralUnlimited && (
              <TextField
                margin="dense"
                label="Initial Balance"
                type="number"
                fullWidth
                variant="outlined"
                value={referralBalance}
                onChange={(e) => setReferralBalance(e.target.value)}
                sx={{ mb: 2 }}
                InputProps={{
                  inputProps: { min: 1 }
                }}
                helperText="Balance for the new reseller account"
              />
            )}
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="referral-duration-label">Duration</InputLabel>
              <Select
                labelId="referral-duration-label"
                value={referralDuration}
                onChange={(e) => setReferralDuration(e.target.value)}
                label="Duration"
              >
                <MenuItem value="30 days">30 Days</MenuItem>
                <MenuItem value="60 days">60 Days</MenuItem>
                <MenuItem value="90 days">90 Days</MenuItem>
                <MenuItem value="180 days">180 Days</MenuItem>
                <MenuItem value="365 days">365 Days</MenuItem>
                <MenuItem value="unlimited">Unlimited</MenuItem>
              </Select>
            </FormControl>

            <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
              Deduction Rates
            </Typography>

            <TextField
              margin="dense"
              name="day1Deduction"
              label="1 Day Deduction Rate"
              type="number"
              fullWidth
              variant="outlined"
              value={deductionRates?.day1 ?? 100}
              onChange={(e) => {
                const value = e.target.value === '' ? '' : Number(e.target.value);
                setDeductionRates(prev => ({
                  ...prev,
                  day1: value
                }));
              }}
              InputProps={{
                inputProps: { min: 0 }
              }}
              helperText="Amount to deduct for 1 day access"
              sx={{ mb: 2 }}
            />

            <TextField
              margin="dense"
              name="day3Deduction"
              label="3 Days Deduction Rate"
              type="number"
              fullWidth
              variant="outlined"
              value={deductionRates?.day3 ?? 150}
              onChange={(e) => {
                const value = e.target.value === '' ? '' : Number(e.target.value);
                setDeductionRates(prev => ({
                  ...prev,
                  day3: value
                }));
              }}
              InputProps={{
                inputProps: { min: 0 }
              }}
              helperText="Amount to deduct for 3 days access"
              sx={{ mb: 2 }}
            />

            <TextField
              margin="dense"
              name="day7Deduction"
              label="7 Days Deduction Rate"
              type="number"
              fullWidth
              variant="outlined"
              value={deductionRates?.day7 ?? 200}
              onChange={(e) => {
                const value = e.target.value === '' ? '' : Number(e.target.value);
                setDeductionRates(prev => ({
                  ...prev,
                  day7: value
                }));
              }}
              InputProps={{
                inputProps: { min: 0 }
              }}
              helperText="Amount to deduct for 7 days access"
              sx={{ mb: 2 }}
            />

            <TextField
              margin="dense"
              name="day15Deduction"
              label="15 Days Deduction Rate"
              type="number"
              fullWidth
              variant="outlined"
              value={deductionRates?.day15 ?? 300}
              onChange={(e) => {
                const value = e.target.value === '' ? '' : Number(e.target.value);
                setDeductionRates(prev => ({
                  ...prev,
                  day15: value
                }));
              }}
              InputProps={{
                inputProps: { min: 0 }
              }}
              helperText="Amount to deduct for 15 days access"
              sx={{ mb: 2 }}
            />

            <TextField
              margin="dense"
              name="day30Deduction"
              label="30 Days Deduction Rate"
              type="number"
              fullWidth
              variant="outlined"
              value={deductionRates?.day30 ?? 500}
              onChange={(e) => {
                const value = e.target.value === '' ? '' : Number(e.target.value);
                setDeductionRates(prev => ({
                  ...prev,
                  day30: value
                }));
              }}
              InputProps={{
                inputProps: { min: 0 }
              }}
              helperText="Amount to deduct for 30 days access"
              sx={{ mb: 2 }}
            />

            <TextField
              margin="dense"
              name="day60Deduction"
              label="60 Days Deduction Rate"
              type="number"
              fullWidth
              variant="outlined"
              value={deductionRates?.day60 ?? 800}
              onChange={(e) => {
                const value = e.target.value === '' ? '' : Number(e.target.value);
                setDeductionRates(prev => ({
                  ...prev,
                  day60: value
                }));
              }}
              InputProps={{
                inputProps: { min: 0 }
              }}
              helperText="Amount to deduct for 60 days access"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowReferralModal(false)} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleCreateReferralCode} 
            color="primary" 
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Create Referral Code'}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default ModManagement;
