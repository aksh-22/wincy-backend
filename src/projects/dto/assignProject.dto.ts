import { IsArray, IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class AssignProjectDto {
  @IsOptional()
  @IsArray()
  readonly team: [string];
  @IsOptional()
  @IsString()
  readonly projectHead: string;
}