/**
 * Tự kiểm tra phần chuyển đổi lưới, chạy khi `npm run dev`.
 * Vite thay import.meta.env.DEV bằng false lúc build nên file này bị loại khỏi bundle production.
 *
 * ponytail: dùng console.assert vì dự án chưa có test runner.
 * Khi thêm Vitest thì đổi console.assert thành expect, nội dung giữ nguyên.
 */
import type { GridRow, MatrixDetail } from '../types';
import {
  formatPerQuestion,
  gridTotal,
  hasRequiredTotal,
  liveCellErrors,
  requireNonEmpty,
  toDetails,
  toGrid,
  totalScoreHint,
  validateGrid,
  validateTotalForSubmit,
} from './matrixGrid';

const detail = (
  lessonId: number,
  cognitiveLevel: MatrixDetail['cognitiveLevel'],
  questionCount: number,
  allocatedScore: number,
): MatrixDetail => ({ id: 0, questionType: 'MULTIPLE_CHOICE', lessonId, cognitiveLevel, questionCount, allocatedScore });

const row = (lessonId: number, cells: Partial<GridRow['cells']>): GridRow => ({
  key: `k${lessonId}`,
  lessonId,
  cells: {
    NHAN_BIET: { questionCount: '', allocatedScore: '' },
    THONG_HIEU: { questionCount: '', allocatedScore: '' },
    VAN_DUNG: { questionCount: '', allocatedScore: '' },
    ...cells,
  },
});

