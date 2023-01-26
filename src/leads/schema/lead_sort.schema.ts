import * as mongoose from 'mongoose';

export const LeadSortSchema = new mongoose.Schema({
  lead: {type: mongoose.Schema.Types.ObjectId, ref: 'Lead'},
  sequence: Number,
})