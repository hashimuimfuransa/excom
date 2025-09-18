import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ILocation {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode?: string;
}

export interface IBusinessHours {
  day: string;
  openTime: string;
  closeTime: string;
  isOpen: boolean;
}

export interface ICollection extends Document {
  vendor: Types.ObjectId;
  title: string;
  description?: string;
  type: 'hotel' | 'restaurant' | 'real-estate' | 'car-rental' | 'education' | 'shopping' | 'service' | 'other';
  category?: string;
  images: string[];
  location: ILocation;
  businessHours?: IBusinessHours[];
  amenities?: string[];
  price?: number;
  priceType?: 'per-night' | 'per-hour' | 'per-day' | 'per-month' | 'fixed' | 'contact';
  isActive: boolean;
  
  // Hotel specific fields
  roomTypes?: {
    name: string;
    capacity: number;
    price: number;
    amenities: string[];
    images: string[];
  }[];
  
  // Restaurant specific fields
  cuisine?: string;
  menuItems?: {
    name: string;
    description: string;
    price: number;
    category: string;
    image?: string;
  }[];
  
  // Real estate specific fields
  propertyType?: 'apartment' | 'house' | 'commercial' | 'land';
  bedrooms?: number;
  bathrooms?: number;
  area?: number; // square feet
  
  // Car rental specific fields
  vehicleType?: 'sedan' | 'suv' | 'truck' | 'luxury' | 'sports' | 'electric' | 'hybrid';
  year?: number;
  make?: string;
  model?: string;
  transmission?: 'automatic' | 'manual';
  fuelType?: 'gasoline' | 'diesel' | 'electric' | 'hybrid';
  seatingCapacity?: number;
  
  // Education specific fields
  subjectArea?: string;
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced' | 'all-levels';
  sessionType?: 'online' | 'in-person' | 'hybrid';
  duration?: number; // minutes
  qualification?: string;
  languages?: string[];
  
  // Shopping specific fields
  brand?: string;
  productCategory?: string;
  availability?: 'in-stock' | 'out-of-stock' | 'pre-order' | 'limited';
  shippingInfo?: {
    freeShipping: boolean;
    estimatedDays: number;
    shippingCost?: number;
  };
  returnPolicy?: string;
  
  rating?: number;
  totalRatings?: number;
  features?: string[];
  policies?: string[];
  contactInfo: {
    phone?: string;
    email?: string;
    website?: string;
  };
}

const LocationSchema = new Schema<ILocation>({
  type: { type: String, enum: ['Point'], default: 'Point' },
  coordinates: { type: [Number], required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
  zipCode: String
});

const BusinessHoursSchema = new Schema<IBusinessHours>({
  day: { type: String, required: true },
  openTime: { type: String, required: true },
  closeTime: { type: String, required: true },
  isOpen: { type: Boolean, default: true }
});

const CollectionSchema = new Schema<ICollection>({
  vendor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: String,
  type: { 
    type: String, 
    enum: ['hotel', 'restaurant', 'real-estate', 'car-rental', 'education', 'shopping', 'service', 'other'], 
    required: true 
  },
  category: String,
  images: [String],
  location: { type: LocationSchema, required: true },
  businessHours: [BusinessHoursSchema],
  amenities: [String],
  price: Number,
  priceType: { 
    type: String, 
    enum: ['per-night', 'per-hour', 'per-day', 'per-month', 'fixed', 'contact'],
    default: 'fixed'
  },
  isActive: { type: Boolean, default: true },
  
  // Hotel specific
  roomTypes: [{
    name: String,
    capacity: Number,
    price: Number,
    amenities: [String],
    images: [String]
  }],
  
  // Restaurant specific
  cuisine: String,
  menuItems: [{
    name: String,
    description: String,
    price: Number,
    category: String,
    image: String
  }],
  
  // Real estate specific
  propertyType: { 
    type: String, 
    enum: ['apartment', 'house', 'commercial', 'land']
  },
  bedrooms: Number,
  bathrooms: Number,
  area: Number,
  
  // Car rental specific
  vehicleType: {
    type: String,
    enum: ['sedan', 'suv', 'truck', 'luxury', 'sports', 'electric', 'hybrid']
  },
  year: Number,
  make: String,
  model: String,
  transmission: {
    type: String,
    enum: ['automatic', 'manual']
  },
  fuelType: {
    type: String,
    enum: ['gasoline', 'diesel', 'electric', 'hybrid']
  },
  seatingCapacity: Number,
  
  // Education specific
  subjectArea: String,
  experienceLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'all-levels']
  },
  sessionType: {
    type: String,
    enum: ['online', 'in-person', 'hybrid']
  },
  duration: Number,
  qualification: String,
  languages: [String],
  
  // Shopping specific
  brand: String,
  productCategory: String,
  availability: {
    type: String,
    enum: ['in-stock', 'out-of-stock', 'pre-order', 'limited'],
    default: 'in-stock'
  },
  shippingInfo: {
    freeShipping: { type: Boolean, default: false },
    estimatedDays: Number,
    shippingCost: Number
  },
  returnPolicy: String,
  
  rating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
  features: [String],
  policies: [String],
  contactInfo: {
    phone: String,
    email: String,
    website: String
  }
}, { timestamps: true });

// Create geospatial index for location-based queries
CollectionSchema.index({ 'location': '2dsphere' });

export default mongoose.model<ICollection>('Collection', CollectionSchema);