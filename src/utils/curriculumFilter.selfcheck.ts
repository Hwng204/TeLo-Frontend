/**
 * Regression checks for chapter filtering. Runs only in Vite development mode.
 *
 * ponytail: console.assert because this project has no test runner.
 */
import type { Chapter } from '../types';
import { filterChapters } from './curriculumFilter';

const lesson = (id: number, code: string, title: string) => ({ id, chapterId: 1, code, title, sortOrder: id, inUse: false });

const chapters: Chapter[] = [
  {
    id: 1, gradeLevelId: 5, gradeLevelName: 'Lớp 5', fieldId: 1, fieldName: 'Số và phép tính',
    code: '1', title: 'Ôn tập và bổ sung', sortOrder: 1, inUse: false,
    lessons: [lesson(1, '1', 'Ôn tập số tự nhiên'), lesson(2, '7', 'Hỗn số')],
  },
  {
    id: 2, gradeLevelId: 5, gradeLevelName: 'Lớp 5', fieldId: 2, fieldName: 'Hình học và đo lường',
    code: '3', title: 'Một số đơn vị đo diện tích', sortOrder: 2, inUse: false, lessons: [],
  },
];

export const curriculumFilterSelfCheck = () => {
  console.assert(filterChapters(chapters, { keyword: '' }).length === 2, 'curriculumFilter 1: không lọc thì giữ mọi chương');

  const byLesson = filterChapters(chapters, { keyword: '  hỗn  SỐ ' });
  console.assert(
    byLesson.length === 1 && byLesson[0].matchedByLesson && byLesson[0].lessons.length === 1,
    'curriculumFilter 2: khớp ở bài thì chỉ giữ bài khớp và tự mở rộng',
  );

  const byChapter = filterChapters(chapters, { keyword: 'ôn tập' });
  console.assert(
    byChapter.length === 1 && !byChapter[0].matchedByLesson && byChapter[0].lessons.length === 2,
    'curriculumFilter 3: khớp ở chương thì giữ đủ bài',
  );

  console.assert(filterChapters(chapters, { keyword: 'on tap' }).length === 0, 'curriculumFilter 4: phân biệt dấu');
  console.assert(
    filterChapters(chapters, { keyword: '', fieldId: 2 }).map((item) => item.chapter.id).join() === '2',
    'curriculumFilter 5: lọc theo lĩnh vực',
  );
};
