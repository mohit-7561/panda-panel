import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Tooltip,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
  InputAdornment,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider
} from '@mui/material';
import { 
  Add as AddIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  AllInclusive as AllInclusiveIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Block as BlockIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';

import { getCreatedUsers, addBalance, setUnlimitedBalance } from '../../api/balance';

// Add function to update reseller active status
const toggleResellerStatus = async (userId, isActive) => {
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/balance/toggle-active`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ userId, active: isActive })
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Failed to update reseller status'
    };
  }
};

// List of available mods
const MOD_OPTIONS = [
  { id: 'all', name: 'All Mods' },
  { id: 'winstar', name: 'WinStar' },
  { id: 'ioszero', name: 'iOS Zero' },
  { id: 'godeye', name: 'GodEye' },
  { id: 'vision', name: 'Vision' },
  { id: 'lethal', name: 'Lethal' },
  { id: 'deadeye', name: 'Deadeye' }
];

const ResellerManagement = () => {
  const [resellers, setResellers] = useState([]);
  const [filteredResellers, setFilteredResellers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMod, setSelectedMod] = useState('all');
  const [loading, setLoading] = useState(false);
  const [openAddBalanceDialog, setOpenAddBalanceDialog] = useState(false);
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [selectedReseller, setSelectedReseller] = useState(null);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [isUnlimitedBalance, setIsUnlimitedBalance] = useState(false);
  const [isStatusActive, setIsStatusActive] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Load resellers
  const loadResellers = async () => {
    setLoading(true);
    try {
      const response = await getCreatedUsers();
      if (response.success) {
        // Filter out only admin (reseller) users
        const adminUsers = response.users.filter(user => user.role === 'admin');
        setResellers(adminUsers);
        setFilteredResellers(adminUsers); // Initialize filtered list with all resellers
      } else {
        setSnackbar({
          open: true,
          message: response.message || 'Failed to load resellers',
          severity: 'error'
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error loading resellers',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Load resellers on component mount
  useEffect(() => {
    loadResellers();
  }, []);

  // Filter resellers based on search query and selected mod
  useEffect(() => {
    let filtered = resellers;

    // First filter by search query if provided
    if (searchQuery.trim() !== '') {
      const lowerCaseQuery = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(reseller => 
        reseller.username.toLowerCase().includes(lowerCaseQuery)
      );
    }

    // Then filter by selected mod if not 'all'
    if (selectedMod !== 'all') {
      filtered = filtered.filter(reseller => {
        // Check if reseller has modBalances array and if the selected mod exists in it
        return reseller.modBalances && 
               reseller.modBalances.some(modBalance => modBalance.modId === selectedMod);
      });
    }

    setFilteredResellers(filtered);
  }, [searchQuery, selectedMod, resellers]);

  // Handle search input change
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery('');
  };

  // Handle mod filter change
  const handleModFilterChange = (event) => {
    setSelectedMod(event.target.value);
  };

  // Handle opening the add balance dialog
  const handleOpenAddBalance = (reseller) => {
    setSelectedReseller(reseller);
    setBalanceAmount('');
    setIsUnlimitedBalance(reseller.unlimitedBalance || false);
    setOpenAddBalanceDialog(true);
  };

  // Handle closing the add balance dialog
  const handleCloseAddBalance = () => {
    setOpenAddBalanceDialog(false);
    setSelectedReseller(null);
    setBalanceAmount('');
    setIsUnlimitedBalance(false);
  };

  // Handle opening status dialog
  const handleOpenStatusDialog = (reseller) => {
    setSelectedReseller(reseller);
    setIsStatusActive(reseller.active);
    setOpenStatusDialog(true);
  };

  // Handle closing status dialog
  const handleCloseStatusDialog = () => {
    setOpenStatusDialog(false);
    setSelectedReseller(null);
  };

  // Handle toggle reseller active status
  const handleToggleStatus = async () => {
    setLoading(true);
    try {
      const response = await toggleResellerStatus(selectedReseller._id, isStatusActive);
      
      if (response.success) {
        // Update local state
        const updatedResellers = resellers.map(reseller => 
          reseller._id === selectedReseller._id 
            ? { ...reseller, active: isStatusActive, status: isStatusActive ? 'active' : 'inactive' }
            : reseller
        );
        
        setResellers(updatedResellers);
        setFilteredResellers(prevFiltered => 
          prevFiltered.map(reseller => 
            reseller._id === selectedReseller._id 
              ? { ...reseller, active: isStatusActive, status: isStatusActive ? 'active' : 'inactive' }
              : reseller
          )
        );
        
        setSnackbar({
          open: true,
          message: `Reseller ${selectedReseller.username} has been ${isStatusActive ? 'activated' : 'deactivated'} successfully`,
          severity: 'success'
        });
        
        handleCloseStatusDialog();
      } else {
        setSnackbar({
          open: true,
          message: response.message || `Failed to ${isStatusActive ? 'activate' : 'deactivate'} reseller`,
          severity: 'error'
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error ${isStatusActive ? 'activating' : 'deactivating'} reseller`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle add balance submission
  const handleAddBalance = async () => {
    // Validate input based on whether unlimited balance is selected
    if (!isUnlimitedBalance) {
      const amount = Number(balanceAmount);
      if (isNaN(amount) || amount <= 0) {
        setSnackbar({
          open: true,
          message: 'Please enter a valid positive number for balance',
          severity: 'error'
        });
        return;
      }
    }

    setLoading(true);
    try {
      // Initialize response
      let response = { success: false };
      let successMessage = '';
      
      // Track which updates were performed
      let balanceUpdated = false;
      let unlimitedUpdated = false;

      // Step 1: Handle unlimited balance change if needed
      if (isUnlimitedBalance !== selectedReseller.unlimitedBalance) {
        const unlimitedResponse = await setUnlimitedBalance(selectedReseller._id, isUnlimitedBalance);
        if (unlimitedResponse.success) {
          unlimitedUpdated = true;
          response = unlimitedResponse; // Use this as our base response
          successMessage += `Unlimited balance ${isUnlimitedBalance ? 'enabled' : 'disabled'}. `;
        } else {
          throw new Error(unlimitedResponse.message || 'Failed to update unlimited balance status');
        }
      }

      // Step 2: Handle balance change if needed (and not set to unlimited)
      if (!isUnlimitedBalance && balanceAmount && Number(balanceAmount) > 0) {
        const balanceResponse = await addBalance(selectedReseller._id, Number(balanceAmount));
        if (balanceResponse.success) {
          balanceUpdated = true;
          response = balanceResponse; // Override the response
          successMessage += `Added ${balanceAmount} to balance. `;
        } else {
          throw new Error(balanceResponse.message || 'Failed to add balance');
        }
      }

      // If nothing was updated, show an error
      if (!balanceUpdated && !unlimitedUpdated) {
        throw new Error('No changes were made');
      }

      // If we got here, at least one operation was successful
      if (response.success) {
        // Update the reseller in the lists
        const updatedResellers = resellers.map(reseller => {
          if (reseller._id === selectedReseller._id) {
            // Start with the current reseller data
            const updatedReseller = { ...reseller };
            
            // Update the balance if it was changed
            if (response.user && response.user.balance !== undefined) {
              updatedReseller.balance = response.user.balance;
            }
            
            // Update unlimited status if it was changed
            if (unlimitedUpdated) {
              updatedReseller.unlimitedBalance = isUnlimitedBalance;
            }
            
            // Calculate new status
            if (!updatedReseller.active) {
              updatedReseller.status = 'inactive';
            } else if (updatedReseller.balance === 0 && !updatedReseller.unlimitedBalance) {
              updatedReseller.status = 'finished';
            } else if (updatedReseller.balanceExpiresAt && new Date(updatedReseller.balanceExpiresAt) < new Date()) {
              updatedReseller.status = 'expired';
            } else {
              updatedReseller.status = 'active';
            }
            
            return updatedReseller;
          }
          return reseller;
        });
        
        setResellers(updatedResellers);
        setFilteredResellers(prevFiltered => 
          prevFiltered.map(reseller => {
            if (reseller._id === selectedReseller._id) {
              const updatedReseller = { ...reseller };
              
              if (response.user && response.user.balance !== undefined) {
                updatedReseller.balance = response.user.balance;
              }
              
              if (unlimitedUpdated) {
                updatedReseller.unlimitedBalance = isUnlimitedBalance;
              }
              
              // Calculate new status
              if (!updatedReseller.active) {
                updatedReseller.status = 'inactive';
              } else if (updatedReseller.balance === 0 && !updatedReseller.unlimitedBalance) {
                updatedReseller.status = 'finished';
              } else if (updatedReseller.balanceExpiresAt && new Date(updatedReseller.balanceExpiresAt) < new Date()) {
                updatedReseller.status = 'expired';
              } else {
                updatedReseller.status = 'active';
              }
              
              return updatedReseller;
            }
            return reseller;
          })
        );
        
        handleCloseAddBalance();
        setSnackbar({
          open: true,
          message: successMessage || 'Reseller updated successfully',
          severity: 'success'
        });
      } else {
        throw new Error('Operation failed');
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || 'Error updating reseller',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle snackbar close
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 2,
        flexDirection: { xs: 'column', md: 'row' },
        gap: 2
      }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
          Reseller Management
        </Typography>
        <Box sx={{ 
          display: 'flex',
          gap: 2,
          width: { xs: '100%', md: 'auto' },
          flexDirection: { xs: 'column', sm: 'row' }
        }}>
          <TextField
            placeholder="Search reseller by username"
            variant="outlined"
            size="small"
            fullWidth
            value={searchQuery}
            onChange={handleSearchChange}
            sx={{ 
              minWidth: { sm: '250px', md: '300px' },
              width: { xs: '100%', sm: 'auto' }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={handleClearSearch}
                    aria-label="clear search"
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          <FormControl 
            size="small" 
            sx={{ 
              minWidth: { sm: '150px' },
              width: { xs: '100%', sm: 'auto' }
            }}
          >
            <InputLabel id="mod-filter-label">Filter by Mod</InputLabel>
            <Select
              labelId="mod-filter-label"
              id="mod-filter"
              value={selectedMod}
              label="Filter by Mod"
              onChange={handleModFilterChange}
              startAdornment={
                <InputAdornment position="start">
                  <FilterListIcon color="action" fontSize="small" />
                </InputAdornment>
              }
            >
              {MOD_OPTIONS.map(mod => (
                <MenuItem key={mod.id} value={mod.id}>
                  {mod.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button 
            startIcon={<RefreshIcon />}
            variant="outlined"
            onClick={loadResellers}
            disabled={loading}
            sx={{ minWidth: { xs: '100%', sm: '120px' } }}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && resellers.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          No resellers found. Create resellers to manage them.
        </Alert>
      ) : !loading && filteredResellers.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          {selectedMod !== 'all' 
            ? `No resellers found for ${MOD_OPTIONS.find(m => m.id === selectedMod)?.name}${searchQuery ? ` matching "${searchQuery}"` : ''}.`
            : `No resellers found matching "${searchQuery}".`
          }
        </Alert>
      ) : (
        <TableContainer component={Paper} sx={{ mt: 2, overflow: 'auto' }}>
          <Table size="medium">
            <TableHead>
              <TableRow>
                <TableCell><Typography fontWeight="bold">Username</Typography></TableCell>
                <TableCell><Typography fontWeight="bold">Balance</Typography></TableCell>
                <TableCell><Typography fontWeight="bold">Status</Typography></TableCell>
                <TableCell><Typography fontWeight="bold">Mods</Typography></TableCell>
                <TableCell><Typography fontWeight="bold">Actions</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredResellers.map((reseller) => (
                <TableRow key={reseller._id}>
                  <TableCell>{reseller.username}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      {reseller.unlimitedBalance ? (
                        <Chip
                          icon={<AllInclusiveIcon />}
                          label="Unlimited"
                          color="success"
                          size="small"
                        />
                      ) : (
                        <Typography>
                          {reseller.balance}
                        </Typography>
                      )}
                      
                      {/* Show expiry date if available */}
                      {reseller.balanceExpiresAt && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                          Expires: {new Date(reseller.balanceExpiresAt).toLocaleDateString()}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      switch(reseller.status) {
                        case 'inactive':
                          return (
                            <Chip 
                              label="Inactive" 
                              color="error"
                              size="small"
                            />
                          );
                        case 'finished':
                          return (
                            <Chip 
                              label="Finished" 
                              color="warning"
                              size="small"
                            />
                          );
                        case 'expired':
                          return (
                            <Chip 
                              label="Expired" 
                              color="error"
                              size="small"
                            />
                          );
                        case 'active':
                        default:
                          return (
                            <Chip 
                              label="Active" 
                              color="success"
                              size="small"
                            />
                          );
                      }
                    })()}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {reseller.modBalances && reseller.modBalances.length > 0 ? (
                        reseller.modBalances.map(modBalance => {
                          // Convert mod ID to proper name
                          let modName;
                          switch (modBalance.modId) {
                            case 'winstar':
                              modName = 'WinStar';
                              break;
                            case 'ioszero':
                              modName = 'iOS Zero';
                              break;
                            case 'godeye':
                              modName = 'GodEye';
                              break;
                            case 'vision':
                              modName = 'Vision';
                              break;
                            case 'lethal':
                              modName = 'Lethal';
                              break;
                            case 'deadeye':
                              modName = 'Deadeye';
                              break;
                            default:
                              modName = modBalance.modId.charAt(0).toUpperCase() + modBalance.modId.slice(1);
                          }
                          
                          return (
                            <Chip
                              key={modBalance.modId}
                              label={modName}
                              size="small"
                              color={selectedMod === modBalance.modId ? "primary" : "default"}
                              sx={{ fontSize: '0.7rem' }}
                            />
                          );
                        })
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          None
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex' }}>
                      <Tooltip title="Add Balance">
                        <IconButton 
                          color="primary" 
                          onClick={() => handleOpenAddBalance(reseller)}
                        >
                          <AccountBalanceWalletIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={reseller.active ? "Deactivate Reseller" : "Activate Reseller"}>
                        <IconButton 
                          color={reseller.active ? "error" : "success"}
                          onClick={() => handleOpenStatusDialog(reseller)}
                        >
                          <BlockIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add Balance Dialog */}
      <Dialog open={openAddBalanceDialog} onClose={handleCloseAddBalance} maxWidth="xs" fullWidth>
        <DialogTitle>
          Manage Balance for {selectedReseller?.username}
        </DialogTitle>
        <DialogContent>
          {/* Balance amount input */}
          <TextField
            margin="dense"
            label="Amount to Add"
            type="number"
            fullWidth
            value={balanceAmount}
            onChange={(e) => setBalanceAmount(e.target.value)}
            disabled={loading || isUnlimitedBalance}
            InputProps={{
              inputProps: { min: 1 }
            }}
            sx={{ mt: 1 }}
          />

          <Divider sx={{ my: 2 }} />
          
          {/* Unlimited balance toggle */}
          <FormControlLabel
            control={
              <Switch
                checked={isUnlimitedBalance}
                onChange={(e) => setIsUnlimitedBalance(e.target.checked)}
                color="primary"
                disabled={loading}
              />
            }
            label="Unlimited Balance"
            sx={{ display: 'block', mb: 2 }}
          />
          
          <Divider sx={{ my: 2 }} />
          
          {/* Expiry extension */}
          <Box sx={{ mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Current Expiry: {selectedReseller?.balanceExpiresAt 
                ? new Date(selectedReseller.balanceExpiresAt).toLocaleDateString() 
                : 'No expiry date set'}
            </Typography>
          </Box>

          {/* Show informative alerts */}
          {selectedReseller?.unlimitedBalance && !isUnlimitedBalance && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Disabling unlimited balance will require you to add balance.
            </Alert>
          )}
          
          {!selectedReseller?.unlimitedBalance && isUnlimitedBalance && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Enabling unlimited balance will allow the reseller to generate unlimited keys.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddBalance} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleAddBalance} 
            variant="contained" 
            disabled={loading || (!isUnlimitedBalance && !balanceAmount)}
          >
            {loading ? <CircularProgress size={24} /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toggle Status Dialog */}
      <Dialog open={openStatusDialog} onClose={handleCloseStatusDialog} maxWidth="xs" fullWidth>
        <DialogTitle>
          {isStatusActive ? 'Activate' : 'Deactivate'} {selectedReseller?.username}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ my: 2 }}>
            <Typography variant="body1" gutterBottom>
              {isStatusActive 
                ? 'Activating this reseller will allow them to generate keys and use the platform.'
                : 'Deactivating this reseller will prevent them from generating keys or using the platform.'}
            </Typography>
            
            <FormControlLabel
              control={
                <Switch
                  checked={isStatusActive}
                  onChange={(e) => setIsStatusActive(e.target.checked)}
                  color={isStatusActive ? "success" : "error"}
                />
              }
              label={isStatusActive ? "Active" : "Inactive"}
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseStatusDialog} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleToggleStatus} 
            variant="contained" 
            color={isStatusActive ? "success" : "error"}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : isStatusActive ? 'Activate' : 'Deactivate'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ResellerManagement; 