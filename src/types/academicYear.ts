// ─── Academic Year Types ───────────────────────────────────────────────────────

export interface SemesterItem {
  id: string;
  order: number;
  name: string;
  startDate?: string; // "YYYY-MM-DD"
  endDate?: string;   // "YYYY-MM-DD"
  status: 'PLANNED' | 'ACTIVE' | 'CLOSED';
  version: number;
}

export interface AcademicYearListItem {
  id: string;
  code: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'DRAFT' | 'ACTIVE' | 'CLOSED';
  version: number;
  semesterCount: number;
}

export interface AcademicYearDetail {
  id: string;
  code: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'DRAFT' | 'ACTIVE' | 'CLOSED';
  version: number;
  semesters: SemesterItem[];
}

export interface AcademicYearPage {
  items: AcademicYearListItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface CreateAcademicYearRequest {
  name: string;
  startDate: string;
  endDate: string;
}

export interface UpdateAcademicYearRequest {
  name: string;
  startDate: string;
  endDate: string;
}

export interface ConfigureTermItem {
  order: number;
  name: string;
  startDate?: string;
  endDate?: string;
}

export interface ConfigureTermsRequest {
  terms: ConfigureTermItem[];
}
