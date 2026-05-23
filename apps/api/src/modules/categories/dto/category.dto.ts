import { IsBoolean, IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @IsString() @MinLength(1) name!: string;
  @IsOptional() @IsString() nameTe?: string;
  @IsString() @MinLength(1) slug!: string;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsString() icon?: string;
  @IsOptional() @IsInt() displayOrder?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpdateCategoryDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() nameTe?: string;
  @IsOptional() @IsString() slug?: string;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsString() icon?: string;
  @IsOptional() @IsInt() displayOrder?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
