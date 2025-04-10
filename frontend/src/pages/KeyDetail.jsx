import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Box, 
  Paper, 
  Typography, 
  Grid, 
  Button, 
  TextField, 
  FormControlLabel, 
  FormControl,
  Switch, 
  CircularProgress, 
  Alert, 
  Card, 
  CardContent, 
  CardActions,
  Divider, 
  IconButton, 
  Tooltip, 
  Snackbar,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  useTheme,
  useMediaQuery,
  Container,
  Chip
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { 
  Save as SaveIcon, 
  Delete as DeleteIcon, 
  ArrowBack as ArrowBackIcon, 
  ContentCopy as CopyIcon,
  History as HistoryIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Key as KeyIcon,
  CalendarToday as CalendarTodayIcon
} from '@mui/icons-material';
import { getKeyById, updateKey, deleteKey, validateKey } from '../api/keys';
import Layout from '../components/Layout';

const KeyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const isMd = useMediaQuery(theme.breakpoints.down('md'));
  
  const [key, setKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);
  
  // Form state
  const [isActive, setIsActive] = useState(true);
  const [expiryDate, setExpiryDate] = useState(null);
  const [maxUsage, setMaxUsage] = useState('');
  
  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Validate dialog
  const [validateDialogOpen, setValidateDialogOpen] = useState(false);
  const [validateLoading, setValidateLoading] = useState(false);
  const [validateResult, setValidateResult] = useState(null);
  
  // Snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Fetch key on component mount
  useEffect(() => {
    const fetchKey = async () => {
      try {
        setLoading(true);
        const response = await getKeyById(id);
        
        if (response.success) {
          setKey(response.key);
          
          // Set form values
          setIsActive(response.key.isActive);
          setExpiryDate(new Date(response.key.expiresAt));
          setMaxUsage(response.key.maxUsage.toString());
        }
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchKey();
  }, [id]);
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaveLoading(true);
      
      const keyData = {
        name: key.name,
        description: key.description,
        isActive,
        expiresAt: expiryDate.toISOString(),
        maxUsage: maxUsage === '' ? 0 : parseInt(maxUsage)
      };
      
      const response = await updateKey(id, keyData);
      
      if (response.success) {
        setKey(response.key);
        setSnackbar({
          open: true,
          message: 'Key updated successfully',
          severity: 'success'
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Failed to update key: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setSaveLoading(false);
    }
  };
  
  // Handle key deletion
  const handleDeleteDialogOpen = () => {
    setDeleteDialogOpen(true);
  };
  
  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
  };
  
  const handleDeleteKey = async () => {
    try {
      setDeleteLoading(true);
      
      const response = await deleteKey(id);
      
      if (response.success) {
        setSnackbar({
          open: true,
          message: 'Key deleted successfully',
          severity: 'success'
        });
        
        // Navigate back to key management
        setTimeout(() => {
          navigate('/keys');
        }, 1000);
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Failed to delete key: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
    }
  };
  
  // Handle key validation
  const handleValidateDialogOpen = () => {
    setValidateDialogOpen(true);
    setValidateResult(null);
  };
  
  const handleValidateDialogClose = () => {
    setValidateDialogOpen(false);
  };
  
  const handleValidateKey = async () => {
    try {
      setValidateLoading(true);
      
      const response = await validateKey(key.key);
      
      setValidateResult({
        success: response.success,
        message: response.message
      });
    } catch (error) {
      setValidateResult({
        success: false,
        message: error.message
      });
    } finally {
      setValidateLoading(false);
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
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  // Check if key is valid
  const isKeyValid = () => {
    if (!key) return false;
    return key.isActive && new Date(key.expiresAt) > new Date();
  };
  
  return (
    <Layout title="Key Details">
      <Container maxWidth="lg" sx={{ 
        py: { xs: 3, sm: 4, md: 5 },
        px: { xs: 2, sm: 3 }
      }}>
        {loading ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center', 
            py: { xs: 8, sm: 10 },
            gap: 2
          }}>
            <CircularProgress size={40} sx={{ color: 'primary.main' }} />
            <Typography variant="body1" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
              Loading key details...
            </Typography>
          </Box>
        ) : error ? (
          <Alert 
            severity="error" 
            sx={{ 
              my: 2, 
              maxWidth: '600px', 
              mx: 'auto',
              borderRadius: '10px',
              backgroundColor: 'rgba(211, 47, 47, 0.1)',
              color: '#ff5252',
              border: '1px solid rgba(211, 47, 47, 0.3)',
              '& .MuiAlert-icon': {
                color: '#ff5252'
              }
            }}
          >
            {error}
          </Alert>
        ) : !key ? (
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: 3,
              py: { xs: 4, sm: 6 }, 
              textAlign: 'center',
              maxWidth: '500px', 
              mx: 'auto'
            }}
          >
            <Alert 
              severity="info" 
              sx={{ 
                width: '100%',
                backgroundColor: 'rgba(3, 169, 244, 0.1)',
                color: '#03a9f4',
                border: '1px solid rgba(3, 169, 244, 0.3)',
                borderRadius: '10px',
                px: { xs: 2, sm: 3 },
                py: { xs: 1.5, sm: 2 },
                alignItems: 'center',
                '& .MuiAlert-icon': {
                  color: '#03a9f4',
                  fontSize: { xs: '1.1rem', sm: '1.3rem' },
                  mr: { xs: 1, sm: 2 }
                }
              }}
            >
              Key not found or you don't have permission to view it.
            </Alert>
            <Button 
              startIcon={<ArrowBackIcon />} 
              variant="contained" 
              color="primary" 
              component={Link} 
              to="/keys"
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                fontSize: { xs: '0.9rem', sm: '1rem' },
                px: { xs: 2.5, sm: 3 },
                py: { xs: 1, sm: 1.2 },
                background: 'linear-gradient(90deg, rgba(0, 195, 255, 0.9), rgba(0, 118, 255, 0.9))',
                '&:hover': {
                  background: 'linear-gradient(90deg, rgba(0, 195, 255, 1), rgba(0, 118, 255, 1))',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
                }
              }}
            >
              Back to Keys
            </Button>
          </Box>
        ) : (
          <>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: { xs: 'flex-start', sm: 'center' },
              flexDirection: { xs: 'column', sm: 'row' },
              gap: { xs: 2, sm: 0 },
              mb: { xs: 3, sm: 4 }, 
              mt: { xs: 0.5, sm: 0 }
            }}>
              <Button 
                component={Link} 
                to="/keys" 
                startIcon={<ArrowBackIcon sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }} />}
                sx={{
                  color: 'text.secondary',
                  borderRadius: '8px',
                  fontSize: { xs: '0.85rem', sm: '0.9rem' },
                  textTransform: 'none',
                  py: { xs: 0.8, sm: 1 },
                  px: { xs: 1.5, sm: 2 },
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    color: 'text.primary'
                  }
                }}
              >
                Back to Keys
              </Button>
              
              <Box sx={{ 
                display: 'flex', 
                gap: { xs: 1.5, sm: 2 }, 
                width: { xs: '100%', sm: 'auto' } 
              }}>
                <Button 
                  startIcon={<KeyIcon sx={{ fontSize: { xs: '1.1rem', sm: '1.2rem' } }} />}
                  sx={{
                    borderRadius: '8px',
                    borderColor: 'rgba(3, 169, 244, 0.5)',
                    color: '#03a9f4',
                    textTransform: 'none',
                    fontSize: { xs: '0.85rem', sm: '0.9rem' },
                    py: { xs: 0.8, sm: 1 },
                    flex: { xs: 1, sm: 'auto' },
                    '&:hover': {
                      borderColor: 'rgba(3, 169, 244, 0.8)',
                      backgroundColor: 'rgba(3, 169, 244, 0.05)'
                    }
                  }}
                  variant="outlined"
                  onClick={handleValidateDialogOpen}
                >
                  Validate
                </Button>
                
                <Button 
                  startIcon={<DeleteIcon sx={{ fontSize: { xs: '1.1rem', sm: '1.2rem' } }} />}
                  sx={{
                    borderRadius: '8px',
                    borderColor: 'rgba(211, 47, 47, 0.5)',
                    color: '#ff5252',
                    textTransform: 'none',
                    fontSize: { xs: '0.85rem', sm: '0.9rem' },
                    py: { xs: 0.8, sm: 1 },
                    flex: { xs: 1, sm: 'auto' },
                    '&:hover': {
                      borderColor: 'rgba(211, 47, 47, 0.8)',
                      backgroundColor: 'rgba(211, 47, 47, 0.05)'
                    }
                  }}
                  variant="outlined"
                  onClick={handleDeleteDialogOpen}
                >
                  Delete
                </Button>
              </Box>
            </Box>
            
            <Card sx={{ 
              bgcolor: 'rgba(16, 16, 38, 0.6)',
              backdropFilter: 'blur(10px)',
              borderRadius: { xs: '10px', sm: '12px' },
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '3px',
                  background: 'linear-gradient(90deg, rgba(0, 195, 255, 0.8), rgba(0, 118, 255, 0.8))'
                }}
              />
              
              <CardContent sx={{ px: { xs: 2.5, sm: 3 }, pt: { xs: 2.5, sm: 3 }, pb: 0 }}>
                <Box sx={{ mb: { xs: 3, sm: 4 } }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: 'text.secondary', 
                      mb: 0.5, 
                      fontSize: { xs: '0.75rem', sm: '0.8rem' },
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}
                  >
                    License Key
                  </Typography>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    backgroundColor: 'rgba(0, 0, 0, 0.2)', 
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    p: { xs: 1.5, sm: 2 },
                    position: 'relative',
                    mb: 1,
                    overflow: 'auto'
                  }}>
                    <Typography 
                      sx={{ 
                        fontFamily: 'monospace', 
                        fontSize: { xs: '0.8rem', sm: '0.9rem' },
                        whiteSpace: 'nowrap',
                        color: 'primary.light',
                        width: '100%',
                        overflow: 'auto',
                        '&::-webkit-scrollbar': {
                          height: '4px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          borderRadius: '4px',
                        }
                      }} 
                    >
                      {key.key}
                    </Typography>
                    <IconButton 
                      size="small" 
                      onClick={() => {
                        navigator.clipboard.writeText(key.key);
                        setSnackbar({
                          open: true,
                          message: 'Key copied to clipboard',
                          severity: 'success'
                        });
                      }}
                      sx={{ 
                        ml: 1.5,
                        color: 'text.secondary',
                        bgcolor: 'rgba(255, 255, 255, 0.05)',
                        '&:hover': {
                          bgcolor: 'rgba(255, 255, 255, 0.1)',
                          color: 'text.primary'
                        },
                        position: 'absolute',
                        right: { xs: 8, sm: 12 },
                        p: { xs: 0.5, sm: 0.75 }
                      }}
                    >
                      <CopyIcon sx={{ fontSize: { xs: '0.9rem', sm: '1.1rem' } }} />
                    </IconButton>
                  </Box>
                  
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box 
                          sx={{ 
                            width: '8px', 
                            height: '8px', 
                            borderRadius: '50%', 
                            backgroundColor: isActive ? '#4caf50' : '#ff5252' 
                          }} 
                        />
                        <Typography sx={{ 
                          fontSize: { xs: '0.85rem', sm: '0.9rem' }, 
                          color: 'text.secondary'
                        }}>
                          Status: <Box component="span" sx={{ color: 'text.primary', fontWeight: 'medium' }}>
                            {isActive ? 'Active' : 'Inactive'}
                          </Box>
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Typography sx={{ 
                        fontSize: { xs: '0.85rem', sm: '0.9rem' }, 
                        color: 'text.secondary'
                      }}>
                        Created: <Box component="span" sx={{ color: 'text.primary', fontWeight: 'medium' }}>
                          {formatDate(key.createdAt)}
                        </Box>
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography sx={{ 
                          fontSize: { xs: '0.85rem', sm: '0.9rem' }, 
                          color: 'text.secondary'
                        }}>
                          Expires: <Box component="span" sx={{ color: 'text.primary', fontWeight: 'medium' }}>
                            {key.expiresAt ? formatDate(key.expiresAt) : 'Never'}
                          </Box>
                        </Typography>
                        {key.expiresAt && new Date(key.expiresAt) < new Date() && (
                          <Chip 
                            label="Expired" 
                            size="small" 
                            sx={{ 
                              backgroundColor: 'rgba(211, 47, 47, 0.1)', 
                              color: '#ff5252',
                              height: '20px',
                              '& .MuiChip-label': {
                                px: 1,
                                fontSize: '0.7rem'
                              }
                            }} 
                          />
                        )}
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Typography sx={{ 
                        fontSize: { xs: '0.85rem', sm: '0.9rem' }, 
                        color: 'text.secondary'
                      }}>
                        Usage Count: <Box component="span" sx={{ color: 'text.primary', fontWeight: 'medium' }}>
                          {key.usageCount} / {key.maxUsage > 0 ? key.maxUsage : '∞'}
                        </Box>
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
                
                <Divider sx={{ 
                  my: { xs: 2, sm: 3 }, 
                  borderColor: 'rgba(255, 255, 255, 0.08)'
                }} />
                
                <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: 'text.secondary', 
                      mb: 1.5, 
                      fontSize: { xs: '0.75rem', sm: '0.8rem' },
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}
                  >
                    Usage Statistics
                  </Typography>
                  <Card sx={{ 
                    bgcolor: 'rgba(0, 0, 0, 0.2)', 
                    borderRadius: '8px', 
                    boxShadow: 'none',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                  }}>
                    <CardContent sx={{ 
                      p: { xs: 1.5, sm: 2 }, 
                      '&:last-child': { pb: { xs: 1.5, sm: 2 } },
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      gap: { xs: 2, sm: 4 }
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <HistoryIcon sx={{ 
                          color: 'primary.main', 
                          fontSize: { xs: '1.2rem', sm: '1.4rem' }
                        }} />
                        <Box>
                          <Typography sx={{ 
                            fontSize: { xs: '0.8rem', sm: '0.85rem' }, 
                            color: 'text.secondary',
                            lineHeight: 1.2
                          }}>
                            Usage Count
                          </Typography>
                          <Typography sx={{ 
                            fontSize: { xs: '1rem', sm: '1.1rem' }, 
                            fontWeight: 'medium',
                            color: 'text.primary',
                            mt: 0.5
                          }}>
                            {key.usageCount} / {key.maxUsage > 0 ? key.maxUsage : '∞'}
                          </Typography>
                        </Box>
                      </Box>
                      
                      {key.lastUsed && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Typography sx={{ 
                            fontSize: { xs: '0.85rem', sm: '0.9rem' }, 
                            color: 'text.secondary',
                            lineHeight: 1.2
                          }}>
                            Last Used
                          </Typography>
                          <Typography sx={{ 
                            fontSize: { xs: '1rem', sm: '1.1rem' }, 
                            fontWeight: 'medium',
                            color: 'text.primary',
                            mt: 0.5
                          }}>
                            {formatDate(key.lastUsed)}
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Box>
                
                <Divider sx={{ 
                  my: { xs: 2, sm: 3 }, 
                  borderColor: 'rgba(255, 255, 255, 0.08)'
                }} />
                
                <Box sx={{ mb: { xs: 1, sm: 2 } }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: 'text.secondary', 
                      mb: 2, 
                      fontSize: { xs: '0.75rem', sm: '0.8rem' },
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}
                  >
                    Edit Key
                  </Typography>
                  
                  <FormControl fullWidth sx={{ mb: { xs: 1.5, sm: 2 } }}>
                    <FormControlLabel
                      control={
                        <Switch 
                          checked={isActive} 
                          onChange={(e) => setIsActive(e.target.checked)}
                          color="primary"
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: '#4caf50',
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: 'rgba(76, 175, 80, 0.5)',
                            },
                          }}
                        />
                      }
                      label={
                        <Typography sx={{ fontSize: { xs: '0.85rem', sm: '0.9rem' } }}>
                          Active
                        </Typography>
                      }
                      sx={{ ml: 0 }}
                    />
                  </FormControl>
                  
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <MobileDatePicker
                      label="Expiry Date"
                      value={expiryDate ? new Date(expiryDate) : null}
                      onChange={(date) => setExpiryDate(date)}
                      format="MM/dd/yyyy"
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          margin: 'normal',
                          InputLabelProps: {
                            sx: { 
                              fontSize: { xs: '0.85rem', sm: '0.9rem' },
                              color: 'text.secondary'
                            }
                          },
                          InputProps: {
                            sx: { 
                              fontSize: { xs: '0.85rem', sm: '0.9rem' },
                              borderRadius: '8px',
                              backgroundColor: 'rgba(0, 0, 0, 0.1)',
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(255, 255, 255, 0.1)'
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(255, 255, 255, 0.2)'
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'primary.main'
                              }
                            }
                          },
                          size: "small",
                          sx: { mb: { xs: 1.5, sm: 2 } }
                        }
                      }}
                    />
                  </LocalizationProvider>
                  
                  <TextField
                    label="Max Usage (0 for unlimited)"
                    value={maxUsage}
                    onChange={(e) => setMaxUsage(e.target.value)}
                    type="number"
                    fullWidth
                    margin="normal"
                    InputProps={{
                      sx: { 
                        fontSize: { xs: '0.85rem', sm: '0.9rem' },
                        borderRadius: '8px',
                        backgroundColor: 'rgba(0, 0, 0, 0.1)',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255, 255, 255, 0.1)'
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255, 255, 255, 0.2)'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main'
                        }
                      }
                    }}
                    InputLabelProps={{
                      sx: { 
                        fontSize: { xs: '0.85rem', sm: '0.9rem' },
                        color: 'text.secondary'
                      }
                    }}
                    size="small"
                  />
                </Box>
              </CardContent>
              
              <CardActions sx={{ 
                display: 'flex', 
                justifyContent: 'flex-end',
                px: { xs: 2.5, sm: 3 },
                pb: { xs: 2.5, sm: 3 } 
              }}>
                <Button 
                  onClick={handleSubmit} 
                  variant="contained" 
                  disabled={saveLoading}
                  sx={{
                    borderRadius: '8px',
                    textTransform: 'none',
                    px: { xs: 3, sm: 4 },
                    py: { xs: 1, sm: 1.2 },
                    fontSize: { xs: '0.85rem', sm: '0.9rem' },
                    fontWeight: 'medium',
                    background: 'linear-gradient(90deg, rgba(0, 195, 255, 0.9), rgba(0, 118, 255, 0.9))',
                    '&:hover': {
                      background: 'linear-gradient(90deg, rgba(0, 195, 255, 1), rgba(0, 118, 255, 1))',
                      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
                    },
                    minWidth: { xs: '120px', sm: '150px' }
                  }}
                >
                  {saveLoading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Save Changes'}
                </Button>
              </CardActions>
            </Card>
          </>
        )}
        
        {/* Delete Confirmation Dialog */}
        <Dialog 
          open={deleteDialogOpen} 
          onClose={handleDeleteDialogClose}
          PaperProps={{
            sx: {
              bgcolor: 'rgba(16, 16, 38, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: { xs: '10px', sm: '12px' },
              border: '1px solid rgba(255, 82, 82, 0.3)',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
              overflow: 'hidden',
              position: 'relative',
              maxWidth: '450px',
              width: { xs: 'calc(100% - 32px)', sm: '450px' },
              margin: { xs: '16px', sm: '32px' }
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
              background: 'linear-gradient(90deg, #ff5252, #ff0000)'
            }}
          />
          <DialogTitle sx={{ 
            fontSize: { xs: '1.1rem', sm: '1.25rem' }, 
            fontWeight: 'bold', 
            pt: { xs: 2.5, sm: 3 },
            px: { xs: 2.5, sm: 3 },
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <DeleteIcon sx={{ color: 'error.main', fontSize: { xs: '1.2rem', sm: '1.4rem' } }} />
            Delete Key
          </DialogTitle>
          <DialogContent sx={{ pb: { xs: 1, sm: 2 }, px: { xs: 2.5, sm: 3 } }}>
            <Typography sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
              Are you sure you want to delete this key? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: { xs: 2.5, sm: 3 }, pb: { xs: 2.5, sm: 3 }, gap: 1.5 }}>
            <Button 
              onClick={handleDeleteDialogClose} 
              disabled={deleteLoading}
              variant="outlined"
              sx={{ 
                borderColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                textTransform: 'none',
                fontSize: { xs: '0.85rem', sm: '0.9rem' },
                py: { xs: 1, sm: 0.75 },
                flex: { xs: 1, sm: 'auto' },
                color: 'text.primary',
                '&:hover': {
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)'
                }
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
                borderRadius: '8px',
                textTransform: 'none',
                px: { xs: 2, sm: 3 },
                py: { xs: 1, sm: 0.75 },
                fontSize: { xs: '0.85rem', sm: '0.9rem' },
                fontWeight: 'medium',
                flex: { xs: 1, sm: 'auto' },
                backgroundColor: 'rgb(211, 47, 47)',
                '&:hover': {
                  backgroundColor: 'rgb(229, 57, 53)'
                }
              }}
            >
              {deleteLoading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Validate Key Dialog */}
        <Dialog 
          open={validateDialogOpen} 
          onClose={handleValidateDialogClose}
          PaperProps={{
            sx: {
              bgcolor: 'rgba(16, 16, 38, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: { xs: '10px', sm: '12px' },
              border: '1px solid rgba(0, 195, 255, 0.2)',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
              overflow: 'hidden',
              position: 'relative',
              maxWidth: '450px',
              width: { xs: 'calc(100% - 32px)', sm: '450px' },
              margin: { xs: '16px', sm: '32px' }
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
              background: 'linear-gradient(90deg, rgba(0, 195, 255, 1), rgba(0, 118, 255, 1))'
            }}
          />
          <DialogTitle sx={{ 
            fontSize: { xs: '1.1rem', sm: '1.25rem' }, 
            fontWeight: 'bold', 
            pt: { xs: 2.5, sm: 3 },
            px: { xs: 2.5, sm: 3 },
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <HistoryIcon sx={{ color: 'primary.main', fontSize: { xs: '1.2rem', sm: '1.4rem' } }} />
            Validate Key
          </DialogTitle>
          <DialogContent sx={{ pb: validateResult ? 0 : { xs: 1.5, sm: 2 }, px: { xs: 2.5, sm: 3 } }}>
            <Typography sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
              Test validate this key against the API. This will increment the usage counter.
            </Typography>
            
            {validateResult && (
              <Alert 
                severity={validateResult.success ? 'success' : 'error'} 
                sx={{ 
                  mt: { xs: 2, sm: 3 },
                  mb: { xs: 1.5, sm: 2 },
                  py: { xs: 1, sm: 1.25 },
                  px: { xs: 1.5, sm: 2 },
                  backgroundColor: validateResult.success 
                    ? 'rgba(102, 187, 106, 0.1)'
                    : 'rgba(255, 82, 82, 0.1)',
                  color: validateResult.success ? '#66bb6a' : '#ff5252',
                  border: `1px solid ${validateResult.success 
                    ? 'rgba(102, 187, 106, 0.3)'
                    : 'rgba(255, 82, 82, 0.3)'}`,
                  '& .MuiAlert-icon': {
                    color: validateResult.success ? '#66bb6a' : '#ff5252',
                    fontSize: { xs: '1rem', sm: '1.25rem' }
                  },
                  borderRadius: '8px',
                  fontSize: { xs: '0.85rem', sm: '0.9rem' }
                }}
              >
                {validateResult.message}
              </Alert>
            )}
          </DialogContent>
          <DialogActions sx={{ px: { xs: 2.5, sm: 3 }, pb: { xs: 2.5, sm: 3 }, gap: 1.5 }}>
            <Button 
              onClick={handleValidateDialogClose}
              variant="outlined"
              sx={{ 
                borderColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                textTransform: 'none',
                fontSize: { xs: '0.85rem', sm: '0.9rem' },
                py: { xs: 1, sm: 0.75 },
                flex: { xs: 1, sm: 'auto' },
                color: 'text.primary',
                '&:hover': {
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)'
                }
              }}
            >
              Close
            </Button>
            <Button 
              onClick={handleValidateKey} 
              variant="contained"
              disabled={validateLoading}
              sx={{ 
                borderRadius: '8px',
                textTransform: 'none',
                px: { xs: 2, sm: 3 },
                py: { xs: 1, sm: 0.75 },
                fontSize: { xs: '0.85rem', sm: '0.9rem' },
                fontWeight: 'medium',
                flex: { xs: 1, sm: 'auto' },
                background: 'linear-gradient(90deg, rgba(0, 195, 255, 1), rgba(0, 118, 255, 1))',
                '&:hover': {
                  background: 'linear-gradient(90deg, rgba(0, 195, 255, 0.9), rgba(0, 118, 255, 0.9))',
                  boxShadow: '0 6px 15px rgba(0, 0, 0, 0.3)'
                }
              }}
              className="generate-key-btn"
            >
              {validateLoading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Validate'}
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          sx={{ 
            mb: { xs: 3, sm: 4 }
          }}
        >
          <Alert 
            severity={snackbar.severity} 
            variant="filled"
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            sx={{ 
              width: '100%',
              borderRadius: '8px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
              fontSize: { xs: '0.85rem', sm: '0.9rem' },
              py: { xs: 1, sm: 1.25 }
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Layout>
  );
};

export default KeyDetail; 