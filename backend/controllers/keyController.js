const AdminKey = require('../models/Key');
const OwnerKey = require('../models/OwnerKey');
const User = require('../models/User');
const crypto = require('crypto');

// Debug logging to check if models are loaded correctly// @desc    Generate a new key
// @route   POST /api/keys
// @access  Private/Admin
exports.generateKey = async (req, res) => {
  try {
    const { name, description, expiresAt, maxUsage, maxDevices, game } = req.body;
    
    if (!expiresAt) {
      return res.status(400).json({ 
        success: false, 
        message: 'Expiry date is required' 
      });
    }

    // Create expiry date
    const expiry = new Date(expiresAt);
    
    // Check if expiry date is valid
    if (expiry < new Date()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Expiry date must be in the future' 
      });
    }
    
    // Get current user
    const user = await User.findById(req.user._id).lean();
    
    // Only check balance for admin/reseller users, owners have unlimited balance
    if (user.role === 'admin') {
      // Check if user is active
      if (!user.active) {
        return res.status(403).json({
          success: false,
          message: 'Your account has been deactivated. Please contact the owner for assistance.'
        });
      }
      
      // Check if balance has expired
      if (user.balanceExpiresAt && new Date() > user.balanceExpiresAt && !user.unlimitedBalance) {
        return res.status(400).json({
          success: false,
          message: 'Your balance has expired. Please contact the owner to extend it.'
        });
      }

      // Calculate duration in days
      const daysUntilExpiry = Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24));
      
      // Calculate key cost based on the user's deduction rates
      let keyCost = 0;
      
      if (user.deductionRates) {
        // Determine which rate to use based on duration
        let rateKey = '';
        if (daysUntilExpiry <= 1) rateKey = 'day1';
        else if (daysUntilExpiry <= 3) rateKey = 'day3';
        else if (daysUntilExpiry <= 7) rateKey = 'day7';
        else if (daysUntilExpiry <= 15) rateKey = 'day15';
        else if (daysUntilExpiry <= 30) rateKey = 'day30';
        else rateKey = 'day60';
        
        // Get the cost for this duration
        const costPerKey = user.deductionRates[rateKey] || 500; // Default to 500 if rate not found
        
        // Multiply by the number of devices
        keyCost = costPerKey * maxDevices;
        
        console.log(`Using deduction rate: ${rateKey} = ${costPerKey} × ${maxDevices} devices = ${keyCost}`);
      } else {
        // Fallback calculation if no deduction rates
        const dayCost = 1;
        keyCost = daysUntilExpiry * dayCost * maxDevices;
        console.log(`No deduction rates found. Using default calculation: ${daysUntilExpiry} days × ${dayCost} × ${maxDevices} devices = ${keyCost}`);
      }
      
      if (!user.unlimitedBalance && user.balance < keyCost) {
        return res.status(400).json({
          success: false,
          message: `Insufficient balance to create a key for ${daysUntilExpiry} day(s) with ${maxDevices} device(s). Required: ${keyCost}, Available: ${user.balance}`
        });
      }
      
      // Deduct balance if not unlimited
      if (!user.unlimitedBalance) {
        // Update user's balance in database
        await User.findByIdAndUpdate(user._id, { $inc: { balance: -keyCost } });
        user.balance -= keyCost; // Update local copy for response
      }
    }
    
    // Generate name if not provided
    const keyName = name || (game ? `Key for ${game}` : `Key-${Date.now()}`);
    
    // Generate a random license key
    const licenseKey = crypto.randomBytes(16).toString('hex');
    
    // Create key
    const key = await AdminKey.create({
      key: licenseKey,
      name: keyName,
      description: description || '',
      expiresAt: expiry,
      maxUsage: maxUsage || 0,
      maxDevices: maxDevices || 1,
      game: game || '',
      createdBy: req.user._id
    });
    
    if (key) {
      res.status(201).json({
        success: true,
        key,
        balance: user.balance,
        unlimitedBalance: user.unlimitedBalance || false,
        balanceDuration: user.balanceDuration || '30 days',
        balanceExpiresAt: user.balanceExpiresAt
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid key data' });
    }
  } catch (error) {
    console.error('Key creation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all keys
// @route   GET /api/keys
// @access  Private/Admin
exports.getKeys = async (req, res) => {
  try {
    const keys = await AdminKey.find({}).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: keys.length,
      keys
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get keys for a specific mod
// @route   GET /api/keys/mod/:modId
// @access  Private (Owner, Admin)
exports.getModKeys = async (req, res) => {
  try {
    const { modId } = req.params;if (!modId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Mod ID is required' 
      });
    }
    
    // Build query based on user role
    let query = { game: modId };
    
    if (req.user.role === 'owner') {
      // Owner can see their own keys or all owner keys
      if (req.query.filterBy === 'own') {
        // Get only owner's keys from OwnerKey collection
        query.createdBy = req.user._id;
        const ownerKeys = await OwnerKey.find(query).sort({ createdAt: -1 })
          .populate('createdBy', 'username role');
          
        return res.json({
          success: true,
          count: ownerKeys.length,
          keys: ownerKeys
        });
      } else if (req.query.ownerKeysOnly === 'true') {
        // Get all owner keys but no admin keys
        const ownerKeys = await OwnerKey.find({ game: modId }).sort({ createdAt: -1 })
          .populate('createdBy', 'username role');
          
        return res.json({
          success: true,
          count: ownerKeys.length,
          keys: ownerKeys
        });
      } else {
        // Get both owner keys and admin keys
        const ownerKeys = await OwnerKey.find({ game: modId }).sort({ createdAt: -1 })
          .populate('createdBy', 'username role');
          
        const adminKeys = await AdminKey.find({ game: modId }).sort({ createdAt: -1 })
          .populate('createdBy', 'username role');
          
        // Combine the two arrays
        const allKeys = [...ownerKeys, ...adminKeys];
        
        // Sort by creation date (newest first)
        allKeys.sort((a, b) => b.createdAt - a.createdAt);
        
        return res.json({
          success: true,
          count: allKeys.length,
          keys: allKeys
        });
      }
    } else {
      // Admin/reseller can ONLY see keys they created themselves
      query.createdBy = req.user._id;
      
      const adminKeys = await AdminKey.find(query).sort({ createdAt: -1 })
        .populate('createdBy', 'username role');
      
      return res.json({
        success: true,
        count: adminKeys.length,
        keys: adminKeys
      });
    }
  } catch (error) {
    console.error('Error fetching mod keys:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get keys created by the current user
// @route   GET /api/keys/my-keys
// @access  Private
exports.getUserKeys = async (req, res) => {
  try {// Verify models are available
    if (!AdminKey || !OwnerKey) {
      console.error('Model import error - AdminKey:', !!AdminKey, 'OwnerKey:', !!OwnerKey);
      return res.status(500).json({
        success: false,
        message: 'Server configuration error - models not available'
      });
    }
    
    // Get user ID from request
    const userId = req.user._id;
    
    // Build query
    let query = { createdBy: userId };
    
    // Allow filtering by mod if specified
    if (req.query.modId) {
      query.game = req.query.modId;}try {
      // Based on user role, fetch from appropriate collection
      if (req.user.role === 'owner') {// Verify model exists and is a valid mongoose model
        if (!OwnerKey.find || typeof OwnerKey.find !== 'function') {
          console.error('OwnerKey model error - find method not available');
          return res.status(500).json({
            success: false,
            message: 'Server configuration error - invalid model'
          });
        }
        
        const ownerKeys = await OwnerKey.find(query).sort({ createdAt: -1 })
          .populate('createdBy', 'username role');return res.json({
          success: true,
          count: ownerKeys.length,
          keys: ownerKeys
        });
      } else {
        // For admins/resellers, get from AdminKey collection// Verify model exists and is a valid mongoose model
        if (!AdminKey.find || typeof AdminKey.find !== 'function') {
          console.error('AdminKey model error - find method not available');
          return res.status(500).json({
            success: false,
            message: 'Server configuration error - invalid model'
          });
        }
        
        const adminKeys = await AdminKey.find(query).sort({ createdAt: -1 })
          .populate('createdBy', 'username role');return res.json({
          success: true,
          count: adminKeys.length,
          keys: adminKeys
        });
      }
    } catch (dbError) {
      console.error('Database operation error:', dbError);
      console.error('Error stack:', dbError.stack);
      return res.status(500).json({
        success: false,
        message: 'Database operation failed',
        error: dbError.message
      });
    }
  } catch (error) {
    console.error('Error in getUserKeys:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch keys',
      error: error.message
    });
  }
};

// @desc    Get key by ID
// @route   GET /api/keys/:id
// @access  Private/Admin
exports.getKeyById = async (req, res) => {
  try {
    // Check in AdminKey collection first
    let key = await AdminKey.findById(req.params.id);
    
    // If not found, check in OwnerKey collection
    if (!key && req.user.role === 'owner') {
      key = await OwnerKey.findById(req.params.id);
    }
    
    if (key) {
      // Check if user has permission to view this key
      if (req.user.role !== 'owner' && key.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ 
          success: false, 
          message: 'Not authorized to view this key' 
        });
      }
      
      res.json({
        success: true,
        key
      });
    } else {
      res.status(404).json({ success: false, message: 'Key not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update key
// @route   PUT /api/keys/:id
// @access  Private/Admin
exports.updateKey = async (req, res) => {
  try {
    const { isActive, expiresAt, maxUsage, maxDevices, game } = req.body;
    
    // First check in the appropriate collection based on user role
    let key = null;
    let isOwnerKey = false;
    
    if (req.user.role === 'owner') {
      // Check in OwnerKey first for owners
      key = await OwnerKey.findById(req.params.id);
      if (key) {
        isOwnerKey = true;
      } else {
        // If not found in OwnerKey, try AdminKey
        key = await AdminKey.findById(req.params.id);
      }
    } else {
      // Admins can only update keys in AdminKey
      key = await AdminKey.findById(req.params.id);
    }
    
    if (!key) {
      return res.status(404).json({ success: false, message: 'Key not found' });
    }
    
    // Check if the user is the creator of the key or an owner
    if (req.user.role !== 'owner' && key.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to update this key' 
      });
    }
    
    key.isActive = isActive !== undefined ? isActive : key.isActive;
    key.expiresAt = expiresAt ? new Date(expiresAt) : key.expiresAt;
    key.maxUsage = maxUsage !== undefined ? maxUsage : key.maxUsage;
    key.maxDevices = maxDevices !== undefined ? maxDevices : key.maxDevices;
    key.game = game !== undefined ? game : key.game;
    
    const updatedKey = await key.save();
    
    res.json({
      success: true,
      key: updatedKey
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete key
// @route   DELETE /api/keys/:id
// @access  Private/Admin
exports.deleteKey = async (req, res) => {
  try {
    // First, check if it's an owner key
    let key = null;
    
    if (req.user.role === 'owner') {
      // Owners can delete from both collections
      key = await OwnerKey.findById(req.params.id);
      
      if (!key) {
        // If not found in OwnerKey, check AdminKey
        key = await AdminKey.findById(req.params.id);
      }
    } else {
      // Admins can only delete from AdminKey
      key = await AdminKey.findById(req.params.id);
    }
    
    if (!key) {
      return res.status(404).json({ success: false, message: 'Key not found' });
    }
    
    // Check if the user is the creator of the key or an owner
    if (req.user.role !== 'owner' && key.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to delete this key' 
      });
    }
    
    await key.deleteOne();
    res.json({ success: true, message: 'Key removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Validate a key
// @route   POST /api/keys/validate
// @access  Public
exports.validateKey = async (req, res) => {
  try {
    const { key } = req.body;
    
    if (!key) {
      return res.status(400).json({ success: false, message: 'Key is required' });
    }
    
    // Check in AdminKey collection first
    let keyRecord = await AdminKey.findOne({ key });
    
    // If not found, check in OwnerKey collection
    if (!keyRecord) {
      keyRecord = await OwnerKey.findOne({ key });
    }
    
    if (!keyRecord) {
      return res.status(404).json({ success: false, message: 'Invalid key' });
    }
    
    // Check if key is valid
    if (!keyRecord.isValid()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Key is inactive, expired, or has reached maximum usage' 
      });
    }
    
    // Record usage
    await keyRecord.recordUsage();
    
    res.json({
      success: true,
      message: 'Key is valid',
      key: keyRecord
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Validate a key for a specific mod
// @route   POST /api/keys/validate-mod
// @access  Public
exports.validateKeyForMod = async (req, res) => {
  try {
    const { key, modId } = req.body;
    
    if (!key || !modId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Key and modId are required' 
      });
    }
    
    // Check in AdminKey collection first
    let keyRecord = await AdminKey.findOne({ key, game: modId });
    
    // If not found, check in OwnerKey collection
    if (!keyRecord) {
      keyRecord = await OwnerKey.findOne({ key, game: modId });
    }
    
    if (!keyRecord) {
      return res.status(404).json({ success: false, message: 'Invalid key for this mod' });
    }
    
    // Check if key is valid
    if (!keyRecord.isValid()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Key is inactive, expired, or has reached maximum usage' 
      });
    }
    
    // Record usage
    await keyRecord.recordUsage();
    
    res.json({
      success: true,
      message: 'Key is valid for this mod',
      keyDetails: {
        key: keyRecord.key,
        expiresAt: keyRecord.expiresAt,
        isActive: keyRecord.isActive,
        usageCount: keyRecord.usageCount,
        maxUsage: keyRecord.maxUsage,
        maxDevices: keyRecord.maxDevices
      }
    });
    
  } catch (error) {
    console.error('Mod key validation error:', error);
    res.status(500).json({ success: false, message: 'Server error during key validation' });
  }
};

// @desc    Generate mod-specific keys
// @route   POST /api/keys/generate-mod-keys
// @access  Private/Admin
exports.generateModKeys = async (req, res) => {
  try {
    console.log('GenerateModKeys request received:', {
      body: req.body,
      user: {
        id: req.user._id,
        role: req.user.role
      }
    });
    
    const { modId, amount = 1, duration = 30, isUnlimited = false, maxDevices = 1 } = req.body;
    
    if (!modId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Mod ID is required' 
      });
    }

    // Calculate expiry date based on duration
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + parseInt(duration));
    
    // Get current user
    const user = await User.findById(req.user._id).lean();
    console.log('User from DB:', {
      id: user._id,
      role: user.role,
      balance: user.balance,
      unlimitedBalance: user.unlimitedBalance,
      balanceExpiresAt: user.balanceExpiresAt
    });
    
    // Only check balance for admin/reseller users, owners have unlimited balance
    if (user.role === 'admin' || user.role === 'reseller') {
      // Check if balance has expired
      if (user.balanceExpiresAt && new Date() > user.balanceExpiresAt && !user.unlimitedBalance) {
        return res.status(400).json({
          success: false,
          message: 'Your balance has expired. Please contact the owner to extend it.'
        });
      }

      // Calculate key cost based on the user's deduction rates
      let keyCost = 0;
      
      if (user.deductionRates) {
        // Determine which rate to use based on duration
        let rateKey = '';
        if (duration <= 1) rateKey = 'day1';
        else if (duration <= 3) rateKey = 'day3';
        else if (duration <= 7) rateKey = 'day7';
        else if (duration <= 15) rateKey = 'day15';
        else if (duration <= 30) rateKey = 'day30';
        else rateKey = 'day60';
        
        // Get the cost for this duration
        const costPerKey = user.deductionRates[rateKey] || 500; // Default to 500 if rate not found
        
        // Multiply by the number of devices
        keyCost = costPerKey * maxDevices;
        
        console.log(`Using deduction rate: ${rateKey} = ${costPerKey} × ${maxDevices} devices = ${keyCost}`);
      } else {
        // Fallback calculation if no deduction rates
        const dayCost = 1;
        const daysUntilExpiry = Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24));
        keyCost = daysUntilExpiry * dayCost * maxDevices;
        console.log(`No deduction rates found. Using default calculation: ${daysUntilExpiry} days × ${dayCost} × ${maxDevices} devices = ${keyCost}`);
      }
      
      if (!user.unlimitedBalance && user.balance < keyCost) {
        return res.status(400).json({
          success: false,
          message: `Insufficient balance to create a key for ${duration} day(s) with ${maxDevices} device(s). Required: ${keyCost}, Available: ${user.balance}`
        });
      }
      
      // Deduct balance if not unlimited
      if (!user.unlimitedBalance) {
        // Update user's balance in database
        await User.findByIdAndUpdate(user._id, { $inc: { balance: -keyCost } });
        user.balance -= keyCost; // Update local copy for response
      }
    }
    
    // Generate the requested number of keys
    const generatedKeys = [];
    
    // Choose the right model based on user role
    const KeyModel = user.role === 'owner' ? OwnerKey : AdminKey;
    
    for (let i = 0; i < amount; i++) {
      // Generate a random license key
      const licenseKey = crypto.randomBytes(16).toString('hex');
      
      // Create key using the appropriate model
      const key = await KeyModel.create({
        key: licenseKey,
        name: `${modId} Key`,
        description: `License key for ${modId} mod`,
        expiresAt: expiry,
        maxUsage: isUnlimited ? 0 : 1,
        maxDevices: maxDevices,
        game: modId,
        createdBy: req.user._id
      });
      
      generatedKeys.push(key);
    }
    
    res.status(201).json({
      success: true,
      keys: generatedKeys,
      balance: user.balance,
      unlimitedBalance: user.unlimitedBalance || false,
      balanceExpiresAt: user.balanceExpiresAt
    });
    
  } catch (error) {
    console.error('Mod key generation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Extend key expiry by a number of days
// @route   POST/PATCH /api/keys/:id/extend
// @access  Private (Admin, Owner)
exports.extendKeyExpiry = async (req, res) => {
  try {
    const { id } = req.params;
    const { days } = req.body;
    
    if (!days || isNaN(days) || days < 1) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid number of days to extend the key'
      });
    }
    
    // Try to find the key in AdminKey collection
    let key = await AdminKey.findById(id);
    let KeyModel = AdminKey;
    
    // If not found, try OwnerKey collection
    if (!key) {
      key = await OwnerKey.findById(id);
      KeyModel = OwnerKey;
    }
    
    if (!key) {
      return res.status(404).json({
        success: false,
        message: 'Key not found'
      });
    }
    
    // Check permission: Owner can extend any key, Admin can only extend their own keys
    if (req.user.role === 'admin' && key.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only extend keys that you created'
      });
    }
    
    // Calculate new expiry date
    const currentExpiry = new Date(key.expiresAt);
    const newExpiry = new Date(currentExpiry);
    newExpiry.setDate(newExpiry.getDate() + parseInt(days));
    
    // Update the key
    key.expiresAt = newExpiry;
    await key.save();
    
    res.status(200).json({
      success: true,
      message: `Key expiry extended by ${days} days to ${newExpiry.toISOString()}`,
      key
    });
  } catch (error) {
    console.error('Error extending key expiry:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}; 