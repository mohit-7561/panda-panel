import { useState, useEffect, useContext } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  TextField, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  OutlinedInput,
  InputAdornment,
  CircularProgress,
  Alert,
  Snackbar,
  Tooltip,
  Select,
  MenuItem,
  Checkbox,
  Divider,
  useMediaQuery,
  Grid
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon, 
  Edit as EditIcon, 
  ContentCopy as CopyIcon,
  Search as SearchIcon,
  Add as Add,
  Refresh as Refresh,
  Visibility as Visibility,
  Edit as Edit
} from '@mui/icons-material';
import { getKeys, createKey, deleteKey, getUserKeys } from '../api/keys';
import Layout from '../components/Layout';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

// Define drawerWidth constant to match Layout component
const drawerWidth = 240;

// Available expiry durations
const EXPIRY_OPTIONS = [
  { value: 1, label: '1 Day', cost: 100 },
  { value: 3, label: '3 Days', cost: 150 },
  { value: 7, label: '7 Days', cost: 200 },
  { value: 15, label: '15 Days', cost: 300 },
  { value: 30, label: '30 Days', cost: 500 },
  { value: 60, label: '60 Days', cost: 800 }
];

// Game options
const GAME_OPTIONS = [
  { value: 'PUBG Mobile', label: 'PUBG Mobile' },
  { value: 'Call of Duty Mobile', label: 'Call of Duty Mobile' },
  { value: 'Free Fire', label: 'Free Fire' },
  { value: 'Mobile Legends', label: 'Mobile Legends' },
  { value: 'Valorant', label: 'Valorant' },
  { value: 'Fortnite', label: 'Fortnite' },
  { value: 'Other', label: 'Other' }
];

