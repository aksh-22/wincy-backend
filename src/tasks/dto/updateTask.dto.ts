import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export enum Priorities{
  High = 'High',
  Medium = 'Medium',
  Low = 'Low'
}

export enum Status{
  Completed = "Completed",
  NotStarted = "NotStarted",
  Active = "Active",
  OnHold = "OnHold",
  WaitingForReview = "WaitingForReview", 
  UnderReview = "UnderReview", 
  ReviewFailed = "ReviewFailed",
}

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  readonly title: string;
  @IsOptional()
  @IsString()
  readonly description: string;
  @IsOptional()
  @IsString()
  readonly dueDate: string;
  @IsOptional()
  @IsEnum(Priorities)
  readonly priority: Priorities;
  @IsOptional()
  @IsEnum(Status)
  readonly status: Status;
  @IsOptional()
  @IsArray()
  readonly assignees: [string];
  @IsOptional()
  @IsNumber()
  readonly timeConsumed: number;
  @IsOptional()
  @IsString()
  readonly date: string;
  @IsOptional()
  @IsArray()
  readonly platforms: [string];
  @IsOptional()
  @IsString()
  readonly module: string;
  @IsOptional()
  @IsEnum(Status)
  readonly myStatus: Status;
  @IsOptional()
  @IsString()
  readonly onHoldReason: string;
}