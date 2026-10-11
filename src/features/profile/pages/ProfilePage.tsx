import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { Icon } from '../../../components/pcb';
import { storage } from '../../../utils/storage';
import { uploadToCloudinary } from '../../../utils/cloudinary';
import { displayToast } from '../../../utils/toast';
import { PageHeader } from '../../../components/common/PageHeader';

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 12px',
  borderRadius: '6px',
  border: '1px solid #e2e8f0',
  backgroundColor: '#f1f5f9', // Tối màu, không sửa được
  color: '#475569',
  fontSize: '14px',
  outline: 'none',
  cursor: 'default'
};

const HeaderButtons = ({ onSave }: { onSave: () => void }) => (
  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
    <button type="button" onClick={() => window.history.back()} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', color: '#475569', fontWeight: 500, cursor: 'pointer' }}>
      <Icon name="arrow_back" size={18} />
      Quay lại
    </button>
    <button type="button" onClick={onSave} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#3b82f6', border: '1px solid #3b82f6', borderRadius: '6px', color: 'white', fontWeight: 500, cursor: 'pointer' }}>
      <Icon name="save" size={18} />
      Lưu thay đổi
    </button>
  </div>
);

const AvatarUpload = ({ uploading, onAvatarChange, avatarUrl }: any) => (
  <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '24px', marginBottom: '24px' }}>
    <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '16px', textTransform: 'uppercase' }}>Ảnh giao diện</div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
      <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#f1f5f9', border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {avatarUrl ? <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <img src="/logo-pcb.png" alt="Logo" style={{ width: '60%' }} />}
      </div>
      <div>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', fontWeight: 500, color: '#475569', cursor: 'pointer' }}>
            <Icon name="upload" size={16} />
            {uploading ? 'Đang tải...' : 'Tải ảnh lên'}
            <input type="file" accept="image/png, image/jpeg, image/svg+xml" style={{ display: 'none' }} onChange={onAvatarChange} disabled={uploading} />
          </label>
          <button type="button" onClick={() => onAvatarChange({ target: { files: null } })} style={{ color: '#ef4444', backgroundColor: 'transparent', border: 'none', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>Xóa</button>
        </div>
        <div style={{ fontSize: '12px', color: '#64748b', maxWidth: '400px', lineHeight: 1.5 }}>
          Định dạng PNG, JPG, SVG. Khuyến nghị ảnh vuông tối đa 2MB. Logo hiển thị dạng hình tròn trên hệ thống.
        </div>
      </div>
    </div>
  </div>
);

const StudentProfile = ({ profile, onSave, uploading, onAvatarChange, avatarUrl }: any) => {
  return (
    <div style={{ padding: '16px' }}>
      <HeaderButtons onSave={onSave} />

      <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: '#334155' }}>
            <Icon name="contact_page" size={20} />
            Thông tin chung
          </div>
          <span style={{ color: '#64748b', display: 'flex' }}><Icon name="expand_less" size={20} /></span>
        </div>

        <div style={{ padding: '24px' }}>
          <AvatarUpload uploading={uploading} onAvatarChange={onAvatarChange} avatarUrl={avatarUrl} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '8px' }}>Khối</label>
              <input type="text" readOnly value="Khối 3" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '8px' }}>Lớp học</label>
              <input type="text" readOnly value="3A1" style={inputStyle} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '8px' }}>Mã học sinh</label>
              <input type="text" readOnly value={profile?.username || '103008104-00-2497'} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '8px' }}>Họ và tên</label>
              <input type="text" readOnly value={profile?.fullName || 'Thái Bảo Quỳnh Chi'} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '8px' }}>Giới tính</label>
              <input type="text" readOnly value="Nữ" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '8px' }}>Ngày sinh</label>
              <input type="text" readOnly value="01/01/2014" style={inputStyle} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TeacherProfile = ({ profile, onSave, uploading, onAvatarChange, avatarUrl }: any) => {
  return (
    <div style={{ padding: '16px' }}>
      <HeaderButtons onSave={onSave} />

      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        {/* Left column */}
        <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ color: '#64748b', fontSize: '13px' }}>Tổ chuyên môn:</span>
              <span style={{ color: '#334155', fontSize: '13px', fontWeight: 500 }}>Tổ 4</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ color: '#64748b', fontSize: '13px' }}>Lớp chủ nhiệm:</span>
              <span style={{ color: '#334155', fontSize: '13px', fontWeight: 500 }}>Lớp 4A1 (34 HS)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
              <span style={{ color: '#64748b', fontSize: '13px' }}>Mã đăng nhập:</span>
              <span style={{ backgroundColor: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', color: '#334155', fontSize: '13px', fontFamily: 'monospace' }}>{profile?.username}</span>
            </div>
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: '#334155' }}>
              <span style={{ color: '#3b82f6', display: 'flex' }}><Icon name="business" size={20} /></span>
              Đơn vị công tác
            </div>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <span style={{ color: '#64748b', fontSize: '13px', marginRight: '8px' }}>Trường:</span>
                <span style={{ color: '#334155', fontSize: '13px' }}>{profile?.branchName || 'Tiểu học Phạm Công Bình'}</span>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '13px', marginRight: '8px' }}>Năm học:</span>
                <span style={{ color: '#334155', fontSize: '13px' }}>{profile?.academicYear || 'Chưa cấu hình năm học'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ flex: 1, backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ backgroundColor: '#eff6ff', color: '#3b82f6', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '14px' }}>01</div>
            <div style={{ fontWeight: 600, color: '#1e293b' }}>THÔNG TIN CÁ NHÂN</div>
          </div>

          <div style={{ padding: '24px' }}>
            <AvatarUpload uploading={uploading} onAvatarChange={onAvatarChange} avatarUrl={avatarUrl} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '8px' }}>Họ và tên giáo viên</label>
                <input type="text" readOnly value={profile?.fullName || ''} style={inputStyle} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '8px' }}>Ngày sinh</label>
                <input type="text" readOnly value="14/05/1988" style={inputStyle} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '8px' }}>Giới tính</label>
                <input type="text" readOnly value="Nam" style={inputStyle} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '8px' }}>Số điện thoại liên hệ</label>
                <input type="text" readOnly value="0901234567" style={inputStyle} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '8px' }}>Email công vụ</label>
                <input type="text" readOnly value={profile?.email || 'trong.nh@pcb.edu.vn'} style={inputStyle} />
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Footer text */}
      <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '12px' }}>
        <div>© 2024 Trường Tiểu học Phạm Công Bình. All rights reserved.</div>
        <div style={{ display: 'flex', gap: '24px' }}>
          <span>Chính sách bảo mật</span>
          <span>Điều khoản sử dụng</span>
          <span>Liên hệ hỗ trợ</span>
        </div>
      </div>
    </div>
  );
};

