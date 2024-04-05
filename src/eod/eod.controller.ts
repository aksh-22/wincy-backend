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
import { RolesGuard } from 'src/auth/roles.guard';
import { Role } from 'src/auth/roles.enum';
import { Roles } from 'src/auth/roles.decorator';

@Controller('eod')
@UseGuards(JwtAuthGuard)
export class EodController {
  constructor(private readonly eodService: EodService) {}

  @UseGuards(RolesGuard)
  @Post(':organisation/add')
  @Roles(Role.Admin, Role['Member++'], Role['Member+'], Role.Member)
  async createEod(
    @Param('organisation') orgId: string,
    @Body() createEodDto: CreateEodDto,
    @Request() req,
  ) {
    const { user } = req;
    const userId = user._id;
    const userType = user.type;
    return await this.eodService.create(createEodDto, userId, userType);
  }

  @UseGuards(RolesGuard)
  @Post(':organisation/list')
  @Roles(Role.Admin, Role['Member++'], Role['Member+'], Role.Member)
  async findAll(
    @Param('organisation') orgId: string,
    @Request() req,
    @Query() query,
    @Body('startDate') startDate: any,
    @Body('endDate') endDate: any,
    @Body('projectId') projectId: string,
    @Body('member') member: string,
    @Body('search') search: string,
  ) {
    const { user } = req;
    const userId = user._id;
    const userType = user.type;
    return await this.eodService.showEod(
      userId,
      userType,
      query,
      startDate,
      endDate,
      projectId,
      member,
      search,
    );
  }

  @UseGuards(RolesGuard)
  @Put(':organisation/update')
  @Roles(Role.Admin, Role['Member++'], Role['Member+'], Role.Member)
  update(
    @Param('organisation') orgId: string,
    @Body() UpdateEodDto: UpdateEodDto,
    @Request() req,
  ) {
    const { user } = req;
    const userId = user._id;
    const userType = user.type;
    return this.eodService.update(userId, userType, UpdateEodDto);
  }

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

  @UseGuards(RolesGuard)
  @Delete(':organisation/delete')
  @Roles(Role.Admin, Role['Member++'], Role['Member+'], Role.Member)
  async eodDelete(
    @Param('organisation') orgId: string,
    @Request() req,
    @Query() query,
  ) {
    const { user } = req;
    const userId = user._id;
    const id = query.id;
    const userType = user.type;

    return await this.eodService.delete(id, userId, userType);
  }
}
