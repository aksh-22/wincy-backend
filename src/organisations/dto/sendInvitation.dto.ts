import { IsNotEmpty, IsString, IsEmail, IsOptional, IsEnum } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export enum UserType{
  "Member++" = "Member++",
  "Member+" = "Member+",
  "Member" = "Member",
}

export class SendInvitationDto {
  @IsNotEmpty()
  @IsEmail()
  @IsString()
  readonly email: string;

  @IsNotEmpty()
  @IsEnum(UserType)
  readonly userType: UserType;

  @IsOptional()
  @IsString()
  readonly designation: string;
}