import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IScan extends Document {
  userId: mongoose.Types.ObjectId;
  scanType: 'full' | 'incremental' | 'targeted';
  status: 'pending' | 'running' | 'completed' | 'failed';
  cloudProvider: 'aws' | 'azure' | 'gcp' | 'multi';
  region?: string;
  resourcesScanned: number;
  issuesFound: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
  errorMessage?: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const ScanSchema = new Schema<IScan>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    scanType: {
      type: String,
      enum: ['full', 'incremental', 'targeted'],
      default: 'full',
    },
    status: {
      type: String,
      enum: ['pending', 'running', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    cloudProvider: {
      type: String,
      enum: ['aws', 'azure', 'gcp', 'multi'],
      required: true,
    },
    region: {
      type: String,
    },
    resourcesScanned: {
      type: Number,
      default: 0,
    },
    issuesFound: {
      type: Number,
      default: 0,
    },
    criticalIssues: {
      type: Number,
      default: 0,
    },
    highIssues: {
      type: Number,
      default: 0,
    },
    mediumIssues: {
      type: Number,
      default: 0,
    },
    lowIssues: {
      type: Number,
      default: 0,
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    duration: {
      type: Number,
    },
    errorMessage: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

ScanSchema.index({ userId: 1, createdAt: -1 });
ScanSchema.index({ status: 1, createdAt: -1 });

const Scan: Model<IScan> = mongoose.models.Scan || mongoose.model<IScan>('Scan', ScanSchema);

export default Scan;
