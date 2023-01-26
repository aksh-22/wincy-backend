import { IsNotEmpty, IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class updateLeadActDto {
  @IsOptional()
  @IsString()
  activity: string;

  @IsOptional()
  @IsString()
  date: string;
}