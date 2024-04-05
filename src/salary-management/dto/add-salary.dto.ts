import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';

// export class AddSalaryDto {
//   @IsNotEmpty()
//   @IsString()
//   userId: any;

//   @IsNotEmpty()
//   @IsNumber()
//   startDate: number;

//   @IsNotEmpty()
//   @IsNumber()
//   endDate: number;

//   @IsNotEmpty()
//   @IsNumber()
//   salary: number;
// }

export class SalaryDto {
  @IsNotEmpty()
  @IsString()
  userId: any;

  @IsNotEmpty()
  @IsNumber()
  startDate: number;

  @IsNotEmpty()
  @IsNumber()
  endDate: number;

  @IsNotEmpty()
  @IsNumber()
  salary: number;
}

export class AddSalaryDto {
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => SalaryDto)
  @IsArray()
  data: SalaryDto[];
}
