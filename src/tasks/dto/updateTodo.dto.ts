import { IsBoolean, IsOptional, IsString } from "class-validator"
import { ApiProperty } from "@nestjs/swagger";

export class UpdateTodoDto {
  @IsOptional()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  assignee: string;

  @IsOptional()
  @IsBoolean()
  completed: boolean;

  @IsOptional()
  @IsString()
  description: string;
}