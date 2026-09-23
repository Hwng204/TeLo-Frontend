import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Field, Icon, PcbButton } from '../../../components/pcb';
import { useAsync, useDebounce } from '../../../hooks';
import { api } from '../../../services/api';
import type { MatrixListQuery, MatrixStatus } from '../../../types';
import { formatScore } from '../../../utils/matrixGrid';
import { toProblem } from '../../../utils/problem';
import { contextNames } from '../../../utils/academicContext';
import { DimensionFilters, type DimensionFilterValue } from '../components/DimensionFilters';
import { PageHeader } from '../components/PageHeader';
import { Pager } from '../components/Pager';
import { PersonCell } from '../components/PersonCell';
import { RowAction } from '../components/RowAction';
import { StatusTabs } from '../components/StatusTabs';
import { TableState } from '../components/TableState';
import '../matrix.css';

const STATUS_TABS: { value: MatrixStatus | ''; label: string; title?: string }[] = [
  { value: '', label: 'Tất cả', title: 'Mọi ma trận trừ ma trận đã lưu trữ' },
  { value: 'DRAFT', label: 'Nháp' },
  { value: 'SUBMITTED', label: 'Đã nộp' },
  { value: 'APPROVED', label: 'Đã duyệt' },
  { value: 'ARCHIVED', label: 'Đã lưu trữ' },
];

const COLUMNS = 10;

/** Danh sách ma trận của PHT. */
export const MatrixListPage = () => {
  const navigate = useNavigate();

  const [keyword, setKeyword] = useState('');
  const [selection, setSelection] = useState<DimensionFilterValue>({});
  const [status, setStatus] = useState<MatrixStatus | ''>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const debouncedKeyword = useDebounce(keyword, 300);

  const reference = useAsync(() => api.matrix.referenceData(), []);
  const contexts = reference.data?.academicContexts ?? [];
  const semesters = reference.data?.semesters ?? [];

  const query: MatrixListQuery = {
    page,
    pageSize,
    keyword: debouncedKeyword.trim() || undefined,
    ...selection,
    status: status || undefined,
  };

  const list = useAsync(
    () => api.matrix.list(query),
    [
      query.page,
      query.pageSize,
      query.keyword,
      query.status,
      query.academicYearId,
      query.semesterId,
      query.subjectId,
      query.gradeLevelId,
    ],
  );

  const items = reference.loading ? [] : list.data?.items ?? [];
  const totalCount = list.data?.totalCount ?? 0;
  const filtered = Boolean(keyword || status || Object.values(selection).some((value) => value !== undefined));

  const reset = () => {
    setKeyword('');
    setSelection({});
    setStatus('');
    setPage(1);
  };

  // Mọi thay đổi bộ lọc đều phải quay về trang 1, nếu không sẽ thấy trang trống.
  const onFilterChange = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setPage(1);
  };

  const error = list.error ?? reference.error;
  const dash = <span className="sep-muted">—</span>;

  return (
    <>
      <PageHeader title="Ma trận đề" />

      <div className="sep-page">
        <StatusTabs label="Lọc theo trạng thái" tabs={STATUS_TABS} value={status} onChange={onFilterChange(setStatus)} />

        <div className="sep-toolbar">
          <div className="sep-toolbar__filters">
            <Field
              label="Tìm kiếm"
              hideLabel
              leading="search"
              placeholder="Tìm ma trận"
              title="Tìm theo tên ma trận"
              value={keyword}
              fieldClassName="sep-toolbar__search"
              onChange={(event) => onFilterChange(setKeyword)(event.target.value)}
            />
            <DimensionFilters
              contexts={contexts}
              semesters={semesters}
              value={selection}
              onChange={onFilterChange(setSelection)}
            />
            {filtered && (
              <PcbButton variant="ghost" size="sm" onClick={reset}>
                Xoá lọc
              </PcbButton>
            )}
          </div>
          <div className="sep-toolbar__actions">
            <PcbButton onClick={() => navigate('/matrices/new')}>
              Tạo ma trận
              <Icon name="add" size={20} />
            </PcbButton>
          </div>
        </div>

        {error != null && <div className="sep-alert" role="alert">{toProblem(error).message}</div>}

        <div className="pcb-table-wrap">
          <table className="pcb-table sep-table--dense">
            <thead>
              <tr>
                <th className="sep-col-index">STT</th>
                <th className="sep-col-name">Tên ma trận</th>
                <th>Môn</th>
                <th>Khối</th>
                <th>Năm học</th>
                <th>Học kỳ</th>
                <th>Người lập</th>
                <th>Quy mô</th>
                <th>Trạng thái</th>
                <th className="sep-col-actions">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {items.map((matrix, index) => {
                const context = contexts.find((item) => item.id === matrix.academicContextId);
                const names = context ? contextNames(context) : null;
                const semester = semesters.find((item) => item.id === matrix.semesterId);
                return (
                  <tr key={matrix.id}>
                    <td className="sep-col-index">{(page - 1) * pageSize + index + 1}</td>
                    <td>
                      <Link className="sep-row-link" to={`/matrices/${matrix.id}`}>
                        {matrix.name}
                      </Link>
                    </td>
                    <td className="sep-nowrap">{names?.subjectId ?? dash}</td>
                    <td className="sep-nowrap">{names?.gradeLevelId ?? dash}</td>
                    <td className="sep-nowrap">{names?.academicYearId ?? dash}</td>
                    <td className="sep-nowrap">{semester?.name ?? dash}</td>
                    <td className="sep-nowrap">
                      <PersonCell person={matrix.createdBy} />
                    </td>
                    <td className="sep-nowrap">
                      {matrix.totalQuestions} câu
                      <div className="sep-subline">{formatScore(matrix.totalScore)} điểm</div>
                    </td>
                    <td>
                      <span className={`sep-status sep-status--${matrix.status}`}>{matrix.statusLabel}</span>
                    </td>
                    <td className="sep-col-actions">
                      <div className="sep-row-actions">
                        <RowAction to={`/matrices/${matrix.id}`} icon="visibility" label={`Xem ma trận ${matrix.name}`} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <TableState
            loading={list.loading || reference.loading}
            failed={Boolean(error)}
            empty={items.length === 0}
            columns={COLUMNS}
            title="Không có ma trận nào khớp bộ lọc."
            hint={filtered ? 'Thử bỏ bớt điều kiện lọc hoặc đổi từ khoá tìm kiếm.' : 'Bấm "Tạo ma trận" để lập ma trận đầu tiên.'}
            action={
              filtered && (
                <PcbButton variant="secondary" size="sm" onClick={reset}>
                  Xoá bộ lọc
                </PcbButton>
              )
            }
          />
        </div>

        {totalCount > 0 && (
          <Pager
            page={page}
            pageSize={pageSize}
            totalCount={totalCount}
            itemLabel="ma trận"
            onChange={setPage}
            onPageSizeChange={onFilterChange(setPageSize)}
          />
        )}
      </div>
    </>
  );
};
