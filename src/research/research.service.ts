import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateResearchDto } from './dto/create-research.dto';
import { UpdateResearchDto } from './dto/update-research.dto';

@Injectable()
export class ResearchService {
  constructor(private prisma: PrismaService) {}

  private generateSlug(title: string): string {
    return title
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

  private formatResearchResponse(research: any, lang?: string) {
    const translation = this.getTranslation(research.translations, lang);
    const categoryTranslation = research.category
      ? this.getTranslation(research.category.translations, lang)
      : null;

    return {
      id: research.id,
      slug: research.slug,
      title: translation?.title,
      abstract: translation?.abstract,
      authors: translation?.authors,
      categoryId: research.categoryId,
      category: research.category
        ? {
            id: research.category.id,
            slug: research.category.slug,
            name: categoryTranslation?.name,
            createdAt: research.category.createdAt,
            updatedAt: research.category.updatedAt,
          }
        : null,
      fileId: research.fileId,
      file: research.file,
      publishedAt: research.publishedAt,
      isPublished: research.isPublished,
      views: research.views,
      createdAt: research.createdAt,
      updatedAt: research.updatedAt,
      tags:
        research.tags?.map((researchTag: any) => {
          const tagTranslation = this.getTranslation(
            researchTag.tag.translations,
            lang,
          );
          return {
            id: researchTag.tag.id,
            slug: researchTag.tag.slug,
            name: tagTranslation?.name,
            createdAt: researchTag.tag.createdAt,
            updatedAt: researchTag.tag.updatedAt,
          };
        }) || [],
    };
  }

  async create(createResearchDto: CreateResearchDto) {
    const defaultTranslation = createResearchDto.translations.find(
      (t) => t.isDefault,
    );
    const slug =
      createResearchDto.slug ||
      this.generateSlug(defaultTranslation?.title || '');

    const existingResearch = await this.prisma.research.findUnique({
      where: { slug },
    });

    if (existingResearch) {
      throw new ConflictException('Research with this slug already exists');
    }

    const { tagIds, ...researchData } = createResearchDto;

    const research = await this.prisma.research.create({
      data: {
        ...researchData,
        slug,
        publishedAt: createResearchDto.publishedAt
          ? new Date(createResearchDto.publishedAt)
          : null,
        translations: {
          create: createResearchDto.translations,
        },
        ...(tagIds &&
          tagIds.length > 0 && {
            tags: {
              create: tagIds.map((tagId) => ({ tagId })),
            },
          }),
      },
      include: {
        translations: true,
        tags: {
          include: {
            tag: {
              include: {
                translations: true,
              },
            },
          },
        },
        category: {
          include: {
            translations: true,
          },
        },
        file: true,
      },
    });

    return research;
  }

  async findAll(
    lang?: string,
    page = 1,
    limit = 10,
    categoryId?: number,
    search?: string,
    year?: string,
    dateFrom?: string,
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where.translations = {
        some: {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { abstract: { contains: search, mode: 'insensitive' } },
            { authors: { contains: search, mode: 'insensitive' } },
          ],
          ...(lang && { languageCode: lang }),
        },
      };
    }

