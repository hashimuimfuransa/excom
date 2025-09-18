import { Schema, model } from 'mongoose';

const payoutAccountSchema = new Schema({
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['bank', 'paypal', 'stripe'], required: true },
  accountName: { type: String, required: true },
  accountNumber: { type: String, required: true }, // masked for display
  accountDetails: { type: Object }, // full details encrypted
  isDefault: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
}, { timestamps: true });

export default model('PayoutAccount', payoutAccountSchema);