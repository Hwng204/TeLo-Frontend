import { apiClient } from '../../services/apiClient';
import type { ApiResponse } from '../../types/api';

export type RequiredRole = { code: string; name: string; exists: boolean };
export const requiredRolesApi = {
  list: async () => (await apiClient.get<ApiResponse<RequiredRole[]>>('/roles/required')).data.data ?? [],
  restore: async () => (await apiClient.post<ApiResponse<RequiredRole[]>>('/roles/required/restore')).data.data ?? [],
};
