import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Field, Icon, PcbButton, SelectField } from '../../../components/pcb';
import { useAsync, useBusy, useDebounce } from '../../../hooks';
import { api } from '../../../services/api';
import type { MatrixTaskListItem, MatrixTaskTab, TaskGroup } from '../../../types';
import { contextNames } from '../../../utils/academicContext';
import { dueState, formatDate, localDateString } from '../../../utils/formatters';
import { isTeamLead } from '../../../utils/jwt';
import { toProblem } from '../../../utils/problem';
import { DimensionFilters, type DimensionFilterValue } from '../components/DimensionFilters';
import { PageHeader } from '../components/PageHeader';
import { Pager } from '../components/Pager';
import { PersonCell } from '../components/PersonCell';
import { RowAction, RowActionButton } from '../components/RowAction';
import { StatusTabs } from '../components/StatusTabs';
import { TableState } from '../components/TableState';
import '../matrix.css';

const GROUP_TABS: { value: TaskGroup; label: string }[] = [
  { value: 'MATRIX', label: 'Ma trận' },
  { value: 'QUESTION', label: 'Câu hỏi' },
  { value: 'EXAM', label: 'Đề thi' },
];

/** Nhóm chưa có backend: giữ chỗ tab như thiết kế, nhưng nói rõ chưa có gì thay vì giả một danh sách rỗng. */
const PENDING_GROUPS: Record<Exclude<TaskGroup, 'MATRIX'>, string> = {
  QUESTION: 'Nhiệm vụ biên soạn câu hỏi',
  EXAM: 'Nhiệm vụ tạo đề thi',
};

const STATUS_OPTIONS: { value: MatrixTaskTab; label: string }[] = [
  { value: 'ASSIGNED', label: 'Đã giao' },
  { value: 'OVERDUE', label: 'Quá hạn' },
  { value: 'SUBMITTED', label: 'Đã nộp' },
  { value: 'COMPLETED', label: 'Hoàn thành' },
];

/** Quá hạn = còn Đã giao và hạn trước hôm nay. Backend lọc DueAt <= dueBefore, nên lấy hết ngày hôm qua. */
const endOfYesterday = () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return `${localDateString(yesterday)}T23:59:59`;
};

const COLUMNS = 10;

const DueCell = ({ task }: { task: MatrixTaskListItem }) => {
  if (!task.dueAt) return <span className="sep-muted">Không đặt hạn</span>;
  const state = dueState(task.dueAt, task.status);
  return (
    <div className={`sep-due${state ? ` sep-due--${state}` : ''}`}>
      {formatDate(task.dueAt)}
      {state === 'overdue' && (
        <span className="sep-due__flag">
          <Icon name="schedule" size={16} />
          Quá hạn
        </span>
      )}
    </div>
  );
};

