import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsArray } from 'class-validator';

export class AddAccountDto {
  @IsNotEmpty()
  @IsString()
  accountName: string;

  @IsNotEmpty()
  @IsString()
  accountNumber: string;

  @IsNotEmpty()
  @IsString()
  ifscCode: string;

  @IsOptional()
  @IsString()
  swiftCode: string;

  @IsOptional()
  @IsString()
  micrCode: string;
}

export class UpdateAccountDto {
  @IsOptional()
  @IsString()
  accountName: string;

  @IsOptional()
  @IsString()
  accountNumber: string;

  @IsOptional()
  @IsString()
  ifscCode: string;

  @IsOptional()
  @IsString()
  swiftCode: string;

  @IsOptional()
  @IsString()
  micrCode: string;
}

export class DeleteAccountsDto {
  @IsNotEmpty()
  @IsArray()
  accountIds: [string];
}

export class UpdatePermissionDto {
  @IsNotEmpty()
  @IsArray()
  permissions: [string];

  @IsNotEmpty()
  @IsString()
  user: string;
}
