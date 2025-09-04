import { IsOptional, IsString } from 'class-validator';

export class UploadFileDto {
  @IsOptional()
  @IsString()
  collection?: string;

  @IsOptional()
  @IsString()
  altText?: string;

  @IsOptional()
  @IsString()
  metadata?: string;
}
