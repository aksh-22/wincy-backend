import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { BuildDataModel } from './buildData.schema';

export type BuildSubmissionDocument = BuildSubmissionModel & Document;

@Schema({ _id: false })
class TaskDataModel {
  @Prop({
    type: mongoose.Types.ObjectId,
    ref: 'tasks',
    default: '',
  })
  taskId: mongoose.Types.ObjectId;

  @Prop({ default: '' })
  description: string;

  @Prop({ type: Boolean, default: false })
  isCompleted: boolean;
}

const TaskSchema = SchemaFactory.createForClass(TaskDataModel);

@Schema({ timestamps: true })
export class BuildSubmissionModel {
  @Prop({
    type: mongoose.Types.ObjectId,
    ref: 'User',
  })
  submittedBy: mongoose.Types.ObjectId;

  @Prop({ default: '', type: String })
  link: string;

  @Prop({ default: '', type: String })
  description: string;

  @Prop({ type: Number })
  submittedAt: number;

  @Prop({ type: Number })
  updatedAt: number;

  @Prop({
    type: [{ type: TaskSchema, default: [] }],
  })
  taskData: (typeof TaskSchema)[];

  @Prop({
    type: mongoose.Types.ObjectId,
    ref: 'builddatamodels',
  })
  buildDataId: mongoose.Types.ObjectId;
}

export const BuildSubmissionModelSchema =
  SchemaFactory.createForClass(BuildSubmissionModel);
