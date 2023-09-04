import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from './config/config.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from './config/config.service';
import { OrganisationsModule } from './organisations/organisations.module';
import { UtilsModule } from './utils/utils.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
import { BugsModule } from './bugs/bugs.module';
import { LeadsModule } from './leads/leads.module';
import { SystemModule } from './system/system.module';
import { ActivitiesModule } from './activities/activities.module';
import { EventsModule } from './events/events.module';
import { QueriesModule } from './queries/queries.module';
import { NotificationsModule } from './notifications/notifications.module';
import { InvoicesModule } from './invoices/invoices.module';
import { EodModule } from './eod/eod.module';
import { PaymentSchedule } from './payment-schedule/paymentSchedule.module';
import { Invoice } from './invoice/invoice.module';
import { ScheduleModule } from './schedule/schedule.module';

@Module({
  imports: [
    EventsModule,
    UsersModule,
    AuthModule,
    ConfigModule,
    MongooseModule.forRoot(ConfigService.keys.MONGO_URI),
    OrganisationsModule,
    UtilsModule,
    ProjectsModule,
    TasksModule,
    BugsModule,
    LeadsModule,
    SystemModule,
    ActivitiesModule,
    QueriesModule,
    NotificationsModule,
    InvoicesModule,
    EodModule,
    PaymentSchedule,
    Invoice,
    ScheduleModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
