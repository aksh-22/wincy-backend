import {
  IsBoolean,
  IsDateString,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreatePaymentScheduleDto {
  @IsNotEmpty()
  @IsMongoId()
  projectId: string;

  @IsNotEmpty()
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

  @IsNotEmpty()
  @IsNumber()
  amount: string;

  @IsOptional()
  @IsBoolean()
  isRestricted: boolean;
}
