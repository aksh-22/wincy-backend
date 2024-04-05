import { IsArray, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateBuildDto {
  @IsNotEmpty()
  @IsNumber()
  submittedToBe: number;

  @IsNotEmpty()
  @IsString()
  projectId: string;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsArray()
  taskIds: string[];

  @IsNotEmpty()
  @IsArray()
  assignedTo: string[];
}
