import { useRef, useState } from 'react';
import { FormDialog } from '../../../components/common/FormDialog';
import { Icon, PcbButton } from '../../../components/pcb';
import { useBusy } from '../../../hooks';
import { saveBlob } from '../../../utils/download';
import { toProblem } from '../../../utils/problem';
import { questionApi } from '../questionApi';
import type { QuestionPackage } from '../types';

export const QuestionExcelImportDialog = ({ taskId, version, onClose, onImported }: { taskId: number; version: number; onClose: () => void; onImported: (value: QuestionPackage) => void }) => {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Awaited<ReturnType<typeof questionApi.import>> | null>(null);
  const [problem, setProblem] = useState('');
  const [busy, runExclusive] = useBusy();
  const download = (guide: boolean) => void runExclusive(async () => {
    setProblem('');
    try { saveBlob(await (guide ? questionApi.guide(taskId) : questionApi.template(taskId)), guide ? 'Huong-dan-va-vi-du-cau-hoi.xlsx' : 'Mau-cau-hoi.xlsx'); }
    catch (error) { setProblem(toProblem(error).message); }
  });
  const check = (chosen: File) => {
    setFile(chosen); setPreview(null); setProblem('');
    if (!chosen.name.toLowerCase().endsWith('.xlsx') || chosen.size === 0 || chosen.size > 5 * 1024 * 1024) {
      setProblem('Chọn file Excel .xlsx không rỗng, tối đa 5 MB.'); return;
    }
    void runExclusive(async () => { try { setPreview(await questionApi.import(taskId, version, chosen, false)); } catch (error) { setProblem(toProblem(error).message); } });
  };
  return <FormDialog open title="Nhập câu hỏi từ Excel" onClose={() => { if (!busy) onClose(); }}>
    <ol className="question-import-steps">
      <li>Tải file mẫu của gói câu hỏi. Bài học, mức nhận thức và số dòng cần làm đã được điền sẵn.
        <div className="question-toolbar-actions"><PcbButton variant="secondary" disabled={busy} onClick={() => download(false)}><Icon name="download" />Tải file mẫu</PcbButton><PcbButton variant="ghost" disabled={busy} onClick={() => download(true)}><Icon name="help_outline" />Tải hướng dẫn và ví dụ</PcbButton></div>
      </li>
      <li>Điền mỗi dòng một câu, ít nhất 2 lựa chọn trong A–D và chọn đáp án đúng. Ô lựa chọn không dùng và dòng chưa làm để trống. Giải thích không bắt buộc.</li>
      <li>Lưu file .xlsx, chọn file để kiểm tra, rồi xác nhận nhập.
        <div className="question-toolbar-actions"><PcbButton variant="secondary" disabled={busy} onClick={() => input.current?.click()}><Icon name="upload_file" />{file ? 'Chọn tệp khác' : 'Chọn file đã điền'}</PcbButton></div>
      </li>
    </ol>
    <input ref={input} type="file" hidden accept=".xlsx" aria-label="Tệp Excel câu hỏi" onChange={e => { const chosen = e.target.files?.[0]; e.target.value = ''; if (chosen && !busy) check(chosen); }} />
    {file && <p>{file.name}</p>}{busy && <p role="status">Đang xử lý tệp…</p>}{problem && <div className="sep-alert" role="alert">{problem}</div>}
    {preview && (preview.errors.length ? <div className="question-import-errors"><p className="sep-alert" role="alert">Tệp có {preview.errors.length} lỗi. Sửa các dòng dưới đây rồi chọn lại file.</p><ul>{preview.errors.map((e, i) => <li key={i}>{e.row > 0 && `Dòng ${e.row} · `}{e.column}: {e.message}</li>)}</ul></div> : <p className="sep-alert sep-alert--success" role="status">{preview.questions.length} câu hợp lệ. Chọn Xác nhận nhập để lưu vào gói.</p>)}
    <div className="sep-actions"><PcbButton variant="ghost" disabled={busy} onClick={onClose}>Hủy</PcbButton><PcbButton disabled={busy || !preview || preview.errors.length > 0} onClick={() => { if (!file) return; void runExclusive(async () => { try { const result = await questionApi.import(taskId, version, file, true); if (result.package) onImported(result.package); else { setPreview(result); setProblem('Kiểm tra lại các dòng có lỗi.'); } } catch (error) { setProblem(toProblem(error).message); setPreview(null); } }); }}>Xác nhận nhập</PcbButton></div>
  </FormDialog>;
};
