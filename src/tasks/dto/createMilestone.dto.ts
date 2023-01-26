import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export enum Status{
  NotStarted = "NotStarted",
  Active = "Active",
  Completed = "Completed"
}

export class CreateMilestoneDto {
  @IsNotEmpty()
  @IsString()
  readonly title: string;
  @IsOptional()
  @IsString()
  readonly description: string;
  @IsOptional()
  @IsString()
  dueDate: any;
  @IsOptional()
  @IsEnum(Status)
  status: Status;
  @IsOptional()
  @IsString()
  amount: string;
  @IsOptional()
  @IsString()
  currency: string;
}