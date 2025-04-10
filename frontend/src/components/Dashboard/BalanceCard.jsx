import React from 'react';
import { Card, CardContent, Typography, Box, Chip, Divider, Tooltip, Alert } from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AllInclusiveIcon from '@mui/icons-material/AllInclusive';
import PersonIcon from '@mui/icons-material/Person';
import WarningIcon from '@mui/icons-material/Warning';
import { LiveCountdown } from '../../pages/Dashboard';

const BalanceCard = ({ balance, duration, unlimitedBalance, createdBy, expiryDate }) => {
  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        bgcolor: 'rgba(30, 30, 30, 0.7)',
        backdropFilter: 'blur(10px)',
        borderRadius: 2,
        border: '1px solid rgba(255, 255, 255, 0.05)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h6" component="div" gutterBottom>
          Your Balance
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {unlimitedBalance ? (
            <>
              <AllInclusiveIcon color="primary" sx={{ mr: 1 }} />
              <Chip 
                label="Unlimited" 
                color="primary" 
                sx={{ 
                  fontWeight: 'bold', 
                  fontSize: '1.2rem',
                  height: '32px'
                }} 
              />
            </>
          ) : (
            <>
              <AccountBalanceWalletIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h4" component="div" fontWeight="bold">
                {balance || 0}
              </Typography>
            </>
          )}
        </Box>
        
        {!unlimitedBalance && balance === 0 && (
          <Alert 
            severity="error" 
            icon={<WarningIcon />}
            sx={{ 
              mt: 1, 
              mb: 2,
              backgroundColor: 'rgba(211, 47, 47, 0.15)', 
              color: '#ff5252',
              border: '1px solid rgba(211, 47, 47, 0.3)',
              '& .MuiAlert-icon': {
                color: '#ff5252'
              }
            }}
          >
            Your balance is empty. Please contact the owner to add more balance.
          </Alert>
        )}
        
        {expiryDate && (
          <Box sx={{ mt: 2, mb: 1 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Time Remaining:
            </Typography>
            <Box sx={{ 
              py: 1.5, 
              px: 1.5, 
              borderRadius: '12px', 
              backgroundColor: 'rgba(0, 0, 0, 0.25)',
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              border: '1px solid rgba(33, 150, 243, 0.15)',
              boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.2)'
            }}>
              <LiveCountdown expiryDateStr={expiryDate} />
            </Box>
          </Box>
        )}
        
        {duration && !unlimitedBalance && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AccessTimeIcon color="action" sx={{ mr: 1, fontSize: '1rem' }} />
            <Typography variant="body2" color="text.secondary">
              Duration: {duration}
            </Typography>
          </Box>
        )}
        
        <Divider sx={{ my: 2 }} />
        
        {createdBy && (
          <Tooltip title="Admin who provided this balance">
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <PersonIcon color="action" sx={{ mr: 1, fontSize: '1rem' }} />
              <Typography variant="body2" color="text.secondary">
                Provided by: <Box component="span" fontWeight="bold">{createdBy}</Box>
              </Typography>
            </Box>
          </Tooltip>
        )}
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          {unlimitedBalance 
            ? "You have unlimited balance for creating license keys." 
            : "This is your available balance for creating license keys."}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default BalanceCard;
