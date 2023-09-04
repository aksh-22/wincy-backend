import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export enum Type {
  LEAVE_FULL_DAY = 'LEAVE_FULL_DAY',
  LEAVE_FIRST_HALF = 'LEAVE_FIRST_HALF',
  LEAVE_SECOND_HALF = 'LEAVE_SECOND_HALF',
  WFH_FULL_DAY = 'WFH_FULL_DAY',
  WFH_FIRST_HALF = 'WFH_FIRST_HALF',
  WFH_SECOND_HALF = 'WFH_SECOND_HALF',
  EARLY_GOING = 'EARLY_GOING',
  LATE_COMING = 'LATE_COMING',
  BREAK = 'BREAK',
}

export enum Status {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export class CreateScheduleDto {
  // @IsNotEmpty()
  // // @IsArray()
  // readonly date: Date;

  @IsNotEmpty()
  @IsEnum(Type)
  readonly type: Type;

  @IsNotEmpty()
  @IsString()
  readonly reason: string;

  @IsOptional()
  @IsString()
  readonly time: string;

  @IsOptional()
  @IsObject()
  readonly duration: {
    hour: number;
    min: number;
  };

  readonly status: string;
}

export class PermitStatus {
  @IsNotEmpty()
  @IsEnum(Status)
  readonly status: Status;
}
