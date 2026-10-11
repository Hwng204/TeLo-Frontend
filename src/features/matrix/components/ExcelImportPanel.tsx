import { useRef, useState } from 'react';
import { FormDialog } from '../../../components/common/FormDialog';
import { Icon, PcbButton } from '../../../components/pcb';
import { useBusy } from '../../../hooks';
import { api } from '../../../services/api';
import type { MatrixImportContext, MatrixImportPreview } from '../../../types';
import { saveBlob } from '../../../utils/download';
import { toProblem } from '../../../utils/problem';

type Props = {
  context: MatrixImportContext;
  hasRows: boolean;
  onApply: (preview: MatrixImportPreview) => void;
  onClose: () => void;
};

export const ExcelImportPanel = (props: Props) => (
  <FormDialog open title="Nhập ma trận từ Excel" onClose={props.onClose}>
    <ImportForm {...props} />
  </FormDialog>
);

const ImportForm = ({ context, hasRows, onApply, onClose }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<MatrixImportPreview | null>(null);
  const [problem, setProblem] = useState('');
  const [busy, runExclusive] = useBusy();

  const check = (chosen: File) => {
    setFile(chosen);
    setPreview(null);
    setProblem('');
    void runExclusive(async () => {
      try { setPreview(await api.matrix.previewImport(chosen, context)); }
      catch (error) { setProblem(toProblem(error).message); }
    });
  };
  const download = () => void runExclusive(async () => {
    setProblem('');
    try {
      const { blob, filename } = await api.matrix.downloadTemplate(context);
      saveBlob(blob, filename);
    } catch (error) { setProblem(toProblem(error).message); }
  });
  const confirm = () => {
    if (!file || !preview?.canImport) return;
    void runExclusive(async () => {
      setProblem('');
      try {
        const result = await api.matrix.importFile(file, context);
        if (inputRef.current?.closest('dialog')?.open) onApply(result);
      }
      catch (error) {
        setPreview(null);
        setProblem(toProblem(error).message);
      }
    });
  };

  return (
    <div className="sep-excel">
      <p className="pcb-hint">
        Dùng tệp mẫu: mỗi dòng là một bài học ở một mức nhận thức, chỉ cần điền Số câu và Tỷ lệ %.
        Hệ thống kiểm tra toàn bộ tệp trước, chưa đưa vào bảng cho tới khi bạn bấm "Xác nhận nhập".
      </p>
      <div className="sep-excel__pick">
        <PcbButton variant="ghost" size="sm" disabled={busy} onClick={download}>
          <Icon name="download" size={18} />Tải file mẫu
        </PcbButton>
        <PcbButton variant="secondary" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
          <Icon name="upload_file" size={18} />{file ? 'Chọn tệp khác' : 'Chọn tệp Excel'}
        </PcbButton>
        <input ref={inputRef} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          hidden aria-label="Tệp Excel ma trận" onChange={(event) => {
            const chosen = event.target.files?.[0];
            event.target.value = '';
            if (chosen && !busy) check(chosen);
          }} />
      </div>
      {file && <p className="sep-excel__file"><Icon name="description" size={18} />{file.name}</p>}
      {busy && <p className="pcb-hint" role="status">Đang xử lý tệp…</p>}
      {problem && <div className="sep-alert" role="alert">{problem}</div>}
      {preview && (
        <div className="sep-excel__result" role="status">
          {preview.canImport ? (
            <div className="sep-alert sep-alert--success">
              Tệp hợp lệ: {preview.lessonCount} bài học, {preview.filledLines} dòng có số liệu (Tổng điểm {preview.totalScore}).
              Nhấn "Xác nhận nhập" để đưa vào bảng ma trận.
            </div>
          ) : (
            <>
              <div className="sep-alert">Tệp có {preview.errors.length} lỗi. Vui lòng sửa tệp và tải lên lại, bảng ma trận chưa thay đổi.</div>
              <ul className="sep-excel__errors" aria-label="Danh sách lỗi">
                {preview.errors.map((error, index) => <li key={`${error.rowNumber}-${index}`}>
                  {error.rowNumber !== null && <strong>Dòng {error.rowNumber}: </strong>}{error.message}
                </li>)}
              </ul>
            </>
          )}
          {preview.canImport && preview.name && context.name?.trim() && preview.name !== context.name &&
            <p className="pcb-hint">Tên trong tệp: "{preview.name}". Giữ tên ma trận đang nhập.</p>}
        </div>
      )}
      {hasRows && preview?.canImport && <p className="pcb-hint">Xác nhận nhập sẽ thay toàn bộ các dòng đang có bằng nội dung từ tệp.</p>}
      <div className="sep-actions">
        <PcbButton variant="ghost" onClick={onClose}>Huỷ</PcbButton>
        <PcbButton disabled={busy || !preview?.canImport} onClick={confirm}>Xác nhận nhập</PcbButton>
      </div>
    </div>
  );
};
