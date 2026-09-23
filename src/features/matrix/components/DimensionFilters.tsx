import { SelectField } from '../../../components/pcb';
import type { AcademicContextOption, SemesterOption } from '../../../types';
import { contextOptions } from '../../../utils/academicContext';

export type DimensionFilterValue = {
  academicYearId?: number;
  semesterId?: number;
  subjectId?: number;
  gradeLevelId?: number;
};

type Props = {
  contexts: AcademicContextOption[];
  semesters: SemesterOption[];
  value: DimensionFilterValue;
  onChange: (next: DimensionFilterValue) => void;
};

/**
 * Bốn ô lọc trên thanh công cụ của hai màn danh sách: Năm học · Học kỳ · Môn học · Khối lớp.
 * Mỗi ô gửi thẳng lên backend như một tham số riêng, nên không cần chọn đủ để ra một academicContextId.
 * Danh sách lựa chọn vẫn thu hẹp theo các ô còn lại để không chọn ra tổ hợp không tồn tại.
 */
export const DimensionFilters = ({ contexts, semesters, value, onChange }: Props) => {
  const set = (key: keyof DimensionFilterValue, raw: string) => {
    const next = { ...value, [key]: raw ? Number(raw) : undefined };
    // Học kỳ thuộc về một năm học: đổi năm thì bỏ học kỳ không còn khớp.
    if (key === 'academicYearId' && next.academicYearId !== undefined) {
      const semester = semesters.find((item) => item.id === next.semesterId);
      if (semester && semester.academicYearId !== next.academicYearId) next.semesterId = undefined;
    }
    onChange(next);
  };

  const dimension = (key: 'academicYearId' | 'subjectId' | 'gradeLevelId') =>
    contextOptions(contexts, { ...value, [key]: undefined }, key);
  const semesterOptions = (
    value.academicYearId ? semesters.filter((semester) => semester.academicYearId === value.academicYearId) : semesters
  ).map((semester) => ({ id: semester.id, label: semester.name }));

  const select = (key: keyof DimensionFilterValue, label: string, options: { id: number; label: string }[]) => (
    <SelectField
      label={label}
      hideLabel
      placeholder={label}
      value={value[key] ?? ''}
      onChange={(event) => set(key, event.target.value)}
    >
      <option value="">Tất cả {label.toLowerCase()}</option>
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.label}
        </option>
      ))}
    </SelectField>
  );

  return (
    <>
      {select('academicYearId', 'Năm học', dimension('academicYearId'))}
      {select('semesterId', 'Học kỳ', semesterOptions)}
      {select('subjectId', 'Môn học', dimension('subjectId'))}
      {select('gradeLevelId', 'Khối lớp', dimension('gradeLevelId'))}
    </>
  );
};
