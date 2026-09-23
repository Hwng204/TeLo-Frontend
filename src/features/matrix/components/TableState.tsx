import type { ReactNode } from 'react';

type Props = {
  loading: boolean;
  /** Tải hỏng thì bảng không được nói "không có kết quả" — người dùng sẽ tưởng là dữ liệu trống. */
  failed: boolean;
  empty: boolean;
  columns: number;
  title: string;
  hint?: string;
  action?: ReactNode;
};

/** Ba trạng thái của một bảng dữ liệu, gom một chỗ để hai màn danh sách không lệch nhau. */
export const TableState = ({ loading, failed, empty, columns, title, hint, action }: Props) => {
  if (loading) {
    return (
      <div>
        <div aria-hidden>
          {Array.from({ length: 4 }, (_, row) => (
            <div className="sep-skeleton-row" key={row}>
              {Array.from({ length: columns }, (_, cell) => (
                <span key={cell} />
              ))}
            </div>
          ))}
        </div>
        <p className="sep-loading-status" role="status">Đang tải…</p>
      </div>
    );
  }

  if (failed || !empty) return null;

  return (
    <div className="sep-empty">
      <span className="sep-empty__title">{title}</span>
      {hint && <span>{hint}</span>}
      {action}
    </div>
  );
};
