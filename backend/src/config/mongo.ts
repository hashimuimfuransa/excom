import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/excom';
  mongoose.set('strictQuery', true as any);
  await mongoose.connect(uri);
  console.log('MongoDB connected');
}