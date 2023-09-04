import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Eod, EodSchema } from './schema/eod.schema';
import { EodController } from './eod.controller';
import { EodService } from './eod.service';
import { UserSchema } from 'src/users/schema/user.schema';
import { ProjectSchema } from 'src/projects/schema/project.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Eod.name, schema: EodSchema },
      { name: 'User', schema: UserSchema },
      { name: 'Project', schema: ProjectSchema },
    ]),
  ],
  controllers: [EodController],
  providers: [EodService],
  exports: [EodService],
})
export class EodModule {}
