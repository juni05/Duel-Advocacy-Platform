import mongoose, { Schema, Document } from 'mongoose';

export type ProgramDocument = Document & {
  programId: string;
  programName: string;
  startDate?: Date;
  endDate?: Date;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  userCount: number;
  totalEngagement: number;
  totalSales: number;
  createdAt: Date;
  updatedAt: Date;
};

const ProgramSchema = new Schema<ProgramDocument>(
  {
    programId: { type: String, required: true, unique: true, index: true },
    programName: { type: String, required: true },
    startDate: { type: Date },
    endDate: { type: Date },
    status: {
      type: String,
      enum: ['active', 'completed', 'paused', 'cancelled'],
      default: 'active',
    },
    userCount: { type: Number, default: 0, min: 0 },
    totalEngagement: { type: Number, default: 0, min: 0 },
    totalSales: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true,
    collection: 'programs',
  },
);

// Indexes for optimal query performance
ProgramSchema.index({ status: 1 });
ProgramSchema.index({ totalEngagement: -1 });
ProgramSchema.index({ totalSales: -1 });
ProgramSchema.index({ createdAt: -1 });
ProgramSchema.index({ status: 1, totalEngagement: -1 }); // Compound index for filtered queries
ProgramSchema.index({ status: 1, totalSales: -1 }); // Compound index for filtered queries

export const ProgramModel = mongoose.model<ProgramDocument>(
  'Program',
  ProgramSchema,
);
export default ProgramModel;
