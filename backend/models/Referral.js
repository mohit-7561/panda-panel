const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  modId: {
    type: String,
    required: true,
    trim: true
  },
  balance: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  unlimited: {
    type: Boolean,
    default: false
  },
  duration: {
    type: String,
    enum: ['30 days', '60 days', '90 days', '180 days', '365 days', 'unlimited'],
    required: true
  },
  active: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  usedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  usedCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: false
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
}, {
  timestamps: true
});

// Pre-save middleware to calculate expiresAt date
referralSchema.pre('save', function(next) {
  if (this.duration === 'unlimited') {
    this.expiresAt = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000);
  } else {
    const days = parseInt(this.duration.split(' ')[0]);
    this.expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }
  next();
});

// Method to check if referral is expired
referralSchema.methods.isExpired = function() {
  if (this.duration === 'unlimited') return false;
  return this.expiresAt < new Date();
};

const Referral = mongoose.model('Referral', referralSchema);

module.exports = Referral; 