import {
  ApiResponse,
  PaginatedResponse,
  PaginationMeta,
} from '../interfaces/api-response.interface';

export class ResponseUtil {
  static success<T>(
    data: T,
    message: string = 'Operation successful',
  ): ApiResponse<T> {
    return {
      status: 'success',
      message,
      data,
    };
  }

  static error(message: string): ApiResponse {
    return {
      status: 'error',
      message,
    };
  }

  static paginated<T>(
    items: T[],
    pagination: PaginationMeta,
    message: string = 'Data retrieved successfully',
  ): PaginatedResponse<T> {
    return {
      status: 'success',
      message,
      data: {
        items,
        pagination,
      },
    };
  }

  static calculatePagination(
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
}
