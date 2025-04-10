const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/database');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
const keyRoutes = require('./routes/keyRoutes');
const balanceRoutes = require('./routes/balanceRoutes');
const referralRoutes = require('./routes/referralRoutes');
const modRoutes = require('./routes/modRoutes');
const http = require('http');
const socketIo = require('socket.io');
const rateLimit = require('express-rate-limit');

// Load environment variables
require('dotenv').config();

// Connect to database
connectDB();

// Initialize express
const app = express();
const server = http.createServer(app);

// Apply security middleware first
const securityMiddleware = require('./middleware/securityMiddleware');
securityMiddleware.applySecurityMiddleware(app);

// Initialize Socket.io
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://panda-panel-frontend.vercel.app', process.env.FRONTEND_URL]
      : ['http://localhost:5173', 'http://localhost:5174'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Socket.io connections
io.on('connection', (socket) => {
  console.log('New client connected');
  
  // User joins their room (using their userId)
  socket.on('join', (userId) => {
    if (userId) {
      socket.join(userId);
      console.log(`User ${userId} joined their room`);
    }
  });
  
  // Disconnect event
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Export socket.io instance for use in other files
global.io = io;

// Alternative way to make io available in controllers
app.set('io', io);

// Middleware
// Configure CORS with more restrictive settings
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://panda-panel-frontend.vercel.app', process.env.FRONTEND_URL] 
    : ['http://localhost:5173', 'http://localhost:5174'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400 // 24 hours in seconds
}));

// Add additional CORS headers for preflight requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://panda-panel-frontend.vercel.app');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Enhanced security with Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https://static.wikia.nocookie.net'],
      connectSrc: ["'self'", process.env.FRONTEND_URL || 'https://your-production-frontend.com']
    }
  },
  crossOriginEmbedderPolicy: false, // May need to adjust based on your resources
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Adjust if needed
  xssFilter: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

// Parse JSON request body
app.use(express.json({ limit: '1mb' }));

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// HTTP request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  // Use more concise logging in production
  app.use(morgan('combined'));
}

// Import rate limiters
const { apiLimiter, authLimiter, keyValidationLimiter } = require('./middleware/rateLimit');
const { getApiWindowMs, getApiMaxRequests } = require('./middleware/rateLimit');

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'GX Clan Panel API is running...' });
});

// Apply rate limiters to routes
// Auth routes - more strict rate limiting is applied in the auth routes file
// app.use('/api/auth', authLimiter); <- removing this line that causes double rate limiting

// Key validation routes - specific rate limiter
app.use('/api/keys/validate', keyValidationLimiter);

// All other API routes - general rate limiting, but not on GET profile or keys
// This prevents 429 errors on commonly used endpoints
const skipCommonEndpoints = (req, res) => {
  // Skip rate limiting for these common endpoints
  if (
    (req.method === 'GET' && req.path.includes('/api/auth/profile')) || 
    (req.method === 'GET' && req.path.includes('/api/keys/my-keys'))
  ) {
    return true;
  }
  return false;
};

// Modified API limiter with skip function
const modifiedApiLimiter = rateLimit({
  windowMs: getApiWindowMs(),
  max: getApiMaxRequests(),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
  skip: skipCommonEndpoints,
  keyGenerator: (req) => {
    return req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  }
});

app.use('/api/', modifiedApiLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/keys', keyRoutes);
app.use('/api/balance', balanceRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/mods', modRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log('Unhandled Rejection at:', promise);
  console.log('Error:', err.message);
  console.log('Stack:', err.stack);
  // Don't exit the process in development mode
  if (process.env.NODE_ENV === 'production') {
    // Close server & exit process
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log('Uncaught Exception:');
  console.log('Error:', err.message);
  console.log('Stack:', err.stack);
  // Don't exit the process in development mode
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

   // Export the Express app for serverless use
   module.exports = app;