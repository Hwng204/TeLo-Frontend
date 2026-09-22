import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Field, PcbButton, PcbIconButton, SelectField } from '../../../components/pcb';
import { useAsync, useBusy } from '../../../hooks';
import { api } from '../../../services/api';
import { resolveContextId } from '../../../utils/academicContext';
import type { ContextSelection } from '../../../utils/academicContext';
import { toProblem } from '../../../utils/problem';
import { ContextSelects } from '../components/ContextSelects';
import '../matrix.css';

/**
 * M01-A. Backend chỉ nhận assignedToUserId, academicContextId, semesterId, dueAt, description,
 * nên bản thiết kế có "Tên nhiệm vụ" và "Ngày giao" không dựng được — ngày giao do server tự ghi.
 */
// yyyy-MM-dd theo giờ máy người dùng; toISOString() sẽ lệch một ngày ở múi giờ +7 gần nửa đêm.
const todayLocal = () => {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

export const TaskAssignPage = () => {
  const navigate = useNavigate();
  const today = todayLocal();

  const [assignee, setAssignee] = useState('');
  const [selection, setSelection] = useState<ContextSelection>({});
  const [dueAt, setDueAt] = useState('');
  const [description, setDescription] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, runExclusive] = useBusy();

  const reference = useAsync(() => api.matrix.referenceData(), []);
  const contexts = reference.data?.academicContexts ?? [];
  const semesters = reference.data?.semesters ?? [];
  const teamLeads = reference.data?.teamLeads ?? [];

  const academicContextId = resolveContextId(contexts, selection);

  const submit = async () => {
    const found: Record<string, string> = {};
    if (!assignee) found.assignedToUserId = 'Chọn Tổ trưởng nhận việc.';
    if (!academicContextId) found.academicContextId = 'Chọn đủ Chương trình, Môn học, Khối lớp và Năm học.';
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setProblem('Vui lòng kiểm tra lại các ô được đánh dấu.');
      return;
    }

    await runExclusive(async () => {
      setProblem(null);
      try {
        await api.matrixTask.create({
          assignedToUserId: Number(assignee),
          academicContextId: academicContextId!,
          semesterId: selection.semesterId ?? null,
          // input type=date cho chuỗi yyyy-MM-dd; backend nhận DateTime nên gửi kèm giờ.
          dueAt: dueAt ? `${dueAt}T00:00:00` : null,
          description: description.trim() || null,
        });
        navigate('/matrix-tasks');
      } catch (error) {
        const parsed = toProblem(error);
        setProblem(parsed.message);
        if (parsed.fieldErrors) setErrors((current) => ({ ...current, ...parsed.fieldErrors }));
      }
    });
  };

  return (
    <>
      <div className="sep-page-header">
        <PcbIconButton icon="arrow_back" label="Quay lại" onClick={() => navigate(-1)} />
        <h1 className="sep-page-title">Giao nhiệm vụ lập ma trận</h1>
      </div>

      {problem && <div className="sep-alert" role="alert">{problem}</div>}

      <div className="pcb-card sep-form">
        <SelectField
          label="Tổ trưởng nhận việc"
          value={assignee}
          error={errors.assignedToUserId}
          // Chi nhánh chưa có Tổ trưởng thì danh sách rỗng; nói thẳng lý do thay vì để người dùng mở ra rồi đoán.
          hint={!reference.loading && teamLeads.length === 0 ? 'Chi nhánh này chưa có Tổ trưởng nào để giao việc.' : undefined}
          onChange={(event) => setAssignee(event.target.value)}
        >
          <option value="">Chọn…</option>
          {teamLeads.map((lead) => (
            <option key={lead.id} value={lead.id}>
              {lead.fullName} ({lead.username})
            </option>
          ))}
        </SelectField>

        <Field
          label="Hạn hoàn thành"
          type="date"
          value={dueAt}
          min={today}
          leading="calendar_month"
          // Mặc định chỉ bấm đúng icon mới mở lịch; mở khi bấm bất kỳ chỗ nào của ô.
          onClick={(event) => event.currentTarget.showPicker?.()}
          onChange={(event) => setDueAt(event.target.value)}
        />
      </div>

      <div className="pcb-card sep-card-body">
        <ContextSelects
          contexts={contexts}
          semesters={semesters}
          value={selection}
          emptyLabel="Chọn…"
          error={errors.academicContextId}
          onChange={setSelection}
        />
      </div>

      <div className="pcb-card sep-card-body">
        <label className="pcb-label" htmlFor="task-description">
          Yêu cầu công việc
        </label>
        <textarea
          id="task-description"
          className="sep-textarea"
          value={description}
          placeholder="Ví dụ: Ma trận 20 câu trắc nghiệm, 10 điểm."
          onChange={(event) => setDescription(event.target.value)}
          style={{ marginTop: 8 }}
        />
      </div>

      <div className="sep-actions">
        <PcbButton variant="ghost" onClick={() => navigate(-1)}>
          Huỷ
        </PcbButton>
        <PcbButton disabled={busy} onClick={() => void submit()}>
          Giao nhiệm vụ
        </PcbButton>
      </div>
    </>
  );
};
