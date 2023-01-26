import { forwardRef, Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ProjectSchema } from './schema/project.schema';
import { UtilsModule } from 'src/utils/utils.module';
import { OrganisationsModule } from 'src/organisations/organisations.module';
import { UsersModule } from 'src/users/users.module';
import { TasksModule } from 'src/tasks/tasks.module';
import { AttachmentSchema } from './schema/attachment.schema';
import { BugsModule } from 'src/bugs/bugs.module';
import { SystemModule } from 'src/system/system.module';
import { SectionSchema } from './schema/section.schema';
import { ActivitiesModule } from 'src/activities/activities.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { PaymentPhaseSchema } from './schema/paymentPhaser.schema';
import { InvoicesModule } from 'src/invoices/invoices.module';

@Module({
  imports: [InvoicesModule, ActivitiesModule, NotificationsModule, UtilsModule, forwardRef(() => OrganisationsModule),forwardRef(() => UsersModule), SystemModule, forwardRef(() => BugsModule), forwardRef(() => TasksModule), MongooseModule.forFeature([{ name: 'Project', schema: ProjectSchema }, { name: 'Attachment', schema: AttachmentSchema }, { name: 'Section', schema: SectionSchema}, { name: 'PaymentPhase', schema: PaymentPhaseSchema}])],
  providers: [ProjectsService],
  controllers: [ProjectsController],
  exports: [ProjectsService]
})
export class ProjectsModule {}
