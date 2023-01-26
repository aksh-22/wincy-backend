import { IsArray, IsBoolean, IsBooleanString, IsEnum, IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

// export enum Severities{
//   Major = "Major", 
//   Minor = "Minor", 
//   Critical = "Critical", 
//   Blocker = "Blocker"
// }

export enum Priorities{
  High = "High", 
  Medium = "Medium", 
  Low = "Low"
}

export enum Status {
  Open = "Open",
  InProgress = "InProgress",
  UnderReview = "UnderReview",
  Done = "Done",
  BugPersists = "BugPersists"
}

export class UpdateBugDto{
  @IsOptional()
  @IsString()
  title: string;
  @IsOptional()
  @IsString()
  description: string;
  @IsOptional()
  @IsString()
  platform: string;
  @IsOptional()
  @IsString()
  taskId: string;
  @IsOptional()
  @IsArray()
  assignees: [string];
  // @IsOptional()
  // @IsEnum(Severities)
  // severity: Severities;
  @IsOptional()
  @IsEnum(Priorities)
  priority: Priorities;
  @IsOptional()
  @IsBooleanString()
  isCompleted: string;
  @IsOptional()
  @IsString()
  comment: string;
  @IsOptional()
  @IsEnum(Status)
  status: Status;
  @IsOptional()
  @IsString()
  section: string;
  @IsOptional()
  @IsArray()
  driveUrls: [string];
}
