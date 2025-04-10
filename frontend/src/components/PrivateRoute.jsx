import { useContext } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Box, CircularProgress, Typography } from '@mui/material';

const PrivateRoute = ({ children, requireRole }) => {
  const { isAuthenticated, isLoading, currentUser } = useContext(AuthContext);
  const params = useParams();
  
  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100vh' 
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading...
        </Typography>
      </Box>
    );
  }
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  // If a specific role is required, check if the user has that role
  if (requireRole && currentUser?.role !== requireRole) {
    return <Navigate to="/dashboard" />;
  }
  
  // If authenticated and role check passes, render the child components
  // If children is a function, pass the params
  return typeof children === 'function' ? children({ params }) : children;
};

export default PrivateRoute; 