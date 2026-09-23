export interface Student {
  id: string;
  studentCode: string;
  fullName: string;
  dateOfBirth: string;
  className: string;
  gender: 'Nam' | 'Nữ';
  status: 'Active' | 'Inactive';
}

export interface CreateStudentDto {
  studentCode: string;
  fullName: string;
  dateOfBirth: string;
  className: string;
  gender: 'Nam' | 'Nữ';
}
