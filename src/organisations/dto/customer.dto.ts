import { IsArray, IsNotEmpty, IsOptional, IsString } from "class-validator"
import { ApiProperty } from "@nestjs/swagger";

export class AddCustomerDto {
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @IsOptional()
  @IsString()
  email?: string;
  
  @IsOptional()
  @IsString()
  address?: string;
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
}

export class DeleteCustomersDto { 
  @IsNotEmpty()
  @IsArray()
  customers: [string];
}