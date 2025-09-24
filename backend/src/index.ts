// Configure dotenv FIRST before any other imports
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../.env') });

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { connectDB } from './config/mongo';
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import orderRoutes from './routes/orders';
import sellerRoutes from './routes/sellers';
import aiRoutes from './routes/ai';
import searchRoutes from './routes/search';
import paymentsRoutes from './routes/payments';
import adminRoutes from './routes/admin';
import uploadRoutes from './routes/upload';
import payoutRoutes from './routes/payouts';
import collectionsRoutes from './routes/collections';
import bookingsRoutes from './routes/bookings';
import categoriesRoutes from './routes/categories';
import usersRoutes from './routes/users';
import bargainRoutes from './routes/bargain';
import affiliateRoutes from './routes/affiliate';
import vendorAffiliateRoutes from './routes/vendor-affiliate';
import adminAffiliateRoutes from './routes/admin-affiliate';
import affiliateAiRoutes from './routes/affiliate-ai';
import affiliateGamificationRoutes from './routes/affiliate-gamification';
import arRoutes from './routes/ar';
import voiceAIRoutes from './routes/voice-ai';

console.log('Environment variables loaded:', {
  PORT: process.env.PORT,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ? 'Present' : 'Missing',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? 'Present' : 'Missing',
});

const app = express();
const server = createServer(app);
const allowedOrigins = [
  'http://localhost:3000', 
  'http://127.0.0.1:3000',
  'https://excom-tyry.onrender.com',
  'https://excom-ten.vercel.app',
  process.env.FRONTEND_URL || 'https://excom-tyry.onrender.com'
];

// Add any additional origins from environment variable
if (process.env.ADDITIONAL_ORIGINS) {
  const additionalOrigins = process.env.ADDITIONAL_ORIGINS.split(',').map(origin => origin.trim());
  allowedOrigins.push(...additionalOrigins);
}

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
});

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
// Increase JSON payload limit to allow base64-encoded images during product creation
app.use(express.json({ limit: '10mb' }));

app.get('/', (_, res) => res.send('Excom API running'));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/sellers', sellerRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/payouts', payoutRoutes);
app.use('/api/collections', collectionsRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/bargain', bargainRoutes);
app.use('/api/affiliate', affiliateRoutes);
app.use('/api/vendor-affiliate', vendorAffiliateRoutes);
app.use('/api/admin/affiliate', adminAffiliateRoutes);
app.use('/api/affiliate-ai', affiliateAiRoutes);
app.use('/api/affiliate-gamification', affiliateGamificationRoutes);
app.use('/api/ar', arRoutes);
app.use('/api/ai', voiceAIRoutes);

const PORT = process.env.PORT || 4000;

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-bargain-room', (chatId: string) => {
    socket.join(chatId);
    console.log(`User ${socket.id} joined bargain room: ${chatId}`);
  });

  socket.on('leave-bargain-room', (chatId: string) => {
    socket.leave(chatId);
    console.log(`User ${socket.id} left bargain room: ${chatId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io available to routes
app.set('io', io);

connectDB().then(() => {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`API with Socket.io listening on http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});