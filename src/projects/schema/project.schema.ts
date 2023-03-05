import * as mongoose from 'mongoose';
import { Project_Type, Project_Type_Array } from '../enum/project.enum';
export const Project_AmountSchema = new mongoose.Schema(
  {
    amount: String,
    paymentMode: String,
    currency: String,
    note: String,
  },
  {
    timestamps: true,
  },
);

export const Client_DataSchema = new mongoose.Schema({
  name: String,
  country: String,
  email: String,
});

export const CredentialSchema = new mongoose.Schema({
  platform: String,
  username: String,
  password: String,
  key: String,
});

export const ProjectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: String,
    logo: String,
    platforms: [String],
    attachments: [String],
    milestones: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Milestone' }],
    projectManagers: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] },
    ],
    team: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    organisation: { type: mongoose.Schema.Types.ObjectId, ref: 'Organisation' },
    technologies: [String],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      select: false,
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      select: false,
    },
    status: {
      type: String,
      enum: ['Completed', 'OnHold', 'Active'],
      default: 'Active',
    },
    paymentInfo: {
      type: Project_AmountSchema,
      default: undefined,
      select: false,
    },
    awardedAt: Date,
    startedAt: Date,
    completedAt: Date,
    dueDate: Date,
    expectedDuration: { type: Number, select: false },
    credentials: [
      { type: CredentialSchema, default: undefined, select: false },
    ],
    clientData: { type: Client_DataSchema, default: undefined, select: false },
    consumedTime: { type: Number, default: 0 },
    onHoldReason: { type: String, trim: true },
    projectType: {
      type: String,
      enum: Project_Type_Array,
      default: Project_Type.DEVELOPMENT,
    },
  },
  {
    timestamps: true,
  },
);
