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
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller(':lang/articles')
export class PublicArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Get()
  async findAll(
    @Param('lang') lang: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string,
  ) {
    const result = await this.articlesService.findAll(
      lang,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      categoryId ? parseInt(categoryId) : undefined,
      search,
    );

    return {
      status: 'success',
      message: 'Articles retrieved successfully',
      errors: null,
      data: result,
    };
  }

  @Get(':id')
  async findOne(
    @Param('lang') lang: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const article = await this.articlesService.findOne(id, lang);
    return {
      status: 'success',
      message: 'Article retrieved successfully',
      errors: null,
      data: article,
    };
  }

  @Get('slug/:slug')
  async findBySlug(@Param('lang') lang: string, @Param('slug') slug: string) {
    const article = await this.articlesService.findBySlug(slug, lang);
    return {
      status: 'success',
      message: 'Article retrieved successfully',
      errors: null,
      data: article,
    };
  }
}

@Controller('articles')
@UseGuards(JwtAuthGuard)
export class PrivateArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string,
  ) {
    const result = await this.articlesService.findAllLanguages(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      categoryId ? parseInt(categoryId) : undefined,
      search,
    );

    return {
      status: 'success',
      message: 'Articles retrieved successfully',
      errors: null,
      data: result,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const article = await this.articlesService.findOneAllLanguages(id);
    return {
      status: 'success',
      message: 'Article retrieved successfully',
      errors: null,
      data: article,
    };
  }

  @Post()
  async create(@Body() createArticleDto: CreateArticleDto) {
    const article = await this.articlesService.create(createArticleDto);
    return {
      status: 'success',
      message: 'Article created successfully',
      errors: null,
      data: article,
    };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateArticleDto: UpdateArticleDto,
  ) {
    const article = await this.articlesService.update(id, updateArticleDto);
    return {
      status: 'success',
      message: 'Article updated successfully',
      errors: null,
      data: article,
    };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const article = await this.articlesService.remove(id);
    return {
      status: 'success',
      message: 'Article deleted successfully',
      errors: null,
      data: article,
    };
  }

  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    const article = await this.articlesService.findBySlugAllLanguages(slug);
    return {
      status: 'success',
      message: 'Article retrieved successfully',
      errors: null,
      data: article,
    };
  }
}
