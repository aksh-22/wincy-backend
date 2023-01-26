import * as mongoose from 'mongoose';

export const ModuleSortSchema = new mongoose.Schema({
  module: {type: mongoose.Schema.Types.ObjectId, ref: 'Module'},
  sequence: Number,
})