import mongoose, { Schema, Document, Model } from 'mongoose';

// Article (News)
export interface IArticle extends Document {
  title: string;
  slug?: string;
  summary?: string;
  content?: string;
  thumbnail?: string;
  category?: string;
  author?: string;
  status?: string;
  views?: number;
  tags?: string[];
  publishedAt?: string;
  createdAt: string;
  updatedAt?: string;
}
const articleSchema = new Schema<IArticle>({
  title: String,
  slug: String,
  summary: String,
  content: String,
  thumbnail: String,
  category: String,
  author: String,
  status: String,
  views: { type: Number, default: 0 },
  tags: [String],
  publishedAt: String,
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: String
});
export const Article: Model<IArticle> = mongoose.model('Article', articleSchema);
