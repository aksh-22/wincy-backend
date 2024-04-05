import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { now, Document, SchemaTypes, Types } from 'mongoose';

export type SalaryDocument = Salary & Document;

@Schema({ timestamps: true })
export class Salary {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop()
  startDate: number;

  @Prop()
  endDate: number;

  @Prop()
  salary: number;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;
}

export const SalarySchema = SchemaFactory.createForClass(Salary);
