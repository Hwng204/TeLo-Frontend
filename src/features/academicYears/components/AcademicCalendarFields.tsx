import { Field } from '../../../components/pcb';
import type { ConfigureTermItem, CreateAcademicYearRequest, SemesterItem } from '../../../types';
import { TERM_STATUS, type CalendarErrors } from '../../../utils/academicYear';

export type YearFormValue = Pick<CreateAcademicYearRequest, 'name' | 'startDate' | 'endDate'>;
const requiredLabel = (label: string) => <>{label} <b className="academic-required" aria-hidden="true">*</b></>;

export function AcademicYearFields({ value, onChange, errors }: {
  value: YearFormValue; onChange: (value: YearFormValue) => void; errors: CalendarErrors;
}) {
  return <div className="academic-fields">
    <Field label={requiredLabel('Tên năm học')} required value={value.name} maxLength={50}
      fieldClassName="academic-field--wide" error={errors.name} aria-invalid={!!errors.name}
      onChange={event => onChange({ ...value, name: event.target.value })} />
    <Field label={requiredLabel('Ngày bắt đầu')} required type="date" value={value.startDate}
      error={errors.startDate} aria-invalid={!!errors.startDate}
      onChange={event => onChange({ ...value, startDate: event.target.value })} />
    <Field label={requiredLabel('Ngày kết thúc')} required type="date" value={value.endDate}
      error={errors.endDate} aria-invalid={!!errors.endDate}
      onChange={event => onChange({ ...value, endDate: event.target.value })} />
  </div>;
}

export function AcademicTermFields({ terms, onChange, errors, statuses = {} }: {
  terms: ConfigureTermItem[]; onChange: (terms: ConfigureTermItem[]) => void; errors: CalendarErrors;
  statuses?: Record<number, SemesterItem['status']>;
}) {
  const change = (index: number, changes: Partial<ConfigureTermItem>) =>
    onChange(terms.map((term, current) => current === index ? { ...term, ...changes } : term));
  return <div className="academic-terms">{terms.map((term, index) => <fieldset
    className="academic-term" key={term.order} disabled={statuses[term.order] === 'CLOSED'}
  >
    <legend>Học kỳ {term.order === 1 ? 'I' : 'II'}</legend>
    {statuses[term.order] && <span className={'academic-term-status academic-term-status--' + statuses[term.order].toLowerCase()}>{TERM_STATUS[statuses[term.order]]}</span>}
    <div className="academic-fields">
      <Field label={requiredLabel('Tên học kỳ')} required value={term.name} maxLength={100}
        fieldClassName="academic-field--wide" error={errors['terms[' + index + '].name']}
        onChange={event => change(index, { name: event.target.value })} />
      <Field label={requiredLabel('Ngày bắt đầu')} required type="date" value={term.startDate ?? ''}
        error={errors['terms[' + index + '].startDate']}
        onChange={event => change(index, { startDate: event.target.value })} />
      <Field label={requiredLabel('Ngày kết thúc')} required type="date" value={term.endDate ?? ''}
        error={errors['terms[' + index + '].endDate']}
        onChange={event => change(index, { endDate: event.target.value })} />
    </div>
  </fieldset>)}</div>;
}
