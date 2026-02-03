const express = require('express');
const router = express.Router();
const Paystack = require('paystack');
const Order = require('../models/Order');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const nodemailer = require('nodemailer');

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

// Email configuration for order notifications
const emailConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER || 'your-email@gmail.com',
        pass: process.env.SMTP_PASS || 'your-app-password'
    }
};

// Create email transporter
let emailTransporter = null;
try {
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        emailTransporter = nodemailer.createTransport(emailConfig);
        console.log('Email transporter initialized');
    } else {
        console.warn('SMTP credentials not set - email notifications disabled');
    }
} catch (err) {
    console.error('Failed to create email transporter:', err.message);
}

// Admin email address
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'info@netyarkmall.com';

// Send new order notification to admin
async function sendOrderNotificationEmail(order) {
    if (!emailTransporter) {
        console.log('Email notifications disabled - skipping order notification');
        return false;
    }

    try {
        // Get product details
        const productList = await Promise.all(order.products.map(async (item) => {
            const product = await Order.findById(order._id).populate('products.product').then(() => {
                // Simple fallback if populate doesn't work
                return { name: `Product ID: ${item.product}`, price: 0 };
            }).catch(() => ({
                name: `Product ID: ${item.product}`,
                price: 0
            }));
            return `• ${product.name || item.product} - Qty: ${item.quantity} - ₵${(item.price || 0).toLocaleString()}`;
        }));

        const customerName = order.customer 
            ? `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim()
            : 'Guest Customer';

        const emailContent = `
            <h2 style="color: #008000;">🛒 New Order Received!</h2>
            <p><strong>Order ID:</strong> ${order._id}</p>
            <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
            
            <h3>Customer Information</h3>
            <p><strong>Name:</strong> ${customerName}</p>
            <p><strong>Email:</strong> ${order.customer?.email || 'N/A'}</p>
            <p><strong>Phone:</strong> ${order.customer?.phone || 'N/A'}</p>
            
            <h3>Shipping Address</h3>
            <p><strong>Address:</strong> ${order.shipping?.address || 'N/A'}</p>
            <p><strong>City:</strong> ${order.shipping?.city || 'N/A'}</p>
            <p><strong>Region:</strong> ${order.shipping?.region ? order.shipping.region.replace(/-/g, ' ').toUpperCase() : 'N/A'}</p>
            
            <h3>Order Items</h3>
            <ul>
                ${order.products.map(item => `
                    <li>${item.product?.name || 'Product'} - Qty: ${item.quantity} - ₵${((item.product?.price || 0) * item.quantity).toLocaleString()}</li>
                `).join('')}
            </ul>
            
            <h3>Payment Information</h3>
            <p><strong>Total Amount:</strong> ₵${(order.total || 0).toLocaleString()}</p>
            <p><strong>Payment Method:</strong> ${order.paymentMethod ? order.paymentMethod.replace(/-/g, ' ').toUpperCase() : 'N/A'}</p>
            <p><strong>Payment Status:</strong> ${order.paymentStatus.toUpperCase()}</p>
            <p><strong>Payment Reference:</strong> ${order.paymentReference || 'N/A'}</p>
            
            <p style="margin-top: 20px; color: #666;">
                Please process this order as soon as possible.
                <br>View all orders in the <a href="https://netyarkmall-production.up.railway.app/admin.html">Admin Dashboard</a>
            </p>
        `;

        const mailOptions = {
            from: 'Netyark Mall <noreply@netyarkmall.com>',
            to: ADMIN_EMAIL,
            subject: `🛒 New Order #${order._id.toString().substring(0, 8)} - ₵${(order.total || 0).toLocaleString()}`,
            html: emailContent
        };

        await emailTransporter.sendMail(mailOptions);
        console.log('Order notification email sent to admin:', ADMIN_EMAIL);
        return true;
    } catch (error) {
        console.error('Error sending order notification email:', error);
        return false;
    }
}

