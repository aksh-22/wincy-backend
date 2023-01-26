import { Controller, Patch, Request, Query, UseGuards, Delete, Param, Get } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from 'src/auth/roles.enum';
import { RolesGuard } from 'src/auth/roles.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notifyService: NotificationsService,
  ){}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('user/:organisation/:playerId')
  @Roles(Role.Admin, Role['Member++'], Role['Member+'], Role.Member)
  async addOneSignalPlayerId(
    @Request() req,
    @Param('playerId') playerId: string,
  ) {
    const {user} = req;
    return await this.notifyService.addOneSignalPlayerId(user, playerId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('read/:organisation/:notification')
  @Roles(Role.Admin, Role['Member++'], Role['Member+'], Role.Member)
  async markNotificationRead(
    @Request() req,
    @Param('organisation') orgId: string,
    @Param('notification') notificationId: string,
  ) {
    const {user} = req;
    return await this.notifyService.markNotificationRead(user, orgId, notificationId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('readAll/:organisation')
  @Roles(Role.Admin, Role['Member++'], Role['Member+'], Role.Member)
  async markAllNotificationRead(
    @Request() req,
    @Param('organisation') orgId: string,
  ) {
    const {user} = req;
    return await this.notifyService.markAllNotificationRead(user, orgId);
  }

  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Patch('clear/:organisation/:notification')
  // @Roles(Role.Admin, Role['Member++'], Role['Member+'], Role.Member)
  // async markNotificationRead(
  //   @Request() req,
  //   @Param('organisation') orgId: string,
  //   @Param('notification') notificationId: string,
  // ) {
  //   const {user} = req;
  //   return await this.notifyService.markNotificationRead(user, orgId, notificationId);
  // }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('my/:organisation')
  @Roles(Role.Admin, Role['Member++'], Role['Member+'], Role.Member)
  async getMyNotifications(
    @Request() req,
    @Param('organisation') orgId: string,
    @Query('pageSize') pageSize: string,
    @Query('pageNo') pageNo: string,
    @Query('status') status: "Read" | "UnRead",
  ) {
    const {user} = req;
    return await this.notifyService.getMyNotifications(user, orgId, status, parseInt(pageSize), parseInt(pageNo));
  }72
 @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('count/:organisation')
  @Roles(Role.Admin, Role['Member++'], Role['Member+'], Role.Member)
  async getNotificationCount(
    @Request() req,
    @Param('organisation') orgId: string,

  ) {
    const {user} = req;
    return await this.notifyService.checkUserNotificationCount(user, orgId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('count/:organisation')
  @Roles(Role.Admin, Role['Member++'], Role['Member+'], Role.Member)
  async resetNotificationCount(
    @Request() req,
    @Param('organisation') orgId: string,
  ) {
    const {user} = req;
    return await this.notifyService.resetUserNotificationCount(user, orgId);
  }
}
