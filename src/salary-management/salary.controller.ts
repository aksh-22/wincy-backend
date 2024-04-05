import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Permissions } from 'src/auth/permission.decorator';
import { Permission } from 'src/auth/permission.enum';
import { PermissionGuard } from 'src/auth/permission.guard';
import { AddSalaryDto } from './dto/add-salary.dto';
import { SalaryService } from './salary.service';
import { UpdateSalaryDto } from './dto/update-salary.dto';

@Controller('salary')
export class SalaryController {
  constructor(private readonly salaryService: SalaryService) {}

  //=======================================//

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions(Permission.UPDATE_PROFILE)
  @Post('add/:organisation')
  async addSalary(@Body() dto: AddSalaryDto, @Request() req) {
    const createdBy = req.user._id;

    return await this.salaryService.addSalary(dto, createdBy);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions(Permission.UPDATE_PROFILE)
  @Get('view/:organisation/:id')
  async viewSalary(@Param('id') id: string) {
    return await this.salaryService.viewSalary(id);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions(Permission.UPDATE_PROFILE)
  @Patch('update/:organisation/:id')
  async updateSalary(@Param('id') id: string, @Body() dto: UpdateSalaryDto) {
    return await this.salaryService.updateSalary(id, dto);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions(Permission.UPDATE_PROFILE)
  @Delete('delete/:organisation/:id')
  async deleteSalary(@Param('id') id: string) {
    return await this.salaryService.deleteSalary(id);
  }
}
