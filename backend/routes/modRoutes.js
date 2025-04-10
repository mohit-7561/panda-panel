const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getMods,
  getMod,
  getModStats,
  getModResellers,
  createModReseller,
  createModReferralCode,
  getModReferralCodes,
  deleteModReferralCode,
  validateModReferralCode,
  registerWithModReferralCode,
  addModBalance,
  setModUnlimitedBalance,
  extendModBalanceExpiry,
  extendAllModBalanceExpiry
} = require('../controllers/modController');

// Import keyController to use extendKeyExpiry
const { extendKeyExpiry } = require('../controllers/keyController');

/**
 * @route   GET /api/mods
 * @desc    Get all mods
 * @access  Private
 */
router.get('/', protect, getMods);

/**
 * @route   GET /api/mods/:modId
 * @desc    Get a specific mod
 * @access  Private
 */
router.get('/:modId', protect, getMod);

/**
 * @route   GET /api/mods/:modId/stats
 * @desc    Get statistics for a mod
 * @access  Private
 */
router.get('/:modId/stats', protect, getModStats);

/**
 * @route   GET /api/mods/:modId/resellers
 * @desc    Get all resellers for a mod
 * @access  Private
 */
router.get('/:modId/resellers', protect, getModResellers);

/**
 * @route   POST /api/mods/:modId/resellers
 * @desc    Create a new reseller for a mod
 * @access  Private
 */
router.post('/:modId/resellers', protect, createModReseller);

/**
 * @route   POST /api/mods/:modId/resellers/:resellerId/balance
 * @desc    Add balance to a reseller for a specific mod
 * @access  Private
 */
router.post('/:modId/resellers/:resellerId/balance', protect, addModBalance);

/**
 * @route   POST /api/mods/:modId/resellers/:resellerId/unlimited
 * @desc    Set unlimited balance for a reseller for a specific mod
 * @access  Private
 */
router.post('/:modId/resellers/:resellerId/unlimited', protect, setModUnlimitedBalance);

/**
 * @route   POST /api/mods/:modId/resellers/:resellerId/update-balance
 * @desc    Update reseller balance with option for unlimited status
 * @access  Private
 */
router.post('/:modId/resellers/:resellerId/update-balance', protect, async (req, res) => {
  const { modId, resellerId } = req.params;
  const { amount, isUnlimited } = req.body;
  
  try {
    // Handle unlimited balance if specified
    if (isUnlimited) {
      await setModUnlimitedBalance(req, res);
      return;
    }
    
    // Otherwise handle regular balance update
    await addModBalance(req, res);
  } catch (error) {
    console.error('Error updating balance:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating balance'
    });
  }
});

/**
 * @route   POST /api/mods/:modId/resellers/:resellerId/extend
 * @desc    Extend balance expiry for a reseller for a specific mod
 * @access  Private
 */
router.post('/:modId/resellers/:resellerId/extend', protect, extendModBalanceExpiry);

/**
 * @route   POST /api/mods/:modId/resellers/extend-all
 * @desc    Extend balance expiry for ALL resellers for a specific mod
 * @access  Private
 */
router.post('/:modId/resellers/extend-all', protect, extendAllModBalanceExpiry);

/**
 * @route   POST /api/mods/:modId/referrals
 * @desc    Create a new referral code for a mod
 * @access  Private
 */
router.post('/:modId/referrals', protect, createModReferralCode);

/**
 * @route   GET /api/mods/:modId/referrals
 * @desc    Get all referral codes for a mod
 * @access  Private
 */
router.get('/:modId/referrals', protect, getModReferralCodes);

/**
 * @route   DELETE /api/mods/:modId/referrals/:id
 * @desc    Delete a referral code
 * @access  Private
 */
router.delete('/:modId/referrals/:id', protect, deleteModReferralCode);

/**
 * @route   POST /api/mods/:modId/referrals/validate
 * @desc    Validate a mod-specific referral code
 * @access  Public
 */
router.post('/:modId/referrals/validate', validateModReferralCode);

/**
 * @route   POST /api/mods/:modId/referrals/register
 * @desc    Register a new user with a mod-specific referral code
 * @access  Public
 */
router.post('/:modId/referrals/register', registerWithModReferralCode);

/**
 * @route   POST/PATCH /api/mods/:modId/keys/:id/extend
 * @desc    Extend a key's expiry for a specific mod
 * @access  Private
 */
router.post('/:modId/keys/:id/extend', protect, extendKeyExpiry);
router.patch('/:modId/keys/:id/extend', protect, extendKeyExpiry);

module.exports = router; 