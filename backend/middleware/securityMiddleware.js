/**
 * Middleware to enforce HTTPS in production environments
 * This prevents HTTP requests and redirects to HTTPS
 */
exports.enforceHttps = (req, res, next) => {
  // Only enforce in production and if ENFORCE_HTTPS is true
  if (
    process.env.NODE_ENV === 'production' && 
    process.env.ENFORCE_HTTPS === 'true' && 
    req.headers['x-forwarded-proto'] !== 'https'
  ) {
    // Redirect to HTTPS
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  
  next();
};

/**
 * Custom security headers beyond what Helmet provides
 */
exports.additionalSecurityHeaders = (req, res, next) => {
  // Enforce strict transport security
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  
  // Prevent browser from detecting MIME type different than what is declared
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Enables XSS protection in browsers
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Prevent cross-site loading (especially in older browsers that might ignore CSP)
  res.setHeader('X-Download-Options', 'noopen');
  
  // Remove Server header to prevent exposing server information
  res.removeHeader('Server');
  res.removeHeader('X-Powered-By');
  
  next();
};

/**
 * Check if the request is for the API and modify headers accordingly
 * Add CORS headers for API requests
 */
exports.apiResponseHeaders = (req, res, next) => {
  // Only set headers for API routes
  if (req.path.startsWith('/api')) {
    // Prevent caching of API responses
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  
  next();
};

/**
 * Apply all security middlewares
 */
exports.applySecurityMiddleware = (app) => {
  app.use(this.enforceHttps);
  app.use(this.additionalSecurityHeaders);
  app.use(this.apiResponseHeaders);
}; 