import { useEffect, useState } from 'react';
import { useBlocker, useNavigate, useParams } from 'react-router-dom';
import { Icon, PcbButton } from '../../../components/pcb';
import { PageHeader } from '../../../components/common/PageHeader';
import { NoticeDialog, type Notice } from '../../../components/common/NoticeDialog';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import { FormDialog } from '../../../components/common/FormDialog';
import { useAsync, useBusy } from '../../../hooks';
import { toProblem } from '../../../utils/problem';
import { formatDate } from '../../../utils/formatters';
import { questionApi } from '../questionApi';
import type { QuestionPackage, SaveQuestion } from '../types';
import { levels, statuses } from '../types';
import { QuestionEditor } from '../components/QuestionEditor';
import { QuestionPreview } from '../components/QuestionPreview';
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
  const [selected, setSelected] = useState<number | null>(null);
  const [targetId, setTargetId] = useState(0);
  const [revision, setRevision] = useState(0);
  const [dirty, setDirty] = useState(false);
  const blocker = useBlocker(dirty);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [pending, setPending] = useState<{ title: string; message: string; label: string; run: () => void } | null>(null);
  const [importing, setImporting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [comment, setComment] = useState('');
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [historyId, setHistoryId] = useState<number | null>(null);
  const [busy, runExclusive] = useBusy();
  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);
  const action = (fn: () => Promise<QuestionPackage>, message?: string) => void runExclusive(async () => {
    try { setSaved(await fn()); setDirty(false); setRevision(x => x + 1); setPending(null); if (message) setNotice({ kind: 'success', messages: [message] }); }
    catch (error) { setPending(null); setNotice({ kind: 'error', messages: [toProblem(error).message] }); }
  });
  const switchTo = (fn: () => void) => dirty ? setPending({ title: 'Thay đổi chưa lưu', message: 'Câu hỏi đang chỉnh sửa chưa được lưu.', label: 'Bỏ thay đổi', run: () => { setDirty(false); setRevision(x => x + 1); setPending(null); fn(); } }) : fn();
  const back = () => navigate(`/matrix-tasks/${id}`);
  if (!data) return <><PageHeader title="Gói câu hỏi" onBack={back} /><div className="sep-page"><p role="status">{loaded.loading ? 'Đang tải…' : toProblem(loaded.error).message}</p>{!loaded.loading && <PcbButton onClick={loaded.reload}>Thử lại</PcbButton>}</div></>;
  const fallback = data.targets.every(t => t.written >= t.requiredCount) ? data.questions.find(q => !q.isComplete) ?? data.questions[0] : null;
  const current = data.questions.find(q => q.id === selected) ?? (selected === null ? fallback : null) ?? null;
  const target = data.targets.find(t => t.detailId === targetId) ?? data.targets.find(t => t.written < t.requiredCount) ?? data.targets[0];
  const questions = data.questions.filter(q => !targetId || q.detailId === targetId);
  const latest = data.submissions[0];
  const history = data.submissions.find(s => s.id === historyId);
  const valid = data.targets.reduce((n, t) => n + t.validCount, 0);
  const required = data.targets.reduce((n, t) => n + t.requiredCount, 0);
  const save = (request: SaveQuestion, next: boolean) => action(async () => {
    const result = await questionApi.save(id, current?.id ?? null, request);
    const remaining = result.targets.find(t => t.detailId === request.detailId && t.written < t.requiredCount) ?? result.targets.find(t => t.written < t.requiredCount);
    setTargetId(next && remaining ? remaining.detailId : request.detailId);
    setSelected(next && remaining ? null : current?.id ?? result.questions[result.questions.length - 1].id);
    return result;
  });
  const submit = () => {
    if (dirty) { setNotice({ kind: 'error', messages: ['Lưu câu đang chỉnh sửa trước khi gửi gói.'] }); return; }
    setPending({ title: 'Gửi gói câu hỏi', message: `Gửi toàn bộ ${data.questions.length} câu cho ${data.reviewerName} kiểm duyệt?`, label: 'Gửi gói', run: () => action(() => questionApi.submit(id, data.version), 'Đã gửi gói câu hỏi.') });
  };
  return <>
    <PageHeader title={data.canReview ? 'Kiểm duyệt gói câu hỏi' : 'Gói câu hỏi'} onBack={back} badge={<span className={`sep-status sep-status--${data.status}`}>{statuses[data.status]}</span>} />
    <div className="sep-page question-package">
      <div className="question-package-heading"><h2 className="sep-section-title">{data.name}</h2><span>{valid}/{required} câu hợp lệ · Hạn {data.dueAt ? formatDate(data.dueAt) : '—'}</span></div>
      {data.status === 'NEEDS_REVISION' && latest?.comment && <div className="sep-alert sep-alert--info"><strong>Yêu cầu chỉnh sửa</strong><p>{latest.comment}</p></div>}
      <div className="question-targets"><table className="pcb-table"><thead><tr><th>Bài học</th>{Object.values(levels).map(label => <th key={label}>{label}</th>)}</tr></thead><tbody>
        {[...new Set(data.targets.map(t => t.lessonId))].map(lessonId => { const lesson = data.targets.find(t => t.lessonId === lessonId)!; return <tr key={lessonId}><td>{lesson.gradeName} · {lesson.lessonTitle}</td>{Object.keys(levels).map(level => { const t = data.targets.find(t => t.lessonId === lessonId && t.cognitiveLevel === level); return <td key={level} className={t && targetId === t.detailId ? 'question-target--active' : ''}>{t ? <button className="question-count" onClick={() => switchTo(() => { setTargetId(t.detailId); setSelected(null); setRevision(x => x + 1); })}>{t.validCount}/{t.requiredCount}{t.written > t.validCount && <span> · {t.written - t.validCount} nháp</span>}</button> : '—'}</td>; })}</tr>; })}
      </tbody></table></div>
      <div className="question-toolbar"><PcbButton variant="ghost" size="sm" onClick={() => switchTo(() => setTargetId(0))}>Tất cả câu hỏi ({data.questions.length})</PcbButton>
        {data.canEdit && <div className="question-toolbar-actions"><PcbButton variant="secondary" disabled={data.targets.every(t => t.written >= t.requiredCount)} onClick={() => switchTo(() => setImporting(true))}><Icon name="upload_file" />Nhập Excel</PcbButton><PcbButton disabled={data.targets.every(t => t.written >= t.requiredCount)} onClick={() => switchTo(() => { setSelected(null); setRevision(x => x + 1); })}><Icon name="add" />Thêm câu hỏi</PcbButton></div>}
      </div>
      <div className="question-workspace"><div className="question-list" aria-label="Danh sách câu hỏi">
        {questions.length === 0 && <p className="sep-muted">Chưa có câu hỏi.</p>}
        {questions.map(q => { const t = data.targets.find(t => t.detailId === q.detailId); return <div className={`question-list-row${q.id === current?.id ? ' question-list-row--active' : ''}`} key={q.id}>
          <button className="question-list-select" onClick={() => switchTo(() => { setSelected(q.id); setRevision(x => x + 1); })}><strong>Câu {data.questions.indexOf(q) + 1}</strong><span className="question-list-content">{q.content || 'Chưa nhập nội dung'}</span><small>{t?.lessonTitle} · {levels[t?.cognitiveLevel ?? '']}{!q.isComplete && ' · Chưa hoàn chỉnh'}</small></button>
          {data.canEdit && <button className="pcb-iconbtn" aria-label={`Xóa câu ${data.questions.indexOf(q) + 1}`} onClick={() => setPending({ title: 'Xóa câu hỏi', message: 'Xóa câu hỏi này khỏi gói?', label: 'Xóa', run: () => action(async () => { const result = await questionApi.remove(id, q.id, data.version); if (selected === q.id) setSelected(null); return result; }, 'Đã xóa câu hỏi.') })}><Icon name="delete" /></button>}
        </div>; })}
      </div>
      {data.canEdit && target ? <div>{latest?.notes.filter(n => n.questionId === current?.id).map(n => <div className="sep-alert sep-alert--info" key={n.questionId}>{n.comment}</div>)}<QuestionEditor key={`${current?.id ?? 'new'}-${revision}`} question={current} targets={data.targets} initialDetailId={target.detailId} version={data.version} busy={busy} onDirty={() => setDirty(true)} onSave={save} /></div>
        : <section className="question-editor">{current ? <><QuestionPreview question={current} />{latest?.notes.filter(n => n.questionId === current.id).map(n => <div className="sep-alert sep-alert--info" key={n.questionId}>{n.comment}</div>)}{data.canReview && <><label className="pcb-label" htmlFor="question-note">Nhận xét câu hỏi</label><textarea className="sep-textarea" id="question-note" maxLength={1000} value={notes[current.id] ?? ''} onChange={e => setNotes({ ...notes, [current.id]: e.target.value })} /></>}</> : <p className="sep-muted">Chọn câu hỏi để xem.</p>}</section>}
      </div>
      {data.submissions.length > 0 && <details className="question-history"><summary>Lịch sử nộp và kiểm duyệt ({data.submissions.length})</summary>{data.submissions.map(s => <div key={s.id}><button className="question-count" onClick={() => setHistoryId(s.id)}>Lần {s.number} · {formatDate(s.submittedAt)} · {statuses[s.status]}</button>{s.comment && <p>{s.comment}</p>}</div>)}</details>}
      <div className="sep-actions"><PcbButton variant="ghost" onClick={back}>Quay lại</PcbButton>
        {data.canEdit && <PcbButton disabled={busy || !data.canSubmit} onClick={submit}><Icon name="send" />Gửi gói câu hỏi</PcbButton>}
        {data.canReview && <><PcbButton variant="danger" disabled={busy} onClick={() => { setComment(''); setRejecting(true); }}><Icon name="undo" />Yêu cầu chỉnh sửa</PcbButton><PcbButton disabled={busy} onClick={() => setPending({ title: 'Chốt gói câu hỏi', message: `Chốt toàn bộ ${data.questions.length} câu và đưa vào ngân hàng câu hỏi thi?`, label: 'Chốt gói', run: () => action(() => questionApi.review(id, data.version, true), 'Đã chốt gói câu hỏi.') })}><Icon name="check" />Chốt gói</PcbButton></>}
      </div>
    </div>
    <NoticeDialog notice={notice} onClose={() => setNotice(null)} />
    <ConfirmDialog isOpen={pending !== null || blocker.state === 'blocked'} title={pending?.title ?? 'Thay đổi chưa lưu'} message={pending?.message ?? 'Câu hỏi đang chỉnh sửa chưa được lưu.'} confirmText={pending?.label ?? 'Bỏ thay đổi'} type="info" isLoading={busy} onCancel={() => { setPending(null); if (blocker.state === 'blocked') blocker.reset(); }} onConfirm={() => { if (pending) pending.run(); else if (blocker.state === 'blocked') { setDirty(false); blocker.proceed(); } }} />
    <FormDialog open={rejecting} title="Yêu cầu chỉnh sửa" onClose={() => { if (!busy) setRejecting(false); }}><label className="pcb-label" htmlFor="package-comment">Nhận xét *</label><textarea id="package-comment" className="sep-textarea" rows={4} maxLength={1000} value={comment} onChange={e => setComment(e.target.value)} /><div className="sep-actions"><PcbButton variant="ghost" disabled={busy} onClick={() => setRejecting(false)}>Hủy</PcbButton><PcbButton variant="danger" disabled={busy || !comment.trim()} onClick={() => action(async () => { const result = await questionApi.review(id, data.version, false, comment, Object.entries(notes).filter(([, v]) => v.trim()).map(([key, value]) => ({ questionId: Number(key), comment: value.trim() }))); setRejecting(false); return result; }, 'Đã yêu cầu chỉnh sửa gói.')}>Yêu cầu chỉnh sửa</PcbButton></div></FormDialog>
    <FormDialog open={history !== undefined} title={history ? `Lần nộp ${history.number}` : 'Lịch sử nộp'} onClose={() => setHistoryId(null)}>{history?.questions.map((q, i) => <section className="question-history-item" key={q.id}><strong>Câu {i + 1}</strong><QuestionPreview question={q} />{history.notes.filter(n => n.questionId === q.id).map(n => <p key={n.questionId}>{n.comment}</p>)}</section>)}</FormDialog>
    {importing && <QuestionExcelImportDialog taskId={id} version={data.version} onClose={() => setImporting(false)} onImported={result => { setSaved(result); setImporting(false); setSelected(null); setRevision(x => x + 1); setNotice({ kind: 'success', messages: ['Đã nhập câu hỏi từ Excel.'] }); }} />}
  </>;
};
