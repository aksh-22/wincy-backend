import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Invoice } from 'src/invoice/invoice.module';
import { UtilsModule } from 'src/utils/utils.module';
import { paymentScheduleController } from './paymentSchedule.controller';
import { PaymentScheduleService } from './paymentSchedule.service';
import {
  PaymentScheduleModel,
  PaymentScheduleSchema,
} from './schema/paymentSchedule.schema';

@Module({
  imports: [
    Invoice,
    MongooseModule.forFeature([
      { name: PaymentScheduleModel.name, schema: PaymentScheduleSchema },
    ]),
    UtilsModule,
  ],
  exports: [],
  controllers: [paymentScheduleController],
  providers: [PaymentScheduleService],
})
export class PaymentSchedule {}
