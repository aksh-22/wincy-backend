import * as mongoose from 'mongoose';

export const PasswordResetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  passCode: { type: String, required: true},
  createdAt: Date,
});

PasswordResetSchema.index({ userId: 1 });