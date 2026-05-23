import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class VerifyPaymentDto {
  @IsString() razorpayOrderId!: string;
  @IsString() razorpayPaymentId!: string;
  @IsString() razorpaySignature!: string;
  @IsString() internalOrderId!: string;
}

export class RefundDto {
  @IsOptional() @IsNumber() @Min(0.01) amount?: number;
  @IsOptional() @IsString() reason?: string;
}
