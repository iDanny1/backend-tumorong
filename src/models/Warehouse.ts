import mongoose, { Schema, Document, Model } from 'mongoose';

// Warehouse
export interface IWarehouse extends Document {
  name: string;
  address?: string;
  location?: string;
  phone?: string;
  active?: boolean;
  createdAt: string;
}
const warehouseSchema = new Schema<IWarehouse>({
  name: String,
  address: String,
  location: String,
  phone: String,
  active: Boolean,
  createdAt: { type: String, default: () => new Date().toISOString() }
});
export const Warehouse: Model<IWarehouse> = mongoose.model('Warehouse', warehouseSchema);
