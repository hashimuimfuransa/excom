import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash?: string;
  oauthProvider?: 'google' | 'facebook' | 'apple';
  oauthId?: string;
  role: 'buyer' | 'seller' | 'admin' | 'affiliate';
  phone?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  country?: string;
  city?: string;
  address?: string;
  zipCode?: string;
  avatar?: string;
  affiliateOnboardingCompleted?: boolean;
  preferences?: {
    language: string;
    currency: string;
    timeZone: string;
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    marketingEmails: boolean;
  };
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  firstName: { type: String },
  lastName: { type: String },
  email: { type: String, required: true, unique: true },
  passwordHash: String,
  oauthProvider: String,
  oauthId: String,
  role: { type: String, enum: ['buyer', 'seller', 'admin', 'affiliate'], default: 'buyer' },
  phone: String,
  dateOfBirth: Date,
  gender: { type: String, enum: ['male', 'female', 'other'] },
  country: String,
  city: String,
  address: String,
  zipCode: String,
  avatar: String,
  affiliateOnboardingCompleted: { type: Boolean, default: false },
  preferences: {
    language: { type: String, default: 'en' },
    currency: { type: String, default: 'USD' },
    timeZone: { type: String, default: 'UTC' },
    emailNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: false },
    pushNotifications: { type: Boolean, default: true },
    marketingEmails: { type: Boolean, default: false }
  }
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);