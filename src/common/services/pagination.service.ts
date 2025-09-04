import { Injectable } from '@nestjs/common';
import {
  PaginationOptions,
  PaginationMeta,
} from '../interfaces/api-response.interface';

@Injectable()
export class PaginationService {
  createPaginationOptions(
    page: number = 1,
    limit: number = 10,
  ): { skip: number; take: number } {
    const skip = (page - 1) * limit;
    return {
      skip,
      take: limit,
    };
  }

  createPaginationMeta(
    total: number,
    page: number = 1,
    limit: number = 10,
  ): PaginationMeta {
    const totalPages = Math.ceil(total / limit);

    return {
      current_page: page,
      per_page: limit,
      total_pages: totalPages,
      total_items: total,
    };
  }

  async paginate<T>(
    model: any,
    options: PaginationOptions = {},
    findManyArgs: any = {},
  ): Promise<{ data: T[]; meta: PaginationMeta }> {
    const { page = 1, limit = 10 } = options;
    const { skip, take } = this.createPaginationOptions(page, limit);

    const [data, total] = await Promise.all([
      model.findMany({
        ...findManyArgs,
        skip,
        take,
      }),
      model.count({
        where: findManyArgs.where,
      }),
    ]);

    const meta = this.createPaginationMeta(total, page, limit);

    return { data, meta };
  }
}
