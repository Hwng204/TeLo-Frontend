import { useEffect, useState, useRef } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Icon } from '../components/pcb';
import { api } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import { formatActiveAcademicYear } from '../utils/academicYear';
import { storage } from '../utils/storage';
import { BranchSelectModal } from '../components/common/BranchSelectModal';
// Cùng khung và mẫu giao diện với AppShell để các màn quản trị trông thống nhất.
import '../styles/sep-ui.css';
import './AppShell.css';

function getUserInitials(fullName?: string): string {
  if (!fullName) return 'AD';
  return fullName.trim().split(/\s+/).slice(-2).map((w) => w[0]).join('').toUpperCase();
}

type MenuItem = {
  id: string;
  label: string;
  icon?: string;
  path?: string;
  children?: MenuItem[];
};

const menuData: MenuItem[] = [
  {
    id: 'system',
    label: 'Quản trị hệ thống',
    icon: 'settings',
    children: [
      { id: 'schools', label: 'Trường & Phân hiệu', path: '/schools' },
      { id: 'academic-year', label: 'Quản lý năm học', path: '/academic-years' },
      { id: 'email', label: 'Quản lý Email', path: '/emails' },
    ]
  },
  {
    id: 'operation',
    label: 'Vận hành trường',
    icon: 'domain',
    children: [
      { id: 'overview', label: 'Tổng quan vận hành', path: '/overview' },
      { id: 'classes', label: 'Quản lý lớp học', path: '/classes' },
      { id: 'students', label: 'Quản lý học sinh', path: '/students' },
      { id: 'teachers', label: 'Quản lý giáo viên', path: '/teachers' },
      {
        id: 'auth',
        label: 'Phân quyền',
        children: [
          { id: 'users', label: 'Người dùng', path: '/users' },
          { id: 'roles', label: 'Vai trò', path: '/roles' },
          { id: 'permissions', label: 'Phân quyền', path: '/permissions' },
          { id: 'modules', label: 'Quản lý module', path: '/modules' },
          { id: 'navbars', label: 'Quản lý navbar', path: '/navbars' },
        ]
      }
    ]
  }
];

const COLLAPSED_KEY = 'sep-rail-collapsed';

export type AdminOutletContext = {
  reloadActiveAcademicYear: () => void;
  activeAcademicYearLabel: string;
};

const readCollapsed = () => {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
};

export const AdminLayout = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [user] = useState(() => storage.getUser<{ fullName: string; role: string }>());
  const activeAcademicYear = useAsync(() => api.academicYear.current().catch(e => {
    if (e.response?.status === 404) return { data: null };
    throw e;
  }), [pathname]);
  const reloadActiveAcademicYear = activeAcademicYear.reload;
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.addEventListener('focus', reloadActiveAcademicYear);
    return () => window.removeEventListener('focus', reloadActiveAcademicYear);
  }, [reloadActiveAcademicYear]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'system': true,
    'operation': true,
    'auth': true,
  });

  const toggleRail = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem(COLLAPSED_KEY, next ? '1' : '0');
    } catch {
      // Trình duyệt có thể chặn localStorage; trạng thái thu gọn vẫn dùng được trong phiên hiện tại.
    }
  };

  const handleLogout = () => {
    storage.clearAuth();
    navigate('/login');
  };

  const toggleGroup = (id: string) => {
    if (collapsed) toggleRail();

    if (id === 'operation') {
      const selectedBranchId = localStorage.getItem('selected_branch_id');
      if (!selectedBranchId && !expandedGroups.operation) {
        setShowBranchModal(true);
        return;
      }
    }

    setExpandedGroups(prev => {
      if (id === 'system') return { ...prev, system: !prev.system, operation: false };
      if (id === 'operation') return { ...prev, operation: !prev.operation, system: false };
      return { ...prev, [id]: !prev[id] };
    });
  };

  const handleBranchSelect = (schoolId: string, schoolName: string, branchId: string, branchName: string) => {
    localStorage.setItem('selected_school_id', schoolId);
    localStorage.setItem('selected_school_name', schoolName);
    localStorage.setItem('selected_branch_id', branchId);
    localStorage.setItem('selected_branch_name', branchName);
    setShowBranchModal(false);
    setExpandedGroups(prev => ({ ...prev, operation: true, system: false }));
    navigate('/overview');
  };

  const initials = getUserInitials(user?.fullName);
  const activeAcademicYearLabel = activeAcademicYear.loading
    ? 'Đang tải năm học...'
    : activeAcademicYear.error
      ? 'Không tải được năm học'
      : formatActiveAcademicYear(activeAcademicYear.data?.data?.name);

  const renderNavGroup = (item: MenuItem, depth = 0) => {
    const isExpanded = expandedGroups[item.id];
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.id} style={{ marginBottom: depth === 0 ? '8px' : '0' }}>
        <button
          type="button"
          className={`sep-nav sep-nav--group`}
          aria-expanded={isExpanded}
          title={item.label}
          onClick={() => toggleGroup(item.id)}
          style={{ paddingLeft: depth > 0 ? '40px' : '16px', fontSize: '13.5px' }}
        >
          {item.icon && <Icon name={item.icon} size={22} />}
          <span className="sep-rail__label">{item.label}</span>
          {hasChildren && (
            <span className="sep-rail__label sep-nav__chevron">
              <Icon name={isExpanded ? 'expand_less' : 'expand_more'} size={20} />
            </span>
          )}
        </button>
        {isExpanded && hasChildren && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px' }}>
            {item.children!.map(child => {
              if (child.children) {
                return renderNavGroup(child, depth + 1);
              }
              const isActive = child.path && (pathname === child.path || pathname.startsWith(`${child.path}/`));

              if (!child.path) {
                return (
                  <span key={child.id} className="sep-subnav" aria-disabled="true">
                    {child.label}
                  </span>
                );
              }

              return (
                <Link
                  key={child.id}
                  to={child.path}
                  className={`sep-nav${isActive ? ' sep-nav--active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                  style={{
                    paddingLeft: depth === 0 ? '48px' : '64px',
                    height: '36px',
                    fontSize: '13px'
                  }}
                  title={child.label}
                >
                  {child.icon && <Icon name={child.icon} size={20} />}
                  <span className="sep-rail__label">{child.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`sep-app sep-shell${collapsed ? ' sep-shell--collapsed' : ''}`}>
      {/* Sidebar */}
      <aside className="sep-rail sep-rail--wide" aria-label="Điều hướng chính">
        <div className="sep-brand">
          <img src="/logo-pcb.png" alt="" width={44} height={44} />
          <div className="sep-brand__name sep-rail__label">
            Tiểu học
            <br />
            Phạm Công Bình
          </div>
        </div>

        <nav className="sep-nav-list">
          {menuData.map(item => renderNavGroup(item))}
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

      {/* Main Content Area */}
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
              <span className="sep-user__name">{user?.fullName || 'Nguyễn Văn A'}</span>
              <span className="sep-user__role">Quản trị viên vận hành</span>
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
          <Outlet context={{ reloadActiveAcademicYear, activeAcademicYearLabel } satisfies AdminOutletContext} />
        </div>
      </main>
      {/* Branch Select Modal */}
      {showBranchModal && (
        <BranchSelectModal 
          onClose={() => setShowBranchModal(false)}
          onSelect={handleBranchSelect}
        />
      )}
    </div>
  );
};
