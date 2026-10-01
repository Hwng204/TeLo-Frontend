import type { ConfigureTermItem, CreateAcademicYearRequest } from '../types/academicYear';

export type CalendarErrors = Record<string, string>;
export const YEAR_STATUS = { DRAFT: 'Bản nháp', ACTIVE: 'Đang áp dụng', CLOSED: 'Đã kết thúc' };
export const TERM_STATUS = { PLANNED: 'Chưa bắt đầu', ACTIVE: 'Đang áp dụng', CLOSED: 'Đã kết thúc' };

export const formatActiveAcademicYear = (name?: string | null): string => {
  if (!name) return 'Chưa có năm học đang áp dụng';
  const match = /^([0-9]{4})-([0-9]{4})$/.exec(name.trim());
  return match ? `Năm học ${match[1]} - ${match[2]}` : `Năm học ${name.trim()}`;
};

const dateValue = (value?: string | null): number | null => {
  if (!value || !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value)) return null;
  const time = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value ? time : null;
};

export const validateAcademicYear = (year: Pick<CreateAcademicYearRequest, 'name' | 'startDate' | 'endDate'>): CalendarErrors => {
  const errors: CalendarErrors = {};
  const name = year.name.trim();
  const match = /^([0-9]{4})-([0-9]{4})$/.exec(name);
  if (!name) errors.name = 'Tên năm học là bắt buộc.';
  else if (!match) errors.name = 'Tên năm học phải có định dạng YYYY-YYYY.';
  else {
    const first = Number(match[1]);
    const last = Number(match[2]);
    if (last !== first + 1) errors.name = 'Năm kết thúc phải ngay sau năm bắt đầu.';
    if (first < 2000 || first > 2100) errors.name = 'Năm bắt đầu phải từ 2000 đến 2100.';
    if (Number(year.startDate.slice(0, 4)) !== first) errors.startDate = `Ngày bắt đầu phải thuộc năm ${first}.`;
    if (Number(year.endDate.slice(0, 4)) !== last) errors.endDate = `Ngày kết thúc phải thuộc năm ${last}.`;
  }
  const start = dateValue(year.startDate);
  const end = dateValue(year.endDate);
  if (start === null) errors.startDate = 'Vui lòng nhập ngày bắt đầu hợp lệ.';
  if (end === null) errors.endDate = 'Vui lòng nhập ngày kết thúc hợp lệ.';
  if (start !== null && end !== null) {
    if (end <= start) errors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu.';
    else if ((end - start) / 86400000 < 180) errors.endDate = 'Năm học phải kéo dài tối thiểu 180 ngày.';
  }
  return errors;
};

export const validateAcademicTerms = (terms: ConfigureTermItem[], yearStart: string, yearEnd: string): CalendarErrors => {
  const errors: CalendarErrors = {};
  if (terms.length !== 2 || terms.filter(t => t.order === 1).length !== 1 || terms.filter(t => t.order === 2).length !== 1)
    return { terms: 'Phải có đúng học kỳ I và học kỳ II.' };
  const yearStartValue = dateValue(yearStart);
  const yearEndValue = dateValue(yearEnd);
  terms.forEach((term, index) => {
    const prefix = `terms[${index}]`;
    if (!term.name.trim()) errors[`${prefix}.name`] = 'Tên học kỳ là bắt buộc.';
    else if (term.name.trim().length > 100) errors[`${prefix}.name`] = 'Tên học kỳ tối đa 100 ký tự.';
    const start = dateValue(term.startDate);
    const end = dateValue(term.endDate);
    if (start === null) errors[`${prefix}.startDate`] = 'Vui lòng nhập ngày bắt đầu học kỳ.';
    if (end === null) errors[`${prefix}.endDate`] = 'Vui lòng nhập ngày kết thúc học kỳ.';
    for (const [key, date] of [['startDate', start], ['endDate', end]] as const)
      if (date !== null && yearStartValue !== null && yearEndValue !== null && (date < yearStartValue || date > yearEndValue))
        errors[`${prefix}.${key}`] = 'Ngày học kỳ phải nằm trong thời gian năm học.';
    if (start !== null && end !== null && end <= start)
      errors[`${prefix}.endDate`] = 'Ngày kết thúc học kỳ phải sau ngày bắt đầu.';
  });
  const first = terms.find(term => term.order === 1)!;
  const secondIndex = terms.findIndex(term => term.order === 2);
  const second = terms[secondIndex];
  if (first.name.trim() && first.name.trim().toLocaleLowerCase('vi') === second.name.trim().toLocaleLowerCase('vi'))
    errors[`terms[${secondIndex}].name`] = 'Tên hai học kỳ không được trùng nhau.';
  const firstEnd = dateValue(first.endDate);
  const secondStart = dateValue(second.startDate);
  if (firstEnd !== null && secondStart !== null && secondStart <= firstEnd)
    errors[`terms[${secondIndex}].startDate`] = 'Học kỳ II phải bắt đầu sau ngày kết thúc học kỳ I.';
  return errors;
};

export const initialAcademicYear = () => {
  const today = new Date();
  const first = today.getFullYear() - (today.getMonth() < 7 ? 1 : 0);
  return { name: `${first}-${first + 1}`, startDate: `${first}-08-15`, endDate: `${first + 1}-05-31` };
};

export const initialAcademicTerms = (startDate: string, endDate: string): ConfigureTermItem[] => [
  { order: 1, name: 'Học kỳ I', startDate, endDate: `${endDate.slice(0, 4)}-01-15` },
  { order: 2, name: 'Học kỳ II', startDate: `${endDate.slice(0, 4)}-01-16`, endDate },
];
