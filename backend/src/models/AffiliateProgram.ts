import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAffiliateProgram extends Document {
  vendor: Types.ObjectId; // Store owner
  store?: Types.ObjectId; // Optional store reference
  isActive: boolean;
  globalSettings: {
    enabled: boolean; // Global affiliate program enabled/disabled
    defaultCommissionRate: number; // Default commission rate for new affiliates
    defaultCommissionType: 'percentage' | 'fixed';
    defaultFixedAmount?: number;
    minPayoutAmount: number; // Minimum amount for payout requests
    payoutFrequency: 'weekly' | 'monthly' | 'quarterly';
    autoApproveAffiliates: boolean; // Auto-approve new affiliate applications
    requireSocialMediaVerification: boolean;
  };
  commissionRules: {
    productCategories: Array<{
      category: string;
      commissionRate: number;
      commissionType: 'percentage' | 'fixed';
      fixedAmount?: number;
    }>;
    tieredCommissions?: Array<{
      minSales: number;
      commissionRate: number;
    }>;
  };
  payoutSettings: {
    allowedMethods: string[]; // ['bank', 'mobile_money', 'paypal']
    processingFee: number; // Platform fee percentage
    vendorFee: number; // Vendor fee percentage (optional)
  };
  trackingSettings: {
    cookieDuration: number; // Days to track referrals
    allowMultipleConversions: boolean;
    conversionWindow: number; // Days for conversion attribution
  };
  createdAt: Date;
  updatedAt: Date;
}

const AffiliateProgramSchema = new Schema<IAffiliateProgram>({
  vendor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  store: { type: Schema.Types.ObjectId, ref: 'Store' },
  isActive: { type: Boolean, default: true },
  globalSettings: {
    enabled: { type: Boolean, default: true },
    defaultCommissionRate: { type: Number, default: 5 },
    defaultCommissionType: { 
      type: String, 
      enum: ['percentage', 'fixed'], 
      default: 'percentage' 
    },
    defaultFixedAmount: Number,
    minPayoutAmount: { type: Number, default: 50 },
    payoutFrequency: { 
      type: String, 
      enum: ['weekly', 'monthly', 'quarterly'], 
      default: 'monthly' 
    },
    autoApproveAffiliates: { type: Boolean, default: false },
    requireSocialMediaVerification: { type: Boolean, default: false }
  },
  commissionRules: {
    productCategories: [{
      category: String,
      commissionRate: Number,
      commissionType: { 
        type: String, 
        enum: ['percentage', 'fixed'], 
        default: 'percentage' 
      },
      fixedAmount: Number
    }],
    tieredCommissions: [{
      minSales: Number,
      commissionRate: Number
    }]
  },
  payoutSettings: {
    allowedMethods: { type: [String], default: ['bank', 'mobile_money'] },
    processingFee: { type: Number, default: 3 }, // 3% platform fee
    vendorFee: { type: Number, default: 0 } // Optional vendor fee
  },
  trackingSettings: {
    cookieDuration: { type: Number, default: 30 }, // 30 days
    allowMultipleConversions: { type: Boolean, default: true },
    conversionWindow: { type: Number, default: 7 } // 7 days
  }
}, { timestamps: true });

// Ensure one program per vendor
AffiliateProgramSchema.index({ vendor: 1 }, { unique: true });

export default mongoose.model<IAffiliateProgram>('AffiliateProgram', AffiliateProgramSchema);
