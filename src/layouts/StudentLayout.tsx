import { useState, useRef, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Icon } from '../components/pcb';
import { getUsername, roleLabel } from '../utils/jwt';
import { api } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import { formatActiveAcademicYear } from '../utils/academicYear';
import { storage } from '../utils/storage';
import '../styles/sep-ui.css';
import './AppShell.css'; // Reuse AppShell styling

type NavEntry = { icon: string; label: string; to?: string; activeFor?: string[] };

const STUDENT_NAV: NavEntry[] = [
  { icon: 'dashboard', label: 'Tổng quan', to: '/student-dashboard', activeFor: ['/student-dashboard'] },
  { icon: 'school', label: 'Kỳ thi', to: '/student-exams', activeFor: ['/student-exams'] },
  { icon: 'emoji_events', label: 'Kết quả', to: '/student-results', activeFor: ['/student-results'] },
  { icon: 'menu_book', label: 'Luyện tập', to: '/student-practice', activeFor: ['/student-practice'] },
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

export const StudentLayout = () => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  
  // Use the same academic year fetching logic as AdminLayout
  const activeAcademicYear = useAsync(() => api.academicYear.current().catch(e => {
    if (e.response?.status === 404) return { data: null };
    throw e;
  }), []);
  const reloadActiveAcademicYear = activeAcademicYear.reload;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    storage.clearAuth();
    navigate('/login');
  };

  const toggleRail = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem(COLLAPSED_KEY, next ? '1' : '0');
    } catch {
      // Ignored
    }
  };

  const username = getUsername();
  const role = roleLabel();
  const initials = (username || role || '?').charAt(0).toUpperCase();

  const activeAcademicYearLabel = activeAcademicYear.loading
    ? 'Đang tải năm học...'
    : activeAcademicYear.error
      ? 'Không tải được năm học'
      : formatActiveAcademicYear(activeAcademicYear.data?.data?.name);

  return (
    <div className={`sep-app sep-shell${collapsed ? ' sep-shell--collapsed' : ''}`}>
      <aside className="sep-rail" aria-label="Điều hướng chính học sinh">
        <div className="sep-brand">
          <img src="/logo-pcb.png" alt="" width={44} height={44} />
          <div className="sep-brand__name sep-rail__label">
            Tiểu học
            <br />
            Phạm Công Bình
          </div>
        </div>

        <nav className="sep-nav-list">
          {STUDENT_NAV.map((item) => <NavItem key={item.label} {...item} />)}
        </nav>

        <div className="sep-support">
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

      <main className="sep-main" style={{ backgroundColor: '#f8fafc' }}>
        <style>{`
          /* Override active menu colors to match the gray background of the page */
          .sep-nav--active { background-color: #f8fafc !important; }
          .sep-nav--active::before { background: radial-gradient(circle at 0 0, transparent 19.5px, #f8fafc 20px) !important; }
          .sep-nav--active::after { background: radial-gradient(circle at 0 100%, transparent 19.5px, #f8fafc 20px) !important; }
        `}</style>

        <header className="sep-topbar" style={{ justifyContent: 'space-between', backgroundColor: '#ffffff' }}>
          <div aria-live="polite" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '6px', color: '#475569', fontSize: '13px', fontWeight: 500, whiteSpace: 'nowrap' }}>
            <Icon name="calendar_month" size={18} />
            {activeAcademicYearLabel}
            {Boolean(activeAcademicYear.error) && <button type="button" onClick={reloadActiveAcademicYear}>Thử lại</button>}
          </div>

          <div className="sep-user" ref={userMenuRef} style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setShowUserMenu(!showUserMenu)}>
            <div className="sep-user__avatar">
              {initials}
            </div>
            <div className="sep-user__text" style={{ paddingRight: '8px' }}>
              <span className="sep-user__name">{username || role}</span>
              <span className="sep-user__role">{role || 'Học sinh'}</span>
            </div>
            <span style={{ color: '#64748b', display: 'flex' }}><Icon name="expand_more" size={20} /></span>

            {showUserMenu && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '8px',
                width: '200px',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                border: '1px solid #e2e8f0',
                zIndex: 50,
                padding: '4px'
              }}>
                <Link to="/profile" className="sep-menu-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', fontSize: '14px', color: '#334155', textDecoration: 'none', borderRadius: '4px' }} onClick={() => setShowUserMenu(false)}>
                  <span style={{ color: '#64748b', display: 'flex' }}><Icon name="person" size={18} /></span>
                  Hồ sơ cá nhân
                </Link>
                <Link to="/change-password" className="sep-menu-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', fontSize: '14px', color: '#334155', textDecoration: 'none', borderRadius: '4px' }} onClick={() => setShowUserMenu(false)}>
                  <span style={{ color: '#64748b', display: 'flex' }}><Icon name="lock" size={18} /></span>
                  Đổi mật khẩu
                </Link>
                <div style={{ height: '1px', backgroundColor: '#e2e8f0', margin: '4px 0' }}></div>
                <button 
                  type="button"
                  className="sep-menu-item"
                  onClick={handleLogout}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', fontSize: '14px', color: '#ef4444', textDecoration: 'none', borderRadius: '4px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                >
                  <Icon name="logout" size={18} />
                  Đăng xuất
                </button>
                <style>{`
                  .sep-menu-item:hover { background-color: #f1f5f9 !important; }
                `}</style>
              </div>
            )}
          </div>
        </header>

        <div className="sep-admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
