import * as mongoose from 'mongoose';

export const TransactionSchema = new mongoose.Schema({
  date: {type: Date, required: true},
  gateway : {type: String, required: true},
  gatewayFees: {type: String}, // encrypted
  description: {type: String, trim: true}, //encrypted
  gatewayTransactionId: {type: String, unique: true, required: true}, //encrypted
  invoice: {type: mongoose.Types.ObjectId, ref: 'Invoice'},
  project: {type: mongoose.Types.ObjectId, ref: 'Project'},
  organisation: {type: mongoose.Types.ObjectId, ref: 'Organisation'},
  currency: {type: String, required: true}, //encrypted
  localCurrency: {type: String}, //encrypted
  localEquivalentAmount: {type: String}, //encrypted
  amount: {type: String, required: true}, // encrypted
  createdBy: {type: mongoose.Types.ObjectId, ref: 'User'},
  lastUpdatedBy: {type: mongoose.Types.ObjectId, ref: 'User'},
  attachments: [String],
}, {
  timestamps: true,
})