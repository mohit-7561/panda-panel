const express = require('express');
const router = express.Router();
const { 
  generateKey, 
  getKeys, 
  getKeyById, 
  updateKey, 
  deleteKey, 
  validateKey,
  validateKeyForMod,
  generateModKeys,
  getModKeys,
  getUserKeys,
  extendKeyExpiry
} = require('../controllers/keyController');
const { protect, admin } = require('../middleware/auth');
const { apiLimiter, keyValidationLimiter } = require('../middleware/rateLimit');

// Admin routes (protected)
router.route('/')
  .post(protect, admin, apiLimiter, generateKey)
  .get(protect, admin, apiLimiter, getKeys);

// Route for getting user's own keys (filtered by createdBy field)
// IMPORTANT: This route needs to be BEFORE the /:id route to prevent conflicts
router.get('/my-keys', protect, apiLimiter, getUserKeys);

// Route for generating mod-specific keys
router.post('/generate-mod-keys', protect, (req, res, next) => {
  // Check if user is admin or owner
  if (req.user && (req.user.role === 'admin' || req.user.role === 'owner')) {
    next();
  } else {
    return res.status(403).json({ 
      success: false, 
      message: 'Not authorized. Admin or owner privileges required.' 
    });
  }
}, apiLimiter, generateModKeys);

// Route for accessing mod-specific keys - accessible to owners and admins
router.get('/mod/:modId', protect, (req, res, next) => {
  // Check if user is admin or owner
  if (req.user && (req.user.role === 'admin' || req.user.role === 'owner')) {
    next();
  } else {
    return res.status(403).json({ 
      success: false, 
      message: 'Not authorized. Admin or owner privileges required.' 
    });
  }
}, apiLimiter, getModKeys);

// Public route for key validation
router.post('/validate', keyValidationLimiter, validateKey);

// Public route for mod APK key validation
router.post('/validate-mod', keyValidationLimiter, validateKeyForMod);

// Routes for extending key expiry - support both direct and alternative patterns
router.post('/:id/extend', protect, apiLimiter, extendKeyExpiry);
router.patch('/:id/extend', protect, apiLimiter, extendKeyExpiry);
router.post('/extend/:id', protect, apiLimiter, extendKeyExpiry);
router.patch('/extend/:id', protect, apiLimiter, extendKeyExpiry);

// IMPORTANT: This route should come AFTER all specific routes
router.route('/:id')
  .get(protect, admin, apiLimiter, getKeyById)
  .put(protect, admin, apiLimiter, updateKey)
  .delete(protect, apiLimiter, deleteKey);

module.exports = router; 