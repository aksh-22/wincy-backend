import { IsArray, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class DeleteQueriesDto {
  @IsNotEmpty()
  @IsArray()
  queries: [string];
}