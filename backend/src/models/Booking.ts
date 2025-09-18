import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBooking extends Document {
  collection: Types.ObjectId;
  customer: Types.ObjectId;
  vendor: Types.ObjectId;
  
  // Booking details
  checkIn?: Date;
  checkOut?: Date;
  guests?: number;
  roomType?: string;
  
  // Pricing
  totalAmount: number;
  currency: string;
  
  // Payment
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod?: string;
  transactionId?: string;
  
  // Status
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  
  // Additional info
  specialRequests?: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  
  // Vendor response
  vendorNotes?: string;
  vendorResponse?: 'pending' | 'accepted' | 'rejected';
}

const BookingSchema = new Schema<IBooking>({
  collection: { type: Schema.Types.ObjectId, ref: 'Collection', required: true },
  customer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  vendor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  
  checkIn: Date,
  checkOut: Date,
  guests: { type: Number, default: 1 },
  roomType: String,
  
  totalAmount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'paid', 'failed', 'refunded'], 
    default: 'pending' 
  },
  paymentMethod: String,
  transactionId: String,
  
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'cancelled', 'completed'], 
    default: 'pending' 
  },
  
  specialRequests: String,
  customerInfo: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true }
  },
  
  vendorNotes: String,
  vendorResponse: { 
    type: String, 
    enum: ['pending', 'accepted', 'rejected'], 
    default: 'pending' 
  }
}, { timestamps: true });

export default mongoose.model<IBooking>('Booking', BookingSchema);