const Referral = require('../models/Referral');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');
const jwt = require('jsonwebtoken');

// Helper function to check Godeye access permissions
const checkGodeyeAccess = (req, modId) => {
  if (modId === 'godeye' && req.user.role !== 'owner') {
    return {
      restricted: true,
      statusCode: 403,
      response: {
        success: false,
        message: 'Godeye can only be managed by the owner'
      }
    };
  }
  return { restricted: false };
};

// Define a mock database of mods
const MODS = {
  winstar: {
    id: 'winstar',
    name: 'WinStar',
    active: true,
    description: 'Professional gaming enhancement for Windows platform.',
  },
  ioszero: {
    id: 'ioszero',
    name: 'iOSZero',
    active: true,
    description: 'Advanced iOS device enhancement toolkit.',
  },
  godeye: {
    id: 'godeye',
    name: 'Godeye',
    active: true,
    description: 'Ultimate precision enhancement tool for gaming.',
  },
  vision: {
    id: 'vision',
    name: 'Vision',
    active: true,
    description: 'Advanced visual enhancement for competitive gaming.',
  },
  lethal: {
    id: 'lethal',
    name: 'Lethal',
    active: true,
    description: 'Performance booster for extreme gaming scenarios.',
  },
  deadeye: {
    id: 'deadeye',
    name: 'Deadeye',
    active: true,
    description: 'Precision targeting enhancement toolkit.',
  }
};

// @desc    Get all mods
// @route   GET /api/mods
// @access  Private
exports.getMods = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    count: Object.keys(MODS).length,
    data: Object.values(MODS)
  });
});

// @desc    Get a specific mod
// @route   GET /api/mods/:modId
// @access  Private
exports.getMod = asyncHandler(async (req, res) => {
  const { modId } = req.params;
  
  const mod = MODS[modId];
  
  if (!mod) {
    return res.status(404).json({
      success: false,
      message: `Mod with ID ${modId} not found`
    });
  }
  
  const godeyeAccess = checkGodeyeAccess(req, modId);
  
  if (godeyeAccess.restricted) {
    return res.status(godeyeAccess.statusCode).json(godeyeAccess.response);
  }
  
  res.status(200).json({
    success: true,
    data: mod
  });
});

// @desc    Get mod statistics
// @route   GET /api/mods/:modId/stats
// @access  Private
exports.getModStats = asyncHandler(async (req, res) => {
  const { modId } = req.params;
  
  if (!MODS[modId]) {
    return res.status(404).json({
      success: false,
      message: `Mod with ID ${modId} not found`
    });
  }
  
  const godeyeAccess = checkGodeyeAccess(req, modId);
  
  if (godeyeAccess.restricted) {
    return res.status(godeyeAccess.statusCode).json(godeyeAccess.response);
  }
  
  try {
    // Import key models
    const AdminKey = require('../models/Key');
    const OwnerKey = require('../models/OwnerKey');
    
    // Get actual statistics from database
    
    // 1. Count total keys for this mod (both admin and owner keys)
    const adminKeysCount = await AdminKey.countDocuments({ game: modId });
    const ownerKeysCount = await OwnerKey.countDocuments({ game: modId });
    const totalKeys = adminKeysCount + ownerKeysCount;
    
    // 2. Count active keys (not expired)
    const now = new Date();
    const activeAdminKeys = await AdminKey.countDocuments({ 
      game: modId,
      isActive: true,
      $or: [
        { expiresAt: { $gt: now } },
        { maxUsage: 0 } // Unlimited usage keys
      ]
    });
    
    const activeOwnerKeys = await OwnerKey.countDocuments({ 
      game: modId,
      isActive: true,
      $or: [
        { expiresAt: { $gt: now } },
        { maxUsage: 0 } // Unlimited usage keys
      ]
    });
    
    const activeKeys = activeAdminKeys + activeOwnerKeys;
    
    // 3. Count total resellers (admins with mod balance)
    const totalResellers = await User.countDocuments({
      role: 'admin',
      'modBalances.modId': modId
    });
    
    // 4. Count active resellers (non-expired balance)
    const activeResellers = await User.countDocuments({
      role: 'admin',
      'modBalances.modId': modId,
      $or: [
        { 'modBalances.expiresAt': { $gt: now } },
        { 'modBalances.expiresAt': null }
      ]
    });
    
    // Return actual statistics
    const stats = {
      totalKeys,
      activeKeys,
      totalResellers,
      activeResellers
    };
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting mod stats:', error);
    // Return some default values if there's an error instead of failing
    res.status(200).json({
      success: true,
      data: {
        totalKeys: 0,
        activeKeys: 0,
        totalResellers: 0,
        activeResellers: 0
      }
    });
  }
});

