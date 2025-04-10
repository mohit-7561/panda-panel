import { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';
import logger from '../utils/logger';

const IDLE_TIMEOUT = 20 * 60 * 1000; // 20 minutes in milliseconds
const WARNING_TIME = 1 * 60 * 1000; // Show warning 1 minute before logout

export const IdleTimeoutContext = createContext();

export const useIdleTimeout = () => useContext(IdleTimeoutContext);

export const IdleTimeoutProvider = ({ children }) => {
  const { currentUser, logout } = useAuth();
  const [isIdle, setIsIdle] = useState(false);
  const [timer, setTimer] = useState(null);
  const [warningTimer, setWarningTimer] = useState(null);
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  
  // Function to reset the idle timer
  const resetTimer = () => {
    setIsIdle(false);
    setShowWarning(false);
    
    // Clear existing timers
    if (timer) clearTimeout(timer);
    if (warningTimer) clearTimeout(warningTimer);
    
    // Only set timers if user is a reseller (admin role)
    if (currentUser?.role === 'admin') {
      // Set warning timer to show warning before logout
      const newWarningTimer = setTimeout(() => {
        setShowWarning(true);
        // Start countdown timer for UI
        let countdownTime = Math.floor(WARNING_TIME / 1000);
        const countdownInterval = setInterval(() => {
          countdownTime -= 1;
          setTimeLeft(countdownTime);
          if (countdownTime <= 0) {
            clearInterval(countdownInterval);
          }
        }, 1000);
      }, IDLE_TIMEOUT - WARNING_TIME);
      
      // Set logout timer
      const newTimer = setTimeout(() => {
        if (currentUser?.role === 'admin') {
          logger.log('Idle timeout reached. Logging out...');
          logout();
        }
      }, IDLE_TIMEOUT);
      
      setWarningTimer(newWarningTimer);
      setTimer(newTimer);
    }
  };
  
  // Set up event listeners for user activity
  useEffect(() => {
    // Only track activity for resellers
    if (!currentUser || currentUser.role !== 'admin') {
      return () => {};
    }
    
    // Reset the timer initially
    resetTimer();
    
    // Event listeners to track user activity
    const activityEvents = [
      'mousedown', 'mousemove', 'keydown', 
      'scroll', 'touchstart', 'click'
    ];
    
    const handleUserActivity = () => {
      resetTimer();
    };
    
    // Add event listeners
    activityEvents.forEach(event => {
      window.addEventListener(event, handleUserActivity);
    });
    
    // Clean up event listeners on unmount
    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleUserActivity);
      });
      
      // Clean up timers
      if (timer) clearTimeout(timer);
      if (warningTimer) clearTimeout(warningTimer);
    };
  }, [currentUser, logout]);
  
  // Provide the context value
  const contextValue = {
    isIdle,
    showWarning,
    timeLeft,
    resetTimer
  };
  
  return (
    <IdleTimeoutContext.Provider value={contextValue}>
      {children}
    </IdleTimeoutContext.Provider>
  );
}; 