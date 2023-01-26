import { Module } from '@nestjs/common';
import { QueriesService } from './queries.service';
import { QueriesController } from './queries.controller';
import { Mongoose } from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose';
import { QuerySchema } from './schema/query.schema';
import { ReplySchema } from './schema/reply.schema';
import { UtilsModule } from 'src/utils/utils.module';
import { ProjectsModule } from 'src/projects/projects.module';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [NotificationsModule, UtilsModule, ProjectsModule, MongooseModule.forFeature([{name: "Query", schema: QuerySchema}, {name: "Reply", schema: ReplySchema}])],
  providers: [QueriesService],
  controllers: [QueriesController]
})
export class QueriesModule {}
