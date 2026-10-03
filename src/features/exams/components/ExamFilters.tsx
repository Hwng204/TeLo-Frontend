import { Icon } from '../../../components/pcb';
import type { SemesterOption } from '../../../types';

export type ExamStatusTab = '' | 'SCHEDULED' | 'ONGOING' | 'COMPLETED';

export type ExamBranchOption = {
  id: number;
  name: string;
};

type ExamFiltersProps = {
  keyword: string;
  semesterId: number | '';
  branchId: number | '';
  status: ExamStatusTab;
  semesters: SemesterOption[];
  branches: ExamBranchOption[];
  onKeywordChange: (value: string) => void;
  onSemesterChange: (value: number | '') => void;
  onBranchChange: (value: number | '') => void;
  onStatusChange: (value: ExamStatusTab) => void;
};

const STATUS_TABS: { value: ExamStatusTab; label: string }[] = [
  { value: 'SCHEDULED', label: 'Sắp diễn ra' },
  { value: '', label: 'Tất cả' },
  { value: 'ONGOING', label: 'Đang diễn ra' },
  { value: 'COMPLETED', label: 'Đã kết thúc' },
];

export const ExamFilters = ({
  keyword,
  semesterId,
  branchId,
  status,
  semesters,
  branches,
  onKeywordChange,
  onSemesterChange,
  onBranchChange,
  onStatusChange,
}: ExamFiltersProps) => (
  <section className="exam-filter-card" aria-label="Bộ lọc kỳ thi">
    <div className="exam-filter-row">
      <label className="exam-search">
        <Icon name="search" size={20} />
        <input
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
          placeholder="Tìm kiếm kỳ thi..."
        />
      </label>

      <select
        aria-label="Học kỳ"
        value={semesterId}
        onChange={(event) => onSemesterChange(event.target.value ? Number(event.target.value) : '')}
      >
        <option value="">Năm học (Tất cả)</option>
        {semesters.map((semester) => (
          <option key={semester.id} value={semester.id}>{semester.name}</option>
        ))}
      </select>

      <select
        aria-label="Cơ sở"
        value={branchId}
        onChange={(event) => onBranchChange(event.target.value ? Number(event.target.value) : '')}
      >
        <option value="">Cơ sở (Tất cả)</option>
        {branches.map((branch) => (
          <option key={branch.id} value={branch.id}>{branch.name}</option>
        ))}
      </select>
    </div>

    <div className="exam-tabs">
      {STATUS_TABS.map((tab) => (
        <button
          key={tab.label}
          type="button"
          className={status === tab.value ? 'is-active' : ''}
          onClick={() => onStatusChange(tab.value)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  </section>
);