export const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<{ username: string; fullName: string; email: string; status: string; avatarUrl?: string; branchName?: string; academicYear?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const currentUser = storage.getUser<{ role: string }>();
  const isStudent = currentUser?.role?.toLowerCase() === 'student';

  useEffect(() => {
    api.auth.profile()
      .then(res => {
        setProfile(res as any);
        if (res.avatarUrl) setAvatarUrl(res.avatarUrl);
      })
      .catch(err => setError(err?.response?.data?.message || err?.message || 'Không thể tải thông tin cá nhân'))
      .finally(() => setLoading(false));
  }, []);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      setAvatarUrl(null);
      return;
    }

    const file = e.target.files[0];
    if (file.size > 2 * 1024 * 1024) {
      displayToast('error', 'Lỗi', 'Kích thước ảnh tối đa là 2MB');
      return;
    }

    try {
      setUploading(true);
      const url = await uploadToCloudinary(file);
      setAvatarUrl(url);
    } catch (err: any) {
      displayToast('error', 'Lỗi', err.message || 'Có lỗi xảy ra khi tải ảnh lên');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      await api.auth.updateProfile({ avatarUrl: avatarUrl ?? undefined });
      displayToast('success', 'Thành công', 'Đã lưu thay đổi thành công!');
    } catch (err: any) {
      displayToast('error', 'Lỗi', err.message || 'Lỗi khi lưu thay đổi');
    }
  };

  if (loading) return <div style={{ padding: '24px' }}>Đang tải dữ liệu...</div>;
  if (error) return <div style={{ padding: '24px', color: '#ef4444' }}>{error}</div>;

  return (
    <>
      <PageHeader title="Hồ sơ cá nhân" />
      <div className="sep-page sep-page--flush">
        {isStudent ? (
          <StudentProfile
            profile={profile}
            onSave={handleSave}
            uploading={uploading}
            onAvatarChange={handleAvatarChange}
            avatarUrl={avatarUrl}
          />
        ) : (
          <TeacherProfile
            profile={profile}
            onSave={handleSave}
            uploading={uploading}
            onAvatarChange={handleAvatarChange}
            avatarUrl={avatarUrl}
          />
        )}
      </div>
    </>
  );
};
