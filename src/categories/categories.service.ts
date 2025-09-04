import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ModelType } from '@prisma/client';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  }

  private getTranslation(translations: any[], lang?: string) {
    if (!lang) {
      return translations.find((t) => t.isDefault) || translations[0];
    }
    return (
      translations.find((t) => t.languageCode === lang) ||
      translations.find((t) => t.isDefault) ||
      translations[0]
    );
  }

  private formatCategoryResponse(category: any, lang?: string) {
    const translation = this.getTranslation(category.translations, lang);

    return {
      id: category.id,
      slug: category.slug,
      name: translation?.name,
      model: category.model,
      isActive: category.isActive,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }

  async create(createCategoryDto: CreateCategoryDto) {
    const defaultTranslation = createCategoryDto.translations.find(
      (t) => t.isDefault,
    );
    const slug =
      createCategoryDto.slug ||
      this.generateSlug(defaultTranslation?.name || '');

    const existingCategory = await this.prisma.category.findUnique({
      where: { slug },
    });

    if (existingCategory) {
      throw new ConflictException('Category with this slug already exists');
    }

    return this.prisma.category.create({
      data: {
        slug,
        model: createCategoryDto.model,
        isActive: createCategoryDto.isActive ?? true,
        translations: {
          create: createCategoryDto.translations,
        },
      },
      include: {
        translations: true,
      },
    });
  }

  async findAll(lang?: string, page = 1, limit = 10, model?: ModelType) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (model) {
      where.model = model;
    }

    const [categories, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        skip,
        take: limit,
        include: {
          translations: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.category.count({ where }),
    ]);

    return {
      items: categories.map((category) =>
        this.formatCategoryResponse(category, lang),
      ),
      pagination: {
        current_page: page,
        per_page: limit,
        total_items: total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number, lang?: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        translations: true,
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return this.formatCategoryResponse(category, lang);
  }

  async findBySlug(slug: string, lang?: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        translations: true,
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with slug "${slug}" not found`);
    }

    return this.formatCategoryResponse(category, lang);
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    await this.findOne(id);

    const updateData: any = {};

    if (updateCategoryDto.slug) {
      const existingCategory = await this.prisma.category.findFirst({
        where: {
          slug: updateCategoryDto.slug,
          id: { not: id },
        },
      });

      if (existingCategory) {
        throw new ConflictException('Category with this slug already exists');
      }

      updateData.slug = updateCategoryDto.slug;
    }

    if (updateCategoryDto.model) {
      updateData.model = updateCategoryDto.model;
    }

    if (updateCategoryDto.isActive !== undefined) {
      updateData.isActive = updateCategoryDto.isActive;
    }

    if (updateCategoryDto.translations) {
      await this.prisma.categoryTranslation.deleteMany({
        where: { categoryId: id },
      });

      updateData.translations = {
        create: updateCategoryDto.translations,
      };
    }

    return this.prisma.category.update({
      where: { id },
      data: updateData,
      include: {
        translations: true,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.category.delete({
      where: { id },
      include: {
        translations: true,
      },
    });
  }

  async findAllLanguages(page = 1, limit = 10, model?: ModelType) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (model) {
      where.model = model;
    }

    const [categories, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        skip,
        take: limit,
        include: {
          translations: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.category.count({ where }),
    ]);

    return {
      items: categories.map((category) => ({
        id: category.id,
        slug: category.slug,
        translations: category.translations,
        model: category.model,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      })),
      pagination: {
        current_page: page,
        per_page: limit,
        total_items: total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  async findOneAllLanguages(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        translations: true,
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return {
      id: category.id,
      slug: category.slug,
      translations: category.translations,
      model: category.model,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }

  async findBySlugAllLanguages(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        translations: true,
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with slug "${slug}" not found`);
    }

    return {
      id: category.id,
      slug: category.slug,
      translations: category.translations,
      model: category.model,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }
}