/** M01-B. Tổ trưởng chỉ thấy việc của mình, PHT thấy việc đã giao trong chi nhánh. */
export const TaskListPage = () => {
  const navigate = useNavigate();
  const teamLead = isTeamLead();
  // Nhóm nằm trên URL để quay lại từ màn chi tiết vẫn đúng tab.
  const [searchParams, setSearchParams] = useSearchParams();
  const group: TaskGroup = GROUP_TABS.find((tab) => tab.value === searchParams.get('group'))?.value ?? 'MATRIX';

  const [keyword, setKeyword] = useState('');
  const [filters, setFilters] = useState<DimensionFilterValue>({});
  const [status, setStatus] = useState<MatrixTaskTab | ''>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [notice, setNotice] = useState<{ message: string; kind: 'error' | 'success' } | null>(null);
  const [busy, runExclusive] = useBusy();

  const debouncedKeyword = useDebounce(keyword, 300);

  const reference = useAsync(() => api.matrix.referenceData(), []);
  const contexts = reference.data?.academicContexts ?? [];
  const semesters = reference.data?.semesters ?? [];
  const teamLeads = reference.data?.teamLeads ?? [];

  const overdue = status === 'OVERDUE';
  const query = {
    page,
    pageSize,
    status: overdue ? ('ASSIGNED' as const) : status || undefined,
    keyword: debouncedKeyword.trim() || undefined,
    dueBefore: overdue ? endOfYesterday() : undefined,
    ...filters,
  };

  const list = useAsync(
    async () => {
      if (group !== 'MATRIX') return null;
      return teamLead ? api.matrixTask.mine(query) : api.matrixTask.list(query);
    },
    [
      group,
      teamLead,
      query.page,
      query.pageSize,
      query.status,
      query.keyword,
      query.dueBefore,
      query.academicYearId,
      query.semesterId,
      query.subjectId,
      query.gradeLevelId,
    ],
  );

  const items = list.data?.items ?? [];
  const totalCount = list.data?.totalCount ?? 0;
  const filtered = Boolean(keyword || status || Object.values(filters).some((value) => value !== undefined));

  const reset = () => {
    setKeyword('');
    setFilters({});
    setStatus('');
    setPage(1);
  };

  // Mọi thay đổi bộ lọc đều phải quay về trang 1, nếu không sẽ thấy trang trống.
  const onFilterChange = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setPage(1);
  };

  const contextOf = (task: MatrixTaskListItem) => {
    const context = contexts.find((item) => item.id === task.academicContextId);
    return context ? contextNames(context) : null;
  };
  const semesterName = (task: MatrixTaskListItem) => semesters.find((item) => item.id === task.semesterId)?.name;

  // Cùng quy tắc với nút ở màn chi tiết: "đã thực hiện" = Tổ trưởng đã lưu nháp hoặc nộp ma trận.
  const deleteTask = (task: MatrixTaskListItem) => {
    setNotice(null);
    if (task.matrixId) {
      setNotice({ message: 'Nhiệm vụ đã được thực hiện, không thể xóa.', kind: 'error' });
      return;
    }
    if (!window.confirm('Nhiệm vụ chưa được thực hiện, xác nhận xóa?')) return;
    void runExclusive(async () => {
      try {
        await api.matrixTask.remove(task.id);
        setNotice({ message: `Đã xoá nhiệm vụ "${task.name}".`, kind: 'success' });
      } catch (error) {
        setNotice({ message: toProblem(error).message, kind: 'error' });
      }
      // Xoá dòng cuối cùng của trang cuối thì lùi một trang, nếu không sẽ thấy trang trống.
      if (items.length === 1 && page > 1) setPage(page - 1);
      else list.reload();
    });
  };

  // PHT cần biết ai đang làm; Tổ trưởng cần biết ai giao.
  const assigneeName = (task: MatrixTaskListItem) =>
    teamLeads.find((lead) => lead.id === task.assignedToUserId)?.fullName;

  const error = list.error ?? reference.error;
  const dash = <span className="sep-muted">—</span>;

  return (
    <>
      <PageHeader title={'Nhiệm vụ'} />

      <div className="sep-page">
        <StatusTabs
          label="Nhóm nhiệm vụ"
          tabs={GROUP_TABS}
          value={group}
          onChange={(value) => setSearchParams(value && value !== 'MATRIX' ? { group: value } : {}, { replace: true })}
        />

        {group !== 'MATRIX' ? (
          <div className="sep-empty">
            <span className="sep-empty__title">{PENDING_GROUPS[group]} chưa được hỗ trợ.</span>
            <span>Hiện mới giao và theo dõi được nhiệm vụ lập ma trận. Nhóm này sẽ có khi chức năng tương ứng hoàn thành.</span>
          </div>
        ) : (
          <>
            <div className="sep-toolbar">
              <div className="sep-toolbar__filters">
                <Field
                  label="Tìm kiếm"
                  hideLabel
                  leading="search"
                  placeholder="Tìm nội dung nhiệm vụ"
                  title="Tìm theo nội dung (yêu cầu công việc) hoặc tên nhiệm vụ"
                  value={keyword}
                  fieldClassName="sep-toolbar__search"
                  onChange={(event) => onFilterChange(setKeyword)(event.target.value)}
                />
                <DimensionFilters
                  contexts={contexts}
                  semesters={semesters}
                  value={filters}
                  onChange={onFilterChange(setFilters)}
                />
                <SelectField
                  label="Trạng thái"
                  hideLabel
                  placeholder="Trạng thái"
                  value={status}
                  title={overdue ? 'Nhiệm vụ còn Đã giao mà hạn hoàn thành đã qua' : undefined}
                  onChange={(event) => onFilterChange(setStatus)(event.target.value as MatrixTaskTab | '')}
                >
                  <option value="">Tất cả trạng thái</option>
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </SelectField>
                {filtered && (
                  <PcbButton variant="ghost" size="sm" onClick={reset}>
                    Xoá lọc
                  </PcbButton>
                )}
              </div>
              {!teamLead && (
                <div className="sep-toolbar__actions">
                  <PcbButton onClick={() => navigate('/matrix-tasks/new')}>
                    Giao nhiệm vụ
                    <Icon name="add" size={20} />
                  </PcbButton>
                </div>
              )}
            </div>

            {error != null && <div className="sep-alert" role="alert">{toProblem(error).message}</div>}
            {notice && (
              <div className={notice.kind === 'error' ? 'sep-alert' : 'sep-alert sep-alert--success'} role="alert">
                {notice.message}
              </div>
            )}

            <div className="pcb-table-wrap">
              <table className="pcb-table sep-table--dense">
                <thead>
                  <tr>
                    <th className="sep-col-index">STT</th>
                    <th className="sep-col-name">Nội dung nhiệm vụ</th>
                    <th>Môn</th>
                    <th>Khối</th>
                    <th>Năm học</th>
                    <th>Học kỳ</th>
                    <th>{teamLead ? 'Người giao' : 'Người phụ trách'}</th>
                    <th>Hạn</th>
                    <th>Trạng thái</th>
                    <th className="sep-col-actions">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((task, index) => {
                    const names = contextOf(task);
                    return (
                      <tr key={task.id}>
                        <td className="sep-col-index">{(page - 1) * pageSize + index + 1}</td>
                        <td>
                          {/* Nội dung = yêu cầu công việc (description). Nhiệm vụ giao không kèm yêu cầu thì hiện tên để vẫn nhận ra được. */}
                          <Link className="sep-row-link sep-clamp-2" to={`/matrix-tasks/${task.id}`} title={task.description ?? undefined}>
                            {task.description || task.name || 'Nhiệm vụ chưa đặt tên'}
                          </Link>
                        </td>
                        <td className="sep-nowrap">{names?.subjectId ?? dash}</td>
                        <td className="sep-nowrap">{names?.gradeLevelId ?? dash}</td>
                        <td className="sep-nowrap">{names?.academicYearId ?? dash}</td>
                        <td className="sep-nowrap">{semesterName(task) ?? dash}</td>
                        <td className="sep-nowrap">
                          {teamLead ? <PersonCell person={task.createdBy} /> : (assigneeName(task) ?? dash)}
                        </td>
                        <td className="sep-nowrap">
                          <DueCell task={task} />
                        </td>
                        <td>
                          <span className={`sep-status sep-status--${task.status}`}>{task.statusLabel}</span>
                        </td>
                        <td className="sep-col-actions">
                          <div className="sep-row-actions">
                            <RowAction to={`/matrix-tasks/${task.id}`} icon="visibility" label="Xem nhiệm vụ" />
                            {/* Mở ma trận đã lập: vào màn chi tiết nhiệm vụ, không lặp lại ở đây. */}
                            {!teamLead && (
                              <RowActionButton
                                icon="delete"
                                label="Xoá nhiệm vụ"
                                disabled={busy}
                                onClick={() => deleteTask(task)}
                              />
                            )}
                            {teamLead && !task.matrixId && (
                              <RowAction
                                to={`/matrix-tasks/${task.id}/matrix/new`}
                                icon="edit_square"
                                label="Bắt đầu lập ma trận"
                              />
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <TableState
                loading={list.loading}
                failed={Boolean(error)}
                empty={items.length === 0}
                columns={COLUMNS}
                title={
                  overdue
                    ? 'Không có nhiệm vụ nào quá hạn.'
                    : teamLead
                      ? 'Bạn chưa có nhiệm vụ nào khớp bộ lọc.'
                      : 'Chưa có nhiệm vụ nào khớp bộ lọc.'
                }
                hint={
                  filtered
                    ? 'Thử bỏ bớt điều kiện lọc hoặc đổi từ khoá tìm kiếm.'
                    : teamLead
                      ? 'Nhiệm vụ mới sẽ hiện ở đây khi Phó Hiệu trưởng giao cho bạn.'
                      : 'Bấm "Giao nhiệm vụ" để giao việc lập ma trận cho Tổ trưởng.'
                }
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
                itemLabel="nhiệm vụ"
                onChange={setPage}
                onPageSizeChange={onFilterChange(setPageSize)}
              />
            )}
          </>
        )}
      </div>
    </>
  );
};
