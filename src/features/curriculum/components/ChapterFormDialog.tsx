import { useState } from 'react';
import { Field, PcbButton, SelectField } from '../../../components/pcb';
import { useBusy } from '../../../hooks';
import { api } from '../../../services/api';
import type { Chapter, CurriculumField, CurriculumOption } from '../../../types';
import { isValidNumber } from '../../../utils/curriculumFilter';
import { toProblem } from '../../../utils/problem';
import { FormDialog } from '../../../components/common/FormDialog';
import { curriculumFieldLabel } from './fieldLabel';

type Props = {
  open: boolean;
  /** Có thì là sửa chương này, không thì thêm mới. */
  chapter: Chapter | null;
  grades: CurriculumOption[];
  fields: CurriculumField[];
  /** Chương đang có, để gợi ý Số chương kế tiếp trong cùng khối lớp + môn học. */
  chapters: Chapter[];
  onClose: () => void;
  onSaved: (message: string) => void;
};

type Values = { gradeLevelId: string; fieldId: string; number: string; title: string };

const LABELS: Record<keyof Values, string> = {
  gradeLevelId: 'Khối lớp',
  fieldId: 'Môn học',
  number: 'Số chương',
  title: 'Tên chương',
};

const initial = (chapter: Chapter | null): Values => ({
  gradeLevelId: chapter ? String(chapter.gradeLevelId) : '',
  fieldId: chapter ? String(chapter.fieldId) : '',
  number: chapter ? String(chapter.number) : '',
  title: chapter?.title ?? '',
});

/** Số chương gợi ý: lớn nhất trong cùng khối lớp + môn học, cộng 1; chưa chọn đủ thì để trống. */
const nextNumber = (chapters: Chapter[], gradeLevelId: string, fieldId: string) =>
  gradeLevelId && fieldId
    ? String(
        Math.max(
          0,
          ...chapters
            .filter((item) => item.gradeLevelId === Number(gradeLevelId) && item.fieldId === Number(fieldId))
            .map((item) => item.number),
        ) + 1,
      )
    : '';

/** Thêm/sửa chương (MSG02 bắt buộc nhập, MSG06 trùng số/tên, MSG18 khoá khối & môn học khi đã dùng). */
export const ChapterFormDialog = (props: Props) => (
  <FormDialog open={props.open} title={props.chapter ? 'Sửa chương' : 'Thêm chương'} onClose={props.onClose} closeButton className="cur-dialog">
    {/* key: mở lại dialog luôn bắt đầu từ dữ liệu mới, không giữ lỗi của lần trước. */}
    <ChapterForm key={`${props.chapter?.id ?? 'new'}-${props.open}`} {...props} />
  </FormDialog>
);

const ChapterForm = ({ chapter, grades, fields, chapters, onClose, onSaved }: Props) => {
  const [values, setValues] = useState<Values>(() => initial(chapter));
  const [errors, setErrors] = useState<Partial<Record<keyof Values, string>>>({});
  const [formError, setFormError] = useState('');
  const [busy, runExclusive] = useBusy();
  // Người dùng đã tự sửa Số chương thì thôi gợi ý lại khi đổi khối lớp/môn học.
  const [numberEdited, setNumberEdited] = useState(chapter != null);
  // Chương đã được ma trận/nhiệm vụ dùng thì không đổi khối và môn học được.
  const scopeLocked = Boolean(chapter?.inUse);

  const set = (key: keyof Values, value: string) => {
    setValues((current) => {
      const next = { ...current, [key]: value };
      if (!numberEdited && (key === 'gradeLevelId' || key === 'fieldId')) {
        next.number = nextNumber(chapters, next.gradeLevelId, next.fieldId);
      }
      return next;
    });
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const submit = () => {
    const missing = (Object.keys(LABELS) as (keyof Values)[]).filter((key) => key !== 'number' && !values[key].trim());
    const next: Partial<Record<keyof Values, string>> = Object.fromEntries(
      missing.map((key) => [key, `Trường ${LABELS[key]} là bắt buộc.`]),
    );
    if (!isValidNumber(values.number)) next.number = 'Số chương phải là số nguyên từ 1 đến 999.';
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }
    void runExclusive(async () => {
      const body = {
        gradeLevelId: Number(values.gradeLevelId),
        fieldId: Number(values.fieldId),
        number: Number(values.number),
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
          <option value="">Chọn môn học</option>
          {fields.map((field) => (
            <option key={field.id} value={field.id}>
              {curriculumFieldLabel(field, fields)}
            </option>
          ))}
        </SelectField>
        <Field
          label={`${LABELS.number} *`}
          type="number"
          inputMode="numeric"
          min={1}
          max={999}
          step={1}
          value={values.number}
          error={errors.number}
          placeholder="Ví dụ: 1"
          onChange={(event) => {
            setNumberEdited(true);
            set('number', event.target.value);
          }}
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
          Chương đã được sử dụng trong ma trận hoặc nhiệm vụ nên không đổi được khối lớp và môn học.
        </p>
      )}
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
          {busy ? 'Đang lưu…' : chapter ? 'Lưu thay đổi' : 'Thêm chương'}
        </PcbButton>
      </div>
    </form>
  );
};