    if (year) {
      const startDate = new Date(`${year}-01-01`);
      const endDate = new Date(`${year}-12-31`);
      where.publishedAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    if (dateFrom) {
      where.publishedAt = {
        gte: new Date(dateFrom),
      };
    }

    const [research, total] = await Promise.all([
      this.prisma.research.findMany({
        where,
        skip,
        take: limit,
        include: {
          translations: true,
          tags: {
            include: {
              tag: {
                include: {
                  translations: true,
                },
              },
            },
          },
          category: {
            include: {
              translations: true,
            },
          },
          file: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.research.count({ where }),
    ]);

    return {
      items: research.map((item) => this.formatResearchResponse(item, lang)),
      pagination: {
        current_page: page,
        per_page: limit,
        total_items: total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number, lang?: string) {
    const research = await this.prisma.research.findUnique({
      where: { id },
      include: {
        translations: true,
        tags: {
          include: {
            tag: {
              include: {
                translations: true,
              },
            },
          },
        },
        category: {
          include: {
            translations: true,
          },
        },
        file: true,
      },
    });

    if (!research) {
      throw new NotFoundException(`Research with ID ${id} not found`);
    }

    // Increment views
    await this.prisma.research.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    return this.formatResearchResponse(research, lang);
  }

  async findBySlug(slug: string, lang?: string) {
    const research = await this.prisma.research.findUnique({
      where: { slug },
      include: {
        translations: true,
        tags: {
          include: {
            tag: {
              include: {
                translations: true,
              },
            },
          },
        },
        category: {
          include: {
            translations: true,
          },
        },
        file: true,
      },
    });

    if (!research) {
      throw new NotFoundException(`Research with slug "${slug}" not found`);
    }

    // Increment views
    await this.prisma.research.update({
      where: { slug },
      data: { views: { increment: 1 } },
    });

    return this.formatResearchResponse(research, lang);
  }

  async update(id: number, updateResearchDto: UpdateResearchDto) {
    await this.findOne(id);

    const { tagIds, translations, ...updateData } = updateResearchDto;

    if (updateResearchDto.slug) {
      const existingResearch = await this.prisma.research.findFirst({
        where: {
          slug: updateResearchDto.slug,
          id: { not: id },
        },
      });

      if (existingResearch) {
        throw new ConflictException('Research with this slug already exists');
      }
    }

    const research = await this.prisma.research.update({
      where: { id },
      data: {
        ...updateData,
        ...(updateResearchDto.publishedAt && {
          publishedAt: new Date(updateResearchDto.publishedAt),
        }),
        ...(translations && {
          translations: {
            deleteMany: {},
            create: translations,
          },
        }),
        ...(tagIds !== undefined && {
          tags: {
            deleteMany: {},
            ...(tagIds.length > 0 && {
              create: tagIds.map((tagId) => ({ tagId })),
            }),
          },
        }),
      },
      include: {
        translations: true,
        tags: {
          include: {
            tag: {
              include: {
                translations: true,
              },
            },
          },
        },
        category: {
          include: {
            translations: true,
          },
        },
        file: true,
      },
    });

    return research;
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.research.delete({
      where: { id },
      include: {
        translations: true,
        tags: true,
      },
    });
  }

  async findAllLanguages(
    page = 1,
    limit = 10,
    categoryId?: number,
    search?: string,
    year?: string,
    dateFrom?: string,
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where.translations = {
        some: {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { summary: { contains: search, mode: 'insensitive' } },
          ],
        },
      };
    }

    if (year) {
      where.publishedAt = {
        gte: new Date(`${year}-01-01`),
        lt: new Date(`${parseInt(year) + 1}-01-01`),
      };
    }

    if (dateFrom) {
      where.publishedAt = {
        gte: new Date(dateFrom),
      };
    }

    const [research, total] = await Promise.all([
      this.prisma.research.findMany({
        where,
        skip,
        take: limit,
        include: {
          translations: true,
          tags: {
            include: {
              tag: {
                include: {
                  translations: true,
                },
              },
            },
          },
          category: {
            include: {
              translations: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.research.count({ where }),
    ]);

    return {
      items: research.map((item) => ({
        id: item.id,
        slug: item.slug,
        translations: item.translations,
        categoryId: item.categoryId,
        category: item.category
          ? {
              id: item.category.id,
              slug: item.category.slug,
              translations: item.category.translations,
              createdAt: item.category.createdAt,
              updatedAt: item.category.updatedAt,
            }
          : null,
        publishedAt: item.publishedAt,
        views: item.views,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        tags:
          item.tags?.map((researchTag: any) => ({
            id: researchTag.tag.id,
            slug: researchTag.tag.slug,
            translations: researchTag.tag.translations,
            createdAt: researchTag.tag.createdAt,
            updatedAt: researchTag.tag.updatedAt,
          })) || [],
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
    const research = await this.prisma.research.findUnique({
      where: { id },
      include: {
        translations: true,
        tags: {
          include: {
            tag: {
              include: {
                translations: true,
              },
            },
          },
        },
        category: {
          include: {
            translations: true,
          },
        },
      },
    });

    if (!research) {
      throw new NotFoundException(`Research with ID ${id} not found`);
    }

    return {
      id: research.id,
      slug: research.slug,
      translations: research.translations,
      categoryId: research.categoryId,
      category: research.category
        ? {
            id: research.category.id,
            slug: research.category.slug,
            translations: research.category.translations,
            createdAt: research.category.createdAt,
            updatedAt: research.category.updatedAt,
          }
        : null,
      publishedAt: research.publishedAt,
      views: research.views,
      createdAt: research.createdAt,
      updatedAt: research.updatedAt,
      tags:
        research.tags?.map((researchTag: any) => ({
          id: researchTag.tag.id,
          slug: researchTag.tag.slug,
          translations: researchTag.tag.translations,
          createdAt: researchTag.tag.createdAt,
          updatedAt: researchTag.tag.updatedAt,
        })) || [],
    };
  }

  async findBySlugAllLanguages(slug: string) {
    const research = await this.prisma.research.findUnique({
      where: { slug },
      include: {
        translations: true,
        tags: {
          include: {
            tag: {
              include: {
                translations: true,
              },
            },
          },
        },
        category: {
          include: {
            translations: true,
          },
        },
      },
    });

    if (!research) {
      throw new NotFoundException(`Research with slug "${slug}" not found`);
    }

    return {
      id: research.id,
      slug: research.slug,
      translations: research.translations,
      categoryId: research.categoryId,
      category: research.category
        ? {
            id: research.category.id,
            slug: research.category.slug,
            translations: research.category.translations,
            createdAt: research.category.createdAt,
            updatedAt: research.category.updatedAt,
          }
        : null,
      publishedAt: research.publishedAt,
      views: research.views,
      createdAt: research.createdAt,
      updatedAt: research.updatedAt,
      tags:
        research.tags?.map((researchTag: any) => ({
          id: researchTag.tag.id,
          slug: researchTag.tag.slug,
          translations: researchTag.tag.translations,
          createdAt: researchTag.tag.createdAt,
          updatedAt: researchTag.tag.updatedAt,
        })) || [],
    };
  }
}
