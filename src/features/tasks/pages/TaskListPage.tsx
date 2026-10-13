import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Field, Icon, PcbButton, SelectField } from '../../../components/pcb';
import { ConfirmDialog, DeleteMessage } from '../../../components/common/ConfirmDialog';
import { PageHeader } from '../../../components/common/PageHeader';
import { Pager } from '../../../components/common/Pager';
import { RowAction, RowActionButton } from '../../../components/common/RowAction';
import { TableState } from '../../../components/common/TableState';
import { useAsync, useBusy, useDebounce } from '../../../hooks';
import { api } from '../../../services/api';
import type { TaskListItem, TaskListQuery, TaskType } from '../../../types';
import { getRoles, isPht, isTeacher, isTeamLead } from '../../../utils/jwt';
import { toProblem } from '../../../utils/problem';
import '../../matrix/matrix.css';
import '../tasks.css';

const TYPE_OPTIONS: { value: TaskType; label: string }[] = [
  { value: 'MATRIX', label: 'Ma trận' },
  { value: 'EXAM', label: 'Đề thi' },
  { value: 'QUESTION', label: 'Câu hỏi' },
];

const STATUS_OPTIONS: { value: NonNullable<TaskListQuery['status']>; label: string }[] = [
  { value: 'ASSIGNED', label: 'Đã giao' },
  { value: 'IN_PROGRESS', label: 'Đang thực hiện' },
  { value: 'PENDING_REVIEW', label: 'Chờ kiểm duyệt' },
  { value: 'NEEDS_REVISION', label: 'Cần chỉnh sửa' },
  { value: 'COMPLETED', label: 'Hoàn thành' },
  { value: 'OVERDUE', label: 'Quá hạn' },
];

const DELETE_STARTED = 'Nhiệm vụ đã được thực hiện, không thể xóa.';

