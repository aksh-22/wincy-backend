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
import { InvoiceService } from './invoice.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PermissionGuard } from 'src/auth/permission.guard';
import { Permissions } from 'src/auth/permission.decorator';
import { Permission } from 'src/auth/permission.enum';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { INVOICE_STATUS } from './enum/status.enum';

@Controller('invoice-new')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Permissions(Permission.INVOICE)
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Get(':organisation')
  async getInvoice(
    @Request() req,
    @Query('projectId') projectId: string,
    @Query('paymentSchedule') paymentSchedule: string,
    @Query('status') status: INVOICE_STATUS,
    @Query('subsiduary') subsiduary: number,
    @Query('month') month: number,
    @Query('year') year: number,
    @Query('createdAt') createdAt: string,
    @Query('invoiceId') invoiceId: string,
  ) {
    const filter = {
      status,
      projectId,
      month,
      year,
      subsiduary,
      createdAt,
      invoiceId,
    };
    return await this.invoiceService.getInvoices(
      req.user,
      paymentSchedule,
      filter,
    );
  }

  @Post(':organisation')
  async createInvoice(
    @Body() body: CreateInvoiceDto,
    @Request() req,
    @Param('organisation') organisation: string,
  ) {
    return await this.invoiceService.createInvoice(
      body,
      req.user,
      organisation,
    );
  }

  @Patch(':organisation')
  async updateInvoice(
    @Body() body: UpdateInvoiceDto,
    @Request() req,
    @Param('organisation') organisation: string,
  ) {
    return await this.invoiceService.updateInvoice(
      body,
      req.user,
      organisation,
    );
  }

  @Get('number/:organisation/:subsiduaryId')
  async getInvoicesNumber(
    @Param('organisation') orgId: string,
    @Param('subsiduaryId') subsiduaryId: string,
  ) {
    return await this.invoiceService.getInvoicesNumber(orgId, subsiduaryId);
  }

  @Delete(':organisation/:invoiceId')
  async deletePaymentSchedule(@Param('invoiceId') invoiceId: string) {
    return await this.invoiceService.deleteInvoice(invoiceId);
  }

  @Get('invoice-details/:organisation')
  async getProjectInvoiceData(
    @Request() req,
    @Query('projectId') projectId: string,
    @Param('organisation') organisation: string,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    return await this.invoiceService.getProjectInvoiceData({
      user: req.user,
      projectId,
      organisation,
      year,
      month,
    });
  }
}
