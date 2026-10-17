import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/** Trang trước gửi kèm khi chuyển sang: `navigate(url, { replace: true, state: { notice } })`. */
export type ArrivalState = {
  /** Lý do cần báo ngay khi tới (lưu được nhưng nộp lỗi, thao tác bị 404/403 rồi bị đẩy về danh sách). */
  notice?: string;
  /** Đến từ màn soạn: mục lịch sử ngay trước là màn soạn, nên ← không được lùi về đó. */
  fromEditor?: boolean;
};

/** Đọc `notice` một lần khi mở trang rồi xoá riêng nó khỏi history, để F5 không hiện lại. */
export const useArrivalNotice = (): string | null => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as ArrivalState | null;
  const [notice] = useState(() => state?.notice ?? null);
  useEffect(() => {
    if (state?.notice) navigate(location, { replace: true, state: { ...state, notice: undefined } });
  }, [location, navigate, state]);
  return notice;
};
