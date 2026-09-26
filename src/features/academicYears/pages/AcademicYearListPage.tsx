import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Calendar, BookOpen, ChevronRight, Clock, CheckCircle, Lock } from 'lucide-react';
import { api } from '../../../services/api';
import { useAsync } from '../../../hooks/useAsync';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import type { AcademicYearListItem } from '../../../types';

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  DRAFT: { label: 'Bản nháp', color: '#64748b', bg: '#f1f5f9', icon: <Clock size={12} /> },
  ACTIVE: { label: 'Đang áp dụng', color: '#16a34a', bg: '#dcfce7', icon: <CheckCircle size={12} /> },
  CLOSED: { label: 'Đã kết thúc', color: '#64748b', bg: '#e9edf0', icon: <Lock size={12} /> },
};

function formatDate(d: string) {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

function weeksBetween(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  return Math.round((e.getTime() - s.getTime()) / (7 * 24 * 60 * 60 * 1000));
}

export const AcademicYearListPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: res, loading } = useAsync(
    () => api.academicYear.list({
      search: search || undefined,
      status: statusFilter || undefined,
      page: 1,
      pageSize: 50,
    }), [search, statusFilter]
  );
  const years: AcademicYearListItem[] = res?.data?.items || [];

  return (
    <div style={{ padding: '32px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            Năm học và Kỳ học
          </h1>
          <p style={{ color: '#64748b', marginTop: '6px', fontSize: '14px' }}>
            Quản lý lịch năm học và cấu hình các kỳ học cho toàn hệ thống
          </p>
        </div>
        <button
          id="btn-create-academic-year"
          onClick={() => navigate('/academic-years/new')}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            backgroundColor: '#2563eb', color: '#fff',
            border: 'none', borderRadius: '10px',
            padding: '10px 20px', fontSize: '14px', fontWeight: 600,
            cursor: 'pointer', whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
          }}
        >
          <Plus size={16} />
          Tạo năm học
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            id="search-academic-year"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo năm học (VD: 2026-2027)..."
            style={{
              width: '100%', padding: '10px 14px 10px 38px',
              borderRadius: '10px', border: '1px solid #e2e8f0',
              fontSize: '14px', outline: 'none', boxSizing: 'border-box',
              backgroundColor: '#fff', color: '#1e293b',
            }}
          />
        </div>
        <div style={{ position: 'relative' }}>
          <Filter size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
          <select
            id="filter-status"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{
              padding: '10px 36px 10px 36px',
              borderRadius: '10px', border: '1px solid #e2e8f0',
              fontSize: '14px', outline: 'none', cursor: 'pointer',
              backgroundColor: '#fff', color: '#1e293b', appearance: 'none',
            }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="DRAFT">Bản nháp</option>
            <option value="ACTIVE">Đang áp dụng</option>
            <option value="CLOSED">Đã khóa</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['Năm học', 'Ngày bắt đầu', 'Ngày kết thúc', 'Số kỳ', 'Trạng thái', 'Thao tác'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: '48px' }}>
                  <LoadingSpinner />
                </td>
              </tr>
            ) : years.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '64px 16px' }}>
                  <Calendar size={40} style={{ color: '#cbd5e1', marginBottom: '12px', display: 'block', margin: '0 auto 12px' }} />
                  <div style={{ color: '#64748b', fontWeight: 500 }}>Chưa có năm học nào</div>
                  <div style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px' }}>Bấm "Tạo năm học" để bắt đầu</div>
                </td>
              </tr>
            ) : years.map((year, idx) => {
              const st = STATUS_LABELS[year.status] || STATUS_LABELS.DRAFT;
              const isReadOnly = year.status === 'CLOSED';
              return (
                <tr key={year.id} style={{ borderBottom: idx < years.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                  <td style={{ padding: '16px', fontWeight: 600, color: '#1e293b', fontSize: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <BookOpen size={15} style={{ color: '#2563eb' }} />
                      {year.name}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px', paddingLeft: '23px' }}>
                      {weeksBetween(year.startDate, year.endDate)} tuần
                    </div>
                  </td>
                  <td style={{ padding: '16px', color: '#475569', fontSize: '14px' }}>{formatDate(year.startDate)}</td>
                  <td style={{ padding: '16px', color: '#475569', fontSize: '14px' }}>{formatDate(year.endDate)}</td>
                  <td style={{ padding: '16px', color: '#475569', fontSize: '14px' }}>{year.semesterCount}</td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '5px',
                      padding: '4px 10px', borderRadius: '100px',
                      fontSize: '12px', fontWeight: 600,
                      color: st.color, backgroundColor: st.bg,
                    }}>
                      {st.icon}{st.label}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <button
                      id={`btn-year-action-${year.id}`}
                      onClick={() => navigate(`/academic-years/${year.id}`)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: isReadOnly ? '#64748b' : '#2563eb',
                        fontSize: '13px', fontWeight: 600, padding: '4px 0',
                      }}
                    >
                      {isReadOnly ? 'Xem chi tiết' : 'Cấu hình năm học'}
                      <ChevronRight size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {years.length > 0 && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid #f1f5f9', color: '#94a3b8', fontSize: '13px' }}>
            Hiển thị {years.length} năm học
          </div>
        )}
      </div>
    </div>
  );
};
