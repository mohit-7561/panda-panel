const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Please add a username'],
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/.+\@.+\..+/, 'Please enter a valid email address'],
    sparse: true // Allows null/undefined while maintaining uniqueness for non-null values
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['admin', 'owner'],
    default: 'admin'
  },
  balance: {
    type: Number,
    default: 0
  },
  unlimitedBalance: {
    type: Boolean,
    default: false
  },
  balanceExpiresAt: {
    type: Date,
    default: null
  },
  balanceDuration: {
    type: String,
    default: null
  },
  // Store mod-specific balances
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
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
}); 