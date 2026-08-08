import mongoose, { Schema, Document, Model } from 'mongoose';

// ========================
// INTERFACE
// ========================
export interface IVoucher extends Document {
  code: string;
  discountAmount: number;
  userId: string;       // ref SpinUser.zaloId
  isUsed: boolean;
  createdAt: Date;
}

// ========================
// SCHEMA
// ========================
const voucherSchema = new Schema<IVoucher>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    discountAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'spin_vouchers',
  }
);

// ========================
// MODEL
// ========================
// Dùng 'SpinVoucher' để tránh conflict với model 'Voucher' trong server.ts
export const Voucher: Model<IVoucher> =
  (mongoose.models.SpinVoucher as Model<IVoucher>) ||
  mongoose.model<IVoucher>('SpinVoucher', voucherSchema);
