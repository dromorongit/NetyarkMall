const express = require('express');
const jwt = require('jsonwebtoken');
const Order = require('../models/Order');
const User = require('../models/User');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Optional auth middleware - works for both authenticated and guest users
const optionalAuth = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        // Guest user - continue without user
        req.user = null;
        return next();
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.user = await User.findById(decoded.id);
        next();
    } catch (err) {
        // Invalid token - continue as guest
        req.user = null;
        next();
    }
};

// Get all orders (admin only) — paginated; supports optional `since` timestamp for lightweight delta polling.
// Default (no limit param) returns the full list to preserve the admin order-management view; callers may opt in via ?limit=&page=.
router.get('/', auth, adminAuth, async (req, res) => {
  try {
    console.log('Fetching orders for admin:', req.user._id, req.user.role);

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limitParam = parseInt(req.query.limit, 10);
    const limit = (!limitParam || isNaN(limitParam)) ? 0 : Math.min(Math.max(limitParam, 1), 100);
    const since = req.query.since ? new Date(req.query.since) : null;

    const filter = {};
    if (since && !isNaN(since.getTime())) {
      filter.createdAt = { $gt: since };
    }

    const totalCount = await Order.countDocuments(filter);
    let query = Order.find(filter).sort({ createdAt: -1 });
    if (limit > 0) {
      query = query.skip((page - 1) * limit).limit(limit);
    }
    const orders = await query
      .populate('user')
      .populate('products.product');

    console.log('Orders found:', orders.length, 'of', totalCount);
    res.json({
      orders,
      totalCount,
      totalPages: limit ? Math.ceil(totalCount / limit) : 1,
      currentPage: page,
      limit
    });
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get single order by ID (admin only)
router.get('/:id', auth, adminAuth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user').populate('products.product');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get user's orders (supports both logged-in users and guest orders)
router.get('/my', optionalAuth, async (req, res) => {
  try {
    // If user is logged in, return their orders
    if (req.user) {
      const orders = await Order.find({ user: req.user._id }).populate('products.product');
      return res.json(orders);
    }
    
    // For guests, check if there's a guest order ID in header or return empty
    // This can be extended to support guest order lookup
    res.json([]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create order (user or guest) - order is created in pending status
router.post('/', async (req, res) => {
  try {
    const { products, total, customer, shipping, paymentMethod } = req.body;

    // Check if user is authenticated (optional)
    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        userId = decoded.id; // Use 'id' to match auth.js token format
      } catch (error) {
        // Token is invalid, but we'll still allow the order as a guest
        console.log('Invalid token, proceeding as guest checkout');
      }
    }

    const order = new Order({
      user: userId, // Will be null for guest orders
      products,
      total,
      customer,
      shipping,
      paymentMethod,
      status: 'pending',
      paymentStatus: 'pending'
    });

    await order.save();
    res.status(201).json({
      success: true,
      order: {
        id: order._id,
        total: order.total,
        status: order.status,
        paymentStatus: order.paymentStatus,
        customer: order.customer,
        requiresPayment: true
      }
    });
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(400).json({ message: err.message });
  }
});

// Update order status (admin)
router.patch('/:id/status', auth, adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete order permanently (admin)
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ message: 'Order deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;