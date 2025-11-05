import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash?: string;
  passwordResetToken?: string;
  passwordResetExpiresAt?: Date;
  oauthProvider?: 'google' | 'facebook' | 'apple';
  oauthId?: string;
  role: 'buyer' | 'seller' | 'admin' | 'affiliate';
  phone?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  country?: string;
  city?: string;
  state?: string;
  address?: string;
  zipCode?: string;
  avatar?: string;
  bio?: string;
  website?: string;
  taxId?: string;
  businessName?: string;
  businessType?: string;
  affiliateOnboardingCompleted?: boolean;
  preferences?: {
    language: string;
    currency: string;
    timezone: string;
    theme: 'light' | 'dark' | 'auto';
    emailMarketing: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
  };
  privacy?: {
    profileVisibility: 'public' | 'private' | 'friends';
    showEmail: boolean;
    showPhone: boolean;
    allowDirectMessages: boolean;
    dataSharing: boolean;
    analyticsTracking: boolean;
  };
  notifications?: {
    emailNotifications: boolean;
    orderUpdates: boolean;
    priceAlerts: boolean;
    newProducts: boolean;
    promotions: boolean;
    securityAlerts: boolean;
    socialUpdates: boolean;
    lowStockAlerts?: boolean;
    newReviewNotifications?: boolean;
    bargainNotifications?: boolean;
    payoutNotifications?: boolean;
    commissionNotifications?: boolean;
    performanceNotifications?: boolean;
    marketingTips?: boolean;
    weeklyReports?: boolean;
  };
  security?: {
    twoFactorAuth: boolean;
    loginAlerts: boolean;
    deviceManagement: boolean;
    sessionTimeout: number;
  };
  addresses?: Array<{
    id: string;
    type: 'home' | 'work' | 'other';
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    isDefault: boolean;
  }>;
  vendorSettings?: {
    autoApproveProducts: boolean;
    allowBargaining: boolean;
    minimumBargainDiscount: number;
    maximumBargainDiscount: number;
    payoutMethod: string;
    bankAccount: string;
    paypalEmail: string;
    stripeAccount: string;
    taxRate: number;
    currency: string;
    freeShippingThreshold: number;
    shippingCost: number;
    processingTime: number;
    returnPolicy: string;
    shippingRegions: string[];
    trackSales: boolean;
    trackInventory: boolean;
    trackCustomerBehavior: boolean;
    shareDataWithPlatform: boolean;
  };
  affiliateSettings?: {
    displayName: string;
    bio: string;
    website: string;
    socialMedia: {
      facebook: string;
      instagram: string;
      twitter: string;
      youtube: string;
      tiktok: string;
    };
    niche: string;
    targetAudience: string;
    commissionRate: number;
    preferredCategories: string[];
    autoApproveProducts: boolean;
    showPersonalBranding: boolean;
    allowDirectMessages: boolean;
    payoutMethod: string;
    bankAccount: string;
    paypalEmail: string;
    stripeAccount: string;
    taxId: string;
    minimumPayout: number;
    trackingEnabled: boolean;
    customTrackingCode: string;
    utmParameters: {
      source: string;
      medium: string;
      campaign: string;
    };
    socialSharing: boolean;
    emailMarketing: boolean;
    trackClicks: boolean;
    trackConversions: boolean;
    trackRevenue: boolean;
    shareDataWithVendors: boolean;
    detailedReporting: boolean;
  };
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  firstName: { type: String },
  lastName: { type: String },
  email: { type: String, required: true, unique: true },
  passwordHash: String,
  passwordResetToken: { type: String, select: false },
  passwordResetExpiresAt: { type: Date, select: false },
  oauthProvider: String,
  oauthId: String,
  role: { type: String, enum: ['buyer', 'seller', 'admin', 'affiliate'], default: 'buyer' },
  phone: String,
  dateOfBirth: Date,
  gender: { type: String, enum: ['male', 'female', 'other', 'prefer-not-to-say'] },
  country: String,
  city: String,
  state: String,
  address: String,
  zipCode: String,
  avatar: String,
  bio: String,
  website: String,
  taxId: String,
  businessName: String,
  businessType: String,
  affiliateOnboardingCompleted: { type: Boolean, default: false },
  preferences: {
    language: { type: String, default: 'en' },
    currency: { type: String, default: 'RWF' },
    timezone: { type: String, default: 'UTC' },
    theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'auto' },
    emailMarketing: { type: Boolean, default: false },
    smsNotifications: { type: Boolean, default: false },
    pushNotifications: { type: Boolean, default: true }
  },
  privacy: {
    profileVisibility: { type: String, enum: ['public', 'private', 'friends'], default: 'public' },
    showEmail: { type: Boolean, default: false },
    showPhone: { type: Boolean, default: false },
    allowDirectMessages: { type: Boolean, default: true },
    dataSharing: { type: Boolean, default: true },
    analyticsTracking: { type: Boolean, default: true }
  },
  notifications: {
    emailNotifications: { type: Boolean, default: true },
    orderUpdates: { type: Boolean, default: true },
    priceAlerts: { type: Boolean, default: true },
    newProducts: { type: Boolean, default: false },
    promotions: { type: Boolean, default: true },
    securityAlerts: { type: Boolean, default: true },
    socialUpdates: { type: Boolean, default: false },
    lowStockAlerts: { type: Boolean, default: true },
    newReviewNotifications: { type: Boolean, default: true },
    bargainNotifications: { type: Boolean, default: true },
    payoutNotifications: { type: Boolean, default: true },
    commissionNotifications: { type: Boolean, default: true },
    performanceNotifications: { type: Boolean, default: true },
    marketingTips: { type: Boolean, default: true },
    weeklyReports: { type: Boolean, default: true }
  },
  security: {
    twoFactorAuth: { type: Boolean, default: false },
    loginAlerts: { type: Boolean, default: true },
    deviceManagement: { type: Boolean, default: true },
    sessionTimeout: { type: Number, default: 30 }
  },
  addresses: [{
    id: String,
    type: { type: String, enum: ['home', 'work', 'other'] },
    name: String,
    address: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    isDefault: { type: Boolean, default: false }
  }],
  vendorSettings: {
    autoApproveProducts: { type: Boolean, default: false },
    allowBargaining: { type: Boolean, default: true },
    minimumBargainDiscount: { type: Number, default: 5 },
    maximumBargainDiscount: { type: Number, default: 30 },
    payoutMethod: { type: String, default: 'bank' },
    bankAccount: String,
    paypalEmail: String,
    stripeAccount: String,
    taxRate: { type: Number, default: 0 },
    currency: { type: String, default: 'RWF' },
    freeShippingThreshold: { type: Number, default: 50 },
    shippingCost: { type: Number, default: 5.99 },
    processingTime: { type: Number, default: 2 },
    returnPolicy: String,
    shippingRegions: { type: [String], default: ['US'] },
    trackSales: { type: Boolean, default: true },
    trackInventory: { type: Boolean, default: true },
    trackCustomerBehavior: { type: Boolean, default: false },
    shareDataWithPlatform: { type: Boolean, default: true }
  },
  affiliateSettings: {
    displayName: String,
    bio: String,
    website: String,
    socialMedia: {
      facebook: String,
      instagram: String,
      twitter: String,
      youtube: String,
      tiktok: String
    },
    niche: String,
    targetAudience: String,
    commissionRate: { type: Number, default: 5 },
    preferredCategories: { type: [String], default: [] },
    autoApproveProducts: { type: Boolean, default: false },
    showPersonalBranding: { type: Boolean, default: true },
    allowDirectMessages: { type: Boolean, default: true },
    payoutMethod: { type: String, default: 'paypal' },
    bankAccount: String,
    paypalEmail: String,
    stripeAccount: String,
    taxId: String,
    minimumPayout: { type: Number, default: 25 },
    trackingEnabled: { type: Boolean, default: true },
    customTrackingCode: String,
    utmParameters: {
      source: { type: String, default: 'affiliate' },
      medium: { type: String, default: 'social' },
      campaign: String
    },
    socialSharing: { type: Boolean, default: true },
    emailMarketing: { type: Boolean, default: false },
    trackClicks: { type: Boolean, default: true },
    trackConversions: { type: Boolean, default: true },
    trackRevenue: { type: Boolean, default: true },
    shareDataWithVendors: { type: Boolean, default: false },
    detailedReporting: { type: Boolean, default: true }
  }
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);