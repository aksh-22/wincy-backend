import { IsEnum, IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

enum Status {
  Open = "Open",
  Close = "Close"
}
export class UpdateQueryDto {
  @IsOptional()
  @IsString()
  title: string;
  @IsOptional()
  @IsString()
  description: string;
  @IsOptional()
  @IsString()
  deleteAttachments: string;
  @IsOptional()
  @IsEnum(Status)
  status: Status;
}