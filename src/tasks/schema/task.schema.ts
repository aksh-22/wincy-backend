import * as mongoose from 'mongoose';

export const Sub_TaskSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
    trim: true,
  },
  completed: { type: Boolean, default: false },
  priority: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'Medium',
  },
});

export const TimeSchema = new mongoose.Schema({
  date: String,
  //hours
  consumedTime: Number,
});

export const AssigneeStatusSchema = new mongoose.Schema(
  {
    assignee: { type: mongoose.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: ['Completed', 'NotStarted', 'Active', 'OnHold'],
      default: 'NotStarted',
    },
  },
  {
    timestamps: true,
  },
);

export const TaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: {
        text: true,
      },
    },
    description: {
      type: String,
      trim: true,
      index: {
        text: true,
      },
    },
    dueDate: Date,
    platforms: [String],
    status: {
      type: String,
      enum: [
        'Completed',
        'NotStarted',
        'Active',
        'OnHold',
        'WaitingForReview',
        'UnderReview',
        'ReviewFailed',
      ],
      default: 'NotStarted',
    },
    assigneesStatus: [{ type: AssigneeStatusSchema, default: undefined }],
    // priority: {type: String, enum: ["High", "Medium", "Low"], default: "Medium"},
    subTasks: [{ type: Sub_TaskSchema, default: undefined }],
    consumedTime: { type: Number, default: 0 },
    completedOn: Date,
    timeLedger: [{ type: TimeSchema, default: undefined }],
    assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    milestone: { type: mongoose.Schema.Types.ObjectId, ref: 'Milestone' },
    module: { type: mongoose.Schema.Types.ObjectId, ref: 'Module' },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    statusUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
    childTasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
    Eod: [{ type: mongoose.Schema.Types.ObjectId, ref: 'EOD' }],
    // mainParent: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
    onHoldReason: { type: String, trim: true },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      select: false,
    },
    attachments: { type: [String] },
    descriptionUpdatedAt :{type:Date},
  },
  {
    timestamps: true,
  },
);
