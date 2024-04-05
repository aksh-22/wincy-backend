import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateSalaryDto {
  @IsOptional()
  @IsNumber()
  startDate: number;

  @IsOptional()
  @IsNumber()
  endDate: number;

  @IsOptional()
  @IsNumber()
  salary: number;
}
