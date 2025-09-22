import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAffiliateCommission extends Document {
  affiliate: Types.ObjectId;
  vendor: Types.ObjectId;
  order: Types.ObjectId;
  orderItem: Types.ObjectId; // Reference to specific order item
  product: Types.ObjectId;
  click?: Types.ObjectId; // Reference to the original click
  
  // Commission details
  orderAmount: number; // Total amount of the order item
  commissionRate: number; // Commission rate applied
  commissionType: 'percentage' | 'fixed';
  commissionAmount: number; // Calculated commission amount
  platformFee: number; // Platform fee deducted
  vendorFee: number; // Vendor fee deducted (if any)
  netCommission: number; // Final commission after fees
  
  // Status tracking
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  payoutRequest?: Types.ObjectId; // Reference to payout request
  
  // Dates
  earnedDate: Date; // When commission was earned
  approvedDate?: Date;
  paidDate?: Date;
  
  // Additional info
  notes?: string;
  refunded: boolean; // Whether this commission was refunded
  refundDate?: Date;
  refundReason?: string;
}

const AffiliateCommissionSchema = new Schema<IAffiliateCommission>({
  affiliate: { type: Schema.Types.ObjectId, ref: 'Affiliate', required: true },
  vendor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  order: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  orderItem: { type: Schema.Types.ObjectId, required: true },
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  click: { type: Schema.Types.ObjectId, ref: 'AffiliateClick' },
  
  orderAmount: { type: Number, required: true },
  commissionRate: { type: Number, required: true },
  commissionType: { 
    type: String, 
    enum: ['percentage', 'fixed'], 
    required: true 
  },
  commissionAmount: { type: Number, required: true },
  platformFee: { type: Number, default: 0 },
  vendorFee: { type: Number, default: 0 },
  netCommission: { type: Number, required: true },
  
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'paid', 'cancelled'], 
    default: 'pending' 
  },
  payoutRequest: { type: Schema.Types.ObjectId, ref: 'AffiliatePayout' },
  
  earnedDate: { type: Date, default: Date.now },
  approvedDate: Date,
  paidDate: Date,
  
  notes: String,
  refunded: { type: Boolean, default: false },
  refundDate: Date,
  refundReason: String
}, { timestamps: true });

// Indexes for efficient queries
AffiliateCommissionSchema.index({ affiliate: 1, status: 1 });
AffiliateCommissionSchema.index({ vendor: 1, status: 1 });
AffiliateCommissionSchema.index({ order: 1 });
AffiliateCommissionSchema.index({ earnedDate: -1 });

export default mongoose.model<IAffiliateCommission>('AffiliateCommission', AffiliateCommissionSchema);
