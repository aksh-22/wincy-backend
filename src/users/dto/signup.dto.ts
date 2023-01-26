import {
  IsEmail,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty } from "@nestjs/swagger";


export class SignupDto {
  @IsNotEmpty()
  @IsString()
  readonly name: string;

  @IsOptional()
  @IsEmail()
  readonly email: string;

  @IsNotEmpty()
  @IsString()
  readonly password: string;

  @IsOptional()
  @IsString()
  readonly dob: string;
}

export class SignupAndJoinOrgDto {
  @IsNotEmpty()
  @IsString()
  readonly name: string;

  @IsNotEmpty()
  @IsString()
  readonly password: string;

  @IsOptional()
  @IsString()
  readonly dob: string;
}
