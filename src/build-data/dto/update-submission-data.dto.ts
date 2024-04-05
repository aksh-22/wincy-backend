import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateBuildSubmissionDto {
  @IsOptional()
  @IsString()
  link: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsString()
  buildDataId: string;

  @IsNotEmpty()
  @IsString()
  submissionId: string;

  @IsOptional()
  @IsArray()
  completedTasks: any[];

  @IsOptional()
  @IsArray()
  remainingTasks: any[];
}
