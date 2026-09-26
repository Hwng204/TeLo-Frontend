import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Settings, Plus, Building2, Users, BookOpen, ArrowRight, Edit2, ChevronDown } from 'lucide-react';
import { SchoolFormModal } from '../components/SchoolFormModal';
import { api } from '../../../services/api';
import { displayToast } from '../../../utils/toast';
import { mapSchool } from '../../../types/school';
import type { School, CreateSchoolRequest } from '../../../types';
import { Pager } from '../../../components/common/Pager';
import { useAsync, useDebounce } from '../../../hooks';

// ─── Helpers ───────────────────────────────────────────────────────────────────
function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

const AVATAR_COLORS = [
  '#0284c7', // light blue
  '#4338ca', // indigo
  '#059669', // emerald
  '#3b82f6', // blue
  '#9333ea', // purple
  '#ea580c', // orange
];

function avatarColor(id: string): string {
  const n = parseInt(id, 10) || 0;
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}

// ─── Status badge ──────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  let config = { dot: '#94a3b8', bg: '#f1f5f9', color: '#475569', label: 'Tạm dừng' };

  if (status === 'ACTIVE') {
    config = { dot: '#10b981', bg: '#ecfdf5', color: '#059669', label: 'Đang hoạt động' };
  } else if (status === 'PENDING') {
    config = { dot: '#3b82f6', bg: '#eff6ff', color: '#2563eb', label: 'Chờ thiết lập' };
  } else if (status === 'INACTIVE') {
    config = { dot: '#94a3b8', bg: '#f1f5f9', color: '#475569', label: 'Tạm dừng' };
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        borderRadius: '100px',
        fontSize: '12px',
        fontWeight: 600,
        backgroundColor: config.bg,
        color: config.color,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: config.dot,
          flexShrink: 0,
        }}
      />
      {config.label || status}
    </span>
  );
};

