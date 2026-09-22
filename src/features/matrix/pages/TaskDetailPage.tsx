import { useNavigate, useParams } from 'react-router-dom';
import { PcbButton, PcbIconButton } from '../../../components/pcb';
import { useAsync } from '../../../hooks';
import { api } from '../../../services/api';
import { contextLabel } from '../../../utils/academicContext';
import { personLabel } from '../../../utils/formatters';
import { isTeamLead } from '../../../utils/jwt';
import { toProblem } from '../../../utils/problem';
import { MatrixSummary } from '../components/MatrixSummary';
import '../matrix.css';

/** M01-BD. */
export const TaskDetailPage = () => {
  const navigate = useNavigate();
  const taskId = Number(useParams().id);

  const detail = useAsync(() => api.matrixTask.get(taskId), [taskId]);
  const task = detail.data;

  const reference = useAsync(() => api.matrix.referenceData(), []);
  const contexts = reference.data?.academicContexts ?? [];
  const semester = reference.data?.semesters.find((item) => item.id === task?.semesterId);

  if (detail.loading) return <p className="sep-empty">Đang tải…</p>;

  if (!task) {
    return (
      <>
        <div className="sep-alert" role="alert">
          {detail.error ? toProblem(detail.error).message : 'Không tìm thấy nhiệm vụ.'}
        </div>
        <div className="sep-actions">
          <PcbButton variant="secondary" onClick={() => navigate('/matrix-tasks')}>
            Về danh sách
          </PcbButton>
        </div>
      </>
    );
  }

  // Nhiệm vụ còn ở "Đã giao" nghĩa là Tổ trưởng chưa nộp; lúc đó ma trận (nếu có) vẫn là bản nháp riêng của họ.
  const teamLeadIsDrafting = !isTeamLead() && task.status === 'ASSIGNED';

  return (
    <>
      <div className="sep-page-header">
        <PcbIconButton icon="arrow_back" label="Quay lại" onClick={() => navigate('/matrix-tasks')} />
        <h1 className="sep-page-title">Chi tiết nhiệm vụ lập ma trận</h1>
      </div>

      <MatrixSummary
        rows={[
          ['Nhiệm vụ', task.code || '—'],
          ['Người giao', personLabel(task.createdBy)],
          ['Phạm vi', `${contextLabel(contexts, task.academicContextId)}${semester ? ` · ${semester.name}` : ''}`],
          ['Hạn hoàn thành', task.dueAt ? new Date(task.dueAt).toLocaleDateString('vi-VN') : '—'],
          ['Yêu cầu', task.description || '—'],
          ['Trạng thái', <span className="sep-status">{task.statusLabel}</span>],
        ]}
      />

      <div className="sep-actions">
        {/* Backend chưa có API gắn một ma trận có sẵn vào nhiệm vụ. */}
        <PcbButton variant="secondary" disabled title="Sắp có">
          Chọn ma trận có sẵn
        </PcbButton>

        {/*
          Ma trận gắn nhiệm vụ là việc của Tổ trưởng cho tới khi họ nộp: PHT chỉ xem được sau đó,
          nên ở đây PHT nhận một dòng trạng thái thay vì nút bấm sẽ bị backend từ chối.
        */}
        {teamLeadIsDrafting ? (
          <span className="pcb-hint">
            {task.matrixId ? 'Tổ trưởng đang soạn ma trận.' : 'Tổ trưởng chưa bắt đầu lập ma trận.'}
          </span>
        ) : task.matrixId ? (
          <PcbButton onClick={() => navigate(`/matrices/${task.matrixId}`)}>Xem ma trận đã lập</PcbButton>
        ) : (
          <PcbButton onClick={() => navigate(`/matrix-tasks/${task.id}/matrix/new`)}>
            Bắt đầu lập ma trận
          </PcbButton>
        )}
      </div>
    </>
  );
};
