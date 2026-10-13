export interface TeacherDirectoryItem {
  id: number;
  staffCode: string | null;
  fullName: string;
  department: string | null;
  mainSubjectName: string | null;
  employmentStatus: string;
  joinedOn: string | null;
  schoolBranchName: string;
}

export interface TeacherDirectoryQuery {
  academicYearId?: number;
  search?: string;
  employmentStatus?: string;
  page?: number;
  pageSize?: number;
}
