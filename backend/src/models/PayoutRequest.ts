import { Schema, model } from 'mongoose';

const payoutRequestSchema = new Schema({
  vendor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  payoutAccount: { type: Schema.Types.ObjectId, ref: 'PayoutAccount', required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  fee: { type: Number, required: true },
  netAmount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'completed', 'failed'], 
    default: 'pending' 
  },
  requestedAt: { type: Date, default: Date.now },
  processedAt: { type: Date },
  reference: { type: String }, // external reference from payment processor
  failureReason: { type: String },
  notes: { type: String }
}, { timestamps: true });

export default model('PayoutRequest', payoutRequestSchema);