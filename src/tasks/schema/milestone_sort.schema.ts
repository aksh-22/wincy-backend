import * as mongoose from 'mongoose';

export const MilestoneSortSchema = new mongoose.Schema({
  milestone: {type: mongoose.Schema.Types.ObjectId, ref: 'Milestone'},
  sequence: Number,
})