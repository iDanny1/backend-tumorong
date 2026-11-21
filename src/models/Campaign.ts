import mongoose, { Schema, Document, Model } from 'mongoose';

// Campaign
export interface ICampaign extends Document {
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  discount?: number;
  active?: boolean;
  createdAt: string;
}
const campaignSchema = new Schema<ICampaign>({
  name: String,
  description: String,
  startDate: String,
  endDate: String,
  discount: Number,
  active: Boolean,
  createdAt: { type: String, default: () => new Date().toISOString() }
});
export const Campaign: Model<ICampaign> = mongoose.model('Campaign', campaignSchema);
