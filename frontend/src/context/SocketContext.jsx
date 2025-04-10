import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import logger from '../utils/logger';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [socket, setSocket] = useState(null);
  
  useEffect(() => {
    // Initialize socket connection
    // Make sure we use the actual base URL, not the API URL with /api suffix
    const baseUrl = import.meta.env.VITE_API_URL 
      ? import.meta.env.VITE_API_URL.replace(/\/api$/, '') 
      : 'http://localhost:5000';
    
    logger.info('Socket connecting to:', baseUrl);
    
    const socketInstance = io(baseUrl, {
      autoConnect: false,
      withCredentials: true,
      transports: ['polling'], // Use only polling for Vercel serverless compatibility
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000,
      forceNew: true
    });
    
    // Add event listeners for connection status
    socketInstance.on('connect', () => {
      logger.info('Socket connected successfully');
    });
    
    socketInstance.on('connect_error', (error) => {
      logger.error('Socket connection error:', error);
      // Try to reconnect after a delay
      setTimeout(() => {
        if (socketInstance && !socketInstance.connected) {
          logger.info('Attempting to reconnect socket...');
          socketInstance.connect();
        }
      }, 3000);
    });
    
    socketInstance.on('disconnect', (reason) => {
      logger.info('Socket disconnected:', reason);
      // Reconnect if disconnected for errors
      if (reason === 'io server disconnect' || reason === 'transport close') {
        setTimeout(() => {
          if (socketInstance) {
            logger.info('Attempting to reconnect after disconnect...');
            socketInstance.connect();
          }
        }, 3000);
      }
    });

    socketInstance.on('error', (error) => {
      logger.error('Socket error:', error);
    });
    
    setSocket(socketInstance);
    
    // Cleanup on unmount
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, []);
  
  // Connect/disconnect based on user auth state
  useEffect(() => {
    if (!socket) return;
    
    if (currentUser?._id) {
      // User is logged in, connect and join their room
      socket.connect();
      
      // Wait for socket to connect before joining room
      if (socket.connected) {
        socket.emit('join', currentUser._id);
        logger.info('Joining room for user:', currentUser._id);
      } else {
        socket.on('connect', () => {
          socket.emit('join', currentUser._id);
          logger.info('Joining room for user after connect:', currentUser._id);
        });
      }
    } else {
      // User is logged out, disconnect
      if (socket.connected) {
        socket.disconnect();
      }
    }
    
    // Implement fallback for real-time updates if socket fails
    let pollingInterval;
    const MAX_RETRIES = 3;
    let retries = 0;
    
    const checkConnection = () => {
      if (socket && !socket.connected && retries < MAX_RETRIES) {
        retries++;
        logger.warn(`Socket not connected. Retry attempt ${retries}/${MAX_RETRIES}`);
        socket.connect();
      } else if (retries >= MAX_RETRIES) {
        logger.warn('Socket connection failed after maximum retries');
        // Could implement fallback polling through REST API here
      }
    };
    
    if (currentUser?._id) {
      pollingInterval = setInterval(checkConnection, 10000);
    }
    
    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [currentUser, socket]);
  
  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext; 