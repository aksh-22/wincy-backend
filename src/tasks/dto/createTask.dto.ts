import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// export enum Priorities{
//   High = 'High',
//   Medium = 'Medium',
//   Low = 'Low'
// }

export enum Status {
  Completed = 'Completed',
  NotStarted = 'NotStarted',
  Active = 'Active',
  OnHold = 'OnHold',
}

export class CreateTaskDto {
  @IsNotEmpty()
  @IsString()
  readonly title: string;
  @IsOptional()
  @IsString()
  readonly description: string;
  @IsOptional()
  @IsString()
  readonly dueDate: string;
  // @IsOptional()
  // @IsEnum(Priorities)
  // readonly priority: Priorities;
  @IsOptional()
  @IsEnum(Status)
  readonly status: Status;
  @IsOptional()
  @IsArray()
  readonly assignees: [string];
  @IsOptional()
  @IsArray()
  readonly platforms: [string];
  @IsOptional()
  @IsString()
  readonly module: string;
  @IsOptional()
  @IsString()
  readonly parent: string;
  @IsOptional()
  @IsString()
  readonly mainParent: string;
}
