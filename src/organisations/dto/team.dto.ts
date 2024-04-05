import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class GetTeamDto {
  @IsOptional()
  @IsString()
  dateOfBirthStart: string;

  @IsOptional()
  @IsString()
  dateOfBirthEnd: string;

  @IsOptional()
  @IsString()
  bondEndDateStart: string;

  @IsOptional()
  @IsString()
  bondEndDateEnd: string;

  @IsOptional()
  @IsString()
  terminationDateStart: string;

  @IsOptional()
  @IsString()
  terminationDateEnd: string;

  @IsOptional()
  @IsString()
  joiningDateStart: string;

  @IsOptional()
  @IsString()
  joiningDateEnd: string;

  @IsOptional()
  @IsBoolean()
  isDeleted: boolean;

  @IsOptional()
  @IsString()
  search;
}
