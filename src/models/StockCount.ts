import mongoose, { Schema } from 'mongoose';

// One immutable observation per submission. A retry uses the same primary key.
const stockCountSchema = new Schema({
  _id: { type: String, required: true },
  warehouseId: { type: String, required: true },
  warehouseName: { type: String, required: true },
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  sku: String,
  unit: String,
  packaging: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 },
  staffId: { type: String, required: true },
  countedBy: { type: String, required: true },
  checkerName: { type: String, trim: true, maxlength: 120 },
  createdAt: { type: Date, required: true },
  day: { type: String, required: true },
}, { versionKey: false });
stockCountSchema.index({ day: 1, createdAt: -1, _id: -1 });

export const StockCount = mongoose.model('StockCount', stockCountSchema);
