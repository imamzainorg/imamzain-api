import {
  IsArray,
  IsString,
  IsBoolean,
  IsOptional,
  ValidateNested,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class BookTranslationDto {
  @IsString()
  languageCode: string;

  @IsBoolean()
  isDefault: boolean;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  author?: string;

  @IsOptional()
  @IsString()
  publisher?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  series?: string;

  @IsOptional()
  @IsString()
  metaTitle?: string;

  @IsOptional()
  @IsString()
  metaDescription?: string;
}

export class CreateBookDto {
  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  isbn?: string;

  @IsOptional()
  @IsNumber()
  pages?: number;

  @IsOptional()
  @IsNumber()
  partNumber?: number;

  @IsOptional()
  @IsNumber()
  totalParts?: number;

  @IsOptional()
  @IsString()
  publishYear?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsNumber()
  categoryId: number;

  @IsOptional()
  @IsNumber()
  coverId?: number;

  @IsOptional()
  @IsNumber()
  fileId?: number;

  @IsOptional()
  @IsNumber()
  parentBookId?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BookTranslationDto)
  translations: BookTranslationDto[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  tagIds?: number[];
}
