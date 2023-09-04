import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsInt,
  IsObject,
} from 'class-validator';

export class UpdateEodDto {
  @IsNotEmpty()
  @IsString()
  readonly eodId: string;

  @IsOptional()
  @IsString()
  readonly project: string;

  @IsOptional()
  @IsString()
  readonly description: string;

  @IsOptional()
  @IsString()
  readonly screenName: string;

  @IsOptional()
  @IsObject()
  readonly duration: {
    hour: number;
    min: number;
  };
}
