import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller(':lang/tags')
export class PublicTagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  async findAll(
    @Param('lang') lang: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.tagsService.findAll(
      lang,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );

    return {
      status: 'success',
      message: 'Tags retrieved successfully',
      errors: null,
      data: result,
    };
  }

  @Get(':id')
  async findOne(
    @Param('lang') lang: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const tag = await this.tagsService.findOne(id, lang);
    return {
      status: 'success',
      message: 'Tag retrieved successfully',
      errors: null,
      data: tag,
    };
  }

  @Get('slug/:slug')
  async findBySlug(@Param('lang') lang: string, @Param('slug') slug: string) {
    const tag = await this.tagsService.findBySlug(slug, lang);
    return {
      status: 'success',
      message: 'Tag retrieved successfully',
      errors: null,
      data: tag,
    };
  }
}

@Controller('tags')
@UseGuards(JwtAuthGuard)
export class PrivateTagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  async findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    const result = await this.tagsService.findAllLanguages(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );

    return {
      status: 'success',
      message: 'Tags retrieved successfully',
      errors: null,
      data: result,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const tag = await this.tagsService.findOneAllLanguages(id);
    return {
      status: 'success',
      message: 'Tag retrieved successfully',
      errors: null,
      data: tag,
    };
  }

  @Post()
  async create(@Body() createTagDto: CreateTagDto) {
    const tag = await this.tagsService.create(createTagDto);
    return {
      status: 'success',
      message: 'Tag created successfully',
      errors: null,
      data: tag,
    };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTagDto: UpdateTagDto,
  ) {
    const tag = await this.tagsService.update(id, updateTagDto);
    return {
      status: 'success',
      message: 'Tag updated successfully',
      errors: null,
      data: tag,
    };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const tag = await this.tagsService.remove(id);
    return {
      status: 'success',
      message: 'Tag deleted successfully',
      errors: null,
      data: tag,
    };
  }

  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    const tag = await this.tagsService.findBySlugAllLanguages(slug);
    return {
      status: 'success',
      message: 'Tag retrieved successfully',
      errors: null,
      data: tag,
    };
  }
}
