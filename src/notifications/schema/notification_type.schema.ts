import * as mongoose from 'mongoose';

export const NotificationTypeSchema = new mongoose.Schema({
  type: {type: String, required: true},
},{
  timestamps: true,
})