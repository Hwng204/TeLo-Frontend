/** Kiểm tra ghi/đọc .xlsx và nhận diện file nhập ma trận. Chạy trong chế độ dev (chưa có test runner). */
import type { LessonOption } from '../types';
import { readMatrixSheet, templateRows } from './matrixImport';
import { readFirstSheet, writeSheet } from './xlsx';

const lesson = (id: number, title: string): LessonOption => ({ id, title, contextId: 1, chapterId: 1, sortOrder: id });

export const matrixImportSelfCheck = async () => {
  const lessons = [lesson(1, 'Bài 1'), lesson(2, 'Bài 2'), lesson(3, 'Ôn tập'), lesson(4, 'Ôn tập')];

  // 1. File mẫu ghi ra đọc lại được, giữ nguyên chữ có dấu và số.
  const template = templateRows({ name: 'Toán 5 & "HK1"', totalScore: 10, contextLabel: 'Toán 5', semesterName: null, lessons });
  const sheet = await readFirstSheet(await writeSheet('Ma trận', template).arrayBuffer());
  console.assert(sheet[1][1] === 'Toán 5 & "HK1"', 'matrixImport 1: tên có ký tự đặc biệt phải giữ nguyên');
  console.assert(sheet[4][1] === '10', 'matrixImport 1b: tổng điểm ghi dạng số đọc lại là "10"');

  // 2. File mẫu chưa điền số: không lỗi, không dòng nào.
  const blank = readMatrixSheet(sheet, lessons);
  console.assert(blank.rows.length === 0 && blank.issues.length === 0 && blank.name === 'Toán 5 & "HK1"' && blank.totalScore === 10,
    'matrixImport 2: file mẫu trống phải đọc ra 0 dòng, 0 lỗi, giữ tên và tổng điểm');

  // 3. Điền số: gom theo bài, chấp nhận "20%", "2,5", chữ không dấu; báo lỗi đúng dòng.
  const header = sheet.findIndex((row) => row[0] === 'Bài học');
  const filled = sheet.map((row) => [...row]);
  const put = (line: number, count: string, percentage: string) => {
    filled[line - 1][3] = count;
    filled[line - 1][4] = percentage;
  };
  put(header + 2, '4', '20%');        // Bài 1 · Nhận biết
  put(header + 3, '4', '40');         // Bài 1 · Thông hiểu
  filled[header + 2][1] = 'thong hieu';
  put(header + 5, '2', '33,333333');  // Bài 2 · Nhận biết (làm tròn 33,33)
  filled[header + 4][0] = 'Chương 1 / Bài 2';  // tên theo kiểu file Xuất Excel
  put(header + 6, '1.5', '10');       // Bài 2 · Thông hiểu: số câu lẻ → cần sửa, vẫn đưa vào
  filled.push(['Bài 9', 'Nhận biết', '', '1', '5']);  // bài không có trong chương trình → bỏ qua
  filled.push(['Ôn tập', 'Vận dụng', '', '1', '5']);  // hai bài trùng tên → bỏ qua
  filled.push(['Bài 1', 'Nhận biết', '', '1', '5']);  // trùng ô với dòng đầu → bỏ qua

  const result = readMatrixSheet(filled, lessons);
  console.assert(result.rows.length === 2, 'matrixImport 3: hai bài học được nhận');
  console.assert(result.rows[0].cells.NHAN_BIET.percentage === '20' && result.rows[0].cells.THONG_HIEU.questionCount === '4',
    'matrixImport 3b: "20%" thành 20, "thong hieu" nhận ra Thông hiểu');
  console.assert(result.rows[1].cells.NHAN_BIET.percentage === '33.33', 'matrixImport 3c: "33,333333" làm tròn 33.33');
  console.assert(result.filledLines === 7, 'matrixImport 3d: đếm đúng 7 dòng có số liệu');
  const skipped = result.issues.filter((issue) => issue.skipped).map((issue) => issue.line);
  const toFix = result.issues.filter((issue) => !issue.skipped).map((issue) => issue.line);
  console.assert(skipped.join() === [filled.length - 2, filled.length - 1, filled.length].join(),
    'matrixImport 3e: ba dòng cuối bị bỏ qua, báo đúng số dòng Excel');
  console.assert(toFix.join() === String(header + 6), 'matrixImport 3f: số câu lẻ báo cần sửa đúng dòng');

  // 4. File không đúng mẫu.
  const wrong = readMatrixSheet([['Họ tên', 'Lớp']], lessons);
  console.assert(wrong.rows.length === 0 && wrong.issues[0]?.line === null, 'matrixImport 4: thiếu dòng tiêu đề phải báo lỗi cả file');

  // 5. Cùng tên bài ở hai chương ("Luyện tập chung"): file mẫu ghi nhãn kèm chương nên nhập lại nhận đúng từng bài;
  //    kiểu "Chương / Bài" của file Xuất Excel cũng nhận đúng; tên trơn thì không đoán.
  const practice = (id: number, code: string, chapterCode: string, chapterTitle: string): LessonOption => ({
    ...lesson(id, 'Luyện tập chung'), code, chapterCode, chapterTitle,
  });
  const twins = [practice(10, '9', '1', 'Ôn tập và bổ sung'), practice(11, '14', '2', 'Số thập phân')];
  const twinSheet = await readFirstSheet(
    await writeSheet('Ma trận', templateRows({ name: 'T', totalScore: 10, contextLabel: 'Toán 5', semesterName: null, lessons: twins })).arrayBuffer(),
  );
  const twinHeader = twinSheet.findIndex((row) => row[0] === 'Bài học');
  console.assert(twinSheet[twinHeader + 1][0] === 'Bài 9. Luyện tập chung — Chương 1. Ôn tập và bổ sung',
    'matrixImport 5a: file mẫu ghi nhãn bài kèm chương');
  const twinFilled = twinSheet.map((row) => [...row]);
  twinFilled[twinHeader + 1][3] = '1'; twinFilled[twinHeader + 1][4] = '10';  // bài 9 · Nhận biết
  twinFilled[twinHeader + 4][3] = '1'; twinFilled[twinHeader + 4][4] = '10';  // bài 14 · Nhận biết
  twinFilled.push(['Số thập phân / Luyện tập chung', 'Thông hiểu', '', '1', '10']);
  twinFilled.push(['Luyện tập chung', 'Vận dụng', '', '1', '10']);
  const twinResult = readMatrixSheet(twinFilled, twins);
  console.assert(twinResult.rows.map((row) => row.lessonId).join() === '10,11',
    'matrixImport 5b: hai bài cùng tên được nhận đúng theo nhãn có chương');
  console.assert(twinResult.rows[1].cells.THONG_HIEU.questionCount === '1',
    'matrixImport 5c: "Chương / Bài" của file Xuất Excel trỏ đúng bài của chương đó');
  console.assert(twinResult.issues.filter((issue) => issue.skipped).length === 1,
    'matrixImport 5d: tên bài trơn bị trùng thì bỏ qua, không đoán');

  console.info('[matrixImport] self-check xong');
};
