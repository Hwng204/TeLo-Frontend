import { useState, type FormEvent } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { PageHeader } from '../../../components/common/PageHeader';
import { Icon, PcbButton, PcbIconButton } from '../../../components/pcb';
import { useAsync } from '../../../hooks/useAsync';
import { useBusy } from '../../../hooks/useBusy';
import type { AdminOutletContext } from '../../../layouts/AdminLayout';
import { api } from '../../../services/api';
import type { AcademicYearDetail } from '../../../types';
import { canManageAcademicYears } from '../../../utils/jwt';
import { validateAcademicYearName, YEAR_STATUS, type CalendarErrors } from '../../../utils/academicYear';
import { problemLines, toProblem } from '../../../utils/problem';
import { displayToast } from '../../../utils/toast';
import { AcademicYearFields, type YearFormValue } from '../components/AcademicCalendarFields';
import { AcademicYearActionDialog, type YearAction } from '../components/AcademicYearActionDialog';
import './AcademicYearPages.css';

export const AcademicYearConfigPage = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const result = useAsync(() => api.academicYear.get(id), [id]);
  const year = result.data?.data;
  const back = () => navigate('/academic-years');
  if (result.loading && !year) return <main className="sep-page academic-page"><PageHeader title="Năm học" inline onBack={back} /><p role="status">Đang tải…</p></main>;
  if (result.error || !year) return <main className="sep-page academic-page"><PageHeader title="Năm học" inline onBack={back} /><div className="sep-alert" role="alert">{result.error ? toProblem(result.error).message : 'Không tìm thấy năm học.'}<PcbButton variant="secondary" onClick={result.reload}>Thử lại</PcbButton></div></main>;
  return <AcademicYearEditor key={year.id + ':' + year.name + ':' + year.status} year={year} refreshing={result.loading} reload={result.reload} onBack={back} />;
};


function AcademicYearEditor({ year, refreshing, reload, onBack }: { year: AcademicYearDetail; refreshing: boolean; reload: () => void; onBack: () => void }) {
  const { reloadActiveAcademicYear } = useOutletContext<AdminOutletContext>();
  const editable = canManageAcademicYears();
  const readOnly = year.status === 'CLOSED' || !editable;
  const [fields, setFields] = useState<YearFormValue>({ name: year.name });
  const [errors, setErrors] = useState<CalendarErrors>({});
  const [action, setAction] = useState<YearAction | null>(null);
  const [busy, run] = useBusy();
  const dirty = fields.name !== year.name;
  const save = (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = validateAcademicYearName(fields);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    void run(async () => {
      try {
        await api.academicYear.update(year.id, { name: fields.name.trim(), version: year.version });
        displayToast('success', 'Thành công', 'Đã lưu năm học.');
        reload();
        reloadActiveAcademicYear();
      } catch (error) {
        const problem = toProblem(error);
        setErrors(problem.fieldErrors ?? {});
        displayToast('error', 'Lỗi', problemLines(problem).join(' '), 5);
        if (problem.status === 409) reload();
      }
    });
  };
  const applyAction = () => {
    if (!action) return;
    void run(async () => {
      try {
        if (action === 'ACTIVATE') await api.academicYear.activate(year.id);
        else await api.academicYear.close(year.id);
        displayToast('success', 'Thành công', action === 'ACTIVATE' ? 'Đã áp dụng năm học.' : 'Đã kết thúc năm học.');
        reload();
        reloadActiveAcademicYear();
      } catch (error) {
        displayToast('error', 'Lỗi', problemLines(toProblem(error)).join(' '), 5);
        reload();
        reloadActiveAcademicYear();
      } finally { setAction(null); }
    });
  };
  return <main className="sep-page academic-page academic-page--editor">
    <div className="academic-heading">
      <PageHeader title={readOnly ? 'Chi tiết năm học' : 'Cấu hình năm học'} inline onBack={onBack} badge={<span className={'academic-status academic-status--' + year.status.toLowerCase()}>{YEAR_STATUS[year.status]}</span>} />
      {editable && year.status !== 'CLOSED' && <PcbIconButton icon={year.status === 'DRAFT' ? 'play_circle' : 'event_busy'}
        label={dirty ? 'Lưu thay đổi trước khi chuyển trạng thái năm học' : year.status === 'DRAFT' ? 'Áp dụng năm học' : 'Kết thúc năm học'}
        disabled={busy || refreshing || dirty} onClick={() => setAction(year.status === 'DRAFT' ? 'ACTIVATE' : 'CLOSE')} />}
    </div>
    <form className="academic-form" onSubmit={save} noValidate>
      <fieldset className="academic-form-body" disabled={readOnly || busy || refreshing}>
        <section className="academic-section"><h2><Icon name="calendar_month" />Thông tin năm học</h2><AcademicYearFields value={fields} onChange={setFields} errors={errors} /></section>
      </fieldset>
      <div className="academic-actions"><PcbButton variant="secondary" onClick={onBack} disabled={busy}><Icon name="arrow_back" />Quay lại</PcbButton>{!readOnly && <PcbButton type="submit" disabled={busy || refreshing}><Icon name="save" />{busy ? 'Đang lưu…' : 'Lưu năm học'}</PcbButton>}</div>
    </form>
    <AcademicYearActionDialog action={action} yearName={year.name} busy={busy} onConfirm={applyAction} onCancel={() => setAction(null)} />
  </main>;
}
