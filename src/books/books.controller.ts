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
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller(':lang/books')
export class PublicBooksController {
  constructor(private readonly booksService: BooksService) {}

  @Get()
  async findAll(
    @Param('lang') lang: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string,
  ) {
    const result = await this.booksService.findAll(
      lang,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      categoryId ? parseInt(categoryId) : undefined,
      search,
    );

    return {
      status: 'success',
      message: 'Books retrieved successfully',
      errors: null,
      data: result,
    };
  }

  @Get(':id')
  async findOne(
    @Param('lang') lang: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const book = await this.booksService.findOne(id, lang);
    return {
      status: 'success',
      message: 'Book retrieved successfully',
      errors: null,
      data: book,
    };
  }

  @Get('slug/:slug')
  async findBySlug(@Param('lang') lang: string, @Param('slug') slug: string) {
    const book = await this.booksService.findBySlug(slug, lang);
    return {
      status: 'success',
      message: 'Book retrieved successfully',
      errors: null,
      data: book,
    };
  }
}

@Controller('books')
@UseGuards(JwtAuthGuard)
export class PrivateBooksController {
  constructor(private readonly booksService: BooksService) {}

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string,
  ) {
    const result = await this.booksService.findAllLanguages(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      categoryId ? parseInt(categoryId) : undefined,
      search,
    );

    return {
      status: 'success',
      message: 'Books retrieved successfully',
      errors: null,
      data: result,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const book = await this.booksService.findOneAllLanguages(id);
    return {
      status: 'success',
      message: 'Book retrieved successfully',
      errors: null,
      data: book,
    };
  }

  @Post()
  async create(@Body() createBookDto: CreateBookDto) {
    const book = await this.booksService.create(createBookDto);
    return {
      status: 'success',
      message: 'Book created successfully',
      errors: null,
      data: book,
    };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBookDto: UpdateBookDto,
  ) {
    const book = await this.booksService.update(id, updateBookDto);
    return {
      status: 'success',
      message: 'Book updated successfully',
      errors: null,
      data: book,
    };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const book = await this.booksService.remove(id);
    return {
      status: 'success',
      message: 'Book deleted successfully',
      errors: null,
      data: book,
    };
  }

  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    const book = await this.booksService.findBySlugAllLanguages(slug);
    return {
      status: 'success',
      message: 'Book retrieved successfully',
      errors: null,
      data: book,
    };
  }
}
