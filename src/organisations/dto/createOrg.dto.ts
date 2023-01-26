import { IsNotEmpty, IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateOrganisationDto {
  @IsNotEmpty()
  @IsString()
  readonly name: string;
}