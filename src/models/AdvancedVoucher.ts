import mongoose, { Schema, Document, Model } from 'mongoose';

// =====================================================
// ENUMS
// =====================================================
export type VoucherVisibility = 'PUBLIC' | 'SECRET';
export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';

// =====================================================
// INTERFACE
// =====================================================
export interface IAdvancedVoucher extends Document {
  code: string;                      // Mã giảm giá (uppercase, trim)
  description: string;               // Mô tả ngắn hiển thị UI

  // ── Phân loại ──
  visibility: VoucherVisibility;     // PUBLIC | SECRET
  discountType: DiscountType;        // PERCENTAGE | FIXED_AMOUNT
  discountValue: number;             // % hoặc VNĐ

  // ── Giới hạn tính toán ──
  maxDiscountAmount: number;         // Giảm tối đa (áp dụng cho PERCENTAGE)
  minOrderValue: number;             // Đơn tối thiểu để dùng mã

  // ── Giới hạn sử dụng ──
  usageLimit: number;                // Tổng lượt dùng toàn hệ thống (0 = không giới hạn)
  usedCount: number;                 // Đếm số lần đã dùng
  userLimit: number;                 // Số lần 1 user được dùng (0 = không giới hạn)

  // ── Thời gian ──
  startDate: Date;
  endDate: Date;

  // ── Trạng thái ──
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

// =====================================================
// SCHEMA
// =====================================================
const advancedVoucherSchema = new Schema<IAdvancedVoucher>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
    },

    // ── Phân loại ──
    visibility: {
      type: String,
      enum: ['PUBLIC', 'SECRET'],
      default: 'PUBLIC',
      index: true,
    },
    discountType: {
      type: String,
      enum: ['PERCENTAGE', 'FIXED_AMOUNT'],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },

    // ── Giới hạn tính toán ──
    maxDiscountAmount: {
      type: Number,
      default: 0,   // 0 = không giới hạn mức giảm
      min: 0,
    },
    minOrderValue: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ── Giới hạn sử dụng ──
    usageLimit: {
      type: Number,
      default: 0,   // 0 = không giới hạn tổng lượt
      min: 0,
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    userLimit: {
      type: Number,
      default: 1,   // Mặc định mỗi user chỉ dùng 1 lần
      min: 0,
    },

    // ── Thời gian ──
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },

    // ── Trạng thái ──
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'advanced_vouchers',
  }
);

// =====================================================
// INDEX kép để query nhanh danh sách public
// =====================================================
advancedVoucherSchema.index({ visibility: 1, isActive: 1, endDate: 1 });

// =====================================================
// MODEL — đặt tên AdvancedVoucher để không conflict
// với model 'Voucher' hiện có trong server.ts
// =====================================================
export const AdvancedVoucher: Model<IAdvancedVoucher> =
  (mongoose.models.AdvancedVoucher as Model<IAdvancedVoucher>) ||
  mongoose.model<IAdvancedVoucher>('AdvancedVoucher', advancedVoucherSchema);
