import { Document, model, Schema } from 'mongoose';

export interface IOfflineSync extends Document {
  sourceId: string;
  status: 'pending' | 'running' | 'done' | 'failed';
  startedAt?: Date;
  finishedAt?: Date;
  error?: string;
}

const OfflineSyncSchema = new Schema<IOfflineSync>(
  {
    sourceId: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ['pending', 'running', 'done', 'failed'],
      default: 'pending',
    },
    startedAt: Date,
    finishedAt: Date,
    error: String,
  },
  { timestamps: true }
);

export const OfflineSync = model<IOfflineSync>('OfflineSync', OfflineSyncSchema);
