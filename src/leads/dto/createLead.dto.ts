import { IsArray, IsEmail, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export enum Status{
  Active = "Active",
  Idle = "Idle",
  Awarded = "Awarded",
  Rejected = "Rejected"
}

export class CreateLeadDto{
  @IsNotEmpty()
  @IsString()
  name: string;
  @IsOptional()
  @IsEmail()
  email: string;
  @IsOptional()
  @IsString()
  country: string;
  @IsOptional()
  @IsString()
  contactNumber: string;
  @IsOptional()
  @IsString()
  reference: string;
  @IsOptional()
  @IsArray()
  platforms: [string];
  @IsOptional()
  @IsString()
  description: string;
  @IsOptional()
  @IsString()
  budgetExpectation: string;
  @IsOptional()
  @IsString()
  currency: string;
  @IsOptional()
  @IsNumber()
  durationExpectation: number;
  @IsOptional()
  @IsString()
  dateContactedFirst: string;
  @IsOptional()
  @IsEnum(Status)
  status: Status;
  @IsOptional()
  @IsString()
  nextFollowUp: string;
  @IsOptional()
  @IsNumber()
  durationProposed: number;
  @IsOptional()
  @IsString()
  budgetProposed: string;
  @IsOptional()
  @IsString()
  leadName: string;
  @IsOptional()
  @IsString()
  settledFor: string;
  @IsOptional()
  @IsString()
  domain: string;
  @IsOptional()
  @IsString()
  proposalLink: string;
  @IsOptional()
  @IsString()
  managedBy: string;
}