import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MoveTasksDto {
  @IsNotEmpty()
  @IsArray()
  tasks: [string];

  @IsOptional()
  @IsString()
  module: string;

  @IsOptional()
  @IsString()
  milestone: string;
}
