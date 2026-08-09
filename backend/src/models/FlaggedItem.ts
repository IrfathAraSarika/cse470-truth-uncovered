import { Document, model, Schema } from 'mongoose';

export interface IFlaggedItem extends Document {
  contentId?: string;
  authorId?: string;
  text: string;
  reason?: string;
  createdAt: Date;
  status: 'pending' | 'verified' | 'rejected';
  adminNote?: string;
  duplicateMatches: { id: string; score: number; excerpt?: string }[];
  fraudSignals: string[];
  reporterIp?: string;
}

const FlaggedItemSchema = new Schema<IFlaggedItem>({
  contentId: { type: String },
  authorId: { type: String },
  text: { type: String, required: true },
  reason: { type: String },
  createdAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
  adminNote: { type: String },
  duplicateMatches: [{ id: String, score: Number, excerpt: String }],
  fraudSignals: [String],
  reporterIp: String,
});

export const FlaggedItem = model<IFlaggedItem>('FlaggedItem', FlaggedItemSchema);
