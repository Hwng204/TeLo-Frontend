import React, { useState } from 'react';
import { PageHeader } from '../../../components/common/PageHeader';
import { Icon, Field, PcbButton, SelectField } from '../../../components/pcb';
import { Pager } from '../../../components/common/Pager';
import { useAsync } from '../../../hooks/useAsync';
import { useDebounce } from '../../../hooks/useDebounce';
import { api } from '../../../services/api';
import { storage } from '../../../utils/storage';
import { BranchSelectModal } from '../../../components/common/BranchSelectModal';
import { useAdminAcademicYear } from '../../../contexts/AdminAcademicYearContext';
import { formatDay } from '../../../utils/directory';
import { toProblem } from '../../../utils/problem';

const employmentLabels: Record<string, string> = {
  WORKING: 'Đang công tác', ON_LEAVE: 'Đang nghỉ phép', RESIGNED: 'Đã nghỉ việc', INACTIVE: 'Ngừng hoạt động',
};

export const TeacherListPage: React.FC = () => {
  const yearContext = useAdminAcademicYear();
  const selected = storage.getSelectedBranch();
  return <TeacherDirectory key={`${yearContext?.year?.id ?? 'default'}:${selected.schoolId ?? ''}:${selected.branchId ?? ''}`} />;
};

const TeacherDirectory = () => {
  const yearContext = useAdminAcademicYear();
  const academicYearId = yearContext?.year ? Number(yearContext.year.id) : undefined;
  const [selected, setSelected] = useState(storage.getSelectedBranch);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  const schoolId = selected.schoolId ? Number(selected.schoolId) : undefined;
  const branchId = selected.branchId ? Number(selected.branchId) : undefined;
  const ready = Boolean(schoolId && branchId && academicYearId && yearContext?.ready);

  const teachersAsync = useAsync(
    async () => (ready ? api.teacherDirectory.list(schoolId!, branchId!, {
      academicYearId, search: debouncedSearch.trim() || undefined, employmentStatus: status || undefined, page, pageSize,
    }) : null),
    [ready, schoolId, branchId, academicYearId, debouncedSearch, status, page, pageSize],
  );

  const pagedItems = teachersAsync.data?.items ?? [];
  const totalCount = teachersAsync.data?.totalCount ?? 0;
  const error = teachersAsync.error ?? yearContext?.error;
  const lastPage = Math.max(1, Math.ceil(totalCount / pageSize));
  if (!teachersAsync.loading && teachersAsync.data && page > lastPage) setPage(lastPage);

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
            <SelectField label="Trạng thái công tác" hideLabel value={status} onChange={event => {
              setStatus(event.target.value);
              setPage(1);
            }}>
              <option value="">Tất cả trạng thái</option>
              {Object.entries(employmentLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </SelectField>
            {Boolean(search || status) && <PcbButton variant="ghost" size="sm" onClick={() => {
              setSearch(''); setStatus(''); setPage(1);
            }}>Xóa lọc</PcbButton>}
          </div>
        </div>

        {Boolean(error) && <div className="sep-alert" role="alert">
          {toProblem(error).message}
          <button type="button" onClick={teachersAsync.reload}>Thử lại</button>
        </div>}
        <div className="sep-table-container pcb-table-wrap">
          <table className="sep-table pcb-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>STT</th>
                <th style={{ width: '160px' }}>Mã giáo viên</th>
                <th>Họ và tên</th>
                <th>Tổ chuyên môn</th>
                <th>Môn dạy chính</th>
                <th>Ngày vào trường</th>
                <th style={{ width: '180px' }}>Trạng thái công tác</th>
                <th style={{ width: '200px' }}>Phân hiệu trực thuộc</th>
              </tr>
            </thead>
            <tbody>
              {teachersAsync.loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                    Đang tải danh sách giáo viên...
                  </td>
                </tr>
              ) : pagedItems.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
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
                    <td>{teacher.department ?? '—'}</td>
                    <td>{teacher.mainSubjectName ?? '—'}</td>
                    <td className="sep-nowrap">{formatDay(teacher.joinedOn)}</td>
                    <td>
                      <span style={{
                        backgroundColor: teacher.employmentStatus === 'WORKING' ? '#ecfdf5' : '#f1f5f9',
                        color: teacher.employmentStatus === 'WORKING' ? '#059669' : '#64748b',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        display: 'inline-block'
                      }}>
                        {employmentLabels[teacher.employmentStatus] ?? teacher.employmentStatus}
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
              onPageSizeChange={size => { setPageSize(size); setPage(1); }}
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
