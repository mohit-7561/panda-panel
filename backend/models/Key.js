const mongoose = require('mongoose');
const crypto = require('crypto');

// Rename to adminKeySchema to reflect its purpose
const adminKeySchema = new mongoose.Schema({
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
adminKeySchema.pre('save', function(next) {
  // Always generate a key if it doesn't exist, not just for new documents
  if (!this.key) {
    this.key = crypto.randomBytes(16).toString('hex');
  }
  
  next();
});

// Method to check if key is valid (not expired and still active)
adminKeySchema.methods.isValid = function() {
  if (!this.isActive) return false;
  if (this.expiresAt < new Date()) return false;
  if (this.maxUsage > 0 && this.usageCount >= this.maxUsage) return false;
  
  return true;
};

// Method to record usage of key
adminKeySchema.methods.recordUsage = async function() {
  this.usageCount += 1;
  this.lastUsed = new Date();
  return await this.save();
};

// Rename the model to AdminKey
const AdminKey = mongoose.model('AdminKey', adminKeySchema);

// Export the AdminKey model
module.exports = AdminKey; 