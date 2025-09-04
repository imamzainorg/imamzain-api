export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message: string;
  data?: T;
}

export interface PaginatedResponse<T = any> {
  status: 'success' | 'error';
  message: string;
  data: {
    items: T[];
    pagination: {
      current_page: number;
      per_page: number;
      total_pages: number;
      total_items: number;
    };
  };
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total_pages: number;
  total_items: number;
}
