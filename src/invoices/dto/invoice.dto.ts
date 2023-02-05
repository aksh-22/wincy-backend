import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class Services {
  paymentPhaseId: number;
  amount: string;
}

export class Taxes {
  taxName: string;
  taxedAmount: number;
}

export class CreateInvoiceDto {
  @IsNotEmpty()
  @IsString()
  sNo: string;
  @IsOptional()
  @IsString()
  currency: string;
  @IsOptional()
  @IsString()
  raisedOn: string;
  @IsOptional()
  @IsString()
  dueDate: string;
  // @IsOptional()
  // @IsString()
  // settledOn: string;
  @IsOptional()
  @IsString()
  noteForClient: string;
  @IsOptional()
  @IsString()
  paymentTerms: string;
  @IsOptional()
  @IsString()
  billTo: string;
  @IsOptional()
  @IsString()
  discountName: string;
  @IsOptional()
  @IsNumber()
  discountedAmount: number;
  @IsOptional()
  @IsArray()
  services: [Services];
  @IsOptional()
  @IsArray()
  taxes: [Taxes];
  @IsNotEmpty()
  @IsString()
  subsiduary: string;
  @IsNotEmpty()
  @IsString()
  customer: string;
  @IsNotEmpty()
  @IsString()
  account: string;
}

export class UpdateInvoiceDto {
  // @IsOptional()
  // @IsNumber()
  // totalAmount: number;
  @IsOptional()
  @IsString()
  sNo: string;
  @IsOptional()
  @IsString()
  currency: string;
  @IsOptional()
  @IsString()
  raisedOn: string;
  // @IsOptional()
  // @IsString()
  // settledOn: string;
  @IsOptional()
  @IsString()
  status: string;
  @IsOptional()
  @IsString()
  paymentPhaseId: string;
  @IsOptional()
  @IsString()
  dueDate: string;
  @IsOptional()
  @IsString()
  subsiduary: string;
  @IsOptional()
  @IsString()
  customer: string;
  @IsOptional()
  @IsString()
  billTo: string;
  @IsOptional()
  @IsString()
  account: string;
  @IsOptional()
  @IsString()
  noteForClient: string;
  @IsOptional()
  @IsString()
  paymentTerms: string;
  @IsOptional()
  @IsArray()
  services: [Services];
  @IsOptional()
  @IsArray()
  taxes: [Taxes];
  @IsOptional()
  @IsString()
  discountName: string;
  @IsOptional()
  @IsNumber()
  discountedAmount: number;
}

export const allowedFieldsForInvoice = ['sNo', 'dueDate', 'status'];
