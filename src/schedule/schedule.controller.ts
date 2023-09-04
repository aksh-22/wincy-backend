import {
  Body,
  Controller,
  Post,
  UseGuards,
  Request,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CreateScheduleDto, PermitStatus } from './dto/createSchedule.dto';
import { Query as ExpressQuery } from 'express-serve-static-core';
import { PermissionGuard } from 'src/auth/permission.guard';
import { Permission } from 'src/auth/permission.enum';
import { Permissions } from 'src/auth/permission.decorator';

@Controller('schedule')
@UseGuards(JwtAuthGuard)
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Post('add-schedule')
  async createEod(
    @Body() createScheduleDto: CreateScheduleDto,
    @Body('date') date: string,
    @Request() req,
  ) {
    const { user } = req;
    const userId = user._id;

    return await this.scheduleService.create(createScheduleDto, userId, date);
  }

  @Get('get-schedule')
  async getSchedules(@Request() req, @Query() query) {
    const { user } = req;
    const userId = user._id;
    return await this.scheduleService.showSchedules(userId, query);
  }

  @UseGuards(PermissionGuard)
  @Get('getusers-schedules/:organisation')
  @Permissions(Permission.GET_SCHEDULES)
  async UserSchedules(@Request() req) {
    const { user } = req;
    const userId = user._id;
    return await this.scheduleService.showUserSchedules();
  }

  @UseGuards(PermissionGuard)
  @Get('schedules-details/:organisation')
  @Permissions(Permission.GET_SCHEDULES)
  async SchedulesDetail(@Request() req, @Query() query: ExpressQuery) {
    const { user } = req;
    const userId = user._id;
    return await this.scheduleService.scheduleDetails(query);
  }

  @UseGuards(PermissionGuard)
  @Post('/permit/:organisation')
  @Permissions(Permission.PERMIT_SCHEDULE)
  permitAssign(
    @Query('id') query,
    @Request() req,
    @Body() permitStatus: PermitStatus,
  ) {
    const { user } = req;
    const userId = user._id;
    const id = query;
    console.log(id);

    return this.scheduleService.permitSchedule(id, userId, permitStatus);
  }

  // @UseGuards(PermissionGuard)
  // @Get('/schedule-filter/:organisation')
  // @Permissions(Permission.GET_SCHEDULES)
  // ScheduleFilter(@Request() req, @Query() query) {
  //   return this.scheduleService.scheduleFilter(query);
  // }

  @Get('schedule-filter')
  ScheduleFilter(@Request() req, @Query() query: ExpressQuery) {
    return this.scheduleService.scheduleFilter(query);
  }

  @Get('user-schedule-filter')
  UserScheduleFilter(@Request() req, @Query() query) {
    const { user } = req;
    const userId = user._id;
    return this.scheduleService.userscheduleFilter(query, userId);
  }

  @UseGuards(PermissionGuard)
  @Get('status-count/:organisation')
  @Permissions(Permission.GET_SCHEDULES)
  StatusCount(@Request() req) {
    return this.scheduleService.countStatus();
  }

  @Get('/demo')
  demo(@Request() req, @Query() query) {
    const { user } = req;
    const userId = user._id;
    return this.scheduleService.test(query);
  }
}
