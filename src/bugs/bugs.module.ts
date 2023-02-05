import { forwardRef, Module } from '@nestjs/common';
import { BugsService } from './bugs.service';
import { BugsController } from './bugs.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ProjectSchema } from 'src/projects/schema/project.schema';
import { BugSchema } from './schema/bug.schema';
import { BugReportSchema } from './schema/bug_report.schema';
import { UserSchema } from 'src/users/schema/user.schema';
import { CounterSchema } from './schema/counter.schema';
import { UtilsModule } from 'src/utils/utils.module';
import { ProjectsModule } from 'src/projects/projects.module';
import { ActivitiesModule } from 'src/activities/activities.module';
import { SystemModule } from 'src/system/system.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { TasksModule } from 'src/tasks/tasks.module';

@Module({
  imports: [
    forwardRef(() => TasksModule),
    NotificationsModule,
    UtilsModule,
    SystemModule,
    ActivitiesModule,
    forwardRef(() => ProjectsModule),
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema },
      { name: 'Project', schema: ProjectSchema },
      { name: 'Bug', schema: BugSchema },
      { name: 'BugReport', schema: BugReportSchema },
      { name: 'Counter', schema: CounterSchema },
    ]),
  ],
  providers: [BugsService],
  controllers: [BugsController],
  exports: [BugsService],
})
export class BugsModule {}
