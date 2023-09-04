import {
  IsArray,
  IsDateString,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateInvoiceDto {
  @IsNotEmpty()
  @IsMongoId()
  projectId: string;

  @IsNotEmpty()
  @IsArray()
  paymentSchedule: string[];

  @IsNotEmpty()
  @IsMongoId()
  subsiduary: string;

  @IsOptional()
  @IsDateString()
  paidAt: Date;

  @IsOptional()
  @IsDateString()
  invoicedAt: Date;

  @IsNotEmpty()
  @IsDateString()
  dueDate: Date;

  @IsNotEmpty()
  @IsString()
  invoiceNumber: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsString()
  amount: number;

  @IsOptional()
  @IsArray()
  otherAmount: [{ name: string; amount: number }];
}
