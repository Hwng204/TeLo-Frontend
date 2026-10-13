// Khớp với Application/DTOs/TaskDtos.cs (màn Nhiệm vụ chung cho ma trận, đề thi, câu hỏi).
import type { MatrixPerson, MatrixStatus } from './matrix';

export type TaskType = 'MATRIX' | 'EXAM' | 'QUESTION';
export type TaskStatus = 'ASSIGNED' | 'IN_PROGRESS' | 'PENDING_REVIEW' | 'NEEDS_REVISION' | 'COMPLETED';

export interface TaskListItem {
  id: number;
  taskType: TaskType;
  taskTypeLabel: string;
  name: string;
  status: TaskStatus;
  statusLabel: string;
  /** Còn việc phải làm mà đã qua hạn (chờ kiểm duyệt thì tính theo hạn kiểm duyệt). */
  isOverdue: boolean;
  dueAt: string | null;
  performer: MatrixPerson | null;
  reviewer: MatrixPerson | null;
  /** Người giao, nhiệm vụ chưa hoàn thành. */
  canEdit: boolean;
  /** Người giao, nhiệm vụ chưa bắt đầu. */
  canDelete: boolean;
}

export interface TaskListQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  taskType?: TaskType;
  status?: TaskStatus | 'OVERDUE';
}

export interface TaskScope {
  academicContextId: number;
  subjectName: string;
  gradeLevelName: string;
  academicYearName: string;
  semesterId: number | null;
  semesterName: string | null;
  academicYearId?: number | null;
  subjectId?: number | null;
  gradeLevelId?: number | null;
}

/** Ma trận nháp của Tổ trưởng: người khác nhận `id`, `name` null. */
export interface TaskMatrixItem {
  id: number | null;
  name: string | null;
  status: MatrixStatus;
  statusLabel: string;
  updatedAt: string;
  /** Nhận xét từ chối gần nhất của PHT, có khi nhiệm vụ "Cần chỉnh sửa". */
  rejectComment: string | null;
  rejectedAt: string | null;
}

export interface TaskPaper {
  id: number | null;
  examSetId: number | null;
  questionCount: number;
  name: string;
  status: 'NOT_CREATED' | 'DRAFT';
  statusLabel: string;
  updatedAt: string | null;
}

export interface TaskExamInfo {
  matrixId: number;
  matrixName: string;
  subjectName: string;
  gradeLevelName: string;
  academicYearName: string;
  papers: TaskPaper[];
}

export interface TaskLesson {
  lessonId: number;
  chapterId: number;
  gradeLevelId: number;
  gradeLevelName: string;
  chapterCode: string;
  chapterTitle: string;
  lessonCode: string;
  lessonTitle: string;
  knowledge: number;
  understanding: number;
  application: number;
  total: number;
  /** Câu hỏi đã soạn; `pendingReview`: đã gửi mà chưa được kiểm duyệt. */
  written: number;
  pendingReview: number;
}

export interface TaskDetail {
  id: number;
  taskType: TaskType;
  taskTypeLabel: string;
  name: string;
  description: string | null;
  status: TaskStatus;
  statusLabel: string;
  isOverdue: boolean;
  /** Người thực hiện đã tạo sản phẩm: không đổi được người thực hiện, phạm vi, nội dung cần làm. */
  isStarted: boolean;
  canEdit: boolean;
  canDelete: boolean;
  createdBy: MatrixPerson | null;
  createdAt: string;
  performer: MatrixPerson | null;
  reviewer: MatrixPerson | null;
  dueAt: string | null;
  scope: TaskScope | null;
  matrix: TaskMatrixItem | null;
  exam: TaskExamInfo | null;
  lessons: TaskLesson[];
}

export interface TaskPersonOption {
  id: number;
  fullName: string;
  username: string;
}

/** Ma trận Đã duyệt của phân hiệu. */
export interface TaskMatrixOption {
  id: number;
  name: string;
  subjectName: string;
  gradeLevelName: string;
  academicYearName: string;
}

export interface TaskOptions {
  /** Giáo viên của phân hiệu (chỉ Tổ trưởng nhận). */
  teachers: TaskPersonOption[];
  /** Tổ trưởng, ma trận đã duyệt của phân hiệu (chỉ PHT nhận). */
  teamLeads: TaskPersonOption[];
  matrices: TaskMatrixOption[];
}

export interface SaveExamTaskRequest {
  name: string;
  examMatrixId: number;
  assignedToUserId: number;
  dueAt: string | null;
  /** Số đề 1..20; backend tự đặt tên Đề 1, Đề 2, … */
  paperCount: number;
}

export interface QuestionTaskLessonRequest {
  lessonId: number;
  knowledge: number;
  understanding: number;
  application: number;
}

export interface SaveQuestionTaskRequest {
  name: string;
  assignedToUserId: number;
  dueAt: string | null;
  lessons: QuestionTaskLessonRequest[];
}
