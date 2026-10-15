import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Field, Icon, PcbButton, SelectField } from '../../../components/pcb';
import { PageHeader } from '../../../components/common/PageHeader';
import { Pager } from '../../../components/common/Pager';
import { StatusTabs } from '../../../components/common/StatusTabs';
import { TableState } from '../../../components/common/TableState';
import { useAsync, useDebounce } from '../../../hooks';
import { formatDate } from '../../../utils/formatters';
import { toProblem } from '../../../utils/problem';
import { examPackageApi } from '../examPackageApi';
import { packageStatuses, type PackageQuery } from '../types';
import '../examPackages.css';

export const ExamPackageListPage = () => {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const search = useDebounce(keyword, 300);
  const [filters, setFilters] = useState({ status: '', purpose: 'exam', year: '', subject: '', grade: '' });
  const [page, setPage] = useState(1); const [pageSize, setPageSize] = useState(10);
  const options = useAsync(examPackageApi.options, []);
  const query: PackageQuery = { page, pageSize, keyword: search.trim() || undefined, status: filters.status || undefined, purpose: filters.purpose || undefined,
    academicYearId: Number(filters.year) || undefined, subjectId: Number(filters.subject) || undefined, gradeLevelId: Number(filters.grade) || undefined };
  const list = useAsync(() => examPackageApi.list(query), [page, pageSize, search, filters]);
  const change = (key: keyof typeof filters, value: string) => { setFilters(current => ({ ...current, [key]: value })); setPage(1); };
  const matrices = options.data?.matrices ?? [];
  const years = options.data?.years?.map(year => [year.id, year.name] as const)
    ?? [...new Map(matrices.map(m => [m.academicYearId, m.academicYearName])).entries()];
  const subjects = [...new Map(matrices.map(m => [m.subjectId, m.subjectName])).entries()];
  const grades = [...new Map(matrices.map(m => [m.gradeLevelId, m.gradeLevelName])).entries()];
  return <>
    <PageHeader title="Kho đề" />
    <div className="sep-page exam-package-page">
      <StatusTabs label="Trạng thái đề" tabs={[{ value: '', label: 'Tất cả' }, ...Object.entries(packageStatuses).map(([value, label]) => ({ value, label }))]} value={filters.status} onChange={value => change('status', value)} />
      <div className="sep-toolbar">
        <div className="sep-toolbar__filters">
          <Field label="Tìm tên đề" hideLabel leading="search" placeholder="Tìm tên đề" value={keyword} onChange={e => { setKeyword(e.target.value); setPage(1); }} />
          <SelectField label="Mục đích" hideLabel value={filters.purpose} onChange={e => change('purpose', e.target.value)}><option value="">Mọi mục đích</option><option value="exam">Đề thi</option><option value="practice">Đề ôn tập</option></SelectField>
          <SelectField label="Năm học" hideLabel value={filters.year} onChange={e => change('year', e.target.value)}><option value="">Mọi năm học</option>{years.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</SelectField>
          <SelectField label="Môn" hideLabel value={filters.subject} onChange={e => change('subject', e.target.value)}><option value="">Mọi môn</option>{subjects.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</SelectField>
          <SelectField label="Khối" hideLabel value={filters.grade} onChange={e => change('grade', e.target.value)}><option value="">Mọi khối</option>{grades.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</SelectField>
          <PcbButton variant="ghost" size="sm" onClick={() => { setKeyword(''); setFilters({ status: '', purpose: 'exam', year: '', subject: '', grade: '' }); setPage(1); }}>Xóa lọc</PcbButton>
        </div>
        {options.data?.canCreate && <PcbButton onClick={() => navigate('/exam-packages/new')}><Icon name="add" />Tạo đề tự động</PcbButton>}
      </div>
      {Boolean(list.error ?? options.error) && <div className="sep-alert" role="alert">{toProblem(list.error ?? options.error).message}<PcbButton variant="ghost" onClick={() => { list.reload(); options.reload(); }}>Thử lại</PcbButton></div>}
      <div className="pcb-table-wrap"><table className="pcb-table sep-table--dense exam-package-table"><thead><tr><th>STT</th><th>Tên đề</th><th>Môn / Khối</th><th>Năm học</th><th>Số câu</th><th>Người review</th><th>Trạng thái</th><th>Cập nhật</th><th>Hành động</th></tr></thead>
        <tbody>{(list.data?.items ?? []).map((item, index) => <tr key={item.id}><td>{(page - 1) * pageSize + index + 1}</td>
          <td><Link to={`/exam-packages/${item.id}`}>{item.name}</Link><div className="sep-muted">{item.purpose === 'practice' ? 'Ôn tập' : 'Đề thi'} · {item.matrixName}</div></td>
          <td>{item.subjectName}<div className="sep-muted">{item.gradeLevelName}</div></td><td>{item.academicYearName}</td><td>{item.questionCount}</td><td>{item.reviewerName ?? 'Chưa giao'}</td>
          <td><span className={`sep-status sep-status--${item.status}`}>{packageStatuses[item.status] ?? item.status}</span></td><td>{formatDate(item.updatedAt ?? item.createdAt)}</td>
          <td><PcbButton variant="ghost" size="sm" onClick={() => navigate(`/exam-packages/${item.id}`)}><Icon name="visibility" size={18} />Chi tiết</PcbButton></td></tr>)}</tbody></table></div>
      <TableState loading={list.loading} failed={Boolean(list.error)} empty={!list.data?.items.length} columns={9} title="Chưa có đề phù hợp" hint="Thay đổi bộ lọc hoặc tạo đề tự động từ ma trận đã duyệt." />
      <Pager page={page} pageSize={pageSize} totalCount={list.data?.totalCount ?? 0} itemLabel="đề" onChange={setPage} onPageSizeChange={value => { setPageSize(value); setPage(1); }} />
    </div>
  </>;
};