const KeyManagement = () => {
  const { currentUser, updateCurrentUser, refreshUserData } = useContext(AuthContext);
  
  // Debug log to see if we have deduction rates
  useEffect(() => {
    if (!currentUser) {return;
    }// Only refresh if we don't have deduction rates
    if (!currentUser?.deductionRates) {refreshUserData().then(() => {});
    }
  }, [refreshUserData, currentUser]);
  
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState({
    option: 'all',
    startDate: null,
    endDate: null,
    showCustom: false
  });
  
  // Check if reseller account is active
  const isAccountActive = currentUser?.active !== false;
  
  // New key form state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newKey, setNewKey] = useState({
    days: 30,
    maxDevices: 1,
    game: '',
    isActive: true
  });
  const [expiryDays, setExpiryDays] = useState(30);
  const [expiryDate, setExpiryDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
  // Keeping maxUsage state for API compatibility, but using fixed value of 0 in the API call
  const [maxUsage, setMaxUsage] = useState('');
  const [maxDevices, setMaxDevices] = useState(1);
  const [game, setGame] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  
  // Delete key state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Add missing state variables
  const [selected, setSelected] = useState([]);
  const isXs = useMediaQuery((theme) => theme.breakpoints.down('sm'));
  
  // Add missing state variables for dialogs
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  // Fetch keys on component mount
  useEffect(() => {
    fetchKeys();
  }, []);
  
  const fetchKeys = async () => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      
      let response;
      // Use different API calls based on user role
      if (currentUser.role === 'owner') {
        // Owners should see all keys
        response = await getKeys();
      } else {
        // Admin/resellers only see their own keys
        response = await getUserKeys();
      }
      
      if (response && response.success) {
        setKeys(response.keys || []);
      } else {
        // Handle case where response is successful but no data
        setError('Failed to fetch keys. Please try again later.');
        setKeys([]);
      }
    } catch (error) {
      // Check for specific inactive account error
      if (error.response?.status === 403 && error.response?.data?.message?.includes('deactivated')) {
        setError('Your account has been deactivated. Please contact the owner for assistance.');
        
        // Update the current user in context to reflect inactive status
        if (typeof updateCurrentUser === 'function' && currentUser) {
          updateCurrentUser({
            ...currentUser,
            active: false
          });
        }
      } else {
        // Show user-friendly error message
        setError(error.message || 'Failed to load your keys. Please try again later.');
      }
      setKeys([]); // Set empty array to avoid undefined errors
    } finally {
      setLoading(false);
    }
  };
  
  // Filter keys based on search term and date range
  const filteredKeys = keys.filter(key => {
    // Check if key matches search term
    const matchesSearch = key.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (key.game && key.game.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Apply date filtering
    let matchesDateRange = true;
    const keyDate = new Date(key.createdAt);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch (dateFilter.option) {
      case 'today':
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);
        matchesDateRange = keyDate >= today && keyDate <= endOfDay;
        break;
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const endOfYesterday = new Date(yesterday);
        endOfYesterday.setHours(23, 59, 59, 999);
        matchesDateRange = keyDate >= yesterday && keyDate <= endOfYesterday;
        break;
      case 'thisWeek':
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        matchesDateRange = keyDate >= startOfWeek && keyDate <= endOfWeek;
        break;
      case 'thisMonth':
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);
        matchesDateRange = keyDate >= startOfMonth && keyDate <= endOfMonth;
        break;
      case 'custom':
        if (dateFilter.startDate && dateFilter.endDate) {
          const startDate = new Date(dateFilter.startDate);
          startDate.setHours(0, 0, 0, 0);
          const endDate = new Date(dateFilter.endDate);
          endDate.setHours(23, 59, 59, 999);
          matchesDateRange = keyDate >= startDate && keyDate <= endDate;
        }
        break;
      default: // 'all'
        matchesDateRange = true;
    }
    
    return matchesSearch && matchesDateRange;
  });
  
  // Function to handle opening the key creation dialog
  const handleOpenDialog = () => {
    const isAccountActive = currentUser?.active !== false;
    if (currentUser?.role === 'admin' && !isAccountActive) {
      toast.error('Your account has been deactivated. Please contact the owner for assistance.');
      return;
    }
    setDialogOpen(true);
  };
  
  // Alias for handleOpenDialog to match the reference in JSX
  const handleOpenCreateDialog = handleOpenDialog;
  
  // Handle expiry days change
  const handleExpiryDaysChange = (days) => {
    setExpiryDays(days);
    
    // Calculate new expiry date based on selected days
    const newExpiryDate = new Date();
    newExpiryDate.setDate(newExpiryDate.getDate() + days);
    setExpiryDate(newExpiryDate);
    
    // Get rate information for logging
    const expiryOptions = getExpiryOptions();
    const selectedOption = expiryOptions.find(option => option.value === days);
    
    if (selectedOption) {
      // Option found, no need to log
    } else {
      console.warn(`Could not find rate information for ${days} days`);
    }
  };
  
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setExpiryDays(30);
    setExpiryDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
    setMaxDevices(1);
    setGame('');
    setFormError(null);
  };
  
  // Add getExpiryOptions function
  const getExpiryOptions = () => {
    if (currentUser?.deductionRates) {
      // Dynamic options based on user's deduction rates
      return [
        { value: 1, label: '1 Day', cost: Number(currentUser.deductionRates.day1) },
        { value: 3, label: '3 Days', cost: Number(currentUser.deductionRates.day3) },
        { value: 7, label: '7 Days', cost: Number(currentUser.deductionRates.day7) },
        { value: 15, label: '15 Days', cost: Number(currentUser.deductionRates.day15) },
        { value: 30, label: '30 Days', cost: Number(currentUser.deductionRates.day30) },
        { value: 60, label: '60 Days', cost: Number(currentUser.deductionRates.day60) }
      ];
    }
    
    // Default rates only as fallback if no user deduction rates found
    return EXPIRY_OPTIONS;
  };
  
  // Function to handle key creation
  const handleCreateKey = async () => {
    const isAccountActive = currentUser?.active !== false;
    if (currentUser?.role === 'admin' && !isAccountActive) {
      toast.error('Your account has been deactivated. Please contact the owner for assistance.');
      return;
    }
    
    if (game === "") {
      setSnackbar({
        open: true,
        message: 'Please select a game',
        severity: 'error'
      });
      return;
    }
    
    // Refresh user data first to ensure we have the latest deduction rates
    await refreshUserData(true); // Force refresh to get latest rates
    
    // Get the cost for the selected expiry period
    const expiryOptions = getExpiryOptions();
    const selectedOption = expiryOptions.find(option => option.value === expiryDays);
    
    if (!selectedOption) {
      setSnackbar({
        open: true,
        message: `Invalid expiry period selected`,
        severity: 'error'
      });
      return;
    }
    
    // Calculate the final cost based on base cost and number of devices
    const baseCost = selectedOption.cost;
    const finalCost = baseCost * (maxDevices || 1);
    
    // For resellers, check balance but don't show confirmation dialog
    if (currentUser && currentUser.role === 'admin' && !currentUser.unlimitedBalance) {
      // If user doesn't have enough balance
      if (currentUser.balance < finalCost) {
        setSnackbar({
          open: true,
          message: `Insufficient balance. This key requires ${finalCost} balance (${baseCost} × ${maxDevices} devices).`,
          severity: 'error'
        });
        return;
      }
      
      // Remove confirmation dialog and proceed directly
    }
    
    try {
      setFormLoading(true);
      setFormError(null);
      
      // Check if user has enough balance (skip check if unlimited balance)
      if (currentUser && currentUser.role === 'admin' && !currentUser.unlimitedBalance && currentUser.balance <= 0) {
        setFormError('Insufficient balance. Please contact the owner to add more balance.');
        setFormLoading(false);
        return;
      }
      
      // Always use 0 (unlimited) for maxUsage regardless of the input field value
      const keyData = {
        name: game ? `Key for ${game}` : 'New Key',
        description: '',
        expiresAt: expiryDate.toISOString(),
        maxUsage: 0, // Always set to unlimited
        maxDevices: maxDevices,
        game: game
      };
      
      const response = await createKey(keyData);
      
      if (response.success) {
        // Add the new key to the state
        setKeys([...keys, response.key]);
        
        // Update the user's balance in the frontend context if the response contains updated balance
        if (response.balance !== undefined && currentUser.role === 'admin') {
          // Update the balance in the auth context
          if (typeof updateCurrentUser === 'function') {
            updateCurrentUser({
              ...currentUser,
              balance: response.balance
            });
          }
        }
        
        // Close the dialog
        handleCloseDialog();
        
        // Show success message with balance information for resellers
        if (currentUser.role === 'admin' && !currentUser.unlimitedBalance) {
          const newBalance = response.balance !== undefined ? response.balance : 
                          (currentUser.balance - finalCost);
          setSnackbar({
            open: true,
            message: `Key created successfully. New balance: ${newBalance}`,
            severity: 'success'
          });
        } else {
          setSnackbar({
            open: true,
            message: 'Key created successfully',
            severity: 'success'
          });
        }
      }
    } catch (error) {
      // Check for specific inactive account error message
      if (error.response?.status === 403 && error.response?.data?.message?.includes('deactivated')) {
        setFormError('Your account has been deactivated. Please contact the owner for assistance.');
        
        // Update the current user in context to reflect inactive status
        if (typeof updateCurrentUser === 'function') {
          updateCurrentUser({
            ...currentUser,
            active: false
          });
        }
      } else {
        setFormError(error.message);
      }
    } finally {
      setFormLoading(false);
    }
  };
  
  // Handle key deletion
  const openDeleteDialog = (key) => {
    setKeyToDelete(key);
    setDeleteDialogOpen(true);
  };
  
  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setKeyToDelete(null);
  };
  
  const handleDeleteKey = async () => {
    if (!keyToDelete) return;
    
    try {
      setDeleteLoading(true);
      const response = await deleteKey(keyToDelete._id);
      
      if (response.success) {
        setKeys(keys.filter(k => k._id !== keyToDelete._id));
        setSnackbar({
          open: true,
          message: 'Key deleted successfully',
          severity: 'success'
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Failed to delete key: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setDeleteLoading(false);
      closeDeleteDialog();
    }
  };
  
  // Copy key to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSnackbar({
      open: true,
      message: 'Key copied to clipboard',
      severity: 'success'
    });
  };
  
  // Determine if a key is active
  const isKeyActive = (key) => {
    return key.isActive && new Date(key.expiresAt) > new Date();
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  // Add a helper function for formatting dates with more detail
  const formatDetailedDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Add missing handler functions
  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = keys.map((n) => n._id);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const handleSelectClick = (event, id) => {
    event.stopPropagation();
    
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];
    
    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }
    
    setSelected(newSelected);
  };

  const isSelected = (id) => selected.indexOf(id) !== -1;
  
  const handleViewKey = (event, key) => {
    event.stopPropagation();
    setSelectedKey(key);
    setViewDialogOpen(true);
  };
  
  const handleEditKey = (event, key) => {
    event.stopPropagation();
    setSelectedKey(key);
    setEditDialogOpen(true);
  };
  
  const getKeyStatus = (key) => {
    return isKeyActive(key) ? 'Active' : 'Inactive';
  };
  
  const getStatusColor = (key) => {
    return isKeyActive(key) ? 'success' : 'error';
  };
  
  // Handle date filter change
  const handleDateFilterChange = (event) => {
    const option = event.target.value;
    setDateFilter({
      ...dateFilter,
      option,
      showCustom: option === 'custom'
    });
  };

  // Clear date filters
  const handleClearDateFilter = () => {
    setDateFilter({
      option: 'all',
      startDate: null,
      endDate: null,
      showCustom: false
    });
  };
  
  return (
    <Layout title="License Key Management">
      <Box sx={{ 
        p: { xs: 1.5, sm: 3 },
        pb: { xs: 1, sm: 3 }
      }}>
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: { xs: 2, sm: 4 },
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2
          }}
        >
          <Box sx={{ width: { xs: '100%', sm: 'auto' } }}>
            <Typography 
              variant="h5" 
              component="h1" 
              sx={{ 
                fontWeight: 600,
                fontSize: { xs: '1.5rem', sm: '1.75rem' }
              }}
            >
              License Key Management
            </Typography>
          </Box>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
              {error}
            </Alert>
          )}

          {currentUser?.role === 'admin' && currentUser?.active === false && (
            <Alert severity="warning" sx={{ mb: 2, width: '100%' }}>
              Your reseller account has been deactivated. You cannot generate new keys. Please contact the owner for assistance.
            </Alert>
          )}
        
          <Box sx={{ 
            display: 'flex', 
            gap: { xs: 1, sm: 2 },
            width: { xs: '100%', sm: 'auto' },
            flexDirection: { xs: 'column', sm: 'row' },
          }}>
            <Tooltip title={!isAccountActive ? "Your account has been deactivated. Please contact the owner for assistance." : ""}>
              <span style={{ width: '100%' }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleOpenCreateDialog}
                  disabled={loading || !isAccountActive}
                  className="generate-key-btn"
                  sx={{ 
                    width: { xs: '100%', sm: 'auto' },
                    py: { xs: 1.5, sm: 1.5 },
                    px: { xs: 3, sm: 3 },
                    fontSize: { xs: '0.85rem', sm: '0.875rem' },
                    fontWeight: 'bold',
                    borderRadius: '8px',
                    textTransform: 'none',
                    boxShadow: '0 4px 10px rgba(0, 195, 255, 0.2)',
                    background: 'linear-gradient(90deg, rgba(0, 195, 255, 1), rgba(0, 118, 255, 1))',
                    border: '1px solid rgba(0, 195, 255, 0.3)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: 'linear-gradient(90deg, rgba(0, 195, 255, 0.9), rgba(0, 118, 255, 0.9))',
                      boxShadow: '0 6px 15px rgba(0, 195, 255, 0.3)',
                      transform: 'translateY(-2px)'
                    },
                    '&:active': {
                      transform: 'translateY(1px)',
                      boxShadow: '0 2px 5px rgba(0, 195, 255, 0.2)'
                    },
                    '&.Mui-disabled': {
                      background: 'linear-gradient(90deg, rgba(0, 195, 255, 0.5), rgba(0, 118, 255, 0.5))',
                      opacity: 0.6
                    }
                  }}
                >
                  {isXs ? 'Generate Key' : 'Generate New Key'}
                </Button>
              </span>
            </Tooltip>
            <Button
              variant="outlined"
              onClick={fetchKeys}
              sx={{
                width: { xs: '100%', sm: 'auto' },
                py: { xs: 1.5, sm: 1.5 },
                px: { xs: 3, sm: 2.5 },
                fontSize: { xs: '0.85rem', sm: '0.875rem' },
                fontWeight: 'medium',
                borderRadius: '8px',
                textTransform: 'none',
                borderColor: 'rgba(0, 195, 255, 0.3)',
                color: 'rgba(0, 195, 255, 0.9)',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(4px)',
                backgroundColor: 'rgba(0, 195, 255, 0.05)',
                '&:hover': {
                  borderColor: 'rgba(0, 195, 255, 0.5)',
                  backgroundColor: 'rgba(0, 195, 255, 0.1)',
                  transform: 'translateY(-2px)'
                },
                '&:active': {
                  transform: 'translateY(1px)'
                }
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5
              }}>
                <Refresh fontSize="small" />
                <span>Refresh</span>
              </Box>
            </Button>
          </Box>
        </Box>
        
        <Paper 
          sx={{ 
            mb: { xs: 2, sm: 4 }, 
            p: { xs: 1.5, sm: 2 },
            backgroundColor: 'rgba(30, 30, 30, 0.7)',
            backdropFilter: 'blur(10px)',
            borderRadius: 2,
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}
        >
          {/* Date Filter Dropdown */}
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'flex-start', sm: 'center' },
              justifyContent: 'space-between',
              gap: 2,
              mb: 2
            }}
          >
            <Typography 
              variant="subtitle2" 
              sx={{ 
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                color: 'text.secondary',
                mb: { xs: 0.5, sm: 0 }
              }}
            >
              Filter by Date:
            </Typography>
            
            <Box 
              sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 1, sm: 2 },
                width: { xs: '100%', sm: 'auto' },
                alignItems: { xs: 'flex-start', sm: 'center' },
              }}
            >
              <FormControl
                size="small"
                sx={{
                  width: { xs: '100%', sm: '200px' },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                    },
                    fontSize: '0.85rem',
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '0.85rem',
                  }
                }}
              >
                <InputLabel id="date-filter-label">Date Range</InputLabel>
                <Select
                  labelId="date-filter-label"
                  value={dateFilter.option}
                  onChange={handleDateFilterChange}
                  label="Date Range"
                >
                  <MenuItem value="all">All Time</MenuItem>
                  <MenuItem value="today">Today</MenuItem>
                  <MenuItem value="yesterday">Yesterday</MenuItem>
                  <MenuItem value="thisWeek">This Week</MenuItem>
                  <MenuItem value="thisMonth">This Month</MenuItem>
                  <MenuItem value="custom">Custom Range</MenuItem>
                </Select>
              </FormControl>
              
              {dateFilter.showCustom && (
                <>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Start Date"
                      value={dateFilter.startDate}
                      onChange={(date) => setDateFilter({...dateFilter, startDate: date})}
                      slotProps={{
                        textField: {
                          size: "small",
                          fullWidth: true,
                          sx: {
                            width: { xs: '100%', sm: '150px' },
                            '& .MuiOutlinedInput-root': {
                              '& fieldset': {
                                borderColor: 'rgba(255, 255, 255, 0.1)',
                              },
                              '&:hover fieldset': {
                                borderColor: 'rgba(255, 255, 255, 0.2)',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: 'primary.main',
                              },
                              fontSize: '0.85rem',
                            },
                            '& .MuiInputLabel-root': {
                              fontSize: '0.85rem',
                            }
                          }
                        }
                      }}
                    />
                  </LocalizationProvider>
                  
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="End Date"
                      value={dateFilter.endDate}
                      onChange={(date) => setDateFilter({...dateFilter, endDate: date})}
                      slotProps={{
                        textField: {
                          size: "small",
                          fullWidth: true,
                          sx: {
                            width: { xs: '100%', sm: '150px' },
                            '& .MuiOutlinedInput-root': {
                              '& fieldset': {
                                borderColor: 'rgba(255, 255, 255, 0.1)',
                              },
                              '&:hover fieldset': {
                                borderColor: 'rgba(255, 255, 255, 0.2)',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: 'primary.main',
                              },
                              fontSize: '0.85rem',
                            },
                            '& .MuiInputLabel-root': {
                              fontSize: '0.85rem',
                            }
                          }
                        }
                      }}
                    />
                  </LocalizationProvider>
                </>
              )}
              
              <Button 
                variant="outlined" 
                size="small" 
                onClick={handleClearDateFilter}
                sx={{
                  height: '40px',
                  minWidth: { xs: '100%', sm: '80px' },
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'text.secondary',
                  textTransform: 'none',
                  fontSize: '0.85rem',
                  '&:hover': {
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)'
                  }
                }}
              >
                Clear
              </Button>
            </Box>
          </Box>
          
          <FormControl sx={{ width: '100%' }} variant="outlined" size="small">
            <InputLabel htmlFor="search-key" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
              {isXs ? 'Search' : 'Search Keys'}
            </InputLabel>
            <OutlinedInput
              id="search-key"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              startAdornment={
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'primary.main', fontSize: { xs: '1.1rem', sm: '1.25rem' } }} />
                </InputAdornment>
              }
              label={isXs ? 'Search' : 'Search Keys'}
              placeholder={isXs ? "Search..." : "Search by key or game..."}
              sx={{
                height: { xs: '36px', sm: '40px' },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.1)'
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(244, 180, 26, 0.3)'
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.main'
                },
                '& input': {
                  fontSize: { xs: '0.8rem', sm: '0.875rem' }
                }
              }}
            />
          </FormControl>
        </Paper>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
            <CircularProgress sx={{ color: 'primary.main' }} size={60} />
          </Box>
        ) : error ? (
          <Alert 
            severity="error" 
            sx={{ 
              my: 2,
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
        ) : filteredKeys.length === 0 ? (
          <Box
            sx={{
              textAlign: 'center',
              py: 8,
              backgroundColor: 'rgba(30, 30, 30, 0.7)',
              backdropFilter: 'blur(10px)',
              borderRadius: 2,
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}
          >
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              {searchTerm ? 'No keys match your search' : 'No License Keys Found'}
            </Typography>
            {!searchTerm && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenCreateDialog}
                className="generate-key-btn"
              >
                Generate Your First Key
              </Button>
            )}
          </Box>
        ) : (
          <Box sx={{ width: '100%', p: { xs: 0, sm: 1, md: 2 } }}>
            <Paper sx={{ 
              width: '100%', 
              mb: { xs: 4, sm: 2 }, 
              overflow: 'hidden',
              borderRadius: { xs: '8px', sm: '12px' }
            }} elevation={3}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                p: { xs: 1.5, sm: 2 },
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 1, sm: 0 },
                borderBottom: '2px solid rgba(244, 180, 26, 0.3)'
              }}>
                <Typography 
                  variant="h6" 
                  component="div" 
                  sx={{ 
                    fontWeight: 'bold', 
                    mb: { xs: 0, sm: 0 },
                    fontSize: { xs: '1rem', sm: '1.25rem' },
                    color: 'primary.main',
                    width: '100%',
                    textAlign: { xs: 'center', sm: 'left' }
                  }}
                >
                  {isXs ? 'Your Latest Keys' : 'License Keys'}
                </Typography>
              </Box>
              
              {/* For desktop - Table view */}
              <Box sx={{ 
                display: { xs: 'none', md: 'block' }, 
                maxWidth: '100%',
                overflowX: 'auto'
              }}>
                <Table sx={{
                  '& .MuiTableCell-root': {
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    p: { xs: 1, sm: 2 },
                    fontSize: { sm: '0.875rem', md: '0.95rem' },
                    whiteSpace: 'nowrap',
                    lineHeight: 'normal'
                  },
                  '& .MuiCheckbox-root': {
                    padding: '8px'
                  },
                  '& .MuiTableRow-root:hover': {
                    backgroundColor: 'rgba(0, 195, 255, 0.03)'
                  },
                  ...(currentUser.role === 'admin' && {
                    '& .MuiTableRow-root': {
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                    }
                  })
                }}>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Checkbox
                          color="primary"
                          indeterminate={selected.length > 0 && selected.length < keys.length}
                          checked={keys.length > 0 && selected.length === keys.length}
                          onChange={handleSelectAllClick}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold', width: '25%' }}>Key</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', width: '15%' }}>Created On</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', width: '15%' }}>Expires</TableCell>
                      {currentUser.role === 'owner' && (
                        <TableCell sx={{ fontWeight: 'bold' }}>Usage</TableCell>
                      )}
                      <TableCell sx={{ fontWeight: 'bold', width: '10%' }}>Devices</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', width: '10%' }}>Status</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', width: '15%' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredKeys.map((key) => (
                      <TableRow 
                        key={key._id}
                        sx={{
                          transition: 'all 0.2s',
                          '&:hover': {
                            backgroundColor: 'rgba(0, 195, 255, 0.05)'
                          },
                          ...(currentUser.role === 'admin' && {
                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                            '&:hover': {
                              backgroundColor: 'rgba(0, 195, 255, 0.1)',
                              boxShadow: 'inset 0 0 5px rgba(0, 195, 255, 0.2)'
                            }
                          }),
                          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
                        }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            color="primary"
                            checked={selected.includes(key._id)}
                            onChange={(e) => handleSelectClick(e, key._id)}
                          />
                        </TableCell>
                        <TableCell component="th" scope="row">
                          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontFamily: 'monospace', 
                                fontWeight: 'medium',
                                fontSize: '0.875rem',
                                maxWidth: 'fit-content'
                              }}
                            >
                              {key.key.substring(0, 8)}...
                            </Typography>
                          </Box>
                        </TableCell>
                        
                        <TableCell>
                          <Tooltip title={formatDetailedDate(key.createdAt)} arrow placement="top">
                            <Typography sx={{ fontSize: '0.875rem' }}>
                              {new Date(key.createdAt).toLocaleDateString()}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        
                        <TableCell>
                          <Tooltip title={formatDetailedDate(key.expiresAt)} arrow placement="top">
                            <Typography sx={{ fontSize: '0.875rem' }}>
                              {formatDate(key.expiresAt)}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        {currentUser.role === 'owner' && (
                          <TableCell>{key.usageCount}/{key.maxUsage === 0 ? '∞' : key.maxUsage}</TableCell>
                        )}
                        <TableCell>
                          <Typography sx={{ fontSize: '0.875rem' }}>
                            {key.maxDevices || 1}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={getKeyStatus(key)} 
                            color={getStatusColor(key)}
                            size="medium"
                            sx={{ 
                              minWidth: '70px',
                              fontSize: '0.75rem',
                              height: '32px'
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'flex-end', 
                            gap: 1,
                            flexWrap: 'nowrap'
                          }}>
                            <Tooltip title="Copy Key">
                              <IconButton 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(key.key);
                                }}
                                size="medium"
                                sx={{ 
                                  color: 'primary.light',
                                  '&:hover': {
                                    bgcolor: 'rgba(244, 180, 26, 0.1)'
                                  }
                                }}
                              >
                                <CopyIcon />
                              </IconButton>
                            </Tooltip>
                            {currentUser.role === 'owner' && (
                              <Tooltip title="View Details">
                                <IconButton 
                                  onClick={(e) => handleViewKey(e, key)} 
                                  size="medium"
                                  sx={{ 
                                    '&:hover': {
                                      bgcolor: 'rgba(244, 180, 26, 0.1)'
                                    }
                                  }}
                                >
                                  <Visibility />
                                </IconButton>
                              </Tooltip>
                            )}
                            {currentUser.role === 'owner' && (
                              <Tooltip title="Edit Key">
                                <IconButton 
                                  onClick={(e) => handleEditKey(e, key)} 
                                  size="medium"
                                  sx={{ 
                                    '&:hover': {
                                      bgcolor: 'rgba(244, 180, 26, 0.1)'
                                    }
                                  }}
                                >
                                  <Edit />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title="Delete Key">
                              <IconButton 
                                onClick={(e) => openDeleteDialog(key)} 
                                size="medium"
                                sx={{ 
                                  '&:hover': {
                                    bgcolor: 'rgba(255, 82, 82, 0.1)'
                                  }
                                }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>

              {/* For mobile - Card based layout */}
              <Box sx={{ display: { xs: 'block', md: 'none' }, p: 1 }}>
                {filteredKeys.map((key) => (
                  <Paper
                    key={key._id}
                    elevation={2}
                    sx={{
                      p: 2,
                      mb: 2,
                      borderRadius: 2,
                      bgcolor: 'rgba(30, 30, 30, 0.7)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      transition: 'all 0.2s',
                      '&:hover': {
                        boxShadow: '0 4px 12px rgba(0, 195, 255, 0.15)',
                        borderColor: 'rgba(0, 195, 255, 0.2)'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1,
                        width: '70%'
                      }}>
                        <Checkbox
                          color="primary"
                          checked={selected.includes(key._id)}
                          onChange={(e) => handleSelectClick(e, key._id)}
                          sx={{ p: 0.5 }}
                        />
                        <Box sx={{ 
                          bgcolor: 'rgba(244, 180, 26, 0.1)', 
                          p: 1, 
                          borderRadius: 1,
                          overflow: 'hidden',
                          flexGrow: 1
                        }}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontFamily: 'monospace', 
                              fontWeight: 'medium',
                              fontSize: '0.75rem',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {key.key.substring(0, 16)}...
                          </Typography>
                        </Box>
                      </Box>
                      <Chip 
                        label={getKeyStatus(key)} 
                        color={getStatusColor(key)}
                        size="small"
                        sx={{ 
                          minWidth: '60px',
                          fontSize: '0.65rem',
                          height: '22px'
                        }}
                      />
                    </Box>

                    <Divider sx={{ my: 1, bgcolor: 'rgba(255, 255, 255, 0.1)' }} />

                    <Grid container spacing={1} sx={{ mb: 1.5 }}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                          Created On
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                          {new Date(key.createdAt).toLocaleDateString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                          Expires
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                          {formatDate(key.expiresAt)}
                        </Typography>
                      </Grid>
                    </Grid>

                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'flex-end', 
                      gap: 1, 
                      mt: 1,
                      pt: 1,
                      borderTop: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                      <IconButton 
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(key.key);
                        }}
                        size="small"
                        sx={{ 
                          p: 0.75, 
                          color: 'primary.light',
                          bgcolor: 'rgba(244, 180, 26, 0.05)',
                          '&:hover': {
                            bgcolor: 'rgba(244, 180, 26, 0.1)'
                          }
                        }}
                      >
                        <CopyIcon fontSize="small" />
                      </IconButton>
                      {currentUser.role === 'owner' && (
                        <IconButton 
                          onClick={(e) => handleViewKey(e, key)} 
                          size="small"
                          sx={{ 
                            p: 0.75,
                            bgcolor: 'rgba(244, 180, 26, 0.05)',
                            '&:hover': {
                              bgcolor: 'rgba(244, 180, 26, 0.1)'
                            }
                          }}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                      )}
                      {currentUser.role === 'owner' && (
                        <IconButton 
                          onClick={(e) => handleEditKey(e, key)} 
                          size="small"
                          sx={{ 
                            p: 0.75,
                            bgcolor: 'rgba(244, 180, 26, 0.05)',
                            '&:hover': {
                              bgcolor: 'rgba(244, 180, 26, 0.1)'
                            }
                          }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      )}
                      <IconButton 
                        onClick={(e) => openDeleteDialog(key)} 
                        size="small"
                        sx={{ 
                          p: 0.75,
                          bgcolor: 'rgba(255, 82, 82, 0.05)',
                          '&:hover': {
                            bgcolor: 'rgba(255, 82, 82, 0.1)'
                          }
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Paper>
                ))}
              </Box>
            </Paper>
          </Box>
        )}
      </Box>
      
      {/* Create Key Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        aria-labelledby="form-dialog-title"
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'rgba(16, 16, 38, 0.95)',
            backgroundImage: 'linear-gradient(rgba(16, 16, 38, 0.95), rgba(16, 16, 38, 0.95)), url(https://i.pinimg.com/originals/95/a6/3f/95a63f811bcbd8ce2fc943d3e40424b1.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundBlendMode: 'overlay',
            borderRadius: 2,
            border: '1px solid rgba(0, 195, 255, 0.2)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
            overflow: 'hidden',
            position: 'relative'
          }
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '4px',
            background: 'linear-gradient(90deg, #00c3ff, #0d64a6)'
          }}
        />
        <DialogTitle 
          id="form-dialog-title"
          sx={{
            color: 'primary.main',
            fontWeight: 'bold',
            letterSpacing: '1px',
            textTransform: 'uppercase'
          }}
        >
          Generate New License Key
          {currentUser && currentUser.role === 'admin' && (
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mt: 1,
                p: 1.5,
                borderRadius: 1,
                bgcolor: 'rgba(0, 195, 255, 0.05)',
                border: '1px solid rgba(0, 195, 255, 0.2)'
              }}
            >
              <Typography variant="subtitle2" color="text.secondary" sx={{ mr: 1 }}>
                Your Balance:
              </Typography>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 'bold',
                  color: currentUser.unlimitedBalance ? 'success.main' : 'primary.main',
                  fontSize: '1rem'
                }}
              >
                {currentUser.unlimitedBalance ? 'Unlimited' : currentUser.balance}
              </Typography>
            </Box>
          )}
        </DialogTitle>
        <DialogContent>
          {formError && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 2,
                backgroundColor: 'rgba(255, 82, 82, 0.1)',
                color: '#ff5252',
                border: '1px solid rgba(255, 82, 82, 0.3)',
                '& .MuiAlert-icon': {
                  color: '#ff5252'
                }
              }}
              onClose={() => setFormError(null)}
            >
              {formError}
            </Alert>
          )}
          <FormControl fullWidth margin="dense" variant="outlined">
            <InputLabel id="game-label">Game</InputLabel>
            <Select
              labelId="game-label"
              id="game"
              value={game}
              onChange={(e) => setGame(e.target.value)}
              label="Game"
              disabled={formLoading}
            >
              {GAME_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl fullWidth margin="dense" variant="outlined">
            <InputLabel id="expiry-label">Expiry Period</InputLabel>
            <Select
              labelId="expiry-label"
              id="expiry-period"
              value={expiryDays}
              onChange={(e) => handleExpiryDaysChange(e.target.value)}
              label="Expiry Period"
              disabled={formLoading}
            >
              {getExpiryOptions().map((option) => (
                <MenuItem key={option.value} value={option.value} sx={{ py: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <Typography variant="body1">{option.label}</Typography>
                    {currentUser.role === 'admin' && (
                      <Typography variant="body2" sx={{ 
                        color: '#66bb6a', 
                        fontWeight: 'bold',
                        ml: 2,
                        bgcolor: 'rgba(102, 187, 106, 0.1)',
                        px: 1,
                        py: 0.5,
                        borderRadius: 1
                      }}>
                        -{option.cost * (maxDevices || 1)} Balance
                      </Typography>
                    )}
                  </Box>
                </MenuItem>
              ))}
            </Select>
            {currentUser.role === 'admin' && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                These deduction rates are set by your provider.
              </Typography>
            )}
          </FormControl>
          
          {/* Remove the Max Usage TextField and replace with a hidden input */}
          <input type="hidden" value="0" id="max-usage-hidden" />
          
          <FormControl fullWidth margin="dense" variant="outlined">
            <TextField
              id="max-devices"
              label="Devices"
              type="number"
              value={maxDevices}
              onChange={(e) => {
                const value = e.target.value;
                // Allow empty field during typing but default to 1 only when completely empty
                setMaxDevices(value === '' ? '' : parseInt(value) || 1);
              }}
              disabled={formLoading}
              inputProps={{ min: 1 }}
              variant="outlined"
              fullWidth
              helperText={currentUser.role === 'admin' 
                ? "Enter the maximum number of devices allowed. Cost will be multiplied by this number." 
                : "Enter the maximum number of devices allowed"}
            />
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={handleCloseDialog} 
            disabled={formLoading}
            variant="outlined"
            sx={{ 
              borderColor: 'rgba(255, 255, 255, 0.2)',
              color: 'text.secondary'
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreateKey} 
            variant="contained" 
            disabled={formLoading}
            className="generate-key-btn"
            sx={{ minWidth: 150 }}
          >
            {formLoading ? <CircularProgress size={24} /> : 'Generate Key'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={closeDeleteDialog}
        PaperProps={{
          sx: {
            bgcolor: 'rgba(30, 30, 30, 0.95)',
            borderRadius: 2,
            border: '1px solid rgba(255, 82, 82, 0.2)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
            overflow: 'hidden',
            position: 'relative'
          }
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '4px',
            background: 'linear-gradient(90deg, #ff5252, #b71c1c)'
          }}
        />
        <DialogTitle sx={{ color: 'error.main', fontWeight: 'bold' }}>
          Delete License Key
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this license key? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={closeDeleteDialog} 
            disabled={deleteLoading}
            variant="outlined"
            sx={{ 
              borderColor: 'rgba(255, 255, 255, 0.2)',
              color: 'text.secondary'
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteKey} 
            color="error" 
            variant="contained"
            disabled={deleteLoading}
            sx={{
              minWidth: 120,
              bgcolor: 'error.main',
              '&:hover': {
                bgcolor: 'error.dark'
              }
            }}
          >
            {deleteLoading ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
        sx={{
          zIndex: 1400,
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          left: 'auto'
        }}
      >
        <Alert 
          severity={snackbar.severity} 
          variant="filled"
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{
            borderLeft: snackbar.severity === 'success' 
              ? '4px solid #66bb6a' 
              : '4px solid #ff5252',
            fontWeight: 600,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Layout>
  );
};

export default KeyManagement; 