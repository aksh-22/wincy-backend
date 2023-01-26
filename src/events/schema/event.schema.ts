import * as mongoose from 'mongoose';

export const EventSchema = new mongoose.Schema({
  type: {type: String, enum: ["Private", "Public"]},
  category: {type: String, enum: ["Milestone", "Event", "Holiday", "Meeting"]},
  title: {type: String, trim: true},
  description: {type: String, trim: true},
  date: Date,
  isRange: {type: Boolean, default: false},
  dateFrom: Date,
  dateTo: Date,
  organisation: {type: mongoose.Schema.Types.ObjectId, ref: 'Organisation'},
  project: {type: mongoose.Schema.Types.ObjectId, ref: 'Project'},
  milestone: {type: mongoose.Schema.Types.ObjectId, ref: 'Milestone'},
  users: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
  createdBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  lastUpdatedBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User'}
},{
  timestamps: true,
})