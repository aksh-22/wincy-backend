import {
  Controller,
  Post,
  UseGuards,
  Request,
  Body,
  Get,
  Param,
  Query,
  Put,
  Delete,
} from '@nestjs/common';
import { EodService } from './eod.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CreateEodDto } from './dto/createEod.dto';
import { UpdateEodDto } from './dto/updateEod.dto';

import { Permission } from 'src/auth/permission.enum';
import { PermissionGuard } from 'src/auth/permission.guard';
import { Permissions } from 'src/auth/permission.decorator';
import { Query as ExpressQuery } from 'express-serve-static-core';

@Controller('eod')
@UseGuards(JwtAuthGuard)
export class EodController {
  constructor(private readonly eodService: EodService) {}

  @Post('add')
  async createEod(@Body() createEodDto: CreateEodDto, @Request() req) {
    const { user } = req;
    const userId = user._id;
    return await this.eodService.create(createEodDto, userId);
  }

  // @Get('list')
  // async findAll(@Request() req, @Query() query: ExpressQuery) {
  //   const { user } = req;
  //   const userId = user._id;
  //   return await this.eodService.showEod(userId, query);
  // }

  @Post('list')
  async findAll(
    @Request() req,
    @Query() query,
    @Body('startDate') startDate: any,
    @Body('endDate') endDate: any,
    @Body('projectId') projectId: string,
  ) {
    const { user } = req;
    const userId = user._id;
    return await this.eodService.showEod(
      userId,
      query,
      startDate,
      endDate,
      projectId,
    );
  }

  @Post('list12')
  async findAlll(
    @Request() req,
    @Query() query,
    @Body('startDate') startDate: any,
    @Body('endDate') endDate: any,
    @Body('projectId') projectId: string,
  ) {
    const { user } = req;
    const userId = user._id;
    return await this.eodService.showEod12(
      userId,
      query,
      startDate,
      endDate,
      projectId,
    );
  }

  // @Put('update')
  // update(
  //   @Query('id') query,
  //   @Body() UpdateEodDto: UpdateEodDto,
  //   @Request() req,
  // ) {
  //   const { user } = req;
  //   const userId = user._id;
  //   const id = query;
  //   return this.eodService.update(id, UpdateEodDto, userId);
  // }

  @Put('update')
  update(@Body() UpdateEodDto: UpdateEodDto, @Request() req) {
    const { user } = req;
    const userId = user._id;
    return this.eodService.update(userId, UpdateEodDto);
  }

  // @UseGuards(PermissionGuard)
  // @Get('/eodsUpdate/:organisation')
  // @Permissions(Permission.EOD)
  // async eodUpdates(@Request() req, @Param('organisation') orgId: string) {
  //   return await this.eodService.allEodUpdates(orgId);
  // }

  // @UseGuards(PermissionGuard)
  // @Get('all/:organisation')
  // @Permissions(Permission.EOD)
  // async eodUpdates(@Query() query, @Param('organisation') orgId: string) {
  //   return await this.eodService.allEodUpdates(orgId, query);
  // }

  //61554220a289af245c8b38f8

  // @Get('all')
  // async eodUpdates(@Query() query) {
  //   return await this.eodService.allEodUpdates1(query);
  // }

  @Post('all')
  async eodUpdates1(
    @Query() query,
    @Body('startDate') startDate: any,
    @Body('endDate') endDate: any,
    @Body('projectId') projectId: string,
    @Body('member') member: string,
  ) {
    return await this.eodService.allEodUpdates(
      query,
      startDate,
      endDate,
      projectId,
      member,
    );
  }

  @Delete('delete')
  async eodDelete(@Request() req, @Body('id') id: string) {
    const { user } = req;
    const userId = user._id;
    return await this.eodService.delete(id, userId);
  }

  @Get('today')
  async todayList(@Request() req) {
    const { user } = req;
    const userId = user._id;
    return await this.eodService.todayEod(userId);
  }
}
