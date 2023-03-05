import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  Request,
  UploadedFiles,
  Param,
  Body,
  Patch,
  Delete,
  Get,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Permissions } from 'src/auth/permission.decorator';
import { Permission } from 'src/auth/permission.enum';
import { PermissionGuard } from 'src/auth/permission.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from 'src/auth/roles.enum';
import { RolesGuard } from 'src/auth/roles.guard';
import { CreateInvoiceDto, UpdateInvoiceDto } from './dto/invoice.dto';
import { AddTransactionDto, UpdateTransactionDto } from './dto/transaction.dto';
import { InvoicesService } from './invoices.service';

@Controller('invoices')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Roles(Role.Admin)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  //=============================================//

  @Post('bill/create-invoice/:organisation/:project')
  // @Post('bill/create-invoice/:organisation/:project')
  async createInvoice(
    @Request() req,
    @Param('project') projectId: string,
    @Param('organisation') orgId: string,
    @Body() dto: CreateInvoiceDto,
  ) {
    const { user } = req;
    return await this.invoicesService.createInvoice(
      user,
      orgId,
      projectId,
      dto,
    );
  }

  //=============================================//

  @Patch('bill/:organisation/:project/:invoice')
  async updateInvoice(
    @Request() req,
    @Param('project') projectId: string,
    @Param('organisation') orgId: string,
    @Param('invoice') invoiceId: string,
    @Body() dto: UpdateInvoiceDto,
  ) {
    const { user } = req;
    return await this.invoicesService.updateInvoice(
      user,
      orgId,
      projectId,
      invoiceId,
      dto,
    );
  }

  //=============================================//

  @Delete('bill/:organisation/:project/:transaction')
  async deleteInvoice(
    @Request() req,
    @Param('project') projectId: string,
    @Param('organisation') orgId: string,
    @Param('transaction') transactionId: string,
  ) {
    const { user } = req;
    return await this.invoicesService.deleteInvoice(
      user,
      orgId,
      projectId,
      transactionId,
    );
  }

  //=============================================//

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete('transaction/:organisation/:project/:invoice/:transaction')
  @Roles(Role.Admin)
  async deleteTransaction(
    @Param('project') projectId: string,
    @Param('invoice') invoiceId: string,
    @Param('transaction') transactionId: string,
  ) {
    return await this.invoicesService.deleteTransaction(
      projectId,
      invoiceId,
      transactionId,
    );
  }

  //=============================================//

  @Get('bill/:organisation')
  @Permissions(Permission.GET_INVOICES, Permission.CREATE_INVOICE)
  async getInvoices(
    @Request() req,
    @Param('organisation') orgId: string,
    @Query('subsiduary') subsiduaryId: string,
    @Query('financialYear') financialYear: string,
    @Query('projectId') projectId: string,
    @Query('month') month: number,
  ) {
    const { user } = req;
    return await this.invoicesService.getInvoices(
      orgId,
      subsiduaryId,
      projectId,
      financialYear,
      Number(month),
      user,
    );
  }

  //=============================================//

  @Get('bill/number/:organisation/:subsiduaryId')
  @Permissions(Permission.GET_INVOICES, Permission.CREATE_INVOICE)
  async getInvoicesNumber(
    @Request() req,
    @Param('organisation') orgId: string,
    @Param('subsiduaryId') subsiduaryId: string,
  ) {
    const { user } = req;
    return await this.invoicesService.getInvoicesNumber(
      orgId,
      subsiduaryId,
      user,
    );
  }

  //=============================================//

  @Get('single/:organisation/:invoice')
  @Permissions(Permission.GET_INVOICES, Permission.CREATE_INVOICE)
  async getSingleInvoice(
    @Request() req,
    @Param('organisation') orgId: string,
    @Param('invoice') invoiceId: string,
  ) {
    const { user } = req;
    return await this.invoicesService.getSingleInvoice(orgId, invoiceId, user);
  }

  // @Get('fix-invoice')
  // @HttpCode(HttpStatus.NOT_ACCEPTABLE)
  // @Roles(Role.Admin)
  // async fixAllInvoiceSignals() {
  //   return await this.invoicesService.fixAllInvoices();
  // }

  //=============================================//

  @Post('transaction/:organisation/:invoice')
  @UseInterceptors(
    FilesInterceptor('attachments', 5, {
      // fileFilter: (req, attachments, cb) => {
      //   if (!attachments.originalname.match(/\.(jpeg|peg|png|gif|jpg)$/)) {
      //     cb(new Error('File Format not Supported...!!!'), false);
      //   } else {
      //     cb(null, true);
      //   }
      // },
      limits: { fileSize: 10 * 1000 * 1000 },
    }),
  )
  async addTransaction(
    @Request() req,
    @UploadedFiles() attachments,
    @Param('organisation') orgId: string,
    @Param('invoice') invoiceId: string,
    @Body() dto: AddTransactionDto,
  ) {
    const { user } = req;
    return await this.invoicesService.addTransaction(
      user,
      orgId,
      invoiceId,
      attachments,
      dto,
    );
  }

  //=============================================//

  @Patch('transaction/:organisation/:transaction')
  @UseInterceptors(
    FilesInterceptor('attachments', 5, {
      // fileFilter: (req, attachments, cb) => {
      //   if (!attachments.originalname.match(/\.(jpeg|peg|png|gif|jpg)$/)) {
      //     cb(new Error('File Format not Supported...!!!'), false);
      //   } else {
      //     cb(null, true);
      //   }
      // },
      limits: { fileSize: 10 * 1000 * 1000 },
    }),
  )

  //=============================================//
  async updateTransaction(
    @Request() req,
    @UploadedFiles() attachments,
    @Param('organisation') orgId: string,
    @Param('transaction') transactionId: string,
    @Body() dto: UpdateTransactionDto,
  ) {
    const { user } = req;
    return await this.invoicesService.updateTransaction(
      user,
      orgId,
      transactionId,
      attachments,
      dto,
    );
  }

  //=============================================//

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Get('transaction/:organisation/:invoice')
  @Permissions(Permission.GET_INVOICES, Permission.CREATE_INVOICE)
  async getTransaction(
    @Request() req,
    @Param('organisation') orgId: string,
    @Param('invoice') invoiceId: string,
  ) {
    const { user } = req;
    return await this.invoicesService.getTransactions(orgId, invoiceId, user);
  }

  //=============================================//

  @Get('pending/:organisation')
  async getRaisedInvoices(@Param('organisation') orgId: string) {
    return await this.invoicesService.getRaisedInvoices(orgId);
  }

  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Delete('transaction/:organisation/:transaction')
  // @Roles(Role.Admin)
  // async deleteTransaction(
  //   @Request() req,
  //   @UploadedFiles() attachments,
  //   @Param('organisation') orgId: string,
  //   @Param('transaction') transactionId: string,
  //   @Body() dto: UpdateTransactionDto,
  // ){
  //   const {user} = req;
  //   return await this.invoicesService.deleteTransaction(user, orgId, transactionId, attachments, dto);
  // }
}
