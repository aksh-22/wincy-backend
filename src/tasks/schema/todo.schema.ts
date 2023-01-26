import * as mongoose from 'mongoose';

export const TodoSchema = new mongoose.Schema({
  title: {type: String, trim: true, required: true},
  description: {type: String, trim: true},
  assignee: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  createdBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  completed: {type:Boolean, default: false},
  project: {type: mongoose.Schema.Types.ObjectId, ref: 'Project'},
  task: {type: mongoose.Schema.Types.ObjectId, ref: 'Task'}
},{
  timestamps: true,
})