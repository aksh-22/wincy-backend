import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CreatePaymentScheduleDto } from './dto/create-payment-schedule.dto';
import { PaymentScheduleService } from './paymentSchedule.service';
import { PermissionGuard } from 'src/auth/permission.guard';
import { Permissions } from 'src/auth/permission.decorator';
import { Permission } from 'src/auth/permission.enum';
import { UpdatePaymentScheduleDto } from './dto/update-payment-schedule.dto';
import { PAYMENT_SCHEDULE_STATUS } from './paymentSchedule.enum';

@Controller('payment-schedule')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Permissions(Permission.INVOICE)
export class paymentScheduleController {
  constructor(
    private readonly paymentScheduleService: PaymentScheduleService,
  ) {}

  @Get(':organisation')
  async getPaymentSchedules(
    @Request() req,
    @Query('projectId') projectId: string,
    @Query('status') status: PAYMENT_SCHEDULE_STATUS | any,
    @Query('month') month: number,
    @Query('year') year: number,
    @Query('createdAt') createdAt: string,
  ) {
    const filter = { status, projectId, month, year, createdAt };
    return await this.paymentScheduleService.getPaymentSchedules(
      req.user,
      filter,
    );
  }

  @Post(':organisation')
  async createPaymentSchedule(
    @Body() body: CreatePaymentScheduleDto,
    @Request() req,
    @Param('organisation') organisation: string,
  ) {
    return await this.paymentScheduleService.createPaymentSchedule(
      body,
      req.user,
      organisation,
    );
  }

  @Patch(':organisation')
  async updatePaymentSchedule(
    @Body() body: UpdatePaymentScheduleDto,
    @Request() req,
  ) {
    return await this.paymentScheduleService.updatePaymentSchedule(
      body,
      req.user,
    );
  }

  @Delete(':organisation/:paymentScheduleId')
  async deletePaymentSchedule(
    @Param('paymentScheduleId') paymentScheduleId: string,
  ) {
    return await this.paymentScheduleService.deletePaymentSchedule(
      paymentScheduleId,
    );
  }
}
