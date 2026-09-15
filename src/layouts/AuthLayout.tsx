import React from 'react';
import { Outlet } from 'react-router-dom';
import { School } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f1f5f9',
        padding: '16px',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
          padding: '32px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
          <div
            style={{
              backgroundColor: '#e0f2fe',
              padding: '12px',
              borderRadius: '50%',
              marginBottom: '12px',
            }}
          >
            <School size={32} color="#0284c7" />
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: 0 }}>TeLo School</h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>Cổng thông tin quản lý giáo dục</p>
        </div>

        <Outlet />
      </div>
    </div>
  );
};
