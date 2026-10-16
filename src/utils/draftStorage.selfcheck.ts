/**
 * Tự kiểm tra hạn của bản nháp ma trận, chạy khi `npm run dev`.
 *
 * ponytail: dùng console.assert vì dự án chưa có test runner.
 */
import { DRAFT_TTL_MS, clearDraft, isDraftStale, loadDraft, saveDraft, serverFingerprint } from './draftStorage';

export const draftStorageSelfCheck = () => {
  const key = 'matrix-draft:selfcheck';
  saveDraft(key, { name: 'Toán 5', selection: null, rows: null, totalScore: null, base: null });
  console.assert(loadDraft(key)?.name === 'Toán 5', 'draftStorage self-check 1: bản nháp còn hạn phải đọc lại được');
  console.assert(
    loadDraft(key, Date.now() + DRAFT_TTL_MS + 1) === null,
    'draftStorage self-check 2: bản nháp quá hạn phải bị bỏ',
  );
  console.assert(loadDraft(key) === null, 'draftStorage self-check 3: bản nháp quá hạn phải bị xoá khỏi máy');

  const server = { name: 'Toán 5', totalScore: 10, details: [{ lessonId: 1, cognitiveLevel: 'NHAN_BIET' as const, questionCount: 2, percentage: 100 }] };
  saveDraft(key, { name: 'Toán 5 (sửa)', selection: null, rows: null, totalScore: null, base: serverFingerprint(server) });
  const draft = loadDraft(key);
  console.assert(draft !== null && !isDraftStale(draft, server), 'draftStorage self-check 4: server chưa đổi thì khôi phục bản nháp');
  console.assert(
    draft !== null && isDraftStale(draft, { ...server, details: [{ ...server.details[0], questionCount: 3 }] }),
    'draftStorage self-check 5: server đã đổi sau lần soạn thì không được khôi phục âm thầm',
  );
  clearDraft(key);
  console.info('[draftStorage] self-check xong');
};
