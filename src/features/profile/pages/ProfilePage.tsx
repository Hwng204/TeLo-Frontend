import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { PageHeader } from '../../../components/common/PageHeader';

export const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<{ username: string; fullName: string; email: string; status: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.auth.profile()
      .then(res => setProfile(res as any))
      .catch(err => setError(err?.response?.data?.message || err?.message || 'Không thể tải thông tin cá nhân'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: '24px' }}>
      <PageHeader 
        title="Hồ sơ cá nhân" 
        inline={true}
      />

      <div style={{ 
        marginTop: '24px', 
        backgroundColor: 'white', 
        padding: '32px', 
        borderRadius: '12px', 
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        maxWidth: '600px'
      }}>
        {loading && <div>Đang tải dữ liệu...</div>}
        {error && <div style={{ color: '#ef4444', marginBottom: '16px' }}>{error}</div>}
        
        {profile && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '16px' }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: '#2563eb',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                fontWeight: 'bold'
              }}>
                {profile.fullName?.trim().split(/\s+/).slice(-2).map((w: string) => w[0]).join('').toUpperCase() || 'AD'}
              </div>
              <div>
                <h2 style={{ margin: '0 0 4px 0', fontSize: '24px', color: '#1e293b' }}>{profile.fullName}</h2>
                <span style={{ 
                  display: 'inline-block',
                  padding: '4px 12px', 
                  backgroundColor: profile.status === 'ACTIVE' ? '#dcfce7' : '#f1f5f9', 
                  color: profile.status === 'ACTIVE' ? '#166534' : '#475569',
                  borderRadius: '100px',
                  fontSize: '13px',
                  fontWeight: 500
                }}>
                  {profile.status === 'ACTIVE' ? 'Đang hoạt động' : profile.status}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
              <div style={{ color: '#64748b', fontSize: '14px' }}>Tên đăng nhập</div>
              <div style={{ color: '#0f172a', fontSize: '14px', fontWeight: 500 }}>{profile.username}</div>
              
              <div style={{ color: '#64748b', fontSize: '14px' }}>Họ và tên</div>
              <div style={{ color: '#0f172a', fontSize: '14px', fontWeight: 500 }}>{profile.fullName}</div>
              
              <div style={{ color: '#64748b', fontSize: '14px' }}>Email</div>
              <div style={{ color: '#0f172a', fontSize: '14px', fontWeight: 500 }}>{profile.email || 'Chưa cập nhật'}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
