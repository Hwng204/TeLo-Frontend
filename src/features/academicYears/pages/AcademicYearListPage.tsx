import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { api } from '../../../services/api';
import { useAsync } from '../../../hooks/useAsync';
import { toProblem } from '../../../utils/problem';
import { canManageAcademicYears } from '../../../utils/jwt';
import { YEAR_STATUS } from '../../../utils/academicYear';
import './AcademicYearPages.css';

const formatDate = (value: string) => value ? value.slice(0, 10).split('-').reverse().join('/') : '—';

export const AcademicYearListPage = () => {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState({ search: '', status: '', page: 1 });
  const { data, loading, error, reload } = useAsync(() => api.academicYear.list({
    search: query.search || undefined, status: query.status || undefined, page: query.page, pageSize: 20,
  }), [query.search, query.status, query.page]);
  const page = data?.data;
  const editable = canManageAcademicYears();

  return <main className="academic-page">
    <header className="academic-page__heading">
      <div><h1>Năm học và học kỳ</h1><p className="academic-page__subtitle">Quản lý lịch dùng chung toàn hệ thống. Chỉ một năm học được áp dụng tại một thời điểm.</p></div>
      {editable && <Link id="btn-create-academic-year" className="academic-button academic-button--primary" to="/academic-years/new"><Plus size={16} />Tạo năm học</Link>}
    </header>
    <form className="academic-filters" onSubmit={event => { event.preventDefault(); setQuery({ ...query, search: search.trim(), page: 1 }); }}>
      <label className="academic-field"><span>Tìm tên năm học</span><input type="search" maxLength={100} value={search} onChange={event => setSearch(event.target.value)} placeholder="Ví dụ: 2026-2027" /></label>
      <label className="academic-field"><span>Trạng thái</span><select value={query.status} onChange={event => setQuery({ ...query, status: event.target.value, page: 1 })}>
        <option value="">Tất cả trạng thái</option>{Object.entries(YEAR_STATUS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select></label>
      <button className="academic-button academic-button--secondary" type="submit"><Search size={16} />Tìm kiếm</button>
    </form>
    {loading ? <p className="academic-loading" role="status">Đang tải danh sách năm học...</p> : error ? <div className="academic-error" role="alert">{toProblem(error).message}<button className="academic-button academic-button--secondary" onClick={reload}>Thử lại</button></div> : !page?.items.length ?
      <div className="academic-section" role="status"><p>Không có năm học phù hợp.</p>{query.page > 1 && <button className="academic-button academic-button--secondary" onClick={() => setQuery({ ...query, page: 1 })}>Về trang đầu</button>}</div> : <>
        <div className="academic-table-wrap">
          <table className="academic-table">
            <caption className="academic-sr-only">Danh sách năm học và trạng thái áp dụng</caption>
            <thead><tr><th scope="col">Năm học</th><th scope="col">Thời gian</th><th scope="col">Học kỳ</th><th scope="col">Trạng thái</th><th scope="col">Thao tác</th></tr></thead>
            <tbody>{page.items.map(year => <tr key={year.id}>
              <th scope="row">{year.name}<small className="academic-year-code">{year.code}</small></th><td>{formatDate(year.startDate)} – {formatDate(year.endDate)}</td><td>{year.semesterCount}/2</td>
              <td><span className={`academic-status academic-status--${year.status.toLowerCase()}`}>{YEAR_STATUS[year.status]}</span></td>
              <td><Link className="academic-table-link" to={`/academic-years/${year.id}`}>{year.status === 'CLOSED' || !editable ? 'Xem chi tiết' : 'Cấu hình'}</Link></td>
            </tr>)}</tbody>
          </table>
        </div>
        <nav className="academic-pagination" aria-label="Phân trang năm học">
          <span>Trang {page.page}/{page.totalPages} · {page.totalCount} năm học</span>
          <button className="academic-button academic-button--secondary" disabled={query.page <= 1} onClick={() => setQuery({ ...query, page: query.page - 1 })}>Trang trước</button>
          <button className="academic-button academic-button--secondary" disabled={query.page >= page.totalPages} onClick={() => setQuery({ ...query, page: query.page + 1 })}>Trang sau</button>
        </nav>
      </>}
  </main>;
};
