import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BuildController } from './buildData.controller';
import { BuildService } from './buildData.service';
import { BuildDataModel, BuildDataSchema } from './schema/buildData.schema';
import {
  BuildSubmissionModel,
  BuildSubmissionModelSchema,
} from './schema/buildSubmission.schema';
import { TasksModule } from 'src/tasks/tasks.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BuildDataModel.name, schema: BuildDataSchema },
      {
        name: 'buildsubmission',
        schema: BuildSubmissionModelSchema,
      },
    ]),
    TasksModule,
  ],
  controllers: [BuildController],
  providers: [BuildService],
  exports: [BuildService],
})
export class BuildDataModule {}
