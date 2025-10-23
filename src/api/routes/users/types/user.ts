import type { User } from '../../../../types';

export type PaginationQuery = {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
};

export type UserFilterQuery = PaginationQuery & {
  programId?: string;
  platform?: string;
  minEngagement?: number;
  minSales?: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type UserResponse = {
  data: User;
};

export type TopUsersResponse = {
  data: User[];
};
