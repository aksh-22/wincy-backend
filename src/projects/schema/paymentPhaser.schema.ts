import * as mongoose from 'mongoose';

export const MilestoneStatusSchema = new mongoose.Schema({
  milestone: { type: mongoose.Types.ObjectId, ref: 'Milestone' },
  isCompleted: { type: Boolean, default: false },
});

export const PaymentPhaseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, trim: true },
    currency: { type: String },
    amount: { type: String },
    project: { type: mongoose.Types.ObjectId, ref: 'Project' },
    organisation: { type: mongoose.Types.ObjectId, ref: 'Organisation' },
    createdBy: { type: mongoose.Types.ObjectId, ref: 'User' },
    milestones: [{ type: mongoose.Types.ObjectId, ref: 'Milestone' }],
    milestoneStatus: [{ type: MilestoneStatusSchema, default: undefined }],
    status: {
      type: String,
      enum: ['Pending', 'Invoiced', 'Partially Invoiced'],
      default: 'Pending',
    },
    dueAmount: { type: String },
    restricted: { type: Boolean, required: true, default: false },
  },
  {
    timestamps: true,
  },
);
