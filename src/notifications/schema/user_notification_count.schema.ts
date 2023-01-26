import * as mongoose from 'mongoose';

export const UserNotificationCountSchema = new mongoose.Schema({
  user: {type: mongoose.Types.ObjectId, ref: 'User'},
  count: {type: Number, default: 0},
  organisation: {type: mongoose.Types.ObjectId, ref: 'Organisation'},
})