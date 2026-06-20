import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class VerifyPaymentDto {
  // Cashfree has no client-side signature — we confirm by fetching the order
  // status server-side using the internal order id (bound to a Cashfree order).
  @IsString() internalOrderId!: string;
}

export class RefundDto {
  @IsOptional() @IsNumber() @Min(0.01) amount?: number;
  @IsOptional() @IsString() reason?: string;
}
