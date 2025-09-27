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
  bargainingEnabled?: boolean;
  minBargainPrice?: number;
  maxBargainDiscountPercent?: number;
  // Product variants and specifications
  variants?: {
    sizes?: string[]; // Available sizes (e.g., ['S', 'M', 'L', 'XL'])
    colors?: string[]; // Available colors (e.g., ['Red', 'Blue', 'Green'])
    weight?: {
      value: number;
      unit: 'kg' | 'g' | 'lb' | 'oz'; // Weight unit
      displayValue?: string; // Formatted display (e.g., "500g", "1.2kg")
    };
    dimensions?: {
      length: number;
      width: number;
      height: number;
      unit: 'cm' | 'in' | 'm'; // Dimension unit
    };
    material?: string; // Material composition
    brand?: string; // Brand name
    sku?: string; // Stock Keeping Unit
    inventory?: number; // Available quantity
  };
  // Analytics and tracking fields
  views?: number; // Number of times this product has been viewed
  sold?: number; // Number of times this product has been sold
  rating?: {
    average: number; // Average rating (1-5)
    count: number; // Number of ratings
    breakdown: { [key: number]: number }; // Breakdown by rating (1, 2, 3, 4, 5)
  };
  // AR/3D Model fields
  modelUrl?: string; // URL to the 3D model file
  modelType?: 'gltf' | 'glb' | 'usdz'; // Type of 3D model
  modelStatus?: 'none' | 'generating' | 'ready' | 'failed'; // Status of 3D model generation
  modelGeneratedAt?: Date; // When the 3D model was generated
  modelGenerationId?: string; // Meshy.ai generation ID for tracking
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
  source: { type: String, default: 'local' },
  bargainingEnabled: { type: Boolean, default: false },
  minBargainPrice: { type: Number },
  maxBargainDiscountPercent: { type: Number, default: 20 },
  // Product variants and specifications
  variants: {
    sizes: { type: [String], default: [] }, // Available sizes
    colors: { type: [String], default: [] }, // Available colors
    weight: {
      value: { type: Number },
      unit: { type: String, enum: ['kg', 'g', 'lb', 'oz'] },
      displayValue: { type: String }
    },
    dimensions: {
      length: { type: Number },
      width: { type: Number },
      height: { type: Number },
      unit: { type: String, enum: ['cm', 'in', 'm'] }
    },
    material: { type: String },
    brand: { type: String },
    sku: { type: String },
    inventory: { type: Number, default: 0 }
  },
  // Analytics and tracking fields
  views: { type: Number, default: 0 },
  sold: { type: Number, default: 0 },
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 },
    breakdown: { type: Map, of: Number, default: new Map() }
  },
  // AR/3D Model fields
  modelUrl: { type: String },
  modelType: { type: String, enum: ['gltf', 'glb', 'usdz'] },
  modelStatus: { type: String, enum: ['none', 'generating', 'ready', 'failed'], default: 'none' },
  modelGeneratedAt: { type: Date },
  modelGenerationId: { type: String }
}, { timestamps: true });

export default mongoose.model<IProduct>('Product', ProductSchema);