import mongoose, { Schema, Document, Model } from 'mongoose';

// ========================
// INTERFACE
// ========================
export interface ISpinUser extends Document {
  zaloId: string;
  name?: string;
  phone?: string;
  avatar?: string;
  spinsLeft: number;
  hasClaimedOASpin: boolean;
  isTestUser?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ========================
// SCHEMA
// ========================
const spinUserSchema = new Schema<ISpinUser>(
  {
    zaloId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      default: '',
      index: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    spinsLeft: {
      type: Number,
      default: 0,
      min: 0,
    },
    hasClaimedOASpin: {
      type: Boolean,
      default: false,
    },
    isTestUser: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: 'spin_users',
  }
);

// ========================
// MODEL
// ========================
// Dùng 'SpinUser' để tránh conflict với model 'User' trong server.ts
export const SpinUser: Model<ISpinUser> =
  (mongoose.models.SpinUser as Model<ISpinUser>) ||
  mongoose.model<ISpinUser>('SpinUser', spinUserSchema);
