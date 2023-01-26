import { IsArray, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class DeleteRepliesDto {
  @IsNotEmpty()
  @IsArray()
  replies: [string];
}