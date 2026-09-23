/**
 * Backend lưu chi tiết ma trận dạng phẳng: mỗi bản ghi là một ô (bài học × mức nhận thức).
 * Giao diện lại hiển thị dạng lưới: mỗi dòng một bài học, ba cột mức nhận thức,
 * mỗi cột hai ô nhập (Câu, Tỷ lệ %). File này lo việc chuyển đổi hai chiều và kiểm tra dữ liệu.
 *
 * Thang điểm theo tỷ lệ %: người dùng gõ thẳng `percentage` (0, 100] cho mỗi ô — không còn
 * phải nhân/chia gì khi round-trip với backend. Điểm ô và điểm mỗi câu là giá trị SUY RA từ
 * `Tổng điểm ma trận × percentage / 100` (xem cellScore()), chỉ để hiển thị.
 *
 * Đây là chỗ duy nhất trong module ma trận có logic sai được một cách im lặng,
 * nên có self-check đi kèm: matrixGrid.selfcheck.ts.
 */
import type {
  CognitiveLevel,
  GridCell,
  GridRow,
  MatrixDetail,
  MatrixDetailRequest,
} from '../types';

export const LEVELS: readonly CognitiveLevel[] = ['NHAN_BIET', 'THONG_HIEU', 'VAN_DUNG'];

export const LEVEL_LABELS: Record<CognitiveLevel, string> = {
  NHAN_BIET: 'Nhận biết',
  THONG_HIEU: 'Thông hiểu',
  VAN_DUNG: 'Vận dụng',
};

/** Trần tỷ lệ % mỗi ô — không có ô nào chiếm quá 100% một mình. */
export const MAX_PERCENTAGE = 100;
/** Tổng % cả ma trận phải đúng bằng số này khi Nộp / Xác nhận / sửa bản Đã nộp (backend: InvalidTotalScore). */
export const REQUIRED_TOTAL_PERCENTAGE = 100;
export const MAX_NAME_LENGTH = 255;
/** Khớp cột decimal(5,2) của backend: tối đa 2 chữ số thập phân. */
export const PERCENTAGE_DECIMALS = 2;
/** Tối đa 4 chữ số khi HIỂN THỊ điểm mỗi câu suy ra (giá trị chia có thể không tròn). */
export const PER_QUESTION_DECIMALS = 4;

const emptyCells = (): Record<CognitiveLevel, GridCell> => ({
  NHAN_BIET: { questionCount: '', percentage: '' },
  THONG_HIEU: { questionCount: '', percentage: '' },
  VAN_DUNG: { questionCount: '', percentage: '' },
});

/**
 * Dòng mới chưa chọn bài học nên phải có key ngẫu nhiên.
 * Dòng dựng từ dữ liệu server dùng key theo bài học (xem toGrid) để mỗi lần tính lại
 * vẫn ra đúng key cũ, nhờ đó React không dựng lại input và con trỏ không bị nhảy.
 */
export const newRow = (lessonId = 0): GridRow => ({
  key: crypto.randomUUID(),
  lessonId,
  cells: emptyCells(),
});

const isBlank = (value: string) => value.trim() === '';
export const isCellEmpty = (cell: GridCell) =>
  isBlank(cell.questionCount) && isBlank(cell.percentage);

/** Chấp nhận cả dấu phẩy thập phân vì người dùng Việt hay gõ "2,5". */
const normalize = (value: string) => value.trim().replace(',', '.');

const parseCount = (value: string): number | null => {
  const text = normalize(value);
  if (!/^\d+$/.test(text)) return null;
  return Number(text);
};

const parsePercentage = (value: string): number | null => {
  const text = normalize(value);
  if (!new RegExp(`^\\d+(\\.\\d{1,${PERCENTAGE_DECIMALS}})?$`).test(text)) return null;
  return Number(text);
};

export const hasValidCellValues = (cell: GridCell): boolean => {
  const count = parseCount(cell.questionCount);
  const percentage = parsePercentage(cell.percentage);
  return count !== null && count > 0 && percentage !== null && percentage > 0 && percentage <= MAX_PERCENTAGE;
};

/** % của một ô, hoặc 0 nếu chưa gõ/không hợp lệ — dùng khi cộng tổng. */
export const cellPercentage = (cell: GridCell): number => parsePercentage(cell.percentage) ?? 0;

/** Cộng theo số nguyên phần trăm (× 100), nếu không 0.1 + 0.2 sẽ ra 0.30000000000000004. */
const sumValues = (values: number[]) =>
  values.reduce((total, value) => total + Math.round(value * 100), 0) / 100;

export const formatScore = (value: number) =>
  value.toLocaleString('vi-VN', { maximumFractionDigits: 2 });

/** Điểm ô suy ra = Tổng điểm ma trận × % / 100, làm tròn 2 chữ số. */
export const cellScore = (matrixTotalScore: number, cell: GridCell): number =>
  Math.round(matrixTotalScore * cellPercentage(cell)) / 100;

