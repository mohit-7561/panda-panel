const mongoose = require('mongoose');

const referralCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  balance: {
    type: Number,
    required: true,
    min: 0
  },
  duration: {
    type: String,
    enum: ['1 day', '3 days', '7 days', '30 days', '60 days'],
    required: true
  },
  isUsed: {
    type: Boolean,
    default: false,
    index: true // Add index for better query performance
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  usedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  usedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 2592000 // 30 days in seconds
  },
  deductionRates: {
    day1: {
      type: Number,
      default: 100
    },
    day3: {
      type: Number,
      default: 150
    },
    day7: {
      type: Number,
      default: 200
    },
    day15: {
      type: Number,
      default: 300
    },
    day30: {
      type: Number,
      default: 500
    },
    day60: {
      type: Number,
      default: 800
    }
  }
});

// Middleware to ensure referral code can only be used once
referralCodeSchema.pre('save', function(next) {
  // If we're trying to set isUsed to true and it's already used, throw an error
  if (this.isModified('isUsed') && this.isUsed && this.usedBy) {
    const error = new Error('This referral code has already been used');
    return next(error);
  }
  next();
});

// Method to generate a unique random code
referralCodeSchema.statics.generateUniqueCode = async function() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code;
  let isUnique = false;
  
  // Keep generating new codes until we find one that's unique
  while (!isUnique) {
    // Generate a 10-character code
    code = Array(10).fill().map(() => characters.charAt(Math.floor(Math.random() * characters.length))).join('');
    
    // Check if this code already exists
    const existingCode = await this.findOne({ code });
    if (!existingCode) {
      isUnique = true;
    }
  }
  
  return code;
};

const ReferralCode = mongoose.model('ReferralCode', referralCodeSchema);

module.exports = ReferralCode;