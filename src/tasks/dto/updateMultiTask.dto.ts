import { IsArray, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class MultiTaskUpdateDto {
    @IsString()
    @IsOptional()
    dueDate: string

    @IsArray()
    @IsOptional()
    assignees: [string];

    @IsArray()
    @IsNotEmpty()
    tasks: [string];

    @IsArray()
    @IsOptional()
    platforms: [string];
}