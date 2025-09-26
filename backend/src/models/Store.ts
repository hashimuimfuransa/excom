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
  // Contact Information
  contactInfo?: {
    email?: string;
    phone?: string;
    website?: string;
    socialMedia?: {
      facebook?: string;
      instagram?: string;
      twitter?: string;
      linkedin?: string;
    };
  };
  // Location Information
  location?: {
    address: string;
    city: string;
    state?: string;
    country: string;
    postalCode?: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  // Business Hours
  businessHours?: {
    monday?: { open: string; close: string; closed?: boolean };
    tuesday?: { open: string; close: string; closed?: boolean };
    wednesday?: { open: string; close: string; closed?: boolean };
    thursday?: { open: string; close: string; closed?: boolean };
    friday?: { open: string; close: string; closed?: boolean };
    saturday?: { open: string; close: string; closed?: boolean };
    sunday?: { open: string; close: string; closed?: boolean };
  };
}

const StoreSchema = new Schema<IStore>({
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: String,
  logo: String,
  banner: String, // store banner image
  approved: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  category: String,
  // Contact Information
  contactInfo: {
    email: String,
    phone: String,
    website: String,
    socialMedia: {
      facebook: String,
      instagram: String,
      twitter: String,
      linkedin: String
    }
  },
  // Location Information
  location: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: String,
    country: { type: String, required: true },
    postalCode: String,
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    }
  },
  // Business Hours
  businessHours: {
    monday: { open: String, close: String, closed: Boolean },
    tuesday: { open: String, close: String, closed: Boolean },
    wednesday: { open: String, close: String, closed: Boolean },
    thursday: { open: String, close: String, closed: Boolean },
    friday: { open: String, close: String, closed: Boolean },
    saturday: { open: String, close: String, closed: Boolean },
    sunday: { open: String, close: String, closed: Boolean }
  }
}, { timestamps: true });

export default mongoose.model<IStore>('Store', StoreSchema);