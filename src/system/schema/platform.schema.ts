import * as mongoose from 'mongoose';

export const PlatformSchema = new mongoose.Schema({
  platform: {type:String, unique: true},
  color: {type:String, unique: true}
})