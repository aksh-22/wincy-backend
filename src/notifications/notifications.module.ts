import { forwardRef, Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationSchema } from './schema/notification.schema';
import { UsersModule } from 'src/users/users.module';
import { UserNotificationCountSchema } from './schema/user_notification_count.schema';

@Module({
  imports: [MongooseModule.forFeature([{name: 'Notification', schema: NotificationSchema}, {name: "UserNotificationCount", schema: UserNotificationCountSchema}]), forwardRef(() => UsersModule)],
  providers: [NotificationsService],
  controllers: [NotificationsController],
  exports: [NotificationsService]
})
export class NotificationsModule {}
