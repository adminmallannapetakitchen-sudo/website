import { IsArray, IsInt, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class AddToCartDto {
  @IsString() menuItemId!: string;
  @IsOptional() @IsString() variantId?: string;
  @IsInt() @Min(1) @Max(99) qty!: number;
  @IsOptional() @IsString() notes?: string;
}

export class UpdateCartItemDto {
  @IsInt() @Min(0) @Max(99) qty!: number;
}

export class MergeCartDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddToCartDto)
  items!: AddToCartDto[];
}
