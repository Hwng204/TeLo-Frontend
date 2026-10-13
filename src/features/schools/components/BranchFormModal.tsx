import React, { useState } from 'react';
import { X, Upload, Home } from 'lucide-react';
import type { CreateSchoolBranchRequest, SchoolBranchSummary } from '../../../types';
import { validateCreateBranch, validateAvatarFile } from '../../../utils/validators';
import { uploadToCloudinary } from '../../../utils/cloudinary';
import { displayToast } from '../../../utils/toast';

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
    code: branch?.code ?? (nextCode || ''),
    address: branch?.address ?? '',
    logo: branch?.logo ?? '',
    status: branch?.status ?? 'ACTIVE',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof CreateSchoolBranchRequest, string>>>({});
  const isEdit = mode === 'edit';

  const set = (key: keyof CreateSchoolBranchRequest) => (val: string) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const validation = validateAvatarFile(file);
    if (!validation.isValid) {
      displayToast('error', 'Lỗi', validation.firstError || 'Kích thước ảnh tối đa là 2MB');
      return;
    }

    try {
      setUploadingLogo(true);
      const url = await uploadToCloudinary(file);
      setForm((prev) => ({ ...prev, logo: url }));
      if (errors.logo) setErrors((prev) => ({ ...prev, logo: undefined }));
      displayToast('success', 'Thành công', 'Đã tải ảnh lên Cloudinary thành công!');
    } catch (err: any) {
      displayToast('error', 'Lỗi', err.message || 'Có lỗi xảy ra khi tải ảnh lên Cloudinary');
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  };

  const handleRemoveLogo = () => {
    setForm((prev) => ({ ...prev, logo: '' }));
  };

  const handleSubmit = async () => {
    const payload = {
      ...form,
      code: (form.code && form.code.trim()) ? form.code.trim().toUpperCase() : (isEdit ? branch?.code : (nextCode || '')),
    };
    const validation = validateCreateBranch(payload);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(payload);
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
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: `1px solid ${errors.name ? '#ef4444' : '#cbd5e1'}`,
                  outline: 'none',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  backgroundColor: '#ffffff',
                  color: '#1e293b'
                }}
              />
              {errors.name && (
                <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.name}</div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#334155', textAlign: 'left' }}>
                Mã cơ sở <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                disabled={isEdit}
                value={form.code ?? ''}
                onChange={(e) => set('code')(e.target.value.toUpperCase())}
                placeholder={nextCode || 'VD: TEST_BRANCH'}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: `1px solid ${errors.code ? '#ef4444' : '#cbd5e1'}`,
                  outline: 'none',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  backgroundColor: isEdit ? '#f8fafc' : '#ffffff',
                  color: isEdit ? '#94a3b8' : '#1e293b',
                  cursor: isEdit ? 'not-allowed' : 'text',
                }}
              />
              {errors.code ? (
                <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.code}</div>
              ) : !isEdit ? (
                <div style={{ color: '#64748b', fontSize: '12px', marginTop: '4px' }}>
                  Hệ thống tự động sinh theo thứ tự A, B... Bạn có thể chỉnh sửa mã này nếu muốn.
                </div>
              ) : null}
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

            <div style={{
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '18px',
              backgroundColor: '#f8fafc'
            }}>
              <div style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#64748b',
                marginBottom: '14px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Logo cơ sở
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{
                  width: '76px',
                  height: '76px',
                  borderRadius: '50%',
                  backgroundColor: '#ffffff',
                  border: '1px dashed #cbd5e1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  flexShrink: 0,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}>
                  {form.logo ? (
                    <img
                      src={form.logo}
                      alt="Logo cơ sở"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                    />
                  ) : (
                    <Home size={32} color="#94a3b8" />
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <label style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '7px 14px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#334155',
                      cursor: (uploadingLogo || isLoading) ? 'not-allowed' : 'pointer',
                      opacity: (uploadingLogo || isLoading) ? 0.7 : 1,
                      boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                      transition: 'all 0.15s'
                    }}>
                      <Upload size={15} />
                      {uploadingLogo ? 'Đang tải lên...' : form.logo ? 'Đổi ảnh' : 'Tải ảnh lên'}
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/svg+xml, image/webp"
                        style={{ display: 'none' }}
                        onChange={handleLogoUpload}
                        disabled={uploadingLogo || isLoading}
                      />
                    </label>

                    {form.logo && (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        disabled={uploadingLogo || isLoading}
                        style={{
                          color: '#ef4444',
                          backgroundColor: 'transparent',
                          border: 'none',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          padding: '6px 8px'
                        }}
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
                    Định dạng PNG, JPG, SVG, WEBP. Khuyến nghị ảnh vuông tối đa 2MB. Ảnh được lưu trữ trực tiếp trên Cloudinary.
                  </div>
                </div>
              </div>
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
            disabled={isLoading || uploadingLogo}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#475569',
              fontSize: '14px',
              fontWeight: 600,
              cursor: (isLoading || uploadingLogo) ? 'not-allowed' : 'pointer',
            }}
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || uploadingLogo}
            style={{
              padding: '10px 24px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 600,
              cursor: (isLoading || uploadingLogo) ? 'not-allowed' : 'pointer',
              opacity: (isLoading || uploadingLogo) ? 0.7 : 1,
            }}
          >
            {isLoading ? 'Đang xử lý...' : uploadingLogo ? 'Đang tải ảnh...' : isEdit ? 'Lưu thay đổi' : 'Tạo mới'}
          </button>
        </div>
      </div>
    </div>
  );
};
