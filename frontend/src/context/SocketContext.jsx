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
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    
    // Add event listeners for connection status
    socketInstance.on('connect', () => {
      logger.info('Socket connected successfully');
    });
    
    socketInstance.on('connect_error', (error) => {
      logger.error('Socket connection error:', error);
    });
    
    socketInstance.on('disconnect', (reason) => {
      logger.info('Socket disconnected:', reason);
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
      socket.emit('join', currentUser._id);
      logger.info('Joining room for user:', currentUser._id);
    } else {
      // User is logged out, disconnect
      if (socket.connected) {
        socket.disconnect();
      }
    }
  }, [currentUser, socket]);
  
  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext; 