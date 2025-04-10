const express = require('express');
const { 
  createReferralCode, 
  getReferralCodes, 
  deleteReferralCode, 
  validateReferralCode,
  registerWithReferralCode
} = require('../controllers/referralController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

// Protected routes (Owner only)
router.post('/create', protect, authorizeRoles(['owner']), createReferralCode);
router.get('/codes', protect, authorizeRoles(['owner']), getReferralCodes);
router.delete('/:id', protect, authorizeRoles(['owner']), deleteReferralCode);

// Public routes
router.post('/validate', validateReferralCode);
router.post('/register', registerWithReferralCode);

module.exports = router;