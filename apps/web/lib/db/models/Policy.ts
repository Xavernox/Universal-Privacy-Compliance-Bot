import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IPolicy extends Document {
  name: string;
  description: string;
  cloudProvider: 'aws' | 'azure' | 'gcp' | 'multi';
  category: 'security' | 'compliance' | 'cost' | 'performance' | 'reliability';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  isActive: boolean;
  isCustom: boolean;
  rules: Array<{
    id: string;
    name: string;
    condition: string;
    action: string;
    parameters?: Record<string, any>;
  }>;
  complianceFrameworks: string[];
  remediationSteps?: string;
  automatedRemediation: boolean;
  userId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PolicySchema = new Schema<IPolicy>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    cloudProvider: {
      type: String,
      enum: ['aws', 'azure', 'gcp', 'multi'],
      required: true,
    },
    category: {
      type: String,
      enum: ['security', 'compliance', 'cost', 'performance', 'reliability'],
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low', 'info'],
      required: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isCustom: {
      type: Boolean,
      default: false,
    },
    rules: [
      {
        id: {
          type: String,
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        condition: {
          type: String,
          required: true,
        },
        action: {
          type: String,
          required: true,
        },
        parameters: {
          type: Schema.Types.Mixed,
        },
      },
    ],
    complianceFrameworks: [
      {
        type: String,
      },
    ],
    remediationSteps: {
      type: String,
    },
    automatedRemediation: {
      type: Boolean,
      default: false,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

PolicySchema.index({ cloudProvider: 1, category: 1, isActive: 1 });
PolicySchema.index({ userId: 1, isCustom: 1 });

const Policy: Model<IPolicy> =
  mongoose.models.Policy || mongoose.model<IPolicy>('Policy', PolicySchema);

export default Policy;
