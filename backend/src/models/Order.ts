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
  status: { type: String, enum: ['pending', 'paid', 'shipped', 'completed', 'cancelled'], default: 'pending' }
}, { timestamps: true });

export default mongoose.model<IOrder>('Order', OrderSchema);