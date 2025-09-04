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
import { ResearchService } from './research.service';
import { CreateResearchDto } from './dto/create-research.dto';
import { UpdateResearchDto } from './dto/update-research.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller(':lang/research')
export class PublicResearchController {
  constructor(private readonly researchService: ResearchService) {}

  @Get()
  async findAll(
    @Param('lang') lang: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string,
    @Query('year') year?: string,
    @Query('dateFrom') dateFrom?: string,
  ) {
    const result = await this.researchService.findAll(
      lang,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      categoryId ? parseInt(categoryId) : undefined,
      search,
      year,
      dateFrom,
    );

    return {
      status: 'success',
      message: 'Research retrieved successfully',
      errors: null,
      data: result,
    };
  }

  @Get(':id')
  async findOne(
    @Param('lang') lang: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const research = await this.researchService.findOne(id, lang);
    return {
      status: 'success',
      message: 'Research retrieved successfully',
      errors: null,
      data: research,
    };
  }

  @Get('slug/:slug')
  async findBySlug(@Param('lang') lang: string, @Param('slug') slug: string) {
    const research = await this.researchService.findBySlug(slug, lang);
    return {
      status: 'success',
      message: 'Research retrieved successfully',
      errors: null,
      data: research,
    };
  }
}

@Controller('research')
@UseGuards(JwtAuthGuard)
export class PrivateResearchController {
  constructor(private readonly researchService: ResearchService) {}

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string,
    @Query('year') year?: string,
    @Query('dateFrom') dateFrom?: string,
  ) {
    const result = await this.researchService.findAllLanguages(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      categoryId ? parseInt(categoryId) : undefined,
      search,
      year,
      dateFrom,
    );

    return {
      status: 'success',
      message: 'Research retrieved successfully',
      errors: null,
      data: result,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const research = await this.researchService.findOneAllLanguages(id);
    return {
      status: 'success',
      message: 'Research retrieved successfully',
      errors: null,
      data: research,
    };
  }

  @Post()
  async create(@Body() createResearchDto: CreateResearchDto) {
    const research = await this.researchService.create(createResearchDto);
    return {
      status: 'success',
      message: 'Research created successfully',
      errors: null,
      data: research,
    };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateResearchDto: UpdateResearchDto,
  ) {
    const research = await this.researchService.update(id, updateResearchDto);
    return {
      status: 'success',
      message: 'Research updated successfully',
      errors: null,
      data: research,
    };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const research = await this.researchService.remove(id);
    return {
      status: 'success',
      message: 'Research deleted successfully',
      errors: null,
      data: research,
    };
  }

  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    const research = await this.researchService.findBySlugAllLanguages(slug);
    return {
      status: 'success',
      message: 'Research retrieved successfully',
      errors: null,
      data: research,
    };
  }
}
