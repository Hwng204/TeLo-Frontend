// Khớp với Application/DTOs/Matrix*.cs của backend.
// Id kiểu ulong nhưng luôn nhỏ hơn 2^53 nên dùng `number` là an toàn.

export type CognitiveLevel = 'NHAN_BIET' | 'THONG_HIEU' | 'VAN_DUNG';
export type MatrixStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'ARCHIVED';

/**
 * Backend trả PascalCase, KHÔNG phải UPPER_SNAKE như `status`.
 * So sánh với 'SUBMIT' sẽ không bao giờ khớp.
 */
export type MatrixAction =
  | 'View'
  | 'Update'
  | 'Delete'
  | 'Confirm'
  | 'Submit'
  | 'Approve'
  | 'Reject'
  | 'Archive'
  | 'Clone'
  | 'Export';

export interface MatrixDetailRequest {
  lessonId: number;
  cognitiveLevel: CognitiveLevel;
  questionCount: number;
  allocatedScore: number;
}

export interface SaveMatrixRequest {
  name: string;
  academicContextId: number;
  semesterId: number | null;
  taskId: number | null;
  details: MatrixDetailRequest[];
}

export interface MatrixDetail extends MatrixDetailRequest {
  id: number;
  questionType: string;
}

/** Một người dùng hiển thị cạnh ma trận/nhiệm vụ. `roleLabel` là null nếu họ không có vai trò ma trận. */
export interface MatrixPerson {
  userId: number;
  fullName: string;
  roleLabel: string | null;
}

export interface Matrix {
  id: number;
  /** Ví dụ MT-2026-014. */
  code: string;
  name: string;
  status: MatrixStatus;
  statusLabel: string;
  taskId: number | null;
  academicContextId: number;
  semesterId: number | null;
  details: MatrixDetail[];
  totalQuestions: number;
  totalScore: number;
  allowedActions: MatrixAction[];
  rejectComment: string | null;
  rejectedAt: string | null;
  rejectedByUserId: number | null;
  /** Null với ma trận cũ không có dữ liệu người lập. */
  createdBy: MatrixPerson | null;
  createdAt: string | null;
  approvedBy: MatrixPerson | null;
  approvedAt: string | null;
}

/** Hàng trong danh sách. KHÔNG có `allowedActions` — chỉ `Matrix` mới có. */
export interface MatrixListItem {
  id: number;
  code: string;
  name: string;
  status: MatrixStatus;
  statusLabel: string;
  taskId: number | null;
  academicContextId: number;
  semesterId: number | null;
  totalQuestions: number;
  totalScore: number;
  createdBy: MatrixPerson | null;
  createdAt: string | null;
  approvedBy: MatrixPerson | null;
  approvedAt: string | null;
}

export interface MatrixListQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  academicContextId?: number;
  semesterId?: number;
  /** Không truyền thì backend ẩn các ma trận ARCHIVED. */
  status?: MatrixStatus;
}

export interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export type MatrixTaskStatus = 'ASSIGNED' | 'SUBMITTED' | 'COMPLETED';

/** GET /matrix-tasks/{id} — không có `createdByUserId`. */
export interface MatrixTask {
  id: number;
  /** Ví dụ NV-MT-014. */
  code: string;
  /** Người giao việc. */
  createdBy: MatrixPerson | null;
  assignedToUserId: number;
  academicContextId: number;
  semesterId: number | null;
  dueAt: string | null;
  status: MatrixTaskStatus;
  statusLabel: string;
  taskType: string;
  description: string | null;
  matrixId: number | null;
}

/** Hàng trong danh sách nhiệm vụ — có `createdByUserId`, ngữ cảnh thì nullable. */
export interface MatrixTaskListItem {
  id: number;
  code: string;
  createdBy: MatrixPerson | null;
  createdByUserId: number;
  assignedToUserId: number;
  dueAt: string | null;
  status: MatrixTaskStatus;
  statusLabel: string;
  taskType: string;
  description: string | null;
  academicContextId: number | null;
  semesterId: number | null;
  matrixId: number | null;
}

export interface MatrixTaskQuery {
  page?: number;
  pageSize?: number;
  status?: MatrixTaskStatus;
  dueBefore?: string;
  /** Khớp yêu cầu công việc, hoặc mã nhiệm vụ (`NV-MT-9301` và `9301` đều được). */
  keyword?: string;
  academicContextId?: number;
}

export interface CreateMatrixTaskRequest {
  assignedToUserId: number;
  academicContextId: number;
  semesterId: number | null;
  dueAt: string | null;
  description: string | null;
}

export interface AcademicContextOption {
  id: number;
  /** Dạng "Môn - Khối - Năm - Trường / Chi nhánh". */
  label: string;
  academicYearId: number;
  schoolBranchId: number;
  textbookId: number;
  subjectId: number;
  gradeLevelId: number;
  // Tên hiển thị từng chiều. Không bắt buộc vì backend cũ chưa trả về;
  // xem contextNames() trong ContextSelects để biết nhánh dự phòng.
  textbookTitle?: string;
  subjectName?: string;
  gradeLevelName?: string;
  academicYearName?: string;
}

export interface SemesterOption {
  id: number;
  academicYearId: number;
  name: string;
  startDate: string | null;
  endDate: string | null;
}

export interface LessonOption {
  id: number;
  contextId: number;
  chapterId: number;
  title: string;
  sortOrder: number;
}

export interface TeamLeadOption {
  id: number;
  username: string;
  fullName: string;
  schoolBranchId: number | null;
}

export interface MatrixReferenceData {
  academicContexts: AcademicContextOption[];
  semesters: SemesterOption[];
  /** Rỗng trừ khi request truyền `academicContextId`. */
  lessons: LessonOption[];
  teamLeads: TeamLeadOption[];
  cognitiveLevels: { code: CognitiveLevel; label: string }[] | null;
}

// --- Kiểu chỉ dùng cho giao diện lưới chi tiết ---

/**
 * Giữ nguyên chuỗi người dùng gõ, không đổi sang number.
 * Nhờ vậy ô trống ('') phân biệt được với 0, gõ "1." giữa chừng không bị nhảy
 * con trỏ, và state không bao giờ chứa NaN. Chỉ parse lúc validate/gửi đi.
 */
export interface GridCell {
  questionCount: string;
  /**
   * Điểm MỖI CÂU, không phải tổng điểm của ô. Backend lưu tổng (điểm mỗi câu × số câu);
   * matrixGrid.ts đổi qua lại ở toGrid/toDetails.
   */
  allocatedScore: string;
}

/** `key` riêng vì dòng mới thêm có lessonId = 0, dùng lessonId làm key sẽ đụng nhau. */
export interface GridRow {
  key: string;
  lessonId: number;
  cells: Record<CognitiveLevel, GridCell>;
}
