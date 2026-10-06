import { useState } from 'react';
import { Field, PcbButton } from '../../../components/pcb';
import { useBusy } from '../../../hooks';
import { api } from '../../../services/api';
import type { Chapter, Lesson } from '../../../types';
import { toProblem } from '../../../utils/problem';
import { FormDialog } from './FormDialog';

type Props = {
  open: boolean;
  chapter: Chapter | null;
  /** Có thì là sửa bài này, không thì thêm bài mới vào `chapter`. */
  lesson: Lesson | null;
  onClose: () => void;
  onSaved: (message: string) => void;
};

type Values = { code: string; title: string };

/** Thêm/sửa bài học trong một chương (MSG02 bắt buộc nhập, MSG07 trùng mã/tên trong chương). */
export const LessonFormDialog = (props: Props) => (
  <FormDialog open={props.open} title={props.lesson ? 'Sửa bài học' : 'Thêm bài học'} onClose={props.onClose}>
    <LessonForm key={`${props.lesson?.id ?? 'new'}-${props.chapter?.id}-${props.open}`} {...props} />
  </FormDialog>
);

const LessonForm = ({ chapter, lesson, onClose, onSaved }: Props) => {
  const [values, setValues] = useState<Values>({ code: lesson?.code ?? '', title: lesson?.title ?? '' });
  const [errors, setErrors] = useState<Partial<Record<keyof Values, string>>>({});
  const [formError, setFormError] = useState('');
  const [busy, runExclusive] = useBusy();

  const set = (key: keyof Values, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const submit = () => {
    const next: Partial<Record<keyof Values, string>> = {};
    if (!values.code.trim()) next.code = 'Trường Mã bài là bắt buộc.';
    if (!values.title.trim()) next.title = 'Trường Tên bài là bắt buộc.';
    if (next.code || next.title || !chapter) {
      setErrors(next);
      return;
    }
    void runExclusive(async () => {
      try {
        if (lesson) await api.curriculum.updateLesson(lesson.id, values);
        else await api.curriculum.createLesson(chapter.id, values);
        onSaved(lesson ? 'Cập nhật bài học thành công.' : 'Thêm bài học thành công.');
      } catch (error) {
        const problem = toProblem(error);
        if (problem.fieldErrors && Object.keys(problem.fieldErrors).length > 0) {
          setErrors(problem.fieldErrors);
          setFormError('');
        } else {
          setFormError(problem.message);
        }
      }
    });
  };

  return (
    <form
      className="cur-form"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      {chapter && (
        <p className="sep-muted cur-dialog-context">
          Chương {chapter.code}. {chapter.title} · {chapter.gradeLevelName} · {chapter.fieldName}
        </p>
      )}
      <div className="cur-form-fields">
        <Field
          label="Mã bài *"
          value={values.code}
          maxLength={32}
          error={errors.code}
          placeholder="Ví dụ: 10"
          onChange={(event) => set('code', event.target.value)}
        />
        <Field
          label="Tên bài *"
          value={values.title}
          maxLength={255}
          error={errors.title}
          placeholder="Ví dụ: Khái niệm số thập phân"
          onChange={(event) => set('title', event.target.value)}
        />
      </div>
      {formError && (
        <div className="sep-alert cur-dialog-note" role="alert">
          {formError}
        </div>
      )}
      <div className="sep-actions">
        <PcbButton variant="ghost" onClick={onClose}>
          Huỷ
        </PcbButton>
        <PcbButton type="submit" disabled={busy}>
          {busy ? 'Đang lưu…' : lesson ? 'Lưu thay đổi' : 'Thêm bài học'}
        </PcbButton>
      </div>
    </form>
  );
};
