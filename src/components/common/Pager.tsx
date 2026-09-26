import { Icon, SelectField } from '../pcb';

const PAGE_SIZES = [6, 9];

type Props = {
  page: number;
  pageSize: number;
  totalCount: number;
  itemLabel: string;
  onChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
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

/** Chân bảng: số bản ghi mỗi trang bên trái, số trang bấm được bên phải. */
export const Pager = ({ page, pageSize, totalCount, itemLabel, onChange, onPageSizeChange }: Props) => {
  const lastPage = Math.max(1, Math.ceil(totalCount / pageSize));
  return (
    <div className="sep-pager">
      <div className="sep-pager__size">
        <span>Hiển thị</span>
        <SelectField
          label="Số bản ghi mỗi trang"
          hideLabel
          value={pageSize}
          fieldClassName="sep-pager__select"
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
        >
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </SelectField>
        <span>bản ghi / trang</span>
        <span className="sep-pager__total">
          Tổng {totalCount} {itemLabel}
        </span>
      </div>

      <nav className="sep-pager__pages" aria-label="Phân trang">
        <button
          type="button"
          className="sep-pager__step"
          aria-label="Trang trước"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          <Icon name="chevron_left" size={20} />
        </button>

        {pageNumbers(page, lastPage).map((p, i) =>
          p === '…' ? (
            <span key={`ellipsis-${i}`} className="sep-pager__ellipsis" aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              className={`sep-pager__page${p === page ? ' sep-pager__page--active' : ''}`}
              aria-label={`Trang ${p}`}
              aria-current={p === page ? 'page' : undefined}
              onClick={() => onChange(p)}
            >
              {p}
            </button>
          ),
        )}

        <button
          type="button"
          className="sep-pager__step"
          aria-label="Trang sau"
          disabled={page >= lastPage}
          onClick={() => onChange(page + 1)}
        >
          <Icon name="chevron_right" size={20} />
        </button>
      </nav>
    </div>
  );
};
