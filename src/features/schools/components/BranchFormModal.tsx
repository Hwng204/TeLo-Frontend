import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { CreateSchoolBranchRequest, SchoolBranchSummary } from '../../../types';

interface BranchFormModalProps {
  mode: 'create' | 'edit';
  branch?: SchoolBranchSummary;
  nextCode?: string;
  onClose: () => void;
  onSubmit: (data: CreateSchoolBranchRequest) => Promise<void>;
}

export const BranchFormModal: React.FC<BranchFormModalProps> = ({ mode, branch, nextCode, onClose, onSubmit }) => {
  const [form, setForm] = useState<CreateSchoolBranchRequest>({
    name: branch?.name ?? '',
    address: branch?.address ?? '',
    status: branch?.status ?? 'ACTIVE',
  });
  const [isLoading, setIsLoading] = useState(false);
  const isEdit = mode === 'edit';

  const set = (key: keyof CreateSchoolBranchRequest) => (val: string) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await onSubmit({
        ...form,
        code: isEdit ? branch?.code : (nextCode || ''),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.4)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      padding: '20px',
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '550px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '90vh',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 24px',
          borderBottom: '1px solid #f1f5f9',
        }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
            {isEdit ? 'Chỉnh sửa cơ sở' : 'Thêm cơ sở mới'}
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="custom-scrollbar" style={{ padding: '24px', overflowY: 'auto' }}>
          <div id="branch-form" style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#334155', textAlign: 'left' }}>Tên cơ sở <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => set('name')(e.target.value)}
                placeholder="VD: Tiểu học Phạm Công Bình"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', boxSizing: 'border-box', backgroundColor: '#ffffff', color: '#1e293b' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#334155', textAlign: 'left' }}>Mã cơ sở</label>
              <input
                type="text"
                disabled
                value={isEdit ? branch?.code : (nextCode || 'Hệ thống tự động sinh')}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', boxSizing: 'border-box', backgroundColor: '#f8fafc', color: '#94a3b8', fontStyle: isEdit ? 'normal' : 'italic' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#334155', textAlign: 'left' }}>Địa chỉ</label>
              <input
                type="text"
                value={form.address ?? ''}
                onChange={(e) => set('address')(e.target.value)}
                placeholder="VD: Số 45 phố Nguyễn Khuyến, P. Văn Miếu, Q. Đống Đa"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', boxSizing: 'border-box', backgroundColor: '#ffffff', color: '#1e293b' }}
              />
            </div>

            {isEdit && (
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#334155', textAlign: 'left' }}>Trạng thái</label>
                <select
                  value={form.status ?? 'ACTIVE'}
                  onChange={(e) => set('status')(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', boxSizing: 'border-box', backgroundColor: '#ffffff', color: '#1e293b' }}
                >
                  <option value="ACTIVE">Đang hoạt động</option>
                  <option value="INACTIVE">Ngừng hoạt động</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          padding: '20px 24px',
          borderTop: '1px solid #f1f5f9',
          backgroundColor: '#f8fafc',
          borderRadius: '0 0 16px 16px',
        }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#475569',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            style={{
              padding: '10px 24px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? 'Đang xử lý...' : isEdit ? 'Lưu thay đổi' : 'Tạo mới'}
          </button>
        </div>
      </div>
    </div>
  );
};
