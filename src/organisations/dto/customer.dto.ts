import {
  IsArray,
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddCustomerDto {
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @IsOptional()
  @IsString()
  email: string;

  @IsOptional()
  @IsString()
  address: string;

  @IsOptional()
  @IsArray()
  projects: [string];

  @IsOptional()
  @IsString()
  phoneNumber: string;

  @IsOptional()
  @IsString()
  country: string;

  @IsOptional()
  @IsString()
  assignedDate: string;
}

export class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsArray()
  projects?: [string];

  @IsOptional()
  @IsString()
  phoneNumber: string;

  @IsOptional()
  @IsString()
  country: string;

  @IsOptional()
  @IsBoolean()
  isDelete: boolean;
}

export class DeleteCustomersDto {
  @IsNotEmpty()
  @IsArray()
  customers: [string];
}

export class LinkCustomerDto {
  @IsOptional()
  @IsString()
  customerId: string;

  @IsOptional()
  @IsString()
  customerIdToRemove: string;

  @IsNotEmpty()
  @IsString()
  projectId: string;
}
