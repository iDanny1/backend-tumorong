import mongoose, { Schema, Document, Model } from 'mongoose';

// Category
export interface ICategory extends Document {
  name: string;
  icon?: string;
  images?: string[];
  description?: string;
  active?: boolean;
  createdAt: string;
}
const categorySchema = new Schema<ICategory>({
  name: String,
  icon: String,
  images: [String],
  description: String,
  active: Boolean,
  createdAt: { type: String, default: () => new Date().toISOString() }
});
export const Category: Model<ICategory> = mongoose.model('Category', categorySchema);
