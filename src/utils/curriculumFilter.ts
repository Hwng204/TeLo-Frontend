import type { Chapter, Lesson } from '../types';

export type CurriculumFilter = {
  keyword: string;
  gradeLevelId?: number;
  fieldId?: number;
};

export type VisibleChapter = {
  chapter: Chapter;
  /** Bài hiển thị khi mở rộng: tất cả, hoặc chỉ những bài khớp từ khoá. */
  lessons: Lesson[];
  /** Chỉ khớp ở bài: tự mở rộng để người dùng thấy ngay bài tìm được. */
  matchedByLesson: boolean;
};

/** So khớp không phân biệt hoa thường, bỏ khoảng trắng thừa; vẫn phân biệt dấu như backend. */
const fold = (value: string) => value.normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleUpperCase('vi');

const matches = (keyword: string, ...values: string[]) => values.some((value) => fold(value).includes(keyword));

/**
 * Lọc danh sách chương ở client: một phân hiệu chỉ có vài chục chương nên tải một lần rồi lọc tại chỗ.
 * Chương khớp theo mã/tên thì giữ đủ bài; chương chỉ khớp ở bài thì chỉ giữ những bài khớp.
 */
export const filterChapters = (chapters: Chapter[], filter: CurriculumFilter): VisibleChapter[] => {
  const keyword = fold(filter.keyword);
  return chapters.flatMap((chapter): VisibleChapter[] => {
    if (filter.gradeLevelId !== undefined && chapter.gradeLevelId !== filter.gradeLevelId) return [];
    if (filter.fieldId !== undefined && chapter.fieldId !== filter.fieldId) return [];
    if (!keyword || matches(keyword, chapter.code, chapter.title)) {
      return [{ chapter, lessons: chapter.lessons, matchedByLesson: false }];
    }
    const lessons = chapter.lessons.filter((lesson) => matches(keyword, lesson.code, lesson.title));
    return lessons.length > 0 ? [{ chapter, lessons, matchedByLesson: true }] : [];
  });
};

export const isFiltered = (filter: CurriculumFilter) =>
  fold(filter.keyword).length > 0 || filter.gradeLevelId !== undefined || filter.fieldId !== undefined;
