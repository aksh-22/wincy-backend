import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export enum Status{
  NotStarted = "NotStarted",
  Active = "Active",
  Completed = "Completed"
}

export class UpdateMilestoneDto {
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
  @IsEnum(Status)
  readonly status: Status;
  @IsOptional()
  @IsString()
  readonly amount: number;
  @IsOptional()
  @IsBoolean()
  readonly isSettled: boolean;
  @IsOptional()
  @IsString()
  readonly settledOn: string;
  @IsOptional()
  @IsString()
  readonly paymentMode: string;
  @IsOptional()
  @IsString()
  readonly currency: string;
}
