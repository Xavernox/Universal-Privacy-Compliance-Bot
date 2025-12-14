import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IGeneratedPolicy extends Document {
  userId: mongoose.Types.ObjectId;
  scanId: mongoose.Types.ObjectId;
  framework: 'gdpr' | 'ccpa';
  markdown: string;
  html: string;
  complianceScore: number;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const GeneratedPolicySchema = new Schema<IGeneratedPolicy>(
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
      required: true,
      index: true,
    },
    framework: {
      type: String,
      enum: ['gdpr', 'ccpa'],
      required: true,
      index: true,
    },
    markdown: {
      type: String,
      required: true,
    },
    html: {
      type: String,
      required: true,
    },
    complianceScore: {
      type: Number,
      required: true,
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

GeneratedPolicySchema.index({ userId: 1, createdAt: -1 });
GeneratedPolicySchema.index({ userId: 1, scanId: 1, framework: 1 });

const GeneratedPolicy: Model<IGeneratedPolicy> =
  mongoose.models.GeneratedPolicy ||
  mongoose.model<IGeneratedPolicy>('GeneratedPolicy', GeneratedPolicySchema);

export default GeneratedPolicy;
