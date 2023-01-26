import * as mongoose from 'mongoose';

export const ActivitySchema = new mongoose.Schema({
  type: {type: String, enum: ["Bug", "Task", "To-do", "Module", "Milestone", "Project", "Query", "Query-Response"]},
  operation: {type: String, enum: ["Create", "Delete", "Update", "Move"]},
  field: String,
  from: String,
  to: String,
  description: {type: String, trim: true},
  query: {type: mongoose.Schema.Types.ObjectId, ref: 'Query'},
  queryResponse: {type: mongoose.Schema.Types.ObjectId, ref: 'Discussion'},
  bug: {type: mongoose.Schema.Types.ObjectId, ref: 'Bug'},
  task: {type: mongoose.Schema.Types.ObjectId, ref: 'Task'},
  todo: {type: mongoose.Schema.Types.ObjectId, ref: 'Todo'},
  milestone: {type: mongoose.Schema.Types.ObjectId, ref: 'Milestone'},
  project: {type: mongoose.Schema.Types.ObjectId, ref: 'Project'},
  module: {type: mongoose.Schema.Types.ObjectId, ref: 'Module'},
  createdBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  meta: Object,
  assignee: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
},{
  timestamps:  true,
})
