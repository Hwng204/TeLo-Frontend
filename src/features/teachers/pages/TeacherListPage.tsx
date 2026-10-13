import { useState } from 'react';
import { Field, PcbButton, SelectField } from '../../../components/pcb';
import { PageHeader } from '../../../components/common/PageHeader';
import { Pager } from '../../../components/common/Pager';
import { TableState } from '../../../components/common/TableState';
import { useAsync, useDebounce, useDirectoryScope } from '../../../hooks';
import { api } from '../../../services/api';
import { toProblem } from '../../../utils/problem';
import { formatDay } from '../../../utils/directory';
import { useAdminAcademicYear } from '../../../contexts/AdminAcademicYearContext';
import './TeacherListPage.css';

const employmentLabels: Record<string, string> = {
  WORKING: 'Đang công tác', ON_LEAVE: 'Đang nghỉ phép', RESIGNED: 'Đã nghỉ việc', INACTIVE: 'Ngừng hoạt động',
};

export function TeacherListPage() {
  const context = useAdminAcademicYear();
  return <TeacherDirectory key={context?.year?.id ?? 'default'} />;
}

/** Profiles entered by the selected year's end; employment status remains current. */
function TeacherDirectory() {
  const scope = useDirectoryScope();
  const yearContext = useAdminAcademicYear();
  const academicYearId = yearContext?.year ? Number(yearContext.year.id) : undefined;
  const branches = useAsync(async () => scope.schoolId ? api.teacherDirectory.branches(scope.schoolId) : null, [scope.schoolId]);
  const [pickedBranch, setBranch] = useState<number>();
  const branchId = branches.data?.items.find(branch => branch.id === pickedBranch)?.id ?? branches.data?.items[0]?.id;
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const search = useDebounce(keyword, 300);
  const ready = Boolean(scope.schoolId && branchId && academicYearId && yearContext?.ready);
  const list = useAsync(async () => ready ? api.teacherDirectory.list(scope.schoolId!, branchId!, {
    academicYearId, search: search.trim() || undefined, employmentStatus: status || undefined, page, pageSize,
  }) : null, [ready, scope.schoolId, branchId, academicYearId, search, status, page, pageSize]);
  const items = list.data?.items ?? [];
  const error = list.error ?? branches.error ?? scope.schoolsError ?? yearContext?.error;
  const filtered = Boolean(keyword || status);
  const lastPage = Math.max(1, Math.ceil((list.data?.totalCount ?? 0) / pageSize));
  if (!list.loading && list.data && page > lastPage) setPage(lastPage);
  const reset = () => { setKeyword(''); setStatus(''); setPage(1); };

  return <>
    <PageHeader title="Quản lý giáo viên" inline />
    <div className="sep-page sep-page--flush teacher-directory">
      <div className="sep-toolbar">
        <div className="sep-toolbar__filters">
          <SelectField label="Trường" hideLabel value={scope.schoolId ?? ''} onChange={event => {
            scope.setSchool(Number(event.target.value)); setBranch(undefined); reset();
          }}>
            {scope.schools.map(school => <option key={school.id} value={school.id}>{school.name}</option>)}
          </SelectField>
          <SelectField label="Phân hiệu" hideLabel value={branchId ?? ''} disabled={branches.loading || !branches.data?.items.length}
            placeholder={branches.loading ? 'Đang tải phân hiệu…' : 'Chưa có phân hiệu'} onChange={event => { setBranch(Number(event.target.value)); reset(); }}>
            {branches.data?.items.map(branch => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
          </SelectField>
          <Field label="Tìm giáo viên" hideLabel type="search" leading="search" placeholder="Tìm theo mã, họ tên" value={keyword}
            fieldClassName="sep-toolbar__search" onChange={event => { setKeyword(event.target.value); setPage(1); }} />
          <SelectField label="Trạng thái công tác" hideLabel value={status} onChange={event => { setStatus(event.target.value); setPage(1); }}>
            <option value="">Tất cả trạng thái</option>
            {Object.entries(employmentLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </SelectField>
          {filtered && <PcbButton variant="ghost" size="sm" onClick={reset}>Xóa lọc</PcbButton>}
        </div>
      </div>
      {Boolean(error) && <div className="sep-alert" role="alert">{toProblem(error).message}
        <PcbButton variant="ghost" size="sm" onClick={() => { list.reload(); branches.reload(); }}>Thử lại</PcbButton>
      </div>}
      <div className="pcb-table-wrap">
        <table className="pcb-table">
          <thead><tr><th>STT</th><th>Mã cán bộ</th><th>Họ và tên</th><th>Tổ chuyên môn</th><th>Môn dạy chính</th><th>Ngày vào trường</th><th title="Trạng thái công tác hiện tại">Trạng thái công tác</th></tr></thead>
          <tbody>{items.map((teacher, index) => <tr key={teacher.id}>
            <td>{(page - 1) * pageSize + index + 1}</td><td>{teacher.staffCode ?? '—'}</td>
            <td className="teacher-directory-name">{teacher.fullName}</td><td>{teacher.department ?? '—'}</td><td>{teacher.mainSubjectName ?? '—'}</td>
            <td className="sep-nowrap">{formatDay(teacher.joinedOn)}</td>
            <td><span className={`teacher-employment teacher-employment--${teacher.employmentStatus.toLowerCase()}`}>{employmentLabels[teacher.employmentStatus] ?? teacher.employmentStatus}</span></td>
          </tr>)}</tbody>
        </table>
        <TableState loading={list.loading || branches.loading || !scope.ready || Boolean(yearContext && !yearContext.ready && !yearContext.error)} failed={Boolean(error)} empty={!items.length} columns={7}
          title={!academicYearId ? 'Chưa có năm học để xem.' : !branchId ? 'Trường chưa có phân hiệu.' : filtered ? 'Không có giáo viên phù hợp với bộ lọc.' : 'Chưa có giáo viên vào trường trước thời điểm kết thúc năm học này.'} />
      </div>
      {Boolean(list.data?.totalCount) && <Pager page={page} pageSize={pageSize} totalCount={list.data!.totalCount} itemLabel="giáo viên"
        onChange={setPage} onPageSizeChange={size => { setPageSize(size); setPage(1); }} />}
    </div>
  </>;
}
