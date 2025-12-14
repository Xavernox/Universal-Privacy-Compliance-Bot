import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IAlert extends Document {
  userId: mongoose.Types.ObjectId;
  scanId?: mongoose.Types.ObjectId;
  policyId?: mongoose.Types.ObjectId;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  status: 'open' | 'acknowledged' | 'resolved' | 'false_positive';
  resourceType: string;
  resourceId: string;
  cloudProvider: 'aws' | 'azure' | 'gcp';
  region?: string;
  affectedResources: string[];
  recommendedActions: string[];
  acknowledgedBy?: mongoose.Types.ObjectId;
  acknowledgedAt?: Date;
  resolvedBy?: mongoose.Types.ObjectId;
  resolvedAt?: Date;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const AlertSchema = new Schema<IAlert>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    scanId: {
      type: Schema.Types.ObjectId,
      ref: 'Scan',
    },
    policyId: {
      type: Schema.Types.ObjectId,
      ref: 'Policy',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    severity: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low', 'info'],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['open', 'acknowledged', 'resolved', 'false_positive'],
      default: 'open',
      index: true,
    },
    resourceType: {
      type: String,
      required: true,
    },
    resourceId: {
      type: String,
      required: true,
      index: true,
    },
    cloudProvider: {
      type: String,
      enum: ['aws', 'azure', 'gcp'],
      required: true,
    },
    region: {
      type: String,
    },
    affectedResources: [
      {
        type: String,
      },
    ],
    recommendedActions: [
      {
        type: String,
      },
    ],
    acknowledgedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    acknowledgedAt: {
      type: Date,
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: {
      type: Date,
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

AlertSchema.index({ userId: 1, status: 1, severity: 1 });
AlertSchema.index({ status: 1, createdAt: -1 });

const Alert: Model<IAlert> = mongoose.models.Alert || mongoose.model<IAlert>('Alert', AlertSchema);

export default Alert;