export const selfCheck = () => {
  // 1. Đi vòng: phẳng → lưới → phẳng giữ nguyên dữ liệu.
  const details = [detail(7, 'NHAN_BIET', 5, 2.5), detail(7, 'VAN_DUNG', 2, 1), detail(3, 'THONG_HIEU', 3, 1.5)];
  const roundTrip = toDetails(toGrid(details, [3, 7]));
  console.assert(roundTrip.length === 3, 'selfCheck 1: mất dòng khi đi vòng', roundTrip);
  console.assert(
    roundTrip.every((r) => details.some((d) => d.lessonId === r.lessonId && d.cognitiveLevel === r.cognitiveLevel && d.questionCount === r.questionCount && d.allocatedScore === r.allocatedScore)),
    'selfCheck 1: dữ liệu đổi khi đi vòng',
    roundTrip,
  );

  // 2. Thứ tự dòng theo lessonOrder, không theo thứ tự details.
  console.assert(toGrid(details, [3, 7])[0].lessonId === 3, 'selfCheck 2: sai thứ tự dòng');

  // 3. Ô rỗng hoàn toàn bị loại, ô điền một nửa thì KHÔNG bị nuốt.
  const halfFilled = [row(7, { NHAN_BIET: { questionCount: '5', allocatedScore: '' } })];
  console.assert(toDetails(halfFilled).length === 1, 'selfCheck 3: ô điền nửa bị nuốt mất');
  console.assert(
    validateGrid(halfFilled, 'Ma trận', 1)['k7.NHAN_BIET.score'] !== undefined,
    'selfCheck 3: ô điền nửa không báo lỗi',
  );
  console.assert(toDetails([row(7, {})]).length === 0, 'selfCheck 3: ô rỗng không bị loại');

  // 4. Hai dòng trùng bài học phải báo lỗi (backend trả DuplicateDetail).
  const duplicated = [
    row(7, { NHAN_BIET: { questionCount: '1', allocatedScore: '1' } }),
    { ...row(7, { VAN_DUNG: { questionCount: '1', allocatedScore: '1' } }), key: 'k7b' },
  ];
  console.assert(validateGrid(duplicated, 'Ma trận', 1)['k7b.lesson'] !== undefined, 'selfCheck 4: không bắt trùng bài học');

  // 5. Cộng điểm không được dính sai số dấu phẩy động.
  const floaty = [
    row(1, { NHAN_BIET: { questionCount: '1', allocatedScore: '0.1' } }),
    { ...row(2, { NHAN_BIET: { questionCount: '1', allocatedScore: '0.2' } }), key: 'k2' },
  ];
  console.assert(gridTotal(floaty).score === 0.3, 'selfCheck 5: 0.1 + 0.2 sai', gridTotal(floaty).score);

  // 6. Biên của TỔNG điểm ô (điểm mỗi câu × số câu): 999,99 hợp lệ, 1000 thì không.
  //    Dấu phẩy thập phân vẫn nhận.
  const atLimit = [row(1, { NHAN_BIET: { questionCount: '1', allocatedScore: '999,99' } })];
  const overLimit = [row(1, { NHAN_BIET: { questionCount: '1', allocatedScore: '1000' } })];
  const overByCount = [row(1, { NHAN_BIET: { questionCount: '5', allocatedScore: '250' } })]; // 1250 tổng
  console.assert(validateGrid(atLimit, 'Ma trận', 1)['k1.NHAN_BIET.score'] === undefined, 'selfCheck 6: 999,99 bị từ chối');
  console.assert(validateGrid(overLimit, 'Ma trận', 1)['k1.NHAN_BIET.score'] !== undefined, 'selfCheck 6: 1000 được chấp nhận');
  console.assert(validateGrid(overByCount, 'Ma trận', 1)['k1.NHAN_BIET.score'] !== undefined, 'selfCheck 6: tổng ô 1250 được chấp nhận');

  // 8. Điểm nhập là ĐIỂM MỖI CÂU: tổng ô = mỗi câu × số câu, và gửi lên backend là tổng.
  const perQuestion = [row(1, { NHAN_BIET: { questionCount: '15', allocatedScore: '0.25' } })];
  console.assert(gridTotal(perQuestion).score === 3.75, 'selfCheck 8: 15 câu × 0.25 phải ra 3.75', gridTotal(perQuestion).score);
  console.assert(toDetails(perQuestion)[0].allocatedScore === 3.75, 'selfCheck 8: gửi backend phải là tổng ô 3.75');

  // 9. Nạp từ backend (tổng ô) rồi lưu lại phải ra đúng tổng cũ, kể cả khi chia không tròn.
  const stored = [detail(2, 'NHAN_BIET', 3, 1), detail(2, 'VAN_DUNG', 4, 2)];
  const back = toDetails(toGrid(stored, [2]));
  console.assert(
    back.find((d) => d.cognitiveLevel === 'NHAN_BIET')?.allocatedScore === 1 &&
      back.find((d) => d.cognitiveLevel === 'VAN_DUNG')?.allocatedScore === 2,
    'selfCheck 9: đi vòng tổng ô làm lệch điểm (1 điểm / 3 câu phải về đúng 1)',
    back,
  );
  console.assert(toGrid(stored, [2])[0].cells.VAN_DUNG.allocatedScore === '0.5', 'selfCheck 9: 2 điểm / 4 câu phải hiện 0.5 điểm mỗi câu');

  // 7. Chặn nộp ma trận rỗng ngay ở client.
  console.assert(requireNonEmpty([]) !== null, 'selfCheck 7: ma trận rỗng không bị chặn');
  console.assert(requireNonEmpty(atLimit) === null, 'selfCheck 7: ma trận có dòng lại bị chặn');

  // 10. Tổng 10 chỉ bắt khi NỘP/XÁC NHẬN. Lưu Nháp thì ở mọi tổng (kể cả rỗng): validateGrid không báo tổng.
  const cell = (score: string) => ({ NHAN_BIET: { questionCount: '1', allocatedScore: score } });
  const exactlyTen = [row(1, cell('3.3')), row(2, cell('3.3')), row(3, cell('3.4'))];
  const nineNinetyNine = [row(1, cell('9.99'))];
  const overTen = [row(1, cell('10.01'))];
  console.assert(hasRequiredTotal(exactlyTen), 'selfCheck 10: 3.3 + 3.3 + 3.4 phải bằng đúng 10', gridTotal(exactlyTen).score);
  console.assert(validateTotalForSubmit(exactlyTen) === null, 'selfCheck 10: đúng 10 phải nộp được');
  console.assert(validateTotalForSubmit(nineNinetyNine) !== null, 'selfCheck 10: 9.99 không được nộp');
  console.assert(validateTotalForSubmit(overTen) !== null, 'selfCheck 10: 10.01 không được nộp');
  console.assert(validateTotalForSubmit([]) !== null, 'selfCheck 10: ma trận rỗng (tổng 0) không được nộp');
  console.assert(Object.keys(validateGrid(nineNinetyNine, 'M', 1)).length === 0, 'selfCheck 10: lưu nháp 9.99 phải hợp lệ');
  console.assert(Object.keys(validateGrid(overTen, 'M', 1)).length === 0, 'selfCheck 10: lưu nháp 10.01 phải hợp lệ');
  console.assert(Object.keys(validateGrid([], 'M', 1)).length === 0, 'selfCheck 10: lưu nháp rỗng phải hợp lệ');
  console.assert(totalScoreHint(nineNinetyNine) !== null, 'selfCheck 10: chưa đủ 10 phải có gợi ý');
  console.assert(totalScoreHint(exactlyTen) === null, 'selfCheck 10: đủ 10 không được có gợi ý');
  console.assert(totalScoreHint([]) === null, 'selfCheck 10: rỗng không cần gợi ý tổng');
  console.assert(Object.keys(liveCellErrors(overTen)).length === 0, 'selfCheck 10: vượt 10 không còn là lỗi khi đang gõ');

  // 11. Điểm mỗi câu hiển thị: tròn thì đúng, không tròn thì có "≈" và tối đa 4 chữ số.
  console.assert(formatPerQuestion(2, 4) === '0,5', 'selfCheck 11: 2 điểm / 4 câu phải là 0,5', formatPerQuestion(2, 4));
  console.assert(formatPerQuestion(3.75, 15) === '0,25', 'selfCheck 11: 3,75 / 15 phải là 0,25', formatPerQuestion(3.75, 15));
  console.assert(formatPerQuestion(1, 3) === '≈ 0,3333', 'selfCheck 11: 1 / 3 phải là ≈ 0,3333', formatPerQuestion(1, 3));
  console.assert(formatPerQuestion(2, 3) === '≈ 0,6667', 'selfCheck 11: 2 / 3 phải là ≈ 0,6667', formatPerQuestion(2, 3));
  console.assert(formatPerQuestion(1, 7) === '≈ 0,1429', 'selfCheck 11: 1 / 7 phải là ≈ 0,1429', formatPerQuestion(1, 7));
  console.assert(formatPerQuestion(5, 0) === '', 'selfCheck 11: 0 câu không được chia');

  console.info('[matrixGrid] self-check xong');
};
