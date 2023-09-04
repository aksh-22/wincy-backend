import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsString,
  MaxLength,
  ValidateNested,
  isObject,
} from 'class-validator';

export class EodDto {
  @IsNotEmpty()
  readonly project: string;

  @IsNotEmpty()
  readonly description: string;

  @IsNotEmpty()
  readonly screenName: string;

  @IsNotEmpty()
  @IsObject()
  readonly duration: {
    hour: number;
    min: number;
  };
}

export class CreateEodDto {
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => EodDto)
  @IsArray()
  data: EodDto[];
}
