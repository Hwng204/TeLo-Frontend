import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Icon } from '../components/pcb';
import { storage } from '../utils/storage';
import '../layouts/MatrixLayout.css'; // Reusing MatrixLayout's CSS classes for a unified look

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
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(null);

  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'system': true,
    'operation': true,
    'auth': true,
  });

  useEffect(() => {
    const u = storage.getUser() as any;
    if (u) setUser(u);
  }, []);

  const toggleRail = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem(COLLAPSED_KEY, next ? '1' : '0');
    } catch { }
  };

  const handleLogout = () => {
    storage.clearAuth();
    navigate('/login');
  };

  const toggleGroup = (id: string) => {
    if (collapsed) toggleRail();
    setExpandedGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const initials = getUserInitials(user?.fullName);

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
      <aside className="sep-rail" aria-label="Điều hướng chính" style={{ width: collapsed ? undefined : '240px' }}>
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
          <Link to="/help" className="sep-nav" title="Trợ giúp">
            <Icon name="help" size={22} />
            <span className="sep-rail__label">Trợ giúp</span>
          </Link>
          <button type="button" className="sep-nav" title="Đăng xuất" onClick={handleLogout}>
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

      {/* Main Content Area */}
      <main className="sep-main" style={{ backgroundColor: '#f8fafc' }}>
        <style>{`
          /* Override active menu colors to match the gray background of the page */
          .sep-nav--active { background-color: #f8fafc !important; }
          .sep-nav--active::before { background: radial-gradient(circle at 0 0, transparent 19.5px, #f8fafc 20px) !important; }
          .sep-nav--active::after { background: radial-gradient(circle at 0 100%, transparent 19.5px, #f8fafc 20px) !important; }
        `}</style>

        <header className="sep-topbar" style={{ justifyContent: 'space-between', backgroundColor: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '6px', color: '#475569', fontSize: '13px', fontWeight: 500 }}>
            <Icon name="calendar_month" size={18} />
            Năm học 2026 - 2027
          </div>

          <div className="sep-user">
            <div className="sep-user__avatar">
              {initials}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="sep-user__name">{user?.fullName || 'Nguyễn Văn A'}</span>
              <span className="sep-user__role">Quản trị viên vận hành</span>
            </div>
          </div>
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};
