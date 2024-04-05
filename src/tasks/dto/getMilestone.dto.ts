import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetMilestoneFilterDto {
  @IsOptional()
  @IsString()
  search: string;

  @IsOptional()
  @IsArray()
  status: string[];

  @IsOptional()
  @IsArray()
  assignees: string[];

  @IsOptional()
  @IsArray()
  createdBy: string[];

  @IsOptional()
  @IsString()
  startDate: string;

  @IsOptional()
  @IsString()
  endDate: string;
}