// @desc    Get all resellers for a mod
// @route   GET /api/mods/:modId/resellers
// @access  Private
exports.getModResellers = asyncHandler(async (req, res) => {
  const { modId } = req.params;
  
  if (!MODS[modId]) {
    return res.status(404).json({
      success: false,
      message: `Mod with ID ${modId} not found`
    });
  }
  
  const godeyeAccess = checkGodeyeAccess(req, modId);
  
  if (godeyeAccess.restricted) {
    return res.status(godeyeAccess.statusCode).json(godeyeAccess.response);
  }
  
  try {// Find all admin users who have a mod-specific balance for this mod
    const adminUsers = await User.find({
      role: 'admin',
      'modBalances.modId': modId // Only include admins with a balance for this specific mod
    }).select('username balance unlimitedBalance balanceExpiresAt modBalances createdAt');// Transform the data to include mod-specific information
    const resellers = adminUsers.map(user => {
      // Check if user has a mod-specific balance for this mod
      const modBalance = user.modBalances?.find(mb => mb.modId === modId);
      
      // Get raw expiry date 
      const rawExpiryDate = modBalance?.expiresAt || user.balanceExpiresAt || null;
      
      // Determine if the user has an active status
      const isActive = modBalance ? 
        (modBalance.expiresAt ? new Date(modBalance.expiresAt) > new Date() : true) : 
        (user.balanceExpiresAt ? new Date(user.balanceExpiresAt) > new Date() : true);
      
      // Use mod-specific balance if available, otherwise fall back to general balance
      const userBalance = modBalance ? modBalance.balance : user.balance;
      const isUnlimited = modBalance ? (modBalance.unlimitedBalance || false) : (user.unlimitedBalance || false);
      
      return {
        _id: user._id,
        username: user.username,
        balance: userBalance || 0,
        unlimited: isUnlimited,
        active: isActive,
        expiresAt: rawExpiryDate, // Send the raw date for client-side formatting
        createdAt: user.createdAt // Include user creation date
      };
    });
    
    res.status(200).json({
      success: true,
      count: resellers.length,
      data: resellers
    });
  } catch (error) {
    console.error('Error fetching mod resellers:', error);
    res.status(500).json({
      success: false,
      message: 'Server error, could not fetch resellers',
      error: error.message
    });
  }
});

// @desc    Create a new reseller for a mod
// @route   POST /api/mods/:modId/resellers
// @access  Private
exports.createModReseller = asyncHandler(async (req, res) => {
  const { modId } = req.params;
  const { username, password, initialBalance, unlimitedBalance, duration } = req.body;
  
  // Check if the mod exists
  if (!MODS[modId]) {
    return res.status(404).json({
      success: false,
      message: `Mod with ID ${modId} not found`
    });
  }
  
  // Check Godeye access restrictions
  const godeyeAccess = checkGodeyeAccess(req, modId);
  if (godeyeAccess.restricted) {
    return res.status(godeyeAccess.statusCode).json(godeyeAccess.response);
  }
  
  try {
    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }
    
    // Calculate expiry date
    let expiresAt = null;
    if (duration && duration !== 'unlimited') {
      // Parse duration string (e.g., "30 days", "1 year")
      const [value, unit] = duration.split(' ');
      const durationValue = parseInt(value);
      
      expiresAt = new Date();
      if (unit.toLowerCase().includes('day')) {
        expiresAt.setDate(expiresAt.getDate() + durationValue);
      } else if (unit.toLowerCase().includes('month')) {
        expiresAt.setMonth(expiresAt.getMonth() + durationValue);
      } else if (unit.toLowerCase().includes('year')) {
        expiresAt.setFullYear(expiresAt.getFullYear() + durationValue);
      }
    }
    
    // Create the new user with admin role
    const newUser = new User({
      username,
      password,
      role: 'admin',
      modBalances: [{
        modId,
        balance: initialBalance || 0,
        unlimitedBalance: unlimitedBalance || false,
        expiresAt
      }]
    });
    
    // Save the user
    await newUser.save();
    
    // Return success response
    res.status(201).json({
      success: true,
      message: 'Reseller created successfully',
      data: {
        _id: newUser._id,
        username: newUser.username,
        role: newUser.role,
        modId,
        balance: initialBalance || 0,
        unlimited: unlimitedBalance || false,
        expiresAt
      }
    });
  } catch (error) {
    console.error('Error creating mod reseller:', error);
    res.status(500).json({
      success: false,
      message: 'Server error, could not create reseller',
      error: error.message
    });
  }
});

