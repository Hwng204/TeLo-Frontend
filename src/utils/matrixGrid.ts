/**
 * Backend lưu chi tiết ma trận dạng phẳng: mỗi bản ghi là một ô (bài học × mức nhận thức).
 * Giao diện lại hiển thị dạng lưới: mỗi dòng một bài học, ba cột mức nhận thức,
 * mỗi cột hai ô nhập (Câu, Điểm). File này lo việc chuyển đổi hai chiều và kiểm tra dữ liệu.
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

/** Trần điểm mỗi ô, khớp cột decimal(5,2) và kiểm tra của backend. */
export const MAX_SCORE = 999.99;
/** Tổng điểm cả ma trận phải đúng bằng số này khi Nộp / Xác nhận / sửa bản Đã nộp (backend: InvalidTotalScore). */
export const REQUIRED_TOTAL_SCORE = 10;
export const MAX_NAME_LENGTH = 255;

const emptyCells = (): Record<CognitiveLevel, GridCell> => ({
  NHAN_BIET: { questionCount: '', allocatedScore: '' },
  THONG_HIEU: { questionCount: '', allocatedScore: '' },
  VAN_DUNG: { questionCount: '', allocatedScore: '' },
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
  isBlank(cell.questionCount) && isBlank(cell.allocatedScore);

/** Chấp nhận cả dấu phẩy thập phân vì người dùng Việt hay gõ "2,5". */
const normalize = (value: string) => value.trim().replace(',', '.');

const parseCount = (value: string): number | null => {
  const text = normalize(value);
  if (!/^\d+$/.test(text)) return null;
  return Number(text);
};

/**
 * Ô "Điểm" trên giao diện là ĐIỂM MỖI CÂU. Backend lại lưu tổng điểm của cả ô
 * (allocatedScore = điểm mỗi câu × số câu), nên toGrid/toDetails chuyển đổi hai chiều.
 * Cho phép tới 4 chữ số thập phân để điểm mỗi câu của dữ liệu cũ (ví dụ 1 điểm chia
 * 3 câu = 0,3333) vẫn nạp và lưu lại được.
 */
export const PER_QUESTION_DECIMALS = 4;

const parseScore = (value: string): number | null => {
  const text = normalize(value);
  if (!new RegExp(`^\\d+(\\.\\d{1,${PER_QUESTION_DECIMALS}})?$`).test(text)) return null;
  return Number(text);
};

/** Tổng điểm một ô = điểm mỗi câu × số câu, làm tròn 2 chữ số như cột decimal(5,2) của backend. */
export const cellTotal = (cell: GridCell): number => {
  const count = parseCount(cell.questionCount);
  const each = parseScore(cell.allocatedScore);
  if (count === null || each === null) return 0;
  return Math.round(each * count * 100) / 100;
};

/** Cộng điểm theo số nguyên phần trăm, nếu không 0.1 + 0.2 sẽ ra 0.30000000000000004. */
const sumScores = (values: number[]) =>
  values.reduce((total, value) => total + Math.round(value * 100), 0) / 100;

export const formatScore = (value: number) =>
  value.toLocaleString('vi-VN', { maximumFractionDigits: 2 });

/**
 * Điểm mỗi câu suy ra từ tổng ô và số câu, dùng để hiển thị.
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
      // Backend lưu tổng điểm của ô; giao diện nhập điểm mỗi câu.
      allocatedScore: String(Number((detail.allocatedScore / detail.questionCount).toFixed(PER_QUESTION_DECIMALS))),
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
 * gõ số câu rồi quên điểm sẽ thấy dòng biến mất sau khi lưu mà không có thông báo nào.
 */
export const toDetails = (rows: GridRow[]): MatrixDetailRequest[] =>
  rows.flatMap((row) =>
    LEVELS.filter((level) => !isCellEmpty(row.cells[level])).map((level) => ({
      lessonId: row.lessonId,
      cognitiveLevel: level,
      questionCount: parseCount(row.cells[level].questionCount) ?? 0,
      allocatedScore: cellTotal(row.cells[level]),
    })),
  );

export const rowTotal = (row: GridRow) => {
  const filled = LEVELS.map((level) => row.cells[level]).filter((cell) => !isCellEmpty(cell));
  return {
    questions: filled.reduce((total, cell) => total + (parseCount(cell.questionCount) ?? 0), 0),
    score: sumScores(filled.map(cellTotal)),
  };
};

export const columnTotal = (rows: GridRow[], level: CognitiveLevel) => {
  const filled = rows.map((row) => row.cells[level]).filter((cell) => !isCellEmpty(cell));
  return {
    questions: filled.reduce((total, cell) => total + (parseCount(cell.questionCount) ?? 0), 0),
    score: sumScores(filled.map(cellTotal)),
  };
};

export const gridTotal = (rows: GridRow[]) => {
  const totals = rows.map(rowTotal);
  return {
    questions: totals.reduce((total, row) => total + row.questions, 0),
    score: sumScores(totals.map((row) => row.score)),
  };
};

export const cellErrorKey = (rowKey: string, level: CognitiveLevel, field: 'count' | 'score') =>
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
        errors[cellErrorKey(row.key, level, 'count')] = 'Nhập số câu, hoặc xoá điểm để bỏ trống ô này.';
      } else if (count === null) {
        errors[cellErrorKey(row.key, level, 'count')] = 'Số câu phải là số nguyên.';
      } else if (count < 1) {
        errors[cellErrorKey(row.key, level, 'count')] = 'Số câu phải lớn hơn 0.';
      }

      const score = parseScore(cell.allocatedScore);
      const scoreKey = cellErrorKey(row.key, level, 'score');
      if (isBlank(cell.allocatedScore)) {
        errors[scoreKey] = 'Nhập điểm mỗi câu, hoặc xoá số câu để bỏ trống ô này.';
      } else if (score === null) {
        errors[scoreKey] = `Điểm mỗi câu tối đa ${PER_QUESTION_DECIMALS} chữ số thập phân.`;
      } else if (score <= 0) {
        errors[scoreKey] = 'Điểm mỗi câu phải lớn hơn 0.';
      } else if (count !== null && count >= 1) {
        // Backend giới hạn TỔNG điểm của ô (decimal(5,2)), không phải điểm mỗi câu.
        const total = cellTotal(cell);
        if (total > MAX_SCORE) {
          errors[scoreKey] = `Tổng điểm của ô là ${formatScore(total)}, tối đa ${MAX_SCORE}.`;
        } else if (total <= 0) {
          errors[scoreKey] = 'Điểm mỗi câu quá nhỏ: tổng điểm của ô làm tròn còn 0.';
        }
      }
    }
  }

  return errors;
};

