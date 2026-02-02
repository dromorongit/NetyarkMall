const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const { auth, superAdminAuth } = require('../middleware/auth');
const { uploadToCloudinary, deleteFromCloudinary } = require('../cloudinaryConfig');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'backend/uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
});

// Helper function to log activity
const logActivity = async (userId, type, message, ip) => {
  try {
    await User.findByIdAndUpdate(userId, {
      $push: {
        activities: {
          $each: [{ type, message, timestamp: new Date(), ip }],
          $slice: -100 // Keep last 100 activities
        },
        lastActivity: new Date()
      }
    });
  } catch (err) {
    console.error('Error logging activity:', err);
  }
};

// Helper function to update session
const updateSession = async (userId, req) => {
  try {
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const sessionData = {
      device: getDeviceInfo(userAgent),
      location: 'Unknown', // Would need GeoIP service
      ip: req.ip || req.connection.remoteAddress,
      lastActive: new Date(),
      current: true,
      userAgent
    };
    
    // Update last login and set this as current session
    await User.findByIdAndUpdate(userId, {
      lastLogin: new Date(),
      $set: { 'sessions.$[].current': false }, // Unset all current sessions
      $push: {
        sessions: {
          $each: [sessionData],
          $slice: -10 // Keep last 10 sessions
        }
      }
    });
  } catch (err) {
    console.error('Error updating session:', err);
  }
};

// Helper function to get device info
const getDeviceInfo = (userAgent) => {
  if (userAgent.includes('Chrome')) return 'Chrome on ' + (userAgent.includes('Windows') ? 'Windows' : userAgent.includes('Mac') ? 'Mac' : 'Linux');
  if (userAgent.includes('Firefox')) return 'Firefox on ' + (userAgent.includes('Windows') ? 'Windows' : userAgent.includes('Mac') ? 'Mac' : 'Linux');
  if (userAgent.includes('Safari')) return 'Safari on ' + (userAgent.includes('Mac') ? 'Mac' : 'iOS');
  if (userAgent.includes('Edge')) return 'Edge on Windows';
  if (userAgent.includes('Mobile')) return 'Mobile Browser';
  return 'Unknown Device';
};

// Register (customers public, staff require superadmin auth, only one superadmin allowed)
router.post('/register', async (req, res) => {
  const { name, email, password, role = 'customer' } = req.body;
  const allowedRoles = ['customer', 'staff', 'superadmin'];
  if (!allowedRoles.includes(role)) return res.status(400).json({ message: 'Invalid role' });

  if (role === 'superadmin') {
    const existingSuper = await User.findOne({ role: 'superadmin' });
    if (existingSuper) return res.status(400).json({ message: 'Super admin already exists' });
  } else if (role !== 'customer') {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'Auth required for staff accounts' });
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user.role !== 'superadmin') return res.status(403).json({ message: 'Only superadmin can create staff accounts' });
    } catch (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, role });
    await user.save();
    res.status(201).json({ message: 'User registered' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }
    
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    // Update session on login
    await updateSession(user._id, req);
    await logActivity(user._id, 'login', 'Logged in successfully', req.ip);
    
    // Return user without password
    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.twoFactorSecret;
    
    res.json({ token, refreshToken, user: userObj });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Token refresh endpoint
router.post('/refresh-token', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ message: 'Refresh token required' });

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.isActive) return res.status(403).json({ message: 'Account is deactivated' });

    // Generate new tokens
    const newToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const newRefreshToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ token: newToken, refreshToken: newRefreshToken });
  } catch (err) {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
});

