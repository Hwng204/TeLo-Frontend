/**
 * Đọc thân lỗi RFC 7807 của backend thành một hình dạng dễ hiển thị.
 *
 * Quy ước xử lý theo status:
 *   401  bỏ qua — interceptor trong apiClient đã tự chuyển về trang đăng nhập.
 *   403  báo lỗi rồi quay về danh sách.
 *   404  quay về danh sách. Lưu ý 404 cũng xảy ra khi ma trận thuộc chi nhánh khác,
 *        không phải lúc nào cũng là "đã bị xoá".
 *   409  hiện thông báo rồi gọi reload() của useAsync. Backend so trạng thái hiện tại
 *        chứ không dùng version token, nên tải lại là đủ để allowedActions đúng trở lại.
 *   422  backend chỉ nói sai cái gì chứ không nói dòng nào, nên hiện message chung
 *        rồi chạy lại validateGrid() ở client để tô ô sai. Riêng code InvalidReference
 *        thì tải lại reference data.
 *   400  fieldErrors gắn vào từng Field, phần còn lại hiện chung.
 */
import { isAxiosError } from 'axios';

export type Problem = {
  status: number;
  /** Chuỗi `code` backend trả kèm, rỗng nếu không có. */
  code: string;
  /** Tiếng Việt, hiển thị thẳng cho người dùng. */
  message: string;
  /** Từ ValidationProblemDetails, khoá đã đổi sang camelCase. */
  fieldErrors?: Record<string, string>;
};

const FALLBACK = 'Đã xảy ra lỗi, vui lòng thử lại.';

const camel = (key: string) => key.charAt(0).toLowerCase() + key.slice(1);

export const toProblem = (err: unknown): Problem => {
  if (!isAxiosError(err) || !err.response) {
    return { status: 0, code: '', message: 'Không kết nối được máy chủ.' };
  }

  const { status, data } = err.response;

  // Lỗi của một request responseType:'blob' (ví dụ xuất Excel) về dưới dạng Blob,
  // không đọc đồng bộ được. Nơi gọi tự đặt thông báo riêng.
  if (data instanceof Blob) {
    return { status, code: '', message: FALLBACK };
  }

  const body = (data ?? {}) as {
    detail?: string;
    title?: string;
    errors?: Record<string, string[]>;
  };

  let fieldErrors: Record<string, string> | undefined;
  if (body.errors) {
    fieldErrors = {};
    for (const [key, messages] of Object.entries(body.errors)) {
      if (messages?.length) fieldErrors[camel(key)] = messages[0];
    }
  }

  // ValidationProblemDetails không có `detail`, nên phải lần xuống errors rồi title.
  const message =
    body.detail ||
    (fieldErrors ? Object.values(fieldErrors)[0] : undefined) ||
    body.title ||
    FALLBACK;

  return {
    status,
    code: typeof (data as { code?: unknown })?.code === 'string' ? (data as { code: string }).code : '',
    message,
    fieldErrors,
  };
};
