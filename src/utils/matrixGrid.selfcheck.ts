/**
 * Tự kiểm tra phần chuyển đổi lưới, chạy khi `npm run dev`.
 * Vite thay import.meta.env.DEV bằng false lúc build nên file này bị loại khỏi bundle production.
 *
 * ponytail: dùng console.assert vì dự án chưa có test runner.
 * Khi thêm Vitest thì đổi console.assert thành expect, nội dung giữ nguyên.
 */
import type { GridRow, MatrixDetail } from '../types';
import {
  cellScore,
  formatPerQuestion,
  gridTotal,
  hasValidCellValues,
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
  percentage: number,
): MatrixDetail => ({
  id: 0,
  questionType: 'MULTIPLE_CHOICE',
  lessonId,
  cognitiveLevel,
  questionCount,
  percentage,
  cellScore: 0,
});

const row = (lessonId: number, cells: Partial<GridRow['cells']>): GridRow => ({
  key: `k${lessonId}`,
  lessonId,
  cells: {
    NHAN_BIET: { questionCount: '', percentage: '' },
    THONG_HIEU: { questionCount: '', percentage: '' },
    VAN_DUNG: { questionCount: '', percentage: '' },
    ...cells,
  },
});

export const selfCheck = () => {
  // 1. Đi vòng: phẳng → lưới → phẳng giữ nguyên dữ liệu (% gửi thẳng, không còn nhân/chia gì).
  const details = [detail(7, 'NHAN_BIET', 5, 25), detail(7, 'VAN_DUNG', 2, 10), detail(3, 'THONG_HIEU', 3, 15)];
  const roundTrip = toDetails(toGrid(details, [3, 7]));
  console.assert(roundTrip.length === 3, 'selfCheck 1: mất dòng khi đi vòng', roundTrip);
  console.assert(
    roundTrip.every((r) => details.some((d) => d.lessonId === r.lessonId && d.cognitiveLevel === r.cognitiveLevel && d.questionCount === r.questionCount && d.percentage === r.percentage)),
    'selfCheck 1: dữ liệu đổi khi đi vòng',
    roundTrip,
  );

  // 2. Thứ tự dòng theo lessonOrder, không theo thứ tự details.
  console.assert(toGrid(details, [3, 7])[0].lessonId === 3, 'selfCheck 2: sai thứ tự dòng');

  // 3. Ô rỗng hoàn toàn bị loại, ô điền một nửa thì KHÔNG bị nuốt.
  const halfFilled = [row(7, { NHAN_BIET: { questionCount: '5', percentage: '' } })];
  console.assert(toDetails(halfFilled).length === 1, 'selfCheck 3: ô điền nửa bị nuốt mất');
  console.assert(
    validateGrid(halfFilled, 'Ma trận', 1)['k7.NHAN_BIET.percentage'] !== undefined,
    'selfCheck 3: ô điền nửa không báo lỗi',
  );
  console.assert(toDetails([row(7, {})]).length === 0, 'selfCheck 3: ô rỗng không bị loại');
  console.assert(
    !hasValidCellValues(halfFilled[0].cells.NHAN_BIET) &&
      !hasValidCellValues({ questionCount: '2.5', percentage: '25' }) &&
      !hasValidCellValues({ questionCount: '1', percentage: '101' }) &&
      hasValidCellValues({ questionCount: '4', percentage: '25' }),
    'selfCheck 3: chỉ hiện điểm/câu khi số câu và tỷ lệ đều hợp lệ',
  );

  // 4. Hai dòng trùng bài học phải báo lỗi (backend trả DuplicateDetail).
  const duplicated = [
    row(7, { NHAN_BIET: { questionCount: '1', percentage: '10' } }),
    { ...row(7, { VAN_DUNG: { questionCount: '1', percentage: '10' } }), key: 'k7b' },
  ];
  console.assert(validateGrid(duplicated, 'Ma trận', 1)['k7b.lesson'] !== undefined, 'selfCheck 4: không bắt trùng bài học');

  // 5. Cộng % không được dính sai số dấu phẩy động.
  const floaty = [
    row(1, { NHAN_BIET: { questionCount: '1', percentage: '0.1' } }),
    { ...row(2, { NHAN_BIET: { questionCount: '1', percentage: '0.2' } }), key: 'k2' },
  ];
  console.assert(gridTotal(floaty).percentage === 0.3, 'selfCheck 5: 0.1 + 0.2 sai', gridTotal(floaty).percentage);

  // 6. Biên của % MỖI Ô: (0, 100]. 100 hợp lệ, 100,01 thì không. Dấu phẩy thập phân vẫn nhận.
  const atLimit = [row(1, { NHAN_BIET: { questionCount: '1', percentage: '100' } })];
  const overLimit = [row(1, { NHAN_BIET: { questionCount: '1', percentage: '100,01' } })];
  console.assert(validateGrid(atLimit, 'Ma trận', 1)['k1.NHAN_BIET.percentage'] === undefined, 'selfCheck 6: 100% bị từ chối');
  console.assert(validateGrid(overLimit, 'Ma trận', 1)['k1.NHAN_BIET.percentage'] !== undefined, 'selfCheck 6: 100,01% được chấp nhận');

  // 7. Chặn nộp ma trận rỗng ngay ở client.
  console.assert(requireNonEmpty([]) !== null, 'selfCheck 7: ma trận rỗng không bị chặn');
  console.assert(requireNonEmpty(atLimit) === null, 'selfCheck 7: ma trận có dòng lại bị chặn');

  // 8 & 9. Điểm ô / điểm mỗi câu là giá trị SUY RA từ Tổng điểm ma trận × % / 100 (ví dụ trong SRS:
  // tổng 10 điểm, 4 câu, 20% → điểm ô 2, điểm mỗi câu 0,5).
  const example = row(1, { NHAN_BIET: { questionCount: '4', percentage: '20' } });
  console.assert(cellScore(10, example.cells.NHAN_BIET) === 2, 'selfCheck 8: 10 × 20% phải ra điểm ô 2', cellScore(10, example.cells.NHAN_BIET));
  console.assert(
    formatPerQuestion(cellScore(10, example.cells.NHAN_BIET), 4) === '0,5',
    'selfCheck 9: điểm ô 2 / 4 câu phải ra 0,5 điểm mỗi câu',
  );

  // 10. Tổng 100% chỉ bắt khi NỘP/XÁC NHẬN. Lưu Nháp thì ở mọi tổng (kể cả rỗng): validateGrid không báo tổng.
  const cell = (percentage: string) => ({ NHAN_BIET: { questionCount: '1', percentage } });
  const exactlyOneHundred = [row(1, cell('33.3')), row(2, cell('33.3')), row(3, cell('33.4'))];
  const ninetyNineNinetyNine = [row(1, cell('99.99'))];
  const overOneHundred = [row(1, cell('60')), row(2, cell('60'))];
  console.assert(hasRequiredTotal(exactlyOneHundred), 'selfCheck 10: 33.3 + 33.3 + 33.4 phải bằng đúng 100', gridTotal(exactlyOneHundred).percentage);
  console.assert(validateTotalForSubmit(exactlyOneHundred) === null, 'selfCheck 10: đúng 100% phải nộp được');
  console.assert(validateTotalForSubmit(ninetyNineNinetyNine) !== null, 'selfCheck 10: 99.99% không được nộp');
  console.assert(validateTotalForSubmit(overOneHundred) !== null, 'selfCheck 10: 120% không được nộp');
  console.assert(validateTotalForSubmit([]) !== null, 'selfCheck 10: ma trận rỗng (tổng 0%) không được nộp');
  console.assert(Object.keys(validateGrid(ninetyNineNinetyNine, 'M', 1)).length === 0, 'selfCheck 10: lưu nháp 99.99% phải hợp lệ');
  console.assert(Object.keys(validateGrid(overOneHundred, 'M', 1)).length === 0, 'selfCheck 10: lưu nháp 120% phải hợp lệ');
  console.assert(Object.keys(validateGrid([], 'M', 1)).length === 0, 'selfCheck 10: lưu nháp rỗng phải hợp lệ');
  console.assert(totalScoreHint(ninetyNineNinetyNine) !== null, 'selfCheck 10: chưa đủ 100% phải có gợi ý');
  console.assert(totalScoreHint(exactlyOneHundred) === null, 'selfCheck 10: đủ 100% không được có gợi ý');
  console.assert(totalScoreHint([]) === null, 'selfCheck 10: rỗng không cần gợi ý tổng');
  console.assert(Object.keys(liveCellErrors(overOneHundred)).length === 0, 'selfCheck 10: vượt 100% (tổng) không còn là lỗi khi đang gõ');

  // 11. Điểm mỗi câu hiển thị: tròn thì đúng, không tròn thì có "≈" và tối đa 4 chữ số.
  console.assert(formatPerQuestion(2, 4) === '0,5', 'selfCheck 11: 2 điểm / 4 câu phải là 0,5', formatPerQuestion(2, 4));
  console.assert(formatPerQuestion(3.75, 15) === '0,25', 'selfCheck 11: 3,75 / 15 phải là 0,25', formatPerQuestion(3.75, 15));
  console.assert(formatPerQuestion(1, 3) === '≈ 0,3333', 'selfCheck 11: 1 / 3 phải là ≈ 0,3333', formatPerQuestion(1, 3));
  console.assert(formatPerQuestion(2, 3) === '≈ 0,6667', 'selfCheck 11: 2 / 3 phải là ≈ 0,6667', formatPerQuestion(2, 3));
  console.assert(formatPerQuestion(1, 7) === '≈ 0,1429', 'selfCheck 11: 1 / 7 phải là ≈ 0,1429', formatPerQuestion(1, 7));
  console.assert(formatPerQuestion(5, 0) === '', 'selfCheck 11: 0 câu không được chia');

  console.info('[matrixGrid] self-check xong');
};
