const mongoose = require('mongoose');
const crypto = require('crypto');

const ownerKeySchema = new mongoose.Schema({
  key: {
    type: String,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  usageCount: {
    type: Number,
    default: 0
  },
  maxUsage: {
    type: Number,
    default: 0 // 0 means unlimited
  },
  maxDevices: {
    type: Number,
    default: 1
  },
  game: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastUsed: {
    type: Date
  }
});

// Generate a unique key before saving if one isn't provided
ownerKeySchema.pre('save', function(next) {
  // Always generate a key if it doesn't exist, not just for new documents
  if (!this.key) {
    this.key = crypto.randomBytes(16).toString('hex');
  }
  
  next();
});

// Method to check if key is valid (not expired and still active)
ownerKeySchema.methods.isValid = function() {
  if (!this.isActive) return false;
  if (this.expiresAt < new Date()) return false;
  if (this.maxUsage > 0 && this.usageCount >= this.maxUsage) return false;
  
  return true;
};

// Method to record usage of key
ownerKeySchema.methods.recordUsage = async function() {
  this.usageCount += 1;
  this.lastUsed = new Date();
  return await this.save();
};

const OwnerKey = mongoose.model('OwnerKey', ownerKeySchema);

module.exports = OwnerKey; 