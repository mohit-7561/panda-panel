const express = require('express');
const { 
  getCreatedUsers, 
  createAdmin, 
  addBalance, 
  updateBalance, 
  updateBalanceWithDuration, 
  setUnlimitedBalance, 
  extendBalanceExpiry,
  toggleResellerActive
} = require('../controllers/balanceController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

// Get users created by current user
router.get('/users', protect, authorizeRoles(['owner', 'admin']), getCreatedUsers);

// Create admin (reseller) account
router.post('/create-admin', protect, authorizeRoles(['owner']), createAdmin);

// Add balance to admin
router.post('/add-balance', protect, authorizeRoles(['owner']), addBalance);

// Update admin balance
router.put('/update-balance', protect, authorizeRoles(['owner']), updateBalance);

// Update admin balance and duration
router.put('/update-balance-with-duration', protect, authorizeRoles(['owner']), updateBalanceWithDuration);

// Set unlimited balance for reseller
router.put('/set-unlimited', protect, authorizeRoles(['owner']), setUnlimitedBalance);

// Extend balance expiry date
router.put('/extend-expiry', protect, authorizeRoles(['owner']), extendBalanceExpiry);

// Toggle reseller active status
router.put('/toggle-active', protect, authorizeRoles(['owner']), toggleResellerActive);

module.exports = router;