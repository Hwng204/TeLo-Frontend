import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Building2, Users, BookOpen, Home, ChevronDown } from 'lucide-react';
import { api } from '../../../services/api';
import { displayToast } from '../../../utils/toast';
import type { School, SchoolBranchSummary, CreateSchoolBranchRequest } from '../../../types';
import { mapSchool } from '../../../types/school';
import { Pager } from '../../../components/common/Pager';
import { useAsync, useDebounce } from '../../../hooks';
import { BranchFormModal } from '../components/BranchFormModal';

type ModalState =
  | { open: false }
  | { open: true; mode: 'create' }
  | { open: true; mode: 'edit'; branch: SchoolBranchSummary };


export const BranchListPage: React.FC = () => {
  const { schoolId } = useParams();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [modal, setModal] = useState<ModalState>({ open: false });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  const list = useAsync(async () => {
    if (!schoolId) return null;
    const res = await api.school.get(schoolId);
    if (!res.data) {
      displayToast('error', 'Lỗi', 'Không tìm thấy trường học');
      navigate('/schools');
      return null;
    }
    // Ensure ids are strings for frontend consistency
    const data = res.data;
    data.id = String(data.id);
    if (data.branches) {
      data.branches = data.branches.map(b => ({ ...b, id: String(b.id) }));
    }
    return data;
  }, [schoolId, navigate]);

  const school = list.data;
  const branches = school?.branches || [];
  const loading = list.loading;

  const handleCreate = async (data: CreateSchoolBranchRequest) => {
    if (!schoolId) return;
    try {
      const res = await api.school.createBranch(schoolId, data);
      if (!res.data) throw new Error('Empty response');
      list.reload();
      setModal({ open: false });
      displayToast('success', 'Thành công', `Đã thêm cơ sở "${data.name}"`);
    } catch (e: any) {
      const errorMessage = e.response?.data?.message || e.response?.data?.title || e.message || 'Không thể tạo cơ sở';
      displayToast('error', 'Lỗi', errorMessage);
    }
  };

  const handleUpdate = async (data: CreateSchoolBranchRequest) => {
    if (modal.open && modal.mode === 'edit') {
      try {
        const res = await api.school.updateBranch(modal.branch.id, data);
        if (!res.data) throw new Error('Empty response');
        list.reload();
        setModal({ open: false });
        displayToast('success', 'Thành công', `Đã cập nhật cơ sở "${data.name}"`);
      } catch (e: any) {
        const errorMessage = e.response?.data?.message || e.response?.data?.title || e.message || 'Không thể cập nhật cơ sở';
        displayToast('error', 'Lỗi', errorMessage);
      }
    }
  };

  const filtered = branches.filter(b => {
    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
    const matchesSearch = b.name.toLowerCase().includes(debouncedSearch.toLowerCase()) || b.code.toLowerCase().includes(debouncedSearch.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const paginatedBranches = filtered.slice((page - 1) * pageSize, page * pageSize);

  if (loading) {
    return <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>Đang tải dữ liệu...</div>;
  }

  if (!school) return null;

  return (
    <div style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif", display: 'flex', flexDirection: 'column', paddingBottom: '40px' }}>

      {/* ── Title Section ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '-0.5px' }}>
            <span style={{ color: '#64748b', fontWeight: 600 }}>Cơ sở •</span> {school.name}
          </h1>
          <div style={{ fontSize: '14px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ padding: '4px 8px', backgroundColor: '#f1f5f9', borderRadius: '6px', fontWeight: 500 }}>Công lập</span>
            <span>•</span>
            <span>{school.code}</span>
            <span>•</span>
            <span>Năm học {school.currentAcademicYear}</span>
          </div>
        </div>
        <button
          onClick={() => setModal({ open: true, mode: 'create' })}
          style={{
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            border: 'none',
            borderRadius: '10px',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: 600,
            padding: '12px 24px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.3)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.2)';
          }}
        >
          Thêm cơ sở mới
        </button>
      </div>

      {/* ── Summary Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }}>
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontWeight: 600, fontSize: '14px', marginBottom: '20px' }}>
            <Building2 size={18} /> Cơ sở đang hoạt động
          </div>
          <div style={{ fontSize: '36px', fontWeight: 800, color: '#0f172a', marginBottom: '8px', lineHeight: 1 }}>
            {branches.length.toString().padStart(2, '0')}
          </div>
          <div style={{ fontSize: '13px', color: '#94a3b8' }}>Trực thuộc {school.name}</div>
        </div>

        <div style={{ background: 'linear-gradient(145deg, #f0fdf4 0%, #dcfce7 100%)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 20px rgba(22, 163, 74, 0.05)', border: '1px solid #bbf7d0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534', fontWeight: 600, fontSize: '14px', marginBottom: '20px' }}>
            <Users size={18} /> Học sinh / Lớp học
          </div>
          <div style={{ fontSize: '36px', fontWeight: 800, color: '#15803d', marginBottom: '8px', lineHeight: 1 }}>
            0 / 0
          </div>
          <div style={{ fontSize: '13px', color: '#166534', opacity: 0.8 }}>Tổng quy mô tại các cơ sở</div>
        </div>

        <div style={{ background: 'linear-gradient(145deg, #fefce8 0%, #fef9c3 100%)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 20px rgba(202, 138, 4, 0.05)', border: '1px solid #fef08a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#854d0e', fontWeight: 600, fontSize: '14px', marginBottom: '20px' }}>
            <BookOpen size={18} /> Cán bộ, giáo viên
          </div>
          <div style={{ fontSize: '36px', fontWeight: 800, color: '#a16207', marginBottom: '8px', lineHeight: 1 }}>
            0
          </div>
          <div style={{ fontSize: '13px', color: '#854d0e', opacity: 0.8 }}>Đội ngũ trên toàn trường</div>
        </div>
      </div>

      {/* ── Search & Filter ── */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên cơ sở, địa chỉ hoặc mã cơ sở"
            style={{
              width: '100%', padding: '16px 16px 16px 44px', borderRadius: '12px',
              backgroundColor: '#ffffff', border: '1px solid #cbd5e1', color: '#1e293b',
              fontSize: '14px', outline: 'none', boxSizing: 'border-box',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => e.target.style.borderColor = '#3b82f6'}
            onBlur={e => e.target.style.borderColor = '#cbd5e1'}
          />
        </div>
        <div style={{ position: 'relative' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '16px 40px 16px 20px', borderRadius: '12px',
              backgroundColor: '#ffffff', border: '1px solid #cbd5e1', color: '#1e293b',
              fontSize: '14px', minWidth: '200px', outline: 'none', appearance: 'none', cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            }}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="INACTIVE">Ngừng hoạt động</option>
          </select>
          <ChevronDown size={16} color="#94a3b8" style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        </div>
      </div>

      {/* ── Cards grid ── */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
          <Building2 size={48} color="#cbd5e1" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ margin: '0 0 8px 0', color: '#334155', fontSize: '16px' }}>Không có cơ sở nào</h3>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Hãy thêm cơ sở mới để bắt đầu quản lý.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', flex: 1 }}>
          {paginatedBranches.map(branch => (
            <div key={branch.id} style={{
              backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px',
              display: 'flex', flexDirection: 'column',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}>
              {/* Header: Icon and Status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div style={{
                  width: '42px', height: '42px', borderRadius: '50%',
                  backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#2563eb', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}>
                  <Home size={20} />
                </div>
                <span style={{
                  display: 'inline-flex', padding: '4px 16px', borderRadius: '100px', fontSize: '13px',
                  fontWeight: 500, backgroundColor: branch.status === 'ACTIVE' ? '#ecfdf5' : '#f1f5f9',
                  color: branch.status === 'ACTIVE' ? '#059669' : '#64748b',
                  border: branch.status === 'ACTIVE' ? '1px solid #a7f3d0' : '1px solid #cbd5e1'
                }}>
                  {branch.status === 'ACTIVE' ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                </span>
              </div>

              {/* Title & Code */}
              <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 600, color: '#1f2937' }}>{branch.name}</h3>
              <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
                Mã cơ sở: {branch.code}
              </div>

              {/* Address */}
              <div style={{ fontSize: '14px', color: '#4b5563', marginBottom: '24px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {branch.address || 'Chưa cập nhật địa chỉ'}
              </div>

              {/* Stats Block (no background) */}
              <div style={{ fontSize: '14px', color: '#4b5563', lineHeight: 1.6, marginBottom: '24px' }}>
                <div>0 học sinh • 0 lớp</div>
                <div>0 cán bộ, giáo viên</div>
              </div>

              {/* Footer Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: 'auto' }}>
                <button
                  style={{
                    background: '#ffffff', border: '1px solid #2563eb', borderRadius: '6px',
                    color: '#2563eb', fontSize: '14px', fontWeight: 500, padding: '8px 16px', cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#eff6ff'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#ffffff'; }}
                  onClick={() => setModal({ open: true, mode: 'edit', branch })}
                >
                  Chỉnh sửa
                </button>
                <button
                  style={{
                    background: '#2563eb', border: '1px solid #2563eb', borderRadius: '6px',
                    color: '#ffffff', fontSize: '14px', fontWeight: 500, padding: '8px 16px', cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#1d4ed8'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#2563eb'; }}
                >
                  Vào quản lý
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {filtered.length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <Pager
            page={page}
            pageSize={pageSize}
            totalCount={filtered.length}
            itemLabel="cơ sở"
            onChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      )}

      {modal.open && modal.mode === 'create' && (
        <BranchFormModal
          mode="create"
          nextCode={`${school?.code}-${String.fromCharCode(65 + (school?.branches?.length || 0))}`}
          onClose={() => setModal({ open: false })}
          onSubmit={handleCreate}
        />
      )}
      {modal.open && modal.mode === 'edit' && (
        <BranchFormModal
          mode="edit"
          branch={modal.branch}
          onClose={() => setModal({ open: false })}
          onSubmit={handleUpdate}
        />
      )}
    </div>
  );
};