// @desc    Create a referral code for a mod
// @route   POST /api/mods/:modId/referrals
// @access  Private
exports.createModReferralCode = asyncHandler(async (req, res) => {
  const { modId } = req.params;
  const { balance, duration, unlimited = false, deductionRates } = req.body;
  
  if (!MODS[modId]) {
    return res.status(404).json({
      success: false,
      message: `Mod with ID ${modId} not found`
    });
  }
  
  const godeyeAccess = checkGodeyeAccess(req, modId);
  
  if (godeyeAccess.restricted) {
    return res.status(godeyeAccess.statusCode).json(godeyeAccess.response);
  }
  
  // Generate a random referral code
  const code = Math.random().toString(36).substring(2, 10).toUpperCase();
  
  // Prepare referral data
  const referralData = {
    code,
    modId,
    balance: unlimited ? 0 : balance,
    unlimited,
    duration,
    createdBy: req.user._id,
    active: true
  };
  
  // Add deduction rates if provided
  if (deductionRates) {// Make sure all rate fields are present and converted to numbers
    referralData.deductionRates = {
      day1: Number(deductionRates.day1) || 100,
      day3: Number(deductionRates.day3) || 150,
      day7: Number(deductionRates.day7) || 200,
      day15: Number(deductionRates.day15) || 300,
      day30: Number(deductionRates.day30) || 500,
      day60: Number(deductionRates.day60) || 800
    };
  }
  
  // Create the referral
  const referral = await Referral.create(referralData);
  res.status(201).json({
    success: true,
    data: referral
  });
});

// @desc    Get all referral codes for a mod
// @route   GET /api/mods/:modId/referrals
// @access  Private
exports.getModReferralCodes = asyncHandler(async (req, res) => {
  const { modId } = req.params;
  
  if (!MODS[modId]) {
    return res.status(404).json({
      success: false,
      message: `Mod with ID ${modId} not found`
    });
  }
  
  const godeyeAccess = checkGodeyeAccess(req, modId);
  
  if (godeyeAccess.restricted) {
    return res.status(godeyeAccess.statusCode).json(godeyeAccess.response);
  }
  
  const referrals = await Referral.find({ modId }).sort('-createdAt');
  
  res.status(200).json({
    success: true,
    count: referrals.length,
    data: referrals
  });
});

// @desc    Delete a referral code
// @route   DELETE /api/mods/:modId/referrals/:id
// @access  Private
exports.deleteModReferralCode = asyncHandler(async (req, res) => {
  const { modId, id } = req.params;
  
  if (!MODS[modId]) {
    return res.status(404).json({
      success: false,
      message: `Mod with ID ${modId} not found`
    });
  }
  
  if (!id || id === 'undefined') {
    return res.status(400).json({
      success: false,
      message: 'Invalid referral code ID'
    });
  }
  
  const godeyeAccess = checkGodeyeAccess(req, modId);
  
  if (godeyeAccess.restricted) {
    return res.status(godeyeAccess.statusCode).json(godeyeAccess.response);
  }
  
  try {
    const referral = await Referral.findById(id);
    
    if (!referral) {
      return res.status(404).json({
        success: false,
        message: 'Referral not found'
      });
    }
    
    // Ensure the referral belongs to the specified mod
    if (referral.modId !== modId) {
      return res.status(400).json({
        success: false,
        message: 'Referral does not belong to this mod'
      });
    }
    await referral.deleteOne();
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting referral:', error);
    throw error;
  }
});

