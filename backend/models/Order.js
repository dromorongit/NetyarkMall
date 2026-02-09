const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional for guest checkout
  products: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }, // Price at time of purchase (sales price if applicable)
    originalPrice: { type: Number } // Original price before discount (for reference)
  }],
  total: { type: Number, required: true },
  subtotal: { type: Number }, // Original subtotal before discounts
  paystackFee: { type: Number }, // Paystack processing fee
  status: { type: String, enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
  customer: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true }
  },
  shipping: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    region: { type: String, required: true },
    zone: { type: String, default: 'accra' },
    method: { type: String, default: 'standard' }
  },
  paymentMethod: { type: String, required: true },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'paid', 'failed', 'cancelled'], 
    default: 'pending' 
  },
  paystackReference: { type: String },
  paystackTransactionId: { type: String },
  paidAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);