export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface ProvinceOption {
  code: string;
  name: string;
  hasSchools: boolean;
  activeSchoolCount: number;
}


