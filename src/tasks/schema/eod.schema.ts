import * as mongoose from 'mongoose';

export const EodSchema = new mongoose.Schema(
  {
    description: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  },
  {
    timestamps: true,
  },
);
