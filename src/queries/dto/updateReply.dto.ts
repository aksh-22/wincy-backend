import { IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateReplyDto {
  @IsOptional()
  @IsString()
  description: string;
  @IsOptional()
  @IsString()
  deleteAttachments: string;
}