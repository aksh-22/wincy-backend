import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { PAYMENT_SCHEDULE_STATUS } from '../paymentSchedule.enum';
import * as mongoose from 'mongoose';

export type PaymentScheduleDocument = PaymentScheduleModel & Document;

@Schema({ timestamps: true })
export class PaymentScheduleModel {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  amount: string;

  @Prop({ required: true })
  initialAmount: string;

  @Prop({ default: false })
  isRestricted: boolean;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop()
  description: string;

  @Prop({ type: Date })
  dueDate: Date;

  @Prop({
    type: String,
    required: true,
    enum: PAYMENT_SCHEDULE_STATUS,
    default: PAYMENT_SCHEDULE_STATUS.PENDING,
  })
  status: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organisation',
    required: true,
  })
  organisation: mongoose.Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  createBy: mongoose.Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  })
  projectId: mongoose.Types.ObjectId;
}

export const PaymentScheduleSchema = SchemaFactory.createForClass(
  PaymentScheduleModel,
);