// @desc    Validate a mod-specific referral code
// @route   POST /api/mods/:modId/referrals/validate
// @access  Public
exports.validateModReferralCode = asyncHandler(async (req, res) => {
  const { modId } = req.params;
  const { code } = req.body;
  
  if (!code) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a referral code'
    });
  }
  
  if (!MODS[modId]) {
    return res.status(404).json({
      success: false,
      message: `Mod with ID ${modId} not found`
    });
  }
  
  // Skip Godeye access check for public routes
  // This is a public endpoint, so we don't need to check user permissions
  
  try {
    const referral = await Referral.findOne({ code, modId });
    
    if (!referral) {
      return res.status(404).json({
        success: false,
        message: 'Invalid referral code for this mod'
      });
    }
    
    // Check if referral is expired
    if (referral.isExpired()) {
      return res.status(400).json({
        success: false,
        message: 'This referral code has expired'
      });
    }
    
    // Check if referral is active
    if (!referral.active) {
      return res.status(400).json({
        success: false,
        message: 'This referral code is no longer active'
      });
    }
    
    // Check if already used - ALL referral codes (including unlimited ones) can only be used ONCE
    if (referral.usedCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'This referral code has already been used',
        isUsed: true
      });
    }
    
    // Log deduction rates if they exist
    if (referral.deductionRates) {
      console.log('Referral deduction rates:', referral.deductionRates);
    } else {
      console.log('No deduction rates found for referral code');
    }
    
    // Return referral information
    res.status(200).json({
      success: true,
      data: {
        code: referral.code,
        balance: referral.balance,
        unlimited: referral.unlimited,
        duration: referral.duration,
        deductionRates: referral.deductionRates
      }
    });
  } catch (error) {
    console.error('Error validating referral code:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while validating referral code'
    });
  }
});

// @desc    Register a new user with mod-specific referral code
// @route   POST /api/mods/:modId/referrals/register
// @access  Public
exports.registerWithModReferralCode = asyncHandler(async (req, res) => {
  const { modId } = req.params;
  const { username, password, code } = req.body;
  
  if (!MODS[modId]) {
    return res.status(404).json({
      success: false,
      message: `Mod with ID ${modId} not found`
    });
  }
  
  // Validate required fields
  if (!username || !password || !code) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required'
    });
  }
  
  // Skip Godeye access check for public routes
  // This is a public endpoint, so we don't need to check user permissions
  
  try {
    // First check if username already exists to fail fast
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }
    
    // Find the referral code first
    const referral = await Referral.findOne({ code, modId });
    
    if (!referral) {
      return res.status(404).json({
        success: false,
        message: 'Invalid referral code for this mod'
      });
    }
    
    // Check if referral is expired
    if (referral.isExpired()) {
      return res.status(400).json({
        success: false,
        message: 'This referral code has expired'
      });
    }
    
    // Check if referral is active
    if (!referral.active) {
      return res.status(400).json({
        success: false,
        message: 'This referral code is no longer active'
      });
    }
    
    // ALL referral codes (including unlimited ones) can only be used ONCE
    if (referral.usedCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'This referral code has already been used',
        isUsed: true
      });
    }
    
    // We need to atomically increment the usedCount to prevent race conditions
    // findOneAndUpdate with the specific conditions to prevent duplicate usage
    const updatedReferral = await Referral.findOneAndUpdate(
      { 
        _id: referral._id,
        // Ensure the code hasn't been used yet
        usedCount: 0
      },
      { 
        // Increment the usedCount
        $inc: { usedCount: 1 }
      },
      { new: true } // Return the updated document
    );
    
    // If the update failed, another process has already used the code
    if (!updatedReferral || updatedReferral.usedCount !== 1) {
      return res.status(400).json({
        success: false,
        message: 'This referral code has already been used',
        isUsed: true
      });
    }
    
    // Calculate expiry date based on referral duration
    let expiryDate = null;
    if (referral.duration !== 'unlimited') {
      const days = parseInt(referral.duration.split(' ')[0]);
      expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + days);
    }
    
    // Create user with mod-specific balance
    const userData = {
      username,
      password,
      role: 'admin', // Referral codes create admin users
      createdBy: referral.createdBy,
      // Always set both main balance and initialBalance
      balance: referral.balance,
      initialBalance: referral.balance,
      unlimitedBalance: referral.unlimited,
      balanceExpiresAt: expiryDate,
      modBalances: [{
        modId,
        balance: referral.balance,
        initialBalance: referral.balance,
        unlimitedBalance: referral.unlimited,
        expiresAt: expiryDate
      }]
    };
    
    // Add deduction rates from the referral code if available
    if (referral.deductionRates) {
      console.log('Using deduction rates from referral code:', referral.deductionRates);
      userData.deductionRates = {
        day1: Number(referral.deductionRates.day1) || 100,
        day3: Number(referral.deductionRates.day3) || 150,
        day7: Number(referral.deductionRates.day7) || 200,
        day15: Number(referral.deductionRates.day15) || 300,
        day30: Number(referral.deductionRates.day30) || 500,
        day60: Number(referral.deductionRates.day60) || 800
      };
    } else {
      console.log('No deduction rates in referral code, using defaults');
    }
    
    let user;
    try {
      user = await User.create(userData);
    } catch (err) {
      // If user creation fails, revert the code back to unused
      await Referral.updateOne(
        { _id: referral._id },
        { $inc: { usedCount: -1 } }
      );
      
      throw err;
    }
    
    // Now add the user to the usedBy array
    await Referral.updateOne(
      { _id: referral._id },
      { $push: { usedBy: user._id } }
    );
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    // Return success response
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        token,
        balance: user.balance,
        unlimitedBalance: user.unlimitedBalance || false,
        balanceExpiresAt: user.balanceExpiresAt,
        deductionRates: user.deductionRates, // Include deduction rates in response
        modBalance: {
          modId,
          balance: referral.balance,
          unlimited: referral.unlimited,
          expiresAt: expiryDate
        }
      }
    });
  } catch (error) {
    console.error('Error registering with mod referral code:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while registering'
    });
  }
});

