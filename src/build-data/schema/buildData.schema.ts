import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { BuildSubmissionModel } from './buildSubmission.schema';

export type BuildDataDocument = BuildDataModel & Document;

@Schema({ timestamps: true })
export class BuildDataModel {
  @Prop({ type: Number })
  submittedToBe: number;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'tasks' }],
    default: [],
  })
  taskIds: mongoose.Types.ObjectId[];

  @Prop({ required: true, type: String })
  title: string;

  @Prop({
    type: [
      { type: mongoose.Schema.Types.ObjectId, ref: BuildSubmissionModel.name },
    ],
    default: [],
  })
  submittedData: mongoose.Types.ObjectId[];

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  })
  projectId: mongoose.Types.ObjectId;

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
  createdBy: mongoose.Types.ObjectId;

  @Prop({
    type: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ],
  })
  assignedTo: mongoose.Types.ObjectId[];
}

export const BuildDataSchema = SchemaFactory.createForClass(BuildDataModel);
