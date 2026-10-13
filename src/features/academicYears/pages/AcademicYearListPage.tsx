import { useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { PageHeader } from '../../../components/common/PageHeader';
import { Pager } from '../../../components/common/Pager';
import { RowAction, RowActionButton } from '../../../components/common/RowAction';
import { TableState } from '../../../components/common/TableState';
import { Field, Icon, PcbButton, SelectField } from '../../../components/pcb';
import { useAsync } from '../../../hooks/useAsync';
import { useBusy } from '../../../hooks/useBusy';
import { useDebounce } from '../../../hooks/useDebounce';
import type { AdminOutletContext } from '../../../layouts/AdminLayout';
import { api } from '../../../services/api';
import type { AcademicYearListItem } from '../../../types';
import { canManageAcademicYears } from '../../../utils/jwt';
import { YEAR_STATUS } from '../../../utils/academicYear';
import { problemLines, toProblem } from '../../../utils/problem';
import { displayToast } from '../../../utils/toast';
import { AcademicYearActionDialog, type YearAction } from '../components/AcademicYearActionDialog';
import './AcademicYearPages.css';

const formatDate = (value: string) => value ? value.slice(0, 10).split('-').reverse().join('/') : '—';

export const AcademicYearListPage = () => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [confirmation, setConfirmation] = useState<{ year: AcademicYearListItem; action: YearAction } | null>(null);
  const debounced = useDebounce(search, 300);
  const result = useAsync(() => api.academicYear.list({ search: debounced.trim() || undefined, status: status || undefined, page, pageSize }), [debounced, status, page, pageSize]);
  const directory = result.data?.data;
  const editable = canManageAcademicYears();
  const { reloadActiveAcademicYear } = useOutletContext<AdminOutletContext>();
  const [busy, run] = useBusy();
  const hasFilters = !!search.trim() || !!status;
  if (directory && !result.loading && !result.error && directory.page === page && directory.pageSize === pageSize) {
    const last = Math.max(1, Math.ceil(directory.totalCount / pageSize));
    if (page > last) setPage(last);
  }
  const clearFilters = () => { setSearch(''); setStatus(''); setPage(1); };
  const applyAction = () => {
    if (!confirmation) return;
    const { year, action } = confirmation;
    void run(async () => {
      try {
        if (action === 'ACTIVATE') await api.academicYear.activate(year.id);
        else await api.academicYear.close(year.id);
        displayToast('success', 'Thành công', action === 'ACTIVATE' ? 'Đã áp dụng năm học ' + year.name + '.' : 'Đã kết thúc năm học ' + year.name + '.');
        result.reload();
        reloadActiveAcademicYear();
      } catch (error) {
        displayToast('error', 'Lỗi', problemLines(toProblem(error)).join(' '), 5);
        result.reload();
        reloadActiveAcademicYear();
      } finally { setConfirmation(null); }
    });
  };
  return <main className="sep-page academic-page">
    <div className="academic-heading">
      <PageHeader title="Quản lý năm học" inline />
      {editable && <Link id="btn-create-academic-year" className="pcb-btn pcb-btn--primary" to="/academic-years/new"><Icon name="add" />Thêm năm học</Link>}
    </div>
    <section className="academic-list-panel" aria-label="Danh sách năm học" aria-busy={result.loading}>
      <div className="academic-toolbar">
        <Field label="Tìm năm học" hideLabel type="search" leading="search" placeholder="Tìm theo tên năm học…" maxLength={100}
          value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} />
        <SelectField label="Trạng thái" hideLabel value={status} onChange={event => { setStatus(event.target.value); setPage(1); }}>
          <option value="">Tất cả trạng thái</option>
          {Object.entries(YEAR_STATUS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </SelectField>
        {hasFilters && <RowActionButton icon="filter_alt_off" label="Bỏ bộ lọc" onClick={clearFilters} />}
      </div>
      <div className="academic-feedback">
        {!!result.error && <div className="sep-alert" role="alert">{toProblem(result.error).message}<PcbButton variant="secondary" onClick={result.reload}>Thử lại</PcbButton></div>}
        <TableState loading={result.loading && !directory?.items.length} failed={!!result.error} empty={!directory?.items.length}
          columns={6} title={hasFilters ? 'Không tìm thấy năm học' : 'Chưa có năm học'}
          action={hasFilters ? <PcbButton variant="secondary" onClick={clearFilters}>Bỏ bộ lọc</PcbButton> : editable ? <Link className="pcb-btn pcb-btn--primary" to="/academic-years/new"><Icon name="add" />Thêm năm học</Link> : undefined} />
      </div>
      {!!directory?.items.length && <div className="pcb-table-wrap" tabIndex={0} role="region" aria-label="Bảng năm học">
        <table className="pcb-table academic-table">
          <caption className="academic-sr-only">Danh sách năm học và trạng thái áp dụng</caption>
          <thead><tr><th scope="col">Năm học</th><th scope="col">Ngày bắt đầu</th><th scope="col">Ngày kết thúc</th><th scope="col">Học kỳ</th><th scope="col">Trạng thái</th><th scope="col">Thao tác</th></tr></thead>
          <tbody>{directory.items.map(year => <tr key={year.id}>
            <td><strong>{year.name}</strong></td>
            <td>{formatDate(year.startDate)}</td><td>{formatDate(year.endDate)}</td><td>{year.semesterCount}/2</td>
            <td><span className={'academic-status academic-status--' + year.status.toLowerCase()}>{YEAR_STATUS[year.status]}</span></td>
            <td><div className="sep-row-actions">
              <RowAction to={'/academic-years/' + year.id} icon={year.status === 'CLOSED' || !editable ? 'visibility' : 'edit'} label={(year.status === 'CLOSED' || !editable ? 'Xem ' : 'Cấu hình ') + 'năm học ' + year.name} />
              {editable && year.status === 'DRAFT' && <RowActionButton icon="play_circle" label={'Áp dụng năm học ' + year.name} disabled={busy || result.loading || !!result.error} onClick={() => setConfirmation({ year, action: 'ACTIVATE' })} />}
              {editable && year.status === 'ACTIVE' && <span className="academic-danger-action"><RowActionButton icon="event_busy" label={'Kết thúc năm học ' + year.name} disabled={busy || result.loading || !!result.error} onClick={() => setConfirmation({ year, action: 'CLOSE' })} /></span>}
            </div></td>
          </tr>)}</tbody>
        </table>
      </div>}
      {directory && <div className="academic-list-footer"><Pager page={page} pageSize={pageSize} totalCount={directory.totalCount} itemLabel="năm học" onChange={setPage} onPageSizeChange={size => { setPageSize(size); setPage(1); }} /></div>}
    </section>
    <AcademicYearActionDialog action={confirmation?.action ?? null} yearName={confirmation?.year.name ?? ''} busy={busy} onConfirm={applyAction} onCancel={() => setConfirmation(null)} />
  </main>;
};
