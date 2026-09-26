import React, { useState } from 'react';
import { Button } from '../../../components/common/Button';
import { ArrowLeft } from 'lucide-react';
import { displayToast } from '../../../utils/toast';

interface ResetPasswordFormProps {
  onSuccess: () => void;
  onBack?: () => void;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ onSuccess, onBack }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      displayToast('error', 'Lỗi', 'Vui lòng nhập đầy đủ mật khẩu mới.');
      return;
    }

    if (password !== confirmPassword) {
      displayToast('error', 'Lỗi', 'Mật khẩu xác nhận không khớp.');
      return;
    }

    try {
      setIsLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      onSuccess();
    } catch {
      displayToast('error', 'Lỗi', 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '420px', backgroundColor: 'white', padding: '48px 40px', borderRadius: '24px', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)', boxSizing: 'border-box', colorScheme: 'light' }}>
      <h2 style={{ color: '#2563eb', fontSize: '20px', fontWeight: 600, marginBottom: '8px', marginTop: 0 }}>
        Đặt lại mật khẩu
      </h2>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#475569', marginBottom: '8px', textAlign: 'left' }}>
            Mật khẩu mới
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nhập mật khẩu mới"
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
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#475569', marginBottom: '8px', textAlign: 'left' }}>
            Xác nhận mật khẩu
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Nhập lại mật khẩu mới"
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
          <Button type="submit" isLoading={isLoading} style={{ width: '100%', padding: '14px', fontSize: '15px', borderRadius: '8px', backgroundColor: '#3b82f6' }}>
            Cập nhật mật khẩu
          </Button>

          {onBack && (
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onBack();
              }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#3b82f6', fontSize: '14px', textDecoration: 'none', fontWeight: 500 }}
            >
              <ArrowLeft size={16} /> Quay lại đăng nhập
            </a>
          )}
        </div>
      </form>
    </div>
  );
};