// Check if superadmin exists
router.get('/check-superadmin', async (req, res) => {
  try {
    const superadmin = await User.findOne({ role: 'superadmin' });
    res.json({ exists: !!superadmin });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.twoFactorSecret;
    res.json(userObj);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update profile
router.patch('/profile', auth, async (req, res) => {
  try {
    const { name, phone, bio, location } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { 
        name, 
        phone, 
        bio, 
        location,
        lastActivity: new Date()
      },
      { new: true }
    );
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    await logActivity(req.user.id, 'profile', 'Profile information updated', req.ip);
    
    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.twoFactorSecret;
    
    res.json(userObj);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Change password
router.patch('/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await User.findByIdAndUpdate(req.user.id, {
      password: hashedPassword,
      lastActivity: new Date()
    });
    
    await logActivity(req.user.id, 'password', 'Password changed', req.ip);
    
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Upload profile picture (with Cloudinary)
router.post('/profile/picture', auth, upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }
    
    // Get current user to delete old profile picture
    const currentUser = await User.findById(req.user.id);
    const oldPictureUrl = currentUser.profilePicture;
    
    // Upload to Cloudinary
    const imageUrl = await uploadToCloudinary(req.file, 'netyarkmall/profiles');
    
    // Delete old picture from Cloudinary if exists
    if (oldPictureUrl && oldPictureUrl.includes('cloudinary.com')) {
      try {
        await deleteFromCloudinary(oldPictureUrl);
      } catch (err) {
        console.error('Error deleting old profile picture:', err);
      }
    }
    
    // Delete local file
    fs.unlinkSync(req.file.path);
    
    // Update user with new profile picture URL
    await User.findByIdAndUpdate(req.user.id, {
      profilePicture: imageUrl,
      lastActivity: new Date()
    });
    
    await logActivity(req.user.id, 'profile', 'Profile picture updated', req.ip);
    
    res.json({ profilePicture: imageUrl, message: 'Profile picture updated successfully' });
  } catch (err) {
    console.error('Error uploading profile picture:', err);
    res.status(500).json({ message: err.message || 'Error uploading profile picture' });
  }
});

// Update preferences
router.patch('/preferences', auth, async (req, res) => {
  try {
    const { preferences } = req.body;
    
    await User.findByIdAndUpdate(req.user.id, {
      preferences,
      lastActivity: new Date()
    });
    
    await logActivity(req.user.id, 'profile', 'Preferences updated', req.ip);
    
    res.json({ message: 'Preferences saved' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Toggle two-factor authentication
router.post('/2fa/toggle', auth, async (req, res) => {
  try {
    const { enabled, secret } = req.body;
    
    await User.findByIdAndUpdate(req.user.id, {
      twoFactorEnabled: enabled,
      twoFactorSecret: secret || '',
      lastActivity: new Date()
    });
    
    const action = enabled ? 'enabled' : 'disabled';
    await logActivity(req.user.id, 'security', `Two-factor authentication ${action}`, req.ip);
    
    res.json({ message: `Two-factor authentication ${action}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Verify 2FA code
router.post('/2fa/verify', auth, async (req, res) => {
  try {
    const { code } = req.body;
    const user = await User.findById(req.user.id);
    
    // Simple verification - in production, use TOTP algorithm
    if (user.twoFactorSecret && code === user.twoFactorSecret) {
      res.json({ valid: true });
    } else {
      res.status(400).json({ valid: false, message: 'Invalid code' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get active sessions
router.get('/sessions', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('sessions');
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    res.json(user.sessions || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Revoke session
router.delete('/sessions/:sessionId', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { sessions: { _id: sessionId } }
    });
    
    await logActivity(req.user.id, 'security', 'Session revoked', req.ip);
    
    res.json({ message: 'Session revoked' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get activity log
router.get('/activities', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('activities');
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    res.json(user.activities || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Deactivate account
router.post('/deactivate', auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      isActive: false,
      lastActivity: new Date()
    });
    
    await logActivity(req.user.id, 'security', 'Account deactivated', req.ip);
    
    res.json({ message: 'Account deactivated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete account (self)
router.delete('/account', auth, async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.user.id);
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Verify password before deletion
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Password is incorrect' });
    }
    
    await User.findByIdAndDelete(req.user.id);
    
    res.json({ message: 'Account deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all users (superadmin only)
router.get('/users', auth, superAdminAuth, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete user (superadmin only)
router.delete('/users/:id', auth, superAdminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