// @desc    Add balance to a reseller for a specific mod
// @route   POST /api/mods/:modId/resellers/:resellerId/balance
// @access  Private
exports.addModBalance = asyncHandler(async (req, res) => {
  const { modId, resellerId } = req.params;
  const { amount } = req.body;
  
  if (!MODS[modId]) {
    return res.status(404).json({
      success: false,
      message: `Mod with ID ${modId} not found`
    });
  }
  
  const godeyeAccess = checkGodeyeAccess(req, modId);
  
  if (godeyeAccess.restricted) {
    return res.status(godeyeAccess.statusCode).json(godeyeAccess.response);
  }
  
  try {
    // Find the user
    const user = await User.findById(resellerId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Reseller not found'
      });
    }
    
    // Check if user has a mod-specific balance
    const existingModBalance = user.modBalances?.find(mb => mb.modId === modId);
    
    if (existingModBalance) {
      // Update the existing mod-specific balance
      await User.updateOne(
        { _id: resellerId, 'modBalances.modId': modId },
        { $inc: { 'modBalances.$.balance': parseInt(amount) } }
      );
    } else {
      // Create a new mod-specific balance
      await User.updateOne(
        { _id: resellerId },
        { 
          $push: { 
            modBalances: {
              modId,
              balance: parseInt(amount),
              initialBalance: parseInt(amount),
              unlimitedBalance: false
            }
          }
        }
      );
    }
    
    // Fetch the updated user to return in response
    const updatedUser = await User.findById(resellerId);
    const updatedModBalance = updatedUser.modBalances?.find(mb => mb.modId === modId);
    
    res.status(200).json({
      success: true,
      message: `Added ${amount} balance to reseller ${resellerId} for mod ${modId}`,
      data: {
        id: updatedUser._id,
        username: updatedUser.username,
        balance: updatedModBalance ? updatedModBalance.balance : updatedUser.balance,
        unlimitedBalance: updatedModBalance ? updatedModBalance.unlimitedBalance : updatedUser.unlimitedBalance,
        active: true,
        expiresAt: updatedModBalance && updatedModBalance.expiresAt 
          ? new Date(updatedModBalance.expiresAt).toLocaleDateString() 
          : updatedUser.balanceExpiresAt 
            ? new Date(updatedUser.balanceExpiresAt).toLocaleDateString()
            : 'No expiry',
        hasModSpecificBalance: !!updatedModBalance,
        createdAt: updatedUser.createdAt
      }
    });
  } catch (error) {
    console.error('Error adding mod balance:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding balance'
    });
  }
});

