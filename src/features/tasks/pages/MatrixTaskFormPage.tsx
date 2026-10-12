import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Field, PcbButton, SelectField } from '../../../components/pcb';
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
  const semesters = reference.data?.semesters ?? [];
  const teamLeads = reference.data?.teamLeads ?? [];

  // Phạm vi đang có của nhiệm vụ, điền sẵn khi danh sách ngữ cảnh về.
  const current = contexts.find((context) => context.id === task?.scope?.academicContextId);
  const selection: ContextSelection = picked ?? (current
    ? {
        academicYearId: current.academicYearId,
        subjectId: current.subjectId,
        gradeLevelId: current.gradeLevelId,
        semesterId: task?.scope?.semesterId ?? undefined,
      }
    : {});
  // Giữ phạm vi cũ khi chưa đổi lựa chọn, kể cả năm học đã đóng.
  const keepScope = locked || Boolean(task && picked === null);
  const academicContextId = keepScope ? (task?.scope?.academicContextId ?? null) : resolveContextId(contexts, selection);
  const semesterId = keepScope ? (task?.scope?.semesterId ?? null) : (selection.semesterId ?? null);
  const back = () => navigate(task ? `/matrix-tasks/${task.id}` : '/matrix-tasks');

  const submit = async () => {
    const found: Record<string, string> = {};
    if (!name.trim()) found.name = 'Nội dung nhiệm vụ là bắt buộc.';
    if (!assignee) found.assignedToUserId = 'Chọn Tổ trưởng nhận việc.';
    if (!academicContextId) {
      if (!selection.subjectId) found.subjectId = 'Chọn môn học.';
      if (!selection.gradeLevelId) found.gradeLevelId = 'Chọn khối lớp.';
      if (!selection.academicYearId) found.academicYearId = 'Chọn năm học.';
      // Đủ ba ô mà không ra ngữ cảnh nào: báo chung ở ô Năm học.
      if (!found.subjectId && !found.gradeLevelId && !found.academicYearId) found.academicContextId = 'Chọn đủ Môn học, Khối lớp và Năm học.';
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
        semesterId,
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

      <div className="sep-page">
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
            <p className="pcb-hint">{task.scope.subjectName} · {task.scope.gradeLevelName} · {task.scope.academicYearName}{task.scope.semesterName ? ` · ${task.scope.semesterName}` : ''}. Phạm vi hiện tại được giữ khi lưu.</p>
          )}
          <ContextSelects
            contexts={contexts}
            semesters={semesters}
            value={selection}
            emptyLabel={(label) => `Chọn ${label.toLowerCase()}`}
            required
            className="sep-task-context"
            // Khoá phạm vi đã nói ở banner đầu trang, không lặp lại gợi ý dưới các ô.
            disabled={locked}
            errors={{ subjectId: errors.subjectId, gradeLevelId: errors.gradeLevelId, academicYearId: errors.academicYearId }}
            error={errors.academicContextId ?? errors.semesterId}
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
            Hủy
          </PcbButton>
          <PcbButton disabled={busy || reference.loading} onClick={() => void submit()}>
            {busy ? 'Đang lưu…' : task ? 'Lưu thay đổi' : 'Giao nhiệm vụ'}
          </PcbButton>
        </div>
      </div>
    </>
  );
};

export const MatrixTaskFormPage = () => <MatrixTaskForm />;
