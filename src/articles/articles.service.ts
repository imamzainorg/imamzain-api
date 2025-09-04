import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

@Injectable()
export class ArticlesService {
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

  private formatArticleResponse(article: any, lang?: string) {
    const translation = this.getTranslation(article.translations, lang);
    const categoryTranslation = article.category
      ? this.getTranslation(article.category.translations, lang)
      : null;

    return {
      id: article.id,
      slug: article.slug,
      title: translation?.title,
      summary: translation?.summary,
      body: translation?.body,
      categoryId: article.categoryId,
      category: article.category
        ? {
            id: article.category.id,
            slug: article.category.slug,
            name: categoryTranslation?.name,
            createdAt: article.category.createdAt,
            updatedAt: article.category.updatedAt,
          }
        : null,
      mainImageId: article.mainImageId,
      mainImage: article.mainImage,
      publishedAt: article.publishedAt,
      isPublished: article.isPublished,
      views: article.views,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      tags:
        article.tags?.map((articleTag: any) => {
          const tagTranslation = this.getTranslation(
            articleTag.tag.translations,
            lang,
          );
          return {
            id: articleTag.tag.id,
            slug: articleTag.tag.slug,
            name: tagTranslation?.name,
            createdAt: articleTag.tag.createdAt,
            updatedAt: articleTag.tag.updatedAt,
          };
        }) || [],
      attachments:
        article.attachments?.map(
          (articleAttachment: any) => articleAttachment.attachment,
        ) || [],
    };
  }

  async create(createArticleDto: CreateArticleDto) {
    const defaultTranslation = createArticleDto.translations.find(
      (t) => t.isDefault,
    );
    const slug =
      createArticleDto.slug ||
      this.generateSlug(defaultTranslation?.title || '');

    const existingArticle = await this.prisma.article.findUnique({
      where: { slug },
    });

    if (existingArticle) {
      throw new ConflictException('Article with this slug already exists');
    }

    const { tagIds, attachmentIds, ...articleData } = createArticleDto;

    const article = await this.prisma.article.create({
      data: {
        ...articleData,
        slug,
        publishedAt: createArticleDto.publishedAt
          ? new Date(createArticleDto.publishedAt)
          : null,
        translations: {
          create: createArticleDto.translations,
        },
        ...(tagIds &&
          tagIds.length > 0 && {
            tags: {
              create: tagIds.map((tagId) => ({ tagId })),
            },
          }),
        ...(attachmentIds &&
          attachmentIds.length > 0 && {
            attachments: {
              create: attachmentIds.map((attachmentsId) => ({ attachmentsId })),
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
        mainImage: true,
        attachments: {
          include: {
            attachment: true,
          },
        },
      },
    });

    return article;
  }

  async findAll(
    lang?: string,
    page = 1,
    limit = 10,
    categoryId?: number,
    search?: string,
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
            { body: { contains: search, mode: 'insensitive' } },
          ],
          ...(lang && { languageCode: lang }),
        },
      };
    }

