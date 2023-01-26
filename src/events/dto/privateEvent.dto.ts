import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreatePrivateEventDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  date: string;

  @IsOptional()
  @IsBoolean()
  isRange: boolean;

  @IsOptional()
  @IsString()
  dateFrom: string;

  @IsOptional()
  @IsString()
  dateTo: string;
}

export class UpdatePrivateEventDto {
  @IsOptional()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  date: string;

  @IsOptional()
  @IsBoolean()
  isRange: boolean;

  @IsOptional()
  @IsString()
  dateFrom: string;

  @IsOptional()
  @IsString()
  dateTo: string;
}