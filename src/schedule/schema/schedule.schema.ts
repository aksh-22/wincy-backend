import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { now, Document, SchemaTypes, Types } from 'mongoose';
import { Status } from '../dto/createSchedule.dto';

export type ScheduleDocument = Schedule & Document;

@Schema({ timestamps: true })
export class Schedule {
  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  reason: string;

  @Prop({ enum: Status, default: Status.PENDING })
  status: Status;

  @Prop()
  time: string;

  @Prop({ type: Object })
  duration: {
    hour: number;
    min: number;
  };

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User' })
  requestedBy: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User' })
  authorizedBy: Types.ObjectId;

  @Prop({ default: now() })
  createdAt: Date;

  @Prop({ default: now() })
  updatedAt: Date;
}

export const ScheduleSchema = SchemaFactory.createForClass(Schedule);
