import mongoose, { Schema, Document, Model } from 'mongoose';

// Product
export interface IProduct extends Document {
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
  name: String,
  price: Number,
  description: String,
  images: [String],
  status: String,
  stock: Number,
  warehouseStock: Schema.Types.Mixed,
  isFeatured: Boolean,
  active: Boolean,
  categoryIds: [String],
  categoryNames: [String],
  createdAt: { type: String, default: () => new Date().toISOString() },
  sku: String,
  barcode: String,
  unit: String,
  packaging: { type: String, trim: true, maxlength: 500 }
});
export const Product: Model<IProduct> = mongoose.model('Product', productSchema);
