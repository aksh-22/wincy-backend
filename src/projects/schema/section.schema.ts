import * as mongoose from 'mongoose';

export const SectionSchema = new mongoose.Schema({
  sections: [String],
  platform: {type: mongoose.Schema.Types.ObjectId, ref: 'Platform'},
  project: {type: mongoose.Schema.Types.ObjectId, ref: 'Project'},
  lastUpdatedBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
},{
  timestamps: true,
})