// ─── School Card ───────────────────────────────────────────────────────────────
const SchoolCard: React.FC<{
  school: School;
  onEdit: (school: School) => void;
  onManage: (school: School) => void;
}> = ({ school, onEdit, onManage }) => {
  const [hovered, setHovered] = useState(false);
  const initials = getInitials(school.name);
  const bgColor = avatarColor(school.id);

  const branchesCount = school.branches?.length || 0;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        boxShadow: hovered
          ? '0 12px 24px rgba(0, 0, 0, 0.06)'
          : '0 2px 8px rgba(0, 0, 0, 0.02)',
        transform: hovered ? 'translateY(-2px)' : 'none',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── Card Header ── */}
      <div style={{ padding: '24px 24px 16px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '12px',
            backgroundColor: bgColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: '18px',
            flexShrink: 0,
          }}
        >
          {initials}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.5px', marginBottom: '4px' }}>
                {school.code}
              </div>
              <h3
                style={{
                  margin: 0,
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#1e293b',
                  lineHeight: 1.3,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
                title={school.name}
              >
                {school.name}
              </h3>
            </div>
            <StatusBadge status={school.status} />
          </div>
        </div>
      </div>

      {/* ── Meta Info Grid ── */}
      <div style={{ padding: '0 24px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
          <span style={{ color: '#64748b' }}>Quy mô đào tạo:</span>
          <span style={{ color: '#1e293b', fontWeight: 500 }}>{branchesCount} cơ sở - 0 Học sinh</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
          <span style={{ color: '#64748b' }}>Đội ngũ giáo viên:</span>
          <span style={{ color: '#1e293b', fontWeight: 500 }}>0 Cán bộ & Giáo viên</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
          <span style={{ color: '#64748b' }}>Người đại diện:</span>
          <span style={{ color: '#1e293b', fontWeight: 500 }}>Nguyễn Hữu Hưng</span>
        </div>
      </div>

      {/* ── Actions ── */}
      <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', borderTop: '1px solid #f1f5f9', backgroundColor: '#f8fafc' }}>
        <button
          onClick={() => onEdit(school)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'none',
            border: 'none',
            color: '#64748b',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '8px 0',
            transition: 'color 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#3b82f6'}
          onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
        >
          <Edit2 size={14} />
          Chỉnh sửa
        </button>

        <button
          onClick={() => onManage(school)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            backgroundColor: school.status === 'ACTIVE' ? '#1d4ed8' : '#475569',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          {school.status === 'ACTIVE' ? 'Vào quản lý' : 'Thiết lập ngay'}
          {school.status === 'ACTIVE' && <ArrowRight size={14} />}
        </button>
      </div>
    </div>
  );
};

// ─── Skeleton card ─────────────────────────────────────────────────────────────
const SkeletonCard: React.FC = () => (
  <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        <div style={{ width: '52px', height: '52px', borderRadius: '12px', background: '#f1f5f9', animation: 'pulse 1.5s infinite' }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ height: '12px', width: '30%', borderRadius: '4px', background: '#f1f5f9', animation: 'pulse 1.5s infinite' }} />
          <div style={{ height: '20px', width: '80%', borderRadius: '4px', background: '#f1f5f9', animation: 'pulse 1.5s infinite' }} />
        </div>
      </div>
    </div>
    <div style={{ padding: '0 24px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ height: '12px', width: '40%', borderRadius: '4px', background: '#f1f5f9', animation: 'pulse 1.5s infinite' }} />
          <div style={{ height: '12px', width: '30%', borderRadius: '4px', background: '#f1f5f9', animation: 'pulse 1.5s infinite' }} />
        </div>
      ))}
    </div>
    <div style={{ height: '60px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', animation: 'pulse 1.5s infinite' }} />
    <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
  </div>
);

// ─── Empty state ───────────────────────────────────────────────────────────────
const EmptyState: React.FC<{ search: string; onAdd: () => void }> = ({ search, onAdd }) => (
  <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', gap: '16px' }}>
    <div style={{ width: '72px', height: '72px', borderRadius: '16px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Building2 size={32} color="#94a3b8" />
    </div>
    <div style={{ textAlign: 'center' }}>
      <p style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 600, color: '#334155' }}>
        {search ? `Không tìm thấy trường nào` : 'Chưa có trường nào trong hệ thống'}
      </p>
      <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
        {search ? `Không có kết quả cho "${search}"` : 'Thêm trường đầu tiên để bắt đầu quản lý'}
      </p>
    </div>
    {!search && (
      <button onClick={onAdd} style={{ marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 20px', backgroundColor: '#1d4ed8', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
        <Plus size={15} /> Thêm trường đầu tiên
      </button>
    )}
  </div>
);

// ─── Modal state ───────────────────────────────────────────────────────────────
type ModalState =
  | { open: false }
  | { open: true; mode: 'create' }
  | { open: true; mode: 'edit'; school: School };

// ─── Main Page ─────────────────────────────────────────────────────────────────
export const SchoolListPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [modal, setModal] = useState<ModalState>({ open: false });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const navigate = useNavigate();

  const query = {
    search: debouncedSearch || undefined,
    pageIndex: page,
    pageSize: pageSize,
  };

  const list = useAsync(
    () => api.school.list(query),
    [query.search, query.pageIndex, query.pageSize]
  );

  const schools: School[] = list.data?.data ? list.data.data.items.map(mapSchool) : [];
  const totalCount = list.data?.data ? list.data.data.totalCount : 0;
  const loading = list.loading;

  const handleCreate = async (data: CreateSchoolRequest) => {
    try {
      const res = await api.school.create(data);
      if (!res.data) throw new Error('Empty response');
      list.reload();
      setModal({ open: false });
      displayToast('success', 'Thành công', `Đã tạo trường "${data.name}".`);
    } catch (e: any) {
      displayToast('error', 'Lỗi', e.message || 'Không thể tạo trường');
    }
  };

  const handleUpdate = async (data: CreateSchoolRequest) => {
    if (modal.open && modal.mode === 'edit') {
      try {
        const res = await api.school.update(modal.school.id, data);
        if (!res.data) throw new Error('Empty response');
        list.reload();
        setModal({ open: false });
        displayToast('success', 'Thành công', `Đã cập nhật trường "${data.name}".`);
      } catch (e: any) {
        displayToast('error', 'Lỗi', e.message || 'Không thể cập nhật trường');
      }
    }
  };

  const handleManage = (school: School) => {
    navigate(`/schools/${school.id}/branches`);
  };

  // Filtered list
  const filtered = schools.filter((s) =>
    statusFilter === 'ALL' ? true : s.status === statusFilter
  );

  // Stats for summary cards
  const totalBranches = schools.reduce((sum, s) => sum + (s.branches?.length || 0), 0);

  // Status counts
  const activeCount = schools.filter((s) => s.status === 'ACTIVE').length;
  const inactiveCount = schools.filter((s) => s.status === 'INACTIVE').length;

  return (
    <div style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif", display: 'flex', flexDirection: 'column' }}>

      {/* ── Breadcrumb & Page header ────────────────────────────────────────── */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>
          <Building2 size={14} />
          <span>Hệ thống giáo dục</span>
          <span style={{ color: '#cbd5e1' }}>/</span>
          <span style={{ color: '#0284c7', fontWeight: 600 }}>Chọn trường làm việc</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>
            Chọn trường làm việc
          </h1>



          <button
            onClick={() => setModal({ open: true, mode: 'create' })}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0369a1')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0284c7')}
          >
            <Plus size={16} />
            Thêm trường mới
          </button>
        </div>
      </div>

      {/* ── Summary Cards ───────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7', flexShrink: 0 }}>
            <Building2 size={24} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500, marginBottom: '2px' }}>Tổng cơ sở phân hiệu</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>{totalBranches}</span>
              <span style={{ fontSize: '13px', color: '#059669', fontWeight: 600 }}>điểm trường</span>
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4338ca', flexShrink: 0 }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500, marginBottom: '2px' }}>Tổng học sinh toàn mạng</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>0</span>
              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>em</span>
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669', flexShrink: 0 }}>
            <BookOpen size={24} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500, marginBottom: '2px' }}>Cán bộ & Giáo viên</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>0</span>
              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>nhân sự</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Search + Filter ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <div style={{ position: 'relative', flex: 1, backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm theo tên và mã trường..."
            style={{
              width: '100%',
              padding: '12px 16px 12px 44px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'transparent',
              fontSize: '14px',
              outline: 'none',
              color: '#1e293b',
              transition: 'background-color 0.2s',
            }}
            onFocus={e => e.target.style.backgroundColor = '#f8fafc'}
            onBlur={e => e.target.style.backgroundColor = 'transparent'}
          />
        </div>

        <div style={{ position: 'relative', width: '220px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 36px 12px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'transparent',
              fontSize: '14px',
              color: '#334155',
              cursor: 'pointer',
              outline: 'none',
              appearance: 'none',
              fontWeight: 500,
            }}
            onFocus={e => e.target.style.backgroundColor = '#f8fafc'}
            onBlur={e => e.target.style.backgroundColor = 'transparent'}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="INACTIVE">Tạm dừng</option>
          </select>
          <ChevronDown size={16} color="#64748b" style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        </div>
      </div>

      {/* ── Sub header filter info ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: '#64748b', marginBottom: '24px', paddingLeft: '8px' }}>
        <span>Hiển thị: <strong>{filtered.length}</strong> đơn vị trường học</span>
        {activeCount > 0 && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#cbd5e1' }}>•</span>
            <span style={{ color: '#059669', fontWeight: 600 }}>{activeCount} Đang hoạt động</span>
          </span>
        )}
        {inactiveCount > 0 && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#cbd5e1' }}>•</span>
            <span style={{ color: '#475569', fontWeight: 600 }}>{inactiveCount} Tạm dừng</span>
          </span>
        )}
      </div>

      {/* ── Cards grid ──────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '20px',
          flex: 1,
        }}
      >
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : filtered.length === 0
            ? <EmptyState search={debouncedSearch} onAdd={() => setModal({ open: true, mode: 'create' })} />
            : filtered.map((school) => (
              <SchoolCard
                key={school.id}
                school={school}
                onEdit={(s) => setModal({ open: true, mode: 'edit', school: s })}
                onManage={handleManage}
              />
            ))
        }
      </div>

      {totalCount > 0 && (
        <div style={{ marginTop: '24px' }}>
          <Pager
            page={page}
            pageSize={pageSize}
            totalCount={totalCount}
            itemLabel="trường học"
            onChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      )}

      {/* ── Modal ───────────────────────────────────────────────────────────── */}
      {modal.open && modal.mode === 'create' && (
        <SchoolFormModal
          mode="create"
          onClose={() => setModal({ open: false })}
          onSubmit={handleCreate}
        />
      )}
      {modal.open && modal.mode === 'edit' && (
        <SchoolFormModal
          mode="edit"
          school={modal.school}
          onClose={() => setModal({ open: false })}
          onSubmit={handleUpdate}
        />
      )}
    </div>
  );
};
