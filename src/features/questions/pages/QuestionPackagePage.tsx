import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { RequiredLabel, Icon, PcbButton, SelectField } from '../../../components/pcb';
import { PageHeader } from '../../../components/common/PageHeader';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import { FormDialog } from '../../../components/common/FormDialog';
import { useAsync, useBusy } from '../../../hooks';
import { useUnsavedChanges } from '../../../hooks/useUnsavedChanges';
import { displayToast } from '../../../utils/toast';
import { toProblem } from '../../../utils/problem';
import { formatDate } from '../../../utils/formatters';
import { questionApi } from '../questionApi';
import type { QuestionPackage, SaveQuestion } from '../types';
import { levels, statuses } from '../types';
import { availableTarget, resolveQuestion, selectionAfterSave, type QuestionSelection } from '../questionDraft';
import { QuestionEditor } from '../components/QuestionEditor';
import { QuestionPreview } from '../components/QuestionPreview';
import { QuestionNavigator } from '../components/QuestionNavigator';
import { QuestionHistoryDialog } from '../components/QuestionHistoryDialog';
import { QuestionExcelImportDialog } from '../components/QuestionExcelImportDialog';
import '../questions.css';

export const QuestionPackagePage = () => {
  const id = Number(useParams().id);
  return <PackageWorkspace key={id} id={id} />;
};

