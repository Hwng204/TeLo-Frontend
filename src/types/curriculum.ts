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
  number: number;
  title: string;
  /** Đã có ma trận/nhiệm vụ dùng: xoá thì chỉ lưu trữ, không xoá hẳn. */
  inUse: boolean;
}

export interface Chapter {
  id: number;
  gradeLevelId: number;
  gradeLevelName: string;
  fieldId: number;
  fieldName: string;
  number: number;
  title: string;
  /** Có bài đã được dùng: xoá thì chỉ lưu trữ, không đổi được khối lớp/lĩnh vực. */
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
  number: number;
  title: string;
}

export interface SaveLessonRequest {
  number: number;
  title: string;
}

/** Xoá chương/bài: chưa dùng thì xoá hẳn, đang dùng thì chỉ lưu trữ (ẩn khỏi danh sách và ma trận mới). */
export interface CurriculumDeleteResult {
  archived: boolean;
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
