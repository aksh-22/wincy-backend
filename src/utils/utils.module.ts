import { Module } from '@nestjs/common';
import { ActivitiesModule } from 'src/activities/activities.module';
import { UtilsService } from './utils.service';

@Module({
  imports: [ActivitiesModule],
  providers: [UtilsService],
  exports: [UtilsService],
})
export class UtilsModule {}
