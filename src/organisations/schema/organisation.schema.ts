import * as mongoose from 'mongoose';

export const OrganisationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    projects: [{type: mongoose.Schema.Types.ObjectId, ref:'Project'}],
    users: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
  },{
    timestamps: true,
  }
)