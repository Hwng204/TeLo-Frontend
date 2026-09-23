import { useRef, useState } from 'react';
import { Icon, PcbButton, PcbIconButton } from '../../../components/pcb';
import type { LessonOption, MatrixImportResult, XlsxCell } from '../../../types';
import { saveBlob } from '../../../utils/download';
import { fold, IMPORT_COLUMN_WIDTHS, readMatrixSheet, templateRows } from '../../../utils/matrixImport';
import { readFirstSheet, writeSheet } from '../../../utils/xlsx';
import { MatrixGrid } from './MatrixGrid';

type Props = {
  lessons: LessonOption[];
  /** Đã chọn đủ 4 chiều ngữ cảnh: bài học để đối chiếu và để dựng file mẫu đều theo chương trình này. */
  contextReady: boolean;
  contextLabel: string;
  semesterName: string | null;
  name: string;
  totalScore: number;
  hasRows: boolean;
  onApply: (result: MatrixImportResult) => void;
  onClose: () => void;
};

const MAX_FILE_BYTES = 5 * 1024 * 1024;
/** Đủ thấy phần thông tin, dòng tiêu đề và vài dòng bài học; phần còn lại chỉ đếm. */
const PREVIEW_ROWS = 14;
/** Cột Số câu, Tỷ lệ % (0-based) — tô nền để người dùng thấy ngay chỗ cần điền. */
const INPUT_COLUMNS = new Set([3, 4]);
const COLUMN_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

const cellText = (cell: XlsxCell | undefined) =>
  cell === null || cell === undefined ? '' : typeof cell === 'object' ? String(cell.value) : String(cell);

const slug = (text: string) => fold(text).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'ma-tran';

