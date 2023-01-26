import { IsArray, IsNotEmpty, IsNumber } from "class-validator";

export class createBugReportDto {
  @IsNotEmpty()
  @IsNumber()
  consumedTime: number;
}

export class updateBugReportDto {
  @IsNotEmpty()
  @IsNumber()
  consumedTime: number;
}