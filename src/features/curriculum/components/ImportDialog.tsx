import { useRef, useState } from 'react';
import { Icon, PcbButton } from '../../../components/pcb';
import { useBusy } from '../../../hooks';
import { api } from '../../../services/api';
import type { CurriculumImportPreview, CurriculumImportResult } from '../../../types';
import { toProblem } from '../../../utils/problem';
import { FormDialog } from './FormDialog';

type Props = {
  open: boolean;
  onClose: () => void;
  onDownloadTemplate: () => void;
  onImported: (result: CurriculumImportResult) => void;
};

/**
 * Nhập chương & bài từ tệp Excel theo mẫu: chọn tệp → hệ thống kiểm tra (không lưu) → xác nhận.
 * Có dòng lỗi thì không lưu gì; sửa tệp rồi chọn lại.
 */
export const ImportDialog = (props: Props) => (
  <FormDialog open={props.open} title="Nhập chương & bài từ Excel" onClose={props.onClose}>
    <ImportForm key={String(props.open)} {...props} />
  </FormDialog>
);

const ImportForm = ({ onClose, onDownloadTemplate, onImported }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CurriculumImportPreview | null>(null);
  const [problem, setProblem] = useState('');
  const [busy, runExclusive] = useBusy();

  const check = (chosen: File) => {
    setFile(chosen);
    setPreview(null);
    setProblem('');
    void runExclusive(async () => {
      try {
        setPreview(await api.curriculum.previewImport(chosen));
      } catch (error) {
        setProblem(toProblem(error).message);
      }
    });
  };

  const confirm = () => {
    if (!file || !preview?.canImport) return;
    void runExclusive(async () => {
      try {
        onImported(await api.curriculum.importFile(file));
      } catch (error) {
        setProblem(toProblem(error).message);
      }
    });
  };

  return (
    <div className="cur-import">
      <p className="pcb-hint">
        Dùng tệp mẫu: mỗi dòng là một bài học, thông tin chương lặp lại ở các dòng cùng chương. Hệ thống kiểm tra toàn bộ
        tệp trước, chưa lưu gì cho tới khi bạn bấm "Xác nhận nhập".
      </p>
      <div className="cur-import__pick">
        <PcbButton variant="ghost" size="sm" onClick={onDownloadTemplate}>
          <Icon name="download" size={18} />
          Tải file mẫu
        </PcbButton>
        <PcbButton variant="secondary" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
          <Icon name="upload_file" size={18} />
          {file ? 'Chọn tệp khác' : 'Chọn tệp Excel'}
        </PcbButton>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          hidden
          aria-label="Tệp Excel chương và bài học"
          onChange={(event) => {
            const chosen = event.target.files?.[0];
            // Xoá giá trị để chọn lại đúng tệp đó sau khi sửa trong Excel vẫn kiểm tra lại.
            event.target.value = '';
            if (chosen) check(chosen);
          }}
        />
      </div>

      {file && (
        <p className="cur-import__file">
          <Icon name="description" size={18} />
          {file.name}
        </p>
      )}

      {busy && !preview && (
        <p className="pcb-hint" role="status">
          Đang kiểm tra tệp…
        </p>
      )}

      {problem && (
        <div className="sep-alert" role="alert">
          {problem}
        </div>
      )}

      {preview && (
        <div className="cur-import__result" role="status">
          {preview.canImport ? (
            <div className="sep-alert sep-alert--success">
              Tệp hợp lệ: {preview.chapterCount} chương ({preview.newChapterCount} chương mới), {preview.lessonCount} bài
              học. Nhấn "Xác nhận nhập" để lưu.
            </div>
          ) : (
            <>
              <div className="sep-alert">
                Tệp có {preview.errors.length} lỗi. Vui lòng sửa tệp và tải lên lại, hệ thống chưa lưu dữ liệu nào.
              </div>
              <ul className="cur-import__errors" aria-label="Danh sách lỗi">
                {preview.errors.map((error, index) => (
                  <li key={`${error.rowNumber}-${index}`}>
                    <strong>Dòng {error.rowNumber}:</strong> {error.message}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      <div className="sep-actions">
        <PcbButton variant="ghost" onClick={onClose}>
          Huỷ
        </PcbButton>
        <PcbButton disabled={busy || !preview?.canImport} onClick={confirm}>
          {busy && preview?.canImport ? 'Đang nhập…' : 'Xác nhận nhập'}
        </PcbButton>
      </div>
    </div>
  );
};
