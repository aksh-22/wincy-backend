import { IsArray, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class AddTransactionDto {
  @IsNotEmpty()
  @IsString()
  gatewayTransactionId: string;
  @IsNotEmpty()
  @IsString()
  amount: string;
  // @IsNotEmpty()
  // @IsString()
  // currency: string;

  @IsOptional()
  @IsString()
  description: string;
  @IsOptional()
  @IsString()
  gatewayFees: string;
  @IsOptional()
  @IsString()
  gateway: string;
  @IsOptional()
  @IsString()
  localCurrency: string;
  @IsOptional()
  @IsString()
  localEquivalentAmount: string;
  @IsOptional()
  @IsString()
  date: string;
}

export class UpdateTransactionDto {
  @IsOptional()
  @IsString()
  gatewayTransactionId: string;
  @IsOptional()
  @IsString()
  amount: string;
  // @IsOptional()
  // @IsString()
  // currency: string;
  @IsOptional()
  @IsString()
  description: string;
  @IsOptional()
  @IsString()
  gatewayFees: string;
  @IsOptional()
  @IsString()
  gateway: string;
  @IsOptional()
  @IsString()
  localCurrency: string;
  @IsOptional()
  @IsString()
  localEquivalentAmount: string;
  @IsOptional()
  @IsString()
  date: string;
  @IsOptional()
  @IsString()
  removeAttachments: string;
}