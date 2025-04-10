const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Regular user schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email']
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'owner'],
    default: 'user'
  },
  balance: {
    type: Number,
    default: 0
  },
  initialBalance: {
    type: Number,
    default: 0
  },
  unlimitedBalance: {
    type: Boolean,
    default: false
  },
  balanceDuration: {
    type: String,
    enum: ['1 day', '3 days', '7 days', '30 days', '60 days', '90 days'],
    default: '30 days'
  },
  balanceExpiresAt: {
    type: Date,
    default: null
  },
  active: {
    type: Boolean,
    default: true
  },
  deductionRates: {
    day1: { type: Number, default: 100 },
    day3: { type: Number, default: 150 },
    day7: { type: Number, default: 200 },
    day15: { type: Number, default: 300 },
    day30: { type: Number, default: 500 },
    day60: { type: Number, default: 800 }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Mod-specific balances (for resellers)
  modBalances: [
    {
      modId: {
        type: String,
        required: true
      },
      balance: {
        type: Number,
        default: 0
      },
      unlimitedBalance: {
        type: Boolean,
        default: false
      },
      expiresAt: {
        type: Date,
        default: null
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Encrypt password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it's modified or new
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    // Hash password with salt round of 10
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare entered password with stored hash
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Export model
module.exports = mongoose.model('User', userSchema); 