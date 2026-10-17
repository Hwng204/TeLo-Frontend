import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Field, Icon, PcbButton, SelectField } from '../../../components/pcb';
import { PageHeader } from '../../../components/common/PageHeader';
import { useAsync, useBusy } from '../../../hooks';
import { api } from '../../../services/api';
import type { TaskDetail } from '../../../types';
import { resolveContextId, type ContextSelection } from '../../../utils/academicContext';
import { localDateString } from '../../../utils/formatters';
import { toProblem } from '../../../utils/problem';
import { ContextSelects } from '../../matrix/components/ContextSelects';
import { focusFirstError } from '../focusFirstError';
import '../../matrix/matrix.css';
import '../tasks.css';
import '../../../styles/authoring.css';

/** M01-A giao nhiệm vụ lập ma trận; có `task` là NV04-M sửa nhiệm vụ. Ngày giao do server tự ghi. */
export const MatrixTaskForm = ({ task }: { task?: TaskDetail }) => {
  const navigate = useNavigate();
  const today = localDateString();
  // GB-56: Tổ trưởng đã lập ma trận thì không đổi người nhận và phạm vi nữa.
  const locked = Boolean(task?.isStarted);

  const [assignee, setAssignee] = useState(task?.performer ? String(task.performer.userId) : '');
  const [picked, setPicked] = useState<ContextSelection | null>(null);
  const [dueAt, setDueAt] = useState(task?.dueAt?.slice(0, 10) ?? '');
  const [name, setName] = useState(task?.name ?? '');
  const [description, setDescription] = useState(task?.description ?? '');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, runExclusive] = useBusy();

  const reference = useAsync(() => api.matrix.referenceData(), []);
  const contexts = reference.data?.academicContexts ?? [];
  const teamLeads = reference.data?.teamLeads ?? [];

  // Phạm vi đang có của nhiệm vụ, điền sẵn khi danh sách ngữ cảnh về.
  const current = contexts.find((context) => context.id === task?.scope?.academicContextId);
  const selection: ContextSelection = picked ?? (current
    ? {
        subjectId: current.subjectId,
        gradeLevelId: current.gradeLevelId,
      }
    : {});
  // Giữ phạm vi cũ khi chưa đổi lựa chọn.
  const keepScope = locked || Boolean(task && picked === null);
  const academicContextId = keepScope ? (task?.scope?.academicContextId ?? null) : resolveContextId(contexts, selection);
  const back = () => navigate(task ? `/matrix-tasks/${task.id}` : '/matrix-tasks');

  const submit = async () => {
    const found: Record<string, string> = {};
    if (!name.trim()) found.name = 'Nội dung nhiệm vụ là bắt buộc.';
    if (!assignee) found.assignedToUserId = 'Chọn Tổ trưởng nhận việc.';
    if (!academicContextId) {
      if (!selection.subjectId) found.subjectId = 'Chọn môn học.';
      if (!selection.gradeLevelId) found.gradeLevelId = 'Chọn khối lớp.';
      // Đủ hai ô mà không ra ngữ cảnh nào: báo chung ở ô Khối lớp.
      if (!found.subjectId && !found.gradeLevelId) found.academicContextId = 'Chọn đủ Môn học và Khối lớp.';
    }
    if (dueAt && dueAt < today && dueAt !== task?.dueAt?.slice(0, 10)) found.dueAt = 'Hạn hoàn thành không được ở trong quá khứ.';
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setProblem('Vui lòng kiểm tra lại các ô được đánh dấu.');
      focusFirstError();
      return;
    }

    await runExclusive(async () => {
      setProblem(null);
      const body = {
        assignedToUserId: Number(assignee),
        academicContextId: academicContextId!,
        // input type=date cho chuỗi yyyy-MM-dd; backend nhận DateTime nên gửi kèm giờ.
        dueAt: dueAt ? `${dueAt}T00:00:00` : null,
        name: name.trim(),
        description: description.trim() || null,
      };
      try {
        if (task) {
          await api.task.updateMatrix(task.id, body);
          navigate(`/matrix-tasks/${task.id}`);
        } else {
          await api.matrixTask.create(body);
          navigate('/matrix-tasks');
        }
      } catch (error) {
        const parsed = toProblem(error);
        setProblem(parsed.message);
        if (parsed.fieldErrors) {
          setErrors((existing) => ({ ...existing, ...parsed.fieldErrors }));
          focusFirstError();
        }
      }
    });
  };

  return (
    <>
      <PageHeader title={task ? 'Chỉnh sửa nhiệm vụ lập ma trận' : 'Giao nhiệm vụ lập ma trận'} onBack={back} />

      <div className="sep-page sep-authoring-page matrix-task-form">
        {problem && <div className="sep-alert" role="alert">{problem}</div>}
        {locked && (
          <div className="sep-alert sep-alert--info">
            Tổ trưởng đã bắt đầu lập ma trận nên chỉ đổi được nội dung nhiệm vụ, hạn và yêu cầu công việc.
          </div>
        )}

        <section className="sep-section">
          <h2 className="sep-section-title">Thông tin nhiệm vụ</h2>
          <div className="sep-fields">
            <Field
              label="Nội dung nhiệm vụ *"
              value={name}
              error={errors.name}
              placeholder="Ví dụ: Ma trận Toán 5 - Giữa học kỳ I"
              fieldClassName="sep-span-full"
              onChange={(event) => setName(event.target.value)}
            />
            <SelectField
              label="Tổ trưởng nhận việc *"
              value={assignee}
              error={errors.assignedToUserId}
              disabled={locked}
              fieldClassName="sep-span-2"
              // Chi nhánh chưa có Tổ trưởng thì danh sách rỗng; nói thẳng lý do thay vì để người dùng mở ra rồi đoán.
              hint={!reference.loading && teamLeads.length === 0 ? 'Chi nhánh này chưa có Tổ trưởng nào để giao việc.' : undefined}
              onChange={(event) => setAssignee(event.target.value)}
            >
              <option value="">Chọn tổ trưởng</option>
              {teamLeads.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {lead.fullName} · Tổ trưởng
                </option>
              ))}
            </SelectField>
            <Field
              label="Hạn hoàn thành"
              type="date"
              value={dueAt}
              min={today}
              error={errors.dueAt}
              hint="Để trống nếu không đặt hạn."
              fieldClassName="sep-span-2"
              // Mặc định chỉ bấm đúng icon mới mở lịch; mở khi bấm bất kỳ chỗ nào của ô.
              onClick={(event) => event.currentTarget.showPicker?.()}
              onChange={(event) => setDueAt(event.target.value)}
            />
          </div>
        </section>

        <section className="sep-section">
          <h2 className="sep-section-title">Phạm vi ma trận</h2>
          {task?.scope && !current && picked === null && (
            <p className="pcb-hint">{task.scope.subjectName} · {task.scope.gradeLevelName}. Phạm vi hiện tại được giữ khi lưu.</p>
          )}
          <ContextSelects
            contexts={contexts}
            value={selection}
            emptyLabel={(label) => `Chọn ${label.toLowerCase()}`}
            required
            // Khoá phạm vi đã nói ở banner đầu trang, không lặp lại gợi ý dưới các ô.
            disabled={locked}
            errors={{ subjectId: errors.subjectId, gradeLevelId: errors.gradeLevelId }}
            error={errors.academicContextId}
            onChange={setPicked}
          />
        </section>

        <section className="sep-section">
          <label className="sep-section-title" htmlFor="task-description">
            Yêu cầu công việc
          </label>
          <textarea
            id="task-description"
            className="sep-textarea"
            value={description}
            placeholder="Ví dụ: Ma trận 20 câu trắc nghiệm, 10 điểm."
            onChange={(event) => setDescription(event.target.value)}
          />
        </section>

        <div className="sep-actions sep-task-actions">
          <PcbButton variant="ghost" onClick={back}>
            <Icon name="close" />
            Hủy
          </PcbButton>
          <PcbButton disabled={busy || reference.loading} onClick={() => void submit()}>
            <Icon name={task ? 'save' : 'assignment_ind'} />
            {busy ? 'Đang lưu…' : task ? 'Lưu thay đổi' : 'Giao nhiệm vụ'}
          </PcbButton>
        </div>
      </div>
    </>
  );
};

export const MatrixTaskFormPage = () => <MatrixTaskForm />;
