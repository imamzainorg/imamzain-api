import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';

@Injectable()
export class BooksService {
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

  private formatBookResponse(book: any, lang?: string) {
    const translation = this.getTranslation(book.translations, lang);
    const categoryTranslation = book.category
      ? this.getTranslation(book.category.translations, lang)
      : null;
    const parentBookTranslation = book.parentBook
      ? this.getTranslation(book.parentBook.translations, lang)
      : null;

    return {
      id: book.id,
      slug: book.slug,
      title: translation?.title,
      author: translation?.author,
      description: translation?.description,
      categoryId: book.categoryId,
      category: book.category
        ? {
            id: book.category.id,
            slug: book.category.slug,
            name: categoryTranslation?.name,
            createdAt: book.category.createdAt,
            updatedAt: book.category.updatedAt,
          }
        : null,
      parentBookId: book.parentBookId,
      parentBook: book.parentBook
        ? {
            id: book.parentBook.id,
            slug: book.parentBook.slug,
            title: parentBookTranslation?.title,
            createdAt: book.parentBook.createdAt,
            updatedAt: book.parentBook.updatedAt,
          }
        : null,
      coverId: book.coverId,
      cover: book.cover,
      fileId: book.fileId,
      file: book.file,
      views: book.views,
      createdAt: book.createdAt,
      updatedAt: book.updatedAt,
      tags:
        book.tags?.map((bookTag: any) => {
          const tagTranslation = this.getTranslation(
            bookTag.tag.translations,
            lang,
          );
          return {
            id: bookTag.tag.id,
            slug: bookTag.tag.slug,
            name: tagTranslation?.name,
            createdAt: bookTag.tag.createdAt,
            updatedAt: bookTag.tag.updatedAt,
          };
        }) || [],
      parts:
        book.parts?.map((part: any) => {
          const partTranslation = this.getTranslation(part.translations, lang);
          return {
            id: part.id,
            slug: part.slug,
            title: partTranslation?.title,
            createdAt: part.createdAt,
            updatedAt: part.updatedAt,
          };
        }) || [],
    };
  }

