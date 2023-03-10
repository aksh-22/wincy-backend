import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  isEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { isBoolean } from 'util';

export class CreatePaymentPhaseDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsBoolean()
  restricted?: number;
}

export class UpdatePaymentPhaseDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsBoolean()
  restricted?: number;

  @IsOptional()
  status?: string;
}

export class DeletePaymentPhasesDto {
  @IsNotEmpty()
  @IsArray()
  paymentPhaseIds: [string];
}

export class UpdatePaymentPhaseMilestoneDto {
  @IsOptional()
  @IsArray()
  milestoneIds: [string];

  @IsOptional()
  @IsArray()
  newMilestones: [string];

  @IsOptional()
  @IsArray()
  removeMilestones: [string];

  @IsOptional()
  @IsString()
  paymentPhaseId: string;
}
