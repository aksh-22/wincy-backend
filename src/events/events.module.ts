import { forwardRef, Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { EventSchema } from './schema/event.schema';
import { ProjectsModule } from 'src/projects/projects.module';

@Module({
  imports: [forwardRef(() =>ProjectsModule), MongooseModule.forFeature([{name: 'Event', schema: EventSchema}])],
  providers: [EventsService],
  controllers: [EventsController],
  exports: [EventsService],
})
export class EventsModule {}
