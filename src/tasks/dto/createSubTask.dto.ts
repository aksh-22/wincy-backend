import { IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class createSubTaskDto{
  @IsNotEmpty()
  @IsString()
  readonly description: string;
}