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
  // Quản trị hệ thống (không yêu cầu chọn trường/phân hiệu)
  { id: 'schools', label: 'Quản lý trường', path: '/schools' },
  { id: 'academic-year', label: 'Quản lý năm học', path: '/academic-years' },
  { id: 'email', label: 'Quản lý Email', path: '/emails' },

  // Vận hành trường (yêu cầu chọn trường/phân hiệu nếu storage rỗng, lưu trong storage khi chuyển tab)
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
];

const isOperationPath = (path?: string) => {
  if (!path) return false;
  const operationPrefixes = [
    '/overview',
    '/classes',
    '/students',
    '/teachers',
    '/users',
    '/roles',
    '/modules',
    '/permissions',
    '/navbars'
  ];
  return operationPrefixes.some(p => path === p || path.startsWith(`${p}/`));
};

const isRequiresBranchPath = (path?: string) => {
  if (!path) return false;
  // Các mục vận hành trường bắt buộc phải có trường/phân hiệu
  // /users (Người dùng) không bắt buộc để có thể xem người dùng toàn hệ thống
  const strictPrefixes = [
    '/overview',
    '/classes',
    '/students',
    '/teachers',
  ];
  return strictPrefixes.some(p => path === p || path.startsWith(`${p}/`));
};

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

  const isOperationRoute = isOperationPath(pathname);

  const [user] = useState(() => storage.getUser<{ fullName: string; role: string }>());
  const activeAcademicYear = useAsync(() => api.academicYear.current().catch(e => {
    if (e.response?.status === 404) return { data: null };
    throw e;
  }), [pathname]);
  const reloadActiveAcademicYear = activeAcademicYear.reload;
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);
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

  const [selectedBranch, setSelectedBranch] = useState(storage.getSelectedBranch);

  useEffect(() => {
    const handleBranchChange = () => {
      setSelectedBranch(storage.getSelectedBranch());
    };
    window.addEventListener('branch_changed', handleBranchChange);
    return () => window.removeEventListener('branch_changed', handleBranchChange);
  }, []);

  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'auth': false, // Khi login/vào trang mục phân quyền sẽ auto đóng
  });

  // Tự động mở menu Phân quyền khi người dùng đang ở các trang con thuộc Phân quyền
  useEffect(() => {
    const isAuthRoute = ['/users', '/roles', '/modules', '/permissions', '/navbars'].some(
      p => pathname === p || pathname.startsWith(`${p}/`)
    );
    if (isAuthRoute) {
      setExpandedGroups(prev => ({ ...prev, auth: true }));
    }
  }, [pathname]);

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
    setExpandedGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleNavClick = (e: React.MouseEvent, item: MenuItem) => {
    if (!item.path) return;

    if (isRequiresBranchPath(item.path)) {
      const current = storage.getSelectedBranch();
      const hasBranchInStorage = Boolean(current.branchId || current.branchCode);

      if (!hasBranchInStorage) {
        // Chưa có trường & phân hiệu trong storage -> chặn điều hướng và yêu cầu chọn
        e.preventDefault();
        setPendingRoute(item.path);
        setShowBranchModal(true);
        return;
      }
      // Đã có dữ liệu trong storage rồi -> Link sẽ chuyển tab bình thường và tab đó theo dữ liệu trong storage
    }
  };

  const handleClearBranch = () => {
    storage.clearSelectedBranch();
    setSelectedBranch(storage.getSelectedBranch());

    // Nếu đang ở các màn vận hành bắt buộc chọn trường (overview, classes, students, teachers),
    // chuyển hướng về trang Quản lý trường:
    const strictRoutes = ['/overview', '/classes', '/students', '/teachers'];
    if (strictRoutes.some(p => pathname === p || pathname.startsWith(`${p}/`))) {
      navigate('/schools');
    }
  };

  const handleBranchSelect = (
    schoolId: string,
    schoolCode: string,
    schoolName: string,
    branchId: string,
    branchCode: string,
    branchName: string
  ) => {
    storage.setSelectedBranch({
      schoolId,
      schoolCode,
      schoolName,
      branchId,
      branchCode,
      branchName,
    });
    setSelectedBranch(storage.getSelectedBranch());
    setShowBranchModal(false);

    const destination = pendingRoute || (isOperationRoute ? pathname : '/overview');
    setPendingRoute(null);
    navigate(destination);
  };

  const initials = getUserInitials(user?.fullName);
  const activeAcademicYearLabel = activeAcademicYear.loading
    ? 'Đang tải năm học...'
    : activeAcademicYear.error
      ? 'Không tải được năm học'
      : formatActiveAcademicYear(activeAcademicYear.data?.data?.name);

  const renderNavGroup = (item: MenuItem) => {
    const isExpanded = Boolean(expandedGroups[item.id]);
    const hasChildren = Boolean(item.children && item.children.length > 0);
    const showDivider = item.id === 'overview';

    if (!hasChildren) {
      const isActive = item.path && (pathname === item.path || pathname.startsWith(`${item.path}/`));

      return (
        <div key={item.id} style={{ marginBottom: '2px' }}>
          {showDivider && (
            <div
              style={{
                height: '1px',
                backgroundColor: 'rgba(255, 255, 255, 0.18)',
                margin: '8px 16px 10px 16px'
              }}
            />
          )}
          <Link
            to={item.path!}
            onClick={(e) => handleNavClick(e, item)}
            className={`sep-nav${isActive ? ' sep-nav--active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
            title={item.label}
          >
            <span className="sep-rail__label">{item.label}</span>
          </Link>
        </div>
      );
    }

    return (
      <div key={item.id} style={{ marginBottom: '2px' }}>
        {showDivider && (
          <div
            style={{
              height: '1px',
              backgroundColor: 'rgba(255, 255, 255, 0.18)',
              margin: '8px 16px 10px 16px'
            }}
          />
        )}
        <button
          type="button"
          className={`sep-nav sep-nav--group`}
          aria-expanded={isExpanded}
          title={item.label}
          onClick={() => toggleGroup(item.id)}
          style={{ fontSize: '14.5px' }}
        >
          <span className="sep-rail__label">{item.label}</span>
          <span className="sep-rail__label sep-nav__chevron">
            <Icon name={isExpanded ? 'expand_less' : 'expand_more'} size={20} />
          </span>
        </button>

        {isExpanded && !collapsed && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px' }}>
            {item.children!.map(child => {
              const isActive = child.path && (pathname === child.path || pathname.startsWith(`${child.path}/`));

              return (
                <Link
                  key={child.id}
                  to={child.path!}
                  onClick={(e) => handleNavClick(e, child)}
                  className={`sep-nav${isActive ? ' sep-nav--active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                  style={{
                    paddingLeft: '32px',
                    height: '36px',
                    fontSize: '13.5px'
                  }}
                  title={child.label}
                >
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div aria-live="polite" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#475569', fontSize: '13px', fontWeight: 500, whiteSpace: 'nowrap' }}>
              <Icon name="calendar_month" size={18} />
              {activeAcademicYearLabel}
              {Boolean(activeAcademicYear.error) && <button type="button" onClick={reloadActiveAcademicYear}>Thử lại</button>}
            </div>

            {/* Ô chọn/đổi trường & phân hiệu: cạnh năm học, tự động ẩn khi ra ngoài Quản trị hệ thống */}
            {isOperationRoute && (
              (selectedBranch.branchCode || selectedBranch.branchName) ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '5px 12px',
                    backgroundColor: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#0369a1',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span style={{ color: '#0284c7', display: 'flex', alignItems: 'center' }}>
                    <Icon name="domain" size={18} />
                  </span>
                  <span style={{ fontWeight: 600, color: '#0c4a6e' }}>
                    {selectedBranch.schoolName ? `${selectedBranch.schoolName} - ` : ''}{selectedBranch.branchName}
                  </span>
                  {selectedBranch.branchCode && (
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      backgroundColor: '#e0f2fe',
                      color: '#0369a1',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontFamily: 'monospace'
                    }}>
                      {selectedBranch.branchCode}
                    </span>
                  )}
                  <div style={{ width: '1px', height: '14px', backgroundColor: '#bae6fd', margin: '0 2px' }} />
                  <button
                    type="button"
                    title="Chọn lại trường & phân hiệu"
                    onClick={() => {
                      setPendingRoute(null);
                      setShowBranchModal(true);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#0284c7',
                      fontSize: '12px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#e0f2fe')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <Icon name="swap_horiz" size={16} />
                    Đổi
                  </button>
                  <div style={{ width: '1px', height: '14px', backgroundColor: '#bae6fd', margin: '0 2px' }} />
                  <button
                    type="button"
                    title="Xóa trường đã chọn để xem toàn hệ thống"
                    onClick={handleClearBranch}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#ef4444',
                      fontSize: '12px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#fee2e2')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <Icon name="close" size={15} />
                    Xóa
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  title="Chọn trường & phân hiệu để lọc dữ liệu"
                  onClick={() => {
                    setPendingRoute(null);
                    setShowBranchModal(true);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    color: '#475569',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = '#f0f9ff';
                    e.currentTarget.style.borderColor = '#bae6fd';
                    e.currentTarget.style.color = '#0284c7';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = '#f1f5f9';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.color = '#475569';
                  }}
                >
                  <span style={{ color: '#0284c7', display: 'flex', alignItems: 'center' }}>
                    <Icon name="domain" size={18} />
                  </span>
                  <span>Chọn trường & phân hiệu</span>
                  <span style={{ color: '#64748b', display: 'flex', alignItems: 'center' }}>
                    <Icon name="arrow_drop_down" size={18} />
                  </span>
                </button>
              )
            )}
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
          onClose={() => {
            setShowBranchModal(false);
            setPendingRoute(null);
          }}
          onSelect={handleBranchSelect}
        />
      )}
    </div>
  );
};
