import React, { useState } from 'react';
import { PageHeader } from '../../../components/common/PageHeader';
import { Icon, Field } from '../../../components/pcb';
import { Pager } from '../../../components/common/Pager';
import { useAsync } from '../../../hooks/useAsync';
import { useDebounce } from '../../../hooks/useDebounce';
import { api } from '../../../services/api';
import { storage } from '../../../utils/storage';
import { BranchSelectModal } from '../../../components/common/BranchSelectModal';

export const TeacherListPage: React.FC = () => {
  const [selected, setSelected] = useState(storage.getSelectedBranch);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  const schoolId = selected.schoolId ? Number(selected.schoolId) : undefined;
  const branchId = selected.branchId ? Number(selected.branchId) : undefined;

  const teachersAsync = useAsync(
    async () => (schoolId && branchId ? api.directory.teachers(schoolId, branchId) : null),
    [schoolId, branchId]
  );

  const rawItems = teachersAsync.data?.items ?? [];
  const filtered = rawItems.filter(t => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return true;
    return t.fullName.toLowerCase().includes(q) || (t.staffCode && t.staffCode.toLowerCase().includes(q));
  });

  const totalCount = filtered.length;
  const pagedItems = filtered.slice((page - 1) * pageSize, page * pageSize);

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
    setPage(1);
  };

  if (!selected.branchId) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', maxWidth: '600px', margin: '40px auto' }}>
        <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '40px', border: '1px solid #e2e8f0' }}>
          <Icon name="person" size={40} />
          <h2 style={{ fontSize: '20px', margin: '16px 0 8px' }}>Chưa chọn phân hiệu để quản lý giáo viên</h2>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
            Vui lòng chọn trường và phân hiệu trước khi xem danh sách giáo viên.
          </p>
          <button
            onClick={() => setShowModal(true)}
            style={{
              backgroundColor: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 20px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Chọn phân hiệu ngay
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

  return (
    <>
      <PageHeader title="Quản lý giáo viên" inline />

      <div className="sep-page sep-page--flush">
        <div className="sep-toolbar">
          <div className="sep-toolbar__filters" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Active Branch indicator */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#1e40af',
              fontWeight: 600
            }}>
              <Icon name="domain" size={16} />
              <span>Phân hiệu: {selected.branchName} ({selected.schoolName})</span>
              <button
                type="button"
                onClick={() => setShowModal(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563eb',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 700,
                  textDecoration: 'underline',
                  padding: '0 4px'
                }}
              >
                Đổi
              </button>
            </div>

            <div style={{ width: '280px' }}>
              <Field
                label="Tìm kiếm"
                hideLabel
                leading="search"
                placeholder="Tìm theo tên hoặc mã giáo viên..."
                value={search}
                onChange={e => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </div>

        <div className="sep-table-container">
          <table className="sep-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>STT</th>
                <th style={{ width: '160px' }}>Mã giáo viên</th>
                <th>Họ và tên</th>
                <th style={{ width: '180px' }}>Trạng thái công tác</th>
                <th style={{ width: '200px' }}>Phân hiệu trực thuộc</th>
              </tr>
            </thead>
            <tbody>
              {teachersAsync.loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                    Đang tải danh sách giáo viên...
                  </td>
                </tr>
              ) : pagedItems.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                    {search ? 'Không tìm thấy giáo viên nào phù hợp với từ khóa.' : 'Phân hiệu chưa có dữ liệu giáo viên nào.'}
                  </td>
                </tr>
              ) : (
                pagedItems.map((teacher, index) => (
                  <tr key={teacher.id}>
                    <td>{(page - 1) * pageSize + index + 1}</td>
                    <td className="sep-nowrap font-mono">
                      <strong>{teacher.staffCode || '—'}</strong>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{teacher.fullName}</div>
                    </td>
                    <td>
                      <span style={{
                        backgroundColor: teacher.employmentStatus === 'ACTIVE' || !teacher.employmentStatus ? '#ecfdf5' : '#f1f5f9',
                        color: teacher.employmentStatus === 'ACTIVE' || !teacher.employmentStatus ? '#059669' : '#64748b',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        display: 'inline-block'
                      }}>
                        {teacher.employmentStatus === 'ACTIVE' || !teacher.employmentStatus ? 'Đang công tác' : teacher.employmentStatus}
                      </span>
                    </td>
                    <td className="sep-nowrap" style={{ color: '#64748b' }}>
                      {selected.branchName}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalCount > 0 && (
          <div style={{ padding: '16px 20px', borderTop: '1px solid #e2e8f0' }}>
            <Pager
              page={page}
              pageSize={pageSize}
              totalCount={totalCount}
              itemLabel="giáo viên"
              onChange={setPage}
              onPageSizeChange={setPageSize}
              pageSizes={[10, 20, 50]}
            />
          </div>
        )}
      </div>

      {showModal && (
        <BranchSelectModal
          onClose={() => setShowModal(false)}
          onSelect={handleBranchSelect}
        />
      )}
    </>
  );
};