// Send order confirmation email to customer
async function sendOrderConfirmationEmail(order) {
    if (!emailTransporter || !order.customer?.email) {
        console.log('Email notifications disabled or no customer email - skipping confirmation');
        return false;
    }

    try {
        const customerName = order.customer 
            ? `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim()
            : 'Valued Customer';

        const emailContent = `
            <h2 style="color: #008000;">✅ Order Confirmed!</h2>
            <p>Dear ${customerName},</p>
            <p>Thank you for your order with <strong>Netyark Mall</strong>!</p>
            
            <p><strong>Order ID:</strong> ${order._id}</p>
            <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
            <p><strong>Total:</strong> ₵${(order.total || 0).toLocaleString()}</p>
            
            <h3>Order Details</h3>
            <ul>
                ${order.products.map(item => `
                    <li>${item.product?.name || 'Product'} - Qty: ${item.quantity} - ₵${((item.product?.price || 0) * item.quantity).toLocaleString()}</li>
                `).join('')}
            </ul>
            
            <h3>Shipping Address</h3>
            <p>${order.shipping?.address || ''}</p>
            <p>${order.shipping?.city || ''}, ${order.shipping?.region ? order.shipping.region.replace(/-/g, ' ').toUpperCase() : ''}</p>
            
            <p><strong>Phone:</strong> ${order.customer?.phone || 'N/A'}</p>
            
            <p style="margin-top: 20px;">
                We will process your order and notify you when it ships.
                <br>You can track your order status in your <a href="https://netyarkmall-production.up.railway.app/profile.html">profile</a>.
            </p>
            
            <p style="margin-top: 20px; color: #666;">
                Thank you for shopping with Netyark Mall!
                <br>Santa Maria, Accra, Ghana
            </p>
        `;

        const mailOptions = {
            from: 'Netyark Mall <noreply@netyarkmall.com>',
            to: order.customer.email,
            subject: `✅ Order Confirmed - #${order._id.toString().substring(0, 8)}`,
            html: emailContent
        };

        await emailTransporter.sendMail(mailOptions);
        console.log('Order confirmation email sent to:', order.customer.email);
        return true;
    } catch (error) {
        console.error('Error sending order confirmation email:', error);
        return false;
    }
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
                    status: 'confirmed',
                    paymentStatus: 'paid',
                    paymentReference: reference,
                    paidAt: new Date()
                });

                await order.save();

                console.log('Order created successfully:', order._id);
                
                // Send email notifications
                console.log('Sending order notification emails...');
                
                // Send notification to admin
                const adminEmailSent = await sendOrderNotificationEmail(order);
                console.log('Admin email sent:', adminEmailSent);
                
                // Send confirmation to customer (only if email provided)
                if (order.customer?.email) {
                    const customerEmailSent = await sendOrderConfirmationEmail(order);
                    console.log('Customer confirmation email sent:', customerEmailSent);
                }

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
                console.log('Looking for existing order with paymentReference:', reference);
                const order = await Order.findOne({ paymentReference: reference });

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
                order.orderStatus = 'confirmed';
                order.paymentMethod = response.data.channel || 'card';
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
                const order = await Order.findOne({ paymentReference: reference });

                if (order) {
                    order.paymentStatus = 'paid';
                    order.orderStatus = 'confirmed';
                    order.paymentMethod = event.data.channel || 'card';
                    order.paidAt = new Date();
                    
                    if (event.data.authorization) {
                        order.authorizationCode = event.data.authorization.authorization_code;
                    }

                    await order.save();
                    console.log(`Payment webhook: Order ${order._id} marked as paid`);
                    
                    // Send email notifications for webhook-triggered orders
                    console.log('Webhook: Sending order notification emails...');
                    await sendOrderNotificationEmail(order);
                    if (order.customer?.email) {
                        await sendOrderConfirmationEmail(order);
                    }
                } else {
                    console.log(`Payment webhook: No order found for reference: ${reference}`);
                }
                break;

            case 'charge.failure':
                const failedReference = event.data.reference;
                const failedOrder = await Order.findOne({ paymentReference: failedReference });

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
