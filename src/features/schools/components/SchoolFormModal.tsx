import React, { useEffect, useRef, useState, useMemo } from 'react';
import { X, Search, ChevronDown, Check } from 'lucide-react';
import { Button } from '../../../components/common/Button';
import type { School, CreateSchoolRequest, ProvinceOption } from '../../../types';
import { api } from '../../../services/api';
import { useAsync } from '../../../hooks/useAsync';

interface SchoolFormModalProps {
  mode: 'create' | 'edit';
  school?: School;
  onClose: () => void;
  onSubmit: (data: CreateSchoolRequest) => Promise<void>;
}


// ─── Input base styles ────────────────────────────────────────────────────────
const inputStyle = (hasError?: boolean): React.CSSProperties => ({
  width: '100%',
  padding: '10px 12px',
  borderRadius: '7px',
  border: `1.5px solid ${hasError ? '#ef4444' : '#e2e8f0'}`,
  fontSize: '14px',
  color: '#0f172a',
  backgroundColor: '#fff',
  boxSizing: 'border-box',
  outline: 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
  fontFamily: 'inherit',
});

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 500,
  color: '#475569',
  marginBottom: '6px',
  textAlign: 'left',
};

const requiredMark = <span style={{ color: '#ef4444', marginLeft: '2px' }}>*</span>;

// ─── Focus/blur handlers ──────────────────────────────────────────────────────
const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
  e.target.style.borderColor = '#3b82f6';
  e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
};
const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, hasError?: boolean) => {
  e.target.style.borderColor = hasError ? '#ef4444' : '#e2e8f0';
  e.target.style.boxShadow = 'none';
};

