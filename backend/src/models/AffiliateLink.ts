import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAffiliateLink extends Document {
  affiliate: Types.ObjectId;
  vendor: Types.ObjectId;
  linkType: 'product' | 'store' | 'category' | 'general';
  targetId?: Types.ObjectId; // Product ID, Store ID, or Category ID
  originalUrl: string; // The original URL without affiliate parameters
  affiliateUrl: string; // The URL with affiliate tracking parameters
  shortCode: string; // Short code for the link (e.g., "abc123")
  clicks: number;
  conversions: number;
  earnings: number;
  isActive: boolean;
  createdAt: Date;
  lastUsed?: Date;
}

const AffiliateLinkSchema = new Schema<IAffiliateLink>({
  affiliate: { type: Schema.Types.ObjectId, ref: 'Affiliate', required: true },
  vendor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  linkType: { 
    type: String, 
    enum: ['product', 'store', 'category', 'general'], 
    required: true 
  },
  targetId: Schema.Types.ObjectId,
  originalUrl: { type: String, required: true },
  affiliateUrl: { type: String, required: true },
  shortCode: { type: String, required: true, unique: true },
  clicks: { type: Number, default: 0 },
  conversions: { type: Number, default: 0 },
  earnings: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  lastUsed: Date
}, { timestamps: true });

// Indexes for efficient queries
AffiliateLinkSchema.index({ affiliate: 1, isActive: 1 });
AffiliateLinkSchema.index({ shortCode: 1 });
AffiliateLinkSchema.index({ vendor: 1 });

export default mongoose.model<IAffiliateLink>('AffiliateLink', AffiliateLinkSchema);
