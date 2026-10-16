import { SelectField } from '../../../components/pcb';
import type { AcademicContextOption } from '../../../types';
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
  subjectId: 'Môn học',
  gradeLevelId: 'Khối lớp',
  academicYearId: 'Năm học',
};

type Props = {
  contexts: AcademicContextOption[];
  value: ContextSelection;
  onChange: (next: ContextSelection) => void;
  /** Khoá lại khi đổi ngữ cảnh sẽ làm hỏng các dòng chi tiết đang có. */
  disabled?: boolean;
  disabledHint?: string;
  /** Chữ của lựa chọn rỗng; hàm nhận tên chiều để ghi cụ thể ("Chọn môn học"). */
  emptyLabel?: string | ((label: string) => string);
  error?: string;
  /** Lỗi riêng từng chiều, hiện ngay dưới ô đó (thắng `error` ở ô Khối lớp). */
  errors?: Partial<Record<ContextDimension, string>>;
  /** Thêm dấu * vào nhãn Môn học, Khối lớp. */
  required?: boolean;
  /** Lớp thêm cho lưới `.sep-context`. */
  className?: string;
  /**
   * Dạng ô lọc trên thanh công cụ: không có nhãn nhìn thấy, ô trống đọc là "Tất cả <chiều>",
   * và các ô trả thẳng ra ngoài để xếp chung hàng với ô tìm kiếm.
   */
  toolbar?: boolean;
};

/** Ô chọn phạm vi ma trận: Môn học · Khối lớp (chi nhánh nếu có nhiều). Ma trận không có năm học, học kỳ. */
export const ContextSelects = ({
  contexts,
  value,
  onChange,
  disabled,
  disabledHint,
  emptyLabel = 'Tất cả',
  error,
  errors,
  required,
  className,
  toolbar,
}: Props) => {
  const empty = (label: string) =>
    toolbar ? `Tất cả ${label.toLowerCase()}` : typeof emptyLabel === 'function' ? emptyLabel(label) : emptyLabel;
  const allBranches = contextBranchOptions(contexts, {});
  const branches = contextBranchOptions(contexts, value);

  const changeDimension = (dimension: ContextDimension, raw: string) =>
    onChange(applyContextChange(contexts, value, dimension, raw ? Number(raw) : undefined));

  const fields = (
    <>
      {allBranches.length > 1 && (
        <SelectField
          label="Chi nhánh"
          hideLabel={toolbar}
          placeholder={toolbar ? 'Chi nhánh' : undefined}
          value={value.schoolBranchId ?? ''}
          disabled={disabled}
          title={disabled ? disabledHint : undefined}
          onChange={(event) =>
            onChange(applyBranchChange(contexts, value, event.target.value ? Number(event.target.value) : undefined))
          }
        >
          <option value="">{empty('Chi nhánh')}</option>
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
          label={required ? `${LABELS[dimension]} *` : LABELS[dimension]}
          hideLabel={toolbar}
          // Trên thanh lọc, ô chưa chọn chỉ ghi tên chiều (mờ) cho gọn một hàng; mở ra vẫn thấy "Tất cả …".
          placeholder={toolbar ? LABELS[dimension] : undefined}
          value={value[dimension] ?? ''}
          disabled={disabled}
          title={disabled ? disabledHint : undefined}
          error={errors?.[dimension] ?? (dimension === 'gradeLevelId' ? error : undefined)}
          onChange={(event) => changeDimension(dimension, event.target.value)}
        >
          <option value="">{empty(LABELS[dimension])}</option>
          {contextOptions(contexts, value, dimension).map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </SelectField>
      ))}

      {/* `title` chỉ hiện khi rê chuột, dễ bị bỏ sót; khoá cả cụm thì phải nói rõ vì sao ngay trên trang. */}
      {disabled && disabledHint && <p className="pcb-hint sep-context__hint">{disabledHint}</p>}
    </>
  );

  if (toolbar) return fields;
  return <div className={className ? `sep-context ${className}` : 'sep-context'}>{fields}</div>;
};
