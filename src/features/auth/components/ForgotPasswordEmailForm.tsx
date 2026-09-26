import React, { useState } from 'react';
import { Mail, ArrowLeft } from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { displayToast } from '../../../utils/toast';

interface ForgotPasswordEmailFormProps {
  onSuccess: (email: string) => void;
  onBack: () => void;
}

export const ForgotPasswordEmailForm: React.FC<ForgotPasswordEmailFormProps> = ({ onSuccess, onBack }) => {
  const [email, setEmail] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      displayToast('error', 'Lỗi', 'Vui lòng nhập địa chỉ email.');
      return;
    }

    try {
      setIsLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      onSuccess(email);
    } catch {
      displayToast('error', 'Lỗi', 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '420px', backgroundColor: 'white', padding: '48px 40px', borderRadius: '24px', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)', boxSizing: 'border-box', colorScheme: 'light' }}>
      <h2 style={{ color: '#2563eb', fontSize: '20px', fontWeight: 600, marginBottom: '8px', marginTop: 0 }}>
        Quên mật khẩu
      </h2>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#3b82f6', marginBottom: '8px', textAlign: 'left' }}>
            Email
          </label>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
              <Mail size={18} color="#2563eb" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Nhập địa chỉ email"
              style={{
                width: '100%',
                padding: '14px 16px 14px 44px',
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
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
          <Button type="submit" isLoading={isLoading} style={{ width: '100%', padding: '14px', fontSize: '15px', borderRadius: '8px', backgroundColor: '#3b82f6' }}>
            Gửi mã xác nhận
          </Button>

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
        </div>
      </form>
    </div>
  );
};
