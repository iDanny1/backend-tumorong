import mongoose, { Schema, Document, Model } from 'mongoose';

// Voucher
export interface IVoucher extends Document {
  code: string;
  type?: string;
  description?: string;
  discount?: number;
  discountAmount?: number;
  discountPercentage?: number;
  discountType?: string;
  minOrderValue?: number;
  maxDiscount?: number;
  maxDiscountAmount?: number;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  expiresAt?: string;
  usageLimit?: number;
  usedCount?: number;
  createdAt: string;
}
const voucherSchema = new Schema<IVoucher>({
  code: { type: String, unique: true },
  type: { type: String, default: 'fixed' },
  description: String,
  discount: Number,
  discountAmount: Number,
  discountPercentage: Number,
  discountType: String,
  minOrderValue: Number,
  maxDiscount: Number,
  maxDiscountAmount: Number,
  startDate: String,
  endDate: String,
  isActive: { type: Boolean, default: true },
  expiresAt: String,
  usageLimit: Number,
  usedCount: { type: Number, default: 0 },
  createdAt: { type: String, default: () => new Date().toISOString() }
});
export const Voucher: Model<IVoucher> = mongoose.model('Voucher', voucherSchema);