/**
 * Điểm mỗi câu suy ra từ điểm ô và số câu, dùng để hiển thị.
 * Tối đa 4 chữ số thập phân; thêm "≈" khi làm tròn rồi nhân lại KHÔNG ra đúng tổng
 * (1 điểm / 3 câu → "≈ 0,3333"), để không ai đọc 3 × 0,33 = 0,99 rồi tưởng tổng sai.
 */
export const formatPerQuestion = (total: number, count: number): string => {
  if (count <= 0) return '';
  const rounded = Number((total / count).toFixed(PER_QUESTION_DECIMALS));
  const scale = 10 ** PER_QUESTION_DECIMALS;
  const exact = Math.round(rounded * scale) * count === Math.round(total * scale);
  const text = rounded.toLocaleString('vi-VN', { maximumFractionDigits: PER_QUESTION_DECIMALS });
  return exact ? text : `≈ ${text}`;
};

/**
 * Phẳng → lưới. Gom theo bài học, sắp theo thứ tự `lessonOrder`
 * (chính là thứ tự backend trả về: theo chương rồi theo bài).
 * Bài học không còn trong sách vẫn giữ lại và đẩy xuống cuối —
 * nuốt mất dòng của người dùng là cách làm mất dữ liệu trong im lặng.
 */
export const toGrid = (details: MatrixDetail[], lessonOrder: number[]): GridRow[] => {
  const rows = new Map<number, GridRow>();

  for (const detail of details) {
    let row = rows.get(detail.lessonId);
    if (!row) {
      row = { key: `L${detail.lessonId}`, lessonId: detail.lessonId, cells: emptyCells() };
      rows.set(detail.lessonId, row);
    }
    row.cells[detail.cognitiveLevel] = {
      questionCount: String(detail.questionCount),
      percentage: String(detail.percentage),
    };
  }

  const rank = new Map(lessonOrder.map((lessonId, index) => [lessonId, index]));
  return [...rows.values()].sort(
    (a, b) =>
      (rank.get(a.lessonId) ?? Number.MAX_SAFE_INTEGER) -
      (rank.get(b.lessonId) ?? Number.MAX_SAFE_INTEGER),
  );
};

/**
 * Lưới → phẳng. Chỉ bỏ ô mà CẢ HAI trường đều rỗng.
 * Ô điền một nửa được giữ lại để validateGrid báo lỗi; nếu bỏ ở đây thì người dùng
 * gõ số câu rồi quên % điểm sẽ thấy dòng biến mất sau khi lưu mà không có thông báo nào.
 */
export const toDetails = (rows: GridRow[]): MatrixDetailRequest[] =>
  rows.flatMap((row) =>
    LEVELS.filter((level) => !isCellEmpty(row.cells[level])).map((level) => ({
      lessonId: row.lessonId,
      cognitiveLevel: level,
      questionCount: parseCount(row.cells[level].questionCount) ?? 0,
      percentage: cellPercentage(row.cells[level]),
    })),
  );

export const rowTotal = (row: GridRow) => {
  const filled = LEVELS.map((level) => row.cells[level]).filter((cell) => !isCellEmpty(cell));
  return {
    questions: filled.reduce((total, cell) => total + (parseCount(cell.questionCount) ?? 0), 0),
    percentage: sumValues(filled.map(cellPercentage)),
  };
};

export const columnTotal = (rows: GridRow[], level: CognitiveLevel) => {
  const filled = rows.map((row) => row.cells[level]).filter((cell) => !isCellEmpty(cell));
  return {
    questions: filled.reduce((total, cell) => total + (parseCount(cell.questionCount) ?? 0), 0),
    percentage: sumValues(filled.map(cellPercentage)),
  };
};

export const gridTotal = (rows: GridRow[]) => {
  const totals = rows.map(rowTotal);
  return {
    questions: totals.reduce((total, row) => total + row.questions, 0),
    percentage: sumValues(totals.map((row) => row.percentage)),
  };
};

export const cellErrorKey = (rowKey: string, level: CognitiveLevel, field: 'count' | 'percentage') =>
  `${rowKey}.${level}.${field}`;

export const rowErrorKey = (rowKey: string) => `${rowKey}.lesson`;

/**
 * Kiểm tra theo đúng luật backend để không tốn một vòng gọi mạng chỉ để nhận lỗi.
 * Khoá trả về khớp với cellErrorKey/rowErrorKey, cộng 'name', 'academicContextId', '_form'.
 *
 * Chi tiết rỗng vẫn hợp lệ ở đây vì backend cho phép lưu ma trận chưa có dòng nào;
 * việc chặn nộp/xác nhận là của requireNonEmpty().
 */
