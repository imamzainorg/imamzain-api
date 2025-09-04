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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ModelType } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller(':lang/categories')
export class PublicCategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async findAll(
    @Param('lang') lang: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('model') model?: ModelType,
  ) {
    const result = await this.categoriesService.findAll(
      lang,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      model,
    );

    return {
      status: 'success',
      message: 'Categories retrieved successfully',
      errors: null,
      data: result,
    };
  }

  @Get(':id')
  async findOne(
    @Param('lang') lang: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const category = await this.categoriesService.findOne(id, lang);
    return {
      status: 'success',
      message: 'Category retrieved successfully',
      errors: null,
      data: category,
    };
  }

  @Get('slug/:slug')
  async findBySlug(@Param('lang') lang: string, @Param('slug') slug: string) {
    const category = await this.categoriesService.findBySlug(slug, lang);
    return {
      status: 'success',
      message: 'Category retrieved successfully',
      errors: null,
      data: category,
    };
  }
}

@Controller('categories')
@UseGuards(JwtAuthGuard)
export class PrivateCategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('model') model?: ModelType,
  ) {
    const result = await this.categoriesService.findAllLanguages(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      model,
    );

    return {
      status: 'success',
      message: 'Categories retrieved successfully',
      errors: null,
      data: result,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const category = await this.categoriesService.findOneAllLanguages(id);
    return {
      status: 'success',
      message: 'Category retrieved successfully',
      errors: null,
      data: category,
    };
  }

  @Post()
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    const category = await this.categoriesService.create(createCategoryDto);
    return {
      status: 'success',
      message: 'Category created successfully',
      errors: null,
      data: category,
    };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    const category = await this.categoriesService.update(id, updateCategoryDto);
    return {
      status: 'success',
      message: 'Category updated successfully',
      errors: null,
      data: category,
    };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const category = await this.categoriesService.remove(id);
    return {
      status: 'success',
      message: 'Category deleted successfully',
      errors: null,
      data: category,
    };
  }

  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    const category = await this.categoriesService.findBySlugAllLanguages(slug);
    return {
      status: 'success',
      message: 'Category retrieved successfully',
      errors: null,
      data: category,
    };
  }
}