// @desc    Set unlimited balance for a reseller for a specific mod
// @route   POST /api/mods/:modId/resellers/:resellerId/unlimited
// @access  Private
exports.setModUnlimitedBalance = asyncHandler(async (req, res) => {
  const { modId, resellerId } = req.params;
  const { isUnlimited } = req.body;
  
  if (!MODS[modId]) {
    return res.status(404).json({
      success: false,
      message: `Mod with ID ${modId} not found`
    });
  }
  
  const godeyeAccess = checkGodeyeAccess(req, modId);
  
  if (godeyeAccess.restricted) {
    return res.status(godeyeAccess.statusCode).json(godeyeAccess.response);
  }
  
  try {
    // Find the user
    const user = await User.findById(resellerId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Reseller not found'
      });
    }
    
    // Check if user has a mod-specific balance
    const existingModBalance = user.modBalances?.find(mb => mb.modId === modId);
    
    if (existingModBalance) {
      // Update the existing mod-specific balance
      await User.updateOne(
        { _id: resellerId, 'modBalances.modId': modId },
        { $set: { 'modBalances.$.unlimitedBalance': isUnlimited } }
      );
    } else {
      // Create a new mod-specific balance
      await User.updateOne(
        { _id: resellerId },
        { 
          $push: { 
            modBalances: {
              modId,
              balance: 0,
              initialBalance: 0,
              unlimitedBalance: isUnlimited
            }
          }
        }
      );
    }
    
    // Fetch the updated user to return in response
    const updatedUser = await User.findById(resellerId);
    const updatedModBalance = updatedUser.modBalances?.find(mb => mb.modId === modId);
    
    res.status(200).json({
      success: true,
      message: `Set unlimited balance to ${isUnlimited} for reseller ${resellerId} for mod ${modId}`,
      data: {
        id: updatedUser._id,
        username: updatedUser.username,
        balance: updatedModBalance ? updatedModBalance.balance : updatedUser.balance,
        unlimitedBalance: updatedModBalance ? updatedModBalance.unlimitedBalance : updatedUser.unlimitedBalance,
        active: true,
        expiresAt: updatedModBalance && updatedModBalance.expiresAt 
          ? new Date(updatedModBalance.expiresAt).toLocaleDateString() 
          : updatedUser.balanceExpiresAt 
            ? new Date(updatedUser.balanceExpiresAt).toLocaleDateString()
            : 'No expiry',
        hasModSpecificBalance: !!updatedModBalance,
        createdAt: updatedUser.createdAt
      }
    });
  } catch (error) {
    console.error('Error setting unlimited mod balance:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while setting unlimited balance'
    });
  }
});

// @desc    Extend balance expiry for a reseller for a specific mod
// @route   POST /api/mods/:modId/resellers/:resellerId/extend
// @access  Private
exports.extendModBalanceExpiry = asyncHandler(async (req, res) => {
  const { modId, resellerId } = req.params;
  const { days } = req.body;
  
  // Ensure days is a valid number
  const daysToExtend = parseInt(days);
  if (isNaN(daysToExtend) || daysToExtend < 1) {
    return res.status(400).json({
      success: false,
      message: 'Days to extend must be a positive number'
    });
  }
  
  if (!MODS[modId]) {
    return res.status(404).json({
      success: false,
      message: `Mod with ID ${modId} not found`
    });
  }
  
  const godeyeAccess = checkGodeyeAccess(req, modId);
  
  if (godeyeAccess.restricted) {
    return res.status(godeyeAccess.statusCode).json(godeyeAccess.response);
  }
  
  try {
    // Find the user
    const user = await User.findById(resellerId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Reseller not found'
      });
    }
    
    // Check if user has a mod-specific balance
    const existingModBalance = user.modBalances?.find(mb => mb.modId === modId);
    
    // Calculate new expiry date
    const newExpiryDate = new Date();
    newExpiryDate.setDate(newExpiryDate.getDate() + daysToExtend);
    
    if (existingModBalance) {
      // If there's an existing expiry date, extend it
      if (existingModBalance.expiresAt) {
        const currentExpiry = new Date(existingModBalance.expiresAt);
        
        // Calculate the new expiry date
        const extendedExpiry = new Date(currentExpiry);
        extendedExpiry.setDate(extendedExpiry.getDate() + daysToExtend);
        
        await User.updateOne(
          { _id: resellerId, 'modBalances.modId': modId },
          { $set: { 'modBalances.$.expiresAt': extendedExpiry } }
        );
      } else {
        // Otherwise set a new expiry date
        await User.updateOne(
          { _id: resellerId, 'modBalances.modId': modId },
          { $set: { 'modBalances.$.expiresAt': newExpiryDate } }
        );
      }
    } else {
      // Create a new mod-specific balance with expiry
      await User.updateOne(
        { _id: resellerId },
        { 
          $push: { 
            modBalances: {
              modId,
              balance: 0,
              initialBalance: 0,
              unlimitedBalance: false,
              expiresAt: newExpiryDate
            }
          }
        }
      );
    }
    
    // Fetch the updated user to return in response
    const updatedUser = await User.findById(resellerId);
    const updatedModBalance = updatedUser.modBalances?.find(mb => mb.modId === modId);
    
    // Get a user-friendly date format for the response
    let expiryDateString = 'No expiry';
    if (updatedModBalance && updatedModBalance.expiresAt) {
      const expiryDate = new Date(updatedModBalance.expiresAt);
      expiryDateString = expiryDate.toISOString().split('T')[0]; // Send just the date part
    }
    
    res.status(200).json({
      success: true,
      message: `Extended balance expiry for reseller ${resellerId} for mod ${modId} by ${daysToExtend} days`,
      data: {
        id: updatedUser._id,
        username: updatedUser.username,
        balance: updatedModBalance ? updatedModBalance.balance : updatedUser.balance,
        unlimitedBalance: updatedModBalance ? updatedModBalance.unlimitedBalance : updatedUser.unlimitedBalance,
        active: true,
        expiresAt: expiryDateString,
        hasModSpecificBalance: !!updatedModBalance,
        createdAt: updatedUser.createdAt
      }
    });
  } catch (error) {
    console.error('Error extending mod balance expiry:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while extending balance expiry'
    });
  }
});

