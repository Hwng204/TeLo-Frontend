import { useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Icon, PcbButton } from '../../../components/pcb';
import { ConfirmDialog, DeleteMessage } from '../../../components/common/ConfirmDialog';
import { InfoGrid, type InfoItem } from '../../../components/common/InfoGrid';
import { PageHeader } from '../../../components/common/PageHeader';
import { RowAction } from '../../../components/common/RowAction';
import { useAsync, useBusy } from '../../../hooks';
import { api } from '../../../services/api';
import type { TaskDetail } from '../../../types';
import { formatDate, personLabel } from '../../../utils/formatters';
import { getUserId, isPht } from '../../../utils/jwt';
import { toProblem } from '../../../utils/problem';
import { displayToast } from '../../../utils/toast';
import { LessonCardView } from '../components/LessonCard';
import '../../matrix/matrix.css';
import '../tasks.css';

// Chữ "Quá hạn" đã có ở chip cạnh trạng thái; ô hạn chỉ giữ màu đỏ.
const Due = ({ value, overdue }: { value: string | null; overdue?: boolean }) =>
  value ? <span className={overdue ? 'sep-due--overdue' : undefined}>{formatDate(value)}</span> : 'Không đặt hạn';

type SubRow = { key: string; cells: ReactNode[] };

/** Bảng con trong khung mảnh: Ma trận đã lập, Các đề cần tạo. Mỗi ô mang nhãn cột để màn hẹp xếp thành nhãn – giá trị. */
const SubTable = ({ heads, rows }: { heads: string[]; rows: SubRow[] }) => (
  <div className="sep-panel">
    <div className="sep-panel__scroll">
      <table className="pcb-table sep-task-table">
        <thead>
          <tr>
            {heads.map((head) => (
              <th key={head}>{head}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              {row.cells.map((cell, index) => (
                <td key={heads[index]} data-label={heads[index]}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

/**
 * Chi tiết theo loại và theo người xem: M01-BD / NV02-MP (ma trận), NV02-ET / NV02-EP (đề thi),
 * T04-AD / T04-BD (câu hỏi). Chỉ người giao, người làm, người kiểm duyệt mở được (GB-54).
 */
export const TaskDetailPage = () => {
  const navigate = useNavigate();
  const taskId = Number(useParams().id);
  const back = () => navigate('/matrix-tasks');
  const [problem, setProblem] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, runExclusive] = useBusy();

  const detail = useAsync(() => api.task.get(taskId), [taskId]);
  const task = detail.data;

  if (detail.loading) {
    return (
      <>
        <PageHeader title="Chi tiết nhiệm vụ" onBack={back} />
        <p className="sep-empty" role="status">Đang tải…</p>
      </>
    );
  }

  if (!task) {
    return (
      <>
        <PageHeader title="Chi tiết nhiệm vụ" onBack={back} />
        <div className="sep-page">
          <div className="sep-alert" role="alert">
            {detail.error ? toProblem(detail.error).message : 'Không tìm thấy nhiệm vụ.'}
            {Boolean(detail.error) && <PcbButton variant="secondary" onClick={detail.reload}>Thử lại</PcbButton>}
          </div>
        </div>
      </>
    );
  }

  const me = getUserId();
  const isCreator = String(task.createdBy?.userId) === me;
  const isPerformer = String(task.performer?.userId) === me;
  const edit = (variant?: 'secondary') => task.canEdit && (
    <PcbButton variant={variant} onClick={() => navigate(`/matrix-tasks/${task.id}/edit`)}>
      <Icon name="edit" size={20} />
      Chỉnh sửa nhiệm vụ
    </PcbButton>
  );

  // GB-55: chỉ xoá được khi người thực hiện chưa bắt đầu; backend kiểm tra lại lúc xoá.
  const askDelete = () => {
    setProblem(null);
    if (!task.canDelete) displayToast('error', 'Lỗi', 'Nhiệm vụ đã được thực hiện, không thể xóa.', 5);
    else setConfirming(true);
  };
  const confirmDelete = () =>
    void runExclusive(async () => {
      try {
        await api.task.remove(task.id);
        displayToast('success', 'Thành công', 'Đã xóa nhiệm vụ.');
        navigate('/matrix-tasks', { replace: true });
      } catch (error) {
        const parsed = toProblem(error);
        setProblem(parsed.message);
        displayToast('error', 'Lỗi', parsed.message, 5);
        setConfirming(false);
        if (parsed.status === 404) navigate('/matrix-tasks', { replace: true });
        else detail.reload();
      }
    });

  const view = task.taskType === 'MATRIX'
    ? matrixView(task, isPerformer, navigate, edit)
    : task.taskType === 'EXAM'
      ? examView(task, navigate, edit)
      : questionView(task, isCreator, isPerformer, navigate, edit, askDelete, busy);

  return (
    <>
      <PageHeader title={view.title} onBack={back} />

      <div className="sep-page">
        {problem && <div className="sep-alert" role="alert">{problem}</div>}

        <div className="sep-task-status">
          Trạng thái
          <span className={`sep-status sep-status--${task.status}`}>{task.statusLabel}</span>
          {task.isOverdue && (
            <span className="sep-task-overdue">
              <Icon name="schedule" size={16} />
              Quá hạn
            </span>
          )}
        </div>

        {view.rows.map((row, index) => (
          <InfoGrid key={index} items={row} className="sep-task-row" />
        ))}

        {view.section}

        <div className="sep-actions sep-task-actions">{view.actions}</div>
      </div>

      <ConfirmDialog
        isOpen={confirming}
        className="sep-delete-confirm"
        title="Xóa nhiệm vụ?"
        message={<DeleteMessage subject="Nhiệm vụ" name={task.name} />}
        confirmText="Xóa nhiệm vụ"
        cancelText="Đóng"
        loadingText="Đang xóa…"
        isLoading={busy}
        onConfirm={confirmDelete}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
};

type View = { title: string; rows: InfoItem[][]; section: ReactNode; actions: ReactNode };
type EditButton = (variant?: 'secondary') => ReactNode;

/** M01-BD (Tổ trưởng nhận việc), NV02-MP (PHT giao việc). */
const matrixView = (task: TaskDetail, isPerformer: boolean, navigate: (path: string) => void, edit: EditButton): View => {
  const scope = task.scope;
  const matrix = task.matrix;
  const matrixId = matrix?.id ?? null;
  // PHT duyệt ngay từ đây; Tổ trưởng quay lại soạn tiếp bản đang làm hoặc bản bị trả lại.
  const reviewing = isPht() && task.status === 'PENDING_REVIEW' && matrixId !== null;
  const continuing = isPerformer && (task.status === 'IN_PROGRESS' || task.status === 'NEEDS_REVISION') && matrixId !== null;
  const comment = matrix?.rejectComment?.trim();
  return {
    title: 'Chi tiết nhiệm vụ lập ma trận',
    rows: [
      [{ label: 'Nội dung nhiệm vụ', value: task.name }],
      [
        { label: 'Người giao', value: personLabel(task.createdBy) },
        { label: 'Tổ trưởng nhận việc', value: personLabel(task.performer) },
        { label: 'Hạn hoàn thành', value: <Due value={task.dueAt} overdue={task.isOverdue} /> },
      ],
      // Ma trận không có năm học, học kỳ: phạm vi chỉ gồm môn và khối.
      [{ label: 'Phạm vi', value: scope ? `${scope.subjectName} · ${scope.gradeLevelName}` : '—' }],
      [{ label: 'Yêu cầu công việc', value: task.description || 'Không có yêu cầu thêm.', text: true }],
    ],
    section: (
      <section className="sep-section">
        <h2 className="sep-section-title">Ma trận đã lập</h2>
        {task.status === 'NEEDS_REVISION' && (
          <div className="sep-alert sep-alert--info sep-task-revision">
            {comment ? (
              <>
                <p>
                  <strong>
                    PHT yêu cầu chỉnh sửa
                    {matrix?.rejectedAt && ` · ${formatDate(matrix.rejectedAt)}`}
                  </strong>
                </p>
                <p className="sep-task-revision__comment">{comment}</p>
              </>
            ) : (
              <p>PHT đã trả lại ma trận để chỉnh sửa.</p>
            )}
          </div>
        )}
        <SubTable
          heads={['Ma trận', 'Trạng thái ma trận', 'Cập nhật', 'Hành động']}
          rows={[
            {
              key: 'matrix',
              cells: [
                // Bản nháp của Tổ trưởng: người khác chỉ biết là đang soạn (GB-47).
                matrix ? (matrix.name ?? 'Tổ trưởng đang soạn ma trận') : 'Chưa có ma trận',
                <span className={`sep-status${matrix ? ` sep-status--${matrix.status}` : ''}`}>{matrix ? matrix.statusLabel : 'Chưa lập'}</span>,
                matrix ? formatDate(matrix.updatedAt) : '—',
                matrixId !== null && <RowAction to={`/matrices/${matrixId}`} icon="visibility" label="Xem ma trận" />,
              ],
            },
          ]}
        />
      </section>
    ),
    actions: (
      <>
        {isPerformer && !matrix && task.status !== 'COMPLETED' && (
          <PcbButton onClick={() => navigate(`/matrix-tasks/${task.id}/matrix/new`)}>
            <Icon name="edit_square" size={20} />
            Bắt đầu lập ma trận
          </PcbButton>
        )}
        {continuing && (
          <PcbButton onClick={() => navigate(`/matrices/${matrixId}/edit`)}>
            <Icon name="edit_square" size={20} />
            Tiếp tục lập ma trận
          </PcbButton>
        )}
        {edit(reviewing ? 'secondary' : undefined)}
        {reviewing && <PcbButton onClick={() => navigate(`/matrices/${matrixId}`)}>Xem ma trận</PcbButton>}
      </>
    ),
  };
};

/** Task biên soạn cũ và task review đều dẫn vào bản đề được quản lý. */
const examView = (task: TaskDetail, navigate: ReturnType<typeof useNavigate>, edit: EditButton): View => {
  return {
    title: task.exam?.reviewPackageId ? 'Chi tiết nhiệm vụ review đề thi' : 'Chi tiết nhiệm vụ biên soạn đề cũ',
    rows: [
      [{ label: 'Nội dung nhiệm vụ', value: task.name }],
      [
        { label: 'Ma trận đề', value: task.exam?.matrixName ?? '—' },
        {
          label: 'Phạm vi',
          value: task.exam ? `${task.exam.subjectName} · ${task.exam.gradeLevelName} · ${task.exam.academicYearName}` : '—',
        },
      ],
      [
        { label: 'Người giao', value: personLabel(task.createdBy) },
        { label: task.exam?.reviewPackageId ? 'Người chỉnh sửa và review' : 'Người thực hiện', value: personLabel(task.performer) },
        { label: 'Hạn hoàn thành', value: <Due value={task.dueAt} overdue={task.isOverdue} /> },
      ],
    ],
    section: (
      <section className="sep-section">
        <h2 className="sep-section-title">{task.exam?.reviewPackageId ? 'Đề được giao review' : 'Đề của nhiệm vụ cũ'}</h2>
        {!task.exam?.reviewPackageId && <p className="sep-muted">Đây là nhiệm vụ theo luồng biên soạn cũ. Với đề mới, PHT chọn ma trận để hệ thống sinh đề trong Kho đề rồi giao giáo viên hoặc tổ trưởng review.</p>}
        <SubTable
          heads={['Đề', 'Trạng thái', 'Cập nhật', 'Hành động']}
          rows={(task.exam?.papers ?? []).map((paper) => ({
            key: paper.name,
            cells: [
              paper.name,
              <span className="sep-status">{paper.statusLabel}</span>,
              paper.updatedAt ? formatDate(paper.updatedAt) : '—',
              <>{paper.examSetId && <PcbButton variant="ghost" size="sm" onClick={() => navigate(`/exam-packages/${paper.examSetId}`)}><Icon name="visibility" size={18} />{task.exam?.reviewPackageId ? 'Mở đề review' : 'Quản lý đề'}</PcbButton>}{!task.exam?.reviewPackageId && paper.id && paper.status === 'DRAFT' && <PcbButton variant="ghost" size="sm" onClick={() => navigate(`/matrix-tasks/${task.id}/papers/${paper.id}/questions`)}>Chọn câu hỏi</PcbButton>}{!paper.examSetId && paper.id && <PcbButton variant="ghost" size="sm" onClick={() => navigate(`/matrix-tasks/${task.id}/papers/${paper.id}/questions`)}>Chọn câu hỏi</PcbButton>}</>,
            ],
          }))}
        />
      </section>
    ),
    actions: edit(),
  };
};

/** T04-AD (Tổ trưởng giao, cũng là người kiểm duyệt), T04-BD (giáo viên soạn). */
const questionView = (
  task: TaskDetail,
  isCreator: boolean,
  isPerformer: boolean,
  navigate: ReturnType<typeof useNavigate>,
  edit: EditButton,
  askDelete: () => void,
  busy: boolean,
): View => {
  // Người kiểm duyệt luôn là người giao nên không hiện riêng. Soạn, gửi và duyệt câu hỏi thuộc chức năng ngân hàng câu hỏi của dev khác.
  return {
    title: 'Chi tiết nhiệm vụ biên soạn câu hỏi',
    rows: [
      [{ label: 'Nội dung nhiệm vụ', value: task.name }],
      [
        { label: 'Người giao', value: personLabel(task.createdBy) },
        { label: 'Ngày giao', value: formatDate(task.createdAt) },
      ],
      [
        { label: 'Người thực hiện', value: personLabel(task.performer) },
        { label: 'Hạn biên soạn', value: <Due value={task.dueAt} overdue={task.isOverdue} /> },
      ],
    ],
    section: (
      <section className="sep-section">
        <h2 className="sep-section-title">Nội dung câu hỏi cần biên soạn</h2>
        {task.lessons.map((lesson, index) => (
          <LessonCardView
            key={lesson.lessonId}
            index={index}
            lesson={lesson}
            progress={task.status === 'COMPLETED'
              ? `Đã duyệt ${lesson.total} câu`
              : isCreator
                ? `Đã soạn ${lesson.written}/${lesson.total} · Chờ duyệt ${lesson.pendingReview} câu`
                : `Đã soạn ${lesson.written}/${lesson.total}`}
          />
        ))}
      </section>
    ),
    actions: <>
      {(isPerformer || (isCreator && task.status !== 'ASSIGNED')) && <PcbButton onClick={() => navigate(`/matrix-tasks/${task.id}/questions`)}><Icon name={isPerformer && task.status !== 'COMPLETED' && task.status !== 'PENDING_REVIEW' ? 'edit_square' : 'visibility'} />{isPerformer && task.status !== 'COMPLETED' && task.status !== 'PENDING_REVIEW' ? 'Biên soạn câu hỏi' : task.status === 'PENDING_REVIEW' && isCreator ? 'Kiểm duyệt gói câu hỏi' : 'Xem gói câu hỏi'}</PcbButton>}
      {isCreator && (
      <>
        {task.canEdit && (
          <PcbButton variant="danger" disabled={busy} onClick={askDelete}>
            Xóa nhiệm vụ
          </PcbButton>
        )}
        {edit()}
      </>
      )}
    </>,
  };
};
