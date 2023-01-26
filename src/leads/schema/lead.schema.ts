import * as mongoose from 'mongoose';

export const LeadSchema = new mongoose.Schema({
  name: String,
  email: String,
  country: String,
  contactNumber: String,
  reference: String,
  platforms: [String],
  description: String,
  budgetExpectation: String,
  currency: String,
  budgetProposed: String,
  proposalLink: String,
  durationExpectation: Number, // Number of days
  durationProposed: Number, // Number of days
  dateContactedFirst: Date,
  nextFollowUp: Date,
  status: {type: String, enum:["Active", "Idle", "Awarded", "Rejected"], default: "Active"},
  organisation: {type: mongoose.Schema.Types.ObjectId, ref: 'Organisation'},
  createdBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  lastUpdatedBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  isFavourite: {type: Boolean, default: false},
  leadName: {type: String},
  settledFor: {type: String},
  domain: {type: String},
  managedBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User'}
},{
  timestamps: true,
})