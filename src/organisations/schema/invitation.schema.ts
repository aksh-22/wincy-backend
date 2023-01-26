import * as mongoose from 'mongoose';

export const InvitationSchema = new mongoose.Schema({
  sentTo: {type:String, trim: true},
  sentBy: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
  organisation: {type: mongoose.Schema.Types.ObjectId, ref: "Organisation"},
  userType: {type: String, enum: ["Member++", "Member+", "Member"]},
  designation: String,
},{
  timestamps: true,
})