import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum UserType {
  'Member++' = 'Member++',
  'Member+' = 'Member+',
  'Memeber' = 'Member',
  'Admin' = 'Admin',
}

export class updateRoleDto {
  @IsOptional()
  @IsEnum(UserType)
  readonly userType: UserType;

  @IsOptional()
  @IsString()
  readonly designation: string;
}
