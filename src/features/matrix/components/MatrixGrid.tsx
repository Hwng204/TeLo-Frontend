import { Field, PcbIconButton, SelectField } from '../../../components/pcb';
import type { CognitiveLevel, GridRow, LessonOption } from '../../../types';
import {
  LEVELS,
  LEVEL_LABELS,
  cellErrorKey,
  cellTotal,
  columnTotal,
  formatPerQuestion,
  formatScore,
  gridTotal,
  isCellEmpty,
  newRow,
  rowErrorKey,
  rowTotal,
} from '../../../utils/matrixGrid';

type Props = {
  rows: GridRow[];
  lessons: LessonOption[];
  readOnly?: boolean;
  errors?: Record<string, string>;
  onChange?: (rows: GridRow[]) => void;
};

const quantity = (questions: number, score: number) => `${questions} câu · ${formatScore(score)} điểm`;

export const MatrixGrid = ({ rows, lessons, readOnly, errors = {}, onChange }: Props) => {
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
    <div className="pcb-card pcb-table-wrap">
      <table className="pcb-table sep-matrix-table">
        <thead>
          <tr>
            <th>Nội dung / Bài học</th>
            {LEVELS.map((level) => (
              <th key={level}>{LEVEL_LABELS[level]}</th>
            ))}
            <th>Tổng</th>
            {!readOnly && <th>Thao tác</th>}
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => {
            const rowSum = rowTotal(row);
            const lessonError = errors[rowErrorKey(row.key)];
            return (
              <tr key={row.key}>
                <td>
                  {readOnly ? (
                    (lessons.find((lesson) => lesson.id === row.lessonId)?.title ??
                      `Bài học #${row.lessonId} (không còn trong sách)`)
                  ) : (
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
                  )}
                </td>

                {LEVELS.map((level) => {
                  const cell = row.cells[level];
                  if (readOnly) {
                    if (isCellEmpty(cell)) return <td key={level}>—</td>;
                    return (
                      <td key={level} className="sep-nowrap">
                        {quantity(Number(cell.questionCount), cellTotal(cell))}
                        <div className="sep-muted">
                          {formatPerQuestion(cellTotal(cell), Number(cell.questionCount))} điểm/câu
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
                          <span>Điểm/câu</span>
                          <Field
                            type="number"
                            min={0}
                            // "any" cho phép gõ 0.25 hay 0.5; mũi tên vẫn nhảy từng 1 đơn vị.
                            step="any"
                            aria-label={`Điểm mỗi câu, ${LEVEL_LABELS[level]}`}
                            value={cell.allocatedScore}
                            error={errors[cellErrorKey(row.key, level, 'score')]}
                            onChange={(event) => setCell(row.key, level, 'allocatedScore', event.target.value)}
                          />
                        </div>
                      </div>
                    </td>
                  );
                })}

                <td className="sep-nowrap">{quantity(rowSum.questions, rowSum.score)}</td>

                {!readOnly && (
                  <td>
                    <div className="sep-grid-actions">
                      <PcbIconButton
                        icon="delete"
                        label="Xoá dòng"
                        onClick={() => update(rows.filter((item) => item.key !== row.key))}
                      />
                    </div>
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
                    {quantity(column.questions, column.score)}
                  </td>
                );
              })}
              <td className="sep-nowrap">{quantity(total.questions, total.score)}</td>
              {!readOnly && <td />}
            </tr>
          )}
        </tbody>
      </table>

      {rows.length === 0 && <p className="sep-empty">Chưa có dòng chi tiết nào.</p>}

      {!readOnly && (
        <div className="sep-pager">
          <button type="button" className="pcb-btn pcb-btn--secondary" onClick={() => update([...rows, newRow()])}>
            Thêm nội dung
          </button>
        </div>
      )}
    </div>
  );
};
