import { IsNotEmpty, IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateQueryDto {
  @IsNotEmpty()
  @IsString()
  title: string;
  @IsOptional()
  @IsString()
  description: string;
}