import { apiClient } from '../../services/apiClient';
import type { ApiResponse } from '../../types/api';
import type { PackageDetail, PackageItem, PackageOptions, PackageQuery } from './types';

const body = <T,>(response: { data: ApiResponse<T> }): T => {
  if (!response.data.success || response.data.data === undefined) throw new Error(response.data.message ?? 'Không đọc được dữ liệu đề.');
  return response.data.data;
};
const root = '/exam-packages';
export const examPackageApi = {
  list: async (params: PackageQuery) => body<{ items: PackageItem[]; totalCount: number }>(await apiClient.get(root, { params })),
  options: async (packageId?: number) => body<PackageOptions>(await apiClient.get(`${root}/options`, { params: { packageId } })),
  get: async (id: number) => body<PackageDetail>(await apiClient.get(`${root}/${id}`)),
  generate: async (name: string, matrixId: number) => body<PackageDetail>(await apiClient.post(root, { name, matrixId })),
  rename: async (id: number, version: number, name: string) => body<PackageDetail>(await apiClient.put(`${root}/${id}`, { version, name })),
  assign: async (id: number, version: number, reviewerUserId: number, dueAt: string) => body<PackageDetail>(await apiClient.post(`${root}/${id}/review-assignment`, { version, reviewerUserId, dueAt })),
  replace: async (id: number, rowId: number, version: number, questionId: number) => body<PackageDetail>(await apiClient.put(`${root}/${id}/questions/${rowId}`, { version, questionId })),
  submit: async (id: number, version: number, comment: string) => body<PackageDetail>(await apiClient.post(`${root}/${id}/submit-review`, { version, comment })),
  returnReview: async (id: number, version: number, comment: string) => body<PackageDetail>(await apiClient.post(`${root}/${id}/return-review`, { version, comment })),
  finalize: async (id: number, version: number) => body<PackageDetail>(await apiClient.post(`${root}/${id}/finalize`, { version })),
  practice: async (id: number, version: number) => body<PackageDetail>(await apiClient.post(`${root}/${id}/practice-copy`, { version })),
  remove: async (id: number, version: number) => body<boolean>(await apiClient.delete(`${root}/${id}`, { params: { version } })),
};
