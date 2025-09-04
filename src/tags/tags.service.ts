import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

@Injectable()
export class TagsService {
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

  private formatTagResponse(tag: any, lang?: string) {
    const translation = this.getTranslation(tag.translations, lang);

    return {
      id: tag.id,
      slug: tag.slug,
      name: translation?.name,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt,
    };
  }

  async create(createTagDto: CreateTagDto) {
    const defaultTranslation = createTagDto.translations.find(
      (t) => t.isDefault,
    );
    const slug =
      createTagDto.slug || this.generateSlug(defaultTranslation?.name || '');

    const existingTag = await this.prisma.tag.findUnique({
      where: { slug },
    });

    if (existingTag) {
      throw new ConflictException('Tag with this slug already exists');
    }

    return this.prisma.tag.create({
      data: {
        slug,
        translations: {
          create: createTagDto.translations,
        },
      },
      include: {
        translations: true,
      },
    });
  }

  async findAll(lang?: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [tags, total] = await Promise.all([
      this.prisma.tag.findMany({
        skip,
        take: limit,
        include: {
          translations: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.tag.count(),
    ]);

    return {
      items: tags.map((tag) => this.formatTagResponse(tag, lang)),
      pagination: {
        current_page: page,
        per_page: limit,
        total_items: total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number, lang?: string) {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
      include: {
        translations: true,
      },
    });

    if (!tag) {
      throw new NotFoundException(`Tag with ID ${id} not found`);
    }

    return this.formatTagResponse(tag, lang);
  }

  async findBySlug(slug: string, lang?: string) {
    const tag = await this.prisma.tag.findUnique({
      where: { slug },
      include: {
        translations: true,
      },
    });

    if (!tag) {
      throw new NotFoundException(`Tag with slug "${slug}" not found`);
    }

    return this.formatTagResponse(tag, lang);
  }

  async update(id: number, updateTagDto: UpdateTagDto) {
    await this.findOne(id);

    const updateData: any = {};

    if (updateTagDto.slug) {
      const existingTag = await this.prisma.tag.findFirst({
        where: {
          slug: updateTagDto.slug,
          id: { not: id },
        },
      });

      if (existingTag) {
        throw new ConflictException('Tag with this slug already exists');
      }

      updateData.slug = updateTagDto.slug;
    }

    if (updateTagDto.translations) {
      await this.prisma.tagTranslation.deleteMany({
        where: { tagId: id },
      });

      updateData.translations = {
        create: updateTagDto.translations,
      };
    }

    return this.prisma.tag.update({
      where: { id },
      data: updateData,
      include: {
        translations: true,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.tag.delete({
      where: { id },
      include: {
        translations: true,
      },
    });
  }

  async findAllLanguages(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [tags, total] = await Promise.all([
      this.prisma.tag.findMany({
        skip,
        take: limit,
        include: {
          translations: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.tag.count(),
    ]);

    return {
      items: tags.map((tag) => ({
        id: tag.id,
        slug: tag.slug,
        translations: tag.translations,
        createdAt: tag.createdAt,
        updatedAt: tag.updatedAt,
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
    const tag = await this.prisma.tag.findUnique({
      where: { id },
      include: {
        translations: true,
      },
    });

    if (!tag) {
      throw new NotFoundException(`Tag with ID ${id} not found`);
    }

    return {
      id: tag.id,
      slug: tag.slug,
      translations: tag.translations,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt,
    };
  }

  async findBySlugAllLanguages(slug: string) {
    const tag = await this.prisma.tag.findUnique({
      where: { slug },
      include: {
        translations: true,
      },
    });

    if (!tag) {
      throw new NotFoundException(`Tag with slug "${slug}" not found`);
    }

    return {
      id: tag.id,
      slug: tag.slug,
      translations: tag.translations,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt,
    };
  }
}
