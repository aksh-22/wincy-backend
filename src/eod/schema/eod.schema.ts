import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { now, Document, SchemaTypes, Types } from 'mongoose';

export type EodDocument = Eod & Document;

@Schema({ timestamps: true })
export class Eod {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Project' })
  project: Types.ObjectId;

  @Prop()
  description: string;

  @Prop()
  screenName: string;

  @Prop({ type: Object })
  duration: {
    hour: number;
    min: number;
  };

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;

  @Prop({ default: now() })
  createdAt: Date;

  @Prop({ default: now() })
  updatedAt: Date;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User' })
  updatedBy: Types.ObjectId;

  @Prop()
  lastUpdated: Date;
}

export const EodSchema = SchemaFactory.createForClass(Eod);
