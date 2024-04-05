import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { PAYMENT_SCHEDULE_STATUS } from '../paymentSchedule.enum';

export class UpdatePaymentScheduleDto {
  @IsNotEmpty()
  @IsMongoId()
  paymentScheduleId: string;

  @IsNotEmpty()
  @IsMongoId()
  projectId: string;

  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsDateString()
  paidAt: Date;

  @IsOptional()
  @IsDateString()
  dueDate: Date;

  @IsOptional()
  @IsNumber()
  amount: string;

  @IsOptional()
  @IsBoolean()
  isRestricted: boolean;

  @IsOptional()
  @IsEnum(PAYMENT_SCHEDULE_STATUS)
  status: PAYMENT_SCHEDULE_STATUS;
}
