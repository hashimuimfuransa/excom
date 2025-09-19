import express from 'express';
import jwt from 'jsonwebtoken';
import BargainChat from '../models/BargainChat';
import Product from '../models/Product';
import User from '../models/User';

const router = express.Router();

// Middleware to authenticate user
const authenticateUser = async (req: any, res: any, next: any) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Start a bargain chat
router.post('/start', authenticateUser, async (req: any, res: any) => {
  try {
    const { productId, initialOffer, message } = req.body;
    const buyerId = req.user._id;

    // Check if product exists and bargaining is enabled
    const product = await Product.findById(productId).populate('seller');
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (!product.bargainingEnabled) {
      return res.status(400).json({ message: 'Bargaining is not enabled for this product' });
    }

    // Check if chat already exists
    const existingChat = await BargainChat.findOne({
      product: productId,
      buyer: buyerId,
      status: 'active'
    });

    if (existingChat) {
      return res.status(400).json({ message: 'Active bargaining chat already exists' });
    }

    // Create new bargain chat
    const bargainChat = new BargainChat({
      product: productId,
      buyer: buyerId,
      seller: product.seller._id,
      initialPrice: product.price,
      currentOffer: initialOffer,
      messages: [{
        sender: buyerId,
        senderType: 'buyer',
        message: message || `I would like to offer $${initialOffer} for this item.`,
        messageType: 'price_offer',
        priceOffer: initialOffer,
        timestamp: new Date()
      }]
    });

    await bargainChat.save();
    await bargainChat.populate([
      { path: 'product', select: 'title images price currency' },
      { path: 'buyer', select: 'name email' },
      { path: 'seller', select: 'name email' }
    ]);

    // Emit to seller via socket.io
    const io = req.app.get('io');
    if (io) {
      io.to(`seller_${product.seller._id}`).emit('new-bargain-request', {
        chatId: bargainChat._id,
        product: product,
        buyer: req.user,
        offer: initialOffer,
        message
      });
    }

    res.status(201).json({
      success: true,
      chat: bargainChat
    });
  } catch (error) {
    console.error('Error starting bargain chat:', error);
    res.status(500).json({ message: 'Failed to start bargain chat' });
  }
});

// Get user's bargain chats
router.get('/my-chats', authenticateUser, async (req: any, res: any) => {
  try {
    const userId = req.user._id;
    const { role } = req.user;

    let query: any;
    if (role === 'seller') {
      query = { seller: userId };
    } else {
      query = { buyer: userId };
    }

    const chats = await BargainChat.find(query)
      .populate('product', 'title images price currency')
      .populate('buyer', 'name email')
      .populate('seller', 'name email')
      .sort({ lastActivity: -1 });

    res.json({
      success: true,
      chats
    });
  } catch (error) {
    console.error('Error fetching bargain chats:', error);
    res.status(500).json({ message: 'Failed to fetch bargain chats' });
  }
});

// Get specific bargain chat
router.get('/chat/:chatId', authenticateUser, async (req: any, res: any) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;

    const chat = await BargainChat.findOne({
      _id: chatId,
      $or: [{ buyer: userId }, { seller: userId }]
    })
      .populate('product', 'title images price currency bargainingEnabled minBargainPrice maxBargainDiscountPercent')
      .populate('buyer', 'name email')
      .populate('seller', 'name email');

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found or access denied' });
    }

    res.json({
      success: true,
      chat
    });
  } catch (error) {
    console.error('Error fetching bargain chat:', error);
    res.status(500).json({ message: 'Failed to fetch bargain chat' });
  }
});

// Send message in bargain chat
router.post('/chat/:chatId/message', authenticateUser, async (req: any, res: any) => {
  try {
    const { chatId } = req.params;
    const { message, messageType, priceOffer } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    const chat = await BargainChat.findOne({
      _id: chatId,
      $or: [{ buyer: userId }, { seller: userId }],
      status: 'active'
    }).populate('product').populate('buyer').populate('seller');

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found or access denied' });
    }

    const senderType = chat.buyer._id.toString() === userId.toString() ? 'buyer' : 'seller';
    
    // Create new message
    const newMessage = {
      sender: userId,
      senderType,
      message,
      messageType: messageType || 'text',
      priceOffer,
      timestamp: new Date(),
      isRead: false
    };

    chat.messages.push(newMessage as any);
    
    // Update current offer if it's a price offer
    if (priceOffer && (messageType === 'price_offer' || messageType === 'counter_offer')) {
      chat.currentOffer = priceOffer;
    }

    // Handle offer acceptance
    if (messageType === 'accept_offer') {
      chat.status = 'accepted';
      chat.finalPrice = chat.currentOffer;
    }

    // Handle offer rejection
    if (messageType === 'reject_offer') {
      chat.status = 'rejected';
    }

    chat.lastActivity = new Date();
    await chat.save();

    // Emit to other user via socket.io
    const io = req.app.get('io');
    if (io) {
      const otherUserId = senderType === 'buyer' ? chat.seller._id : chat.buyer._id;
      io.to(`user_${otherUserId}`).emit('new-bargain-message', {
        chatId: chat._id,
        message: newMessage,
        chat: {
          product: chat.product,
          status: chat.status,
          currentOffer: chat.currentOffer
        }
      });
    }

    res.json({
      success: true,
      message: 'Message sent successfully',
      chat: {
        _id: chat._id,
        status: chat.status,
        currentOffer: chat.currentOffer,
        messages: chat.messages
      }
    });
  } catch (error) {
    console.error('Error sending bargain message:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
});

// Close bargain chat
router.post('/chat/:chatId/close', authenticateUser, async (req: any, res: any) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;

    const chat = await BargainChat.findOneAndUpdate(
      {
        _id: chatId,
        $or: [{ buyer: userId }, { seller: userId }]
      },
      { 
        status: 'closed',
        lastActivity: new Date()
      },
      { new: true }
    );

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found or access denied' });
    }

    // Emit to other user via socket.io
    const io = req.app.get('io');
    if (io) {
      const otherUserId = chat.buyer._id.toString() === userId.toString() ? chat.seller._id : chat.buyer._id;
      io.to(`user_${otherUserId}`).emit('bargain-chat-closed', {
        chatId: chat._id
      });
    }

    res.json({
      success: true,
      message: 'Chat closed successfully'
    });
  } catch (error) {
    console.error('Error closing bargain chat:', error);
    res.status(500).json({ message: 'Failed to close chat' });
  }
});

export default router;