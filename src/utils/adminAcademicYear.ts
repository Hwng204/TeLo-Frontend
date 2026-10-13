type WorkingYear = { id: string; status: string; startDate: string };

export function normalizeWorkingYears<T extends Omit<WorkingYear, 'id'> & { id: string | number }>(years: T[]): (Omit<T, 'id'> & { id: string })[] {
  return years.map(year => ({ ...year, id: String(year.id) }));
}

export function resolveWorkingYear<T extends WorkingYear>(years: T[], preferredId?: string | null): T | undefined {
  return years.find(year => year.id === preferredId)
    ?? years.find(year => year.status === 'ACTIVE')
    ?? [...years].sort((a, b) => b.startDate.localeCompare(a.startDate))[0];
}

export const WORKING_YEAR_KEY = 'academic-year-context:admin';

export function readWorkingYear(): string | null {
  try { return sessionStorage.getItem(WORKING_YEAR_KEY); }
  catch { return null; }
}

export function saveWorkingYear(id: string): void {
  try { sessionStorage.setItem(WORKING_YEAR_KEY, id); }
  catch { /* Selection still works when browser storage is unavailable. */ }
}
