import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UpdateOrganisationDto {
  @IsOptional()
  @IsString()
  readonly name: string;
}