import { normalizeWorkingYears, resolveWorkingYear } from './adminAcademicYear.ts';

const years = [
  { id: '1', startDate: '2025-08-15', status: 'CLOSED' },
  { id: '3', startDate: '2027-08-15', status: 'DRAFT' },
  { id: '2', startDate: '2026-08-15', status: 'ACTIVE' },
];
let checks = 0;
const check = (valid: boolean, message: string) => {
  if (!valid) throw new Error(message);
  checks++;
};
check(resolveWorkingYear(years)?.id === '2', 'Defaults to the active year, not the newest draft');
check(resolveWorkingYear(years, '1')?.id === '1', 'Preserves a selected historical year');
check(resolveWorkingYear(years, 'deleted')?.id === '2', 'Falls back when saved selection was removed');
check(resolveWorkingYear(years.filter(year => year.status !== 'ACTIVE'))?.id === '3', 'Newest year when no active year exists');
check(resolveWorkingYear([]) === undefined, 'No invented year for an empty catalog');
check(resolveWorkingYear(years, '3')?.id === '3', 'Allows selecting a draft year');
check(resolveWorkingYear(years, '2')?.id === '2', 'Explicit selection remains valid');

// ASP.NET serializes ulong IDs as JSON numbers, while SelectField and storage return strings.
const apiYears = [
  { id: 8, startDate: '2029-01-11', status: 'ACTIVE' },
  { id: 14, startDate: '2030-08-15', status: 'DRAFT' },
  { id: 11, startDate: '2021-08-15', status: 'CLOSED' },
];
const normalized = normalizeWorkingYears(apiYears);
check(normalized.every(year => typeof year.id === 'string'), 'Numeric API IDs become dropdown strings');
check(normalized.some(year => year.id === '14'), 'Dropdown selection is accepted for a numeric API ID');
check(resolveWorkingYear(normalized, '14')?.status === 'DRAFT', 'Can select an unapplied year');
check(resolveWorkingYear(normalized, '11')?.status === 'CLOSED', 'Can select a closed year');
check(resolveWorkingYear(normalizeWorkingYears(apiYears), '11')?.id === '11', 'Saved selection survives a fresh API response');
check(apiYears[0].id === 8, 'Normalization preserves the original API response');
const yearOnly = [
  { id: '1', name: '2028-2029', status: 'CLOSED' },
  { id: '2', name: '2029-2030', status: 'ACTIVE' },
  { id: '3', name: '2030-2031', status: 'DRAFT' },
];
check(resolveWorkingYear(yearOnly)?.id === '2', 'Year-only catalog keeps the active year');
check(resolveWorkingYear(yearOnly, '1')?.id === '1', 'Historical selection does not require dates');
check(resolveWorkingYear(yearOnly.filter(year => year.status !== 'ACTIVE'))?.id === '3', 'Sorts a year-only catalog by name');
console.log(`Admin academic year: ${checks} checks passed`);
