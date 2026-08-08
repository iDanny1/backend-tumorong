import mongoose, { Schema, Document, Model } from 'mongoose';

// =====================================================
// Ghi lại lịch sử USER dùng voucher nào, bao nhiêu lần
// Dùng để kiểm tra userLimit per-user
// =====================================================
export interface IUserVoucherUsage extends Document {
  userId: string;           // Zalo ID
  voucherCode: string;      // Mã voucher (uppercase)
  usedCount: number;        // Số lần user này đã dùng mã này
  lastUsedAt: Date;
}

const userVoucherUsageSchema = new Schema<IUserVoucherUsage>(
  {
    userId: {
      type: String,
      required: true,
    },
    voucherCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    usedCount: {
      type: Number,
      default: 1,
      min: 0,
    },
    lastUsedAt: {
      type: Date,
      default: () => new Date(),
    },
  },
  {
    timestamps: false,
    collection: 'user_voucher_usages',
  }
);

// Compound index: 1 record per (userId, voucherCode) pair
userVoucherUsageSchema.index({ userId: 1, voucherCode: 1 }, { unique: true });

export const UserVoucherUsage: Model<IUserVoucherUsage> =
  (mongoose.models.UserVoucherUsage as Model<IUserVoucherUsage>) ||
  mongoose.model<IUserVoucherUsage>('UserVoucherUsage', userVoucherUsageSchema);
