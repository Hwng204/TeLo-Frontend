/**
 * Ngữ cảnh học thuật là tổ hợp của bốn chiều: sách giáo khoa, môn học, khối lớp, năm học.
 * Backend chỉ nhận một `academicContextId`, nên giao diện cho chọn bốn ô rồi dò ngược ra id.
 *
 * Lọc theo kiểu facet: khi dựng danh sách lựa chọn cho một chiều, ta bỏ qua chính
 * chiều đó. Nhờ vậy đổi ý ở ô đầu tiên không bao giờ dẫn tới trạng thái không chọn được gì.
 */
import type { AcademicContextOption } from '../types';

export type ContextDimension = 'textbookId' | 'subjectId' | 'gradeLevelId' | 'academicYearId';

export type ContextSelection = Partial<Record<ContextDimension, number>> & {
  schoolBranchId?: number;
  semesterId?: number;
};

export const CONTEXT_DIMENSIONS: ContextDimension[] = [
  'textbookId',
  'subjectId',
  'gradeLevelId',
  'academicYearId',
];

/**
 * Chỗ duy nhất lấy tên hiển thị của từng chiều.
 *
 * ponytail: nhánh `||` là dự phòng khi backend chưa trả các trường tên, tách tạm từ
 * `label` dạng "Môn - Khối - Năm - Trường / Chi nhánh". Xoá sau khi mọi môi trường
 * đã chạy bản backend có textbookTitle/subjectName/gradeLevelName/academicYearName.
 */
export const contextNames = (context: AcademicContextOption) => {
  const parts = context.label.split(' - ');
  return {
    textbookId: context.textbookTitle || `Sách #${context.textbookId}`,
    subjectId: context.subjectName || parts[0] || `Môn #${context.subjectId}`,
    gradeLevelId: context.gradeLevelName || parts[1] || `Khối #${context.gradeLevelId}`,
    academicYearId: context.academicYearName || parts[2] || `Năm #${context.academicYearId}`,
  } satisfies Record<ContextDimension, string>;
};

const candidates = (
  contexts: AcademicContextOption[],
  selection: ContextSelection,
  except?: ContextDimension,
) =>
  contexts.filter(
    (context) =>
      (selection.schoolBranchId === undefined || context.schoolBranchId === selection.schoolBranchId) &&
      CONTEXT_DIMENSIONS.every(
        (dimension) =>
          dimension === except ||
          selection[dimension] === undefined ||
          context[dimension] === selection[dimension],
      ),
  );

// ponytail: tách hậu tố từ label ổn định hiện có; đổi sang branchName khi backend trả trường đó.
const branchName = (context: AcademicContextOption) =>
  context.label.split(' / ').at(-1)?.trim() || `Chi nhánh #${context.schoolBranchId}`;

export const contextBranchOptions = (
  contexts: AcademicContextOption[],
  selection: ContextSelection,
): { id: number; label: string }[] => {
  const withoutBranch = { ...selection, schoolBranchId: undefined };
  const seen = new Map<number, string>();
  for (const context of candidates(contexts, withoutBranch)) {
    if (!seen.has(context.schoolBranchId)) seen.set(context.schoolBranchId, branchName(context));
  }
  return [...seen]
    .sort((a, b) => a[1].localeCompare(b[1], 'vi'))
    .map(([id, label]) => ({ id, label }));
};

export const contextOptions = (
  contexts: AcademicContextOption[],
  selection: ContextSelection,
  dimension: ContextDimension,
): { id: number; label: string }[] => {
  const seen = new Map<number, string>();
  for (const context of candidates(contexts, selection, dimension)) {
    if (!seen.has(context[dimension])) seen.set(context[dimension], contextNames(context)[dimension]);
  }
  return [...seen]
    .sort((a, b) => a[1].localeCompare(b[1], 'vi'))
    .map(([id, label]) => ({ id, label }));
};

/** Chỉ chắc chắn khi bốn chiều thu về đúng một ngữ cảnh. */
export const resolveContextId = (
  contexts: AcademicContextOption[],
  selection: ContextSelection,
): number | null => {
  if (CONTEXT_DIMENSIONS.some((dimension) => selection[dimension] === undefined)) return null;
  const matches = candidates(contexts, selection);
  return matches.length === 1 ? matches[0].id : null;
};

/** Dùng khi mở một ma trận có sẵn: điền ngược bốn ô từ id đã lưu. */
export const selectionFromContext = (
  contexts: AcademicContextOption[],
  academicContextId: number | null,
  semesterId?: number | null,
): ContextSelection => {
  const base: ContextSelection = semesterId ? { semesterId } : {};
  const context = contexts.find((item) => item.id === academicContextId);
  if (!context) return base;
  return {
    ...base,
    schoolBranchId: context.schoolBranchId,
    textbookId: context.textbookId,
    subjectId: context.subjectId,
    gradeLevelId: context.gradeLevelId,
    academicYearId: context.academicYearId,
  };
};

export const contextLabel = (contexts: AcademicContextOption[], id: number | null): string => {
  const context = contexts.find((item) => item.id === id);
  if (!context) return '—';
  const names = contextNames(context);
  return CONTEXT_DIMENSIONS.map((dimension) => names[dimension]).join(' · ');
};

/**
 * Đổi một chiều, rồi dọn các chiều khác đã trở nên vô nghĩa và tự điền chiều
 * chỉ còn đúng một lựa chọn (với dữ liệu một chi nhánh thì chọn một ô thường
 * đủ để ba ô kia tự điền).
 */
export const applyContextChange = (
  contexts: AcademicContextOption[],
  selection: ContextSelection,
  dimension: ContextDimension,
  value: number | undefined,
): ContextSelection => {
  const next: ContextSelection = { ...selection, [dimension]: value };

  for (const other of CONTEXT_DIMENSIONS) {
    if (other === dimension) continue;
    const allowed = contextOptions(contexts, next, other);
    if (next[other] !== undefined && !allowed.some((option) => option.id === next[other])) {
      next[other] = undefined;
    }
    if (next[other] === undefined && allowed.length === 1) next[other] = allowed[0].id;
  }
  return next;
};

export const applyBranchChange = (
  contexts: AcademicContextOption[],
  selection: ContextSelection,
  value: number | undefined,
): ContextSelection => {
  const next: ContextSelection = { ...selection, schoolBranchId: value };
  for (const dimension of CONTEXT_DIMENSIONS) {
    const allowed = contextOptions(contexts, next, dimension);
    if (next[dimension] !== undefined && !allowed.some((option) => option.id === next[dimension])) {
      next[dimension] = undefined;
    }
    if (next[dimension] === undefined && allowed.length === 1) next[dimension] = allowed[0].id;
  }
  return next;
};
