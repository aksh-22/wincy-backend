import { IsNotEmpty, IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class AddReplyDto {
  @IsNotEmpty()
  @IsString()
  description: string;
}