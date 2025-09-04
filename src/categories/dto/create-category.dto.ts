import {
  IsArray,
  IsString,
  IsBoolean,
  IsOptional,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ModelType } from '@prisma/client';

export class CategoryTranslationDto {
  @IsString()
  languageCode: string;

  @IsBoolean()
  isDefault: boolean;

  @IsString()
  name: string;
}

export class CreateCategoryDto {
  @IsOptional()
  @IsString()
  slug?: string;

  @IsEnum(ModelType)
  model: ModelType;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryTranslationDto)
  translations: CategoryTranslationDto[];
}
