import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Field, PcbButton, SelectField } from '../../../components/pcb';
import { PageHeader } from '../../../components/common/PageHeader';
import { useAsync, useBusy } from '../../../hooks';
import { api } from '../../../services/api';
import type { TaskDetail } from '../../../types';
import { localDateString } from '../../../utils/formatters';
import { toProblem } from '../../../utils/problem';
import { focusFirstError } from '../focusFirstError';
import '../../matrix/matrix.css';
import '../tasks.css';

const MAX_PAPERS = 20;
const PAPER_COUNT_ERROR = `Số đề cần tạo từ 1 đến ${MAX_PAPERS}.`;

/** NV03-E giao nhiệm vụ tạo đề thi; có `task` là NV04-E sửa nhiệm vụ. */
export const ExamTaskForm = ({ task }: { task?: TaskDetail }) => {
  const navigate = useNavigate();
  const today = localDateString();
  // GB-56: Tổ trưởng đã bắt đầu soạn đề thì không đổi ma trận, người làm và số đề.
  const locked = Boolean(task?.isStarted);

  const [name, setName] = useState(task?.name ?? '');
  const [matrixId, setMatrixId] = useState(task?.exam ? String(task.exam.matrixId) : '');
  const [assignee, setAssignee] = useState(task?.performer ? String(task.performer.userId) : '');
  const [dueAt, setDueAt] = useState(task?.dueAt?.slice(0, 10) ?? '');
  const [paperCount, setPaperCount] = useState(String(task?.exam?.papers.length ?? 2));

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, runExclusive] = useBusy();

  const options = useAsync(() => api.task.options(), []);
  const teamLeads = options.data?.teamLeads ?? [];
  // Ma trận đang gắn vẫn hiện dù nay đã lưu trữ (không còn trong danh sách Đã duyệt).
  const current = task?.exam;
  const matrices = [
    ...(options.data?.matrices ?? []),
    ...(current && !options.data?.matrices.some((item) => item.id === current.matrixId)
      ? [{ id: current.matrixId, name: current.matrixName, subjectName: current.subjectName, gradeLevelName: current.gradeLevelName, academicYearName: current.academicYearName }]
      : []),
  ];
  const back = () => navigate(task ? `/matrix-tasks/${task.id}` : '/matrix-tasks');

  const submit = async () => {
    const found: Record<string, string> = {};
    const count = Number(paperCount);
    if (!name.trim()) found.name = 'Nội dung nhiệm vụ là bắt buộc.';
    if (!matrixId) found.examMatrixId = 'Chọn ma trận đã duyệt.';
    if (!assignee) found.assignedToUserId = 'Chọn Tổ trưởng thực hiện.';
    if (!dueAt) found.dueAt = 'Hạn hoàn thành là bắt buộc.';
    else if (dueAt < today && dueAt !== task?.dueAt?.slice(0, 10)) found.dueAt = 'Hạn hoàn thành không được ở trong quá khứ.';
    if (!paperCount || !Number.isInteger(count) || count < 1 || count > MAX_PAPERS) found.paperCount = PAPER_COUNT_ERROR;
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setProblem('Vui lòng kiểm tra lại các ô được đánh dấu.');
      focusFirstError();
      return;
    }

    await runExclusive(async () => {
      setProblem(null);
      const body = {
        name: name.trim(),
        examMatrixId: Number(matrixId),
        assignedToUserId: Number(assignee),
        dueAt: `${dueAt}T00:00:00`,
        paperCount: count,
      };
      try {
        if (task) {
          await api.task.updateExam(task.id, body);
          navigate(`/matrix-tasks/${task.id}`);
        } else {
          await api.task.createExam(body);
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
      <PageHeader title={task ? 'Chỉnh sửa nhiệm vụ tạo đề thi' : 'Giao nhiệm vụ tạo đề thi'} onBack={back} />

      <div className="sep-page">
        {problem && <div className="sep-alert" role="alert">{problem}</div>}
        {options.error != null && <div className="sep-alert" role="alert">{toProblem(options.error).message}</div>}
        {locked && (
          <div className="sep-alert sep-alert--info">
            Tổ trưởng đã bắt đầu soạn đề nên chỉ đổi được nội dung nhiệm vụ và hạn hoàn thành.
          </div>
        )}

        <section className="sep-section">
          <h2 className="sep-section-title">Thông tin nhiệm vụ</h2>
          <Field
            label="Nội dung nhiệm vụ *"
            value={name}
            error={errors.name}
            placeholder="Nhập nội dung nhiệm vụ"
            onChange={(event) => setName(event.target.value)}
          />
          <div className="sep-task-row">
            <SelectField
              label="Ma trận đề *"
              value={matrixId}
              error={errors.examMatrixId}
              disabled={locked}
              hint={!options.loading && matrices.length === 0 ? 'Phân hiệu chưa có ma trận đã duyệt.' : undefined}
              onChange={(event) => setMatrixId(event.target.value)}
            >
              <option value="">Chọn ma trận đã duyệt</option>
              {matrices.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {item.subjectName} · {item.gradeLevelName} · {item.academicYearName}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Người thực hiện *"
              value={assignee}
              error={errors.assignedToUserId}
              disabled={locked}
              hint={!options.loading && teamLeads.length === 0 ? 'Chi nhánh này chưa có Tổ trưởng nào để giao việc.' : undefined}
              onChange={(event) => setAssignee(event.target.value)}
            >
              <option value="">Chọn tổ trưởng</option>
              {teamLeads.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {lead.fullName} · Tổ trưởng
                </option>
              ))}
            </SelectField>
          </div>
          <div className="sep-task-row">
            <Field
              label="Hạn hoàn thành *"
              type="date"
              value={dueAt}
              min={today}
              error={errors.dueAt}
              onClick={(event) => event.currentTarget.showPicker?.()}
              onChange={(event) => setDueAt(event.target.value)}
            />
            <Field
              label="Số đề cần tạo *"
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_PAPERS}
              step={1}
              value={paperCount}
              error={errors.paperCount}
              disabled={locked}
              hint="Hệ thống tự đặt tên Đề 1, Đề 2, …"
              onChange={(event) => setPaperCount(event.target.value)}
            />
          </div>
        </section>

        <div className="sep-actions sep-task-actions">
          <PcbButton variant="ghost" onClick={back}>
            Hủy
          </PcbButton>
          <PcbButton disabled={busy || options.loading} onClick={() => void submit()}>
            {busy ? 'Đang lưu…' : task ? 'Lưu thay đổi' : 'Giao nhiệm vụ'}
          </PcbButton>
        </div>
      </div>
    </>
  );
};

export const ExamTaskFormPage = () => <ExamTaskForm />;