/** Nhập chi tiết ma trận từ file Excel: xem/tải file mẫu, chọn file, xem trước rồi mới đưa vào bảng soạn. */
export const ExcelImportPanel = ({
  lessons,
  contextReady,
  contextLabel,
  semesterName,
  name,
  totalScore,
  hasRows,
  onApply,
  onClose,
}: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showTemplate, setShowTemplate] = useState(false);
  const [reading, setReading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [result, setResult] = useState<MatrixImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const template = templateRows({ name, totalScore, contextLabel, semesterName, lessons });
  const headerRow = template.findIndex((row) => cellText(row[0]) === 'Bài học');

  const downloadTemplate = () =>
    saveBlob(writeSheet('Ma trận', template, IMPORT_COLUMN_WIDTHS), `mau-ma-tran-${slug(contextLabel)}.xlsx`);

  const readFile = async (file: File) => {
    setError(null);
    setResult(null);
    setFileName(file.name);
    if (!/\.xlsx$/i.test(file.name)) {
      setError('Chỉ nhận file Excel .xlsx. File .xls hoặc .csv hãy mở bằng Excel rồi lưu lại dạng "Excel Workbook (.xlsx)".');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError('File lớn hơn 5 MB, không giống file ma trận. Kiểm tra lại đúng file chưa.');
      return;
    }
    setReading(true);
    try {
      setResult(readMatrixSheet(await readFirstSheet(await file.arrayBuffer()), lessons));
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Không đọc được file.');
    } finally {
      setReading(false);
    }
  };

  const skipped = result?.issues.filter((issue) => issue.skipped).length ?? 0;
  const toFix = (result?.issues.length ?? 0) - skipped;
  const importScore = result?.totalScore ?? totalScore;

  return (
    <section className="sep-import" aria-labelledby="sep-import-title">
      <div className="sep-import__head">
        <div>
          <h3 id="sep-import-title" className="sep-import__title">
            Nhập nội dung từ file Excel
          </h3>
          <p className="pcb-hint">
            Cùng định dạng với file "Xuất Excel": mỗi dòng là một bài học ở một mức nhận thức, chỉ cần điền Số câu và
            Tỷ lệ %. Nội dung đọc được sẽ hiện để xem trước, chưa thay đổi gì cho tới khi bạn bấm "Đưa vào bảng".
          </p>
        </div>
        <div className="sep-import__actions">
          <PcbButton variant="secondary" size="sm" aria-expanded={showTemplate} onClick={() => setShowTemplate(!showTemplate)}>
            <Icon name={showTemplate ? 'visibility_off' : 'visibility'} size={18} />
            {showTemplate ? 'Ẩn file mẫu' : 'Xem file mẫu'}
          </PcbButton>
          <PcbButton size="sm" disabled={!contextReady || reading} onClick={() => inputRef.current?.click()}>
            <Icon name="upload_file" size={18} />
            {result || error ? 'Chọn file khác' : 'Chọn file Excel'}
          </PcbButton>
          <PcbIconButton icon="close" label="Đóng phần nhập Excel" onClick={onClose} />
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            // Xoá giá trị để chọn lại đúng file đó (sau khi sửa trong Excel) vẫn đọc lại.
            event.target.value = '';
            if (file) void readFile(file);
          }}
        />
      </div>

      {!contextReady && (
        <div className="sep-alert sep-alert--info" role="status">
          Chọn đủ Chương trình, Môn học, Khối lớp và Năm học ở trên trước: file mẫu liệt kê sẵn bài học của chương trình
          đó, và tên bài trong file được đối chiếu với chương trình đó.
        </div>
      )}

      {showTemplate && (
        <div className="sep-import__template">
          <div className="sep-sheet-wrap">
            <table className="sep-sheet" aria-label="Xem trước file mẫu">
              <colgroup>
                <col className="sep-sheet__index" />
                {IMPORT_COLUMN_WIDTHS.map((width, column) => (
                  <col key={column} style={{ width: `${width}ch` }} />
                ))}
              </colgroup>
              <thead>
                <tr>
                  <th aria-hidden="true" />
                  {COLUMN_LETTERS.map((letter) => (
                    <th key={letter} scope="col">
                      {letter}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {template.slice(0, PREVIEW_ROWS).map((row, rowIndex) => {
                  const dataRow = rowIndex > headerRow;
                  // Như Excel: chữ dài ở ô cuối tràn sang các ô trống bên phải (dòng thông tin, dòng hướng dẫn).
                  const lastFilled = dataRow
                    ? COLUMN_LETTERS.length - 1
                    : Math.max(row.findLastIndex((cell) => cellText(cell) !== ''), 0);
                  return (
                    <tr key={rowIndex}>
                      <th scope="row">{rowIndex + 1}</th>
                      {COLUMN_LETTERS.slice(0, lastFilled + 1).map((letter, column) => {
                        const cell = row[column];
                        const bold = typeof cell === 'object' && cell !== null && cell.bold;
                        return (
                          <td
                            key={letter}
                            colSpan={column === lastFilled ? COLUMN_LETTERS.length - column : undefined}
                            className={`${dataRow && INPUT_COLUMNS.has(column) ? 'is-input' : ''}${bold ? ' is-bold' : ''}`}
                          >
                            {cellText(cell)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="sep-import__template-foot">
            <span className="pcb-hint">
              {contextReady
                ? `${lessons.length} bài học × 3 mức = ${template.length - headerRow - 1} dòng. Ô tô màu là ô cần điền; dòng để trống sẽ bị bỏ qua.`
                : 'Chọn chương trình để file mẫu có sẵn danh sách bài học.'}
            </span>
            <PcbButton variant="secondary" size="sm" disabled={!contextReady} onClick={downloadTemplate}>
              <Icon name="download" size={18} />
              Tải file mẫu (.xlsx)
            </PcbButton>
          </div>
        </div>
      )}

      {reading && (
        <p className="pcb-hint" role="status">
          Đang đọc {fileName}…
        </p>
      )}

      {error && (
        <div className="sep-alert" role="alert">
          {fileName && <strong>{fileName}: </strong>}
          {error}
        </div>
      )}

      {result && (
        <div className="sep-import__result">
          <div className="sep-import__summary" role="status">
            <span className="sep-import__file">
              <Icon name="description" size={18} />
              {fileName}
            </span>
            <span>
              {result.filledLines} dòng có số liệu · {result.rows.length} bài học
            </span>
            {skipped > 0 && <span className="sep-import__tag sep-import__tag--skip">{skipped} dòng bỏ qua</span>}
            {toFix > 0 && <span className="sep-import__tag sep-import__tag--fix">{toFix} ô cần sửa</span>}
          </div>

          {(result.name || result.totalScore) && (
            <p className="pcb-hint">
              {result.name &&
                `Tên trong file: "${result.name}"${name.trim() ? ' (giữ tên đang nhập).' : ' (sẽ điền vào ô Tên ma trận).'} `}
              {result.totalScore &&
                `Tổng điểm trong file: ${result.totalScore}${result.totalScore !== totalScore ? ` (sẽ thay cho ${totalScore} hiện tại).` : '.'}`}
            </p>
          )}

          {result.rows.length > 0 ? (
            <MatrixGrid readOnly rows={result.rows} lessons={lessons} matrixTotalScore={importScore} />
          ) : (
            result.issues.length === 0 && (
              <div className="sep-alert sep-alert--info">
                File chưa có dòng nào điền Số câu hoặc Tỷ lệ %. Điền vào file mẫu rồi chọn lại file.
              </div>
            )
          )}

          {result.issues.length > 0 && (
            <ul className="sep-import__issues" aria-label="Các dòng cần chú ý">
              {result.issues.map((issue, index) => (
                <li key={index}>
                  <span className={`sep-import__tag sep-import__tag--${issue.skipped ? 'skip' : 'fix'}`}>
                    {issue.skipped ? 'Bỏ qua' : 'Cần sửa'}
                  </span>
                  <span>
                    {issue.line !== null && <strong>Dòng {issue.line}: </strong>}
                    {issue.message}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="sep-actions">
            {hasRows && result.rows.length > 0 && (
              <span className="pcb-hint sep-actions__lead">Các dòng đang có trong bảng sẽ được thay bằng nội dung từ file.</span>
            )}
            <PcbButton variant="ghost" onClick={onClose}>
              Huỷ
            </PcbButton>
            <PcbButton disabled={result.rows.length === 0} onClick={() => onApply(result)}>
              Đưa {result.rows.length} bài học vào bảng
            </PcbButton>
          </div>
        </div>
      )}
    </section>
  );
};
