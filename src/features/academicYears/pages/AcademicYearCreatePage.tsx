import { useState, type FormEvent } from 'react';
import { ArrowLeft, CalendarPlus, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import { useBusy } from '../../../hooks/useBusy';
import { displayToast } from '../../../utils/toast';
import { toProblem } from '../../../utils/problem';
import { canManageAcademicYears } from '../../../utils/jwt';
import { initialAcademicYear, initialAcademicTerms, validateAcademicYear, validateAcademicTerms, type CalendarErrors } from '../../../utils/academicYear';
import './AcademicYearPages.css';

export const AcademicYearCreatePage = () => {
  const navigate = useNavigate();
  const [year, setYear] = useState(initialAcademicYear);
  const [terms, setTerms] = useState(() => initialAcademicTerms(year.startDate, year.endDate));
  const [errors, setErrors] = useState<CalendarErrors>({});
  const [message, setMessage] = useState('');
  const [saving, runExclusive] = useBusy();
  const allowed = canManageAcademicYears();

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!allowed) return;
    const found = { ...validateAcademicYear(year), ...validateAcademicTerms(terms, year.startDate, year.endDate) };
    setErrors(found);
    setMessage('');
    if (Object.keys(found).length) return;
    void runExclusive(async () => {
      try {
        const response = await api.academicYear.create({ ...year, name: year.name.trim(), terms: terms.map(term => ({ ...term, name: term.name.trim() })) });
        if (!response.data) throw new Error('Không nhận được năm học vừa tạo.');
        displayToast('success', 'Thành công', 'Đã lưu năm học và hai học kỳ ở trạng thái bản nháp.');
        navigate(`/academic-years/${response.data.id}`, { replace: true });
      } catch (error) {
        const problem = toProblem(error);
        setErrors(problem.fieldErrors ?? {});
        setMessage(problem.message);
      }
    });
  };

  return (
    <main className="academic-page">
      <header className="academic-page__heading">
        <button className="academic-icon-button" type="button" aria-label="Quay lại danh sách" disabled={saving} onClick={() => navigate('/academic-years')}><ArrowLeft size={18} /></button>
        <div><p className="academic-eyebrow">Quản trị vận hành</p><h1>Tạo năm học</h1><p className="academic-page__subtitle">Lưu năm học và hai học kỳ cùng nhau. Lịch dùng chung cho toàn hệ thống.</p></div>
      </header>
      {!allowed && <p className="academic-error" role="alert">Bạn không có quyền quản lý năm học.</p>}
      {(message || Object.keys(errors).length > 0) && <div className="academic-error academic-error--summary" role="alert"><strong>{message || 'Vui lòng kiểm tra các trường bên dưới.'}</strong><ul>{Object.entries(errors).map(([key, text]) => <li key={key}><a href={`#calendar-${key}`}>{text}</a></li>)}</ul></div>}
      <form className="academic-form" onSubmit={submit} noValidate aria-busy={saving}>
        <fieldset className="academic-form-lock" disabled={saving || !allowed}>
          <section className="academic-section">
            <div className="academic-section__title"><CalendarPlus size={18} /><h2>Thông tin năm học</h2></div>
            <p className="academic-page__subtitle">Tên dạng 2026-2027; năm học kéo dài tối thiểu 180 ngày.</p>
            <div className="academic-fields">
              {(['name', 'startDate', 'endDate'] as const).map(key => (
                <label className={`academic-field ${key === 'name' ? 'academic-field--wide' : ''}`} key={key}>
                  <span>{key === 'name' ? 'Tên năm học' : key === 'startDate' ? 'Ngày bắt đầu' : 'Ngày kết thúc'} <b>*</b></span>
                  <input id={`calendar-${key}`} type={key === 'name' ? 'text' : 'date'} required maxLength={key === 'name' ? 9 : undefined} value={year[key]} aria-invalid={Boolean(errors[key])} aria-describedby={errors[key] ? `error-${key}` : undefined} onChange={event => setYear({ ...year, [key]: event.target.value })} />
                  {errors[key] && <small className="academic-field-error" id={`error-${key}`}>{errors[key]}</small>}
                </label>
              ))}
            </div>
          </section>
          <section className="academic-section">
            <div className="academic-section__title"><CalendarPlus size={18} /><h2>Lịch học kỳ</h2></div>
            <p className="academic-page__subtitle">Hai học kỳ nằm trong năm học. Học kỳ II bắt đầu sau khi học kỳ I kết thúc; có thể có khoảng nghỉ.</p>
            <div className="academic-terms" id="calendar-terms">
              {terms.map((term, index) => <fieldset className="academic-term" key={term.order}>
                <legend>Học kỳ {term.order === 1 ? 'I' : 'II'}</legend>
                <div className="academic-fields academic-fields--term">
                  {(['name', 'startDate', 'endDate'] as const).map(key => {
                    const field = `terms[${index}].${key}`;
                    return <label className="academic-field" key={key}>
                      <span>{key === 'name' ? 'Tên học kỳ' : key === 'startDate' ? 'Ngày bắt đầu' : 'Ngày kết thúc'} <b>*</b></span>
                      <input id={`calendar-${field}`} type={key === 'name' ? 'text' : 'date'} required maxLength={key === 'name' ? 100 : undefined} min={key === 'name' ? undefined : year.startDate} max={key === 'name' ? undefined : year.endDate} value={term[key] ?? ''} aria-invalid={Boolean(errors[field])} aria-describedby={errors[field] ? `error-${field}` : undefined} onChange={event => setTerms(terms.map((item, i) => i === index ? { ...item, [key]: event.target.value } : item))} />
                      {errors[field] && <small className="academic-field-error" id={`error-${field}`}>{errors[field]}</small>}
                    </label>;
                  })}
                </div>
              </fieldset>)}
            </div>
          </section>
        </fieldset>
        <div className="academic-actions">
          <button className="academic-button academic-button--secondary" type="button" disabled={saving} onClick={() => navigate('/academic-years')}>Hủy</button>
          <button className="academic-button academic-button--primary" type="submit" disabled={saving || !allowed}><Save size={16} />{saving ? 'Đang lưu...' : 'Lưu bản nháp'}</button>
        </div>
      </form>
    </main>
  );
};
