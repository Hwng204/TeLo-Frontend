import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Field, Icon, PcbButton, SelectField } from '../../../components/pcb';
import { PageHeader } from '../../../components/common/PageHeader';
import { useAsync, useBusy } from '../../../hooks';
import { api } from '../../../services/api';
import type { TaskDetail } from '../../../types';
import { localDateString } from '../../../utils/formatters';
import { toProblem } from '../../../utils/problem';
import { LessonCardEditor } from '../components/LessonCard';
import { focusFirstError } from '../focusFirstError';
import { lessonsProblem, questionCount, type LessonDraft } from '../lessonDraft';
import '../../matrix/matrix.css';
import '../tasks.css';

/** NV03-Q giao nhiệm vụ biên soạn câu hỏi; có `task` là NV04-Q sửa nhiệm vụ. */
export const QuestionTaskForm = ({ task }: { task?: TaskDetail }) => {
  const navigate = useNavigate();
  const today = localDateString();
  // GB-56: giáo viên đã soạn câu hỏi thì không đổi người soạn và nội dung bài học nữa.
  const locked = Boolean(task?.isStarted);
  const blank = { gradeLevelId: '', chapterId: '', lessonId: '', knowledge: '', understanding: '', application: '' };

  const [name, setName] = useState(task?.name ?? '');
  const [assignee, setAssignee] = useState(task?.performer ? String(task.performer.userId) : '');
  const [dueAt, setDueAt] = useState(task?.dueAt?.slice(0, 10) ?? '');
  const [lessons, setLessons] = useState<LessonDraft[]>(() =>
    task
      ? task.lessons.map((lesson, key) => ({
          key,
          gradeLevelId: String(lesson.gradeLevelId),
          chapterId: String(lesson.chapterId),
          lessonId: String(lesson.lessonId),
          knowledge: String(lesson.knowledge),
          understanding: String(lesson.understanding),
          application: String(lesson.application),
        }))
      : [{ ...blank, key: 0 }],
  );
  // Khoá cho thẻ thêm sau; thẻ có sẵn đã dùng 0..n-1.
  const nextKey = useRef(lessons.length);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, runExclusive] = useBusy();

  const options = useAsync(() => api.task.options(), []);
  const curriculum = useAsync(() => api.curriculum.get(), []);
  const teachers = options.data?.teachers ?? [];
  const back = () => navigate(task ? `/matrix-tasks/${task.id}` : '/matrix-tasks');
  const unchanged = (value: string, saved: string | null | undefined) => value === saved?.slice(0, 10);

  const submit = async () => {
    const found: Record<string, string> = {};
    if (!name.trim()) found.name = 'Nội dung nhiệm vụ là bắt buộc.';
    if (!assignee) found.assignedToUserId = 'Chọn giáo viên biên soạn.';
    if (!dueAt) found.dueAt = 'Hạn biên soạn là bắt buộc.';
    else if (dueAt < today && !unchanged(dueAt, task?.dueAt)) found.dueAt = 'Hạn biên soạn không được ở trong quá khứ.';
    const lessonError = lessonsProblem(lessons);
    if (lessonError) found.lessons = lessonError;
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
        assignedToUserId: Number(assignee),
        dueAt: `${dueAt}T00:00:00`,
        lessons: lessons.map((lesson) => ({
          lessonId: Number(lesson.lessonId),
          knowledge: questionCount(lesson.knowledge)!,
          understanding: questionCount(lesson.understanding)!,
          application: questionCount(lesson.application)!,
        })),
      };
      try {
        if (task) {
          await api.task.updateQuestion(task.id, body);
          navigate(`/matrix-tasks/${task.id}`);
        } else {
          await api.task.createQuestion(body);
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

  const teacherOptions = teachers.map((teacher) => (
    <option key={teacher.id} value={teacher.id}>
      {teacher.fullName} · Giáo viên
    </option>
  ));
  const noTeachers = !options.loading && teachers.length === 0 ? 'Phân hiệu chưa có giáo viên nào để giao việc.' : undefined;

  return (
    <>
      <PageHeader title={task ? 'Chỉnh sửa nhiệm vụ biên soạn câu hỏi' : 'Giao nhiệm vụ biên soạn câu hỏi'} onBack={back} />

      <div className="sep-page">
        {problem && <div className="sep-alert" role="alert">{problem}</div>}
        {(options.error ?? curriculum.error) != null && (
          <div className="sep-alert" role="alert">{toProblem(options.error ?? curriculum.error).message}</div>
        )}
        {locked && (
          <div className="sep-alert sep-alert--info">
            Giáo viên đã bắt đầu soạn câu hỏi nên chỉ đổi được nội dung nhiệm vụ và hạn biên soạn.
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
              label="Người thực hiện *"
              value={assignee}
              error={errors.assignedToUserId}
              disabled={locked}
              hint={noTeachers}
              onChange={(event) => setAssignee(event.target.value)}
            >
              <option value="">Chọn giáo viên biên soạn</option>
              {teacherOptions}
            </SelectField>
            <Field
              label="Hạn biên soạn *"
              type="date"
              value={dueAt}
              min={today}
              error={errors.dueAt}
              onClick={(event) => event.currentTarget.showPicker?.()}
              onChange={(event) => setDueAt(event.target.value)}
            />
          </div>
        </section>

        <section className="sep-section">
          <h2 className="sep-section-title">Nội dung câu hỏi cần biên soạn</h2>
          {errors.lessons && <div className="sep-alert" role="alert">{errors.lessons}</div>}
          {lessons.map((lesson, index) => (
            <LessonCardEditor
              key={lesson.key}
              index={index}
              draft={lesson}
              curriculum={curriculum.data}
              disabled={locked}
              invalid={Boolean(errors.lessons)}
              onChange={(next) => setLessons(lessons.map((other) => (other.key === lesson.key ? next : other)))}
              onRemove={() => setLessons(lessons.filter((other) => other.key !== lesson.key))}
            />
          ))}
          {!locked && (
            <PcbButton variant="secondary" className="sep-task-back" onClick={() => setLessons([...lessons, { ...blank, key: nextKey.current++ }])}>
              <Icon name="add" size={20} />
              Thêm bài học
            </PcbButton>
          )}
        </section>

        <div className="sep-actions sep-task-actions">
          <PcbButton variant="ghost" onClick={back}>
            Hủy
          </PcbButton>
          <PcbButton disabled={busy || options.loading || curriculum.loading} onClick={() => void submit()}>
            {busy ? 'Đang lưu…' : task ? 'Lưu thay đổi' : 'Giao nhiệm vụ'}
          </PcbButton>
        </div>
      </div>
    </>
  );
};

export const QuestionTaskFormPage = () => <QuestionTaskForm />;
