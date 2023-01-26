import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

enum Categories {
  Meeting = "Meeting",
  Holiday = "Holiday",
  Event = "Event"
}

export class CreatePublicEventDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsEnum(Categories)
  category: Categories;

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

  @IsOptional()
  @IsArray()
  users: [string];

  @IsOptional()
  @IsString()
  project: string;
}

export class UpdatePublicEventDto {
  @IsOptional()
  @IsString()
  title: string;

  @IsOptional()
  @IsEnum(Categories)
  category: Categories;

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

  @IsOptional()
  @IsArray()
  users: [string];

  @IsOptional()
  @IsString()
  project: string;
}