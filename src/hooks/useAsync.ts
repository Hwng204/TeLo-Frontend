import { useCallback, useEffect, useRef, useState } from 'react';

type AsyncState<T> = {
  data: T | undefined;
  loading: boolean;
  error: unknown;
  /** Chạy lại lời gọi. Dùng để phục hồi sau lỗi 409. */
  reload: () => void;
};

/**
 * Gọi một hàm async mỗi khi `deps` đổi.
 *
 * `fn` giữ trong ref nên nơi gọi viết thẳng `useAsync(() => api.matrix.get(id), [id])`
 * mà không phải bọc useCallback.
 *
 * `loading` là giá trị suy ra chứ không phải state riêng: nếu kết quả đang giữ không
 * thuộc về `key` hiện tại thì nghĩa là đang tải. Nhờ vậy effect không phải gọi setState
 * đồng bộ, và kết quả về muộn của lần gọi cũ bị cleanup loại bỏ thay vì ghi đè dữ liệu mới.
 */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]): AsyncState<T> {
  const [nonce, setNonce] = useState(0);
  const key = `${JSON.stringify(deps)}#${nonce}`;

  const [state, setState] = useState<{ key: string; data?: T; error: unknown }>({
    key: '',
    error: null,
  });

  // Effect này khai báo trước effect gọi API nên luôn chạy trước, fn không bị cũ.
  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  });

  useEffect(() => {
    let cancelled = false;
    fnRef.current().then(
      (data) => {
        if (!cancelled) setState({ key, data, error: null });
      },
      (error) => {
        if (!cancelled) setState({ key, error });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [key]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  const fresh = state.key === key;
  return {
    data: fresh ? state.data : undefined,
    loading: !fresh,
    error: fresh ? state.error : null,
    reload,
  };
}
