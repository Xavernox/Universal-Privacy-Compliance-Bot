import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IWhitelist extends Document {
  userId: mongoose.Types.ObjectId;
  resourceType: string;
  resourceId: string;
  cloudProvider: 'aws' | 'azure' | 'gcp';
  region?: string;
  reason: string;
  policyIds: mongoose.Types.ObjectId[];
  isActive: boolean;
  expiresAt?: Date;
  addedBy: mongoose.Types.ObjectId;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const WhitelistSchema = new Schema<IWhitelist>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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
    reason: {
      type: String,
      required: true,
    },
    policyIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Policy',
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    expiresAt: {
      type: Date,
    },
    addedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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

WhitelistSchema.index({ resourceId: 1, isActive: 1 });
WhitelistSchema.index({ userId: 1, isActive: 1 });
WhitelistSchema.index({ expiresAt: 1 }, { sparse: true });

const Whitelist: Model<IWhitelist> =
  mongoose.models.Whitelist || mongoose.model<IWhitelist>('Whitelist', WhitelistSchema);

export default Whitelist;
