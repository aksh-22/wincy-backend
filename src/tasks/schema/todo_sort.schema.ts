import * as mongoose from 'mongoose';

export const TodoSortSchema = new mongoose.Schema({
  todo: {type: mongoose.Schema.Types.ObjectId, ref: 'Todo', unique: true},
  sequence: Number,
})