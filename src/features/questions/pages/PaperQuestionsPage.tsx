import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Icon, PcbButton } from '../../../components/pcb';
import { PageHeader } from '../../../components/common/PageHeader';
import { NoticeDialog, type Notice } from '../../../components/common/NoticeDialog';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import { useAsync, useBusy } from '../../../hooks';
import { toProblem } from '../../../utils/problem';
import { questionApi } from '../questionApi';
import { QuestionPicker } from '../components/QuestionPicker';
import { QuestionPreview } from '../components/QuestionPreview';
import { levels, type PaperQuestions } from '../types';
import '../questions.css';

export const PaperQuestionsPage = () => {
  const taskId = Number(useParams().id); const paperId = Number(useParams().paperId);
  return <PaperWorkspace key={`${taskId}-${paperId}`} taskId={taskId} paperId={paperId} />;
};

const PaperWorkspace = ({ taskId, paperId }: { taskId: number; paperId: number }) => {
  const navigate = useNavigate();
  const loaded = useAsync(() => questionApi.paper(taskId, paperId), [taskId, paperId]);
  const [saved, setSaved] = useState<PaperQuestions | null>(null);
  const data = saved ?? loaded.data;
  const [picking, setPicking] = useState<number | null>(null);
  const [removing, setRemoving] = useState<number | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [busy, runExclusive] = useBusy();
  const back = () => navigate(`/matrix-tasks/${taskId}`);
  const run = (fn: () => Promise<PaperQuestions>, message: string) => void runExclusive(async () => {
    try { setSaved(await fn()); setPicking(null); setRemoving(null); setNotice({ kind: 'success', messages: [message] }); }
    catch (error) { setPicking(null); setRemoving(null); setNotice({ kind: 'error', messages: [toProblem(error).message] }); }
  });
  if (!data) return <><PageHeader title="Chọn câu hỏi cho đề" onBack={back} /><div className="sep-page"><p role="status">{loaded.loading ? 'Đang tải…' : toProblem(loaded.error).message}</p>{!loaded.loading && <PcbButton onClick={loaded.reload}>Thử lại</PcbButton>}</div></>;
  const required = data.cells.reduce((n, c) => n + c.requiredCount, 0);
  return <><PageHeader title={data.name} onBack={back} /><div className="sep-page">
    <div className="question-package-heading"><h2 className="sep-section-title">Câu hỏi theo ma trận</h2><span>Đã chọn {data.questions.length}/{required} câu</span></div>
    {data.cells.map(cell => { const rows = data.questions.filter(q => q.detailId === cell.id); return <section className="sep-section" key={cell.id}>
      <div className="question-package-heading"><h2 className="sep-section-title">{cell.lessonTitle} · {levels[cell.cognitiveLevel]} ({rows.length}/{cell.requiredCount})</h2>{data.canEdit && <PcbButton variant="secondary" size="sm" disabled={busy || rows.length >= cell.requiredCount} onClick={() => setPicking(cell.id)}><Icon name="add" />Chọn từ ngân hàng</PcbButton>}</div>
      {rows.length === 0 && <p className="sep-muted">Chưa chọn câu hỏi.</p>}
      {rows.map(({ question }) => <details className="question-picker-row" key={question.id}><summary>{question.content}</summary><QuestionPreview question={question} />{data.canEdit && <div className="sep-actions"><PcbButton variant="danger" size="sm" disabled={busy} onClick={() => setRemoving(question.id)}><Icon name="delete" />Bỏ khỏi đề</PcbButton></div>}</details>)}
    </section>; })}
    <div className="sep-actions"><PcbButton onClick={back}>Hoàn tất chọn câu hỏi</PcbButton></div>
  </div>
  {picking !== null && <QuestionPicker matrixId={data.matrixId} detailId={picking} selectedIds={data.questions.map(q => q.question.id)} onClose={() => { if (!busy) setPicking(null); }} onSelect={questions => run(() => questionApi.addToPaper(taskId, paperId, data.version, picking, questions.map(q => q.id)), 'Đã thêm câu hỏi vào đề.')} />}
  <ConfirmDialog isOpen={removing !== null} title="Bỏ câu hỏi khỏi đề" message="Bỏ câu hỏi này khỏi đề đang biên soạn?" type="info" isLoading={busy} confirmText="Bỏ khỏi đề" onCancel={() => setRemoving(null)} onConfirm={() => { if (removing !== null) run(() => questionApi.removeFromPaper(taskId, paperId, removing, data.version), 'Đã bỏ câu hỏi khỏi đề.'); }} />
  <NoticeDialog notice={notice} onClose={() => setNotice(null)} />
  </>;
};
