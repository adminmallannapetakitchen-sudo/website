import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class VariantInput {
  @IsOptional() @IsString() id?: string;
  @IsString() label!: string;
  @IsOptional() @IsString() labelTe?: string;
  @IsNumber() price!: number;
  @IsOptional() @IsInt() displayOrder?: number;
  @IsOptional() @IsBoolean() isAvailable?: boolean;
}

export class AddonInput {
  @IsOptional() @IsString() id?: string;
  @IsString() label!: string;
  @IsOptional() @IsString() labelTe?: string;
  @IsNumber() price!: number;
}

export class CreateMenuItemDto {
  @IsString() categoryId!: string;
  @IsString() @MinLength(1) name!: string;
  @IsOptional() @IsString() nameTe?: string;
  @IsString() @MinLength(1) slug!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() descriptionTe?: string;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsBoolean() isVeg?: boolean;
  @IsOptional() @IsBoolean() isAvailable?: boolean;
  @IsOptional() @IsBoolean() isBestseller?: boolean;
  @IsOptional() @IsBoolean() isSundaySpecialCandidate?: boolean;
  @IsOptional() @IsInt() displayOrder?: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => VariantInput)
  variants!: VariantInput[];

  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => AddonInput) addons?: AddonInput[];
}

export class UpdateMenuItemDto {
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() nameTe?: string;
  @IsOptional() @IsString() slug?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() descriptionTe?: string;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsBoolean() isVeg?: boolean;
  @IsOptional() @IsBoolean() isAvailable?: boolean;
  @IsOptional() @IsBoolean() isBestseller?: boolean;
  @IsOptional() @IsBoolean() isSundaySpecialCandidate?: boolean;
  @IsOptional() @IsInt() displayOrder?: number;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => VariantInput) variants?: VariantInput[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => AddonInput) addons?: AddonInput[];
}

export class ToggleAvailabilityDto {
  @IsBoolean() isAvailable!: boolean;
}
