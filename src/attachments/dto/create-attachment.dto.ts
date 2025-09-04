import {
  IsString,
  IsOptional,
  IsObject,
  IsNumber,
  IsNotEmpty,
} from 'class-validator';

export class CreateAttachmentDto {
  // These fields are required by the database, so they should be required in the DTO.
  @IsString()
  @IsNotEmpty() // Ensure the string is not empty
  originalName: string;

  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  @IsNotEmpty()
  path: string;

  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @IsNumber()
  size: number;

  // These fields can remain optional.
  @IsOptional()
  @IsString()
  altText?: string;

  @IsOptional()
  @IsObject()
  metadata?: any;
}
