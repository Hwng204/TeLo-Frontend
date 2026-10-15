import type { QuestionItem } from '../questions/types';

export type ExamPackageStatus = 'DRAFT' | 'IN_REVIEW' | 'REVIEWED' | 'APPROVED';
export type PackageQuery = { page: number; pageSize: number; keyword?: string; status?: string; purpose?: string; academicYearId?: number; subjectId?: number; gradeLevelId?: number };
export type PackageOption = { id: number; name: string; subjectName: string; gradeLevelName: string; academicYearName: string; academicYearId: number; subjectId: number; gradeLevelId: number; status: string };
export type PackageOptions = { canCreate: boolean; matrices: PackageOption[]; reviewers: { id: number; fullName: string; username: string }[]; years?: { id: number; name: string }[] };
export type PackageItem = { id: number; name: string; status: ExamPackageStatus; purpose: string; matrixId: number; matrixName: string; subjectName: string; gradeLevelName: string; academicYearName: string; questionCount: number; authorName: string; reviewerName: string | null; createdAt: string; updatedAt: string | null; approvedAt: string | null };
export type PackageCell = { id: number; lessonTitle: string; cognitiveLevel: string; questionType: string; requiredCount: number; percentage: number; score: number };
export type PackageQuestion = { id: number; detailId: number; question: QuestionItem };
export type PackageHistory = { id: number; version: number; eventCode: string; actorName: string; createdAt: string; comment: string | null; oldQuestionId: number | null; newQuestionId: number | null };
export type PackageDetail = { package: PackageItem; version: number; totalScore: number; taskId: number | null; reviewerUserId: number | null; dueAt: string | null; approvedByName: string | null; sourceExamSetId: number | null; canViewTask: boolean; canRename: boolean; canAssign: boolean; canReplace: boolean; canSubmitReview: boolean; canReturnReview: boolean; canFinalize: boolean; canDelete: boolean; canConvertToPractice: boolean; cells: PackageCell[]; questions: PackageQuestion[]; history: PackageHistory[] };
export const packageStatuses: Record<ExamPackageStatus, string> = { DRAFT: 'Nháp', IN_REVIEW: 'Đang review', REVIEWED: 'Chờ PHT chốt', APPROVED: 'Đã chốt' };
export const historyLabels: Record<string, string> = { GENERATED: 'Tạo đề tự động', RENAMED: 'Đổi tên đề', REVIEW_ASSIGNED: 'Giao review', QUESTION_REPLACED: 'Thay câu hỏi', REVIEW_SUBMITTED: 'Gửi kết quả review', REVIEW_RETURNED: 'PHT trả lại', FINALIZED: 'PHT chốt bản cuối', PRACTICE_COPIED: 'Tạo bản sao ôn tập', PRACTICE_CREATED: 'Tạo đề ôn tập' };
