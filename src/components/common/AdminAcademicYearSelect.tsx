import type { AcademicYearListItem } from '../../types/academicYear';
import { Icon, SelectField } from '../pcb';
import { formatActiveAcademicYear } from '../../utils/academicYear';
import './AdminAcademicYearSelect.css';

const statusLabels = { ACTIVE: 'Đang áp dụng', DRAFT: 'Chưa áp dụng', CLOSED: 'Đã kết thúc' };

type Props = {
  years: AcademicYearListItem[];
  year?: AcademicYearListItem;
  loading: boolean;
  error: unknown;
  onChange: (id: string) => void;
  onRetry: () => void;
};

export function AdminAcademicYearSelect({ years, year, loading, error, onChange, onRetry }: Props) {
  if (error) return (
    <div className="admin-year-error" role="alert">
      <span>Không tải được năm học</span>
      <button type="button" onClick={onRetry} aria-label="Tải lại danh sách năm học" title="Tải lại">
        <Icon name="refresh" size={18} />
      </button>
    </div>
  );
  return (
    <div className="admin-year-select" aria-busy={loading}>
      <Icon name="calendar_month" size={20} />
      <SelectField label="Năm học làm việc" hideLabel value={year?.id ?? ''}
        title={year ? `${formatActiveAcademicYear(year.name)} · ${statusLabels[year.status]}` : undefined}
        selectedLabel={year ? <span className="admin-year-selected"><span>Năm học</span><span>{year.name.replace(/\s*-\s*/, ' - ')}</span></span> : undefined}
        disabled={loading || !years.length} fieldClassName="admin-year-field"
        onChange={event => onChange(event.target.value)}
        placeholder={loading ? 'Đang tải năm học…' : 'Chưa có năm học'}>
        {years.map(item => (
          <option key={item.id} value={item.id}>
            <span className="admin-year-option">
              <span>{formatActiveAcademicYear(item.name)}</span>
              <span className={`admin-year-status admin-year-status--${item.status.toLowerCase()}`}>{statusLabels[item.status]}</span>
            </span>
          </option>
        ))}
      </SelectField>
      {year && <span className={`admin-year-status admin-year-current-status admin-year-status--${year.status.toLowerCase()}`}>{statusLabels[year.status]}</span>}
    </div>
  );
}
