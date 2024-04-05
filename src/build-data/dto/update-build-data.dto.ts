import { PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { CreateBuildDto } from './create-build-data.dto';

export class UpdateBuildDto extends PartialType(CreateBuildDto) {
  @IsNotEmpty()
  @IsString()
  buildDataId: string;
}
