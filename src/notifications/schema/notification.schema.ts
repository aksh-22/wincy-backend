import * as mongoose from 'mongoose';

export const UserStatusSchema = new mongoose.Schema({
  user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  isRead: {type: Boolean, default: false},
})

export const NotificationSchema = new mongoose.Schema({
  userStatus: [{type: UserStatusSchema, default: undefined}],
  // users: [{type: mongoose.Types.ObjectId, ref: 'User'}],
  description: {type: String},
  module: {type: String, enum: ["Project", "Milestone", "Task", "Bug", "Query"]},
  organisation: {type: mongoose.Types.ObjectId, ref: 'Organisation'},
  project: {type: mongoose.Types.ObjectId, ref: 'Project'},
  milestone: {type: mongoose.Types.ObjectId, ref: 'Milestone'},
  accessLevel: {type: String, enum: ["Admin", "Member++", "Member+", "Member"]},
  meta: Object,
},{
  timestamps: true,
})