export type VoucherType = 'fixed' | 'percentage';

/**
 * Entity định nghĩa cấu trúc dữ liệu của Voucher trong NeDB/MongoDB
 */
export class Voucher {
  /** NeDB tự sinh _id */
  _id?: string;

  /** Mã giảm giá, viết hoa (VD: SAM50K) */
  code: string;

  /** Mô tả chi tiết */
  description: string;

  /** Loại voucher: 'fixed' (giảm tiền mặt) hoặc 'percentage' (giảm %) */
  type: VoucherType;

  /** Số tiền giảm giá cố định (dùng cho loại 'fixed') */
  discountAmount?: number;

  /** Phần trăm giảm giá (dùng cho loại 'percentage') */
  discountPercentage?: number;

  /** Số tiền giảm tối đa (dùng cho loại 'percentage') */
  maxDiscountAmount?: number;

  /** Giá trị đơn hàng tối thiểu để áp dụng */
  minOrderValue: number;

  /** Giới hạn tổng số lần sử dụng */
  usageLimit: number;

  /** Số lần đã sử dụng */
  usedCount: number;

  /** Ngày bắt đầu hiệu lực */
  startDate: Date;

  /** Ngày hết hạn */
  endDate: Date;

  /** Trạng thái hoạt động */
  isActive: boolean;
}
