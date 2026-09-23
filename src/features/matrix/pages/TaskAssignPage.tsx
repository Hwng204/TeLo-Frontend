import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Field, PcbButton, SelectField } from '../../../components/pcb';
import { useAsync, useBusy } from '../../../hooks';
import { api } from '../../../services/api';
import { resolveContextId } from '../../../utils/academicContext';
import type { ContextSelection } from '../../../utils/academicContext';
import { localDateString } from '../../../utils/formatters';
import { toProblem } from '../../../utils/problem';
import { ContextSelects } from '../components/ContextSelects';
import { PageHeader } from '../components/PageHeader';
import '../matrix.css';

/** M01-A. Ngày giao do server tự ghi, không có ô nhập. */
export const TaskAssignPage = () => {
  const navigate = useNavigate();
  const today = localDateString();

  const [assignee, setAssignee] = useState('');
  const [selection, setSelection] = useState<ContextSelection>({});
  const [dueAt, setDueAt] = useState('');
  const [name, setName] = useState('');
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
    if (!name.trim()) found.name = 'Tên nhiệm vụ là bắt buộc.';
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
          name: name.trim(),
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
      <PageHeader title="Giao nhiệm vụ lập ma trận" onBack={() => navigate(-1)} />

      <div className="sep-page">
        {problem && <div className="sep-alert" role="alert">{problem}</div>}

        <section className="sep-section">
          <h2 className="sep-section-title">Thông tin nhiệm vụ</h2>
          <div className="sep-fields">
            <Field
              label="Tên nhiệm vụ"
              value={name}
              error={errors.name}
              placeholder="Ví dụ: Ma trận Toán 5 - Giữa học kỳ I"
              fieldClassName="sep-span-full"
              onChange={(event) => setName(event.target.value)}
            />
            <SelectField
              label="Tổ trưởng nhận việc"
              value={assignee}
              error={errors.assignedToUserId}
              fieldClassName="sep-span-2"
              // Chi nhánh chưa có Tổ trưởng thì danh sách rỗng; nói thẳng lý do thay vì để người dùng mở ra rồi đoán.
              hint={!reference.loading && teamLeads.length === 0 ? 'Chi nhánh này chưa có Tổ trưởng nào để giao việc.' : undefined}
              onChange={(event) => setAssignee(event.target.value)}
            >
              <option value="">Chọn Tổ trưởng</option>
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
          <ContextSelects
            contexts={contexts}
            semesters={semesters}
            value={selection}
            emptyLabel="Chọn…"
            error={errors.academicContextId}
            onChange={setSelection}
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

        <div className="sep-actions">
          <PcbButton variant="ghost" onClick={() => navigate(-1)}>
            Huỷ
          </PcbButton>
          <PcbButton disabled={busy} onClick={() => void submit()}>
            {busy ? 'Đang giao…' : 'Giao nhiệm vụ'}
          </PcbButton>
        </div>
      </div>
    </>
  );
};
