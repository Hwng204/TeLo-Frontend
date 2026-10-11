import { Pager } from '../../../components/common/Pager';
import { RowAction, RowActionButton } from '../../../components/common/RowAction';
import { TableState } from '../../../components/common/TableState';
import type { ExamListItem, ExamStatus } from '../../../types';

type ExamTableProps = {
  items: ExamListItem[];
  loading: boolean;
  failed: boolean;
  page: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onDelete: (exam: ExamListItem) => void;
};

const STATUS_META: Record<ExamStatus, { label: string; className: string }> = {
  DRAFT: { label: 'Đang cấu hình', className: 'amber' },
  SCHEDULED: { label: 'Đã chốt', className: 'green' },
  ONGOING: { label: 'Đã chốt', className: 'green' },
  COMPLETED: { label: 'Đã kết thúc', className: 'gray' },
  CANCELLED: { label: 'Đã hủy', className: 'gray' },
};

export const ExamTable = ({
  items,
  loading,
  failed,
  page,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
  onDelete,
}: ExamTableProps) => (
  <>
    <div className="pcb-table-wrap exam-table-wrap">
      <table className="pcb-table exam-table">
        <thead>
          <tr>
            <th className="sep-col-index">STT</th><th>Kỳ thi</th><th>Học kỳ</th><th>Năm học</th>
            <th>Khối</th><th>Môn</th><th>Trạng thái</th><th className="sep-col-actions">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {items.map((exam, index) => {
            const meta = STATUS_META[exam.status] ?? STATUS_META.DRAFT;
            return (
              <tr key={exam.id}>
                <td className="sep-col-index">{(page - 1) * pageSize + index + 1}</td>
                <td className="sep-col-name">{exam.name}</td>
                <td>{exam.semester.name}</td>
                <td>{exam.academicYear.name}</td>
                <td>{exam.gradeLevel?.name ?? '—'}</td>
                <td>{exam.subject?.name ?? '—'}</td>
                <td><span className={`sep-status sep-status--${meta.className}`}>{meta.label}</span></td>
                <td className="sep-col-actions">
                  <div className="sep-row-actions">
                    <RowAction to={`/exams/detail/${exam.id}`} icon="visibility" label={`Xem chi tiết ${exam.name}`} />
                    <RowAction to={`/exams/update/${exam.id}`} icon="edit" label={`Cập nhật ${exam.name}`} />
                    <RowActionButton icon="delete" label={`Xóa ${exam.name}`} onClick={() => onDelete(exam)} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <TableState loading={loading} failed={failed} empty={items.length === 0} columns={8} title="Không có kỳ thi nào khớp bộ lọc." hint="Thử thay đổi điều kiện lọc hoặc tạo kỳ thi mới." />
    </div>
    {totalCount > 0 && <Pager page={page} pageSize={pageSize} totalCount={totalCount} itemLabel="kỳ thi" onChange={onPageChange} onPageSizeChange={onPageSizeChange} />}
  </>
);
