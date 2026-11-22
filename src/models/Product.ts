import mongoose, { Schema, Document, Model } from 'mongoose';

// Product
export interface IProduct extends Document {
  archived?: boolean;
  originalPrice?: number; brand?: string; weight?: number; width?: number; length?: number; height?: number;
  displayOrder?: number; views?: number; type?: string; platform?: string; isConsultant?: boolean; allowBooking?: boolean;
  name: string;
  price: number;
  description?: string;
  images?: string[];
  status?: string;
  stock?: number;
  warehouseStock?: any;
  isFeatured?: boolean;
  active?: boolean;
  categoryIds?: string[];
  categoryNames?: string[];
  createdAt: string;
  sku?: string;
  barcode?: string;
  unit?: string;
  packaging?: string;
}
export const productSchema = new Schema<IProduct>({
  archived: Boolean,
  originalPrice: { type: Number, min: 0 }, brand: String, weight: { type: Number, min: 0 },
  width: { type: Number, min: 0 }, length: { type: Number, min: 0 }, height: { type: Number, min: 0 },
  displayOrder: Number, views: { type: Number, min: 0 }, type: String, platform: String,
  isConsultant: Boolean, allowBooking: Boolean,
  name: { type: String, required: true, trim: true, maxlength: 500 },
  price: { type: Number, default: 0, min: 0 },
  description: String,
  images: [String],
  status: String,
  stock: { type: Number, min: 0, default: 0 },
  warehouseStock: Schema.Types.Mixed,
  isFeatured: Boolean,
  active: Boolean,
  categoryIds: [String],
  categoryNames: [String],
  createdAt: { type: String, default: () => new Date().toISOString() },
  sku: { type: String, trim: true, maxlength: 120 },
  barcode: String,
  unit: String,
  packaging: { type: String, trim: true, maxlength: 500 }
});
productSchema.index({ sku: 1 }, { unique: true, partialFilterExpression: { sku: { $type: 'string', $gt: '' } }, collation: { locale: 'en', strength: 2 } });
export const Product: Model<IProduct> = mongoose.model('Product', productSchema);
