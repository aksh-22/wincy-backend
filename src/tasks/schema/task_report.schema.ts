import * as mongoose from 'mongoose';

export const TaskReportSchema = new mongoose.Schema({
  createdBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  tasks: [{type: mongoose.Schema.Types.ObjectId, ref: 'Task'}],
  date: Date,
  consumedTime: {type: Number, default: 0, required: true},
  project: {type: mongoose.Schema.Types.ObjectId, ref: 'Project'},
});