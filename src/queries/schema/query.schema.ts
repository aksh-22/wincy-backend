import * as mongoose from 'mongoose';

export const QuerySchema = new mongoose.Schema({
  title: {type: String, required: true, trim: true},
  description: {type: String, trim: true},
  attachments: {type: [String]},
  status: {type: String, enum: ["Open", "Close"], default: "Open"},
  createdBy: { type: mongoose.Types.ObjectId, ref: 'User'},
  project: { type: mongoose.Types.ObjectId, ref: 'Project'},
}, {
  timestamps: true,
})