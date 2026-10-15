import { createContext, useContext } from 'react';
import type { AcademicYearListItem } from '../types/academicYear';

export type AdminAcademicYearContextValue = {
  year: AcademicYearListItem | undefined;
  ready: boolean;
  error: unknown;
};

export const AdminAcademicYearContext = createContext<AdminAcademicYearContextValue | null>(null);

/** School-side screens keep their existing active-year behavior outside AdminLayout. */
export const useAdminAcademicYear = () => useContext(AdminAcademicYearContext);
