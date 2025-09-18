import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IStore extends Document {
  owner: Types.ObjectId;
  name: string;
  description?: string;
  logo?: string;
  banner?: string; // store banner image
  approved: boolean; // whether admin approved the store
  isActive?: boolean; // whether store is active/enabled
  category?: string; // store category
}

const StoreSchema = new Schema<IStore>({
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: String,
  logo: String,
  banner: String, // store banner image
  approved: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  category: String
}, { timestamps: true });

export default mongoose.model<IStore>('Store', StoreSchema);