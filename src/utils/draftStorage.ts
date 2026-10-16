/**
 * Bản nháp CHƯA LƯU của form soạn ma trận, giữ trong localStorage để F5, đóng tab, trình duyệt treo
 * hay mất mạng giữa chừng đều không làm mất.
 *
 * - Hết hạn sau DRAFT_TTL_MS; đăng xuất chủ động thì xoá (storage.clearAuth), hết phiên 401 thì giữ để đăng nhập lại.
 * - Khoá gồm id người dùng và đường dẫn, nên hai tài khoản dùng chung một máy không thấy bản nháp của nhau,
 *   và "tạo mới" tách khỏi "sửa ma trận 12" tách khỏi "lập cho nhiệm vụ 9".
 * - Mọi truy cập đều bọc try/catch: localStorage có thể bị chặn (chế độ riêng tư, chính sách trình duyệt),
 *   khi đó form vẫn chạy bình thường, chỉ là không khôi phục được.
 */
import type { GridRow, MatrixDetailRequest } from '../types';
import type { ContextSelection } from './academicContext';
import { getUserId } from './jwt';

export const DRAFT_PREFIX = 'matrix-draft:';
const VERSION = 4;
export const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Bốn phần người dùng có thể đã chạm vào; `null` nghĩa là chưa đụng, vẫn lấy giá trị từ server. */
export interface MatrixDraft {
  name: string | null;
  selection: ContextSelection | null;
  rows: GridRow[] | null;
  totalScore: number | null;
  /** serverFingerprint() của bản server lúc soạn; null với ma trận chưa có trên server. */
  base: string | null;
}

type ServerMatrix = { name: string; totalScore: number; details: MatrixDetailRequest[] };

/** Nội dung ma trận trên server. Khác `base` của bản nháp nghĩa là đã có người lưu sau lần soạn đó. */
export const serverFingerprint = (matrix: ServerMatrix): string =>
  JSON.stringify([
    matrix.name,
    matrix.totalScore,
    matrix.details.map((detail) => [detail.lessonId, detail.cognitiveLevel, detail.questionCount, detail.percentage]),
  ]);

/** Bản nháp soạn trên bản server cũ hơn: khôi phục rồi lưu sẽ ghi đè nội dung người khác vừa lưu. */
export const isDraftStale = (draft: MatrixDraft, server: ServerMatrix): boolean =>
  draft.base !== serverFingerprint(server);

interface StoredDraft extends MatrixDraft {
  v: number;
  /** Lúc ghi (ms), để bỏ bản nháp quá hạn. */
  at: number;
}

export const draftKeyFor = (pathname: string): string => `${DRAFT_PREFIX}${getUserId() ?? 'anon'}:${pathname}`;

const isDraft = (value: unknown): value is StoredDraft => {
  if (typeof value !== 'object' || value === null) return false;
  const draft = value as Partial<StoredDraft>;
  return (
    draft.v === VERSION &&
    typeof draft.at === 'number' &&
    (draft.name === null || typeof draft.name === 'string') &&
    (draft.selection === null || typeof draft.selection === 'object') &&
    (draft.rows === null || Array.isArray(draft.rows)) &&
    (draft.totalScore === null || typeof draft.totalScore === 'number') &&
    (draft.base === null || typeof draft.base === 'string')
  );
};

export const loadDraft = (key: string, now = Date.now()): MatrixDraft | null => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isDraft(parsed) || now - parsed.at > DRAFT_TTL_MS) {
      localStorage.removeItem(key);
      return null;
    }
    return { name: parsed.name, selection: parsed.selection, rows: parsed.rows, totalScore: parsed.totalScore, base: parsed.base };
  } catch {
    return null;
  }
};

export const saveDraft = (key: string, draft: MatrixDraft): void => {
  try {
    // Chưa chạm gì thì không có gì để giữ; xoá để khỏi khôi phục một bản rỗng.
    if (draft.name === null && draft.selection === null && draft.rows === null && draft.totalScore === null) {
      localStorage.removeItem(key);
      return;
    }
    localStorage.setItem(key, JSON.stringify({ v: VERSION, at: Date.now(), ...draft } satisfies StoredDraft));
  } catch {
    // Hết dung lượng hoặc bị chặn: bỏ qua, form vẫn dùng được.
  }
};

export const clearDraft = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch {
    // Bỏ qua.
  }
};
