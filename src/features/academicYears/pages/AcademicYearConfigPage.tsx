import { useState, type FormEvent } from 'react';
import { ArrowLeft, CalendarDays, Save } from 'lucide-react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { api } from '../../../services/api';
import { useAsync } from '../../../hooks/useAsync';
import { useBusy } from '../../../hooks/useBusy';
import { useNotice } from '../../../hooks/useNotice';
import { displayToast } from '../../../utils/toast';
import { toProblem } from '../../../utils/problem';
import { canManageAcademicYears } from '../../../utils/jwt';
import { validateAcademicYear, validateAcademicTerms, YEAR_STATUS, TERM_STATUS, type CalendarErrors } from '../../../utils/academicYear';
import type { AcademicYearDetail } from '../../../types';
import type { AdminOutletContext } from '../../../layouts/AdminLayout';
import './AcademicYearPages.css';

export const AcademicYearConfigPage = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useAsync(() => api.academicYear.get(id), [id]);
  if (loading) return <main className="academic-page academic-loading" role="status">Đang tải năm học...</main>;
  if (error || !data?.data) return <main className="academic-page">
    <p className="academic-error" role="alert">{error ? toProblem(error).message : 'Không tìm thấy năm học.'}</p>
    <button className="academic-button academic-button--secondary" onClick={reload}>Thử lại</button>
    <button className="academic-button academic-button--secondary" onClick={() => navigate('/academic-years')}>Về danh sách</button>
  </main>;
  return <AcademicYearEditor key={`${data.data.id}-${data.data.version}`} year={data.data} reload={reload} onBack={() => navigate('/academic-years')} />;
};

