const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['customer', 'staff', 'superadmin'], default: 'customer' },
  createdAt: { type: Date, default: Date.now },
  
  // Profile fields
  phone: { type: String, default: '' },
  bio: { type: String, default: '' },
  location: { type: String, default: '' },
  profilePicture: { type: String, default: '' },
  
  // Security
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: { type: String, default: '' },
  
  // Preferences
  preferences: {
    language: { type: String, default: 'en' },
    theme: { type: String, default: 'light' },
    timezone: { type: String, default: 'UTC' },
    dateFormat: { type: String, default: 'MM/DD/YYYY' },
    notifications: {
      orders: { type: Boolean, default: true },
      products: { type: Boolean, default: true },
      system: { type: Boolean, default: true },
      push: { type: Boolean, default: false }
    }
  },
  
  // Active sessions
  sessions: [{
    device: String,
    location: String,
    ip: String,
    lastActive: Date,
    current: Boolean,
    userAgent: String
  }],
  
  // Activity log
  activities: [{
    type: { type: String },
    message: String,
    timestamp: { type: Date, default: Date.now },
    ip: String
  }],
  
  // Account status
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  lastActivity: { type: Date }
});

module.exports = mongoose.model('User', userSchema);
