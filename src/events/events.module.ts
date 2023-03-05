import { forwardRef, Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { EventSchema } from './schema/event.schema';
import { ProjectsModule } from 'src/projects/projects.module';
import { UtilsModule } from 'src/utils/utils.module';

@Module({
  imports: [
    forwardRef(() => ProjectsModule),
    MongooseModule.forFeature([{ name: 'Event', schema: EventSchema }]),
    UtilsModule,
  ],
  providers: [EventsService],
  controllers: [EventsController],
  exports: [EventsService],
})
export class EventsModule {}
