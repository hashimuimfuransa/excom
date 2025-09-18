import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash?: string;
  oauthProvider?: 'google' | 'facebook' | 'apple';
  oauthId?: string;
  role: 'buyer' | 'seller' | 'admin';
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: String,
  oauthProvider: String,
  oauthId: String,
  role: { type: String, enum: ['buyer', 'seller', 'admin'], default: 'buyer' }
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);