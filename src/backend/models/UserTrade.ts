import mongoose, { Schema, Document } from 'mongoose';

export interface IUserTrade extends Document {
  userId: string;
  symbol: string;
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  side: 'long' | 'short';
  leverage?: number;
  entryTime: Date;
  exitTime?: Date;
  profitLoss?: number;
  profitLossPercent?: number;
  status: 'open' | 'closed';
  riskRewardRatio?: number;
  tags?: string[];
  notes?: string;
  createdAt: Date;
}

const UserTradeSchema = new Schema<IUserTrade>({
  userId: { type: String, required: true, index: true },
  symbol: { type: String, required: true, index: true },
  entryPrice: { type: Number, required: true },
  exitPrice: { type: Number },
  quantity: { type: Number, required: true },
  side: { type: String, enum: ['long', 'short'], required: true },
  leverage: { type: Number, default: 1 },
  entryTime: { type: Date, required: true },
  exitTime: { type: Date },
  profitLoss: { type: Number },
  profitLossPercent: { type: Number },
  status: { type: String, enum: ['open', 'closed'], required: true, default: 'open' },
  riskRewardRatio: { type: Number },
  tags: [String],
  notes: String,
  createdAt: { type: Date, default: Date.now }
});

export const UserTradeModel = mongoose.model<IUserTrade>('UserTrade', UserTradeSchema);
