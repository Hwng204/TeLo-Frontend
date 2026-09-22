import { PcbButton } from '../../../components/pcb';

type Props = {
  page: number;
  lastPage: number;
  totalCount: number;
  itemLabel: string;
  onChange: (page: number) => void;
};

/** Số trang lân cận trang hiện tại + trang đầu/cuối, còn lại rút gọn bằng "…". */
const pageNumbers = (page: number, lastPage: number): (number | '…')[] => {
  const pages = new Set([1, lastPage, page - 1, page, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= lastPage).sort((a, b) => a - b);

  const result: (number | '…')[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push('…');
    result.push(p);
  });
  return result;
};

/** Phân trang dùng chung: bấm thẳng vào số trang, hoặc Trước/Sau. */
export const Pager = ({ page, lastPage, totalCount, itemLabel, onChange }: Props) => (
  <div className="sep-pager">
    <span className="sep-muted sep-pager__count">{totalCount} {itemLabel}</span>

    <div className="sep-pager__pages">
      <PcbButton variant="secondary" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Trước
      </PcbButton>

      {pageNumbers(page, lastPage).map((p, i) =>
        p === '…' ? (
          <span key={`ellipsis-${i}`} className="sep-pager__ellipsis">…</span>
        ) : (
          <button
            key={p}
            type="button"
            className={`sep-pager__page${p === page ? ' sep-pager__page--active' : ''}`}
            aria-current={p === page ? 'page' : undefined}
            onClick={() => onChange(p)}
          >
            {p}
          </button>
        ),
      )}

      <PcbButton variant="secondary" size="sm" disabled={page >= lastPage} onClick={() => onChange(page + 1)}>
        Sau
      </PcbButton>
    </div>
  </div>
);
