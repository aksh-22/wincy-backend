import { IsArray, IsEnum, IsNotEmpty, IsNumberString, IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export enum Status{
  Active = "Active",
  Completed = "Completed",
  OnHold = "OnHold"
}

export class UpdateProjectDto{
  @IsOptional()
  @IsString()
  readonly title: string;
  @IsOptional()
  @IsString()
  description:string;
  @IsOptional()
  @IsString()
  awardedAt: any;
  @IsOptional()
  @IsString()
  startedAt: any;
  @IsOptional()
  @IsNumberString()
  expectedDuration: string;
  @IsOptional()
  @IsString()
  dueDate: any;
  @IsOptional()
  @IsString()
  category: string;
  @IsOptional()
  @IsString()
  client: string;
  @IsOptional()
  @IsString()
  clientCountry: string;
  @IsOptional()
  @IsString()
  clientEmail: string;
  @IsOptional()
  @IsNumberString()
  amount: string;
  @IsOptional()
  @IsString()
  currency: string;
  @IsOptional()
  @IsString()
  paymentMode: string;
  @IsOptional()
  @IsString()
  amountNote: string;
  @IsOptional()
  @IsString()
  technologies: any;
  @IsOptional()
  @IsString()
  completedAt: string;
  @IsOptional()
  @IsString()
  platforms: any;
  @IsOptional()
  @IsEnum(Status)
  status: Status;
  @IsOptional()
  @IsString()
  readonly onHoldReason: string;
  // @IsOptional()
  // @IsString()
  // sections: any
}

export class RemoveAttachmentsDto{
  @IsOptional()
  @IsString()
  folder: string;
  @IsOptional()
  @IsArray()
  attachments: [string];
  @IsOptional()
  @IsArray()
  storageLinks: [string];
}