function AcademicYearEditor({ year, reload, onBack }: { year: AcademicYearDetail; reload: () => void; onBack: () => void }) {
  const { reloadActiveAcademicYear } = useOutletContext<AdminOutletContext>();
  const readOnly = year.status === 'CLOSED' || !canManageAcademicYears();
  const [draft, setDraft] = useState({ name: year.name, startDate: year.startDate, endDate: year.endDate });
  const [terms, setTerms] = useState(() => [...year.semesters].sort((a, b) => a.order - b.order));
  const [errors, setErrors] = useState<CalendarErrors>({});
  const [message, setMessage] = useState('');
  const [conflict, setConflict] = useState(false);
  const [busy, runExclusive] = useBusy();
  const notice = useNotice();
  const dirty = draft.name !== year.name || draft.startDate !== year.startDate || draft.endDate !== year.endDate ||
    terms.some(term => {
      const original = year.semesters.find(item => item.id === term.id);
      return term.name !== original?.name || term.startDate !== original?.startDate || term.endDate !== original?.endDate;
    });
  const handleError = (error: unknown) => {
    const problem = toProblem(error);
    setErrors(problem.fieldErrors ?? {});
    setMessage(problem.message);
    setConflict(problem.code === 'CONCURRENCY_CONFLICT');
  };
  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (readOnly) return;
    const found = { ...validateAcademicYear(draft), ...validateAcademicTerms(terms, draft.startDate, draft.endDate) };
    setErrors(found);
    setMessage('');
    if (Object.keys(found).length) return;
    void runExclusive(async () => {
      try {
        await api.academicYear.update(year.id, {
          ...draft, name: draft.name.trim(), version: year.version,
          terms: terms.map(term => ({ order: term.order, name: term.name.trim(), startDate: term.startDate, endDate: term.endDate })),
        });
        reloadActiveAcademicYear();
        displayToast('success', 'Thành công', 'Đã lưu năm học và học kỳ.');
        reload();
      } catch (error) { handleError(error); }
    });
  };
  const changeStatus = (action: 'activate' | 'close', termId?: string) => {
    if (readOnly || dirty) return;
    const explanation = action === 'activate'
      ? 'Áp dụng năm học này cho toàn hệ thống? Hệ thống chỉ có một năm học đang áp dụng.'
      : termId ? 'Kết thúc học kỳ này? Sau khi kết thúc, học kỳ chỉ được xem và không thể mở lại.'
        : 'Kết thúc năm học và các học kỳ còn mở? Toàn bộ lịch sẽ chỉ được xem và không thể mở lại.';
    notice.confirm(explanation, () => {
      void runExclusive(async () => {
        setMessage('');
        setErrors({});
        try {
          if (termId) await api.academicYear.closeTerm(year.id, termId);
          else await api.academicYear[action](year.id);
          if (!termId) reloadActiveAcademicYear();
          displayToast('success', 'Thành công', 'Đã cập nhật trạng thái.');
          reload();
        } catch (error) { handleError(error); }
      });
    }, action === 'activate' ? 'Áp dụng' : 'Kết thúc');
  };
  const leave = () => dirty ? notice.confirm('Bạn có thay đổi chưa lưu. Rời trang và bỏ các thay đổi này?', onBack, 'Rời trang') : onBack();

  return <main className="academic-page">
    <header className="academic-page__heading">
      <button className="academic-icon-button" type="button" aria-label="Quay lại danh sách" disabled={busy} onClick={leave}><ArrowLeft size={18} /></button>
      <div><p className="academic-eyebrow">Năm học và học kỳ</p><h1>{readOnly ? 'Chi tiết năm học' : 'Cấu hình năm học'}</h1><p className="academic-page__subtitle">Lịch dùng chung toàn hệ thống. Mã năm học: {year.code}.</p></div>
      <span className={`academic-status academic-status--${year.status.toLowerCase()}`}>{YEAR_STATUS[year.status]}</span>
    </header>
    {readOnly && <p className="academic-readonly-note">{year.status === 'CLOSED' ? 'Năm học đã kết thúc. Thông tin chỉ được xem và không thể mở lại.' : 'Bạn có quyền xem lịch năm học.'}</p>}
    {(message || Object.keys(errors).length > 0) && <div className="academic-error academic-error--summary" role="alert"><strong>{message || 'Vui lòng kiểm tra các trường bên dưới.'}</strong><ul>{Object.entries(errors).map(([key, text]) => <li key={key}><a href={`#calendar-${key}`}>{text}</a></li>)}</ul>{conflict && <button type="button" className="academic-button academic-button--secondary" onClick={() => notice.confirm('Tải dữ liệu mới và bỏ các thay đổi chưa lưu?', reload, 'Tải lại')}>Tải dữ liệu mới</button>}</div>}
    <form className="academic-form" onSubmit={save} noValidate aria-busy={busy}>
      <fieldset className="academic-form-lock" disabled={readOnly || busy}>
        <section className="academic-section">
          <div className="academic-section__title"><CalendarDays size={18} /><h2>Thông tin năm học</h2></div>
          <div className="academic-fields">
            {(['name', 'startDate', 'endDate'] as const).map(key => <label className={`academic-field ${key === 'name' ? 'academic-field--wide' : ''}`} key={key}>
              <span>{key === 'name' ? 'Tên năm học' : key === 'startDate' ? 'Ngày bắt đầu' : 'Ngày kết thúc'} <b>*</b></span>
              <input id={`calendar-${key}`} type={key === 'name' ? 'text' : 'date'} required maxLength={key === 'name' ? 9 : undefined} value={draft[key]} aria-invalid={Boolean(errors[key])} aria-describedby={errors[key] ? `error-${key}` : undefined} onChange={event => setDraft({ ...draft, [key]: event.target.value })} />
              {errors[key] && <small className="academic-field-error" id={`error-${key}`}>{errors[key]}</small>}
            </label>)}
          </div>
        </section>
        <section className="academic-section">
          <div className="academic-section__title"><CalendarDays size={18} /><h2>Lịch học kỳ</h2></div>
          <p className="academic-page__subtitle">Học kỳ II bắt đầu sau khi học kỳ I kết thúc. Học kỳ đã kết thúc được giữ nguyên khi lưu.</p>
          <div className="academic-terms" id="calendar-terms">
            {terms.map((term, index) => <div key={term.id}>
              <fieldset className="academic-term" disabled={term.status === 'CLOSED'}>
                <legend>Học kỳ {term.order === 1 ? 'I' : 'II'} · {TERM_STATUS[term.status]}</legend>
                <div className="academic-fields academic-fields--term">
                  {(['name', 'startDate', 'endDate'] as const).map(key => {
                    const field = `terms[${index}].${key}`;
                    return <label className="academic-field" key={key}>
                      <span>{key === 'name' ? 'Tên học kỳ' : key === 'startDate' ? 'Ngày bắt đầu' : 'Ngày kết thúc'} <b>*</b></span>
                      <input id={`calendar-${field}`} type={key === 'name' ? 'text' : 'date'} required maxLength={key === 'name' ? 100 : undefined} min={key === 'name' ? undefined : draft.startDate} max={key === 'name' ? undefined : draft.endDate} value={term[key] ?? ''} aria-invalid={Boolean(errors[field])} aria-describedby={errors[field] ? `error-${field}` : undefined} onChange={event => setTerms(terms.map((item, i) => i === index ? { ...item, [key]: event.target.value } : item))} />
                      {errors[field] && <small className="academic-field-error" id={`error-${field}`}>{errors[field]}</small>}
                    </label>;
                  })}
                </div>
              </fieldset>
              {!readOnly && year.status === 'ACTIVE' && term.status !== 'CLOSED' && <div className="academic-actions"><button className="academic-button academic-button--secondary" type="button" disabled={busy || dirty || terms.some(other => other.order < term.order && other.status !== 'CLOSED')} onClick={() => changeStatus('close', term.id)}>Kết thúc học kỳ {term.order === 1 ? 'I' : 'II'}</button></div>}
            </div>)}
          </div>
        </section>
      </fieldset>
      <div className="academic-actions">
        <button className="academic-button academic-button--secondary" type="button" disabled={busy} onClick={leave}>Quay lại</button>
        {!readOnly && <button className="academic-button academic-button--primary" type="submit" disabled={busy || conflict}><Save size={16} />{busy ? 'Đang xử lý...' : 'Lưu năm học và học kỳ'}</button>}
      </div>
    </form>
    {!readOnly && <section className="academic-section">
      <h2 className="academic-lifecycle-title">Trạng thái năm học</h2>
      <p className="academic-page__subtitle">{dirty ? 'Lưu các thay đổi trước khi chuyển trạng thái.' : year.status === 'DRAFT' ? 'Chỉ áp dụng khi đủ lịch hai học kỳ và không có năm học khác đang áp dụng.' : 'Kết thúc năm học sẽ khóa lịch năm học và toàn bộ học kỳ.'}</p>
      <div className="academic-actions"><button className={`academic-button ${year.status === 'DRAFT' ? 'academic-button--primary' : 'academic-button--danger'}`} disabled={busy || dirty || conflict} onClick={() => changeStatus(year.status === 'DRAFT' ? 'activate' : 'close')}>{year.status === 'DRAFT' ? 'Áp dụng năm học' : 'Kết thúc năm học'}</button></div>
    </section>}
    {notice.dialog}
  </main>;
}
