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
  /** Tỷ lệ % điểm của dòng này trong tổng điểm ma trận (0, 100], không phải điểm tuyệt đối. */
  percentage: number;
}

export interface SaveMatrixRequest {
  name: string;
  academicContextId: number;
  semesterId: number | null;
  taskId: number | null;
  /** Số nguyên dương do người lập tự đặt — không còn tính từ tổng chi tiết. */
  totalScore: number;
  details: MatrixDetailRequest[];
}

export interface MatrixDetail extends MatrixDetailRequest {
  id: number;
  questionType: string;
  /** Suy ra từ backend = matrix.totalScore * percentage / 100, để tránh lệch làm tròn. */
  cellScore: number;
}

/** Một người dùng hiển thị cạnh ma trận/nhiệm vụ. `roleLabel` là null nếu họ không có vai trò ma trận. */
export interface MatrixPerson {
  userId: number;
  fullName: string;
  roleLabel: string | null;
}

export interface Matrix {
  id: number;
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
  // Lọc từng chiều độc lập, không cần chọn đủ bốn chiều để ra academicContextId.
  academicYearId?: number;
  subjectId?: number;
  gradeLevelId?: number;
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
/** Tab lọc ở danh sách nhiệm vụ: các trạng thái thật, cộng "Quá hạn" (= Đã giao và hạn trước hôm nay). */
export type MatrixTaskTab = MatrixTaskStatus | 'OVERDUE';

/** GET /matrix-tasks/{id} — không có `createdByUserId`. */
export interface MatrixTask {
  id: number;
  /** Tên nhiệm vụ, bắt buộc khi tạo — định danh chính, tách biệt với `description`. */
  name: string;
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
  name: string;
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
  /** Khớp tên nhiệm vụ hoặc yêu cầu công việc, hoặc id (gõ số). */
  keyword?: string;
  academicContextId?: number;
  // Lọc từng chiều độc lập, không cần chọn đủ bốn chiều để ra academicContextId.
  academicYearId?: number;
  semesterId?: number;
  subjectId?: number;
  gradeLevelId?: number;
}

/** Nhóm nhiệm vụ ở hàng tab đầu màn Nhiệm vụ. Hiện backend mới có nhiệm vụ ma trận. */
export type TaskGroup = 'MATRIX' | 'QUESTION' | 'EXAM';

export interface CreateMatrixTaskRequest {
  assignedToUserId: number;
  academicContextId: number;
  semesterId: number | null;
  dueAt: string | null;
  name: string;
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
  /** Tỷ lệ % điểm người dùng gõ trực tiếp (0, 100]. Điểm ô/điểm mỗi câu suy ra từ đây, xem cellScore() trong matrixGrid.ts. */
  percentage: string;
}

/** `key` riêng vì dòng mới thêm có lessonId = 0, dùng lessonId làm key sẽ đụng nhau. */
export interface GridRow {
  key: string;
  lessonId: number;
  cells: Record<CognitiveLevel, GridCell>;
}

// --- Nhập ma trận từ file Excel (đọc/ghi .xlsx ngay trên trình duyệt) ---

/** Một ô khi ghi file .xlsx; `bold` cho dòng tiêu đề. */
export type XlsxCell = string | number | null | { value: string | number; bold?: boolean };

export interface MatrixImportIssue {
  /** Số dòng trong file Excel (đếm từ 1), null nếu lỗi của cả file. */
  line: number | null;
  message: string;
  /** true: dòng không đưa vào bảng (không nhận ra bài học/mức). false: vẫn đưa vào, cần sửa số liệu. */
  skipped: boolean;
}

export interface MatrixImportResult {
  /** Mỗi dòng một bài học, đã gom ba mức nhận thức; dùng thẳng cho lưới soạn. */
  rows: GridRow[];
  /** "Tên ma trận" / "Tổng điểm" ghi trong file (có ở file mẫu và file Xuất Excel). */
  name: string | null;
  totalScore: number | null;
  issues: MatrixImportIssue[];
  /** Số dòng trong file có điền Số câu hoặc Tỷ lệ %. */
  filledLines: number;
}
