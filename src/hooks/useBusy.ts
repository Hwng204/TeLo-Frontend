import { useRef, useState } from 'react';

/**
 * Khoá chống bấm hai lần lên cùng một hành động.
 *
 * `busy` là state, dùng để vô hiệu hoá nút. Nhưng state chỉ đổi ở lần render sau, nên hai
 * cú bấm trong cùng một nhịp đều lọt qua và gửi hai request (đã từng tạo ra ma trận trùng).
 * Vì vậy khoá thật nằm ở ref: kiểm tra và đặt ngay lập tức, không chờ render.
 */
export const useBusy = () => {
  const [busy, setBusy] = useState(false);
  const running = useRef(false);

  const runExclusive = async (action: () => Promise<unknown>) => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    try {
      await action();
    } finally {
      running.current = false;
      setBusy(false);
    }
  };

  return [busy, runExclusive] as const;
};
