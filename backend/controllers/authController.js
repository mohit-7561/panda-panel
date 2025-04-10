const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY || '7d'
  });
};

// @desc    Create an owner account (first time setup)
// @route   POST /api/auth/create-owner
// @access  Public (but should be secured via one-time code or env variable)
exports.createOwner = async (req, res) => {
  try {
    const { username, password, setupCode } = req.body;
    
    // Verify setup code matches env variable
    if (setupCode !== process.env.OWNER_SETUP_CODE) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid setup code' 
      });
    }
    
    // Check if any owner already exists
    const ownerExists = await User.findOne({ role: 'owner' });
    
    if (ownerExists) {
      return res.status(400).json({ 
        success: false, 
        message: 'Owner account already exists' 
      });
    }
    
    // Check if user already exists
    const userExists = await User.findOne({ username });
    
    if (userExists) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists' 
      });
    }
    
    // Create owner user with unlimited balance
    const owner = await User.create({
      username,
      password,
      role: 'owner',
      balance: Number.MAX_SAFE_INTEGER // Unlimited balance
    });
    
    if (owner) {
      res.status(201).json({
        success: true,
        user: {
          _id: owner._id,
          username: owner.username,
          role: owner.role,
          token: generateToken(owner._id)
        },
        message: 'Owner account created successfully'
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user already exists
    const userExistsQuery = { username };
    if (email) {
      userExistsQuery.$or = [{ username }, { email }];
    }
    
    const userExists = await User.findOne(userExistsQuery);
    
    if (userExists) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists' 
      });
    }
    
    // Create user
    const userData = {
      username,
      password,
      role: 'user'
    };
    
    // Add email only if provided
    if (email) {
      userData.email = email;
    }
    
    const user = await User.create(userData);
    
    if (user) {
      const responseUser = {
        _id: user._id,
        username: user.username,
        role: user.role,
        token: generateToken(user._id)
      };
      
      // Add email to response only if it exists
      if (user.email) {
        responseUser.email = user.email;
      }
      
      res.status(201).json({
        success: true,
        user: responseUser
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Check if user exists and populate creator info
    const user = await User.findOne({ username })
      .populate('createdBy', 'username');
    
    if (user && (await user.comparePassword(password))) {// We only need to track initialBalance once for reference
      // For resellers, we should NEVER reset the balance back to initialBalance
      let userUpdated = false;
      
      // If initialBalance is not set but we have a balance, set initialBalance for reference only
      if (user.role === 'admin' && (user.initialBalance === undefined || user.initialBalance === null) && user.balance !== undefined) {
        user.initialBalance = user.balance;
        userUpdated = true;}
      
      // Save user if we made changes
      if (userUpdated) {
        await user.save();}
      
      // Prepare response with user details
      const responseUser = {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        balance: user.balance,
        unlimitedBalance: user.unlimitedBalance || false,
        balanceExpiresAt: user.balanceExpiresAt,
        deductionRates: user.deductionRates,
        active: user.active,
        token: generateToken(user._id)
      };
      
      // Log deduction rates if they exist
      if (user.deductionRates) {
        console.log('User deduction rates:', user.deductionRates);
      } else {
        console.log('No deduction rates found for user');
      }
      
      // Add creator information if available
      if (user.createdBy) {
        responseUser.createdBy = {
          _id: user.createdBy._id,
          username: user.createdBy.username
        };
      }
      
      // Add mod balances if they exist
      if (user.modBalances && user.modBalances.length > 0) {
        responseUser.modBalances = user.modBalances;
      }
      
      res.json({
        success: true,
        user: responseUser
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid username or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
exports.getUserProfile = async (req, res) => {
  try {
    // Use populate to get creator information
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('createdBy', 'username');
    
    if (user) {
      // Log mod balances for debugging if they exist
      if (user.modBalances && user.modBalances.length > 0) {
        console.log(`User has ${user.modBalances.length} mod balances`);
      }
      
      // Prepare the response
      const responseUser = {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        balance: user.balance,
        unlimitedBalance: user.unlimitedBalance || false,
        balanceExpiresAt: user.balanceExpiresAt,
        deductionRates: user.deductionRates,
        active: user.active
      };
      
      // Log deduction rates if they exist
      if (user.deductionRates) {
        console.log('User deduction rates:', user.deductionRates);
      } else {
        console.log('No deduction rates found for user');
      }
      
      // Add creator information if available
      if (user.createdBy) {
        responseUser.createdBy = {
          _id: user.createdBy._id,
          username: user.createdBy.username
        };
      }
      
      // Add mod balances if they exist
      if (user.modBalances && user.modBalances.length > 0) {
        responseUser.modBalances = user.modBalances;
      }
      
      res.json({
        success: true,
        user: responseUser
      });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}; 