/** So theo số nguyên phần trăm để 3.3 + 3.3 + 3.4 không bị lệch bởi dấu phẩy động. */
export const hasRequiredTotal = (rows: GridRow[]): boolean =>
  Math.round(gridTotal(rows).score * 100) === REQUIRED_TOTAL_SCORE * 100;

/**
 * Chỉ áp dụng khi NỘP / XÁC NHẬN / sửa bản Đã nộp. Lưu Nháp thì không cần: nháp được lưu
 * ở mọi tổng điểm (kể cả rỗng) để soạn dở dang nhiều lần. Backend cũng kiểm tra lại (InvalidTotalScore).
 */
export const validateTotalForSubmit = (rows: GridRow[]): string | null =>
  hasRequiredTotal(rows)
    ? null
    : `Tổng điểm phải bằng ${REQUIRED_TOTAL_SCORE} mới nộp hoặc xác nhận được (hiện là ${formatScore(gridTotal(rows).score)}).`;

/** Gợi ý không chặn cạnh ô "Tổng điểm" khi ma trận có dòng nhưng chưa đủ 10. */
export const totalScoreHint = (rows: GridRow[]): string | null =>
  toDetails(rows).length === 0 || hasRequiredTotal(rows)
    ? null
    : `Cần đúng ${REQUIRED_TOTAL_SCORE} điểm mới nộp hoặc xác nhận được; hiện là ${formatScore(gridTotal(rows).score)}. Vẫn lưu nháp được.`;

/**
 * Lỗi hiển thị ngay khi đang gõ: chỉ các ô ĐÃ có giá trị và sai (ví dụ điểm vượt trần).
 * Không báo ô còn trống, nếu không vừa gõ số câu xong đã bị la thiếu điểm.
 * Tổng điểm không nằm ở đây: nháp lưu được ở mọi tổng, chỉ có gợi ý (totalScoreHint).
 */
export const liveCellErrors = (rows: GridRow[]): Record<string, string> => {
  const all = validateGrid(rows, 'x', 1);
  const live: Record<string, string> = {};
  for (const row of rows) {
    for (const level of LEVELS) {
      const cell = row.cells[level];
      const count = cellErrorKey(row.key, level, 'count');
      const score = cellErrorKey(row.key, level, 'score');
      if (all[count] && !isBlank(cell.questionCount)) live[count] = all[count];
      if (all[score] && !isBlank(cell.allocatedScore)) live[score] = all[score];
    }
  }
  return live;
};

/** Backend trả EmptyMatrix khi nộp/xác nhận ma trận không có dòng nào. Chặn sớm ở client. */
export const requireNonEmpty = (rows: GridRow[]): string | null =>
  toDetails(rows).length === 0 ? 'Ma trận phải có ít nhất một dòng chi tiết.' : null;
