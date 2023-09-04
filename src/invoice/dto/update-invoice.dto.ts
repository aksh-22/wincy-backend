import {
  IsArray,
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { INVOICE_STATUS } from '../enum/status.enum';

export class UpdateInvoiceDto {
  @IsNotEmpty()
  @IsMongoId()
  projectId: string;

  @IsNotEmpty()
  @IsMongoId()
  invoiceId: string;

  @IsNotEmpty()
  @IsArray()
  paymentSchedule: any[];

  @IsOptional()
  @IsMongoId()
  subsiduary: string;

  @IsOptional()
  @IsDateString()
  paidAt: Date;

  @IsOptional()
  @IsEnum(INVOICE_STATUS)
  status: INVOICE_STATUS;

  @IsOptional()
  @IsDateString()
  dueDate: Date;

  @IsOptional()
  @IsDateString()
  invoicedAt: Date;

  @IsOptional()
  @IsString()
  invoiceNumber: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  amount: number;

  @IsOptional()
  @IsArray()
  otherAmount: [{ name: string; amount: number }];
}
