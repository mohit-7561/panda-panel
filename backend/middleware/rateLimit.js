const rateLimit = require('express-rate-limit');

// Get values from environment variables with fallbacks
const getApiMaxRequests = () => {
  return parseInt(process.env.RATE_LIMIT_MAX) || 300;
};

const getApiWindowMs = () => {
  return (parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES) || 15) * 60 * 1000; // convert minutes to ms
};

const getAuthMaxAttempts = () => {
  return parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 30;
};

const getAuthWindowMs = () => {
  return (parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MINUTES) || 60) * 60 * 1000; // convert minutes to ms
};

// Rate limiter for API endpoints
exports.apiLimiter = rateLimit({
  windowMs: getApiWindowMs(),
  max: getApiMaxRequests(),
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { success: false, message: 'Too many requests, please try again later.' },
  skipSuccessfulRequests: false, // Count all requests
  keyGenerator: (req) => {
    // Use IP address as key, or if behind proxy, use X-Forwarded-For header
    return req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  }
});

// More strict rate limiter for authentication attempts
exports.authLimiter = rateLimit({
  windowMs: getAuthWindowMs(),
  max: getAuthMaxAttempts(),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts, please try again later.' },
  skipSuccessfulRequests: false, // Count all auth attempts, even successful ones
  keyGenerator: (req) => {
    // Use username + IP as key to prevent username enumeration
    // Safely check if req.body exists before accessing username
    const username = (req.body && req.body.username) ? req.body.username : 'unknown';
    return `${username}-${req.ip}`;
  }
});

// Rate limiter for key validation
exports.keyValidationLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 60, // limit each IP to 60 key validation requests per 10 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many key validation attempts, please try again later.' },
  skipSuccessfulRequests: true, // Don't count successful validations
  keyGenerator: (req) => {
    // Use IP address or forwarded IP
    return req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  }
});

// Export helper functions
exports.getApiMaxRequests = getApiMaxRequests;
exports.getApiWindowMs = getApiWindowMs;
exports.getAuthMaxAttempts = getAuthMaxAttempts;
exports.getAuthWindowMs = getAuthWindowMs; 