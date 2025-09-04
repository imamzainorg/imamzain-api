import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAttachmentDto } from './dto/create-attachment.dto';
import { UpdateAttachmentDto } from './dto/update-attachment.dto';
import { PaginationService } from '../common/services/pagination.service';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class AttachmentsService {
  constructor(
    private prisma: PrismaService,
    private paginationService: PaginationService,
  ) {}

  async create(createAttachmentDto: CreateAttachmentDto) {
    return this.prisma.attachments.create({
      data: createAttachmentDto,
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    collection?: string,
    altText?: string,
    metadata?: any,
  ) {
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    const uploadPath = path.join(
      process.cwd(),
      'uploads',
      collection || 'general',
    );

    // Ensure upload directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    const filePath = path.join(uploadPath, fileName);
    const relativePath = path
      .join('uploads', collection || 'general', fileName)
      .replace(/\\/g, '/');

    // Save file to disk
    fs.writeFileSync(filePath, file.buffer);

    const attachment = await this.create({
      originalName: file.originalname,
      fileName,
      path: relativePath,
      mimeType: file.mimetype,
      size: file.size,
      altText,
      metadata,
    });

    // Add full URL to the response
    return {
      ...attachment,
      url: `/attachments/file/${collection || 'general'}/${fileName}`,
    };
  }

  async findAll(page: number = 1, limit: number = 10) {
    const { data, meta } = await this.paginationService.paginate(
      this.prisma.attachments,
      { page, limit },
      { orderBy: { createdAt: 'desc' } },
    );

    return { data, meta };
  }

  async findOne(id: number) {
    const attachment = await this.prisma.attachments.findUnique({
      where: { id },
    });

    if (!attachment) {
      throw new NotFoundException(`Attachment with ID ${id} not found`);
    }

    return attachment;
  }

  async update(id: number, updateAttachmentDto: UpdateAttachmentDto) {
    await this.findOne(id);

    return this.prisma.attachments.update({
      where: { id },
      data: updateAttachmentDto,
    });
  }

  async remove(id: number) {
    const attachment = await this.findOne(id);

    // Delete file from disk
    const filePath = path.join(process.cwd(), attachment.path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return this.prisma.attachments.delete({
      where: { id },
    });
  }
}
