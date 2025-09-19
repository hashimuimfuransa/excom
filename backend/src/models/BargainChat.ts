import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBargainMessage extends Document {
  sender: Types.ObjectId;
  senderType: 'buyer' | 'seller';
  message: string;
  messageType: 'text' | 'price_offer' | 'counter_offer' | 'accept_offer' | 'reject_offer';
  priceOffer?: number;
  isRead: boolean;
  timestamp: Date;
}

export interface IBargainChat extends Document {
  product: Types.ObjectId;
  buyer: Types.ObjectId;
  seller: Types.ObjectId;
  status: 'active' | 'closed' | 'accepted' | 'rejected';
  messages: IBargainMessage[];
  initialPrice: number;
  currentOffer?: number;
  finalPrice?: number;
  lastActivity: Date;
}

const BargainMessageSchema = new Schema<IBargainMessage>({
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  senderType: { type: String, enum: ['buyer', 'seller'], required: true },
  message: { type: String, required: true },
  messageType: { 
    type: String, 
    enum: ['text', 'price_offer', 'counter_offer', 'accept_offer', 'reject_offer'], 
    default: 'text' 
  },
  priceOffer: { type: Number },
  isRead: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
});

const BargainChatSchema = new Schema<IBargainChat>({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  buyer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  seller: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { 
    type: String, 
    enum: ['active', 'closed', 'accepted', 'rejected'], 
    default: 'active' 
  },
  messages: [BargainMessageSchema],
  initialPrice: { type: Number, required: true },
  currentOffer: { type: Number },
  finalPrice: { type: Number },
  lastActivity: { type: Date, default: Date.now }
}, { timestamps: true });

// Indexes for better query performance
BargainChatSchema.index({ product: 1, buyer: 1 });
BargainChatSchema.index({ seller: 1, lastActivity: -1 });
BargainChatSchema.index({ buyer: 1, lastActivity: -1 });

export default mongoose.model<IBargainChat>('BargainChat', BargainChatSchema);