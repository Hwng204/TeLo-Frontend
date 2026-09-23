/**
 * Nhập chi tiết ma trận từ Excel. Định dạng trùng với file "Xuất Excel" của backend
 * (Infrastructure/Exports/ClosedXmlMatrixWorkbookExporter.cs): vài dòng thông tin ở đầu
 * ("Tên ma trận", "Tổng điểm"...), rồi dòng tiêu đề "Bài học | Mức nhận thức | Loại câu hỏi |
 * Số câu | Tỷ lệ % | Điểm", mỗi dòng dưới là một bài học ở một mức. Nhờ vậy file xuất từ một
 * ma trận có sẵn nhập lại được ngay, và file mẫu cũng chỉ là một bản xuất chưa điền số.
 *
 * Tìm cột theo tên tiêu đề (không theo vị trí) và so chữ không phân biệt hoa thường/dấu,
 * vì người dùng hay chèn cột hoặc gõ "Nhan biet".
 */
import type { GridRow, LessonOption, MatrixImportIssue, MatrixImportResult, XlsxCell } from '../types';
import { LEVELS, LEVEL_LABELS, cellErrorKey, newRow, validateGrid } from './matrixGrid';

export const IMPORT_HEADERS = ['Bài học', 'Mức nhận thức', 'Loại câu hỏi', 'Số câu', 'Tỷ lệ %', 'Điểm'];
export const IMPORT_COLUMN_WIDTHS = [36, 16, 14, 10, 10, 10];

/** "Nhận Biết " → "nhan biet". */
export const fold = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/đ/g, 'd')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Số từ Excel có thể ra "33.329999999999998" hoặc chữ "20%" / "2,5": làm tròn 2 chữ số, bỏ dấu %.
 * Giá trị không phải số giữ nguyên để validateGrid báo đúng lỗi.
 */
const tidyNumber = (raw: string) => {
  const text = raw.trim().replace(/%$/, '').trim().replace(',', '.');
  if (/^-?\d+(\.\d+)?(e-?\d+)?$/i.test(text)) return String(Math.round(Number(text) * 100) / 100);
  return text;
};

const LEVEL_BY_NAME = new Map(
  LEVELS.flatMap((level) => [
    [fold(LEVEL_LABELS[level]), level] as const,
    [fold(level.replace('_', ' ')), level] as const,
    [fold(level), level] as const,
  ]),
);

type TemplateInput = {
  name: string;
  totalScore: number;
  contextLabel: string;
  semesterName: string | null;
  lessons: LessonOption[];
};

/** Nội dung file mẫu: thông tin ma trận đang soạn + mọi bài học × 3 mức, chưa điền số. */
export const templateRows = ({ name, totalScore, contextLabel, semesterName, lessons }: TemplateInput): XlsxCell[][] => [
  [{ value: 'Ma trận đề thi', bold: true }],
  ['Tên ma trận', name],
  ['Ngữ cảnh học thuật', contextLabel],
  ['Học kỳ', semesterName ?? ''],
  ['Tổng điểm', totalScore],
  [
    'Hướng dẫn',
    'Chỉ điền Số câu và Tỷ lệ % (số, không gõ dấu %). Dòng để trống sẽ bị bỏ qua. Không sửa tên bài học và mức nhận thức.',
  ],
  [],
  IMPORT_HEADERS.map((value) => ({ value, bold: true })),
  ...lessons.flatMap((lesson) => LEVELS.map((level) => [lesson.title, LEVEL_LABELS[level], 'Trắc nghiệm', null, null, null])),
];

const EMPTY_RESULT = { rows: [], name: null, totalScore: null, filledLines: 0 };