  async create(createBookDto: CreateBookDto) {
    const defaultTranslation = createBookDto.translations.find(
      (t) => t.isDefault,
    );
    const slug =
      createBookDto.slug || this.generateSlug(defaultTranslation?.title || '');

    const existingBook = await this.prisma.book.findUnique({
      where: { slug },
    });

    if (existingBook) {
      throw new ConflictException('Book with this slug already exists');
    }

    const { tagIds, ...bookData } = createBookDto;

    const book = await this.prisma.book.create({
      data: {
        ...bookData,
        slug,
        translations: {
          create: createBookDto.translations,
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
        cover: true,
        file: true,
        parentBook: {
          include: {
            translations: true,
          },
        },
        parts: {
          include: {
            translations: true,
          },
        },
      },
    });

    return book;
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
            { description: { contains: search, mode: 'insensitive' } },
            { author: { contains: search, mode: 'insensitive' } },
          ],
          ...(lang && { languageCode: lang }),
        },
      };
    }

    const [books, total] = await Promise.all([
      this.prisma.book.findMany({
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
          cover: true,
          file: true,
          parentBook: {
            include: {
              translations: true,
            },
          },
          parts: {
            include: {
              translations: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.book.count({ where }),
    ]);

    return {
      items: books.map((book) => this.formatBookResponse(book, lang)),
      pagination: {
        current_page: page,
        per_page: limit,
        total_items: total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number, lang?: string) {
    const book = await this.prisma.book.findUnique({
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
        cover: true,
        file: true,
        parentBook: {
          include: {
            translations: true,
          },
        },
        parts: {
          include: {
            translations: true,
          },
        },
      },
    });

    if (!book) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }

    // Increment views
    await this.prisma.book.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    return this.formatBookResponse(book, lang);
  }

  async findBySlug(slug: string, lang?: string) {
    const book = await this.prisma.book.findUnique({
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
        cover: true,
        file: true,
        parentBook: {
          include: {
            translations: true,
          },
        },
        parts: {
          include: {
            translations: true,
          },
        },
      },
    });

    if (!book) {
      throw new NotFoundException(`Book with slug "${slug}" not found`);
    }

    // Increment views
    await this.prisma.book.update({
      where: { slug },
      data: { views: { increment: 1 } },
    });

    return this.formatBookResponse(book, lang);
  }

  async update(id: number, updateBookDto: UpdateBookDto) {
    await this.findOne(id);

    const { tagIds, translations, ...updateData } = updateBookDto;

    if (updateBookDto.slug) {
      const existingBook = await this.prisma.book.findFirst({
        where: {
          slug: updateBookDto.slug,
          id: { not: id },
        },
      });

      if (existingBook) {
        throw new ConflictException('Book with this slug already exists');
      }
    }

    const book = await this.prisma.book.update({
      where: { id },
      data: {
        ...updateData,
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
        cover: true,
        file: true,
        parentBook: {
          include: {
            translations: true,
          },
        },
        parts: {
          include: {
            translations: true,
          },
        },
      },
    });

    return book;
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.book.delete({
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
            { description: { contains: search, mode: 'insensitive' } },
            { author: { contains: search, mode: 'insensitive' } },
          ],
        },
      };
    }

    const [books, total] = await Promise.all([
      this.prisma.book.findMany({
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
          cover: true,
          file: true,
          parentBook: {
            include: {
              translations: true,
            },
          },
          parts: {
            include: {
              translations: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.book.count({ where }),
    ]);

    return {
      items: books.map((book) => ({
        id: book.id,
        slug: book.slug,
        translations: book.translations,
        categoryId: book.categoryId,
        category: book.category
          ? {
              id: book.category.id,
              slug: book.category.slug,
              translations: book.category.translations,
              createdAt: book.category.createdAt,
              updatedAt: book.category.updatedAt,
            }
          : null,
        parentBookId: book.parentBookId,
        parentBook: book.parentBook
          ? {
              id: book.parentBook.id,
              slug: book.parentBook.slug,
              translations: book.parentBook.translations,
              createdAt: book.parentBook.createdAt,
              updatedAt: book.parentBook.updatedAt,
            }
          : null,
        coverId: book.coverId,
        cover: book.cover,
        fileId: book.fileId,
        file: book.file,
        views: book.views,
        createdAt: book.createdAt,
        updatedAt: book.updatedAt,
        tags:
          book.tags?.map((bookTag: any) => ({
            id: bookTag.tag.id,
            slug: bookTag.tag.slug,
            translations: bookTag.tag.translations,
            createdAt: bookTag.tag.createdAt,
            updatedAt: bookTag.tag.updatedAt,
          })) || [],
        parts:
          book.parts?.map((part: any) => ({
            id: part.id,
            slug: part.slug,
            translations: part.translations,
            createdAt: part.createdAt,
            updatedAt: part.updatedAt,
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
    const book = await this.prisma.book.findUnique({
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
        cover: true,
        file: true,
        parentBook: {
          include: {
            translations: true,
          },
        },
        parts: {
          include: {
            translations: true,
          },
        },
      },
    });

    if (!book) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }

    return {
      id: book.id,
      slug: book.slug,
      translations: book.translations,
      categoryId: book.categoryId,
      category: book.category
        ? {
            id: book.category.id,
            slug: book.category.slug,
            translations: book.category.translations,
            createdAt: book.category.createdAt,
            updatedAt: book.category.updatedAt,
          }
        : null,
      parentBookId: book.parentBookId,
      parentBook: book.parentBook
        ? {
            id: book.parentBook.id,
            slug: book.parentBook.slug,
            translations: book.parentBook.translations,
            createdAt: book.parentBook.createdAt,
            updatedAt: book.parentBook.updatedAt,
          }
        : null,
      coverId: book.coverId,
      cover: book.cover,
      fileId: book.fileId,
      file: book.file,
      views: book.views,
      createdAt: book.createdAt,
      updatedAt: book.updatedAt,
      tags:
        book.tags?.map((bookTag: any) => ({
          id: bookTag.tag.id,
          slug: bookTag.tag.slug,
          translations: bookTag.tag.translations,
          createdAt: bookTag.tag.createdAt,
          updatedAt: bookTag.tag.updatedAt,
        })) || [],
      parts:
        book.parts?.map((part: any) => ({
          id: part.id,
          slug: part.slug,
          translations: part.translations,
          createdAt: part.createdAt,
          updatedAt: part.updatedAt,
        })) || [],
    };
  }

  async findBySlugAllLanguages(slug: string) {
    const book = await this.prisma.book.findUnique({
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
        cover: true,
        file: true,
        parentBook: {
          include: {
            translations: true,
          },
        },
        parts: {
          include: {
            translations: true,
          },
        },
      },
    });

    if (!book) {
      throw new NotFoundException(`Book with slug "${slug}" not found`);
    }

    return {
      id: book.id,
      slug: book.slug,
      translations: book.translations,
      categoryId: book.categoryId,
      category: book.category
        ? {
            id: book.category.id,
            slug: book.category.slug,
            translations: book.category.translations,
            createdAt: book.category.createdAt,
            updatedAt: book.category.updatedAt,
          }
        : null,
      parentBookId: book.parentBookId,
      parentBook: book.parentBook
        ? {
            id: book.parentBook.id,
            slug: book.parentBook.slug,
            translations: book.parentBook.translations,
            createdAt: book.parentBook.createdAt,
            updatedAt: book.parentBook.updatedAt,
          }
        : null,
      coverId: book.coverId,
      cover: book.cover,
      fileId: book.fileId,
      file: book.file,
      views: book.views,
      createdAt: book.createdAt,
      updatedAt: book.updatedAt,
      tags:
        book.tags?.map((bookTag: any) => ({
          id: bookTag.tag.id,
          slug: bookTag.tag.slug,
          translations: bookTag.tag.translations,
          createdAt: bookTag.tag.createdAt,
          updatedAt: bookTag.tag.updatedAt,
        })) || [],
      parts:
        book.parts?.map((part: any) => ({
          id: part.id,
          slug: part.slug,
          translations: part.translations,
          createdAt: part.createdAt,
          updatedAt: part.updatedAt,
        })) || [],
    };
  }
}
