import mongoose, { Schema, Document } from 'mongoose';

export interface IPressureScore extends Document {
  symbol: string;
  score: number;
  components: {
    priceVolumeScore: number;
    futuresScore: number;
    whaleActivityScore: number;
    sentimentScore: number;
    volatilityScore: number;
  };
  signals: string[];
  btcDominance?: number;
  timestamp: Date;
}

const PressureScoreSchema = new Schema<IPressureScore>({
  symbol: { type: String, required: true, index: true },
  score: { type: Number, required: true },
  components: {
    priceVolumeScore: Number,
    futuresScore: Number,
    whaleActivityScore: Number,
    sentimentScore: Number,
    volatilityScore: Number
  },
  signals: [String],
  btcDominance: Number,
  timestamp: { type: Date, default: Date.now, index: true }
});

// Auto-delete old records after 7 days
PressureScoreSchema.index({ timestamp: 1 }, { expireAfterSeconds: 604800 });

export const PressureScoreModel = mongoose.model<IPressureScore>('PressureScore', PressureScoreSchema);
