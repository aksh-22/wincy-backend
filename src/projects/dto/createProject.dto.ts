import {
  IsEnum,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Project_Type } from '../enum/project.enum';

export class CreateProjectDto {
  @IsNotEmpty()
  @IsString()
  readonly title: string;
  @IsOptional()
  @IsString()
  description: string;
  @IsOptional()
  @IsString()
  awardedAt: any;
  @IsOptional()
  @IsString()
  startedAt: any;
  @IsOptional()
  @IsNumberString()
  expectedDuration: string;
  @IsOptional()
  @IsString()
  dueDate: any;
  @IsOptional()
  @IsString()
  category: string;
  @IsOptional()
  @IsString()
  client: string;
  @IsOptional()
  @IsString()
  clientCountry: string;
  @IsOptional()
  @IsString()
  clientEmail: string;
  @IsOptional()
  @IsNumberString()
  amount: string;
  @IsOptional()
  @IsString()
  currency: string;
  @IsOptional()
  @IsString()
  amountNote: string;
  @IsOptional()
  @IsString()
  paymentMode: string;
  @IsOptional()
  @IsString()
  technologies: any;
  @IsOptional()
  @IsString()
  platforms: any;

  @IsOptional()
  @IsEnum(Project_Type, { each: true })
  projectType: string;

  // @IsOptional()
  // @IsString()
  // sections: any
}
