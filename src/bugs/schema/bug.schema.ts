import * as mongoose from 'mongoose';

export const CommentSchema = new mongoose.Schema({
  text: { type: String, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date },
});

export const BugSchema = new mongoose.Schema(
  {
    sNo: Number,
    title: {
      type: String,
      required: true,
      index: {
        text: true,
      },
    },
    description: {
      type: String,
      index: { text: true },
    },
    attachments: [String],
    driveUrls: [String],
    priority: {
      type: String,
      enum: ['High', 'Medium', 'Low'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Open', 'InProgress', 'InReview', 'Done', 'BugPersists'],
      default: 'Open',
    },
    comments: [{ type: CommentSchema, default: undefined }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    completedOn: Date,
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
    platform: String,
    section: String,
    reOpenCount: { type: Number, default: 0 },
    failedReviewCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  },
);
