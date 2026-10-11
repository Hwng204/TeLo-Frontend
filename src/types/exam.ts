export type ExamStatus = 'DRAFT' | 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';

export interface ExamSemesterSummary {
  id: number;
  name: string;
}

export interface ExamCatalogSummary {
  id: number;
  name: string;
}

export interface ExamFormOptions {
  academicYears: Array<{
    id: number;
    name: string;
    status: string;
    semesters: ExamCatalogSummary[];
  }>;
  gradeLevels: ExamCatalogSummary[];
  subjects: ExamCatalogSummary[];
}

export interface ExamCandidateCount {
  academicYearId: number;
  schoolBranchId: number;
  gradeLevelId: number;
  studentCount: number;
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
  academicYear: ExamCatalogSummary;
  gradeLevel: ExamCatalogSummary | null;
  subject: ExamCatalogSummary | null;
  schoolBranch: ExamSchoolBranchSummary;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
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
  academicYearId?: number;
  schoolBranchId?: number;
  status?: ExamStatus;
  pageNumber?: number;
  pageSize?: number;
}

export interface CreateExamRequest {
  semesterId: number;
  schoolBranchId: number;
  gradeLevelId: number;
  subjectId: number;
  name: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
}

export interface UpdateExamRequest extends CreateExamRequest {
  status: ExamStatus;
}

export interface ExamDetail extends ExamListItem {
  subjectCount: number;
  sessionCount: number;
  roomCount: number;
  candidateCount: number;
  proctorCount: number;
}

export interface ExamRoomOption {
  id: number;
  code: string;
  name: string;
  roomType: string;
  status: string;
}

export interface ExamRoom {
  id: number;
  examId: number;
  code: string;
  room: ExamRoomOption;
  candidateLimit: number;
  status: 'READY' | 'UNAVAILABLE';
  sessionCount: number;
}

export interface SaveExamRoomRequest {
  code: string;
  roomId: number;
  candidateLimit: number;
}

export interface CreateExamRoomsRequest {
  roomCount: number;
  candidateLimit: number;
  codePrefix: string;
  roomIds: number[];
}

export interface ExamRoomPlanStudent {
  id: number;
  code: string;
  fullName: string;
}

export interface ExamRoomPlanRoom {
  roomNumber: number;
  students: ExamRoomPlanStudent[];
}

export interface ExamRoomPlanSession {
  sessionNumber: number;
  rooms: ExamRoomPlanRoom[];
}

export interface ExamRoomPlan {
  totalStudents: number;
  roomCount: number;
  candidateLimit: number;
  capacityPerSession: number;
  requiredSessionCount: number;
  sessions: ExamRoomPlanSession[];
}
