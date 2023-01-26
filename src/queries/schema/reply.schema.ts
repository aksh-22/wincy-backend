import * as mongoose from 'mongoose';

export const ReplySchema = new mongoose.Schema({
  description: {type: String, required: true, trim: true},
  query: { type: mongoose.Types.ObjectId, ref: 'Query'},
  attachments: {type: [String]},
  createdBy: { type: mongoose.Types.ObjectId, ref: 'User'},
}, {
  timestamps: true,
})