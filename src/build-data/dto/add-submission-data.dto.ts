import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SubmitBuildDataDto {
  @IsNotEmpty()
  @IsString()
  link: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsString()
  buildDataId: string;

  @IsOptional()
  @IsArray()
  completedTasks: any[];

  @IsOptional()
  @IsArray()
  remainingTasks: any[];
}
