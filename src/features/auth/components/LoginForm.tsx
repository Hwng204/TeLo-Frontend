import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { isAxiosError } from 'axios';
import { storage } from '../../../utils/storage';
import { displayToast } from '../../../utils/toast';
import { api } from '../../../services/api';
import { isPht, isTeamLead, parseJwt } from '../../../utils/jwt';

export const LoginForm: React.FC<{ onForgotPassword?: () => void }> = ({ onForgotPassword }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      displayToast('error', 'Lỗi', 'Vui lòng nhập đầy đủ tài khoản và mật khẩu.');
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.auth.login({ username: username.trim(), password });
      
      if (response.accessToken) {
        const decodedToken = parseJwt(response.accessToken);
        
        // .NET JWT encodes role as full URI
        const DOTNET_ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
        const DOTNET_NAME_CLAIM = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name';
        const DOTNET_NAMEID_CLAIM = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier';

        const role = decodedToken?.[DOTNET_ROLE_CLAIM] || decodedToken?.role || 'Unknown';
        const fullName = decodedToken?.[DOTNET_NAME_CLAIM] || decodedToken?.unique_name || decodedToken?.name || username;
        const userId = decodedToken?.[DOTNET_NAMEID_CLAIM] || decodedToken?.nameid || decodedToken?.sub || 'unknown';

        storage.setToken(response.accessToken);
        storage.setUser({
          id: userId,
          username: fullName,
          role,
          email: '',
          fullName,
        });
        displayToast('success', 'Thành công', 'Đăng nhập thành công!');
        navigate(isTeamLead() ? '/matrix-tasks' : isPht() ? '/matrices' : '/schools');
      } else {
        throw new Error('Invalid response');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const errMsg = isAxiosError(err) && err.response?.status === 401 
        ? 'Sai tên đăng nhập hoặc mật khẩu.' 
        : err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại.';
      displayToast('error', 'Lỗi đăng nhập', errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '420px', backgroundColor: 'white', padding: '48px 40px', borderRadius: '24px', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)', boxSizing: 'border-box', colorScheme: 'light' }}>
      <h2 style={{ textAlign: 'center', color: '#2563eb', fontSize: '24px', fontWeight: 600, marginBottom: '36px', marginTop: 0 }}>
        Đăng nhập tài khoản
      </h2>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#475569', marginBottom: '8px', textAlign: 'left' }}>
            Mã đăng nhập
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Nhập tài khoản"
            style={{
              width: '100%',
              padding: '14px 16px',
              borderRadius: '8px',
              border: '1px solid #3b82f6',
              backgroundColor: '#ffffff',
              fontSize: '15px',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s',
              color: '#000000',
            }}
            onFocus={(e) => e.target.style.borderColor = '#2563eb'}
            onBlur={(e) => e.target.style.borderColor = '#3b82f6'}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#475569', marginBottom: '8px', textAlign: 'left' }}>
            Mật khẩu
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
              style={{
                width: '100%',
                padding: '14px 44px 14px 16px', // Right padding for icon
                borderRadius: '8px',
                border: '1px solid #3b82f6',
                backgroundColor: '#ffffff',
                fontSize: '15px',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
                color: '#000000',
              }}
              onFocus={(e) => e.target.style.borderColor = '#2563eb'}
              onBlur={(e) => e.target.style.borderColor = '#3b82f6'}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                padding: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748b',
              }}
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'left', marginTop: '-8px' }}>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (onForgotPassword) onForgotPassword();
            }}
            style={{ color: '#3b82f6', fontSize: '13px', textDecoration: 'none', fontWeight: 500 }}
          >
            Bạn quên mật khẩu?
          </a>
        </div>

        <Button type="submit" isLoading={isLoading} style={{ marginTop: '4px', width: '100%', padding: '14px', fontSize: '15px', borderRadius: '8px', backgroundColor: '#2563eb' }}>
          Đăng nhập
        </Button>
      </form>
    </div>
  );
};
