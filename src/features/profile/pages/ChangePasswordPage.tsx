import React, { useState } from 'react';
import { api } from '../../../services/api';
import { PageHeader } from '../../../components/common/PageHeader';
import { displayToast } from '../../../utils/toast';
import { isDirectoryAdmin, isStudent } from '../../../utils/jwt';
import { validateChangePassword } from '../../../utils/validators';

export const ChangePasswordPage: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validation = validateChangePassword({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (!validation.isValid) {
      setError(validation.firstError || 'Vui lòng kiểm tra lại thông tin mật khẩu.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.auth.changePassword({ currentPassword, newPassword });
      displayToast('success', 'Thành công', res.message || 'Đổi mật khẩu thành công.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Không thể đổi mật khẩu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const hasLayoutHeader = isDirectoryAdmin() || isStudent();

  return (
    <>
      <PageHeader title="Đổi mật khẩu" inline={hasLayoutHeader} />
      <div style={{ padding: hasLayoutHeader ? '0' : '24px 32px' }}>
        <div style={{ 
          backgroundColor: 'white', 
        padding: '32px', 
        borderRadius: '12px', 
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        maxWidth: '480px'
      }}>
        {error && (
          <div style={{ 
            backgroundColor: '#fef2f2', 
            color: '#ef4444', 
            padding: '12px 16px', 
            borderRadius: '8px', 
            marginBottom: '24px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: 500, color: '#334155' }}>Mật khẩu hiện tại <span style={{ color: '#ef4444' }}>*</span></label>
            <input 
              type="password"
              required
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: 500, color: '#334155' }}>Mật khẩu mới <span style={{ color: '#ef4444' }}>*</span></label>
            <input 
              type="password"
              required
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: 500, color: '#334155' }}>Xác nhận mật khẩu mới <span style={{ color: '#ef4444' }}>*</span></label>
            <input 
              type="password"
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{
              marginTop: '12px',
              padding: '12px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Đang xử lý...' : 'Lưu thay đổi'}
          </button>
        </form>
      </div>
    </div>
    </>
  );
};
