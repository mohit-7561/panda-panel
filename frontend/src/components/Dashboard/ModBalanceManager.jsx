import React, { useState, useEffect, useContext } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField,
  FormControlLabel,
  Switch,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Edit as EditIcon,
  Add as AddIcon,
  Close as CloseIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { 
  setModUnlimitedBalance, 
  addModBalance, 
  getModResellers,
  extendModBalanceExpiry
} from '../../api/mod';
import { AuthContext } from '../../context/AuthContext';

// Styling
const styles = {
  card: {
    backgroundColor: 'rgba(16, 16, 26, 0.8)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  cardHeader: {
    p: 2,
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeaderTitle: {
    color: '#00c3ff',
    fontWeight: 600,
    fontSize: '1.1rem',
    display: 'flex',
    alignItems: 'center',
    gap: 1,
  },
  cardContent: {
    backgroundColor: 'rgba(10, 10, 26, 0.4)',
    flexGrow: 1,
    p: 0,
  },
  tableContainer: {
    backgroundColor: 'transparent',
  },
  tableHeaderCell: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    color: '#00c3ff',
    fontWeight: 600,
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  tableCell: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    color: '#fff',
  },
  badge: {
    display: 'inline-block',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    fontWeight: 600,
    fontSize: '0.85rem',
  },
  unlimitedBadge: {
    backgroundColor: 'rgba(0, 179, 129, 0.2)',
    color: '#00b381',
    border: '1px solid rgba(0, 179, 129, 0.3)',
  },
  buttonAdd: {
    backgroundColor: 'rgba(0, 179, 129, 0.2)',
    color: '#00b381',
    '&:hover': {
      backgroundColor: 'rgba(0, 179, 129, 0.3)',
    }
  },
  modalContent: {
    backgroundColor: '#1e1e2f',
    color: '#fff',
  },
  modalTitle: {
    color: '#00c3ff',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  modalInput: {
    '& .MuiInputBase-input': {
      color: '#fff',
    },
    '& .MuiInputLabel-root': {
      color: 'rgba(255, 255, 255, 0.7)',
    },
    '& .MuiOutlinedInput-root': {
      '& fieldset': {
        borderColor: 'rgba(255, 255, 255, 0.2)',
      },
      '&:hover fieldset': {
        borderColor: 'rgba(255, 255, 255, 0.3)',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#00c3ff',
      },
    },
  },
  modalActions: {
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '16px 24px',
  }
};

const ModBalanceManager = ({ modId, modName, modIcon, resellerData }) => {
  const [resellers, setResellers] = useState(Array.isArray(resellerData) ? resellerData : []);
  
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedReseller, setSelectedReseller] = useState(null);
  const [balanceForm, setBalanceForm] = useState({
    balance: '',
    unlimited: false,
    expiryDays: 30 // Default extension period
  });
  
  // Get refreshModBalance from AuthContext
  const { refreshModBalance } = useContext(AuthContext);
  
  // Update resellers when resellerData prop changes
  useEffect(() => {
    if (resellerData) {
      setResellers(Array.isArray(resellerData) ? resellerData : []);
    }
  }, [resellerData]);
  
  const handleClickOpen = (reseller = null) => {
    if (reseller) {
      setSelectedReseller(reseller);
      setBalanceForm({
        balance: reseller.unlimitedBalance ? 0 : parseInt(reseller.balance) || 0,
        unlimited: !!reseller.unlimitedBalance,
        expiryDays: 30 // Default value for extension
      });
    } else {
      setSelectedReseller(null);
      setBalanceForm({
        balance: '',
        unlimited: false,
        expiryDays: 30
      });
    }
    setOpenDialog(true);
  };
  
  const handleClose = () => {
    setOpenDialog(false);
  };
  
  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;
    
    if (name === 'unlimited') {
      setBalanceForm({
        ...balanceForm,
        [name]: checked
      });
    } else {
      setBalanceForm({
        ...balanceForm,
        [name]: value
      });
    }
  };
  
  const handleSave = async () => {
    try {
      if (selectedReseller) {
        let updatedResellerData = null;
        
        // Call the appropriate API based on whether unlimited balance is set
        if (balanceForm.unlimited) {
          const response = await setModUnlimitedBalance(modId, selectedReseller.id, true);
          if (response.success && response.data) {
            updatedResellerData = response.data;
          }
        } else {
          // Add balance if it has changed
          // Use parseInt to ensure we're comparing numbers
          const currentBalance = parseInt(selectedReseller.balance) || 0;
          const newBalance = parseInt(balanceForm.balance) || 0;
          
          if (newBalance !== currentBalance) {
            const balanceDiff = newBalance - currentBalance;
            if (balanceDiff !== 0) {
              const response = await addModBalance(modId, selectedReseller.id, balanceDiff);
              if (response.success && response.data) {
                updatedResellerData = response.data;
              }
            }
          }
          
          // If was unlimited before, now set to limited
          if (selectedReseller.unlimitedBalance) {
            const response = await setModUnlimitedBalance(modId, selectedReseller.id, false);
            if (response.success && response.data) {
              updatedResellerData = response.data;
            }
          }
        }
        
        // Handle expiry date extension if specified
        if (balanceForm.expiryDays && parseInt(balanceForm.expiryDays) > 0) {
          const days = parseInt(balanceForm.expiryDays);
          const response = await extendModBalanceExpiry(modId, selectedReseller.id, days);
          const months = days === 30 ? "1 month" : "2 months";
          toast.success(`Extended expiry by ${months}`);
          if (response.success && response.data) {
            updatedResellerData = response.data;
          }
        }
        
        // If we received updated data directly from the API, update the UI immediately
        if (updatedResellerData) {
          // Create a modified reseller object with correctly formatted balance
          const updatedReseller = {
            ...updatedResellerData,
            balance: updatedResellerData.unlimitedBalance ? 0 : parseInt(updatedResellerData.balance) || 0,
            expiryDate: updatedResellerData.expiresAt || selectedReseller.expiryDate || 'No expiry'
          };
          
          setResellers(prevResellers => 
            prevResellers.map(reseller => 
              reseller.id === updatedReseller.id ? updatedReseller : reseller
            )
          );
          
          // Also refresh the mod balance in the auth context if user is the one being updated
          refreshModBalance(modId);
          
          toast.success('Reseller balance updated successfully');
        } else {
          // Fallback: Fetch all resellers from server
          const updatedResellers = await getModResellers(modId);
          
          // Make sure each reseller has the balance as a number
          const formattedResellers = updatedResellers.map(reseller => ({
            ...reseller,
            balance: reseller.unlimitedBalance ? 0 : parseInt(reseller.balance) || 0
          }));
          
          setResellers(formattedResellers);
          
          // Also refresh the mod balance in the auth context
          refreshModBalance(modId);
          
          toast.success('Reseller balance updated successfully');
        }
      }
    } catch (error) {
      toast.error('Failed to update reseller balance');
          }
    
    handleClose();
  };
  
  return (
    <Card sx={styles.card}>
      <Box sx={styles.cardHeader}>
        <Typography sx={styles.cardHeaderTitle}>
          {modIcon}
          {modName} Reseller Balances
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => handleClickOpen()}
          sx={styles.buttonAdd}
          size="small"
        >
          Add Balance
        </Button>
      </Box>
      <CardContent sx={styles.cardContent}>
        <TableContainer sx={styles.tableContainer}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={styles.tableHeaderCell}>Reseller</TableCell>
                <TableCell sx={styles.tableHeaderCell}>Balance</TableCell>
                <TableCell sx={styles.tableHeaderCell}>Expiry</TableCell>
                <TableCell sx={styles.tableHeaderCell}>Registered</TableCell>
                <TableCell sx={styles.tableHeaderCell} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {resellers.length > 0 ? (
                resellers.map((reseller) => (
                  <TableRow key={reseller.id}>
                    <TableCell sx={styles.tableCell}>{reseller.username}</TableCell>
                    <TableCell sx={styles.tableCell}>
                      {reseller.unlimitedBalance ? (
                        <Box component="span" sx={{...styles.badge, ...styles.unlimitedBadge}}>Unlimited</Box>
                      ) : (
                        reseller.balance
                      )}
                    </TableCell>
                    <TableCell sx={styles.tableCell}>
                      <Box sx={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                        {reseller.expiryDate || 'No expiry'}
                      </Box>
                    </TableCell>
                    <TableCell sx={styles.tableCell}>
                      <Box sx={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                        {reseller.createdAt ? new Date(reseller.createdAt).toLocaleDateString() : 'Unknown'}
                      </Box>
                    </TableCell>
                    <TableCell sx={styles.tableCell} align="right">
                      <IconButton 
                        size="small" 
                        onClick={() => handleClickOpen(reseller)}
                        sx={{ color: '#00c3ff' }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.7)' }}>
                    No resellers found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
      
      {/* Edit/Add Balance Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleClose} 
        PaperProps={{ 
          sx: styles.modalContent 
        }}
      >
        <DialogTitle sx={styles.modalTitle}>
          {selectedReseller ? `Edit ${modName} Balance for ${selectedReseller.username}` : `Add ${modName} Balance`}
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'rgba(255, 255, 255, 0.7)',
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Switch 
                  checked={balanceForm.unlimited} 
                  onChange={handleInputChange} 
                  name="unlimited" 
                />
              }
              label="Unlimited Balance"
            />
          </Box>
          
          {!balanceForm.unlimited && (
            <TextField
              margin="dense"
              name="balance"
              label="Balance"
              type="number"
              fullWidth
              variant="outlined"
              value={balanceForm.balance}
              onChange={handleInputChange}
              sx={styles.modalInput}
              InputProps={{
                inputProps: { min: 0 }
              }}
            />
          )}
          
          {/* Replace text input with dropdown */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'rgba(255, 255, 255, 0.7)' }}>
              Extend Expiry
            </Typography>
            <FormControl fullWidth variant="outlined" sx={styles.modalInput}>
              <InputLabel id="expiry-duration-label">Duration</InputLabel>
              <Select
                labelId="expiry-duration-label"
                name="expiryDays"
                value={balanceForm.expiryDays}
                onChange={handleInputChange}
                label="Duration"
                startAdornment={
                  <AccessTimeIcon 
                    sx={{ ml: 1, mr: 1, color: 'rgba(255, 255, 255, 0.5)', fontSize: '1.2rem' }} 
                  />
                }
              >
                <MenuItem value={30}>1 Month</MenuItem>
                <MenuItem value={60}>2 Months</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          {/* Show current expiry if available */}
          {selectedReseller && selectedReseller.expiryDate && (
            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.85rem' }}>
              Current expiry: {selectedReseller.expiryDate}
            </Box>
          )}

          {/* Show registration date if available */}
          {selectedReseller && selectedReseller.createdAt && (
            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.85rem' }}>
              Registration date: {new Date(selectedReseller.createdAt).toLocaleDateString()}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={styles.modalActions}>
          <Button onClick={handleClose} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default ModBalanceManager; 