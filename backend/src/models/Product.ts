import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IProduct extends Document {
  title: string;
  description: string;
  images: string[];
  price: number;
  currency: string;
  seller: Types.ObjectId;
  store?: Types.ObjectId; // Reference to the store
  category: string;
  source?: 'local' | 'amazon' | 'ebay' | 'alibaba' | 'shopify';
}

const ProductSchema = new Schema<IProduct>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  images: { type: [String], default: [] },
  price: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  seller: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  store: { type: Schema.Types.ObjectId, ref: 'Store' }, // Optional store reference
  category: { type: String, required: true },
  source: { type: String, default: 'local' }
}, { timestamps: true });

export default mongoose.model<IProduct>('Product', ProductSchema);