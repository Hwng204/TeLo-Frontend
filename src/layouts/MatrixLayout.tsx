import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Icon } from '../components/pcb';
import { isTeamLead } from '../utils/jwt';
import { storage } from '../utils/storage';
import './MatrixLayout.css';

/** `to` chỉ có ở màn đã dựng; các mục còn lại hiển thị như bản thiết kế nhưng không bấm được. */
type NavEntry = { icon: string; label: string; to?: string; activeFor?: string[] };

const PHT_NAV: NavEntry[] = [
  { icon: 'dashboard', label: 'Tổng quan' },
  { icon: 'menu_book', label: 'Chương trình học' },
  { icon: 'table_chart', label: 'Ma trận đề', to: '/matrices', activeFor: ['/matrices'] },
  { icon: 'assignment', label: 'Nhiệm vụ', to: '/matrix-tasks', activeFor: ['/matrix-tasks'] },
  { icon: 'fact_check', label: 'Duyệt bộ đề' },
  { icon: 'database', label: 'Ngân hàng câu hỏi' },
  { icon: 'inventory_2', label: 'Kho đề' },
];
const PHT_NAV_AFTER_EXAM_GROUP: NavEntry[] = [{ icon: 'mail', label: 'Quản lý mẫu mail' }];
const EXAM_GROUP = [
  'Danh sách kỳ thi', 'Danh sách môn thi', 'Danh sách thí sinh', 'Danh sách bộ đề thi', 'Danh sách phòng thi',
  'Danh sách ca thi', 'Xếp phòng thi', 'Danh sách giám thị', 'Phân công giám thị',
];
const TL_NAV: NavEntry[] = [
  { icon: 'menu_book', label: 'Chương trình học' },
  // Tổ trưởng xem ma trận của mình qua nhiệm vụ, nên màn ma trận vẫn thuộc mục này.
  { icon: 'assignment', label: 'Nhiệm vụ', to: '/matrix-tasks', activeFor: ['/matrix-tasks', '/matrices'] },
  { icon: 'assignment_ind', label: 'Phân công biên soạn' },
  { icon: 'database', label: 'Ngân hàng câu hỏi' },
  { icon: 'fact_check', label: 'Tạo và rà soát đề' },
  { icon: 'inventory_2', label: 'Kho đề' },
];

const COLLAPSED_KEY = 'sep-rail-collapsed';

const readCollapsed = () => {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
};

const NavItem = ({ icon, label, to, activeFor = [] }: NavEntry) => {
  const { pathname } = useLocation();
  const body = (
    <>
      <Icon name={icon} size={22} />
      <span className="sep-rail__label">{label}</span>
    </>
  );
  if (!to) {
    return (
      <span className="sep-nav sep-nav--inert" aria-disabled="true" title={`${label} (sắp có)`}>
        {body}
      </span>
    );
  }
  const active = activeFor.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  return (
    <Link
      to={to}
      className={`sep-nav${active ? ' sep-nav--active' : ''}`}
      aria-current={active ? 'page' : undefined}
      title={label}
    >
      {body}
    </Link>
  );
};

export const MatrixLayout = () => {
  const navigate = useNavigate();
  const teamLead = isTeamLead();
  // Thu gọn mặc định: 9 mục con mở sẵn làm menu PHT dài gấp đôi menu Tổ trưởng.
  const [examOpen, setExamOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(readCollapsed);

  const toggleRail = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem(COLLAPSED_KEY, next ? '1' : '0');
    } catch {
      // Trình duyệt chặn lưu trữ: chỉ mất việc nhớ lựa chọn giữa các lần mở.
    }
  };

  const logout = () => {
    storage.clearAuth();
    navigate('/login');
  };

  return (
    <div className={`sep-app sep-shell${collapsed ? ' sep-shell--collapsed' : ''}`}>
      <aside className="sep-rail" aria-label="Điều hướng chính">
        <div className="sep-brand">
          <img src="/logo-pcb.png" alt="" width={44} height={44} />
          <div className="sep-brand__name sep-rail__label">
            Tiểu học
            <br />
            Phạm Công Bình
          </div>
        </div>

        <nav className="sep-nav-list">
          {teamLead ? (
            TL_NAV.map((item) => <NavItem key={item.label} {...item} />)
          ) : (
            <>
              {PHT_NAV.map((item) => <NavItem key={item.label} {...item} />)}
              <div>
                <button
                  type="button"
                  className="sep-nav sep-nav--group"
                  aria-expanded={examOpen}
                  title="Tổ chức thi"
                  // Thu gọn thì danh sách con bị ẩn: mở rộng thanh điều hướng để bấm vào có kết quả.
                  onClick={() => {
                    if (collapsed) toggleRail();
                    setExamOpen(collapsed || !examOpen);
                  }}
                >
                  <Icon name="event" size={22} />
                  <span className="sep-rail__label">Tổ chức thi</span>
                  <span className="sep-rail__label sep-nav__chevron">
                    <Icon name={examOpen ? 'expand_less' : 'expand_more'} size={20} />
                  </span>
                </button>
                {examOpen && (
                  <div className="sep-submenu">
                    {EXAM_GROUP.map((label) => (
                      <span key={label} className="sep-subnav" aria-disabled="true">
                        {label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {PHT_NAV_AFTER_EXAM_GROUP.map((item) => <NavItem key={item.label} {...item} />)}
            </>
          )}
        </nav>

        <div className="sep-support">
          <NavItem icon="help" label="Trợ giúp" />
          <button type="button" className="sep-nav" title="Đăng xuất" onClick={logout}>
            <Icon name="logout" size={22} />
            <span className="sep-rail__label">Đăng xuất</span>
          </button>
          <button
            type="button"
            className="sep-rail__toggle"
            aria-label={collapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
            title={collapsed ? 'Mở rộng' : 'Thu gọn'}
            onClick={toggleRail}
          >
            <Icon name={collapsed ? 'chevron_right' : 'chevron_left'} size={22} />
          </button>
        </div>
      </aside>

      <main className="sep-main">
        <Outlet />
      </main>
    </div>
  );
};
