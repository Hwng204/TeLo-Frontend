import type { ReactNode } from 'react';
import { Field, SelectField } from '../../../components/pcb';
import type { AcademicYearListItem, ExamStatus } from '../../../types';

export type ExamStatusTab = '' | 'DRAFT' | 'SCHEDULED' | 'COMPLETED';

type ExamFiltersProps = {
  keyword: string;
  academicYearId: number | '';
  status: ExamStatusTab;
  years: AcademicYearListItem[];
  onKeywordChange: (value: string) => void;
  onAcademicYearChange: (value: number | '') => void;
  onStatusChange: (value: ExamStatusTab) => void;
  actions?: ReactNode;
};

const STATUS_TABS: { value: ExamStatusTab; label: string }[] = [
  { value: '', label: 'Tất cả' },
  { value: 'DRAFT', label: 'Đang cấu hình' },
  { value: 'SCHEDULED', label: 'Đã chốt' },
  { value: 'COMPLETED', label: 'Đã kết thúc' },
];

export const ExamFilters = ({
  keyword,
  academicYearId,
  status,
  years,
  onKeywordChange,
  onAcademicYearChange,
  onStatusChange,
  actions,
}: ExamFiltersProps) => (
  <div className="sep-toolbar exam-list-toolbar">
      <div className="sep-toolbar__filters">
        <Field
          label="Tìm tên kỳ thi"
          hideLabel
          leading="search"
          fieldClassName="sep-toolbar__search exam-search-field"
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
          placeholder="Tìm tên kỳ thi"
        />
        <SelectField
          label="Năm học"
          hideLabel
          placeholder="Tất cả năm học"
          value={academicYearId}
          onChange={(event) => onAcademicYearChange(event.target.value ? Number(event.target.value) : '')}
        >
          <option value="">Tất cả năm học</option>
          {years.map((year) => <option key={year.id} value={year.id}>{year.name}</option>)}
        </SelectField>
        <SelectField
          label="Trạng thái"
          hideLabel
          placeholder="Tất cả trạng thái"
          value={status}
          onChange={(event) => onStatusChange(event.target.value as ExamStatusTab)}
        >
          <option value="">Tất cả trạng thái</option>
          {STATUS_TABS.filter((item) => item.value).map((item) => (
            <option key={item.value} value={item.value as ExamStatus}>{item.label}</option>
          ))}
        </SelectField>
      </div>
      {actions && <div className="sep-toolbar__actions">{actions}</div>}
  </div>
);
