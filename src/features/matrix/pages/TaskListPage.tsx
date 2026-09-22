import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Field, PcbButton, SelectField } from '../../../components/pcb';
import { useAsync, useDebounce } from '../../../hooks';
import { api } from '../../../services/api';
import type { MatrixTaskStatus } from '../../../types';
import { contextLabel, resolveContextId } from '../../../utils/academicContext';
import type { ContextSelection } from '../../../utils/academicContext';
import { isTeamLead } from '../../../utils/jwt';
import { toProblem } from '../../../utils/problem';
import { ContextSelects } from '../components/ContextSelects';
import { Pager } from '../components/Pager';
import { PersonCell } from '../components/PersonCell';
import { TableState } from '../components/TableState';
import '../matrix.css';

const PAGE_SIZE = 20;

const STATUSES: { value: MatrixTaskStatus; label: string }[] = [
  { value: 'ASSIGNED', label: 'Đã giao' },
  { value: 'SUBMITTED', label: 'Đã nộp' },
  { value: 'COMPLETED', label: 'Hoàn thành' },
];

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString('vi-VN') : '—';

/** M01-B. Tổ trưởng chỉ thấy việc của mình, PHT thấy việc đã giao trong chi nhánh. */
export const TaskListPage = () => {
  const navigate = useNavigate();
  const teamLead = isTeamLead();

  const [keyword, setKeyword] = useState('');
  const [selection, setSelection] = useState<ContextSelection>({});
  const [status, setStatus] = useState<MatrixTaskStatus | ''>('');
  const [page, setPage] = useState(1);

  const debouncedKeyword = useDebounce(keyword, 300);

  const reference = useAsync(() => api.matrix.referenceData(), []);
  const contexts = reference.data?.academicContexts ?? [];
  const semesters = reference.data?.semesters ?? [];

  const query = {
    page,
    pageSize: PAGE_SIZE,
    status: status || undefined,
    keyword: debouncedKeyword.trim() || undefined,
    academicContextId: resolveContextId(contexts, selection) ?? undefined,
  };

  const list = useAsync(
    () => (teamLead ? api.matrixTask.mine(query) : api.matrixTask.list(query)),
    [teamLead, query.page, query.status, query.keyword, query.academicContextId],
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
        <h1 className="sep-page-title">Nhiệm vụ lập ma trận</h1>
      </div>

      {!teamLead && (
        <div className="sep-actions">
          <PcbButton onClick={() => navigate('/matrix-tasks/new')}>Giao nhiệm vụ</PcbButton>
        </div>
      )}

      <div className="pcb-card sep-filters">
        <Field
          label="Tìm kiếm"
          leading="search"
          placeholder="Tìm theo mã nhiệm vụ hoặc yêu cầu công việc"
          value={keyword}
          onChange={(event) => onFilterChange(setKeyword)(event.target.value)}
        />

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
            onChange={(event) => onFilterChange(setStatus)(event.target.value as MatrixTaskStatus | '')}
          >
            <option value="">Tất cả</option>
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
              <th>Nhiệm vụ</th>
              <th>Người giao</th>
              <th>Hạn hoàn thành</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {items.map((task) => (
              <tr key={task.id}>
                <td>
                  <Link className="sep-row-link" to={`/matrix-tasks/${task.id}`}>
                    {task.code && <div className="sep-muted sep-nowrap">{task.code}</div>}
                    {contextLabel(contexts, task.academicContextId)}
                  </Link>
                </td>
                <td>
                  <PersonCell person={task.createdBy} />
                </td>
                <td className="sep-nowrap">{formatDate(task.dueAt)}</td>
                <td>
                  <span className="sep-status">{task.statusLabel}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <TableState
          loading={list.loading}
          failed={Boolean(error)}
          empty={items.length === 0}
          columns={4}
          title={teamLead ? 'Bạn chưa có nhiệm vụ nào khớp bộ lọc.' : 'Chưa có nhiệm vụ nào khớp bộ lọc.'}
          hint={
            teamLead
              ? 'Nhiệm vụ mới sẽ hiện ở đây khi Phó Hiệu trưởng giao cho bạn.'
              : 'Thử bỏ bớt điều kiện lọc, hoặc giao một nhiệm vụ mới.'
          }
          action={
            <PcbButton variant="secondary" size="sm" onClick={reset}>
              Đặt lại bộ lọc
            </PcbButton>
          }
        />

        {totalCount > PAGE_SIZE && (
          <Pager page={page} lastPage={lastPage} totalCount={totalCount} itemLabel="nhiệm vụ" onChange={setPage} />
        )}
      </div>
    </>
  );
};
