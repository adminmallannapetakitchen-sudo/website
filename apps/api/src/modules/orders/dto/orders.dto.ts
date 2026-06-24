import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { OrderStatus } from '@prisma/client';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus) status!: OrderStatus;
  @IsOptional() @IsString() @MaxLength(500) notes?: string;
}

export class RateOrderDto {
  @IsInt() @Min(1) @Max(5) rating!: number;
  @IsOptional() @IsString() @MaxLength(500) comment?: string;
}

export class CancelOrderDto {
  @IsOptional() @IsString() @MaxLength(500) reason?: string;
}

export class ListOrdersQueryDto {
  @IsOptional() @IsEnum(OrderStatus) status?: OrderStatus;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsInt() @Min(1) page?: number;
  @IsOptional() @IsInt() @Min(1) pageSize?: number;
}
