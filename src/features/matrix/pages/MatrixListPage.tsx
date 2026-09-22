import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Field, PcbButton, SelectField } from '../../../components/pcb';
import { useAsync, useDebounce } from '../../../hooks';
import { api } from '../../../services/api';
import type { MatrixListQuery, MatrixStatus } from '../../../types';
import { formatScore } from '../../../utils/matrixGrid';
import { toProblem } from '../../../utils/problem';
import { isPht } from '../../../utils/jwt';
import { contextLabel, resolveContextId } from '../../../utils/academicContext';
import type { ContextSelection } from '../../../utils/academicContext';
import { ContextSelects } from '../components/ContextSelects';
import { Pager } from '../components/Pager';
import { PersonCell } from '../components/PersonCell';
import { TableState } from '../components/TableState';
import '../matrix.css';

const PAGE_SIZE = 20;

const STATUSES: { value: MatrixStatus; label: string }[] = [
  { value: 'DRAFT', label: 'Nháp' },
  { value: 'SUBMITTED', label: 'Đã nộp' },
  { value: 'APPROVED', label: 'Đã duyệt' },
  { value: 'ARCHIVED', label: 'Đã lưu trữ' },
];

export const MatrixListPage = () => {
  const navigate = useNavigate();

  const [keyword, setKeyword] = useState('');
  const [selection, setSelection] = useState<ContextSelection>({});
  const [status, setStatus] = useState<MatrixStatus | ''>('');
  const [page, setPage] = useState(1);

  const debouncedKeyword = useDebounce(keyword, 300);

  const reference = useAsync(() => api.matrix.referenceData(), []);
  const contexts = reference.data?.academicContexts ?? [];
  const semesters = reference.data?.semesters ?? [];

  const query: MatrixListQuery = {
    page,
    pageSize: PAGE_SIZE,
    keyword: debouncedKeyword.trim() || undefined,
    academicContextId: resolveContextId(contexts, selection) ?? undefined,
    semesterId: selection.semesterId,
    status: status || undefined,
  };

  const list = useAsync(
    () => api.matrix.list(query),
    [query.page, query.keyword, query.academicContextId, query.semesterId, query.status],
  );

  const items = list.data?.items ?? [];
  const totalCount = list.data?.totalCount ?? 0;
  const lastPage = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

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

  return (
    <>
      <div className="sep-page-header">
        <h1 className="sep-page-title">Danh sách ma trận</h1>
      </div>

      {isPht() && (
        <div className="sep-actions">
          <PcbButton variant="secondary" onClick={() => navigate('/matrix-tasks/new')}>
            Giao lập ma trận
          </PcbButton>
          <PcbButton onClick={() => navigate('/matrices/new')}>Tạo ma trận</PcbButton>
        </div>
      )}

      <div className="pcb-card sep-filters">
        <Field
          label="Tìm kiếm"
          leading="search"
          placeholder="Tìm theo tên ma trận"
          value={keyword}
          onChange={(event) => onFilterChange(setKeyword)(event.target.value)}
        />

        {/* Trạng thái nằm chung lưới với các ô ngữ cảnh, nếu để riêng nó sẽ kéo dài hết chiều ngang thẻ. */}
        <div className="sep-context sep-context--compact">
          <ContextSelects
            bare
            compact
            contexts={contexts}
            semesters={semesters}
            value={selection}
            onChange={onFilterChange(setSelection)}
          />

          <SelectField
            label="Trạng thái"
            value={status}
            onChange={(event) => onFilterChange(setStatus)(event.target.value as MatrixStatus | '')}
          >
            <option value="">Tất cả (trừ đã lưu trữ)</option>
            {STATUSES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectField>
        </div>

        <div className="sep-actions">
          <PcbButton variant="ghost" size="sm" onClick={reset}>
            Đặt lại
          </PcbButton>
        </div>
      </div>

      {error && <div className="sep-alert" role="alert">{toProblem(error).message}</div>}

      <div className="pcb-card pcb-table-wrap">
        <table className="pcb-table">
          <thead>
            <tr>
              <th>Mã ma trận</th>
              <th>Ngữ cảnh · Học kỳ</th>
              <th>Người lập</th>
              <th>Quy mô</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {items.map((matrix) => (
              <tr key={matrix.id}>
                <td>
                  <Link className="sep-row-link" to={`/matrices/${matrix.id}`}>
                    {matrix.code || matrix.name}
                  </Link>
                </td>
                <td className="sep-muted">
                  {contextLabel(contexts, matrix.academicContextId)}
                  {matrix.semesterId
                    ? ` · ${semesters.find((s) => s.id === matrix.semesterId)?.name ?? ''}`
                    : ''}
                </td>
                <td>
                  <PersonCell person={matrix.createdBy} />
                </td>
                <td className="sep-nowrap">
                  {matrix.totalQuestions} câu · {formatScore(matrix.totalScore)} điểm
                </td>
                <td>
                  <span className={`sep-status sep-status--${matrix.status}`}>{matrix.statusLabel}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <TableState
          loading={list.loading}
          failed={Boolean(error)}
          empty={items.length === 0}
          columns={5}
          title="Không có ma trận nào khớp bộ lọc."
          hint="Thử bỏ bớt điều kiện lọc hoặc đổi từ khoá tìm kiếm."
          action={
            <PcbButton variant="secondary" size="sm" onClick={reset}>
              Đặt lại bộ lọc
            </PcbButton>
          }
        />

        {totalCount > PAGE_SIZE && (
          <Pager page={page} lastPage={lastPage} totalCount={totalCount} itemLabel="ma trận" onChange={setPage} />
        )}
      </div>
    </>
  );
};
