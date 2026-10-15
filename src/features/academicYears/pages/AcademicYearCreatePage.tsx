import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../components/common/PageHeader';
import { Icon, PcbButton } from '../../../components/pcb';
import { useBusy } from '../../../hooks/useBusy';
import { api } from '../../../services/api';
import { initialAcademicYear, validateAcademicYearName, type CalendarErrors } from '../../../utils/academicYear';
import { problemLines, toProblem } from '../../../utils/problem';
import { displayToast } from '../../../utils/toast';
import { AcademicYearFields } from '../components/AcademicCalendarFields';
import './AcademicYearPages.css';

export const AcademicYearCreatePage = () => {
  const navigate = useNavigate();
  const [year, setYear] = useState(() => ({ name: initialAcademicYear().name }));
  const [errors, setErrors] = useState<CalendarErrors>({});
  const [busy, run] = useBusy();
  const back = () => navigate('/academic-years');
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = validateAcademicYearName(year);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    void run(async () => {
      try {
        await api.academicYear.create({ name: year.name.trim() });
        displayToast('success', 'Thành công', 'Đã tạo năm học.');
        back();
      } catch (error) {
        const problem = toProblem(error);
        setErrors(problem.fieldErrors ?? {});
        displayToast('error', 'Lỗi', problemLines(problem).join(' '), 5);
      }
    });
  };
  return <main className="sep-page academic-page academic-page--editor">
    <PageHeader title="Thêm năm học" inline onBack={back} />
    <form className="academic-form" onSubmit={submit} noValidate>
      <fieldset className="academic-form-body" disabled={busy}>
        <section className="academic-section"><h2><Icon name="calendar_month" />Thông tin năm học</h2><AcademicYearFields value={year} onChange={setYear} errors={errors} /></section>
      </fieldset>
      <div className="academic-actions"><PcbButton variant="secondary" disabled={busy} onClick={back}><Icon name="close" />Hủy</PcbButton><PcbButton type="submit" disabled={busy}><Icon name="save" />{busy ? 'Đang lưu…' : 'Lưu năm học'}</PcbButton></div>
    </form>
  </main>;
};
