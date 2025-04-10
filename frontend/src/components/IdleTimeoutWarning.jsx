import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Typography, 
  Box, 
  LinearProgress 
} from '@mui/material';
import { AccessTimeOutlined as ClockIcon } from '@mui/icons-material';
import { useIdleTimeout } from '../context/IdleTimeoutContext';

const IdleTimeoutWarning = () => {
  const { showWarning, timeLeft, resetTimer } = useIdleTimeout();
  const [open, setOpen] = useState(false);
  
  // Update dialog visibility when warning state changes
  useEffect(() => {
    setOpen(showWarning);
  }, [showWarning]);
  
  // Calculate progress percentage for the progress bar
  const progressPercentage = Math.max(0, Math.min(100, (timeLeft / 60) * 100));
  
  const handleContinue = () => {
    resetTimer();
    setOpen(false);
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={handleContinue}
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: '12px',
          background: 'rgba(16,16,26,0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.3)',
        }
      }}
    >
      <DialogTitle sx={{ 
        borderBottom: '1px solid rgba(255,255,255,0.1)', 
        display: 'flex',
        alignItems: 'center',
        px: 3,
        py: 2,
        gap: 1.5
      }}>
        <ClockIcon color="warning" />
        <Typography variant="h6">Session Timeout Warning</Typography>
      </DialogTitle>
      
      <DialogContent sx={{ px: 3, py: 2.5 }}>
        <Typography variant="body1" paragraph>
          Your session is about to expire due to inactivity. 
          You will be automatically logged out in:
        </Typography>
        
        <Box sx={{ textAlign: 'center', my: 2 }}>
          <Typography variant="h4" color="warning.main" fontWeight="bold">
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </Typography>
        </Box>
        
        <LinearProgress 
          variant="determinate" 
          value={progressPercentage} 
          color="warning"
          sx={{ 
            height: 8, 
            borderRadius: 4,
            my: 1.5,
            backgroundColor: 'rgba(255,255,255,0.1)' 
          }}
        />
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Click "Continue Session" to stay logged in or you will be automatically logged out.
        </Typography>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <Button 
          onClick={handleContinue} 
          variant="contained" 
          color="primary" 
          fullWidth
          sx={{
            py: 1,
            borderRadius: '8px'
          }}
        >
          Continue Session
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default IdleTimeoutWarning; 