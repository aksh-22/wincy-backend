import { IsNotEmpty, IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class createLeadActDto {
  @IsNotEmpty()
  @IsString()
  activity: string;

  @IsOptional()
  @IsString()
  date: string;
}