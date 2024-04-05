import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class AddressDto {
  @IsNotEmpty()
  @IsString()
  address: string;

  @IsNotEmpty()
  @IsString()
  state: string;

  @IsNotEmpty()
  @IsString()
  city: string;

  @IsNotEmpty()
  @IsString()
  country: string;

  @IsNotEmpty()
  @IsString()
  pinCode: string;

  @IsNotEmpty()
  @IsString()
  houseNumber: string;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  readonly name: string;
  @IsOptional()
  @IsString()
  readonly ifsc: string;
  @IsOptional()
  @IsString()
  readonly accountNumber: string;
  @IsOptional()
  @IsString()
  readonly bankName: string;
  @IsOptional()
  @IsString()
  readonly branchName: string;
  @IsOptional()
  @IsString()
  readonly phoneNumber: string;
  @IsOptional()
  @IsString()
  readonly dob: string;

  @IsOptional()
  @IsString()
  officialEmail: string;

  @IsOptional()
  @IsString()
  personalEmail: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AddressDto)
  @IsArray()
  residentialAddress: AddressDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AddressDto)
  @IsArray()
  permanentAddress: AddressDto[];

  @IsOptional()
  @IsString()
  pan: string;

  @IsOptional()
  @IsString()
  aadhaar: string;

  @IsOptional()
  @IsNumber()
  terminationDate: number;

  @IsOptional()
  @IsString()
  employeeCode: string;

  @IsOptional()
  @IsNumber()
  bondStartDate: number;

  @IsOptional()
  @IsNumber()
  bondEndDate: number;
}

export class UpdateOtherData {
  @IsOptional()
  @IsString()
  employeeCode: string;

  @IsOptional()
  @IsNumber()
  bondStartDate: number;

  @IsOptional()
  @IsNumber()
  bondEndDate: number;
}
