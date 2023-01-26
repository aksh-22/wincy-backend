import * as mongoose from 'mongoose';

export const SubsiduarySchema = new mongoose.Schema({
  title: String,
  address: {type: String, trim: true},
  gstNo: {type: String},
  additionalInfo: {type: String, trim: true},
  accounts: [{type: mongoose.Types.ObjectId, ref: 'Account'}],
  createdBy: {type: mongoose.Types.ObjectId, ref: 'User'},
  organisation: {type: mongoose.Types.ObjectId, ref: 'Organisation'},
}, {
  timestamps: true,
})