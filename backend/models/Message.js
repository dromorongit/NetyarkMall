const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: { type: String, required: true }, // Unique ID for conversation thread
  sender: { type: String, required: true }, // 'user', 'guest', or 'admin'
  senderId: { type: String }, // User ID if logged in, or guest identifier
  senderName: { type: String }, // Name of sender
  senderEmail: { type: String }, // Email for contact
  message: { type: String, required: true },
  messageType: { type: String, enum: ['user', 'admin'], default: 'user' },
  timestamp: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false },
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
  response: { type: String }, // Admin response
  responseTimestamp: { type: Date } // When response was sent
});

module.exports = mongoose.model('Message', messageSchema);