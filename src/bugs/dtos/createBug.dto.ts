import { IsEnum, IsNotEmpty, IsOptional, IsString, IsArray } from "class-validator";
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

export class CreateBugDto {
  @IsNotEmpty()
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
  @IsString()
  section: string;
  @IsOptional()
  @IsArray()
  driveUrls: [string];
}
