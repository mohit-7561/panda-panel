const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Get users created by current user
// @route   GET /api/balance/users
// @access  Private (Owner, Admin)
exports.getCreatedUsers = async (req, res) => {
  try {
    const users = await User.find({ createdBy: req.user._id })
      .select('-password')
      .sort({ createdAt: -1 });
    
    // Current date for checking expiry
    const currentDate = new Date();
    
    // Format users with additional status information
    const formattedUsers = users.map(user => {
      const userObj = user.toObject();
      
      // Make sure unlimitedBalance is explicitly included
      userObj.unlimitedBalance = user.unlimitedBalance || false;
      
      // Add expiry status
      if (user.balanceExpiresAt) {
        userObj.isExpired = new Date(user.balanceExpiresAt) < currentDate;
      } else {
        userObj.isExpired = false;
      }
      
      // Add status field for easier frontend handling
      if (!user.active) {
        userObj.status = 'inactive';
      } else if (user.balance === 0 && !user.unlimitedBalance) {
        userObj.status = 'finished';
      } else if (user.balanceExpiresAt && new Date(user.balanceExpiresAt) < currentDate) {
        userObj.status = 'expired';
      } else {
        userObj.status = 'active';
      }
      
      return userObj;
    });
    
    res.json({
      success: true,
      count: users.length,
      users: formattedUsers
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new admin (reseller)
// @route   POST /api/balance/create-admin
// @access  Private (Owner only)
exports.createAdmin = async (req, res) => {
  try {
    const { username, password, balance } = req.body;
    
    // Check if user already exists
    const userExists = await User.findOne({ username });
    
    if (userExists) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists' 
      });
    }
    
    // Create admin user
    const userData = {
      username,
      password,
      role: 'admin',
      balance,
      createdBy: req.user._id
    };
    
    const adminUser = await User.create(userData);
    
    if (adminUser) {
      const responseUser = {
        _id: adminUser._id,
        username: adminUser.username,
        role: adminUser.role,
        balance: adminUser.balance,
        unlimitedBalance: adminUser.unlimitedBalance || false,
        balanceExpiresAt: adminUser.balanceExpiresAt
      };
      
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

// @desc    Add balance to admin
// @route   POST /api/balance/add-balance
// @access  Private (Owner only)
exports.addBalance = async (req, res) => {
  try {
    const { userId, amount } = req.body;
    
    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide a valid amount' 
      });
    }
    
    // Find admin user
    const adminUser = await User.findById(userId);
    
    if (!adminUser) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Verify this admin was created by the owner
    if (adminUser.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized: You can only add balance to users you created' 
      });
    }
    
    // Add balance - don't change unlimitedBalance status
    adminUser.balance += Number(amount);
    await adminUser.save();
    
    // Determine status
    let status = 'active';
    if (!adminUser.active) {
      status = 'inactive';
    } else if (adminUser.balance === 0 && !adminUser.unlimitedBalance) {
      status = 'finished';
    } else if (adminUser.balanceExpiresAt && new Date(adminUser.balanceExpiresAt) < new Date()) {
      status = 'expired';
    }
    
    // Get Socket.io instance - safely access io instance
    try {
      // Try both methods to access the io instance
      const io = global.io || req.app.get('io');
      
      // Emit balance update event to the specific user only if io exists
      if (io) {
        io.to(adminUser._id.toString()).emit('balance_updated', {
          balance: adminUser.balance,
          unlimitedBalance: adminUser.unlimitedBalance || false,
          balanceExpiresAt: adminUser.balanceExpiresAt,
          status
        });
      } else {
        console.warn('Socket.io instance not available for real-time updates');
      }
    } catch (socketError) {
      console.error('Socket error:', socketError);
      // Continue with the response even if socket fails
    }
    
    res.json({
      success: true,
      message: `Successfully added ${amount} to ${adminUser.username}'s balance`,
      user: {
        _id: adminUser._id,
        username: adminUser.username,
        balance: adminUser.balance,
        unlimitedBalance: adminUser.unlimitedBalance || false,
        balanceExpiresAt: adminUser.balanceExpiresAt,
        status
      }
    });
  } catch (error) {
    console.error('Add balance error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Update admin balance
// @route   PUT /api/balance/update-balance
// @access  Private (Owner only)
exports.updateBalance = async (req, res) => {
  try {
    const { userId, balance } = req.body;
    
    // Validate balance
    if (balance < 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Balance cannot be negative' 
      });
    }
    
    // Find admin user
    const adminUser = await User.findById(userId);
    
    if (!adminUser) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Verify this admin was created by the owner
    if (adminUser.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized: You can only update balance for users you created' 
      });
    }
    
    // Set new balance and disable unlimited balance
    adminUser.balance = Number(balance);
    adminUser.unlimitedBalance = false;
    await adminUser.save();
    
    res.json({
      success: true,
      message: `Successfully updated ${adminUser.username}'s balance to ${balance}`,
      user: {
        _id: adminUser._id,
        username: adminUser.username,
        balance: adminUser.balance,
        unlimitedBalance: adminUser.unlimitedBalance || false,
        balanceExpiresAt: adminUser.balanceExpiresAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user balance and duration
// @route   PUT /api/balance/update-balance-with-duration
// @access  Private/Owner
exports.updateBalanceWithDuration = asyncHandler(async (req, res) => {
  const { userId, balance, balanceDuration } = req.body;

  // Validate input
  if (!userId || balance === undefined || !balanceDuration) {
    res.status(400);
    throw new Error('User ID, balance, and duration are required');
  }

  if (balance < 0) {
    res.status(400);
    throw new Error('Balance cannot be negative');
  }

  // Check if duration is valid
  const validDurations = ['1 day', '3 days', '7 days', '30 days', '60 days'];
  if (!validDurations.includes(balanceDuration)) {
    res.status(400);
    throw new Error('Invalid duration. Valid options are: 1 day, 3 days, 7 days, 30 days, 60 days');
  }

  // Find user
  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Check if the user was created by the current user
  if (user.createdBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('You can only update balance for users you created');
  }

  // Calculate new expiry date
  const days = {
    '1 day': 1,
    '3 days': 3,
    '7 days': 7,
    '30 days': 30,
    '60 days': 60
  };
  const daysToAdd = days[balanceDuration];
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + daysToAdd);

  // Update balance and duration
  user.balance = balance;
  user.balanceDuration = balanceDuration;
  user.balanceExpiresAt = expiryDate;
  // When setting a specific balance, turn off unlimited balance
  user.unlimitedBalance = false;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Balance and duration updated successfully',
    user: {
      _id: user._id,
      username: user.username,
      balance: user.balance,
      balanceDuration: user.balanceDuration,
      balanceExpiresAt: user.balanceExpiresAt,
      unlimitedBalance: user.unlimitedBalance
    }
  });
});