// ─── Section header ───────────────────────────────────────────────────────────
const SectionHeader: React.FC<{ num: number; title: string }> = ({ num, title }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '16px',
    }}
  >
    <div
      style={{
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        backgroundColor: '#1e3a8a',
        color: '#fff',
        fontSize: '12px',
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {num}
    </div>
    <span
      style={{
        fontSize: '12px',
        fontWeight: 700,
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: '0.8px',
      }}
    >
      {title}
    </span>
    <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
  </div>
);

// ─── Custom Province Select ──────────────────────────────────────────────────
const SearchableProvinceSelect: React.FC<{
  value?: string;
  onChange: (code: string) => void;
}> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  const { data: res, reload } = useAsync(() => api.provinces.list(), []);
  const provinces = res?.data || [];
  
  const handleSync = async () => {
    try {
      setIsSyncing(true);
      await api.provinces.sync();
      await reload();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredProvinces = useMemo(() => {
    if (!search.trim()) return provinces;
    const term = search.toLowerCase();
    return provinces.filter(p => 
      p.name.toLowerCase().includes(term) || 
      p.code.includes(term)
    );
  }, [provinces, search]);

  const selectedProvince = provinces.find(p => p.code === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          ...inputStyle(false),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          backgroundColor: '#fff',
        }}
      >
        <span style={{ color: selectedProvince ? '#0f172a' : '#94a3b8', fontSize: '14px' }}>
          {selectedProvince ? selectedProvince.name : 'Chọn tỉnh/thành phố...'}
        </span>
        <ChevronDown size={16} color="#64748b" />
      </div>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            backgroundColor: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            zIndex: 100,
            maxHeight: '260px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '8px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search size={16} color="#94a3b8" />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm tỉnh..."
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                fontSize: '13px',
                color: '#0f172a',
              }}
            />
          </div>
          
          <div className="custom-scrollbar" style={{ overflowY: 'auto', flex: 1 }}>
            {filteredProvinces.length === 0 ? (
              <div style={{ padding: '12px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                {provinces.length === 0 ? (
                  <>
                    <div style={{ marginBottom: '8px' }}>Chưa có dữ liệu tỉnh</div>
                    <button
                      type="button"
                      onClick={handleSync}
                      disabled={isSyncing}
                      style={{
                        backgroundColor: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: '4px',
                        padding: '6px 12px', fontSize: '12px', cursor: isSyncing ? 'not-allowed' : 'pointer',
                        fontWeight: 500
                      }}
                    >
                      {isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ ngay'}
                    </button>
                  </>
                ) : (
                  'Không tìm thấy kết quả nào'
                )}
              </div>
            ) : (
              <div style={{ padding: '4px' }}>
                <div
                  onClick={() => {
                    onChange('');
                    setOpen(false);
                    setSearch('');
                  }}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    fontSize: '13px',
                    color: !value ? '#2563eb' : '#334155',
                    backgroundColor: !value ? '#eff6ff' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                  onMouseEnter={(e) => {
                    if (value) e.currentTarget.style.backgroundColor = '#f1f5f9';
                  }}
                  onMouseLeave={(e) => {
                    if (value) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <span>(Để trống)</span>
                  {!value && <Check size={16} color="#2563eb" />}
                </div>
                {filteredProvinces.map(p => (
                  <div
                    key={p.code}
                    onClick={() => {
                      onChange(p.code);
                      setOpen(false);
                      setSearch('');
                    }}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      fontSize: '13px',
                      color: value === p.code ? '#2563eb' : '#334155',
                      backgroundColor: value === p.code ? '#eff6ff' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                    onMouseEnter={(e) => {
                      if (value !== p.code) e.currentTarget.style.backgroundColor = '#f1f5f9';
                    }}
                    onMouseLeave={(e) => {
                      if (value !== p.code) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <span>{p.name} <span style={{ color: '#94a3b8', marginLeft: '4px' }}>({p.code})</span></span>
                    {value === p.code && <Check size={16} color="#2563eb" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const SchoolFormModal: React.FC<SchoolFormModalProps> = ({
  mode, school, onClose, onSubmit,
}) => {
  const isEdit = mode === 'edit';

  const [form, setForm] = useState<CreateSchoolRequest>({
    name: school?.name ?? '',
    code: school?.code ?? '',
    provinceCode: school?.provinceCode ?? '',
    status: school?.status ?? 'ACTIVE',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof CreateSchoolRequest, string>>>({});
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const validate = (): boolean => {
    const errs: Partial<Record<keyof CreateSchoolRequest, string>> = {};
    if (!form.name.trim()) errs.name = 'Vui lòng nhập tên trường.';
    if (!form.code.trim()) errs.code = 'Vui lòng nhập mã trường.';
    else if (!/^[A-Za-z0-9\-_]+$/.test(form.code.trim())) errs.code = 'Chỉ gồm chữ in hoa, số và dấu gạch ngang (-).';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try { await onSubmit(form); }
    finally { setIsLoading(false); }
  };

  const set = (field: keyof CreateSchoolRequest) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15,23,42,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
        padding: '16px',
        fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
      }}
    >
      <div
        className="notranslate custom-scrollbar"
        style={{
          backgroundColor: '#fff',
          borderRadius: '5px',
          width: '100%',
          maxWidth: '600px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 32px 80px rgba(0,0,0,0.22)',
          animation: 'modalIn 0.2s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '20px 24px',
            borderBottom: '1px solid #f1f5f9',
          }}
        >
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
              {isEdit ? 'Chỉnh sửa thông tin trường học' : 'Thêm thông tin trường học'}
            </h2>
            {isEdit && school && (
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                Mã: {school.code}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#94a3b8',
              padding: '4px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#64748b')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
            aria-label="Đóng"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Body ────────────────────────────────────────────────────────── */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '28px' }}>

          {/* Section 1: THÔNG TIN ĐƠN VỊ */}
          <div>
            <SectionHeader num={1} title="Thông tin đơn vị" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* Tên trường – full width */}
              <div>
                <label style={labelStyle}>Tên trường học / Đơn vị giáo dục {requiredMark}</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => set('name')(e.target.value)}
                  placeholder="VD: Trường Tiểu học Ánh Dương"
                  style={inputStyle(!!errors.name)}
                  onFocus={onFocus}
                  onBlur={(e) => onBlur(e, !!errors.name)}
                />
                {errors.name && (
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#ef4444' }}>{errors.name}</p>
                )}
              </div>

              {/* Mã trường – full width */}
              <div>
                <label style={labelStyle}>Mã trường {requiredMark}</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => set('code')(e.target.value)}
                  placeholder="VD: TEN-AD001"
                  disabled={isEdit}
                  style={{
                    ...inputStyle(!!errors.code),
                    backgroundColor: isEdit ? '#f8fafc' : '#fff',
                    color: isEdit ? '#94a3b8' : '#0f172a',
                    cursor: isEdit ? 'not-allowed' : 'text',
                  }}
                  onFocus={!isEdit ? onFocus : undefined}
                  onBlur={!isEdit ? (e) => onBlur(e, !!errors.code) : undefined}
                />
                {errors.code ? (
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#ef4444' }}>{errors.code}</p>
                ) : (
                  <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#94a3b8' }}>
                    Chỉ gồm chữ in hoa, số và dấu gạch ngang (-)
                  </p>
                )}
              </div>

              {/* Mã tỉnh / thành phố */}
              <div>
                <label style={labelStyle}>Tỉnh/thành phố (Tùy chọn)</label>
                <SearchableProvinceSelect
                  value={form.provinceCode}
                  onChange={(code) => set('provinceCode')(code)}
                />
              </div>
            </div>
          </div>

          {/* Section 2: TRẠNG THÁI */}
          {isEdit && (
            <div>
              <SectionHeader num={2} title="Trạng thái" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={labelStyle}>Trạng thái</label>
                  <select
                    value={form.status ?? 'ACTIVE'}
                    onChange={(e) => set('status')(e.target.value)}
                    style={{ ...inputStyle(), cursor: 'pointer' }}
                    onFocus={onFocus}
                    onBlur={(e) => onBlur(e)}
                  >
                    <option value="ACTIVE">Đang hoạt động</option>
                    <option value="INACTIVE">Ngừng hoạt động</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '10px',
            padding: '16px 24px',
            borderTop: '1px solid #f1f5f9',
            backgroundColor: '#fafafa',
            borderRadius: '0px',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '9px 20px',
              borderRadius: '8px',
              border: '1.5px solid #e2e8f0',
              backgroundColor: '#fff',
              color: '#475569',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fff'; }}
          >
            Hủy bỏ
          </button>
          <Button
            onClick={handleSubmit}
            isLoading={isLoading}
            style={{
              padding: '9px 22px',
              fontSize: '14px',
              fontWeight: 600,
              borderRadius: '8px',
              backgroundColor: '#1e3a8a',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {isEdit ? '✓  Lưu thay đổi' : '✓  Thêm trường'}
          </Button>
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.97) translateY(-8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #94a3b8;
        }
      `}</style>
    </div>
  );
};
