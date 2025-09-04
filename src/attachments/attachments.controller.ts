import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Query,
  Req,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { FileInterceptor } from '@nestjs/platform-express';
import { AttachmentsService } from './attachments.service';
import { CreateAttachmentDto } from './dto/create-attachment.dto';
import { UpdateAttachmentDto } from './dto/update-attachment.dto';
import { UploadFileDto } from './dto/upload-file.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ResponseUtil } from '../common/utils/response.util';

@Controller('attachments')
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post()
  async create(@Body() createAttachmentDto: CreateAttachmentDto) {
    const attachment =
      await this.attachmentsService.create(createAttachmentDto);
    return ResponseUtil.success(attachment, 'Attachment created successfully');
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Extract form data from request body
    const collection = req.body?.collection;
    const altText = req.body?.altText;
    const metadata = req.body?.metadata;

    let parsedMetadata = null;
    if (metadata) {
      try {
        parsedMetadata = JSON.parse(metadata);
      } catch (error) {
        throw new BadRequestException('Invalid JSON in metadata field');
      }
    }

    const attachment = await this.attachmentsService.uploadFile(
      file,
      collection,
      altText,
      parsedMetadata,
    );

    return ResponseUtil.success(attachment, 'File uploaded successfully');
  }

  @Get()
  async findAll(@Query() paginationDto: PaginationDto) {
    const { page, limit } = paginationDto;
    const { data, meta } = await this.attachmentsService.findAll(page, limit);
    return ResponseUtil.paginated(
      data,
      meta,
      'Attachments retrieved successfully',
    );
  }

  @Get('file/:collection/:filename')
  serveFile(
    @Param('collection') collection: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const filePath = path.join(process.cwd(), 'uploads', collection, filename);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    return res.sendFile(filePath);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const attachment = await this.attachmentsService.findOne(id);
    return ResponseUtil.success(
      attachment,
      'Attachment retrieved successfully',
    );
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAttachmentDto: UpdateAttachmentDto,
  ) {
    const attachment = await this.attachmentsService.update(
      id,
      updateAttachmentDto,
    );
    return ResponseUtil.success(attachment, 'Attachment updated successfully');
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const attachment = await this.attachmentsService.remove(id);
    return ResponseUtil.success(attachment, 'Attachment deleted successfully');
  }
}
