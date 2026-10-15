import { useState } from 'react';
import { Field, PcbButton } from '../../../components/pcb';
import { useBusy } from '../../../hooks';
import { api } from '../../../services/api';
import type { Chapter, Lesson } from '../../../types';
import { isValidNumber } from '../../../utils/curriculumFilter';
import { toProblem } from '../../../utils/problem';
import { FormDialog } from '../../../components/common/FormDialog';

type Props = {
  open: boolean;
  chapter: Chapter | null;
  fieldName?: string;
  /** Có thì là sửa bài này, không thì thêm bài mới vào `chapter`. */
  lesson: Lesson | null;
  onClose: () => void;
  onSaved: (message: string) => void;
};

type Values = { number: string; title: string };

/** Thêm/sửa bài học trong một chương (MSG02 bắt buộc nhập, MSG07 trùng số/tên trong chương). */
export const LessonFormDialog = (props: Props) => (
  <FormDialog open={props.open} title={props.lesson ? 'Sửa bài học' : 'Thêm bài học'} onClose={props.onClose} closeButton className="cur-dialog">
    <LessonForm key={`${props.lesson?.id ?? 'new'}-${props.chapter?.id}-${props.open}`} {...props} />
  </FormDialog>
);

const LessonForm = ({ chapter, fieldName, lesson, onClose, onSaved }: Props) => {
  const [values, setValues] = useState<Values>(() => ({
    // Bài mới: gợi ý số bài lớn nhất trong chương + 1.
    number: String(lesson?.number ?? Math.max(0, ...(chapter?.lessons ?? []).map((item) => item.number)) + 1),
    title: lesson?.title ?? '',
  }));
  const [errors, setErrors] = useState<Partial<Record<keyof Values, string>>>({});
  const [formError, setFormError] = useState('');
  const [busy, runExclusive] = useBusy();

  const set = (key: keyof Values, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const submit = () => {
    const next: Partial<Record<keyof Values, string>> = {};
    if (!isValidNumber(values.number)) next.number = 'Số bài phải là số nguyên từ 1 đến 999.';
    if (!values.title.trim()) next.title = 'Trường Tên bài là bắt buộc.';
    if (next.number || next.title || !chapter) {
      setErrors(next);
      return;
    }
    void runExclusive(async () => {
      const body = { number: Number(values.number), title: values.title };
      try {
        if (lesson) await api.curriculum.updateLesson(lesson.id, body);
        else await api.curriculum.createLesson(chapter.id, body);
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
          Chương {chapter.number}: {chapter.title} · {chapter.gradeLevelName} · {fieldName ?? chapter.fieldName}
        </p>
      )}
      <div className="cur-form-fields">
        <Field
          label="Số bài *"
          type="number"
          inputMode="numeric"
          min={1}
          max={999}
          step={1}
          value={values.number}
          error={errors.number}
          placeholder="Ví dụ: 10"
          onChange={(event) => set('number', event.target.value)}
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
        <PcbButton variant="secondary" onClick={onClose}>
          Đóng
        </PcbButton>
        <PcbButton type="submit" disabled={busy}>
          {busy ? 'Đang lưu…' : lesson ? 'Lưu thay đổi' : 'Thêm bài học'}
        </PcbButton>
      </div>
    </form>
  );
};
