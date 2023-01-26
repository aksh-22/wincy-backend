import { IsNumberString, IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  readonly name: string;
  @IsOptional()
  @IsString()
  readonly ifsc: string;
  @IsOptional()
  @IsString()
  readonly accountNumber: string;
  @IsOptional()
  @IsString()
  readonly phoneNumber: string;
  @IsOptional()
  @IsString()
  readonly dob: string;
}