import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../../../components/pcb';
import { storage } from '../../../utils/storage';
import { api } from '../../../services/api';
import { useAsync } from '../../../hooks/useAsync';
import { BranchSelectModal } from '../../../components/common/BranchSelectModal';

export const OverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(storage.getSelectedBranch);
  const [showModal, setShowModal] = useState(false);

  const schoolId = selected.schoolId ? Number(selected.schoolId) : undefined;
  const branchId = selected.branchId ? Number(selected.branchId) : undefined;

  // Load classes count for this branch
  const classesAsync = useAsync(
    async () => (schoolId && branchId ? api.directory.classes({ schoolBranchId: branchId, pageSize: 1 }, schoolId) : null),
    [schoolId, branchId]
  );

  // Load students count for this branch
  const studentsAsync = useAsync(
    async () => (schoolId && branchId ? api.directory.students({ schoolBranchId: branchId, pageSize: 1 }, schoolId) : null),
    [schoolId, branchId]
  );

  // Load teachers count for this branch
  const teachersAsync = useAsync(
    async () => (schoolId && branchId ? api.directory.teachers(schoolId, branchId) : null),
    [schoolId, branchId]
  );

  const handleBranchSelect = (
    sId: string,
    sCode: string,
    sName: string,
    bId: string,
    bCode: string,
    bName: string
  ) => {
    storage.setSelectedBranch({
      schoolId: sId,
      schoolCode: sCode,
      schoolName: sName,
      branchId: bId,
      branchCode: bCode,
      branchName: bName,
    });
    setSelected(storage.getSelectedBranch());
    setShowModal(false);
  };

  if (!selected.branchId) {
    return (
      <div style={{ padding: '32px 40px', maxWidth: '800px', margin: '40px auto', textAlign: 'center' }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          padding: '48px 32px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            backgroundColor: '#eff6ff',
            color: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px'
          }}>
            <Icon name="domain" size={36} />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 10px' }}>
            Chưa chọn phân hiệu để vận hành
          </h2>
          <p style={{ color: '#64748b', fontSize: '15px', maxWidth: '460px', margin: '0 auto 24px', lineHeight: 1.5 }}>
            Vui lòng chọn trường và phân hiệu cụ thể để hệ thống tập trung dữ liệu quản lý cho cơ sở đó.
          </p>
          <button
            onClick={() => setShowModal(true)}
            style={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '12px 24px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
            }}
          >
            <Icon name="search" size={20} />
            Chọn trường & phân hiệu ngay
          </button>
        </div>

        {showModal && (
          <BranchSelectModal
            onClose={() => setShowModal(false)}
            onSelect={handleBranchSelect}
          />
        )}
      </div>
    );
  }

  const classCount = classesAsync.data?.totalCount ?? 0;
  const studentCount = studentsAsync.data?.totalCount ?? 0;
  const teacherCount = teachersAsync.data?.totalCount ?? teachersAsync.data?.items?.length ?? 0;

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
        <span>Vận hành trường</span>
        <Icon name="chevron_right" size={16} />
        <span style={{ color: '#2563eb', fontWeight: 600 }}>Tổng quan vận hành</span>
      </div>

      {/* Header Banner */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '24px 28px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        border: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            backgroundColor: '#eff6ff',
            color: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Icon name="domain" size={32} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
                {selected.branchName}
              </h1>
              <span style={{
                backgroundColor: '#ecfdf5',
                color: '#059669',
                fontSize: '12px',
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: '999px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#059669' }} />
                Đang hoạt động
              </span>
            </div>
            <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span>Trực thuộc: <strong>{selected.schoolName}</strong></span>
              {selected.schoolCode && (
                <>
                  <span>•</span>
                  <span>Mã trường: <strong style={{ fontFamily: 'monospace' }}>{selected.schoolCode}</strong></span>
                </>
              )}
              {selected.branchCode && (
                <>
                  <span>•</span>
                  <span>Mã phân hiệu: <strong style={{ fontFamily: 'monospace' }}>{selected.branchCode}</strong></span>
                </>
              )}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => setShowModal(true)}
            style={{
              backgroundColor: '#f8fafc',
              color: '#334155',
              border: '1px solid #cbd5e1',
              borderRadius: '10px',
              padding: '10px 18px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s'
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#f8fafc')}
          >
            <Icon name="swap_horiz" size={18} />
            Đổi phân hiệu khác
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '20px',
        marginBottom: '28px'
      }}>
        {/* Classes Card */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '22px 24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
          display: 'flex',
          alignItems: 'center',
          gap: '18px'
        }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '12px',
            backgroundColor: '#e0f2fe',
            color: '#0284c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Icon name="school" size={28} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>
              Lớp học tại cơ sở
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>
                {classesAsync.loading ? '...' : classCount}
              </span>
              <span style={{ fontSize: '13px', color: '#64748b' }}>lớp</span>
            </div>
          </div>
        </div>

        {/* Students Card */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '22px 24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
          display: 'flex',
          alignItems: 'center',
          gap: '18px'
        }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '12px',
            backgroundColor: '#eff6ff',
            color: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Icon name="groups" size={28} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>
              Học sinh phân hiệu
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>
                {studentsAsync.loading ? '...' : studentCount}
              </span>
              <span style={{ fontSize: '13px', color: '#64748b' }}>học sinh</span>
            </div>
          </div>
        </div>

        {/* Teachers Card */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '22px 24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
          display: 'flex',
          alignItems: 'center',
          gap: '18px'
        }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '12px',
            backgroundColor: '#ecfdf5',
            color: '#059669',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Icon name="person" size={28} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>
              Cán bộ & Giáo viên
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>
                {teachersAsync.loading ? '...' : teacherCount}
              </span>
              <span style={{ fontSize: '13px', color: '#64748b' }}>nhân sự</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>
        Các phân hệ quản lý của phân hiệu
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '18px'
      }}>
        {/* Classes item */}
        <div
          onClick={() => navigate('/classes')}
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            padding: '22px',
            border: '1px solid #e2e8f0',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#3b82f6';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 10px 20px -5px rgba(59, 130, 246, 0.15)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = '#e2e8f0';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.02)';
          }}
        >
          <div>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: '#e0f2fe',
              color: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '14px'
            }}>
              <Icon name="school" size={24} />
            </div>
            <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>
              Quản lý lớp học
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
              Danh sách lớp, thông tin giáo viên chủ nhiệm và phòng học của phân hiệu {selected.branchName}.
            </p>
          </div>
          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#2563eb', fontWeight: 600 }}>
            <span>Đến trang lớp học</span>
            <Icon name="arrow_forward" size={16} />
          </div>
        </div>

        {/* Students item */}
        <div
          onClick={() => navigate('/students')}
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            padding: '22px',
            border: '1px solid #e2e8f0',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#3b82f6';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 10px 20px -5px rgba(59, 130, 246, 0.15)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = '#e2e8f0';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.02)';
          }}
        >
          <div>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '14px'
            }}>
              <Icon name="groups" size={24} />
            </div>
            <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>
              Quản lý học sinh
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
              Hồ sơ học sinh, chuyển lớp, theo dõi lịch sử điểm thi và trạng thái học tập.
            </p>
          </div>
          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#2563eb', fontWeight: 600 }}>
            <span>Đến trang học sinh</span>
            <Icon name="arrow_forward" size={16} />
          </div>
        </div>

        {/* Teachers item */}
        <div
          onClick={() => navigate('/teachers')}
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            padding: '22px',
            border: '1px solid #e2e8f0',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#3b82f6';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 10px 20px -5px rgba(59, 130, 246, 0.15)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = '#e2e8f0';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.02)';
          }}
        >
          <div>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: '#ecfdf5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '14px'
            }}>
              <Icon name="person" size={24} />
            </div>
            <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>
              Quản lý giáo viên
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
              Đội ngũ cán bộ, giáo viên giảng dạy và phân công chủ nhiệm tại cơ sở.
            </p>
          </div>
          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#2563eb', fontWeight: 600 }}>
            <span>Đến trang giáo viên</span>
            <Icon name="arrow_forward" size={16} />
          </div>
        </div>

        {/* Identity & Users item */}
        <div
          onClick={() => navigate('/users')}
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            padding: '22px',
            border: '1px solid #e2e8f0',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#3b82f6';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 10px 20px -5px rgba(59, 130, 246, 0.15)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = '#e2e8f0';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.02)';
          }}
        >
          <div>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: '#fef3c7',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '14px'
            }}>
              <Icon name="settings" size={24} />
            </div>
            <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>
              Người dùng & Phân quyền
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
              Quản lý tài khoản, gán vai trò và phân quyền hoạt động trong phân hiệu.
            </p>
          </div>
          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#2563eb', fontWeight: 600 }}>
            <span>Đến trang người dùng</span>
            <Icon name="arrow_forward" size={16} />
          </div>
        </div>
      </div>

      {showModal && (
        <BranchSelectModal
          onClose={() => setShowModal(false)}
          onSelect={handleBranchSelect}
        />
      )}
    </div>
  );
};
