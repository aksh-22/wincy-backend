import * as mongoose from 'mongoose';

export const BugReportSchema = new mongoose.Schema({
  createdBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  bugs: [{type: mongoose.Schema.Types.ObjectId, ref: 'Bug'}],
  date: Date,
  consumedTime: {type: Number, default: 0, required: true},
  project: {type: mongoose.Schema.Types.ObjectId, ref: 'Project'},
});