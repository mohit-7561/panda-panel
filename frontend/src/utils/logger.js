/**
 * Logger utility for the application
 * 
 * Only logs to console when in development mode
 * In production, logging is disabled to prevent sensitive information exposure
 */

// Check if we're in development environment
const isDevelopment = import.meta.env.MODE === 'development' ||
  import.meta.env.DEV === true ||
  window.location.hostname === 'localhost';

// Create safe logger functions that only log in development
const logger = {
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  info: (...args) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
  
  warn: (...args) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  
  error: (...args) => {
    if (isDevelopment) {
      console.error(...args);
    }
    // In production, you could send errors to a monitoring service
    // like Sentry instead of logging to console
  },
  
  debug: (...args) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  }
};

export default logger; 