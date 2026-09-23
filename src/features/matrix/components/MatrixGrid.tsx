import { Field, Icon, PcbIconButton, SelectField } from '../../../components/pcb';
import type { CognitiveLevel, GridRow, LessonOption } from '../../../types';
import {
  LEVELS,
  LEVEL_LABELS,
  cellErrorKey,
  cellScore,
  columnTotal,
  formatPerQuestion,
  formatScore,
  gridTotal,
  hasValidCellValues,
  isCellEmpty,
  newRow,
  rowErrorKey,
  rowTotal,
} from '../../../utils/matrixGrid';

type Props = {
  rows: GridRow[];
  lessons: LessonOption[];
  /** Tổng điểm ma trận, cần để suy ra điểm ô/điểm mỗi câu từ tỷ lệ % của từng dòng. */
  matrixTotalScore: number;
  readOnly?: boolean;
  errors?: Record<string, string>;
  onChange?: (rows: GridRow[]) => void;
};

const quantity = (questions: number, percentage: number) => `${questions} câu · ${formatScore(percentage)}%`;

export const MatrixGrid = ({ rows, lessons, matrixTotalScore, readOnly, errors = {}, onChange }: Props) => {
  const total = gridTotal(rows);

  const update = (next: GridRow[]) => onChange?.(next);

  const setCell = (rowKey: string, level: CognitiveLevel, field: keyof GridRow['cells'][CognitiveLevel], raw: string) =>
    update(
      rows.map((row) =>
        row.key === rowKey
          ? { ...row, cells: { ...row.cells, [level]: { ...row.cells[level], [field]: raw } } }
          : row,
      ),
    );

  // Một bài học chỉ được xuất hiện ở một dòng, nếu không backend trả DuplicateDetail.
  const usedLessons = new Set(rows.map((row) => row.lessonId).filter(Boolean));

  return (
    <div className="sep-panel">
      <div className="sep-panel__scroll">
      <table className="pcb-table sep-matrix-table">
        <thead>
          <tr>
            <th scope="col">Nội dung / Bài học</th>
            {LEVELS.map((level) => (
              <th key={level} scope="col">{LEVEL_LABELS[level]}</th>
            ))}
            <th scope="col">Tổng</th>
            {!readOnly && <th scope="col" className="sep-col-actions">Hành động</th>}
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => {
            const rowSum = rowTotal(row);
            const lessonError = errors[rowErrorKey(row.key)];
            return (
              <tr key={row.key}>
                {readOnly ? (
                  <th scope="row" className="sep-matrix-rowhead">
                    {lessons.find((lesson) => lesson.id === row.lessonId)?.title ??
                      `Bài học #${row.lessonId} (không còn trong sách)`}
                  </th>
                ) : (
                  <td>
                    <SelectField
                      value={row.lessonId || ''}
                      aria-label="Bài học"
                      error={lessonError}
                      onChange={(event) =>
                        update(
                          rows.map((item) =>
                            item.key === row.key ? { ...item, lessonId: Number(event.target.value) } : item,
                          ),
                        )
                      }
                    >
                      <option value="">Chọn bài học</option>
                      {lessons.map((lesson) => (
                        <option
                          key={lesson.id}
                          value={lesson.id}
                          disabled={lesson.id !== row.lessonId && usedLessons.has(lesson.id)}
                        >
                          {lesson.title}
                        </option>
                      ))}
                    </SelectField>
                  </td>
                )}

                {LEVELS.map((level) => {
                  const cell = row.cells[level];
                  const score = cellScore(matrixTotalScore, cell);
                  if (readOnly) {
                    if (isCellEmpty(cell)) return <td key={level}>—</td>;
                    // Chỉ gặp ở bảng xem trước file Excel: giá trị không phải số thì hiện nguyên văn, đừng in "NaN".
                    if (!Number.isFinite(Number(cell.questionCount)) || !Number.isFinite(Number(cell.percentage))) {
                      return (
                        <td key={level} className="sep-nowrap sep-cell-invalid">
                          {cell.questionCount || '—'} câu · {cell.percentage || '—'}%
                        </td>
                      );
                    }
                    return (
                      <td key={level} className="sep-nowrap">
                        {quantity(Number(cell.questionCount), Number(cell.percentage))}
                        <div className="sep-muted">
                          {formatScore(score)} điểm · {formatPerQuestion(score, Number(cell.questionCount))} điểm/câu
                        </div>
                      </td>
                    );
                  }
                  return (
                    <td key={level}>
                      <div className="sep-grid-cell">
                        <div className="sep-grid-input">
                          <span>Câu</span>
                          <Field
                            type="number"
                            min={0}
                            step={1}
                            aria-label={`Số câu, ${LEVEL_LABELS[level]}`}
                            value={cell.questionCount}
                            error={errors[cellErrorKey(row.key, level, 'count')]}
                            onChange={(event) => setCell(row.key, level, 'questionCount', event.target.value)}
                          />
                        </div>
                        <div className="sep-grid-input">
                          <span>Tỷ lệ %</span>
                          <Field
                            type="number"
                            min={0}
                            max={100}
                            // "any" cho phép gõ 33.33; mũi tên vẫn nhảy từng 1 đơn vị.
                            step="any"
                            aria-label={`Tỷ lệ % điểm, ${LEVEL_LABELS[level]}`}
                            value={cell.percentage}
                            error={errors[cellErrorKey(row.key, level, 'percentage')]}
                            onChange={(event) => setCell(row.key, level, 'percentage', event.target.value)}
                          />
                        </div>
                        {hasValidCellValues(cell) && (
                          // Điểm ô và điểm mỗi câu là giá trị suy ra, chỉ để tham khảo khi nhập — không sửa được.
                          <span className="pcb-hint">
                            = {formatScore(score)} điểm · {formatPerQuestion(score, Number(cell.questionCount) || 0)} điểm/câu
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}

                <td className="sep-nowrap">{quantity(rowSum.questions, rowSum.percentage)}</td>

                {!readOnly && (
                  <td className="sep-col-actions">
                    <PcbIconButton
                      icon="delete"
                      label="Xoá dòng"
                      onClick={() => update(rows.filter((item) => item.key !== row.key))}
                    />
                  </td>
                )}
              </tr>
            );
          })}

          {rows.length > 0 && (
            <tr className="sep-table-total">
              <td>Tổng</td>
              {LEVELS.map((level) => {
                const column = columnTotal(rows, level);
                return (
                  <td key={level} className="sep-nowrap">
                    {quantity(column.questions, column.percentage)}
                  </td>
                );
              })}
              <td className="sep-nowrap">{quantity(total.questions, total.percentage)}</td>
              {!readOnly && <td />}
            </tr>
          )}
        </tbody>
      </table>

      {rows.length === 0 && (
        <p className="sep-empty">
          {readOnly ? 'Ma trận chưa có dòng chi tiết nào.' : 'Chưa có dòng nào. Bấm "Thêm nội dung" để chọn bài học đầu tiên.'}
        </p>
      )}
      </div>

      {!readOnly && (
        <div className="sep-panel__foot">
          <button type="button" className="pcb-btn pcb-btn--secondary pcb-btn--sm" onClick={() => update([...rows, newRow()])}>
            <Icon name="add" size={18} />
            Thêm nội dung
          </button>
        </div>
      )}
    </div>
  );
};
