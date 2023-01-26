import * as mongoose from 'mongoose';

export const ModuleSchema = new mongoose.Schema({
  module: {type: String ,     
    index: {
      text: true
    }
  },
  milestone: {type: mongoose.Schema.Types.ObjectId, ref: 'Milestone'},
  project: {type: mongoose.Schema.Types.ObjectId, ref: 'Project'},
  lastUpdatedBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  createdBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User'}
},{
  timestamps: true,
})