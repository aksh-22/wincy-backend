import * as mongoose from 'mongoose';

export const CustomerSchema = new mongoose.Schema(
  {
    fullName: { type: String, trim: true, required: true },
    email: { type: String },
    address: { type: String, trim: true },
    createdBy: { type: mongoose.Types.ObjectId, ref: 'User' },
    organisation: { type: mongoose.Types.ObjectId, ref: 'Organisation' },
    projects: [{ type: mongoose.Types.ObjectId, ref: 'Project' }],
    phoneNumber: { type: String },
    country: { type: String },
  },
  {
    timestamps: true,
  },
);
