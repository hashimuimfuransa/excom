import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAffiliateClick extends Document {
  affiliate: Types.ObjectId;
  affiliateLink?: Types.ObjectId;
  vendor: Types.ObjectId;
  visitorId: string; // Unique identifier for the visitor
  ipAddress: string;
  userAgent: string;
  referrer?: string;
  clickedUrl: string;
  targetUrl: string;
  linkType: 'product' | 'store' | 'category' | 'general';
  targetId?: Types.ObjectId;
  sessionId?: string;
  country?: string;
  city?: string;
  device?: string;
  browser?: string;
  os?: string;
  converted: boolean; // Whether this click led to a conversion
  conversionDate?: Date;
  orderId?: Types.ObjectId; // If converted, reference to the order
  createdAt: Date;
}

const AffiliateClickSchema = new Schema<IAffiliateClick>({
  affiliate: { type: Schema.Types.ObjectId, ref: 'Affiliate', required: true },
  affiliateLink: { type: Schema.Types.ObjectId, ref: 'AffiliateLink' },
  vendor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  visitorId: { type: String, required: true },
  ipAddress: { type: String, required: true },
  userAgent: { type: String, required: true },
  referrer: String,
  clickedUrl: { type: String, required: true },
  targetUrl: { type: String, required: true },
  linkType: { 
    type: String, 
    enum: ['product', 'store', 'category', 'general'], 
    required: true 
  },
  targetId: Schema.Types.ObjectId,
  sessionId: String,
  country: String,
  city: String,
  device: String,
  browser: String,
  os: String,
  converted: { type: Boolean, default: false },
  conversionDate: Date,
  orderId: { type: Schema.Types.ObjectId, ref: 'Order' }
}, { timestamps: true });

// Indexes for efficient queries and analytics
AffiliateClickSchema.index({ affiliate: 1, createdAt: -1 });
AffiliateClickSchema.index({ vendor: 1, createdAt: -1 });
AffiliateClickSchema.index({ visitorId: 1 });
AffiliateClickSchema.index({ converted: 1, createdAt: -1 });

export default mongoose.model<IAffiliateClick>('AffiliateClick', AffiliateClickSchema);
