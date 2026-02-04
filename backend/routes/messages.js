const express = require('express');
const nodemailer = require('nodemailer');
const Message = require('../models/Message');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'netyarkmall@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

// Helper function to send email notification
async function sendEmailNotification(messageData) {
  const emailContent = `
    <h2>New Contact Message - Netyark Mall</h2>
    <p><strong>Name:</strong> ${messageData.senderName}</p>
    <p><strong>Email:</strong> ${messageData.senderEmail}</p>
    <p><strong>Phone:</strong> ${messageData.phone || 'Not provided'}</p>
    <p><strong>Subject:</strong> ${messageData.subject || 'Not specified'}</p>
    <p><strong>Order Number:</strong> ${messageData.orderNumber || 'Not provided'}</p>
    <hr>
    <h3>Message:</h3>
    <p>${messageData.message}</p>
    <hr>
    <p><small>Sent from Netyark Mall Contact Form</small></p>
  `;

  const mailOptions = {
    from: process.env.EMAIL_USER || 'netyarkmall@gmail.com',
    to: 'info@netyarkmall.com',
    subject: `New Contact Message: ${messageData.subject || 'No Subject'} - ${messageData.senderName}`,
    html: emailContent
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
}

// Get all messages (admin)
router.get('/', auth, adminAuth, async (req, res) => {
  try {
    const messages = await Message.find().sort({ timestamp: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get messages by conversation ID
router.get('/conversation/:conversationId', auth, adminAuth, async (req, res) => {
  try {
    const messages = await Message.find({ conversationId: req.params.conversationId }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Send message (user or public)
router.post('/', async (req, res) => {
  const { 
    sender, 
    senderId, 
    senderName, 
    senderEmail, 
    subject,
    phone, 
    orderNumber,
    message, 
    conversationId 
  } = req.body;

  // Generate conversation ID if not provided (new conversation)
  const finalConversationId = conversationId || `conv_${Date.now()}`;

  const newMessage = new Message({
    conversationId: finalConversationId,
    sender: sender || 'guest',
    senderId,
    senderName,
    senderEmail,
    subject,
    phone,
    orderNumber,
    message,
    messageType: sender === 'admin' ? 'admin' : 'user'
  });

  try {
    await newMessage.save();
    
    // Send email notification to info@netyarkmall.com
    const emailSent = await sendEmailNotification({
      senderName,
      senderEmail,
      subject,
      phone,
      orderNumber,
      message
    });
    
    // Update message with email status
    if (emailSent) {
      newMessage.emailSent = true;
      newMessage.emailSentTimestamp = new Date();
      await newMessage.save();
    }
    
    res.status(201).json({
      success: true,
      message: newMessage,
      emailSent: emailSent
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Respond to message (admin)
router.patch('/:id/respond', auth, adminAuth, async (req, res) => {
  try {
    const { response } = req.body;
    const message = await Message.findByIdAndUpdate(
      req.params.id,
      {
        response,
        isRead: true,
        responseTimestamp: Date.now()
      },
      { new: true }
    );

    if (!message) return res.status(404).json({ message: 'Message not found' });
    res.json(message);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Close conversation (admin)
router.patch('/:id/close', auth, adminAuth, async (req, res) => {
  try {
    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { status: 'closed' },
      { new: true }
    );

    if (!message) return res.status(404).json({ message: 'Message not found' });
    res.json(message);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Check for new responses (for frontend polling)
router.get('/conversation/:conversationId/check-responses', async (req, res) => {
  try {
    const messages = await Message.find({ conversationId: req.params.conversationId })
      .sort({ timestamp: -1 });

    if (!messages || messages.length === 0) {
      return res.json({ hasNewResponses: false });
    }

    // Check if the latest message has a response that hasn't been seen by the user
    const latestMessage = messages[0];
    const hasNewResponses = latestMessage.response && !latestMessage.responseShown;

    res.json({
      hasNewResponses: hasNewResponses,
      response: hasNewResponses ? latestMessage.response : null
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark response as shown
router.patch('/mark-shown/:conversationId', async (req, res) => {
  try {
    // Find the latest message in this conversation and mark response as shown
    const latestMessage = await Message.findOne({ conversationId: req.params.conversationId })
      .sort({ timestamp: -1 });

    if (!latestMessage) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (latestMessage.response) {
      latestMessage.responseShown = true;
      await latestMessage.save();
    }

    res.json({ success: true, message: 'Response marked as shown' });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Open conversation (reopen a closed conversation)
router.patch('/conversation/:conversationId/open', auth, adminAuth, async (req, res) => {
  try {
    await Message.updateMany(
      { conversationId: req.params.conversationId },
      { status: 'open' }
    );
    res.json({ success: true, message: 'Conversation reopened' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete conversation by conversationId
router.delete('/conversation/:conversationId', auth, adminAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    // Validate conversationId
    if (!conversationId || conversationId === 'undefined' || conversationId === 'null' || conversationId.trim() === '') {
      return res.status(400).json({ message: 'Invalid Conversation ID' });
    }
    
    // Validate conversationId format (should be a valid string identifier)
    if (conversationId.length < 3) {
      return res.status(400).json({ message: 'Invalid Conversation ID: Too short' });
    }
    
    // Check if conversation exists by conversationId
    let conversationExists = await Message.exists({ conversationId });
    
    // If not found, check if it might be a legacy message (conversationId stored as undefined/null)
    // and the conversationId matches a message's _id
    if (!conversationExists) {
      try {
        const mongoose = require('mongoose');
        if (mongoose.Types.ObjectId.isValid(conversationId)) {
          // Try to find by _id (for legacy messages)
          conversationExists = await Message.exists({ 
            $or: [
              { _id: conversationId },
              { _id: new mongoose.Types.ObjectId(conversationId) }
            ]
          });
          
          if (conversationExists) {
            // Delete by _id for legacy messages
            await Message.deleteMany({ 
              $or: [
                { _id: conversationId },
                { _id: new mongoose.Types.ObjectId(conversationId) }
              ]
            });
            return res.json({ success: true, message: 'Conversation deleted (legacy)' });
          }
        }
      } catch (idError) {
        console.error('Error checking legacy message:', idError);
      }
    } else {
      // Delete all messages in the conversation
      await Message.deleteMany({ conversationId });
      return res.json({ success: true, message: 'Conversation deleted' });
    }
    
    // If we get here, the conversation was not found
    return res.status(404).json({ message: 'Conversation not found' });
  } catch (err) {
    console.error('Error deleting conversation:', err);
    res.status(400).json({ message: err.message });
  }
});

// Fix legacy messages without conversationId (admin)
router.post('/fix-legacy', auth, adminAuth, async (req, res) => {
  try {
    // Find all messages without a valid conversationId
    const legacyMessages = await Message.find({
      $or: [
        { conversationId: { $exists: false } },
        { conversationId: null },
        { conversationId: 'undefined' },
        { conversationId: 'null' },
        { conversationId: '' }
      ]
    });
    
    let fixedCount = 0;
    for (const msg of legacyMessages) {
      msg.conversationId = msg._id.toString();
      await msg.save();
      fixedCount++;
    }
    
    res.json({ 
      success: true, 
      message: `Fixed ${fixedCount} legacy messages without conversationId`,
      fixedCount 
    });
  } catch (err) {
    console.error('Error fixing legacy messages:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
