import * as mongoose from 'mongoose';
export const Milestone_AmountSchema = new mongoose.Schema({
  amount: String,
  isSettled: {type: Boolean, default: false},
  settledOn: Date,
  paymentMode: String,
  currency: String,
},{
  timestamps: true,
})

export const MilestoneSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    index: {
      text: true
    }
  },
  description: {
    type: String,
    trim: true,
    index: {
      text: true
    }
  },
  dueDate: Date,
  project: {type: mongoose.Schema.Types.ObjectId, ref: 'Project'},
  tasks: [{type: mongoose.Schema.Types.ObjectId, ref: 'Task'}],
  createdBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  status: {type: String, enum: ["NotStarted", "Active", "Completed"], default: "NotStarted"},
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
  },
  paymentInfo: {type: Milestone_AmountSchema, default: undefined, select: false},
  consumedTime: {type: Number, default: 0},
  completedOn: Date,
},{
  timestamps: true,
});