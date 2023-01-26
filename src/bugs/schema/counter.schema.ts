import * as mongoose from 'mongoose';

export const CounterSchema = new mongoose.Schema({
  sequence: {type: Number, default: 1},
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', unique: true},
});