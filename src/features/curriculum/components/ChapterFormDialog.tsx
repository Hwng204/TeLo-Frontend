import { useState } from 'react';
import { Field, PcbButton, SelectField } from '../../../components/pcb';
import { useBusy } from '../../../hooks';
import { api } from '../../../services/api';
import type { Chapter, CurriculumField, CurriculumOption } from '../../../types';
import { toProblem } from '../../../utils/problem';
import { FormDialog } from './FormDialog';

type Props = {
  open: boolean;
  /** Có thì là sửa chương này, không thì thêm mới. */
  chapter: Chapter | null;
  grades: CurriculumOption[];
  fields: CurriculumField[];
  onClose: () => void;
  onSaved: (message: string) => void;
};

type Values = { gradeLevelId: string; fieldId: string; code: string; title: string };

const LABELS: Record<keyof Values, string> = {
  gradeLevelId: 'Khối lớp',
  fieldId: 'Lĩnh vực',
  code: 'Mã chương',
  title: 'Tên chương',
};

const initial = (chapter: Chapter | null): Values => ({
  gradeLevelId: chapter ? String(chapter.gradeLevelId) : '',
  fieldId: chapter ? String(chapter.fieldId) : '',
  code: chapter?.code ?? '',
  title: chapter?.title ?? '',
});

/** Thêm/sửa chương (MSG02 bắt buộc nhập, MSG06 trùng mã/tên, MSG18 khoá khối & lĩnh vực khi đã dùng). */
export const ChapterFormDialog = (props: Props) => (
  <FormDialog open={props.open} title={props.chapter ? 'Sửa chương' : 'Thêm chương'} onClose={props.onClose}>
    {/* key: mở lại dialog luôn bắt đầu từ dữ liệu mới, không giữ lỗi của lần trước. */}
    <ChapterForm key={`${props.chapter?.id ?? 'new'}-${props.open}`} {...props} />
  </FormDialog>
);

const ChapterForm = ({ chapter, grades, fields, onClose, onSaved }: Props) => {
  const [values, setValues] = useState<Values>(() => initial(chapter));
  const [errors, setErrors] = useState<Partial<Record<keyof Values, string>>>({});
  const [formError, setFormError] = useState('');
  const [busy, runExclusive] = useBusy();
  // Chương đã được ma trận/nhiệm vụ dùng thì không đổi khối và lĩnh vực được.
  const scopeLocked = Boolean(chapter?.inUse);

  const set = (key: keyof Values, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const submit = () => {
    const missing = (Object.keys(LABELS) as (keyof Values)[]).filter((key) => !values[key].trim());
    if (missing.length > 0) {
      setErrors(Object.fromEntries(missing.map((key) => [key, `Trường ${LABELS[key]} là bắt buộc.`])));
      return;
    }
    void runExclusive(async () => {
      const body = {
        gradeLevelId: Number(values.gradeLevelId),
        fieldId: Number(values.fieldId),
        code: values.code,
        title: values.title,
      };
      try {
        if (chapter) await api.curriculum.updateChapter(chapter.id, body);
        else await api.curriculum.createChapter(body);
        onSaved(chapter ? 'Cập nhật chương học thành công.' : 'Thêm chương học thành công.');
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
      <div className="cur-form-fields">
        <SelectField
          label={`${LABELS.gradeLevelId} *`}
          value={values.gradeLevelId}
          error={errors.gradeLevelId}
          disabled={scopeLocked}
          onChange={(event) => set('gradeLevelId', event.target.value)}
        >
          <option value="">Chọn khối lớp</option>
          {grades.map((grade) => (
            <option key={grade.id} value={grade.id}>
              {grade.name}
            </option>
          ))}
        </SelectField>
        <SelectField
          label={`${LABELS.fieldId} *`}
          value={values.fieldId}
          error={errors.fieldId}
          disabled={scopeLocked}
          onChange={(event) => set('fieldId', event.target.value)}
        >
          <option value="">Chọn lĩnh vực</option>
          {fields.map((field) => (
            <option key={field.id} value={field.id}>
              {field.name}
            </option>
          ))}
        </SelectField>
        <Field
          label={`${LABELS.code} *`}
          value={values.code}
          maxLength={32}
          error={errors.code}
          placeholder="Ví dụ: 1"
          onChange={(event) => set('code', event.target.value)}
        />
        <Field
          label={`${LABELS.title} *`}
          value={values.title}
          maxLength={255}
          error={errors.title}
          placeholder="Ví dụ: Số thập phân"
          onChange={(event) => set('title', event.target.value)}
        />
      </div>
      {scopeLocked && (
        <p className="pcb-hint cur-dialog-note">
          Chương đã được sử dụng trong ma trận hoặc nhiệm vụ nên không đổi được khối lớp và lĩnh vực.
        </p>
      )}
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
          {busy ? 'Đang lưu…' : chapter ? 'Lưu thay đổi' : 'Thêm chương'}
        </PcbButton>
      </div>
    </form>
  );
};
