import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Icon } from '../components/pcb';
import { isTeamLead, roleLabel } from '../utils/jwt';
import { storage } from '../utils/storage';
import './MatrixLayout.css';

type NavEntry = { icon: string; label: string; to?: string };

// `to` is set only for screens that exist; the rest render inert as in the design.
const PHT_NAV: NavEntry[] = [
  { icon: 'dashboard', label: 'Tổng quan' },
  { icon: 'menu_book', label: 'Chương trình học' },
  { icon: 'table_chart', label: 'Ma trận đề', to: '/matrices' },
  { icon: 'fact_check', label: 'Duyệt bộ đề' },
  { icon: 'database', label: 'Ngân hàng câu hỏi' },
  { icon: 'inventory_2', label: 'Kho đề' },
];
const PHT_NAV_AFTER_EXAM_GROUP: NavEntry[] = [
  { icon: 'auto_awesome', label: 'Báo cáo khảo thí AI' },
  { icon: 'group', label: 'Quản lý giáo viên' },
  { icon: 'school', label: 'Quản lý học sinh' },
  { icon: 'meeting_room', label: 'Quản lý lớp học' },
  { icon: 'calendar_month', label: 'Quản lý năm học' },
  { icon: 'mail', label: 'Quản lý mẫu mail' },
  { icon: 'bar_chart', label: 'Báo cáo & Thống kê' },
];
const EXAM_GROUP = [
  'Danh sách kỳ thi', 'Danh sách môn thi', 'Danh sách thí sinh', 'Danh sách bộ đề thi', 'Danh sách phòng thi',
  'Danh sách ca thi', 'Xếp phòng thi', 'Danh sách giám thị', 'Phân công giám thị',
];
const TL_NAV: NavEntry[] = [
  { icon: 'menu_book', label: 'Chương trình học' },
  { icon: 'assignment', label: 'Nhiệm vụ ma trận', to: '/matrix-tasks' },
  { icon: 'assignment_ind', label: 'Phân công biên soạn' },
  { icon: 'database', label: 'Ngân hàng câu hỏi' },
  { icon: 'fact_check', label: 'Tạo và rà soát đề' },
  { icon: 'inventory_2', label: 'Kho đề' },
];

const NavItem = ({ icon, label, to }: NavEntry) => {
  const body = (
    <>
      <Icon name={icon} size={22} />
      <span>{label}</span>
    </>
  );
  return to ? (
    <NavLink to={to} className={({ isActive }) => `sep-nav${isActive ? ' sep-nav--active' : ''}`}>{body}</NavLink>
  ) : (
    <span className="sep-nav sep-nav--inert" aria-disabled="true">{body}</span>
  );
};

export const MatrixLayout = () => {
  const navigate = useNavigate();
  const teamLead = isTeamLead();
  // Thu gọn mặc định: 9 mục con mở sẵn làm menu PHT dài gấp đôi menu Tổ trưởng.
  const [examOpen, setExamOpen] = useState(false);

  const logout = () => {
    storage.clearAuth();
    navigate('/login');
  };

  return (
    <div className="sep-app sep-shell">
      <aside className="sep-sidebar">
        <div className="sep-brand">
          <img src="/logo-pcb.png" alt="" width={48} height={48} />
          <div>
            <div className="sep-brand__name">Tiểu học<br />Phạm Công Bình</div>
            <div className="sep-brand__role">{roleLabel()}</div>
          </div>
        </div>
        <nav className="sep-nav-list">
          {teamLead ? (
            TL_NAV.map((item) => <NavItem key={item.label} {...item} />)
          ) : (
            <>
              {PHT_NAV.map((item) => <NavItem key={item.label} {...item} />)}
              <div>
                <button type="button" className="sep-nav sep-nav--group" aria-expanded={examOpen} onClick={() => setExamOpen(!examOpen)}>
                  <Icon name="event" size={22} />
                  <span>Tổ chức thi</span>
                  <Icon name={examOpen ? 'expand_less' : 'expand_more'} size={22} />
                </button>
                {examOpen && (
                  <div className="sep-submenu">
                    {EXAM_GROUP.map((label) => <span key={label} className="sep-subnav" aria-disabled="true">{label}</span>)}
                  </div>
                )}
              </div>
              {PHT_NAV_AFTER_EXAM_GROUP.map((item) => <NavItem key={item.label} {...item} />)}
            </>
          )}
        </nav>
        <div className="sep-support">
          <span className="sep-nav sep-nav--inert"><Icon name="help" size={22} /><span>Trợ giúp</span></span>
          <button type="button" className="sep-nav" onClick={logout}><Icon name="logout" size={22} /><span>Đăng xuất</span></button>
        </div>
      </aside>
      <main className="sep-main">
        <Outlet />
      </main>
    </div>
  );
};
