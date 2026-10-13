import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { School } from '../../types/school';
import { Icon } from '../pcb';

interface BranchSelectModalProps {
  onClose: () => void;
  onSelect: (
    schoolId: string,
    schoolCode: string,
    schoolName: string,
    branchId: string,
    branchCode: string,
    branchName: string
  ) => void;
}

export const BranchSelectModal: React.FC<BranchSelectModalProps> = ({ onClose, onSelect }) => {
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [schoolSearch, setSchoolSearch] = useState('');
  const [branchSearch, setBranchSearch] = useState('');

  useEffect(() => {
    const fetchSchools = async () => {
      setLoading(true);
      try {
        const res = await api.school.list();
        if (res.data?.items) {
          const mapped = res.data.items.map(item => ({
            id: String(item.id),
            code: item.code,
            name: item.name,
            status: (item.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE') as any,
            currentAcademicYear: '',
            branches: Array.from({ length: item.branchCount || 0 }, (_, i) => ({
              id: `${item.id}-${i}`,
              code: `${item.code}-B${i + 1}`,
              name: `Cơ sở ${i + 1}`,
              status: 'ACTIVE',
            })),
          }));
          setSchools(mapped);
        }
      } catch (err) {
        console.error('Failed to fetch schools:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSchools();
  }, []);

  const selectedSchool = schools.find(s => s.id === selectedSchoolId);
  const [branches, setBranches] = useState<any[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);

  useEffect(() => {
    if (selectedSchoolId) {
      const fetchBranches = async () => {
        setLoadingBranches(true);
        try {
          const res = await api.school.get(selectedSchoolId);
          if (res.data?.branches) {
            setBranches(res.data.branches);
          } else {
            setBranches([]);
          }
        } catch (err) {
          console.error('Failed to fetch branches:', err);
        } finally {
          setLoadingBranches(false);
        }
      };
      fetchBranches();
    } else {
      setBranches([]);
    }
  }, [selectedSchoolId]);

  const filteredSchools = schools.filter(s => {
    const q = schoolSearch.trim().toLowerCase();
    if (!q) return true;
    return s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q);
  });

  const filteredBranches = branches.filter(b => {
    const q = branchSearch.trim().toLowerCase();
    if (!q) return true;
    return b.name.toLowerCase().includes(q) || (b.code && b.code.toLowerCase().includes(q));
  });

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(3px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '580px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
          overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '18px 24px',
          borderBottom: '1px solid #f1f5f9',
          backgroundColor: '#fafcff'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
              {selectedSchoolId ? 'Chọn phân hiệu làm việc' : 'Chọn trường để vận hành'}
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
              {selectedSchoolId
                ? 'Vui lòng chọn cơ sở/phân hiệu để bắt đầu quản trị'
                : 'Chọn trường học trước khi vào các mục vận hành'}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#94a3b8',
              borderRadius: '8px',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s'
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <Icon name="close" size={22} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: '#64748b', padding: '40px 0' }}>
              Đang tải danh sách trường...
            </div>
          ) : !selectedSchoolId ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Search bar */}
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }}>
                  <Icon name="search" size={20} />
                </span>
                <input
                  type="text"
                  value={schoolSearch}
                  onChange={e => setSchoolSearch(e.target.value)}
                  placeholder="Tìm kiếm theo tên hoặc mã trường..."
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 40px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {filteredSchools.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '32px 0', fontSize: '14px' }}>
                  Không tìm thấy trường học nào phù hợp.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto' }}>
                  {filteredSchools.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSchoolId(s.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 18px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = '#3b82f6';
                        e.currentTarget.style.backgroundColor = '#f8fafc';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = '#e2e8f0';
                        e.currentTarget.style.backgroundColor = '#ffffff';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          backgroundColor: '#eff6ff',
                          color: '#2563eb',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '14px',
                          flexShrink: 0
                        }}>
                          {s.code ? s.code.slice(0, 3).toUpperCase() : 'SCH'}
                        </div>
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b' }}>{s.name}</div>
                          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px', display: 'flex', gap: '10px' }}>
                            <span>Mã trường: <strong>{s.code}</strong></span>
                            <span>•</span>
                            <span>{s.branches?.length || 0} phân hiệu</span>
                          </div>
                        </div>
                      </div>
                      <span style={{ color: '#94a3b8', display: 'flex' }}>
                        <Icon name="chevron_right" size={20} />
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <button
                  onClick={() => {
                    setSelectedSchoolId(null);
                    setBranchSearch('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2563eb',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '14px',
                    fontWeight: 600,
                    padding: '4px 0'
                  }}
                >
                  <Icon name="arrow_back" size={18} /> Chọn trường khác
                </button>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569', backgroundColor: '#f1f5f9', padding: '4px 10px', borderRadius: '6px' }}>
                  {selectedSchool?.name}
                </span>
              </div>

              {/* Search branch */}
              {branches.length > 3 && (
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }}>
                    <Icon name="search" size={20} />
                  </span>
                  <input
                    type="text"
                    value={branchSearch}
                    onChange={e => setBranchSearch(e.target.value)}
                    placeholder="Tìm kiếm cơ sở, phân hiệu..."
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 40px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              )}

              {loadingBranches ? (
                <div style={{ textAlign: 'center', color: '#64748b', padding: '30px 0' }}>
                  Đang tải danh sách phân hiệu...
                </div>
              ) : branches.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#64748b', padding: '30px 0' }}>
                  <Icon name="info" size={32} />
                  <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>Trường này hiện chưa có phân hiệu nào.</p>
                </div>
              ) : filteredBranches.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '30px 0', fontSize: '14px' }}>
                  Không tìm thấy phân hiệu phù hợp.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto' }}>
                  {filteredBranches.map(b => (
                    <button
                      key={b.id}
                      onClick={() => onSelect(
                        selectedSchool!.id,
                        selectedSchool!.code,
                        selectedSchool!.name,
                        String(b.id),
                        b.code,
                        b.name
                      )}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px 18px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = '#2563eb';
                        e.currentTarget.style.backgroundColor = '#eff6ff';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = '#e2e8f0';
                        e.currentTarget.style.backgroundColor = '#ffffff';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          backgroundColor: '#ecfdf5',
                          color: '#059669',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          overflow: 'hidden'
                        }}>
                          {b.logo ? (
                            <img
                              src={b.logo}
                              alt={b.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <Icon name="domain" size={22} />
                          )}
                        </div>
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b' }}>{b.name}</div>
                          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <span>Mã cơ sở: <strong>{b.code}</strong></span>
                            {b.address && (
                              <>
                                <span>•</span>
                                <span>{b.address}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: '#2563eb',
                        fontWeight: 600,
                        fontSize: '13px'
                      }}>
                        <span>Chọn</span>
                        <Icon name="arrow_forward" size={16} />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
