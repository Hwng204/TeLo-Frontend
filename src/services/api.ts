/**
 * Mọi lời gọi API của toàn hệ thống khai báo ở đây, gom theo module.
 * Component không gọi `apiClient` trực tiếp, chỉ dùng `api.<module>.<hành động>()`.
 * Đổi đường dẫn hay kiểu dữ liệu của một endpoint chỉ phải sửa trong file này.
 */
import { apiClient } from './apiClient';
import type {
  EmailListQuery,
  EmailSchoolItem,
  EmailEventItem,
  EmailTemplateItem,
  EmailTemplateDetail,
  EmailRevisionItem,
  SaveEmailTemplateRequest,
  SaveEmailConfigRequest,
  EmailConfigItem,
  EmailConfigurationListItem,
  EmailRecipientOption,
  EmailHistoryItem,
  EmailHistoryDetail,
  EmailDeliveryItem,
  EmailQueueResult,
  SaveEmailEventRequest,
  SendEmailRequest,
  EmailMessagePreview,
  EmailRuntimeStatus,
  IdentityQuery,
  IdentityStatus,
  IdentityScope,
  IdentityUser,
  UserDetail,
  UserStatus,
  CreateUserRequest,
  UpdateUserRequest,
  RoleItem,
  ModuleItem,
  SaveRoleRequest,
  SaveIdentityRequest,
  UserRoles,
  ApiResponse,
  CreateMatrixTaskRequest,
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
  ProvinceOption,
  SaveMatrixRequest,
  School,
  SchoolPage,
  CreateSchoolRequest,
  CreateSchoolBranchRequest,
  UpdateSchoolBranchRequest,
  AcademicYearPage,
  AcademicYearDetail,
  AcademicYearListItem,
  CreateAcademicYearRequest,
  UpdateAcademicYearRequest,
  ConfigureTermsRequest,
  AdminSchoolOption,
  AdminTeacherOption,
  ClassDetail,
  ClassListItem,
  ClassListQuery,
  DirectoryPage,
  DirectoryReferenceData,
  SaveClassRequest,
  SaveStudentRequest,
  StudentDetail,
  StudentListItem,
  StudentListQuery,
  StudentScoreItem,
  TransferStudentClassRequest,
  CreateExamRequest,
  ExamDetail,
  ExamListQuery,
  ExamPage,
  Chapter,
  Curriculum,
  CurriculumImportPreview,
  CurriculumImportResult,
  Lesson,
  SaveChapterRequest,
  SaveLessonRequest,
  ExamRoom,
  ExamRoomOption,
  SaveExamRoomRequest,
} from '../types';

const get = async <T>(url: string, params?: object): Promise<T> => (await apiClient.get<T>(url, { params })).data;

/** Lấy tên file backend đặt trong Content-Disposition (đã expose qua CORS). */
const filenameFrom = (header: unknown, fallback = 'ma-tran.xlsx'): string => {
  if (typeof header !== 'string') return fallback;
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (utf8) return decodeURIComponent(utf8[1]);
  const plain = /filename="?([^";]+)"?/i.exec(header);
  return plain ? plain[1] : fallback;
};
const post = async <T>(url: string, body?: object): Promise<T> => (await apiClient.post<T>(url, body)).data;
const put = async <T>(url: string, body?: object): Promise<T> => (await apiClient.put<T>(url, body)).data;
const patch = async <T>(url: string, body?: object): Promise<T> => (await apiClient.patch<T>(url, body)).data;
const del = async <T>(url: string): Promise<T> => (await apiClient.delete<T>(url)).data;

