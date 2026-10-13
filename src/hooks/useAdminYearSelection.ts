import { useState } from 'react';
import { api } from '../services/api';
import type { AcademicYearListItem } from '../types/academicYear';
import { normalizeWorkingYears, readWorkingYear, resolveWorkingYear, saveWorkingYear } from '../utils/adminAcademicYear';
import { useAsync } from './useAsync';

export function useAdminYearSelection() {
  const [preferredId, setPreferredId] = useState(readWorkingYear);
  const [previousYears, setPreviousYears] = useState<AcademicYearListItem[]>([]);
  const catalog = useAsync(async () => {
    const items: AcademicYearListItem[] = [];
    let page = 1;
    while (true) {
      const response = await api.academicYear.list({ page, pageSize: 100 });
      if (!response.data) throw new Error('Không tải được danh sách năm học.');
      items.push(...normalizeWorkingYears(response.data.items));
      if (page >= response.data.totalPages) break;
      page++;
    }
    return items;
  }, []);
  if (catalog.data && catalog.data !== previousYears) setPreviousYears(catalog.data);
  const years = catalog.data ?? previousYears;
  const year = resolveWorkingYear(years, preferredId);
  const selectYear = (id: string) => {
    if (!years.some(item => item.id === id)) return;
    setPreferredId(id);
    saveWorkingYear(id);
  };
  // A background refresh must not clear the selection or remount operation screens.
  return { ...catalog, data: years, year, selectYear, ready: years.length > 0 || (!catalog.loading && !catalog.error), activeYear: years.find(item => item.status === 'ACTIVE') };
}
