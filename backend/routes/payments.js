const express = require('express');
const router = express.Router();
const Paystack = require('paystack');
const Order = require('../models/Order');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Initialize Paystack with secret key from environment variables
const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
console.log('Paystack secret key present:', !!paystackSecretKey);

// Only initialize Paystack if secret key is available
let paystack = null;
if (paystackSecretKey) {
    try {
        paystack = Paystack(paystackSecretKey);
    } catch (err) {
        console.error('Failed to initialize Paystack:', err.message);
    }
} else {
    console.warn('PAYSTACK_SECRET_KEY is not defined - payment routes will be disabled');
}

// Optional auth middleware - works for both authenticated and guest users
const optionalAuth = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        // Guest user - continue without user
        req.user = null;
        return next();
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id);
        next();
    } catch (err) {
        // Invalid token - continue as guest
        req.user = null;
        next();
    }
};

/**
 * @route   POST /api/payments/initialize
 * @desc    Initialize a payment transaction
 * @access  Private
 */
router.post('/initialize', optionalAuth, async (req, res) => {
    try {
        const { orderId, email, amount, metadata } = req.body;

        // Validate required fields
        if (!orderId || !email || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Please provide orderId, email, and amount'
            });
        }

        // Verify order exists
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check if user is authorized (allow guest if order is guest order)
        if (req.user && order.user && order.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to pay for this order'
            });
        }

        // Check if order is already paid
        if (order.paymentStatus === 'paid') {
            return res.status(400).json({
                success: false,
                message: 'Order is already paid'
            });
        }

        // Initialize Paystack transaction
        const response = await paystack.transaction.initialize({
            email: email,
            amount: Math.round(amount * 100), // Convert to pesewas (smallest Ghanaian currency unit)
            currency: 'GHS',
            reference: `Netyark_${orderId}_${Date.now()}`,
            metadata: {
                orderId: orderId.toString(),
                userId: req.user ? req.user._id.toString() : 'guest',
                ...metadata
            },
            callback_url: `${process.env.FRONTEND_URL}/payment-callback`
        });

        if (response.status) {
            // Update order with payment reference
            order.paymentReference = response.data.reference;
            order.paymentStatus = 'pending';
            await order.save();

            res.json({
                success: true,
                data: {
                    authorizationUrl: response.data.authorization_url,
                    reference: response.data.reference,
                    accessCode: response.data.access_code
                }
            });
        } else {
            throw new Error(response.message || 'Failed to initialize payment');
        }
    } catch (error) {
        console.error('Payment initialization error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to initialize payment',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/payments/verify
 * @desc    Verify a payment transaction and create order only after successful payment
 * @access  Private
 */
router.post('/verify', optionalAuth, async (req, res) => {
    try {
        const { reference, orderData } = req.body;

        console.log('Payment verification request:', { reference, hasOrderData: !!orderData });

        if (!reference) {
            return res.status(400).json({
                success: false,
                message: 'Payment reference is required'
            });
        }

        // Verify with Paystack
        console.log('Verifying payment with Paystack, reference:', reference);
        const response = await paystack.transaction.verify(reference);

        console.log('Paystack verification response:', response.status, response.data?.status);

        if (response.status && response.data.status === 'success') {
            // Payment was successful on Paystack side
            console.log('Paystack payment successful, amount:', response.data.amount / 100);
            
            // Check if this is a new order creation after payment
            if (orderData && orderData.products && orderData.total) {
                // Create the order only after payment is verified
                let userId = null;
                
                // Check if user is authenticated
                if (req.user) {
                    userId = req.user._id;
                }

                console.log('Creating new order with data:', {
                    products: orderData.products.length,
                    total: orderData.total,
                    customer: orderData.customer
                });

                const order = new Order({
                    user: userId,
                    products: orderData.products,
                    total: orderData.total,
                    customer: orderData.customer,
                    shipping: orderData.shipping,
                    paymentMethod: orderData.paymentMethod || 'card',
                    status: 'processing',
                    paymentStatus: 'paid',
                    paystackReference: reference,
                    paidAt: new Date()
                });

                await order.save();

                console.log('Order created successfully:', order._id);

                res.json({
                    success: true,
                    message: 'Payment verified and order created successfully',
                    data: {
                        orderId: order._id,
                        paymentStatus: order.paymentStatus,
                        amount: response.data.amount / 100
                    }
                });
            } else {
                // Original flow: Find existing order by payment reference and update it
                console.log('Looking for existing order with paystackReference:', reference);
                const order = await Order.findOne({ paystackReference: reference });

                if (!order) {
                    console.log('Order not found for reference:', reference);
                    
                    // Even though order not found, payment was successful on Paystack
                    // Return success but with a warning
                    return res.status(200).json({
                        success: true,
                        message: 'Payment verified successfully on Paystack, but order record not found. Please contact support with your payment reference.',
                        data: {
                            paymentVerified: true,
                            reference: reference,
                            amount: response.data.amount / 100,
                            orderId: null
                        }
                    });
                }

                // Update order payment status
                order.paymentStatus = 'paid';
                order.status = 'processing';
                order.paymentMethod = response.data.channel || 'card';
                order.paystackReference = reference;
                order.paidAt = new Date();
                
                // Store authorization code for future payments if needed
                if (response.data.authorization) {
                    order.authorizationCode = response.data.authorization.authorization_code;
                }

                await order.save();

                console.log('Order updated successfully:', order._id);

                res.json({
                    success: true,
                    message: 'Payment verified successfully',
                    data: {
                        orderId: order._id,
                        paymentStatus: order.paymentStatus,
                        amount: response.data.amount / 100
                    }
                });
            }
        } else {
            console.log('Payment verification failed on Paystack:', response.data?.status);
            res.status(400).json({
                success: false,
                message: 'Payment verification failed',
                data: response.data
            });
        }
    } catch (error) {
        console.error('Payment verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify payment',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/payments/webhook
 * @desc    Handle Paystack webhook events
 * @access  Public (verified by Paystack signature)
 */
router.post('/webhook', async (req, res) => {
    const hash = require('crypto').createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
        .update(JSON.stringify(req.body))
        .digest('hex');

    // Verify webhook signature
    if (hash !== req.headers['x-paystack-signature']) {
        return res.status(401).json({
            success: false,
            message: 'Invalid webhook signature'
        });
    }

    try {
        const event = req.body;

        switch (event.event) {
            case 'charge.success':
                const reference = event.data.reference;
                const order = await Order.findOne({ paystackReference: reference });

                if (order) {
                    order.paymentStatus = 'paid';
                    order.status = 'processing';
                    order.paymentMethod = event.data.channel || 'card';
                    order.paidAt = new Date();
                    
                    if (event.data.authorization) {
                        order.authorizationCode = event.data.authorization.authorization_code;
                    }

                    await order.save();
                    console.log(`Payment webhook: Order ${order._id} marked as paid`);
                } else {
                    console.log(`Payment webhook: No order found for reference: ${reference}`);
                }
                break;

            case 'charge.failure':
                const failedReference = event.data.reference;
                const failedOrder = await Order.findOne({ paystackReference: failedReference });

                if (failedOrder) {
                    failedOrder.paymentStatus = 'failed';
                    await failedOrder.save();
                    console.log(`Payment webhook: Order ${failedOrder._id} payment failed`);
                }
                break;

            case 'invoice.created':
            case 'invoice.payment_failed':
                // Handle other payment-related events
                console.log(`Payment webhook: Event - ${event.event}`);
                break;

            default:
                console.log(`Payment webhook: Unhandled event - ${event.event}`);
        }

        res.status(200).json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({
            success: false,
            message: 'Webhook processing failed'
        });
    }
});

/**
 * @route   GET /api/payments/:orderId
 * @desc    Get payment status for an order
 * @access  Private
 */
router.get('/:orderId', optionalAuth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check if user is authorized (allow guest if order is guest order)
        if (req.user && order.user && order.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this order'
            });
        }

        res.json({
            success: true,
            data: {
                orderId: order._id,
                paymentStatus: order.paymentStatus,
                paymentReference: order.paymentReference,
                amount: order.totalAmount,
                paidAt: order.paidAt
            }
        });
    } catch (error) {
        console.error('Get payment status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get payment status',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/payments/test
 * @desc    Test endpoint to verify API is working
 * @access  Public
 */
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Payment API is working',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