/** Bóc lớp vỏ ApiResponse của các API danh bạ; lỗi đã được apiClient ném ra trước khi tới đây. */
const unwrap = async <T>(request: Promise<ApiResponse<T>>): Promise<T> => (await request).data as T;
/** Gửi một tệp dạng multipart (trường `file`) rồi bóc lớp vỏ ApiResponse. */
const upload = async <T>(url: string, file: File): Promise<T> => {
  const form = new FormData();
  form.append('file', file);
  const response = await apiClient.post<ApiResponse<T>>(url, form, { headers: { 'Content-Type': 'multipart/form-data' } });
  return response.data.data as T;
};
const directoryBase = (schoolId?: number) => (schoolId ? `/admin/schools/${schoolId}` : '');
const emailBase = (schoolId: number) => `/schools/${schoolId}/emails`;

export const api = {
  email: {
    schools: (query: EmailListQuery = {}) => unwrap(get<ApiResponse<DirectoryPage<EmailSchoolItem>>>('/email/schools', query)),
    events: (schoolId: number, query: EmailListQuery = {}) => unwrap(get<ApiResponse<DirectoryPage<EmailEventItem>>>(`${emailBase(schoolId)}/events`, query)),
    event: (schoolId: number, code: string) => unwrap(get<ApiResponse<EmailEventItem>>(`${emailBase(schoolId)}/events/${encodeURIComponent(code)}`)),
    createEvent: (schoolId: number, body: SaveEmailEventRequest) => unwrap(post<ApiResponse<EmailEventItem>>(`${emailBase(schoolId)}/events`, body)),
    updateEvent: (schoolId: number, code: string, body: SaveEmailEventRequest) => unwrap(put<ApiResponse<EmailEventItem>>(`${emailBase(schoolId)}/events/${encodeURIComponent(code)}`, body)),
    eventStatus: (schoolId: number, code: string, status: string, version: number) => unwrap(patch<ApiResponse<EmailEventItem>>(`${emailBase(schoolId)}/events/${encodeURIComponent(code)}/status`, { status, version })),
    deleteEvent: (schoolId: number, code: string, version: number) => unwrap(del<ApiResponse<boolean>>(`${emailBase(schoolId)}/events/${encodeURIComponent(code)}?version=${version}`)),
    deliveryStatus: (schoolId: number) => unwrap(get<ApiResponse<EmailRuntimeStatus>>(`${emailBase(schoolId)}/delivery-status`)),
    previewMessage: (schoolId: number, body: SendEmailRequest) => unwrap(post<ApiResponse<EmailMessagePreview>>(`${emailBase(schoolId)}/send/preview`, body)),
    send: (schoolId: number, body: SendEmailRequest) => unwrap(post<ApiResponse<EmailQueueResult>>(`${emailBase(schoolId)}/send`, body)),
    cancel: (schoolId: number, id: number, version: number) => unwrap(post<ApiResponse<boolean>>(`${emailBase(schoolId)}/history/${id}/cancel`, { version })),
    templates: (schoolId: number, query: EmailListQuery = {}) => unwrap(get<ApiResponse<DirectoryPage<EmailTemplateItem>>>(`${emailBase(schoolId)}/templates`, query)),
    template: (schoolId: number, id: number) => unwrap(get<ApiResponse<EmailTemplateDetail>>(`${emailBase(schoolId)}/templates/${id}`)),
    createTemplate: (schoolId: number, body: SaveEmailTemplateRequest) => unwrap(post<ApiResponse<EmailTemplateDetail>>(`${emailBase(schoolId)}/templates`, body)),
    updateTemplate: (schoolId: number, id: number, body: SaveEmailTemplateRequest) => unwrap(put<ApiResponse<EmailTemplateDetail>>(`${emailBase(schoolId)}/templates/${id}`, body)),
    templateStatus: (schoolId: number, id: number, status: string, version: number) => unwrap(patch<ApiResponse<EmailTemplateItem>>(`${emailBase(schoolId)}/templates/${id}/status`, { status, version })),
    deleteTemplate: (schoolId: number, id: number, version: number) => unwrap(del<ApiResponse<boolean>>(`${emailBase(schoolId)}/templates/${id}?version=${version}`)),
    revisions: (schoolId: number, id: number, query: EmailListQuery = {}) => unwrap(get<ApiResponse<DirectoryPage<EmailRevisionItem>>>(`${emailBase(schoolId)}/templates/${id}/revisions`, query)),
    configurations: (schoolId: number, query: EmailListQuery = {}) => unwrap(get<ApiResponse<DirectoryPage<EmailConfigurationListItem>>>(`${emailBase(schoolId)}/configurations`, { params: query })),
    configuration: (schoolId: number, eventCode: string) => unwrap(get<ApiResponse<EmailConfigItem>>(`${emailBase(schoolId)}/configuration/${encodeURIComponent(eventCode)}`)),
    saveConfiguration: (schoolId: number, eventCode: string, body: SaveEmailConfigRequest) => unwrap(put<ApiResponse<EmailConfigItem>>(`${emailBase(schoolId)}/configuration/${encodeURIComponent(eventCode)}`, body)),
    recipients: (schoolId: number, kind: 'role' | 'user', query: EmailListQuery = {}) => unwrap(get<ApiResponse<DirectoryPage<EmailRecipientOption>>>(`${emailBase(schoolId)}/recipients`, { ...query, kind })),
    previewRecipients: (schoolId: number, body: SaveEmailConfigRequest, query: EmailListQuery = {}) => unwrap(apiClient.post<ApiResponse<DirectoryPage<EmailRecipientOption>>>(`${emailBase(schoolId)}/recipients/preview`, body, { params: query }).then(response => response.data)),
    history: (schoolId: number, query: EmailListQuery = {}) => unwrap(get<ApiResponse<DirectoryPage<EmailHistoryItem>>>(`${emailBase(schoolId)}/history`, query)),
    historyDetail: (schoolId: number, id: number) => unwrap(get<ApiResponse<EmailHistoryDetail>>(`${emailBase(schoolId)}/history/${id}`)),
    deliveries: (schoolId: number, id: number, query: EmailListQuery = {}) => unwrap(get<ApiResponse<DirectoryPage<EmailDeliveryItem>>>(`${emailBase(schoolId)}/history/${id}/recipients`, query)),
    test: (schoolId: number, body: { revisionId: number; recipientUserId: number; requestId: string }) => unwrap(post<ApiResponse<EmailQueueResult>>(`${emailBase(schoolId)}/test`, body)),
  },
  roles: {
    list: (query: IdentityQuery = {}) => unwrap(get<ApiResponse<DirectoryPage<RoleItem>>>('/roles', query)),
    get: (id: number) => unwrap(get<ApiResponse<RoleItem>>(`/roles/${id}`)),
    create: (body: SaveRoleRequest) => unwrap(post<ApiResponse<RoleItem>>('/roles', body)),
    update: (id: number, body: SaveRoleRequest & { version: number }) => unwrap(put<ApiResponse<RoleItem>>(`/roles/${id}`, body)),
    status: (id: number, status: IdentityStatus, version: number) => unwrap(patch<ApiResponse<RoleItem>>(`/roles/${id}/status`, { status, version })),
    remove: (id: number, version: number) => unwrap(del<ApiResponse<boolean>>(`/roles/${id}?version=${version}`)),
    addUsers: (id: number, userIds: number[], version: number) => unwrap(post<ApiResponse<RoleItem>>(`/roles/${id}/users`, { userIds, version })),
    removeUser: (id: number, userId: number, version: number) => unwrap(del<ApiResponse<RoleItem>>(`/roles/${id}/users/${userId}?version=${version}`)),
  },
  identity: {
    users: (query: IdentityQuery = {}) => unwrap(get<ApiResponse<DirectoryPage<IdentityUser>>>('/users', query)),
    user: (id: number) => unwrap(get<ApiResponse<UserDetail>>(`/users/${id}`)),
    createUser: (body: CreateUserRequest) => unwrap(post<ApiResponse<UserDetail>>('/users', body)),
    updateUser: (id: number, body: UpdateUserRequest) => unwrap(put<ApiResponse<UserDetail>>(`/users/${id}`, body)),
    userStatus: (id: number, status: UserStatus, version: number) =>
      unwrap(patch<ApiResponse<UserDetail>>(`/users/${id}/status`, { status, version })),
    resetUserPassword: (id: number, newPassword: string, version: number) =>
      unwrap(patch<ApiResponse<UserDetail>>(`/users/${id}/password`, { newPassword, version })),
    removeUser: (id: number, version: number) => unwrap(del<ApiResponse<boolean>>(`/users/${id}?version=${version}`)),
    userRoles: (id: number) => unwrap(get<ApiResponse<UserRoles>>(`/users/${id}/roles`)),
    assignRoles: (id: number, roleIds: number[], version: number) => unwrap(put<ApiResponse<UserRoles>>(`/users/${id}/roles`, { roleIds, version })),
    scopes: (query: { kind: 'school' | 'branch'; schoolId?: number; search?: string; page: number; pageSize: number }) => unwrap(get<ApiResponse<DirectoryPage<IdentityScope>>>('/identity/scopes', query)),
  },
  modules: {
    list: (query: IdentityQuery = {}) => unwrap(get<ApiResponse<DirectoryPage<ModuleItem>>>('/modules', query)),
    get: (id: number) => unwrap(get<ApiResponse<ModuleItem>>(`/modules/${id}`)),
    create: (body: SaveIdentityRequest) => unwrap(post<ApiResponse<ModuleItem>>('/modules', body)),
    update: (id: number, body: SaveIdentityRequest & { version: number }) => unwrap(put<ApiResponse<ModuleItem>>(`/modules/${id}`, body)),
    status: (id: number, status: IdentityStatus, version: number) => unwrap(patch<ApiResponse<ModuleItem>>(`/modules/${id}/status`, { status, version })),
    remove: (id: number, version: number) => unwrap(del<ApiResponse<boolean>>(`/modules/${id}?version=${version}`)),
  },
  auth: {
    login: (credentials: LoginRequest) => post<LoginResponse>('/auth/login', credentials),
    forgotPassword: (body: { email: string }) => post<{ message: string }>('/auth/forgot-password', body),
    verifyOtp: (body: { email: string; otp: string }) => post<{ message: string }>('/auth/verify-otp', body),
    resetPassword: (body: { email: string; otp: string; newPassword: string }) => post<{ message: string }>('/auth/reset-password', body),
    profile: () => get<{ username: string; fullName: string; email: string; status: string; avatarUrl?: string }>('/auth/profile'),
    updateProfile: (body: { avatarUrl?: string }) => put<{ message: string }>('/auth/profile', body),
    changePassword: (body: any) => post<{ message: string }>('/auth/change-password', body),
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
     * được giới hạn theo phân hiệu, khối lớp và môn của ngữ cảnh đó. Gọi không tham số sẽ trả
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

  provinces: {
    list: () => get<ApiResponse<ProvinceOption[]>>('/provinces'),
    sync: () => apiClient.post<ApiResponse<any>>('/provinces/sync'),
  },

  school: {
    list: (params?: any) => get<ApiResponse<SchoolPage>>('/schools', params),
    get: (id: string) => get<ApiResponse<School>>(`/schools/${id}`),
    create: (body: CreateSchoolRequest) => post<ApiResponse<School>>('/schools', body),
    update: (id: string, body: CreateSchoolRequest) => apiClient.patch<ApiResponse<School>>(`/schools/${id}`, body).then(res => res.data),
    remove: (id: string) => del<ApiResponse<boolean>>(`/schools/${id}`),
    createBranch: (schoolId: string, body: CreateSchoolBranchRequest) => post<ApiResponse<any>>(`/schools/${schoolId}/branches`, body),
    updateBranch: (branchId: string, body: UpdateSchoolBranchRequest) => apiClient.patch<ApiResponse<any>>(`/branches/${branchId}`, body).then(res => res.data),
  },

  /**
   * Danh bạ lớp / học sinh. Không truyền `schoolId`: API phía trường, phạm vi lấy theo tài khoản
   * (giáo viên chỉ thấy lớp mình chủ nhiệm). Có `schoolId`: API admin của đúng trường đó (xem + CRUD).
   * Hai bên trả cùng kiểu dữ liệu nên các màn dùng chung một bộ hàm.
   */
  directory: {
    classes: (query: ClassListQuery, schoolId?: number) =>
      unwrap(get<ApiResponse<DirectoryPage<ClassListItem>>>(`${directoryBase(schoolId)}/classes`, query)),
    referenceData: (academicYearId?: number, schoolId?: number) =>
      unwrap(get<ApiResponse<DirectoryReferenceData>>(`${directoryBase(schoolId)}/classes/reference-data`, academicYearId ? { academicYearId } : undefined)),
    classDetail: (id: number, roster: { page: number; pageSize: number }, schoolId?: number) =>
      unwrap(get<ApiResponse<ClassDetail>>(`${directoryBase(schoolId)}/classes/${id}`, roster)),
    students: (query: StudentListQuery, schoolId?: number) =>
      unwrap(get<ApiResponse<DirectoryPage<StudentListItem>>>(`${directoryBase(schoolId)}/students`, query)),
    studentDetail: (id: number, schoolId?: number) =>
      unwrap(get<ApiResponse<StudentDetail>>(`${directoryBase(schoolId)}/students/${id}`)),
    studentScores: (id: number, classId: number, page: { page: number; pageSize: number }, schoolId?: number) =>
      unwrap(get<ApiResponse<DirectoryPage<StudentScoreItem>>>(`${directoryBase(schoolId)}/students/${id}/scores`, { classId, ...page })),

    // Chỉ admin (schoolId bắt buộc).
    schools: () => unwrap(get<ApiResponse<DirectoryPage<AdminSchoolOption>>>('/admin/teacher-schools', { pageSize: 100 })),
    teachers: (schoolId: number, branchId: number) =>
      unwrap(get<ApiResponse<DirectoryPage<AdminTeacherOption>>>(`/admin/schools/${schoolId}/branches/${branchId}/teachers`, { pageSize: 100 })),
    createClass: (schoolId: number, body: SaveClassRequest) =>
      unwrap(post<ApiResponse<ClassDetail>>(`/admin/schools/${schoolId}/classes`, body)),
    updateClass: (schoolId: number, id: number, body: SaveClassRequest) =>
      unwrap(put<ApiResponse<ClassDetail>>(`/admin/schools/${schoolId}/classes/${id}`, body)),
    deleteClass: (schoolId: number, id: number) => del<unknown>(`/admin/schools/${schoolId}/classes/${id}`),
    createStudent: (schoolId: number, body: SaveStudentRequest) =>
      unwrap(post<ApiResponse<StudentDetail>>(`/admin/schools/${schoolId}/students`, body)),
    updateStudent: (schoolId: number, id: number, body: SaveStudentRequest) =>
      unwrap(put<ApiResponse<StudentDetail>>(`/admin/schools/${schoolId}/students/${id}`, body)),
    transferStudent: (schoolId: number, id: number, body: TransferStudentClassRequest) =>
      unwrap(post<ApiResponse<StudentDetail>>(`/admin/schools/${schoolId}/students/${id}/transfer-class`, body)),
    deleteStudent: (schoolId: number, id: number) => del<unknown>(`/admin/schools/${schoolId}/students/${id}`),
  },

  /** Chương & bài học của phân hiệu người đang đăng nhập. Chỉ PHT được thêm/sửa/xoá/nhập. */
  curriculum: {
    get: () => unwrap(get<ApiResponse<Curriculum>>('/curriculum')),
    createChapter: (body: SaveChapterRequest) =>
      unwrap(post<ApiResponse<Chapter>>('/curriculum/chapters', body)),
    updateChapter: (id: number, body: SaveChapterRequest) =>
      unwrap(put<ApiResponse<Chapter>>(`/curriculum/chapters/${id}`, body)),
    deleteChapter: (id: number) => del<unknown>(`/curriculum/chapters/${id}`),
    createLesson: (chapterId: number, body: SaveLessonRequest) =>
      unwrap(post<ApiResponse<Lesson>>(`/curriculum/chapters/${chapterId}/lessons`, body)),
    updateLesson: (id: number, body: SaveLessonRequest) =>
      unwrap(put<ApiResponse<Lesson>>(`/curriculum/lessons/${id}`, body)),
    deleteLesson: (id: number) => del<unknown>(`/curriculum/lessons/${id}`),
    downloadTemplate: async (): Promise<{ blob: Blob; filename: string }> => {
      const response = await apiClient.get<Blob>('/curriculum/import/template.xlsx', { responseType: 'blob' });
      return { blob: response.data, filename: filenameFrom(response.headers['content-disposition'], 'mau-nhap-chuong-bai.xlsx') };
    },
    /** Chỉ kiểm tra, không lưu gì. */
    previewImport: (file: File) => upload<CurriculumImportPreview>('/curriculum/import/preview', file),
    /** Backend kiểm tra lại cùng tệp; còn dòng lỗi thì trả 422 và không lưu gì. */
    importFile: (file: File) => upload<CurriculumImportResult>('/curriculum/import', file),
  },

  academicYear: {
    current: async (): Promise<ApiResponse<AcademicYearListItem | null>> => {
      const res = await get<ApiResponse<AcademicYearPage>>('/academic-years', { status: 'ACTIVE' });
      return { ...res, data: res.data?.items?.[0] ?? null };
    },
    list: (params?: { status?: string; search?: string; page?: number; pageSize?: number }) =>
      get<ApiResponse<AcademicYearPage>>('/academic-years', params),
    get: (id: string) => get<ApiResponse<AcademicYearDetail>>(`/academic-years/${id}`),
    create: (body: CreateAcademicYearRequest) => post<ApiResponse<AcademicYearListItem>>('/academic-years', body),
    update: (id: string, body: UpdateAcademicYearRequest) =>
      apiClient.patch<ApiResponse<AcademicYearDetail>>(`/academic-years/${id}`, body).then(r => r.data),
    activate: (id: string) => post<ApiResponse<AcademicYearDetail>>(`/academic-years/${id}/activate`),
    close: (id: string) => post<ApiResponse<AcademicYearDetail>>(`/academic-years/${id}/close`),
    closeTerm: (id: string, termId: string) => post<ApiResponse<unknown>>(`/academic-years/${id}/terms/${termId}/close`),
    configureTerms: (id: string, body: ConfigureTermsRequest) =>
      apiClient.put<ApiResponse<AcademicYearDetail>>(`/academic-years/${id}/terms`, body).then(r => r.data),
  },

  exam: {
    list: (query: ExamListQuery = {}) => get<ApiResponse<ExamPage>>('/exams', query),
    create: (body: CreateExamRequest) => post<ApiResponse<ExamDetail>>('/exams', body),
  },

  examRoom: {
    list: (examId: number) => unwrap(get<ApiResponse<ExamRoom[]>>(`/exams/${examId}/rooms`)),
    options: (examId: number) => unwrap(get<ApiResponse<ExamRoomOption[]>>(`/exams/${examId}/rooms/options`)),
    create: (examId: number, body: SaveExamRoomRequest) =>
      unwrap(post<ApiResponse<ExamRoom>>(`/exams/${examId}/rooms`, body)),
    update: (examId: number, id: number, body: SaveExamRoomRequest) =>
      unwrap(put<ApiResponse<ExamRoom>>(`/exams/${examId}/rooms/${id}`, body)),
    remove: (examId: number, id: number) =>
      unwrap(del<ApiResponse<boolean>>(`/exams/${examId}/rooms/${id}`)),
  },
};
