import { formatActiveAcademicYear, validateAcademicYear, validateAcademicTerms } from './academicYear.ts';

const year = { name: '2026-2027', startDate: '2026-08-15', endDate: '2027-05-31' };

const terms = [
  { order: 1, name: 'Học kỳ I', startDate: year.startDate, endDate: '2027-01-15' },
  { order: 2, name: 'Học kỳ II', startDate: '2027-01-16', endDate: year.endDate },
];
let checks = 0;
const check = (valid: boolean, message: string) => {
  if (!valid) throw new Error(message);
  checks++;
};
check(formatActiveAcademicYear('2029-2030') === 'Năm học 2029 - 2030', 'Active year label uses API data');
check(formatActiveAcademicYear(null) === 'Chưa có năm học đang áp dụng', 'Empty active year has a clear label');
check(Object.keys(validateAcademicYear(year)).length === 0, 'Valid year');
for (const name of ['', '   ', '2026/2027', '2026-2028', '٢٠٢٦-٢٠٢٧', '1999-2000'])
  check(Boolean(validateAcademicYear({ ...year, name }).name), `Reject name ${name}`);
check(Boolean(validateAcademicYear({ ...year, startDate: '' }).startDate), 'Missing date');
check(Boolean(validateAcademicYear({ ...year, startDate: '2026-02-30' }).startDate), 'Invalid calendar date');
check(Boolean(validateAcademicYear({ ...year, endDate: '2026-05-31' }).endDate), 'Wrong year');
check(Boolean(validateAcademicYear({ ...year, startDate: '2026-12-31', endDate: '2027-01-01' }).endDate), 'Minimum duration');
check(Object.keys(validateAcademicTerms(terms, year.startDate, year.endDate)).length === 0, 'Valid terms');
check(Boolean(validateAcademicTerms([], year.startDate, year.endDate).terms), 'Exactly two terms');
check(Boolean(validateAcademicTerms([terms[0], terms[0]], year.startDate, year.endDate).terms), 'Unique order');
check(Boolean(validateAcademicTerms([{ ...terms[0], startDate: '' }, terms[1]], year.startDate, year.endDate)['terms[0].startDate']), 'Required term dates');
check(Boolean(validateAcademicTerms([terms[0], { ...terms[1], name: ' học kỳ i ' }], year.startDate, year.endDate)['terms[1].name']), 'Unique trimmed names');
check(Boolean(validateAcademicTerms([terms[0], { ...terms[1], startDate: terms[0].endDate }], year.startDate, year.endDate)['terms[1].startDate']), 'No touching ranges');
check(Boolean(validateAcademicTerms([terms[0], { ...terms[1], endDate: '2027-06-01' }], year.startDate, year.endDate)['terms[1].endDate']), 'Inside year');
check(Boolean(validateAcademicTerms([{ ...terms[0], endDate: terms[0].startDate }, terms[1]], year.startDate, year.endDate)['terms[0].endDate']), 'Positive term duration');
console.info(`Academic calendar: ${checks} checks passed.`);
