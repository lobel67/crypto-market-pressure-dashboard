import mongoose, { Schema, Document } from 'mongoose';

export interface IAlert extends Document {
  userId?: string;
  symbol: string;
  type: 'pressure_score' | 'liquidation' | 'whale_activity' | 'news_sentiment';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  data: any;
  read: boolean;
  createdAt: Date;
}

const AlertSchema = new Schema<IAlert>({
  userId: { type: String, index: true },
  symbol: { type: String, required: true, index: true },
  type: {
    type: String,
    enum: ['pressure_score', 'liquidation', 'whale_activity', 'news_sentiment'],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: mongoose.Schema.Types.Mixed,
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now, index: true }
});

// Auto-delete old alerts after 30 days
AlertSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

export const AlertModel = mongoose.model<IAlert>('Alert', AlertSchema);
