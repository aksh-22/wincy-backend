import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { TASK_STATUS_TYPE } from '../schema/task.enum';

export class GetTasksDto {
  @IsOptional()
  @IsEnum(TASK_STATUS_TYPE, { each: true })
  status: TASK_STATUS_TYPE[];

  @IsOptional()
  @IsArray()
  createdBy: string[];

  @IsOptional()
  @IsArray()
  assignees: string[];

  @IsOptional()
  @IsArray()
  platforms: string[];

  @IsOptional()
  @IsString()
  search: string;

  @IsOptional()
  @IsString()
  page: number;

  @IsOptional()
  @IsString()
  limit: number;
}
