import { Icon } from '../../../components/pcb';
import type { ExamListItem, ExamStatus } from '../../../types';

type ExamTableProps = {
  items: ExamListItem[];
  loading: boolean;
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

const STATUS_META: Record<ExamStatus, { label: string; className: string }> = {
  DRAFT: { label: 'Bản nháp', className: 'draft' },
  SCHEDULED: { label: 'Sắp diễn ra', className: 'scheduled' },
  ONGOING: { label: 'Đang diễn ra', className: 'ongoing' },
  COMPLETED: { label: 'Đã kết thúc', className: 'completed' },
  CANCELLED: { label: 'Đã hủy', className: 'cancelled' },
};

const formatDate = (value: string) => {
  const [year, month, day] = value.split('-');
  return year && month && day ? `${day}/${month}/${year}` : value;
};

const ExamRow = ({ exam }: { exam: ExamListItem }) => {
  const meta = STATUS_META[exam.status] ?? STATUS_META.DRAFT;

  return (
    <tr>
      <td>
        <strong className="exam-name">{exam.name}</strong>
        <small>{exam.schoolBranch.code}</small>
      </td>
      <td>{exam.semester.name}</td>
      <td>{exam.schoolBranch.name}</td>
      <td>
        <span className="exam-date">{formatDate(exam.startDate)}</span>
        {exam.endDate !== exam.startDate && <small>đến {formatDate(exam.endDate)}</small>}
      </td>
      <td>
        <span className={`exam-status exam-status--${meta.className}`}><i />{meta.label}</span>
      </td>
      <td>
        <button className="exam-more" type="button" aria-label={`Thao tác với ${exam.name}`}>
          <Icon name="more_vert" size={20} />
        </button>
      </td>
    </tr>
  );
};

const LoadingRows = () => (
  <>
    {[1, 2, 3].map((row) => (
      <tr key={row} className="exam-loading"><td colSpan={6}><span /></td></tr>
    ))}
  </>
);

export const ExamTable = ({
  items,
  loading,
  page,
  pageSize,
  totalCount,
  totalPages,
  onPageChange,
}: ExamTableProps) => (
  <section className="exam-table-card">
    <div className="exam-table-scroll">
      <table>
        <thead>
          <tr>
            <th>Tên kỳ thi</th><th>Học kỳ</th><th>Cơ sở</th>
            <th>Thời gian</th><th>Trạng thái</th><th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {loading ? <LoadingRows /> : items.length === 0 ? (
            <tr>
              <td className="exam-empty" colSpan={6}>
                <Icon name="event_busy" size={38} />
                <strong>Chưa có kỳ thi phù hợp</strong>
                <span>Thử thay đổi bộ lọc hoặc tạo kỳ thi mới.</span>
              </td>
            </tr>
          ) : items.map((exam) => <ExamRow key={exam.id} exam={exam} />)}
        </tbody>
      </table>
    </div>

    <div className="exam-pagination">
      <span>
        Hiển thị <strong>{items.length ? (page - 1) * pageSize + 1 : 0} - {(page - 1) * pageSize + items.length}</strong> của {totalCount} kỳ thi
      </span>
      <div>
        <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label="Trang trước">
          <Icon name="chevron_left" size={18} />
        </button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, index) => index + 1).map((value) => (
          <button key={value} type="button" className={page === value ? 'is-active' : ''} onClick={() => onPageChange(value)}>{value}</button>
        ))}
        <button type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} aria-label="Trang sau">
          <Icon name="chevron_right" size={18} />
        </button>
      </div>
    </div>
  </section>
);
