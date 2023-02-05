import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEodDto {
  @IsOptional()
  @IsString()
  description: string;
}
