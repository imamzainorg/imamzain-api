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

export class ArticleTranslationDto {
  @IsString()
  languageCode: string;

  @IsBoolean()
  isDefault: boolean;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsString()
  body: string;
}

export class CreateArticleDto {
  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsDateString()
  publishedAt?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsNumber()
  categoryId: number;

  @IsOptional()
  @IsNumber()
  mainImageId?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ArticleTranslationDto)
  translations: ArticleTranslationDto[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  tagIds?: number[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  attachmentIds?: number[];
}