/** NV01-P, NV01-T, T04-B: mọi loại nhiệm vụ trong một bảng; ai thấy dòng nào do backend quyết định (GB-54). */
export const TaskListPage = () => {
  const navigate = useNavigate();
  const teamLead = isTeamLead();
  // PHT chọn loại (ma trận hoặc đề thi); Tổ trưởng giao câu hỏi; giáo viên không giao việc.
  const addPath = teamLead ? '/matrix-tasks/new/question' : getRoles().includes('PHT') ? '/matrix-tasks/new' : null;
  // PHT tự kiểm duyệt việc mình giao; giáo viên chính là người thực hiện: cột đó chỉ lặp lại một tên.
  const showReviewer = teamLead || !isPht();
  const showPerformer = !isTeacher();
  const columns = 5 + Number(showReviewer) + Number(showPerformer);

  const [keyword, setKeyword] = useState('');
  const [taskType, setTaskType] = useState<TaskType | ''>('');
  const [status, setStatus] = useState<TaskListQuery['status'] | ''>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [notice, setNotice] = useState<{ message: string; kind: 'error' | 'success' } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<TaskListItem | null>(null);
  const [busy, runExclusive] = useBusy();
  const debouncedKeyword = useDebounce(keyword, 300);

  const query: TaskListQuery = {
    page,
    pageSize,
    keyword: debouncedKeyword.trim() || undefined,
    taskType: taskType || undefined,
    status: status || undefined,
  };
  const list = useAsync(() => api.task.list(query), [query.page, query.pageSize, query.keyword, query.taskType, query.status]);
  const items = list.data?.items ?? [];
  const totalCount = list.data?.totalCount ?? 0;
  const filtered = Boolean(keyword || taskType || status);
  // Trạng thái rỗng có nút xóa lọc riêng: thanh công cụ không hiện thêm nút thứ hai.
  const emptyShown = !list.loading && list.error == null && items.length === 0;

  // Đổi bộ lọc thì về trang 1, nếu không sẽ thấy trang trống.
  const onFilterChange = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setPage(1);
  };

  const reset = () => {
    setKeyword('');
    setTaskType('');
    setStatus('');
    setPage(1);
  };

  // GB-55: chỉ xoá được khi người thực hiện chưa bắt đầu; backend kiểm tra lại lúc xoá (409).
  const askDelete = (task: TaskListItem) => {
    setNotice(null);
    if (!task.canDelete) {
      setNotice({ message: DELETE_STARTED, kind: 'error' });
      return;
    }
    setPendingDelete(task);
  };

  const confirmDelete = () => {
    const task = pendingDelete;
    if (!task) return;
    void runExclusive(async () => {
      try {
        const response = await api.task.remove(task.id);
        setNotice({ message: response.message ?? `Đã xóa nhiệm vụ "${task.name}".`, kind: 'success' });
        // Xoá dòng cuối cùng của trang cuối thì lùi một trang.
        if (items.length === 1 && page > 1) setPage(page - 1);
        else list.reload();
      } catch (error) {
        setNotice({ message: toProblem(error).message, kind: 'error' });
        list.reload();
      }
      setPendingDelete(null);
    });
  };

  const dash = <span className="sep-muted">—</span>;

  return (
    <>
      <PageHeader title="Nhiệm vụ" />

      <div className="sep-page">
        <div className="sep-toolbar">
          <div className="sep-toolbar__filters">
            <Field
              label="Tìm kiếm"
              hideLabel
              leading="search"
              placeholder="Tìm nội dung nhiệm vụ"
              value={keyword}
              fieldClassName="sep-toolbar__search sep-task-search"
              onChange={(event) => onFilterChange(setKeyword)(event.target.value)}
            />
            <SelectField
              label="Loại nhiệm vụ"
              hideLabel
              placeholder="Loại nhiệm vụ"
              value={taskType}
              onChange={(event) => onFilterChange(setTaskType)(event.target.value as TaskType | '')}
            >
              <option value="">Tất cả</option>
              {TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Trạng thái"
              hideLabel
              placeholder="Trạng thái"
              value={status}
              onChange={(event) => onFilterChange(setStatus)(event.target.value as TaskListQuery['status'] | '')}
            >
              <option value="">Tất cả</option>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectField>
            {filtered && !emptyShown && (
              <PcbButton variant="ghost" size="sm" onClick={reset}>
                Xóa bộ lọc
              </PcbButton>
            )}
          </div>
          {addPath && (
            <div className="sep-toolbar__actions">
              <PcbButton onClick={() => navigate(addPath)}>Thêm nhiệm vụ</PcbButton>
            </div>
          )}
        </div>

        {notice && (
          <div className={notice.kind === 'error' ? 'sep-alert' : 'sep-alert sep-alert--success'} role="alert">
            {notice.message}
          </div>
        )}

        {list.error != null ? (
          <div className="sep-alert" role="alert">
            {toProblem(list.error).message}
            <PcbButton variant="secondary" onClick={list.reload}>Thử lại</PcbButton>
          </div>
        ) : (
          <div className="pcb-table-wrap">
            <table className={`pcb-table sep-table--dense sep-task-list${emptyShown ? ' sep-task-list--empty' : ''}`}>
              <thead>
                <tr>
                  <th className="sep-col-index sep-task-col-wide">STT</th>
                  <th className="sep-col-name">Nội dung nhiệm vụ</th>
                  <th className="sep-task-col-type">Loại nhiệm vụ</th>
                  {showPerformer && <th className="sep-task-col-person sep-task-col-wide">Người thực hiện</th>}
                  {showReviewer && <th className="sep-task-col-person sep-task-col-wide">Người kiểm duyệt</th>}
                  <th className="sep-task-col-status">Trạng thái</th>
                  <th className="sep-col-actions">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {items.map((task, index) => (
                  <tr key={task.id}>
                    <td className="sep-col-index sep-task-col-wide">{(page - 1) * pageSize + index + 1}</td>
                    <td className="sep-task-cell-name">
                      <span className="sep-clamp-2" title={task.name}>
                        {task.name}
                      </span>
                    </td>
                    <td className="sep-nowrap sep-task-cell-type">{task.taskTypeLabel}</td>
                    {showPerformer && <td className="sep-task-col-wide">{task.performer?.fullName ?? dash}</td>}
                    {showReviewer && <td className="sep-task-col-wide">{task.reviewer?.fullName ?? dash}</td>}
                    <td className="sep-task-cell-status">
                      <div className="sep-task-state">
                        <span className={`sep-status sep-status--${task.status}`}>{task.statusLabel}</span>
                        {task.isOverdue && (
                          <span className="sep-task-overdue">
                            <Icon name="schedule" size={16} />
                            Quá hạn
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="sep-col-actions">
                      <div className="sep-row-actions">
                        <RowAction to={`/matrix-tasks/${task.id}`} icon="visibility" label="Xem nhiệm vụ" />
                        {task.canEdit && <RowAction to={`/matrix-tasks/${task.id}/edit`} icon="edit_square" label="Chỉnh sửa nhiệm vụ" />}
                        {task.canDelete && (
                          <RowActionButton icon="delete" label="Xóa nhiệm vụ" disabled={busy} onClick={() => askDelete(task)} />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <TableState
              loading={list.loading}
              failed={Boolean(list.error)}
              empty={items.length === 0}
              columns={columns}
              title={filtered ? 'Không có nhiệm vụ nào khớp bộ lọc.' : 'Chưa có nhiệm vụ nào.'}
              hint={
                filtered
                  ? 'Thử bỏ bớt điều kiện lọc hoặc đổi từ khoá tìm kiếm.'
                  : addPath
                    ? 'Bấm "Thêm nhiệm vụ" để giao việc.'
                    : 'Nhiệm vụ mới sẽ hiện ở đây khi được giao cho bạn.'
              }
              action={
                filtered && (
                  <PcbButton variant="secondary" size="sm" onClick={reset}>
                    Xóa bộ lọc
                  </PcbButton>
                )
              }
            />
          </div>
        )}

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
      </div>

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        className="sep-delete-confirm"
        title="Xóa nhiệm vụ?"
        message={<DeleteMessage subject="Nhiệm vụ" name={pendingDelete?.name ?? ''} />}
        confirmText="Xóa nhiệm vụ"
        cancelText="Đóng"
        loadingText="Đang xóa…"
        isLoading={busy}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
};
