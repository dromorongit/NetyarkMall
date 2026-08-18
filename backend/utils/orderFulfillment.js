const Order = require('../models/Order');
const Product = require('../models/Product');

/**
 * Build a normalized Order document from frontend orderData.
 * Returns null if required data is missing/invalid (caller logs and bails).
 */
function buildOrderFromOrderData(orderData, reference) {
    if (!orderData || !Array.isArray(orderData.products) || typeof orderData.total === 'undefined') {
        return null;
    }

    const products = orderData.products.map(item => ({
        product: item.product,
        quantity: item.quantity,
        price: item.price,
        originalPrice: item.originalPrice || item.price,
        color: item.color || null,
        size: item.size || null
    }));

    return new Order({
        user: orderData.user || null,
        products,
        total: orderData.total,
        subtotal: orderData.subtotal || orderData.total,
        paystackFee: orderData.paystackFee || 0,
        customer: orderData.customer,
        shipping: orderData.shipping,
        paymentMethod: orderData.paymentMethod || 'card',
        status: 'processing',
        paymentStatus: 'paid',
        paystackReference: reference,
        paidAt: new Date()
    });
}

/**
 * Atomically decrement stock for each product in an order and flip
 * stockStatus to 'out-of-stock' when the resulting stock drops to <= 0.
 * Runs once, only after a brand-new order is persisted.
 */
async function decrementStockForOrder(order) {
    for (const item of order.products) {
        if (!item.product) continue;

        const updated = await Product.findByIdAndUpdate(
            item.product,
            { $inc: { stock: -item.quantity } },
            { new: true }
        );

        if (updated && updated.stock <= 0) {
            await Product.findByIdAndUpdate(
                item.product,
                { stockStatus: 'out-of-stock' }
            );
        }
    }
}

/**
 * Idempotent order fulfillment from a verified Paystack payment.
 * - If an order already exists for this reference, returns it (no recreate, no re-decrement).
 * - Otherwise creates the order and decrements stock exactly once.
 * Returns { order, created: boolean }.
 */
async function fulfillOrder(orderData, reference, paymentMethodOverride = null) {
    const existing = await Order.findOne({ paystackReference: reference });
    if (existing) {
        console.log(`fulfillOrder: order already exists for reference ${reference}, skipping creation`);
        return { order: existing, created: false };
    }

    const order = buildOrderFromOrderData(orderData, reference);
    if (!order) {
        console.error('CRITICAL: order creation skipped — invalid/missing orderData', { reference, orderData });
        return { order: null, created: false, invalid: true };
    }

    // Use Paystack's confirmed channel when provided (webhook path),
    // overriding the pre-payment guess that may have come from orderData.
    if (paymentMethodOverride) {
        order.paymentMethod = paymentMethodOverride;
    }

    try {
        await order.save();
    } catch (err) {
        console.error('CRITICAL: order creation failed post-payment — manual follow-up required', {
            reference,
            error: err.message,
            orderData
        });
        throw err;
    }

    // Stock decrement is isolated: if it fails AFTER a successful order.save(),
    // the order is still valid and must be reported as created. Log a distinct
    // CRITICAL for manual stock correction but do NOT re-throw.
    let stockDecrementFailed = false;
    try {
        await decrementStockForOrder(order);
    } catch (err) {
        stockDecrementFailed = true;
        console.error('CRITICAL: order created but stock decrement failed — manual stock correction required', {
            orderId: order._id,
            reference,
            error: err.message
        });
    }

    console.log(`fulfillOrder: order ${order._id} created for reference ${reference}${stockDecrementFailed ? ' (stock decrement FAILED)' : ' and stock decremented'}`);
    return { order, created: true, stockDecrementFailed };
}

module.exports = { buildOrderFromOrderData, decrementStockForOrder, fulfillOrder };
