import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { School } from '../../types/school';
import { Icon } from '../pcb';

interface BranchSelectModalProps {
  onClose: () => void;
  onSelect: (schoolId: string, schoolName: string, branchId: string, branchName: string) => void;
}

export const BranchSelectModal: React.FC<BranchSelectModalProps> = ({ onClose, onSelect }) => {
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSchools = async () => {
      setLoading(true);
      try {
        const res = await api.school.list({ pageSize: 100 });
        if (res.data?.items) {
          // Map SchoolItem to School just like SchoolListPage does
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
  // Real branches need to be fetched via api.school.get(schoolId) since the list only returns branchCount
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
          console.error(err);
        } finally {
          setLoadingBranches(false);
        }
      };
      fetchBranches();
    } else {
      setBranches([]);
    }
  }, [selectedSchoolId]);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'rgba(15, 23, 42, 0.4)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        backgroundColor: '#fff', borderRadius: '16px', width: '600px',
        maxHeight: '80vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>
            {selectedSchoolId ? 'Chọn phân hiệu' : 'Chọn trường để vận hành'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <Icon name="close" size={24} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: '#64748b' }}>Đang tải danh sách trường...</div>
          ) : !selectedSchoolId ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {schools.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSchoolId(s.id)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0',
                    borderRadius: '12px', cursor: 'pointer', textAlign: 'left',
                    transition: 'border-color 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#3b82f6'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                >
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b' }}>{s.name}</div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Mã trường: {s.code}</div>
                  </div>
                  <Icon name="chevron_right" size={20} />
                </button>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => setSelectedSchoolId(null)}
                  style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '14px', fontWeight: 500 }}
                >
                  <Icon name="arrow_back" size={16} /> Quay lại
                </button>
                <span style={{ color: '#94a3b8' }}>|</span>
                <span style={{ fontSize: '14px', fontWeight: 500, color: '#475569' }}>{selectedSchool?.name}</span>
              </div>

              {loadingBranches ? (
                <div style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>Đang tải danh sách phân hiệu...</div>
              ) : branches.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>Trường này chưa có phân hiệu nào.</div>
              ) : (
                branches.map(b => (
                  <button
                    key={b.id}
                    onClick={() => onSelect(selectedSchool!.id, selectedSchool!.name, String(b.id), b.name)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0',
                      borderRadius: '12px', cursor: 'pointer', textAlign: 'left',
                      transition: 'border-color 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#3b82f6'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                  >
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b' }}>{b.name}</div>
                      <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Mã cơ sở: {b.code}</div>
                    </div>
                    <Icon name="check_circle" size={20} />
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
