import { useState } from 'react';
import { Field, PcbButton, RequiredLabel, SelectField } from '../../../components/pcb';
import { FormDialog } from '../../../components/common/FormDialog';
import { useAsync } from '../../../hooks';
import { localDateString } from '../../../utils/formatters';
import { displayToast } from '../../../utils/toast';
import { toProblem } from '../../../utils/problem';
import { examPackageApi } from '../examPackageApi';
import type { PackageDetail } from '../types';

export type PackageDialogMode = 'rename' | 'assign' | 'submit' | 'return';
const titles: Record<PackageDialogMode, string> = { rename: 'Đổi tên đề', assign: 'Giao chỉnh sửa và review đề', submit: 'Gửi kết quả review', return: 'Trả lại để review' };

export const ExamPackageActionDialog = ({ mode, data, busy, onClose, onSave }: { mode: PackageDialogMode; data: PackageDetail; busy: boolean; onClose: () => void; onSave: (action: () => Promise<PackageDetail>, message: string) => void }) => {
  const [name, setName] = useState(data.package.name);
  const [reviewer, setReviewer] = useState(data.reviewerUserId ? String(data.reviewerUserId) : '');
  const [dueAt, setDueAt] = useState(data.dueAt?.slice(0, 10) ?? '');
  const [comment, setComment] = useState('');
  const [attempted, setAttempted] = useState(false);
  const invalidName = attempted && (!name.trim() || name.trim().length > 255);
  const invalidReviewer = attempted && !reviewer;
  const invalidDue = attempted && (!dueAt || dueAt < localDateString());
  const invalidComment = attempted && mode === 'return' && !comment.trim();
  const options = useAsync(() => mode === 'assign' ? examPackageApi.options(data.package.id) : Promise.resolve(null), [mode, data.package.id]);
  const id = data.package.id;
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setAttempted(true);
    if (mode === 'rename') {
      if (!name.trim() || name.trim().length > 255) { displayToast('error', 'Lỗi', 'Nhập tên đề từ 1 đến 255 ký tự.'); return; }
      onSave(() => examPackageApi.rename(id, data.version, name.trim()), 'Đã đổi tên đề.');
    } else if (mode === 'assign') {
      if (!reviewer || !dueAt || dueAt < localDateString()) { displayToast('error', 'Lỗi', 'Chọn người review và hạn hoàn thành từ hôm nay trở đi.'); return; }
      onSave(() => examPackageApi.assign(id, data.version, Number(reviewer), `${dueAt}T00:00:00`), 'Đã giao nhiệm vụ review.');
    } else {
      if (mode === 'return' && !comment.trim()) { displayToast('error', 'Lỗi', 'Nhập lý do cần review lại.'); return; }
      onSave(() => mode === 'return' ? examPackageApi.returnReview(id, data.version, comment.trim()) : examPackageApi.submit(id, data.version, comment.trim()), mode === 'return' ? 'Đã trả lại đề để review.' : 'Đã gửi kết quả review cho PHT.');
    }
  };
  return <FormDialog open title={titles[mode]} busy={busy} onClose={onClose}>
    <form noValidate onSubmit={submit}>
      {mode === 'rename' && <Field label="Tên đề" required invalid={invalidName} maxLength={255} value={name} disabled={busy} onChange={e => setName(e.target.value)} />}
      {mode === 'assign' && <>
        <p className="sep-muted">Chọn giáo viên hoặc tổ trưởng chỉnh sửa và review đề đã tạo. Người được giao chỉ thay câu đúng ô ma trận rồi gửi lại; PHT review cuối và chốt đề.</p>
        {options.loading && <p role="status">Đang tải người review…</p>}
        {Boolean(options.error) && <p role="alert" className="sep-alert">{toProblem(options.error).message}<PcbButton variant="ghost" onClick={options.reload}>Thử lại</PcbButton></p>}
        <SelectField label="Người review" required invalid={invalidReviewer} value={reviewer} disabled={busy || options.loading} onChange={e => setReviewer(e.target.value)}><option value="">Chọn giáo viên hoặc tổ trưởng</option>{options.data?.reviewers.map(person => <option key={person.id} value={person.id}>{person.fullName} · {person.username}</option>)}</SelectField>
        {!options.loading && options.data?.reviewers.length === 0 && <p className="sep-muted">Chưa có giáo viên hoặc tổ trưởng đang hoạt động phù hợp trong phân hiệu.</p>}
        <Field label="Hạn hoàn thành" required invalid={invalidDue} type="date" min={localDateString()} value={dueAt} disabled={busy} onChange={e => setDueAt(e.target.value)} />
      </>}
      {(mode === 'submit' || mode === 'return') && <><p className="sep-muted">{mode === 'submit' ? 'Sau khi gửi, đề sẽ chờ PHT chốt và bạn không thể thay câu cho đến khi được trả lại.' : 'Người được giao sẽ nhận lại đề để kiểm tra và chỉnh sửa.'}</p><div className="pcb-field">
        <label className="pcb-label" htmlFor="exam-package-comment"><RequiredLabel required={mode === 'return'}>{mode === 'return' ? 'Lý do trả lại' : 'Nhận xét review'}</RequiredLabel></label>
        <textarea id="exam-package-comment" className="sep-textarea" aria-invalid={invalidComment || undefined} rows={4} maxLength={2000} required={mode === 'return'} value={comment} disabled={busy} placeholder={mode === 'return' ? 'Nêu rõ nội dung người review cần kiểm tra hoặc chỉnh sửa.' : 'Nhập nhận xét về cấu trúc, câu hỏi và đáp án của đề.'} onChange={e => setComment(e.target.value)} />
        <span className="pcb-hint">{comment.length}/2.000 ký tự</span>
      </div></>}
      <div className="sep-actions"><PcbButton variant="ghost" disabled={busy} onClick={onClose}>Hủy</PcbButton><PcbButton type="submit" disabled={busy || mode === 'assign' && (options.loading || Boolean(options.error))}>{busy ? 'Đang lưu…' : mode === 'assign' ? 'Giao review' : mode === 'rename' ? 'Lưu thay đổi' : mode === 'return' ? 'Trả lại đề' : 'Gửi kết quả review'}</PcbButton></div>
    </form>
  </FormDialog>;
};
