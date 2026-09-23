import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon, Lock } from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { isAxiosError } from 'axios';
import { storage } from '../../../utils/storage';
import { isPht, isTeamLead } from '../../../utils/jwt';
import { api } from '../../../services/api';

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
      const { accessToken } = await api.auth.login({ username: username.trim(), password });
      storage.setToken(accessToken);
      // Tài khoản có vai trò ma trận vào thẳng màn của mình; còn lại về bảng điều khiển.
      navigate(isTeamLead() ? '/matrix-tasks' : isPht() ? '/matrices' : '/dashboard');
    } catch (err) {
      setError(
        isAxiosError(err) && err.response?.status === 401
          ? 'Sai tên đăng nhập hoặc mật khẩu.'
          : 'Đăng nhập thất bại. Vui lòng thử lại.',
      );
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
