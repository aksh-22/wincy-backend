import { IsBoolean, IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export enum Priorities{
  Low = "Low",
  Medium = "Medium",
  High = "High",
}

export class UpdateSubTaskDto{
  @IsOptional()
  @IsString()
  readonly description: string;

  @IsOptional()
  @IsBoolean()
  readonly completed: boolean;

  @IsOptional()
  @IsString()
  readonly priority: Priorities;
}