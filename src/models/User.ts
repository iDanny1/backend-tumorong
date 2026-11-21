import mongoose, { Schema, Document, Model } from 'mongoose';

// User
export interface IUser extends Document {
  username: string;
  password: string;
  name?: string;
  role?: string;
  email?: string;
  phone?: string;
  active?: boolean;
  createdAt: string;
}
const userSchema = new Schema<IUser>({
  username: { type: String, unique: true },
  password: { type: String, select: false },
  name: String,
  role: String,
  email: String,
  phone: String,
  active: { type: Boolean, default: true },
  createdAt: { type: String, default: () => new Date().toISOString() }
});
export const User: Model<IUser> = mongoose.model('User', userSchema);
