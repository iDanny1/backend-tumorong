import mongoose, { Schema, Document, Model } from 'mongoose';

// Order
export interface IOrder extends Document {
  orderId?: string;
  orderCode?: string;    // Mã đơn hàng dạng DH + timestamp (Zalo Mini App)
  customerName?: string;
  customerPhone?: string;
  customer?: object;
  products?: any[];
  items?: any[];
  total?: number;
  totalAmount?: number;
  shippingFee?: number;
  paymentMethod?: string;
  shippingMethod?: string;
  shippingUnit?: string;
  note?: string;
  invoice?: object;
  status?: string;
  paymentStatus?: string;
  platform?: string;
  address?: string;
  ghnOrderCode?: string;
  voucherCode?: string;
  discountAmount?: number;
  stockDeducted?: boolean;
  createdAt: string;
}
const orderSchema = new Schema<IOrder>({
  orderId: String,
  orderCode: { type: String, index: true },
  customerName: String,
  customerPhone: String,
  customer: Schema.Types.Mixed,
  products: [Schema.Types.Mixed],
  items: [Schema.Types.Mixed],
  total: Number,
  totalAmount: Number,
  shippingFee: Number,
  paymentMethod: String,
  shippingMethod: String,
  shippingUnit: String,
  note: String,
  invoice: Schema.Types.Mixed,
  status: String,
  paymentStatus: String,
  platform: String,
  address: String,
  ghnOrderCode: String,
  voucherCode: String,
  discountAmount: Number,
  stockDeducted: { type: Boolean, default: false },
  createdAt: { type: String, default: () => new Date().toISOString() }
});
export const Order: Model<IOrder> = mongoose.model('Order', orderSchema);
