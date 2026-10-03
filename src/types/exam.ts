export type ExamStatus = 'DRAFT' | 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';

export interface ExamSemesterSummary {
  id: number;
  name: string;
}

export interface ExamSchoolBranchSummary {
  id: number;
  code: string;
  name: string;
}

export interface ExamListItem {
  id: number;
  name: string;
  semester: ExamSemesterSummary;
  schoolBranch: ExamSchoolBranchSummary;
  startDate: string;
  endDate: string;
  status: ExamStatus;
}

export interface ExamPage {
  items: ExamListItem[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface ExamListQuery {
  keyword?: string;
  semesterId?: number;
  schoolBranchId?: number;
  status?: ExamStatus;
  pageNumber?: number;
  pageSize?: number;
}

export interface CreateExamRequest {
  semesterId: number;
  schoolBranchId: number;
  name: string;
  startDate: string;
  endDate: string;
}

export interface ExamDetail extends ExamListItem {
  subjectCount: number;
  sessionCount: number;
  roomCount: number;
  candidateCount: number;
  proctorCount: number;
}
