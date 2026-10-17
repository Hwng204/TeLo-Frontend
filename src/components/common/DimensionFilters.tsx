import { SelectField } from '../pcb';
import type { AcademicContextOption } from '../../types';
import { contextOptions } from '../../utils/academicContext';

export type DimensionFilterValue = {
  subjectId?: number;
  gradeLevelId?: number;
};

type Props = {
  contexts: AcademicContextOption[];
  value: DimensionFilterValue;
  onChange: (next: DimensionFilterValue) => void;
};

/**
 * Hai ô lọc trên thanh công cụ của danh sách ma trận: Môn học · Khối lớp (ma trận không có năm học, học kỳ).
 * Mỗi ô gửi thẳng lên backend như một tham số riêng, nên không cần chọn đủ để ra một academicContextId.
 * Danh sách lựa chọn vẫn thu hẹp theo các ô còn lại để không chọn ra tổ hợp không tồn tại.
 */
export const DimensionFilters = ({ contexts, value, onChange }: Props) => {
  const set = (key: keyof DimensionFilterValue, raw: string) => onChange({ ...value, [key]: raw ? Number(raw) : undefined });

  const dimension = (key: keyof DimensionFilterValue) =>
    contextOptions(contexts, { ...value, [key]: undefined }, key);

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
      {select('subjectId', 'Môn học', dimension('subjectId'))}
      {select('gradeLevelId', 'Khối lớp', dimension('gradeLevelId'))}
    </>
  );
};
