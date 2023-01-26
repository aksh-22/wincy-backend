import * as mongoose from 'mongoose';

export const AttachmentSchema = new mongoose.Schema({
  type: {type: String, enum: ["Attchment", "StorageLink", "Folder"]},
  attachment: String,
  storageLink: String,
  name: String,
  folder: String,
  project: {type: mongoose.Schema.Types.ObjectId, ref: 'Project'},
  createdBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
},
{
  timestamps: true,
})