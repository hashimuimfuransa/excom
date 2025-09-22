import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAffiliate extends Document {
  user: Types.ObjectId;
  vendor: Types.ObjectId; // The vendor/store owner this affiliate works for
  store?: Types.ObjectId; // Optional store reference
  program?: Types.ObjectId; // Reference to affiliate program
  status: 'pending' | 'approved' | 'rejected' | 'banned';
  commissionRate: number; // Percentage commission (e.g., 5 for 5%)
  commissionType: 'percentage' | 'fixed'; // Percentage or fixed amount
  fixedCommissionAmount?: number; // For fixed commission type
  totalClicks: number;
  totalConversions: number;
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
  referralCode: string; // Unique referral code for this affiliate
  socialMediaHandles?: {
    instagram?: string;
    tiktok?: string;
    facebook?: string;
    twitter?: string;
    youtube?: string;
  };
  applicationDate: Date;
  approvalDate?: Date;
  notes?: string; // Vendor notes about this affiliate
  marketingExperience?: string; // Marketing experience details
  expectedMonthlySales?: string; // Expected monthly sales
  preferredCategories?: string[]; // Preferred product categories
}

const AffiliateSchema = new Schema<IAffiliate>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  vendor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  store: { type: Schema.Types.ObjectId, ref: 'Store' },
  program: { type: Schema.Types.ObjectId, ref: 'AffiliateProgram' },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'banned'], 
    default: 'pending' 
  },
  commissionRate: { type: Number, default: 5 }, // Default 5%
  commissionType: { 
    type: String, 
    enum: ['percentage', 'fixed'], 
    default: 'percentage' 
  },
  fixedCommissionAmount: Number,
  totalClicks: { type: Number, default: 0 },
  totalConversions: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  pendingEarnings: { type: Number, default: 0 },
  paidEarnings: { type: Number, default: 0 },
  referralCode: { type: String, required: true, unique: true },
  socialMediaHandles: {
    instagram: String,
    tiktok: String,
    facebook: String,
    twitter: String,
    youtube: String
  },
  applicationDate: { type: Date, default: Date.now },
  approvalDate: Date,
  notes: String,
  marketingExperience: String,
  expectedMonthlySales: String,
  preferredCategories: [String]
}, { timestamps: true });

// Index for efficient queries
AffiliateSchema.index({ vendor: 1, status: 1 });
AffiliateSchema.index({ referralCode: 1 });

export default mongoose.model<IAffiliate>('Affiliate', AffiliateSchema);
