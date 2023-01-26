import * as mongoose from 'mongoose';

export const TaskSortSchema = new mongoose.Schema({
  task: {type: mongoose.Schema.Types.ObjectId, ref: 'Task'},
  sequence: Number,
})