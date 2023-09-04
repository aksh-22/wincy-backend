import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { INVOICE_STATUS } from '../enum/status.enum';
import { PaymentScheduleModel } from 'src/payment-schedule/schema/paymentSchedule.schema';

export type InvoiceDocument = InvoiceModel & Document;

@Schema({ timestamps: true })
export class InvoiceModel {
  @Prop({ required: true, unique: true })
  invoiceNumber: string;

  @Prop({
    type: String,
    required: true,
    enum: INVOICE_STATUS,
    default: INVOICE_STATUS.UNPAID,
  })
  status: string;

  @Prop({ required: true })
  amount: string;

  @Prop({ type: Date })
  paidAt: Date;

  @Prop({ type: Date })
  dueDate: Date;

  @Prop({ type: Date, default: new Date() })
  invoicedAt: Date;

  @Prop({ default: false, select: false })
  isDeleted: boolean;

  @Prop()
  description: string;

  @Prop({ default: false })
  isRestricted: boolean;

  @Prop()
  otherAmount: [{ name: string; amount: number }];

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Customer' })
  customer: mongoose.Types.ObjectId;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId }],
    ref: PaymentScheduleModel.name,
    required: true,
  })
  paymentSchedule: mongoose.Types.ObjectId[];

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

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subsiduary',
    required: true,
  })
  subsiduary: mongoose.Types.ObjectId;
}

export const InvoiceSchema = SchemaFactory.createForClass(InvoiceModel);
