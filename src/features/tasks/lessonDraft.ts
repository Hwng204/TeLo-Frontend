/** Một thẻ bài học khi soạn: giữ nguyên chuỗi người dùng gõ, chỉ đổi sang số lúc kiểm tra và gửi đi. */
export type LessonDraft = {
  key: number;
  gradeLevelId: string;
  chapterId: string;
  lessonId: string;
  knowledge: string;
  understanding: string;
  application: string;
};

export type Level = 'knowledge' | 'understanding' | 'application';

export const LEVELS: { key: Level; label: string }[] = [
  { key: 'knowledge', label: 'Nhận biết' },
  { key: 'understanding', label: 'Thông hiểu' },
  { key: 'application', label: 'Vận dụng' },
];

export const MAX_QUESTIONS_PER_LEVEL = 1000;

/** Ô trống là 0 câu; null khi không phải số nguyên không âm. */
export const questionCount = (value: string): number | null =>
  value.trim() === '' ? 0 : /^\d+$/.test(value.trim()) ? Number(value) : null;

export const draftTotal = (draft: LessonDraft) =>
  LEVELS.reduce((sum, level) => sum + (questionCount(draft[level.key]) ?? 0), 0);

export const chapterLabel = (code: string, title: string) => `Chương ${code ? `${code}. ` : ''}${title}`;
export const lessonLabel = (code: string, title: string) => `Bài ${code ? `${code}. ` : ''}${title}`;

/** Cùng quy tắc với TaskRules.QuestionTask của backend; trả câu báo lỗi đầu tiên, null khi hợp lệ. */
export const lessonsProblem = (lessons: LessonDraft[]): string | null => {
  if (lessons.length === 0) return 'Thêm ít nhất một bài học.';
  if (lessons.length > 50) return 'Một nhiệm vụ tối đa 50 bài học.';
  if (lessons.some((lesson) => !lesson.lessonId)) return 'Chọn khối lớp, chương và bài học cho mọi thẻ bài học.';
  if (new Set(lessons.map((lesson) => lesson.lessonId)).size !== lessons.length) return 'Mỗi bài học chỉ được chọn một lần.';
  const counts = lessons.flatMap((lesson) => LEVELS.map((level) => questionCount(lesson[level.key])));
  if (counts.some((count) => count === null)) return 'Số câu phải là số nguyên không âm.';
  if (counts.some((count) => count! > MAX_QUESTIONS_PER_LEVEL)) return `Mỗi mức nhận thức tối đa ${MAX_QUESTIONS_PER_LEVEL} câu.`;
  if (lessons.some((lesson) => draftTotal(lesson) === 0)) return 'Mỗi bài học cần ít nhất một câu hỏi.';
  return null;
};
