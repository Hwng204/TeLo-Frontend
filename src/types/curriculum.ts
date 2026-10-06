/** Chương & bài học của phân hiệu người đang đăng nhập (backend: /api/curriculum). */
export interface CurriculumOption {
  id: number;
  name: string;
}

export interface CurriculumField {
  id: number;
  name: string;
  subjectId: number;
  subjectName: string;
}

export interface Lesson {
  id: number;
  chapterId: number;
  code: string;
  title: string;
  sortOrder: number;
  /** Đã có ma trận/nhiệm vụ dùng: không xoá được. */
  inUse: boolean;
}

export interface Chapter {
  id: number;
  gradeLevelId: number;
  gradeLevelName: string;
  fieldId: number;
  fieldName: string;
  code: string;
  title: string;
  sortOrder: number;
  /** Có bài đã được dùng: không xoá được, không đổi được khối lớp/lĩnh vực. */
  inUse: boolean;
  lessons: Lesson[];
}

export interface Curriculum {
  /** Chỉ PHT được thêm/sửa/xoá/nhập; Tổ trưởng và Giáo viên chỉ xem. */
  canManage: boolean;
  grades: CurriculumOption[];
  fields: CurriculumField[];
  chapters: Chapter[];
}

export interface SaveChapterRequest {
  gradeLevelId: number;
  fieldId: number;
  code: string;
  title: string;
}

export interface SaveLessonRequest {
  code: string;
  title: string;
}

export interface CurriculumImportError {
  rowNumber: number;
  message: string;
}

export interface CurriculumImportPreview {
  rowCount: number;
  chapterCount: number;
  newChapterCount: number;
  lessonCount: number;
  errors: CurriculumImportError[];
  canImport: boolean;
}

export interface CurriculumImportResult {
  newChapterCount: number;
  lessonCount: number;
}
