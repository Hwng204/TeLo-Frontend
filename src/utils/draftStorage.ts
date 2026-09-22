/**
 * Bản nháp CHƯA LƯU của form soạn ma trận, giữ trong sessionStorage để F5 không làm mất.
 *
 * - Theo tab: đóng tab là mất, không rò sang tab khác.
 * - Khoá gồm id người dùng và đường dẫn, nên hai tài khoản dùng chung một máy không thấy bản nháp của nhau,
 *   và "tạo mới" tách khỏi "sửa ma trận 12" tách khỏi "lập cho nhiệm vụ 9".
 * - Mọi truy cập đều bọc try/catch: sessionStorage có thể bị chặn (chế độ riêng tư, chính sách trình duyệt),
 *   khi đó form vẫn chạy bình thường, chỉ là không khôi phục được.
 */
import type { GridRow } from '../types';
import type { ContextSelection } from './academicContext';
import { getUserId } from './jwt';

export const DRAFT_PREFIX = 'matrix-draft:';
const VERSION = 1;

/** Ba phần người dùng có thể đã chạm vào; `null` nghĩa là chưa đụng, vẫn lấy giá trị từ server. */
export interface MatrixDraft {
  name: string | null;
  selection: ContextSelection | null;
  rows: GridRow[] | null;
}

interface StoredDraft extends MatrixDraft {
  v: number;
}

export const draftKeyFor = (pathname: string): string => `${DRAFT_PREFIX}${getUserId() ?? 'anon'}:${pathname}`;

const isDraft = (value: unknown): value is StoredDraft => {
  if (typeof value !== 'object' || value === null) return false;
  const draft = value as Partial<StoredDraft>;
  return (
    draft.v === VERSION &&
    (draft.name === null || typeof draft.name === 'string') &&
    (draft.selection === null || typeof draft.selection === 'object') &&
    (draft.rows === null || Array.isArray(draft.rows))
  );
};

export const loadDraft = (key: string): MatrixDraft | null => {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isDraft(parsed)) return null;
    return { name: parsed.name, selection: parsed.selection, rows: parsed.rows };
  } catch {
    return null;
  }
};

export const saveDraft = (key: string, draft: MatrixDraft): void => {
  try {
    // Chưa chạm gì thì không có gì để giữ; xoá để khỏi khôi phục một bản rỗng.
    if (draft.name === null && draft.selection === null && draft.rows === null) {
      sessionStorage.removeItem(key);
      return;
    }
    sessionStorage.setItem(key, JSON.stringify({ v: VERSION, ...draft } satisfies StoredDraft));
  } catch {
    // Hết dung lượng hoặc bị chặn: bỏ qua, form vẫn dùng được.
  }
};

export const clearDraft = (key: string): void => {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // Bỏ qua.
  }
};