export const readMatrixSheet = (sheet: string[][], lessons: LessonOption[]): MatrixImportResult => {
  const headerIndex = sheet.findIndex((row) => {
    const folded = row.map(fold);
    return folded.includes('bai hoc') && folded.includes('muc nhan thuc');
  });
  const header = headerIndex >= 0 ? sheet[headerIndex].map(fold) : [];
  const column = {
    lesson: header.indexOf('bai hoc'),
    level: header.indexOf('muc nhan thuc'),
    count: header.indexOf('so cau'),
    percentage: header.findIndex((title) => title.startsWith('ty le')),
  };
  if (Object.values(column).some((index) => index < 0)) {
    return {
      ...EMPTY_RESULT,
      issues: [
        {
          line: null,
          skipped: true,
          message: 'Không tìm thấy dòng tiêu đề "Bài học | Mức nhận thức | Số câu | Tỷ lệ %". Hãy dùng file mẫu hoặc file Xuất Excel.',
        },
      ],
    };
  }

  let name: string | null = null;
  let totalScore: number | null = null;
  for (const row of sheet.slice(0, headerIndex)) {
    const label = fold(row[0] ?? '');
    const value = (row[1] ?? '').trim();
    if (label === 'ten ma tran' && value) name = value;
    if (label === 'tong diem' && /^\d+$/.test(tidyNumber(value)) && Number(tidyNumber(value)) > 0) {
      totalScore = Number(tidyNumber(value));
    }
  }

  const byTitle = new Map<string, LessonOption[]>();
  for (const lesson of lessons) byTitle.set(fold(lesson.title), [...(byTitle.get(fold(lesson.title)) ?? []), lesson]);

  const issues: MatrixImportIssue[] = [];
  const rows = new Map<number, GridRow>();
  /** `${rowKey}.${level}` → dòng trong file, để báo lỗi số liệu đúng dòng người dùng nhìn thấy. */
  const origin = new Map<string, number>();
  let filledLines = 0;

  sheet.slice(headerIndex + 1).forEach((cells, offset) => {
    const line = headerIndex + offset + 2;
    const count = tidyNumber(cells[column.count] ?? '');
    const percentage = tidyNumber(cells[column.percentage] ?? '');
    // Dòng của file mẫu chưa điền số (hoặc dòng trống) không phải lỗi, chỉ bỏ qua.
    if (!count && !percentage) return;
    filledLines += 1;

    const title = (cells[column.lesson] ?? '').trim();
    const levelText = (cells[column.level] ?? '').trim();
    const skip = (message: string) => issues.push({ line, message, skipped: true });

    if (!title) return skip('Thiếu tên bài học.');
    const level = LEVEL_BY_NAME.get(fold(levelText));
    if (!level) return skip(`Mức nhận thức "${levelText}" không hợp lệ (cần Nhận biết, Thông hiểu hoặc Vận dụng).`);
    // File Xuất Excel ghi "Chương 1 / Bài 1" (MatrixReferenceRepository), file mẫu ghi "Bài 1": nhận cả hai.
    const matches = byTitle.get(fold(title)) ?? byTitle.get(fold(title.split(' / ').at(-1) ?? '')) ?? [];
    if (matches.length === 0) return skip(`Không có bài "${title}" trong chương trình đã chọn.`);
    if (matches.length > 1) return skip(`Chương trình có ${matches.length} bài cùng tên "${title}", không xác định được bài nào.`);

    const lesson = matches[0];
    const row = rows.get(lesson.id) ?? newRow(lesson.id);
    rows.set(lesson.id, row);
    const cellKey = `${row.key}.${level}`;
    if (origin.has(cellKey)) {
      return skip(`Bài "${title}", mức ${LEVEL_LABELS[level]} đã có ở dòng ${origin.get(cellKey)}.`);
    }
    row.cells[level] = { questionCount: count, percentage };
    origin.set(cellKey, line);
  });

  // Theo thứ tự bài trong sách, giống lưới soạn.
  const order = new Map(lessons.map((lesson, index) => [lesson.id, index]));
  const gridRows = [...rows.values()].sort((a, b) => (order.get(a.lessonId) ?? 0) - (order.get(b.lessonId) ?? 0));

  // Số liệu sai vẫn đưa vào bảng (người dùng sửa ngay tại chỗ), nhưng báo trước ở đây.
  const errors = validateGrid(gridRows, 'x', 1);
  for (const row of gridRows) {
    for (const level of LEVELS) {
      for (const field of ['count', 'percentage'] as const) {
        const message = errors[cellErrorKey(row.key, level, field)];
        if (message) issues.push({ line: origin.get(`${row.key}.${level}`) ?? null, message, skipped: false });
      }
    }
  }
  issues.sort((a, b) => (a.line ?? 0) - (b.line ?? 0));

  return { rows: gridRows, name, totalScore, issues, filledLines };
};
