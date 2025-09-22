import mongoose, { Schema, Document, Types } from 'mongoose';

interface IOrderItem {
  product: Types.ObjectId;
  quantity: number;
  price: number;
  vendor: string; // vendor identifier for splitting
}

export interface IOrder extends Document {
  buyer: Types.ObjectId;
  items: IOrderItem[];
  total: number;
  currency: string;
  status: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled';
  // Affiliate tracking
  affiliateId?: Types.ObjectId; // Reference to affiliate who referred this order
  affiliateCode?: string; // Affiliate referral code used
  couponCode?: string; // Affiliate coupon code used
  referralSource?: string; // Source of the referral (link, coupon, etc.)
}

const OrderSchema = new Schema<IOrder>({
  buyer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, default: 1 },
    price: { type: Number, required: true },
    vendor: { type: String, required: true }
  }],
  total: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  status: { type: String, enum: ['pending', 'paid', 'shipped', 'completed', 'cancelled'], default: 'pending' },
  // Affiliate tracking
  affiliateId: { type: Schema.Types.ObjectId, ref: 'Affiliate' },
  affiliateCode: String,
  couponCode: String,
  referralSource: String
}, { timestamps: true });

export default mongoose.model<IOrder>('Order', OrderSchema);