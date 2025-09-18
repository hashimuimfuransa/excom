import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IRental extends Document {
  owner: Types.ObjectId;
  title: string;
  description: string;
  images: string[];
  location: string;
  pricePerDay: number;
}

const RentalSchema = new Schema<IRental>({
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  images: { type: [String], default: [] },
  location: { type: String, required: true },
  pricePerDay: { type: Number, required: true }
}, { timestamps: true });

export default mongoose.model<IRental>('Rental', RentalSchema);