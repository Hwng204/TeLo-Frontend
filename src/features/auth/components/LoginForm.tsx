import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon, Lock } from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { storage } from '../../../utils/storage';

export const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError('Vui lòng nhập đầy đủ tài khoản và mật khẩu.');
      return;
    }

    try {
      setIsLoading(true);
      // Giả lập lưu token mẫu để vào dashboard
      storage.setToken('sample_jwt_token');
      storage.setUser({
        id: '1',
        username,
        fullName: 'Quản trị viên',
        email: 'admin@telo.edu.vn',
        role: 'Admin',
      });
      navigate('/dashboard');
    } catch {
      setError('Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {error && (
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            borderRadius: '6px',
            fontSize: '13px',
          }}
        >
          {error}
        </div>
      )}

      <div>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '6px' }}>
          Tên đăng nhập
        </label>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <UserIcon size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px' }} />
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="admin"
            style={{
              width: '100%',
              padding: '10px 12px 10px 38px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '6px' }}>
          Mật khẩu
        </label>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Lock size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px' }} />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            style={{
              width: '100%',
              padding: '10px 12px 10px 38px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      <Button type="submit" isLoading={isLoading} style={{ marginTop: '8px', width: '100%' }}>
        Đăng nhập
      </Button>
    </form>
  );
};
