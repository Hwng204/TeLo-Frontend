import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { PcbIconButton, Icon } from '../pcb';
import { getUsername, roleLabel } from '../../utils/jwt';
import { storage } from '../../utils/storage';

type Props = {
  title: string;
  /** Có thì hiện nút quay lại bên trái tiêu đề. */
  onBack?: () => void;
  /** Hiện ngay sau tiêu đề, ví dụ nhãn trạng thái của ma trận. */
  badge?: ReactNode;
  /**
   * Layout đã có sẵn thanh trên (AdminLayout: năm học + người dùng): chỉ vẽ dòng tiêu đề trong trang,
   * không vẽ thêm một thanh trên thứ hai.
   */
  inline?: boolean;
};

/** Thanh trên cùng của mọi màn ma trận: tên màn bên trái, người đang đăng nhập bên phải. */
export const PageHeader = ({ title, onBack, badge, inline }: Props) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    storage.clearAuth();
    navigate('/login');
  };

  if (inline) {
    return (
      <div className="sep-pagehead">
        {onBack && <PcbIconButton icon="arrow_back" label="Quay lại" onClick={onBack} />}
        <h1 className="sep-topbar__title">
          <span>{title}</span>
          {badge}
        </h1>
      </div>
    );
  }

  const username = getUsername();
  const role = roleLabel();

  return (
    <header className="sep-topbar">
      {onBack && <PcbIconButton icon="arrow_back" label="Quay lại" onClick={onBack} />}
      <h1 className="sep-topbar__title" style={{ flex: 1 }}>
        <span>{title}</span>
        {badge}
      </h1>
      
      <div className="sep-user" ref={userMenuRef} style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setShowUserMenu(!showUserMenu)}>
        <span className="sep-user__avatar" aria-hidden="true">
          {(username || role || '?').charAt(0).toUpperCase()}
        </span>
        <div className="sep-user__text" style={{ paddingRight: '8px' }}>
          <div className="sep-user__name">{username || role}</div>
          {username && role && <div className="sep-user__role">{role}</div>}
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
  );
};