export const validateGrid = (
  rows: GridRow[],
  name: string,
  academicContextId: number | null,
): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (name.trim() === '') {
    errors.name = 'Tên ma trận là bắt buộc.';
  } else if (name.trim().length > MAX_NAME_LENGTH) {
    errors.name = `Tên ma trận tối đa ${MAX_NAME_LENGTH} ký tự.`;
  }

  if (!academicContextId) {
    errors.academicContextId = 'Chọn đủ Chương trình, Môn học, Khối lớp và Năm học.';
  }

  const seenLessons = new Set<number>();
  for (const row of rows) {
    if (!row.lessonId) {
      errors[rowErrorKey(row.key)] = 'Chọn bài học cho dòng này.';
    } else if (seenLessons.has(row.lessonId)) {
      // Lưới đã đảm bảo mỗi (dòng, mức) là duy nhất, nên chỉ còn rủi ro trùng bài học.
      errors[rowErrorKey(row.key)] = 'Bài học này đã có ở dòng khác.';
    } else {
      seenLessons.add(row.lessonId);
    }

    for (const level of LEVELS) {
      const cell = row.cells[level];
      if (isCellEmpty(cell)) continue;

      // Ô điền một nửa: báo đúng vào ô còn trống thay vì kêu sai định dạng.
      const count = parseCount(cell.questionCount);
      if (isBlank(cell.questionCount)) {
        errors[cellErrorKey(row.key, level, 'count')] = 'Nhập số câu, hoặc xoá % điểm để bỏ trống ô này.';
      } else if (count === null) {
        errors[cellErrorKey(row.key, level, 'count')] = 'Số câu phải là số nguyên.';
      } else if (count < 1) {
        errors[cellErrorKey(row.key, level, 'count')] = 'Số câu phải lớn hơn 0.';
      }

      const percentage = parsePercentage(cell.percentage);
      const percentageKey = cellErrorKey(row.key, level, 'percentage');
      if (isBlank(cell.percentage)) {
        errors[percentageKey] = 'Nhập tỷ lệ % điểm, hoặc xoá số câu để bỏ trống ô này.';
      } else if (percentage === null) {
        errors[percentageKey] = `Tỷ lệ % điểm tối đa ${PERCENTAGE_DECIMALS} chữ số thập phân.`;
      } else if (percentage <= 0) {
        errors[percentageKey] = 'Tỷ lệ % điểm phải lớn hơn 0.';
      } else if (percentage > MAX_PERCENTAGE) {
        errors[percentageKey] = `Tỷ lệ % điểm tối đa ${MAX_PERCENTAGE}.`;
      }
    }
  }

  return errors;
};

/** So theo số nguyên phần trăm để 33.3 + 33.3 + 33.4 không bị lệch bởi dấu phẩy động. */
export const hasRequiredTotal = (rows: GridRow[]): boolean =>
  Math.round(gridTotal(rows).percentage * 100) === REQUIRED_TOTAL_PERCENTAGE * 100;

/**
 * Chỉ áp dụng khi NỘP / XÁC NHẬN / sửa bản Đã nộp. Lưu Nháp thì không cần: nháp được lưu
 * ở mọi tổng % (kể cả rỗng) để soạn dở dang nhiều lần. Backend cũng kiểm tra lại (InvalidTotalScore).
 */
export const validateTotalForSubmit = (rows: GridRow[]): string | null =>
  hasRequiredTotal(rows)
    ? null
    : `Tổng tỷ lệ điểm phải bằng ${REQUIRED_TOTAL_PERCENTAGE}% mới nộp hoặc xác nhận được (hiện là ${formatScore(gridTotal(rows).percentage)}%).`;

/** Gợi ý không chặn cạnh ô "Tổng điểm" khi ma trận có dòng nhưng chưa đủ 100%. */
export const totalScoreHint = (rows: GridRow[]): string | null =>
  toDetails(rows).length === 0 || hasRequiredTotal(rows)
    ? null
    : `Cần đúng ${REQUIRED_TOTAL_PERCENTAGE}% mới nộp hoặc xác nhận được; hiện là ${formatScore(gridTotal(rows).percentage)}%. Vẫn lưu nháp được.`;

/** Số nguyên dương hợp lệ cho ô "Tổng điểm ma trận", hoặc thông báo lỗi. */
export const validateTotalScoreField = (totalScore: number): string | null =>
  Number.isInteger(totalScore) && totalScore > 0
    ? null
    : 'Tổng điểm ma trận phải là số nguyên dương.';

/**
 * Lỗi hiển thị ngay khi đang gõ: chỉ các ô ĐÃ có giá trị và sai (ví dụ % vượt trần).
 * Không báo ô còn trống, nếu không vừa gõ số câu xong đã bị la thiếu % điểm.
 * Tổng % không nằm ở đây: nháp lưu được ở mọi tổng, chỉ có gợi ý (totalScoreHint).
 */
export const liveCellErrors = (rows: GridRow[]): Record<string, string> => {
  const all = validateGrid(rows, 'x', 1);
  const live: Record<string, string> = {};
  for (const row of rows) {
    for (const level of LEVELS) {
      const cell = row.cells[level];
      const count = cellErrorKey(row.key, level, 'count');
      const percentage = cellErrorKey(row.key, level, 'percentage');
      if (all[count] && !isBlank(cell.questionCount)) live[count] = all[count];
      if (all[percentage] && !isBlank(cell.percentage)) live[percentage] = all[percentage];
    }
  }
  return live;
};

/** Backend trả EmptyMatrix khi nộp/xác nhận ma trận không có dòng nào. Chặn sớm ở client. */
export const requireNonEmpty = (rows: GridRow[]): string | null =>
  toDetails(rows).length === 0 ? 'Ma trận phải có ít nhất một dòng chi tiết.' : null;