// @desc    Extend balance expiry for ALL resellers for a specific mod
// @route   POST /api/mods/:modId/resellers/extend-all
// @access  Private
exports.extendAllModBalanceExpiry = asyncHandler(async (req, res) => {
  const { modId } = req.params;
  const { days } = req.body;
  
  // Ensure days is a valid number
  const daysToExtend = parseInt(days);
  if (isNaN(daysToExtend) || daysToExtend < 1) {
    return res.status(400).json({
      success: false,
      message: 'Days to extend must be a positive number'
    });
  }
  
  if (!MODS[modId]) {
    return res.status(404).json({
      success: false,
      message: `Mod with ID ${modId} not found`
    });
  }
  
  const godeyeAccess = checkGodeyeAccess(req, modId);
  
  if (godeyeAccess.restricted) {
    return res.status(godeyeAccess.statusCode).json(godeyeAccess.response);
  }
  
  try {
    // Find all users with this mod in their modBalances
    const users = await User.find({ 'modBalances.modId': modId });
    
    if (!users || users.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No resellers found for this mod',
        count: 0
      });
    }
    
    // Process each user
    const updatedUsers = [];
    for (const user of users) {
      const existingModBalance = user.modBalances.find(mb => mb.modId === modId);
      
      if (existingModBalance) {
        // If there's an existing expiry date, extend it
        if (existingModBalance.expiresAt) {
          const currentExpiry = new Date(existingModBalance.expiresAt);
          
          // Calculate the new expiry date
          const extendedExpiry = new Date(currentExpiry);
          extendedExpiry.setDate(extendedExpiry.getDate() + daysToExtend);
          
          await User.updateOne(
            { _id: user._id, 'modBalances.modId': modId },
            { $set: { 'modBalances.$.expiresAt': extendedExpiry } }
          );
        } else {
          // Otherwise set a new expiry date
          const newExpiryDate = new Date();
          newExpiryDate.setDate(newExpiryDate.getDate() + daysToExtend);
          
          await User.updateOne(
            { _id: user._id, 'modBalances.modId': modId },
            { $set: { 'modBalances.$.expiresAt': newExpiryDate } }
          );
        }
        
        updatedUsers.push(user._id);
      }
    }
    
    res.status(200).json({
      success: true,
      message: `Extended balance expiry for ${updatedUsers.length} resellers for mod ${modId} by ${daysToExtend} days`,
      count: updatedUsers.length
    });
  } catch (error) {
    console.error('Error extending all mod balance expiry:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while extending all balance expiry'
    });
  }
}); 