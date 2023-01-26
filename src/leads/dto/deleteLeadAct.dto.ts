import { IsArray, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class deleteLeadActivitiesDto {
  @IsOptional()
  @IsArray()
  activityIds: [string];
}