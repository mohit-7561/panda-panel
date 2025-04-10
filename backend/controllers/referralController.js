const ReferralCode = require('../models/ReferralCode');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY || '7d'
  });
};

// @desc    Create a new referral code
// @route   POST /api/referral/create
// @access  Private (Owner only)
exports.createReferralCode = async (req, res) => {
  try {
    const { 
      balance, 
      duration, 
      deductionRates 
    } = req.body;
    
    // Validate balance
    if (!balance || balance <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide a valid balance amount' 
      });
    }
    
    // Validate duration
    const validDurations = ['1 day', '3 days', '7 days', '30 days', '60 days'];
    if (!duration || !validDurations.includes(duration)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid duration (1 day, 3 days, 7 days, 30 days, or 60 days)'
      });
    }
    
    // Generate a unique code
    const code = await ReferralCode.generateUniqueCode();
    
    // Create referral code with deduction rates if provided
    const referralCodeData = {
      code,
      balance,
      duration,
      createdBy: req.user._id
    };
    
    // Add deduction rates if provided
    if (deductionRates) {
      referralCodeData.deductionRates = deductionRates;
    }
    
    const referralCode = await ReferralCode.create(referralCodeData);
    
    if (referralCode) {
      res.status(201).json({
        success: true,
        referralCode: {
          _id: referralCode._id,
          code: referralCode.code,
          balance: referralCode.balance,
          duration: referralCode.duration,
          deductionRates: referralCode.deductionRates,
          createdAt: referralCode.createdAt,
          isUsed: referralCode.isUsed
        },
        message: 'Referral code created successfully'
      });
    } else {
      res.status(400).json({ success: false, message: 'Failed to create referral code' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all referral codes created by the owner
// @route   GET /api/referral/codes
// @access  Private (Owner only)
exports.getReferralCodes = async (req, res) => {
  try {
    const referralCodes = await ReferralCode.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: referralCodes.length,
      referralCodes
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a referral code
// @route   DELETE /api/referral/:id
// @access  Private (Owner only)
exports.deleteReferralCode = async (req, res) => {
  try {
    const referralCode = await ReferralCode.findById(req.params.id);
    
    if (!referralCode) {
      return res.status(404).json({ success: false, message: 'Referral code not found' });
    }
    
    // Check if the referral code belongs to the owner
    if (referralCode.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'You are not authorized to delete this referral code' 
      });
    }
    
    // Check if the code is already used
    if (referralCode.isUsed) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete a used referral code' 
      });
    }
    
    await referralCode.deleteOne();
    
    res.json({
      success: true,
      message: 'Referral code deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Validate a referral code
// @route   POST /api/referral/validate
// @access  Public
exports.validateReferralCode = async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ success: false, message: 'Referral code is required' });
    }
    
    const referralCode = await ReferralCode.findOne({ code });
    
    if (!referralCode) {
      return res.status(404).json({ success: false, message: 'Invalid referral code' });
    }
    
    if (referralCode.isUsed) {
      return res.status(400).json({ 
        success: false, 
        message: 'This referral code has already been used',
        isUsed: true
      });
    }
    
    res.json({
      success: true,
      balance: referralCode.balance,
      duration: referralCode.duration,
      message: 'Valid referral code'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Register a new admin using referral code
// @route   POST /api/referral/register
// @access  Public
exports.registerWithReferralCode = async (req, res) => {
  try {
    const { username, password, code, modId } = req.body;
    
    // Log the request for debugging// Validate required fields
    if (!username || !password || !code) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }
    
    // Use findOneAndUpdate with conditions to ensure atomic operation
    // This prevents race conditions where two users try to use the same code simultaneously
    const referralCode = await ReferralCode.findOneAndUpdate(
      { code, isUsed: false }, // Only find unused codes
      { $set: { isUsed: true, usedAt: new Date() } }, // Mark as used atomically
      { new: false } // Return the document before update
    );
    
    if (!referralCode) {
      // Try to find the code to give a more specific error message
      const existingCode = await ReferralCode.findOne({ code });
      
      if (!existingCode) {
        return res.status(404).json({ success: false, message: 'Invalid referral code' });
      }
      
      if (existingCode.isUsed) {
        return res.status(400).json({ success: false, message: 'This referral code has already been used' });
      }
      
      // Generic fallback
      return res.status(400).json({ success: false, message: 'Unable to use referral code' });
    }
    
    // Check if username already exists
    const userExists = await User.findOne({ username });
    
    if (userExists) {
      // If username exists, revert the code back to unused
      await ReferralCode.updateOne(
        { _id: referralCode._id },
        { $set: { isUsed: false, usedAt: null } }
      );
      
      return res.status(400).json({ 
        success: false, 
        message: 'Username already exists' 
      });
    }
    
    // Get owner info
    const owner = await User.findById(referralCode.createdBy);
    
    if (!owner) {
      // If owner not found, revert the code back to unused
      await ReferralCode.updateOne(
        { _id: referralCode._id },
        { $set: { isUsed: false, usedAt: null } }
      );
      
      return res.status(404).json({ success: false, message: 'Owner not found' });
    }
    
    // Create admin user with the referral balance
    const userData = {
      username,
      password,
      role: 'admin',
      createdBy: referralCode.createdBy,
      unlimitedBalance: false // By default, referral registrations do not have unlimited balance
    };
    
    // Add custom deduction rates if provided in the referral code
    if (referralCode.deductionRates) {
      userData.deductionRates = referralCode.deductionRates;
    }
    
    // If this is for a specific mod, add it to modBalances instead of general balance
    if (modId) {
      const expiryDate = new Date();
      // Parse the duration string to get days (e.g., "30 days" => 30)
      const durationDays = parseInt(referralCode.duration.split(' ')[0]);
      
      if (!isNaN(durationDays)) {
        expiryDate.setDate(expiryDate.getDate() + durationDays);
      } else {
        // Default to 30 days if parsing fails
        expiryDate.setDate(expiryDate.getDate() + 30);
      }
      
      userData.modBalances = [{
        modId,
        balance: referralCode.balance,
        unlimitedBalance: false,
        expiresAt: expiryDate
      }];
    } else {
      // Regular balance for non-mod-specific registration
      userData.balance = referralCode.balance;
      userData.initialBalance = referralCode.balance;
      userData.balanceDuration = referralCode.duration;
      
      if (referralCode.duration) {
        const expiryDate = new Date();
        // Parse the duration string to get days (e.g., "30 days" => 30)
        const durationDays = parseInt(referralCode.duration.split(' ')[0]);
        
        if (!isNaN(durationDays)) {
          expiryDate.setDate(expiryDate.getDate() + durationDays);
          userData.balanceExpiresAt = expiryDate;
        }
      }
    }
    
    let user;
    try {
      user = await User.create(userData);
    } catch (err) {
      // If user creation fails, revert the code back to unused
      await ReferralCode.updateOne(
        { _id: referralCode._id },
        { $set: { isUsed: false, usedAt: null } }
      );
      
      throw err;
    }
    
    // Now that user is created, update the referral code with the user ID
    await ReferralCode.updateOne(
      { _id: referralCode._id },
      { $set: { usedBy: user._id } }
    );
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    // Return success response with appropriate balance info
    const responseUser = {
      _id: user._id,
      username: user.username,
      role: user.role,
      token,
      createdAt: user.createdAt,
      deductionRates: user.deductionRates
    };
    
    // Log the deduction rates for debugging
    if (user.deductionRates) {
      console.log('User deduction rates:', user.deductionRates);
    } else {
      console.log('No deduction rates found for user');
    }
    
    // Add the appropriate balance information based on whether it's mod-specific
    if (modId && user.modBalances && user.modBalances.length > 0) {
      const modBalance = user.modBalances.find(mb => mb.modId === modId);
      if (modBalance) {
        responseUser.modBalance = {
          modId,
          balance: modBalance.balance,
          unlimitedBalance: modBalance.unlimitedBalance,
          expiresAt: modBalance.expiresAt
        };
      }
    } else {
      responseUser.balance = user.balance;
      responseUser.balanceExpiresAt = user.balanceExpiresAt;
    }
    
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: responseUser
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};