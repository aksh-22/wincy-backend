import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNotEmpty, IsOptional, IsString } from "class-validator"

export class AddSubsiduaryDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  address: string;

  @IsOptional()
  @IsString()
  gstNo: string;

  @IsOptional()
  @IsString()
  additionalInfo: string;
}

export class UpdateSubsiduaryDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  address: string;

  @IsOptional()
  @IsString()
  gstNo: string;

  @IsOptional()
  @IsString()
  additionalInfo: string;
}

export class DeleteSubsiduariesDto { 
  @IsNotEmpty()
  @IsArray()
  subsiduaries: [string];
}