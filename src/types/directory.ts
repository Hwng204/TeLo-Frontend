/**
 * Danh bạ lớp học / học sinh (SC-CL01, SC-CL02, SC-HS01, SC-HS02) và CRUD của admin.
 * Khớp Application/DTOs/SchoolDirectoryDtos.cs + SchoolDirectoryAdminDtos.cs. Mọi endpoint bọc
 * kết quả trong ApiResponse<T>; api.ts đã bóc lớp vỏ đó ra.
 */

export type StudentStatus = 'ACTIVE' | 'TEMPORARY_LEAVE' | 'TRANSFERRED' | 'INACTIVE';
export type ClassStatus = 'ACTIVE' | 'INACTIVE';
export type EnrollmentStatus = 'ACTIVE' | 'COMPLETED' | 'TRANSFERRED_OUT';

export interface DirectoryPage<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface DirectoryOption {
  id: number;
  code: string | null;
  name: string;
}

/** GET /classes/reference-data — ô lọc và ô chọn của biểu mẫu. `classes` chỉ gồm lớp của năm được hỏi. */
/** Phân hiệu kèm trạng thái và số lớp / học sinh đang học trong năm học được hỏi. */
export interface DirectoryBranchOption extends DirectoryOption {
  status: 'ACTIVE' | 'INACTIVE' | string;
  classCount: number;
  studentCount: number;
}

export interface DirectoryReferenceData {
  schoolBranches: DirectoryBranchOption[];
  gradeLevels: DirectoryOption[];
  academicYears: DirectoryOption[];
  classes: DirectoryOption[];
  studentStatuses: StudentStatus[];
  classStatuses: ClassStatus[];
}

export interface ClassListQuery {
  search?: string;
  gradeLevelId?: number;
  /** Bỏ trống thì backend lấy năm học đang hoạt động. */
  academicYearId?: number;
  schoolBranchId?: number;
  status?: ClassStatus;
  page?: number;
  pageSize?: number;
}

export interface StudentListQuery {
  search?: string;
  gradeLevelId?: number;
  /** Lọc theo lớp hiện tại (năm học đang hoạt động). */
  classId?: number;
  schoolBranchId?: number;
  status?: StudentStatus;
  page?: number;
  pageSize?: number;
}

export interface ClassListItem {
  id: number;
  code: string;
  name: string;
  gradeLevelId: number;
  gradeLevelName: string;
  academicYearId: number;
  academicYearName: string;
  schoolBranchId: number;
  schoolBranchName: string;
  homeroomTeacherId: number | null;
  homeroomTeacherName: string | null;
  studentCount: number;
  status: ClassStatus;
}

export interface ClassStudentItem {
  studentId: number;
  studentCode: string;
  fullName: string;
  dateOfBirth: string | null;
  gender: string | null;
  className: string;
  studentStatus: StudentStatus;
  /** Lượt ghi danh ở chính lớp này: đã chuyển sang lớp khác thì là TRANSFERRED_OUT. */
  enrollmentStatus: EnrollmentStatus;
}

export interface ClassDetail {
  class: ClassListItem;
  students: DirectoryPage<ClassStudentItem>;
}

export interface StudentListItem {
  id: number;
  code: string;
  fullName: string;
  dateOfBirth: string | null;
  gender: string | null;
  gradeLevelId: number | null;
  gradeLevelName: string | null;
  classId: number | null;
  className: string | null;
  schoolBranchId: number | null;
  schoolBranchName: string | null;
  status: StudentStatus;
}

export interface StudentAcademicHistoryItem {
  academicYearId: number;
  academicYearName: string;
  gradeLevelId: number;
  gradeLevelName: string;
  classId: number;
  className: string;
  homeroomTeacherId: number | null;
  homeroomTeacherName: string | null;
  enrollmentStatus: EnrollmentStatus;
}

export interface StudentCurrentClass {
  academicYearId: number;
  academicYearName: string;
  gradeLevelId: number;
  gradeLevelName: string;
  classId: number;
  className: string;
  schoolBranchId: number;
  schoolBranchName: string;
  homeroomTeacherId: number | null;
  homeroomTeacherName: string | null;
}

export interface StudentDetail {
  id: number;
  code: string;
  fullName: string;
  dateOfBirth: string | null;
  gender: string | null;
  status: StudentStatus;
  currentClass: StudentCurrentClass | null;
  academicHistory: StudentAcademicHistoryItem[];
}

/** Chỉ điểm đã công bố (ResultPublishedAt khác null). */
export interface StudentScoreItem {
  attemptId: number;
  examId: number;
  examName: string;
  semesterId: number;
  semesterName: string;
  subjectId: number;
  subjectName: string;
  examDate: string;
  totalScore: number;
  resultPublishedAt: string;
}

// ---- Admin: CRUD theo một trường cụ thể (schoolId nằm trong đường dẫn) ----

export interface SaveStudentRequest {
  code: string;
  fullName: string;
  dateOfBirth: string | null;
  gender: string | null;
  status: StudentStatus | null;
  /** Bắt buộc khi tạo (tạo lượt ghi danh đầu tiên); khi sửa, đổi lớp trong cùng năm hãy dùng chuyển lớp. */
  schoolClassId: number | null;
}

export interface SaveClassRequest {
  schoolBranchId: number;
  /** Không còn nhập trên giao diện; bỏ trống thì backend đặt theo tên lớp (thêm) hoặc giữ nguyên (sửa). */
  code?: string;
  name: string;
  academicYearId: number;
  gradeLevelId: number;
  status: ClassStatus | null;
  homeroomTeacherId: number | null;
}

export interface TransferStudentClassRequest {
  schoolClassId: number;
  /** Bỏ trống thì backend lấy hôm nay. */
  effectiveOn: string | null;
}

/** Trường admin được chọn để thao tác (GET /admin/teacher-schools). */
export interface AdminSchoolOption {
  id: number;
  code: string;
  name: string;
  status: string;
}

/** Giáo viên của một cơ sở, để chọn giáo viên chủ nhiệm (GET /admin/schools/{id}/branches/{id}/teachers). */
export interface AdminTeacherOption {
  id: number;
  staffCode: string | null;
  fullName: string;
  employmentStatus: string;
  schoolBranchId: number;
}
