import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from 'src/config/config.service';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel('Notification') private readonly notiModel: Model<any>,
    @InjectModel('UserNotificationCount')
    private readonly userNotiCountModel: Model<any>,
    private readonly usersService: UsersService,
  ) {}

  async sendNotification(contents, include_player_ids) {
    const headers = {
      'Content-Type': 'application/json; charset=utf-8',
      Authorization: `Basic ${ConfigService.keys.ONE_SIGNAL_REST_API_KEY}`,
    };

    const data = {
      app_id: ConfigService.keys.ONE_SIGNAL_APP_ID,
      contents, //: {"en": "English Message"},
      include_player_ids,
    };

    const options = {
      host: 'onesignal.com',
      port: 443,
      path: '/api/v1/notifications',
      method: 'POST',
      headers: headers,
    };

    const https = require('https');
    const req = https.request(options, function (res) {
      res.on('data', function (data) {
        console.log('Response:');
        console.log(JSON.parse(data));
      });
    });

    req.on('error', function (e) {
      console.error('ERROR:');
      console.error(e);
    });

    req.write(JSON.stringify(data));
    req.end();
  }

  async createNotifications(data) {
    try {
      // users, description, module, orgId, moduleId, accessLevel
      let noti = new this.notiModel({ ...data, users: undefined });
      const userStatus = [];
      data.users.forEach((ele) => {
        userStatus.push({ user: ele, isRead: false });
      });
      noti['userStatus'] = userStatus;
      noti = await noti.save();

      const users = await this.usersService.getMultUsers(
        { _id: { $in: data.users } },
        {},
      );
      const userPlayerIds = [];
      // users.forEach(ele => {
      //   if(ele.oneSignalPlayerId) {
      //     userPlayerIds.push(ele.oneSignalPlayerId)
      //   }
      // })
      for (let i = 0; i < users.length; i++) {
        if (users[i]?.oneSignalPlayerId) {
          userPlayerIds.push(users[i]?.oneSignalPlayerId);
        }
        let userNotification = await this.userNotiCountModel
          .findOne({ user: users[i]._id, organisation: data.organisation })
          .exec();
        if (userNotification) {
          userNotification.count += 1;
        } else {
          userNotification = new this.userNotiCountModel({
            user: users[i]._id,
            organisation: data.organisation,
            count: 1,
          });
        }

        await userNotification.save();
      }

      let notified;
      if (userPlayerIds.length > 0) {
        notified = await this.sendNotification(
          { en: data.description },
          userPlayerIds,
        );
      }
      return noti;
    } catch (err) {
      throw err;
    }
  }

  // async clearNotifications(user, orgId) {
  //   const deleted = await this.notiModel.deleteMany({"users.user": user._id, organisation: orgId}).exec();
  //   return {data : deleted, success: true};
  // }

  async addOneSignalPlayerId(user, playerId) {
    user.oneSignalPlayerId = playerId;
    await user.save();
    return { message: undefined, success: true, data: undefined };
  }

  async markNotificationRead(user, orgId, notificationId) {
    try {
      const notifications = await this.notiModel
        .updateMany(
          {
            organisation: orgId,
            _id: notificationId,
            userStatus: { $elemMatch: { user: user._id, isRead: false } },
          },
          { $set: { 'userStatus.$.isRead': true } },
          { new: true },
        )
        .exec();
      return { data: { notifications }, message: '', success: true };
    } catch (error) {
      console.error('error in markNotificationRead', error);
    }
  }

  async markAllNotificationRead(user, orgId) {
    try {
      const notifications = await this.notiModel
        .updateMany(
          {
            organisation: orgId,
            userStatus: { $elemMatch: { user: user._id, isRead: false } },
          },
          { $set: { 'userStatus.$.isRead': true } },
        )
        .exec();
      return { data: { notifications }, message: '', success: true };
    } catch (error) {
      console.error('error in markAllNotificationRead', error);
    }
  }

  async getMyNotifications(user, orgId, status, pageSize, pageNo) {
    try {
      let filter = {};
      let limit = 30;
      if (pageSize) {
        limit = pageSize;
      }
      if (!pageNo) {
        pageNo = 1;
      }
      if (status == 'Read') {
        filter = {
          userStatus: { $elemMatch: { user: user._id, isRead: true } },
          organisation: orgId,
        };
      } else if (status == 'UnRead') {
        filter = {
          userStatus: { $elemMatch: { user: user._id, isRead: false } },
          organisation: orgId,
        };
      } else {
        filter = {
          userStatus: { $elemMatch: { user: user._id } },
          organisation: orgId,
        };
      }
      const notifications = await this.notiModel
        .find(filter)
        .sort({ _id: -1 })
        .skip(limit * (pageNo - 1))
        .limit(limit)
        .exec();
      return { data: { notifications }, message: '', success: true };
    } catch (error) {
      console.error('error in getMyNotifications', error);
    }
  }

  async checkUserNotificationCount(user, orgId) {
    const notificationCount = await this.userNotiCountModel
      .findOne({ user: user._id, organisation: orgId })
      .exec();
    return {
      data: { notificationCount: notificationCount?.count },
      message: '',
      success: true,
    };
  }
  async resetUserNotificationCount(user, orgId) {
    this.userNotiCountModel
      .updateOne(
        { user: user._id, organisation: orgId },
        { $set: { count: 0 } },
      )
      .exec();
    return { data: {}, message: '', success: true };
  }
}
