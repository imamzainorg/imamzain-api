import {
  IsArray,
  IsString,
  IsBoolean,
  IsOptional,
  ValidateNested,
  IsNumber,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ResearchTranslationDto {
  @IsString()
  languageCode: string;

  @IsBoolean()
  isDefault: boolean;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  abstract?: string;

  @IsOptional()
  @IsString()
  authors?: string;

  @IsOptional()
  @IsString()
  metaTitle?: string;

  @IsOptional()
  @IsString()
  metaDescription?: string;
}

export class CreateResearchDto {
  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsDateString()
  publishedAt?: string;

  @IsOptional()
  @IsNumber()
  pages?: number;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsNumber()
  categoryId: number;

  @IsOptional()
  @IsNumber()
  fileId?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ResearchTranslationDto)
  translations: ResearchTranslationDto[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  tagIds?: number[];
}
