import mongoose, { Schema, Document, Model } from 'mongoose';

// ========================
// INTERFACE
// ========================
export interface ISpinUser extends Document {
  zaloId: string;
  spinsLeft: number;
  hasClaimedOASpin: boolean;
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
    spinsLeft: {
      type: Number,
      default: 0,
      min: 0,
    },
    hasClaimedOASpin: {
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
