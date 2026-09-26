// ─── School branch summary ────────────────────────────────────────────────────
export interface SchoolBranchSummary {
  id: string;
  code: string;
  name: string;
  address?: string;
  status: string;
}

// ─── Core School entity (frontend model) ─────────────────────────────────────
export interface School {
  id: string;
  code: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
  provinceCode?: string;
  currentAcademicYear: string;
  branches: SchoolBranchSummary[];
}

// ─── Request shapes ───────────────────────────────────────────────────────────
export interface CreateSchoolRequest {
  name: string;
  code: string;
  provinceCode?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export type UpdateSchoolRequest = Partial<CreateSchoolRequest>;

export interface CreateSchoolBranchRequest {
  code?: string;
  name: string;
  address?: string;
  status?: string;
}

export type UpdateSchoolBranchRequest = Partial<CreateSchoolBranchRequest>;

// ─── Backend Response Shapes ──────────────────────────────────────────────────
export interface SchoolItem {
  id: number;
  code: string;
  name: string;
  status: string;
  branchCount: number;
}

export interface SchoolPage {
  items: SchoolItem[];
  totalCount: number;
}


export function mapSchool(item: SchoolItem): School {
  return {
    id: String(item.id),
    code: item.code,
    name: item.name,
    status: (item.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE') as School['status'],
    currentAcademicYear: '2026-2027',
    branches: Array.from({ length: item.branchCount || 0 }, (_, i) => ({
      id: `${item.id}-${i}`,
      code: `${item.code}-B${i + 1}`,
      name: `Cơ sở ${i + 1}`,
      status: 'ACTIVE',
    })),
  };
}
