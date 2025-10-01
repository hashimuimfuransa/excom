import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAffiliatePayout extends Document {
  affiliate: Types.ObjectId;
  vendor: Types.ObjectId;
  commissions: Types.ObjectId[]; // Array of commission IDs included in this payout
  
  // Payout details
  totalAmount: number; // Total commission amount before fees
  platformFee: number; // Platform processing fee
  vendorFee: number; // Vendor fee (if any)
  netAmount: number; // Amount to be paid to affiliate
  
  // Payment method
  paymentMethod: 'bank' | 'mobile_money' | 'paypal';
  paymentDetails: {
    accountName?: string;
    accountNumber?: string;
    bankName?: string;
    mobileNumber?: string;
    paypalEmail?: string;
    routingNumber?: string;
  };
  
  // Status tracking
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  
  // Processing info
  transactionId?: string;
  processingDate?: Date;
  completedDate?: Date;
  failureReason?: string;
  
  // Approval workflow
  requestedBy: Types.ObjectId; // Affiliate who requested
  approvedBy?: Types.ObjectId; // Admin who approved
  approvedAt?: Date;
  rejectedBy?: Types.ObjectId; // Admin who rejected
  rejectedAt?: Date;
  rejectionReason?: string;
  
  // Additional info
  notes?: string;
  requestedAt: Date;
}

const AffiliatePayoutSchema = new Schema<IAffiliatePayout>({
  affiliate: { type: Schema.Types.ObjectId, ref: 'Affiliate', required: true },
  vendor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  commissions: [{ type: Schema.Types.ObjectId, ref: 'AffiliateCommission' }],
  
  totalAmount: { type: Number, required: true },
  platformFee: { type: Number, default: 0 },
  vendorFee: { type: Number, default: 0 },
  netAmount: { type: Number, required: true },
  
  paymentMethod: { 
    type: String, 
    enum: ['bank', 'mobile_money', 'paypal'], 
    required: true 
  },
  paymentDetails: {
    accountName: String,
    accountNumber: String,
    bankName: String,
    mobileNumber: String,
    paypalEmail: String,
    routingNumber: String
  },
  
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'paid'], 
    default: 'pending' 
  },
  
  transactionId: String,
  processingDate: Date,
  completedDate: Date,
  failureReason: String,
  
  requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  approvedAt: Date,
  rejectedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  rejectedAt: Date,
  rejectionReason: String,
  
  notes: String,
  requestedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Indexes for efficient queries
AffiliatePayoutSchema.index({ affiliate: 1, status: 1 });
AffiliatePayoutSchema.index({ vendor: 1, status: 1 });
AffiliatePayoutSchema.index({ requestedAt: -1 });

export default mongoose.model<IAffiliatePayout>('AffiliatePayout', AffiliatePayoutSchema);
