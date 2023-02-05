import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventsModule } from 'src/events/events.module';
import { ProjectsModule } from 'src/projects/projects.module';
import { UtilsModule } from 'src/utils/utils.module';
import { MilestoneSchema } from './schema/milestone.schema';
import { ModuleSchema } from './schema/module.schema';
import { TodoSortSchema } from './schema/todo_sort.schema';
import { TaskSchema } from './schema/task.schema';
import { TaskReportSchema } from './schema/task_report.schema';
import { TodoSchema } from './schema/todo.schema';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TaskSortSchema } from './schema/task_sort.schema';
import { ModuleSortSchema } from './schema/module_sort.schema';
import { MilestoneSortSchema } from './schema/milestone_sort.schema';
import { ActivitiesModule } from 'src/activities/activities.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { BugsModule } from 'src/bugs/bugs.module';
// import { EodSchema } from './schema/EOD.schema';

@Module({
  imports: [
    forwardRef(() => BugsModule),
    forwardRef(() => ProjectsModule),
    UtilsModule,
    ActivitiesModule,
    forwardRef(() => EventsModule),
    NotificationsModule,
    MongooseModule.forFeature([
      { name: 'Milestone', schema: MilestoneSchema },
      { name: 'Task', schema: TaskSchema },
      { name: 'Task_Report', schema: TaskReportSchema },
      { name: 'Todo', schema: TodoSchema },
      // { name: 'EOD', schema: EodSchema },
      { name: 'TodoSort', schema: TodoSortSchema },
      { name: 'Module', schema: ModuleSchema },
      { name: 'TaskSort', schema: TaskSortSchema },
      { name: 'ModuleSort', schema: ModuleSortSchema },
      { name: 'MilestoneSort', schema: MilestoneSortSchema },
    ]),
  ],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