const PackageWorkspace = ({ id }: { id: number }) => {
  const navigate = useNavigate();
  const loaded = useAsync(() => questionApi.get(id), [id]);
  const [saved, setSaved] = useState<QuestionPackage | null>(null);
  const data = saved ?? loaded.data;
  const [selection, setSelection] = useState<QuestionSelection>(null);
  const [targetId, setTargetId] = useState(0);
  const [revision, setRevision] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [pending, setPending] = useState<{ title: string; message: string; label: string; run: () => void } | null>(null);
  const [importing, setImporting] = useState(false);
  const [importDirty, setImportDirty] = useState(false);
  const [importBusy, setImportBusy] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [comment, setComment] = useState('');
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [historyId, setHistoryId] = useState<number | null>(null);
  const [busy, runExclusive] = useBusy();
  const noteRows = Object.entries(notes).filter(([, value]) => value.trim()).map(([key, value]) => ({ questionId: Number(key), comment: value.trim() }));
  const guard = useUnsavedChanges(dirty || importDirty || noteRows.length > 0 || rejecting && !!comment.trim(), () => {
    setDirty(false); setImportDirty(false); setNotes({}); setComment(''); setRevision(value => value + 1);
  }, busy || importBusy);
  const switchTo = (action: () => void) => guard.request(action, dirty);
  const closeRejection = () => guard.request(() => setRejecting(false), !!comment.trim(), () => setComment(''));
  const action = (fn: () => Promise<QuestionPackage>, message: string) => void runExclusive(async () => {
    try {
      const result = await fn(); setSaved(result); setDirty(false); setNotes({}); setComment('');
      setRevision(value => value + 1); setPending(null); displayToast('success', 'Thành công', message);
    } catch (error) { setPending(null); displayToast('error', 'Lỗi', toProblem(error).message, 5); }
  });
  const back = () => navigate('/matrix-tasks/' + id);
  if (!data) return <><PageHeader title="Gói câu hỏi" onBack={back} /><div className="sep-page"><p role={loaded.loading ? 'status' : 'alert'}>{loaded.loading ? 'Đang tải…' : toProblem(loaded.error).message}</p>{!loaded.loading && <PcbButton onClick={loaded.reload}>Thử lại</PcbButton>}</div>{guard.dialog}</>;
  const current = resolveQuestion(data.questions, selection, targetId);
  const target = current || selection?.kind === 'new'
    ? data.targets.find(t => t.detailId === (selection?.kind === 'new' ? selection.detailId : current?.detailId))
    : availableTarget(data.targets.filter(t => !targetId || t.detailId === targetId));
  const questions = data.questions.filter(q => !targetId || q.detailId === targetId);
  const position = questions.findIndex(q => q.id === current?.id);
  const latest = data.submissions[0];
  const history = data.submissions.find(s => s.id === historyId);
  const valid = data.targets.reduce((sum, t) => sum + t.validCount, 0);
  const written = data.targets.reduce((sum, t) => sum + t.written, 0);
  const required = data.targets.reduce((sum, t) => sum + t.requiredCount, 0);
  const nextTarget = availableTarget(data.targets.filter(t => !targetId || t.detailId === targetId));
  const chooseQuestion = (questionId: number) => switchTo(() => { setSelection({ kind: 'existing', id: questionId }); setRevision(value => value + 1); });
  const addQuestion = () => { if (nextTarget) switchTo(() => { setSelection({ kind: 'new', detailId: nextTarget.detailId }); setRevision(value => value + 1); }); };
  const save = (request: SaveQuestion, next: boolean) => action(async () => {
    const result = await questionApi.save(id, current?.id ?? null, request);
    const chosen = selectionAfterSave(data, result, current?.id ?? null, request.detailId, next);
    setSelection(chosen);
    if (targetId && chosen?.kind === 'new') setTargetId(chosen.detailId);
    return result;
  }, current ? 'Đã cập nhật câu hỏi và đáp án.' : 'Đã lưu câu hỏi và đáp án.');
  const submit = () => {
    if (dirty) { displayToast('error', 'Lỗi', 'Lưu câu đang chỉnh sửa trước khi gửi gói.'); return; }
    setPending({ title: 'Gửi gói câu hỏi', message: 'Gửi toàn bộ ' + data.questions.length + ' câu cho ' + data.reviewerName + ' kiểm duyệt?', label: 'Gửi gói', run: () => action(() => questionApi.submit(id, data.version), 'Đã gửi gói câu hỏi.') });
  };
  const remove = () => {
    if (!current) return;
    switchTo(() => setPending({ title: 'Xóa câu hỏi', message: 'Xóa câu này khỏi gói? Chỉ câu chưa chốt mới được xóa.', label: 'Xóa câu hỏi', run: () => action(async () => {
      const result = await questionApi.remove(id, current.id, data.version);
      setSelection(null); return result;
    }, 'Đã xóa câu hỏi.') }));
  };
  return <>
    <PageHeader title={data.canReview ? 'Kiểm duyệt gói câu hỏi' : 'Gói câu hỏi'} onBack={back} badge={<span className={'sep-status sep-status--' + data.status}>{statuses[data.status]}</span>} />
    <div className="sep-page question-package">
      <div className="question-overview">
        <div className="question-overview-identity"><span className="question-package-icon"><Icon name="assignment" size={28} /></span><div><h2>{data.name}</h2><p><span>Người biên soạn:</span> <strong>{data.authorName}</strong><span className="question-overview-deadline"><Icon name="event" size={16} />{data.dueAt ? formatDate(data.dueAt) : 'Chưa đặt hạn'}</span></p></div></div>
        <div className="question-progress"><strong>{valid}/{required} câu hoàn chỉnh</strong><progress aria-label="Tiến độ câu hỏi hoàn chỉnh" value={valid} max={Math.max(1, required)} /><small>{written - valid} bản nháp · {Math.max(0, required - written)} câu cần soạn thêm</small></div>
      </div>
      {data.status === 'NEEDS_REVISION' && latest?.comment && <div className="question-review-note"><strong>Yêu cầu chỉnh sửa</strong><p>{latest.comment}</p></div>}
      <details className="question-target-details"><summary>Chỉ tiêu theo bài học và mức nhận thức</summary>
        <div className="question-targets"><table className="pcb-table"><thead><tr><th>Bài học</th>{Object.values(levels).map(label => <th key={label}>{label}</th>)}</tr></thead><tbody>
          {[...new Set(data.targets.map(t => t.lessonId))].map(lessonId => { const lesson = data.targets.find(t => t.lessonId === lessonId)!; return <tr key={lessonId}><td>{lesson.gradeName} · {lesson.lessonTitle}</td>{Object.keys(levels).map(level => { const t = data.targets.find(t => t.lessonId === lessonId && t.cognitiveLevel === level); return <td key={level}>{t ? <button className="question-count" disabled={busy} onClick={() => switchTo(() => { setTargetId(t.detailId); setSelection(null); setRevision(value => value + 1); })}>{t.validCount}/{t.requiredCount}</button> : '—'}</td>; })}</tr>; })}
        </tbody></table></div>
      </details>
      <div className="question-toolbar question-workspace-toolbar">
        <SelectField label="Chọn nhóm câu hỏi" value={targetId} disabled={busy} onChange={event => switchTo(() => { setTargetId(Number(event.target.value)); setSelection(null); setRevision(value => value + 1); })}>
          <option value={0}>Tất cả bài học và mức nhận thức</option>{data.targets.map(t => <option key={t.detailId} value={t.detailId}>{t.lessonTitle} · {levels[t.cognitiveLevel]} ({t.written}/{t.requiredCount})</option>)}
        </SelectField>
        {data.canEdit && <div className="question-toolbar-actions"><PcbButton variant="secondary" disabled={busy || !availableTarget(data.targets)} onClick={() => switchTo(() => setImporting(true))}><Icon name="upload_file" />Nhập Excel</PcbButton><PcbButton disabled={busy || !nextTarget} onClick={addQuestion}><Icon name="add" />Thêm câu mới</PcbButton></div>}
      </div>
      <div className="question-workspace">
        <QuestionNavigator items={questions.map(q => { const cell = data.targets.find(t => t.detailId === q.detailId); return { id: q.id, number: data.questions.indexOf(q) + 1, content: q.content, meta: cell ? cell.lessonTitle + ' · ' + levels[cell.cognitiveLevel] : undefined, complete: q.isComplete }; })} selectedId={current?.id ?? null} busy={busy} onSelect={chooseQuestion} />
        <div className="question-content-panel">
          <div className="question-current-heading"><div className="question-current-identity"><span className="question-current-number">{current ? data.questions.indexOf(current) + 1 : '+'}</span><div><strong>{current ? 'Câu ' + (data.questions.indexOf(current) + 1) + ' / ' + data.questions.length : data.canEdit ? 'Câu hỏi mới' : 'Chưa có câu hỏi'}</strong>{target && <p title={target.lessonTitle}>{target.lessonTitle}</p>}</div>{target && <span className={'question-level question-level--' + target.cognitiveLevel}>{levels[target.cognitiveLevel]}</span>}</div>
            <div className="question-toolbar-actions"><PcbButton variant="secondary" size="sm" disabled={busy || position <= 0} onClick={() => chooseQuestion(questions[position - 1].id)}><Icon name="chevron_left" />Trước</PcbButton><PcbButton variant="secondary" size="sm" disabled={busy || position < 0 || position >= questions.length - 1} onClick={() => chooseQuestion(questions[position + 1].id)}>Sau<Icon name="chevron_right" /></PcbButton></div>
          </div>
          {latest?.notes.filter(n => n.questionId === current?.id).map(note => <div className="question-review-note" key={note.questionId}>{note.comment}</div>)}
          {data.canEdit && target ? <QuestionEditor key={(current?.id ?? 'new') + '-' + revision} question={current} initialDetailId={target.detailId} version={data.version} busy={busy} onDirty={setDirty} onSave={save} onRemove={current ? remove : undefined} />
            : <section key={current?.id ?? 'empty'} className="question-reader">{current ? <><QuestionPreview question={current} />{data.canReview && <div className="question-note-field"><label className="pcb-label" htmlFor="question-note">Nhận xét câu này <span className="sep-muted">(tùy chọn)</span></label><textarea className="sep-textarea" id="question-note" rows={3} maxLength={1000} disabled={busy} placeholder="Nêu nội dung cần kiểm tra hoặc chỉnh sửa…" value={notes[current.id] ?? ''} onChange={e => setNotes({ ...notes, [current.id]: e.currentTarget.value })} /></div>}</> : <div className="question-empty-message"><Icon name="quiz" size={36} /><strong>Chưa có câu trong phần đang chọn</strong><span>{data.canEdit ? 'Thêm câu mới hoặc chọn phần khác trong bộ lọc.' : 'Gói đang được biên soạn hoặc chưa có câu được bàn giao ở phần này.'}</span>{targetId !== 0 && <PcbButton variant="secondary" disabled={busy} onClick={() => switchTo(() => { setTargetId(0); setSelection(null); })}>Xem tất cả câu</PcbButton>}</div>}</section>}
          {!data.canEdit && <div className="question-panel-footer"><span className="question-readonly-label"><Icon name={data.canReview ? 'rate_review' : 'lock'} size={18} />{data.canReview ? 'Nhận xét được giữ riêng cho từng câu và gửi cùng kết quả duyệt.' : 'Chế độ xem · Nội dung do người được giao nhiệm vụ biên soạn'}</span></div>}
        </div>
      </div>
      <div className="question-workflow-actions"><p className="sep-muted">{dirty ? 'Có thay đổi chưa lưu ở câu đang soạn.' : data.canEdit ? 'Câu đã lưu vẫn có thể chỉnh sửa trước khi gửi gói.' : data.canReview ? 'Kiểm tra từng câu trước khi duyệt hoặc yêu cầu chỉnh sửa.' : ['ASSIGNED', 'IN_PROGRESS', 'NEEDS_REVISION'].includes(data.status) ? 'Gói đang được biên soạn. Chỉ người được giao có thể chỉnh sửa câu hỏi.' : 'Gói đã được gửi hoặc hoàn tất; nội dung được bảo vệ theo trạng thái.'}</p><div className="question-toolbar-actions">
        <PcbButton variant="secondary" disabled={busy} onClick={back}><Icon name="arrow_back" />Quay lại</PcbButton>
        <PcbButton variant="secondary" disabled={busy} onClick={() => guard.request(() => { setSaved(null); loaded.reload(); setSelection(null); })}><Icon name="refresh" />Tải lại</PcbButton>
        {data.canEdit && <PcbButton disabled={busy || !data.canSubmit || dirty} onClick={submit}><Icon name="send" />Gửi gói câu hỏi</PcbButton>}
        {data.canReview && <><PcbButton variant="secondary" disabled={busy} onClick={() => setRejecting(true)}><Icon name="undo" />Yêu cầu chỉnh sửa</PcbButton><PcbButton disabled={busy} onClick={() => setPending({ title: 'Duyệt gói câu hỏi', message: 'Duyệt toàn bộ ' + data.questions.length + ' câu và đưa vào ngân hàng thi?', label: 'Duyệt gói', run: () => action(() => questionApi.review(id, data.version, true, undefined, noteRows), 'Đã duyệt gói câu hỏi.') })}><Icon name="check" />Duyệt gói</PcbButton></>}
      </div></div>
      {data.submissions.length > 0 && <details className="question-history"><summary>Lịch sử nộp và kiểm duyệt ({data.submissions.length})</summary>{data.submissions.map(submission => <div key={submission.id}><button className="question-count" onClick={() => setHistoryId(submission.id)}>Lần {submission.number} · {formatDate(submission.submittedAt)} · {statuses[submission.status]}</button>{submission.comment && <p>{submission.comment}</p>}</div>)}</details>}
    </div>
    {guard.dialog}
    <ConfirmDialog isOpen={pending !== null} title={pending?.title ?? 'Xác nhận'} message={pending?.message} confirmText={pending?.label} type={pending?.label === 'Xóa câu hỏi' ? 'danger' : 'info'} isLoading={busy} onCancel={() => setPending(null)} onConfirm={() => pending?.run()} />
    <FormDialog busy={busy} open={rejecting} title="Yêu cầu chỉnh sửa" onClose={closeRejection}>
      <label className="pcb-label" htmlFor="package-comment"><RequiredLabel required>Nhận xét chung</RequiredLabel></label><textarea id="package-comment" required className="sep-textarea" rows={4} maxLength={1000} value={comment} disabled={busy} placeholder="Nêu rõ yêu cầu để giáo viên chỉnh sửa và gửi lại…" onChange={e => setComment(e.currentTarget.value)} />
      {noteRows.length > 0 && <p className="sep-muted">Gửi kèm nhận xét của {noteRows.length} câu hỏi.</p>}
      <div className="sep-actions"><PcbButton variant="ghost" disabled={busy} onClick={closeRejection}>Hủy</PcbButton><PcbButton disabled={busy || !comment.trim()} onClick={() => action(async () => { const result = await questionApi.review(id, data.version, false, comment, noteRows); setRejecting(false); return result; }, 'Đã gửi yêu cầu chỉnh sửa gói.')}>Gửi yêu cầu chỉnh sửa</PcbButton></div>
    </FormDialog>
    {history && <QuestionHistoryDialog key={history.id} submission={history} onClose={() => setHistoryId(null)} />}
    {importing && <QuestionExcelImportDialog taskId={id} version={data.version} onDirty={setImportDirty} onBusy={setImportBusy} onClose={() => guard.request(() => setImporting(false), importDirty)} onImported={result => { setSaved(result); setImporting(false); setImportDirty(false); setSelection(null); setRevision(value => value + 1); displayToast('success', 'Thành công', 'Đã nhập câu hỏi từ Excel.'); }} />}
  </>;
};
