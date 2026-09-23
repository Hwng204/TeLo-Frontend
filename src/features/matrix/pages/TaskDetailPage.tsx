import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Icon, PcbButton } from '../../../components/pcb';
import { useAsync, useBusy } from '../../../hooks';
import { api } from '../../../services/api';
import { contextLabel } from '../../../utils/academicContext';
import { dueState, formatDate, personLabel } from '../../../utils/formatters';
import { isTeamLead } from '../../../utils/jwt';
import { toProblem } from '../../../utils/problem';
import { InfoGrid, type InfoItem } from '../components/InfoGrid';
import { PageHeader } from '../components/PageHeader';
import '../matrix.css';

/** M01-BD. */
export const TaskDetailPage = () => {
  const navigate = useNavigate();
  const taskId = Number(useParams().id);
  const teamLead = isTeamLead();
  const back = () => navigate('/matrix-tasks');
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, runExclusive] = useBusy();

  const detail = useAsync(() => api.matrixTask.get(taskId), [taskId]);
  const task = detail.data;

  const reference = useAsync(() => api.matrix.referenceData(), []);
  const contexts = reference.data?.academicContexts ?? [];
  const semester = reference.data?.semesters.find((item) => item.id === task?.semesterId);
  const assignee = reference.data?.teamLeads.find((lead) => lead.id === task?.assignedToUserId);

  if (detail.loading || (task && reference.loading)) {
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
          </div>
          <div className="sep-actions">
            <PcbButton variant="secondary" onClick={back}>
              Về danh sách
            </PcbButton>
          </div>
        </div>
      </>
    );
  }

  // Nhiệm vụ còn ở "Đã giao" nghĩa là Tổ trưởng chưa nộp; lúc đó ma trận (nếu có) vẫn là bản nháp riêng của họ.
  const teamLeadIsDrafting = !teamLead && task.status === 'ASSIGNED';
  const due = dueState(task.dueAt, task.status);

  // "Đã thực hiện" = Tổ trưởng đã lưu nháp hoặc nộp ma trận; backend kiểm tra lại lúc xoá (409 TaskStarted).
  const deleteTask = () => {
    if (task.matrixId) {
      setProblem('Nhiệm vụ đã được thực hiện, không thể xóa.');
      return;
    }
    if (!window.confirm('Nhiệm vụ chưa được thực hiện, xác nhận xóa?')) return;
    void runExclusive(async () => {
      setProblem(null);
      try {
        await api.matrixTask.remove(task.id);
        navigate('/matrix-tasks', { replace: true });
      } catch (error) {
        const parsed = toProblem(error);
        setProblem(parsed.message);
        // Tổ trưởng vừa lưu ma trận trong lúc PHT đang xem: tải lại để trang hiện đúng trạng thái.
        if (parsed.status === 409) detail.reload();
        if (parsed.status === 404) navigate('/matrix-tasks', { replace: true });
      }
    });
  };

  const items: InfoItem[] = [
    { label: 'Tên nhiệm vụ', value: task.name || '—', span: 'full' },
    { label: 'Người giao', value: personLabel(task.createdBy) },
    // Tổ trưởng chính là người nhận, không cần nhắc lại tên mình.
    ...(teamLead ? [] : [{ label: 'Người phụ trách', value: assignee?.fullName ?? '—' }]),
    {
      label: 'Hạn hoàn thành',
      value: task.dueAt ? (
        <span className={due ? `sep-due--${due}` : undefined}>
          {formatDate(task.dueAt)}
          {due === 'overdue' && ' · Quá hạn'}
        </span>
      ) : (
        'Không đặt hạn'
      ),
    },
    { label: 'Trạng thái', value: <span className={`sep-status sep-status--${task.status}`}>{task.statusLabel}</span> },
    { label: 'Phạm vi', value: contextLabel(contexts, task.academicContextId), span: 'wide' },
    { label: 'Học kỳ', value: semester?.name ?? 'Không chọn' },
    { label: 'Yêu cầu công việc', value: task.description || 'Không có yêu cầu thêm.', span: 'full', text: true },
  ];

  return (
    <>
      <PageHeader title="Chi tiết nhiệm vụ" onBack={back} />

      <div className="sep-page">
        {problem && <div className="sep-alert" role="alert">{problem}</div>}

        <section className="sep-section">
          <h2 className="sep-section-title">Thông tin nhiệm vụ</h2>
          <InfoGrid items={items} />
        </section>

        <div className="sep-actions">
          {!teamLead && (
            <div className="sep-actions__lead">
              <PcbButton variant="danger" disabled={busy} onClick={deleteTask}>
                Xoá nhiệm vụ
              </PcbButton>
            </div>
          )}
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
            <PcbButton onClick={() => navigate(`/matrices/${task.matrixId}`)}>
              Xem ma trận đã lập
              <Icon name="arrow_forward" size={20} />
            </PcbButton>
          ) : (
            <PcbButton onClick={() => navigate(`/matrix-tasks/${task.id}/matrix/new`)}>
              Bắt đầu lập ma trận
              <Icon name="arrow_forward" size={20} />
            </PcbButton>
          )}
        </div>
      </div>
    </>
  );
};