    const [articles, total] = await Promise.all([
      this.prisma.article.findMany({
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
          mainImage: true,
          attachments: {
            include: {
              attachment: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.article.count({ where }),
    ]);

    return {
      items: articles.map((article) =>
        this.formatArticleResponse(article, lang),
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
    const article = await this.prisma.article.findUnique({
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
        mainImage: true,
        attachments: {
          include: {
            attachment: true,
          },
        },
      },
    });

    if (!article) {
      throw new NotFoundException(`Article with ID ${id} not found`);
    }

    // Increment views
    await this.prisma.article.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    return this.formatArticleResponse(article, lang);
  }

  async findBySlug(slug: string, lang?: string) {
    const article = await this.prisma.article.findUnique({
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
        mainImage: true,
        attachments: {
          include: {
            attachment: true,
          },
        },
      },
    });

    if (!article) {
      throw new NotFoundException(`Article with slug "${slug}" not found`);
    }

    // Increment views
    await this.prisma.article.update({
      where: { slug },
      data: { views: { increment: 1 } },
    });

    return this.formatArticleResponse(article, lang);
  }

  async update(id: number, updateArticleDto: UpdateArticleDto) {
    await this.findOne(id);

    const { tagIds, attachmentIds, translations, ...updateData } =
      updateArticleDto;

    if (updateArticleDto.slug) {
      const existingArticle = await this.prisma.article.findFirst({
        where: {
          slug: updateArticleDto.slug,
          id: { not: id },
        },
      });

      if (existingArticle) {
        throw new ConflictException('Article with this slug already exists');
      }
    }

    const article = await this.prisma.article.update({
      where: { id },
      data: {
        ...updateData,
        ...(updateArticleDto.publishedAt && {
          publishedAt: new Date(updateArticleDto.publishedAt),
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
        ...(attachmentIds !== undefined && {
          attachments: {
            deleteMany: {},
            ...(attachmentIds.length > 0 && {
              create: attachmentIds.map((attachmentsId) => ({ attachmentsId })),
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
        mainImage: true,
        attachments: {
          include: {
            attachment: true,
          },
        },
      },
    });

    return article;
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.article.delete({
      where: { id },
      include: {
        translations: true,
        tags: true,
        attachments: true,
      },
    });
  }

  async findAllLanguages(
    page = 1,
    limit = 10,
    categoryId?: number,
    search?: string,
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
            { body: { contains: search, mode: 'insensitive' } },
          ],
        },
      };
    }

    const [articles, total] = await Promise.all([
      this.prisma.article.findMany({
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
          mainImage: true,
          attachments: {
            include: {
              attachment: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.article.count({ where }),
    ]);

    return {
      items: articles.map((article) => ({
        id: article.id,
        slug: article.slug,
        translations: article.translations,
        categoryId: article.categoryId,
        category: article.category
          ? {
              id: article.category.id,
              slug: article.category.slug,
              translations: article.category.translations,
              createdAt: article.category.createdAt,
              updatedAt: article.category.updatedAt,
            }
          : null,
        mainImageId: article.mainImageId,
        mainImage: article.mainImage,
        views: article.views,
        createdAt: article.createdAt,
        updatedAt: article.updatedAt,
        tags:
          article.tags?.map((articleTag: any) => ({
            id: articleTag.tag.id,
            slug: articleTag.tag.slug,
            translations: articleTag.tag.translations,
            createdAt: articleTag.tag.createdAt,
            updatedAt: articleTag.tag.updatedAt,
          })) || [],
        attachments:
          article.attachments?.map((articleAttachment: any) => ({
            id: articleAttachment.attachment.id,
            originalName: articleAttachment.attachment.originalName,
            fileName: articleAttachment.attachment.fileName,
            filePath: articleAttachment.attachment.filePath,
            mimeType: articleAttachment.attachment.mimeType,
            size: articleAttachment.attachment.size,
            createdAt: articleAttachment.attachment.createdAt,
            updatedAt: articleAttachment.attachment.updatedAt,
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
    const article = await this.prisma.article.findUnique({
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
        mainImage: true,
        attachments: {
          include: {
            attachment: true,
          },
        },
      },
    });

    if (!article) {
      throw new NotFoundException(`Article with ID ${id} not found`);
    }

    return {
      id: article.id,
      slug: article.slug,
      translations: article.translations,
      categoryId: article.categoryId,
      category: article.category
        ? {
            id: article.category.id,
            slug: article.category.slug,
            translations: article.category.translations,
            createdAt: article.category.createdAt,
            updatedAt: article.category.updatedAt,
          }
        : null,
      mainImageId: article.mainImageId,
      mainImage: article.mainImage,
      views: article.views,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      tags:
        article.tags?.map((articleTag: any) => ({
          id: articleTag.tag.id,
          slug: articleTag.tag.slug,
          translations: articleTag.tag.translations,
          createdAt: articleTag.tag.createdAt,
          updatedAt: articleTag.tag.updatedAt,
        })) || [],
      attachments:
        article.attachments?.map((articleAttachment: any) => ({
          id: articleAttachment.attachment.id,
          originalName: articleAttachment.attachment.originalName,
          fileName: articleAttachment.attachment.fileName,
          filePath: articleAttachment.attachment.filePath,
          mimeType: articleAttachment.attachment.mimeType,
          size: articleAttachment.attachment.size,
          createdAt: articleAttachment.attachment.createdAt,
          updatedAt: articleAttachment.attachment.updatedAt,
        })) || [],
    };
  }

  async findBySlugAllLanguages(slug: string) {
    const article = await this.prisma.article.findUnique({
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
        mainImage: true,
        attachments: {
          include: {
            attachment: true,
          },
        },
      },
    });

    if (!article) {
      throw new NotFoundException(`Article with slug "${slug}" not found`);
    }

    return {
      id: article.id,
      slug: article.slug,
      translations: article.translations,
      categoryId: article.categoryId,
      category: article.category
        ? {
            id: article.category.id,
            slug: article.category.slug,
            translations: article.category.translations,
            createdAt: article.category.createdAt,
            updatedAt: article.category.updatedAt,
          }
        : null,
      mainImageId: article.mainImageId,
      mainImage: article.mainImage,
      views: article.views,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      tags:
        article.tags?.map((articleTag: any) => ({
          id: articleTag.tag.id,
          slug: articleTag.tag.slug,
          translations: articleTag.tag.translations,
          createdAt: articleTag.tag.createdAt,
          updatedAt: articleTag.tag.updatedAt,
        })) || [],
      attachments:
        article.attachments?.map((articleAttachment: any) => ({
          id: articleAttachment.attachment.id,
          originalName: articleAttachment.attachment.originalName,
          fileName: articleAttachment.attachment.fileName,
          filePath: articleAttachment.attachment.filePath,
          mimeType: articleAttachment.attachment.mimeType,
          size: articleAttachment.attachment.size,
          createdAt: articleAttachment.attachment.createdAt,
          updatedAt: articleAttachment.attachment.updatedAt,
        })) || [],
    };
  }
}
