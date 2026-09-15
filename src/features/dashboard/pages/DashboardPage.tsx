import React from 'react';
import { Users, GraduationCap, BookOpen, Award } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const stats = [
    { label: 'Tổng số học sinh', value: '1,245', icon: Users, color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Giáo viên', value: '78', icon: GraduationCap, color: '#10b981', bg: '#ecfdf5' },
    { label: 'Lớp học', value: '36', icon: BookOpen, color: '#f59e0b', bg: '#fffbeb' },
    { label: 'Khen thưởng', value: '128', icon: Award, color: '#8b5cf6', bg: '#f5f3ff' },
  ];

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Bảng điều khiển</h1>
        <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
          Chào mừng quay trở lại với Hệ thống quản lý trường học TeLo.
        </p>
      </div>

      {/* Grid Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
          marginBottom: '32px',
        }}
      >
        {stats.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '10px',
                  backgroundColor: item.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon size={24} color={item.color} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>{item.label}</p>
                <h3 style={{ margin: '4px 0 0', fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>
                  {item.value}
                </h3>
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #e2e8f0',
        }}
      >
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '12px' }}>
          Thông báo mới nhất
        </h2>
        <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
          Hệ thống đang hoạt động bình thường. Các module học sinh, giáo viên, điểm danh đã sẵn sàng kết nối API backend.
        </p>
      </div>
    </div>
  );
};
