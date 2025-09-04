import {
  IsArray,
  IsString,
  IsBoolean,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TagTranslationDto {
  @IsString()
  languageCode: string;

  @IsBoolean()
  isDefault: boolean;

  @IsString()
  name: string;
}

export class CreateTagDto {
  @IsOptional()
  @IsString()
  slug?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TagTranslationDto)
  translations: TagTranslationDto[];
}
