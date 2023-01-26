import * as mongoose from 'mongoose';

export const CurrencySchema = new mongoose.Schema({
  currency: {type: String, unique: true},
  usdEquivalent: {type: Number},
})