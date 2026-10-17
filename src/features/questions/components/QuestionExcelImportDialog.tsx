import { useEffect, useRef, useState } from 'react';
import { FormDialog } from '../../../components/common/FormDialog';
import { Icon, PcbButton } from '../../../components/pcb';
import { useBusy } from '../../../hooks';
import { saveBlob } from '../../../utils/download';
import { toProblem } from '../../../utils/problem';
import { displayToast } from '../../../utils/toast';
import { questionApi } from '../questionApi';
import type { QuestionPackage } from '../types';

export const QuestionExcelImportDialog = ({ taskId, version, onClose, onImported, onDirty, onBusy }: { taskId: number; version: number; onClose: () => void; onImported: (value: QuestionPackage) => void; onDirty?: (dirty: boolean) => void; onBusy?: (busy: boolean) => void }) => {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Awaited<ReturnType<typeof questionApi.import>> | null>(null);
  const [problem, setProblem] = useState('');
  const [busy, runExclusive] = useBusy();
  useEffect(() => { onBusy?.(busy); }, [busy, onBusy]);
  useEffect(() => () => onBusy?.(false), [onBusy]);
  const reportProblem = (message: string) => { setProblem(message); displayToast('error', 'Lỗi', message, 5); };
  const download = (guide: boolean) => void runExclusive(async () => {
    setProblem('');
    try {
      saveBlob(await (guide ? questionApi.guide(taskId) : questionApi.template(taskId)), guide ? 'Huong-dan-va-vi-du-cau-hoi.xlsx' : 'Mau-cau-hoi.xlsx');
      displayToast('success', 'Thành công', guide ? 'Đã tải hướng dẫn và ví dụ câu hỏi.' : 'Đã tải file mẫu câu hỏi.');
    } catch (error) { reportProblem(toProblem(error).message); }
  });
  const check = (chosen: File) => {
    setFile(chosen); setPreview(null); setProblem('');
    if (!chosen.name.toLowerCase().endsWith('.xlsx') || chosen.size === 0 || chosen.size > 5 * 1024 * 1024) {
      onDirty?.(false);
      reportProblem('Chọn file Excel .xlsx không rỗng, tối đa 5 MB.'); return;
    }
    onDirty?.(true);
    void runExclusive(async () => {
      try {
        const result = await questionApi.import(taskId, version, chosen, false); setPreview(result);
        if (result.errors.length) reportProblem(`Tệp có ${result.errors.length} lỗi. Sửa các dòng được đánh dấu rồi kiểm tra lại.`);
        else displayToast('success', 'Thành công', `Đã kiểm tra ${result.questions.length} câu hợp lệ. Xác nhận nhập để lưu vào gói.`);
      } catch (error) { reportProblem(toProblem(error).message); }
    });
  };
  return <FormDialog open busy={busy} title="Nhập câu hỏi từ Excel" onClose={() => { if (!busy) onClose(); }}>
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
    <div className="sep-actions"><PcbButton variant="ghost" disabled={busy} onClick={onClose}>Hủy</PcbButton><PcbButton disabled={busy || !preview || preview.errors.length > 0} onClick={() => { if (!file) return; void runExclusive(async () => { try { const result = await questionApi.import(taskId, version, file, true); if (result.package) onImported(result.package); else { setPreview(result); reportProblem('Kiểm tra lại các dòng có lỗi.'); } } catch (error) { reportProblem(toProblem(error).message); setPreview(null); } }); }}>Xác nhận nhập</PcbButton></div>
  </FormDialog>;
};
