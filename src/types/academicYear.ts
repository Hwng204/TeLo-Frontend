// ─── Academic Year Types ───────────────────────────────────────────────────────

export interface SemesterItem {
  id: string;
  order: number;
  name: string;
  startDate?: string | null; // "YYYY-MM-DD"
  endDate?: string | null;   // "YYYY-MM-DD"
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
  terms?: ConfigureTermItem[];
}

export interface UpdateAcademicYearRequest {
  name: string;
  startDate: string;
  endDate: string;
  version?: number;
  terms?: ConfigureTermItem[];
}

export interface ConfigureTermItem {
  order: number;
  name: string;
  startDate?: string | null;
  endDate?: string | null;
}

export interface ConfigureTermsRequest {
  terms: ConfigureTermItem[];
  version?: number;
}
