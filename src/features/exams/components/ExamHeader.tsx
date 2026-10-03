import { Icon } from '../../../components/pcb';

type ExamHeaderProps = {
  academicYearName?: string;
  userName?: string;
  userRole: string;
};

const initials = (name: string) => name
  .trim()
  .split(/\s+/)
  .slice(-2)
  .map((part) => part[0])
  .join('')
  .toUpperCase();

export const ExamHeader = ({ academicYearName, userName, userRole }: ExamHeaderProps) => {
  const displayName = userName || 'Quản trị viên';

  return (
    <header className="exam-topbar">
      <div className="exam-breadcrumb">
        <span>Tổ chức thi</span>
        <Icon name="chevron_right" size={18} />
        <strong>Danh sách kỳ thi</strong>
        <Icon name="history" size={18} />
      </div>

      <div className="exam-topbar__right">
        <div className="exam-year-chip">
          Năm học: <strong>{academicYearName ?? 'Chưa thiết lập'}</strong>
        </div>
        <button className="exam-notification" type="button" aria-label="Thông báo">
          <Icon name="notifications" size={20} />
          <i />
        </button>
        <div className="exam-user">
          <span className="exam-user__avatar">{initials(displayName || 'QT')}</span>
          <span>
            <strong>{displayName}</strong>
            <small>{userRole}</small>
          </span>
        </div>
      </div>
    </header>
  );
};
