import * as mongoose from 'mongoose';

export const AccountSchema = new mongoose.Schema({
  accountName: {type: String, required: true},
  accountNumber: {type: String, required: true},
  ifscCode: {type: String, required: true},
  swiftCode: String,
  micrCode: String,
  createdBy: {type: mongoose.Types.ObjectId, ref: 'User'},
  subsiduary: {type: mongoose.Types.ObjectId, ref: 'Subsiduary'},
  organisation: {type: mongoose.Types.ObjectId, ref: 'Organisation'},
},
{
  timestamps:true
})