// @desc    Set unlimited balance for a reseller
// @route   PUT /api/balance/set-unlimited
// @access  Private/Owner
exports.setUnlimitedBalance = asyncHandler(async (req, res) => {
  const { userId, unlimited } = req.body;

  // Validate input
  if (!userId || unlimited === undefined) {
    res.status(400);
    throw new Error('User ID and unlimited status are required');
  }

  // Find user
  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Check if user is an admin (reseller)
  if (user.role !== 'admin') {
    res.status(400);
    throw new Error('Unlimited balance can only be set for resellers');
  }

  // Check if the user was created by the current user
  if (user.createdBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('You can only update users you created');
  }

  // Update unlimited balance status
  user.unlimitedBalance = Boolean(unlimited);
  await user.save();

  res.status(200).json({
    success: true,
    message: `Unlimited balance ${unlimited ? 'enabled' : 'disabled'} successfully`,
    user: {
      _id: user._id,
      username: user.username,
      balance: user.balance,
      unlimitedBalance: user.unlimitedBalance
    }
  });
});

// @desc    Extend balance expiry date
// @route   PUT /api/balance/extend-expiry
// @access  Private/Owner
exports.extendBalanceExpiry = asyncHandler(async (req, res) => {
  const { userId, days } = req.body;

  // Validate input
  if (!userId || !days || days <= 0) {
    res.status(400);
    throw new Error('User ID and positive number of days are required');
  }

  // Find user
  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Check if the user was created by the current user
  if (user.createdBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('You can only update users you created');
  }

  // Calculate new expiry date
  const currentExpiry = user.balanceExpiresAt || new Date();
  const newExpiry = new Date(currentExpiry);
  newExpiry.setDate(newExpiry.getDate() + parseInt(days));
  
  // Update expiry date
  user.balanceExpiresAt = newExpiry;
  await user.save();

  res.status(200).json({
    success: true,
    message: `Balance expiry extended by ${days} days`,
    user: {
      _id: user._id,
      username: user.username,
      balance: user.balance,
      balanceExpiresAt: user.balanceExpiresAt
    }
  });
});

// @desc    Delete user
// @route   DELETE /api/balance/delete-user
// @access  Private/Owner
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.body;
    
    // Find user
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Verify this user was created by the owner
    if (user.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized: You can only delete users you created' 
      });
    }
    
    // Delete user
    await User.findByIdAndDelete(userId);
    
    res.json({
      success: true,
      message: `Successfully deleted user ${user.username}`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle reseller active status
// @route   PUT /api/balance/toggle-active
// @access  Private (Owner only)
exports.toggleResellerActive = async (req, res) => {
  try {
    const { userId, active } = req.body;
    
    // Validate input
    if (userId === undefined || active === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID and active status are required' 
      });
    }
    
    // Find the reseller user
    const resellerUser = await User.findById(userId);
    
    if (!resellerUser) {
      return res.status(404).json({ 
        success: false, 
        message: 'Reseller not found' 
      });
    }
    
    // Verify this reseller was created by the owner
    if (resellerUser.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized: You can only update resellers you created' 
      });
    }
    
    // Verify the user is actually a reseller
    if (resellerUser.role !== 'admin') {
      return res.status(400).json({ 
        success: false, 
        message: 'This user is not a reseller' 
      });
    }
    
    // Update the active status
    resellerUser.active = Boolean(active);
    await resellerUser.save();
    
    // Determine status
    let status = 'active';
    if (!resellerUser.active) {
      status = 'inactive';
    } else if (resellerUser.balance === 0 && !resellerUser.unlimitedBalance) {
      status = 'finished';
    } else if (resellerUser.balanceExpiresAt && new Date(resellerUser.balanceExpiresAt) < new Date()) {
      status = 'expired';
    }
    
    // Get Socket.io instance - safely access io instance
    try {
      const io = global.io || req.app.get('io');
      
      // Emit status update event to the specific user only if io exists
      if (io) {
        io.to(resellerUser._id.toString()).emit('status_updated', {
          user_id: resellerUser._id.toString(),
          active: resellerUser.active,
          status
        });
      } else {
        console.warn('Socket.io instance not available for real-time updates');
      }
    } catch (socketError) {
      console.error('Socket error:', socketError);
      // Continue with the response even if socket fails
    }
    
    res.json({
      success: true,
      message: `Reseller ${resellerUser.username} has been ${active ? 'activated' : 'deactivated'} successfully`,
      user: {
        _id: resellerUser._id,
        username: resellerUser.username,
        active: resellerUser.active,
        status
      }
    });
  } catch (error) {
    console.error('Toggle reseller active status error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// Delete the named exports below