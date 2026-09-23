/**
 * Mọi lời gọi API của toàn hệ thống khai báo ở đây, gom theo module.
 * Component không gọi `apiClient` trực tiếp, chỉ dùng `api.<module>.<hành động>()`.
 * Đổi đường dẫn hay kiểu dữ liệu của một endpoint chỉ phải sửa trong file này.
 */
import { apiClient } from './apiClient';
import type {
  ApiResponse,
  CreateMatrixTaskRequest,
  CreateStudentDto,
  LoginRequest,
  LoginResponse,
  Matrix,
  MatrixListItem,
  MatrixListQuery,
  MatrixReferenceData,
  MatrixTask,
  MatrixTaskListItem,
  MatrixTaskQuery,
  Page,
  SaveMatrixRequest,
  Student,
} from '../types';

const get = async <T>(url: string, params?: object): Promise<T> => (await apiClient.get<T>(url, { params })).data;

/** Lấy tên file backend đặt trong Content-Disposition (đã expose qua CORS). */
const filenameFrom = (header: unknown): string => {
  if (typeof header !== 'string') return 'ma-tran.xlsx';
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (utf8) return decodeURIComponent(utf8[1]);
  const plain = /filename="?([^";]+)"?/i.exec(header);
  return plain ? plain[1] : 'ma-tran.xlsx';
};
const post = async <T>(url: string, body?: object): Promise<T> => (await apiClient.post<T>(url, body)).data;
const put = async <T>(url: string, body?: object): Promise<T> => (await apiClient.put<T>(url, body)).data;
const del = async <T>(url: string): Promise<T> => (await apiClient.delete<T>(url)).data;

export const api = {
  auth: {
    login: (credentials: LoginRequest) => post<LoginResponse>('/auth/login', credentials),
  },

  matrix: {
    list: (query: MatrixListQuery = {}) => get<Page<MatrixListItem>>('/matrices', query),
    get: (id: number) => get<Matrix>(`/matrices/${id}`),
    create: (body: SaveMatrixRequest) => post<Matrix>('/matrices', body),
    update: (id: number, body: SaveMatrixRequest) => put<Matrix>(`/matrices/${id}`, body),
    remove: (id: number) => del<void>(`/matrices/${id}`),

    // Chuyển trạng thái; backend trả 409 khi ma trận đã bị thao tác khác thay đổi.
    submit: (id: number) => post<Matrix>(`/matrices/${id}/submit`),
    reject: (id: number, comment?: string) => post<Matrix>(`/matrices/${id}/reject`, { comment }),
    approve: (id: number) => post<Matrix>(`/matrices/${id}/approve`),
    confirm: (id: number) => post<Matrix>(`/matrices/${id}/confirm`),
    archive: (id: number) => post<Matrix>(`/matrices/${id}/archive`),
    clone: (id: number) => post<Matrix>(`/matrices/${id}/clone`),

    exportXlsx: async (id: number): Promise<{ blob: Blob; filename: string }> => {
      const response = await apiClient.get<Blob>(`/matrices/${id}/export.xlsx`, { responseType: 'blob' });
      return { blob: response.data, filename: filenameFrom(response.headers['content-disposition']) };
    },

    /**
     * `lessons` chỉ có dữ liệu khi truyền `academicContextId`, vì danh sách bài học
     * được giới hạn theo sách giáo khoa của ngữ cảnh đó. Gọi không tham số sẽ trả
     * lessons rỗng — đó là chủ ý của backend, không phải lỗi.
     */
    referenceData: (academicContextId?: number) =>
      get<MatrixReferenceData>('/matrix-reference-data', academicContextId ? { academicContextId } : undefined),
  },

  matrixTask: {
    create: (body: CreateMatrixTaskRequest) => post<MatrixTask>('/matrix-tasks', body),
    /** 409 TaskStarted khi Tổ trưởng đã lưu/nộp ma trận cho nhiệm vụ. */
    remove: (id: number) => del<void>(`/matrix-tasks/${id}`),
    list: (query: MatrixTaskQuery = {}) => get<Page<MatrixTaskListItem>>('/matrix-tasks', query),
    mine: (query: MatrixTaskQuery = {}) => get<Page<MatrixTaskListItem>>('/my/matrix-tasks', query),
    get: (id: number) => get<MatrixTask>(`/matrix-tasks/${id}`),
  },

  students: {
    list: () => get<ApiResponse<Student[]>>('/students'),
    get: (id: string) => get<ApiResponse<Student>>(`/students/${id}`),
    create: (body: CreateStudentDto) => post<ApiResponse<Student>>('/students', body),
    remove: (id: string) => del<ApiResponse<boolean>>(`/students/${id}`),
  },
};
