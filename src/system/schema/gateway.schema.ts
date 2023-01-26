import * as mongoose from 'mongoose'
import { ApiProperty } from "@nestjs/swagger";

export const GatewaySchema = new mongoose.Schema({
  displayName: {type: String, unique: true},
  uniqueName: String
}, {
  timestamps: true,
})