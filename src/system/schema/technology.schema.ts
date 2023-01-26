import * as mongoose from 'mongoose';

export const TechnologySchema = new mongoose.Schema({
  technology: {type:String, unique: true},
  color: {type:String, unique: true}
})