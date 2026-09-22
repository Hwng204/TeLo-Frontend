import { SelectField } from '../../../components/pcb';
import type { AcademicContextOption, SemesterOption } from '../../../types';
import {
  CONTEXT_DIMENSIONS,
  applyBranchChange,
  applyContextChange,
  contextBranchOptions,
  contextOptions,
  type ContextDimension,
  type ContextSelection,
} from '../../../utils/academicContext';

const LABELS: Record<ContextDimension, string> = {
  textbookId: 'Chương trình',
  subjectId: 'Môn học',
  gradeLevelId: 'Khối lớp',
  academicYearId: 'Năm học',
};

type Props = {
  contexts: AcademicContextOption[];
  semesters: SemesterOption[];
  value: ContextSelection;
  onChange: (next: ContextSelection) => void;
  /** Khoá lại khi đổi ngữ cảnh sẽ làm hỏng các dòng chi tiết đang có. */
  disabled?: boolean;
  disabledHint?: string;
  /**
   * Học kỳ không nằm trong 4 chiều tạo nên `academicContextId` (không ảnh hưởng danh sách bài
   * học), nên khoá `disabled` không áp cho nó — trừ khi truyền riêng. Mặc định theo `disabled`
   * để các nơi gọi cũ (danh sách, bộ lọc) không phải đổi gì.
   */
  semesterDisabled?: boolean;
  compact?: boolean;
  emptyLabel?: string;
  error?: string;
  /** Trả thẳng các ô chọn, không bọc lưới riêng, để trang ngoài xếp chung lưới với ô khác. */
  bare?: boolean;
};

export const ContextSelects = ({
  contexts,
  semesters,
  value,
  onChange,
  disabled,
  disabledHint,
  semesterDisabled,
  compact,
  emptyLabel = 'Tất cả',
  error,
  bare,
}: Props) => {
  const semesterLocked = semesterDisabled ?? disabled;
  const allBranches = contextBranchOptions(contexts, {});
  const branches = contextBranchOptions(contexts, value);
  const availableSemesters = value.academicYearId
    ? semesters.filter((semester) => semester.academicYearId === value.academicYearId)
    : semesters;

  const changeDimension = (dimension: ContextDimension, raw: string) => {
    const next = applyContextChange(contexts, value, dimension, raw ? Number(raw) : undefined);
    // Đổi năm học thì học kỳ đang chọn có thể không còn thuộc năm đó nữa.
    const stillValid = semesters.some(
      (semester) => semester.id === next.semesterId && semester.academicYearId === next.academicYearId,
    );
    if (next.semesterId && !stillValid) next.semesterId = undefined;
    onChange(next);
  };

  const fields = (
    <>
      {allBranches.length > 1 && (
        <SelectField
          label="Chi nhánh"
          value={value.schoolBranchId ?? ''}
          disabled={disabled}
          title={disabled ? disabledHint : undefined}
          onChange={(event) =>
            onChange(applyBranchChange(contexts, value, event.target.value ? Number(event.target.value) : undefined))
          }
        >
          <option value="">{emptyLabel}</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.label}
            </option>
          ))}
        </SelectField>
      )}

      {CONTEXT_DIMENSIONS.map((dimension) => (
        <SelectField
          key={dimension}
          label={LABELS[dimension]}
          value={value[dimension] ?? ''}
          disabled={disabled}
          title={disabled ? disabledHint : undefined}
          error={dimension === 'academicYearId' ? error : undefined}
          onChange={(event) => changeDimension(dimension, event.target.value)}
        >
          <option value="">{emptyLabel}</option>
          {contextOptions(contexts, value, dimension).map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </SelectField>
      ))}

      <SelectField
        label="Học kỳ"
        value={value.semesterId ?? ''}
        disabled={semesterLocked}
        title={semesterLocked ? disabledHint : undefined}
        onChange={(event) =>
          onChange({ ...value, semesterId: event.target.value ? Number(event.target.value) : undefined })
        }
      >
        <option value="">{emptyLabel}</option>
        {availableSemesters.map((semester) => (
          <option key={semester.id} value={semester.id}>
            {semester.name}
          </option>
        ))}
      </SelectField>

      {/* `title` chỉ hiện khi rê chuột, dễ bị bỏ sót; khoá cả cụm thì phải nói rõ vì sao ngay trên trang. */}
      {disabled && disabledHint && <p className="pcb-hint sep-context__hint">{disabledHint}</p>}
    </>
  );

  if (bare) return fields;
  return <div className={compact ? 'sep-context sep-context--compact' : 'sep-context'}>{fields}</div>;
};
