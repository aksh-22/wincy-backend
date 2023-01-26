import * as mongoose from 'mongoose';

export const PendingInvoiceSchema = new mongoose.Schema({
  paymentPhase: {type: mongoose.Types.ObjectId, ref: 'PaymentPhase'},
  project: {type: mongoose.Types.ObjectId, ref: 'Project'},
  organisation: {type: mongoose.Types.ObjectId, ref: 'Organisation'},
}, {
  timestamps: true,
})