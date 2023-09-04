import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InvoiceModel, InvoiceSchema } from './schema/invoice.schema';
import { InvoiceController } from './invoice.controller';
import { InvoiceService } from './invoice.service';
import { ProjectsModule } from 'src/projects/projects.module';
import { UtilsModule } from 'src/utils/utils.module';
import { CustomerSchema } from 'src/organisations/schema/customer.schema';
import {
  PaymentScheduleModel,
  PaymentScheduleSchema,
} from 'src/payment-schedule/schema/paymentSchedule.schema';
import { PaymentSchedule } from 'src/payment-schedule/paymentSchedule.module';

@Module({
  imports: [
    forwardRef(() => ProjectsModule),
    forwardRef(() => PaymentSchedule),
    MongooseModule.forFeature([
      { name: InvoiceModel.name, schema: InvoiceSchema },
      { name: 'Customer', schema: CustomerSchema },
      { name: PaymentScheduleModel.name, schema: PaymentScheduleSchema },
    ]),
    UtilsModule,
  ],
  controllers: [InvoiceController],
  providers: [InvoiceService],
  exports: [InvoiceService],
})
export class Invoice {}
