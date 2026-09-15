import { apiClient } from '../../../services/apiClient';
import type { ApiResponse } from '../../../types';
import type { Student, CreateStudentDto } from '../types';

export const studentApi = {
  getAll: async (): Promise<ApiResponse<Student[]>> => {
    const response = await apiClient.get<ApiResponse<Student[]>>('/students');
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<Student>> => {
    const response = await apiClient.get<ApiResponse<Student>>(`/students/${id}`);
    return response.data;
  },

  create: async (data: CreateStudentDto): Promise<ApiResponse<Student>> => {
    const response = await apiClient.post<ApiResponse<Student>>('/students', data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<boolean>> => {
    const response = await apiClient.delete<ApiResponse<boolean>>(`/students/${id}`);
    return response.data;
  },
};
