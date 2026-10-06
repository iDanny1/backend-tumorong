import mongoose, { Schema } from 'mongoose';

export const customerSchema = new Schema({
  name: String,
  // Companies and delivery destinations may share a contact phone.
  phone: { type: String, default: '' },
  phoneRaw: String,
  contactName: String,
  email: String,
  address: String,
  departmentAddress: String,
  deliveryAddress: String,
  importKey: String,
  ordersCount: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  remainingPoints: { type: Number, default: 0 },
  totalPoints: { type: Number, default: 0 },
  tags: [String],
  type: { type: String, default: 'retail' },
  lastAccess: { type: String, default: () => new Date().toISOString() },
  createdAt: { type: String, default: () => new Date().toISOString() },
});
customerSchema.index({ importKey: 1 }, { unique: true, sparse: true });
customerSchema.index({ phone: 1 }, { name: 'customer_phone_lookup' });
export const Customer = mongoose.model('Customer', customerSchema);

export async function prepareCustomerIndexes() {
  await Customer.init();
  // Install the replacement lookup before removing the legacy constraint.
  await Customer.collection.createIndex({ phone: 1 }, { name: 'customer_phone_lookup' });
  await Customer.collection.createIndex({ importKey: 1 }, { unique: true, sparse: true });
  const indexes = await Customer.collection.indexes();
  const legacy = indexes.find(index => index.name === 'phone_1' && index.unique && Object.keys(index.key).length === 1 && index.key.phone === 1);
  if (legacy) await Customer.collection.dropIndex(legacy.name!);
}
