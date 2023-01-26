import * as mongoose from 'mongoose';

export const LeadActivitySchema = new mongoose.Schema({
  lead: {type: mongoose.Schema.Types.ObjectId, ref: 'Lead'},
  organisation: {type: mongoose.Schema.Types.ObjectId, ref: 'Organisation'},
  date: {type: Date},
  activity: {type: String, trim: true},
  createdBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  lastUpdatedBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
},{
  timestamps: true,
})