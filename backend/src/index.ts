// Configure dotenv FIRST before any other imports
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../.env') });

import express from 'express';
import cors from 'cors';
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

console.log('Environment variables loaded:', {
  PORT: process.env.PORT,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ? 'Present' : 'Missing',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? 'Present' : 'Missing',
});

const app = express();
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
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

const PORT = process.env.PORT || 4000;

connectDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`API listening on http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});