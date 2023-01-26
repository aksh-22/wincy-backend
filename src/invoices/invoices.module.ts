import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GatewaySchema } from 'src/system/schema/gateway.schema';
import { SystemModule } from 'src/system/system.module';
import { UtilsModule } from 'src/utils/utils.module';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { InvoiceSchema } from './schema/invoice.schema';
import { PendingInvoiceSchema } from './schema/pendingInvoice.schema';
import { TransactionSchema } from './schema/transaction.schema';

@Module({
  imports: [UtilsModule, SystemModule, MongooseModule.forFeature([{name: 'Invoice', schema: InvoiceSchema}, {name: 'PendingInvoice', schema: PendingInvoiceSchema}, {name: 'Transaction', schema: TransactionSchema}, {name: 'Gateway', schema: GatewaySchema}])],
  controllers: [InvoicesController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
