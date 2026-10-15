import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Icon, PcbButton } from '../../../components/pcb';
import { PageHeader } from '../../../components/common/PageHeader';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import { useAsync, useBusy } from '../../../hooks';
import { displayToast } from '../../../utils/toast';
import { formatDate } from '../../../utils/formatters';
import { problemLines, toProblem } from '../../../utils/problem';
import { QuestionPreview } from '../../questions/components/QuestionPreview';
import { QuestionPicker } from '../../questions/components/QuestionPicker';
import { levels } from '../../questions/types';
import { ExamPackageActionDialog, type PackageDialogMode } from '../components/ExamPackageActionDialog';
import { examPackageApi } from '../examPackageApi';
import { historyLabels, packageStatuses, type PackageDetail, type PackageQuestion } from '../types';
import '../examPackages.css';

export const ExamPackageDetailPage = () => {
  const id = Number(useParams().id);
  return <PackageWorkspace key={id} id={id} />;
};

const PackageWorkspace = ({ id }: { id: number }) => {
  const navigate = useNavigate();
  const loaded = useAsync(() => examPackageApi.get(id), [id]);
  const [saved, setSaved] = useState<PackageDetail | null>(null); const data = saved ?? loaded.data;
  const [mode, setMode] = useState<PackageDialogMode | null>(null);
  const [picking, setPicking] = useState<PackageQuestion | null>(null);
  const [confirming, setConfirming] = useState<'finalize' | 'practice' | 'delete' | null>(null);
  const [busy, runExclusive] = useBusy();
  const reload = () => { setSaved(null); loaded.reload(); };
  const save = (action: () => Promise<PackageDetail>, message: string) => void runExclusive(async () => {
    try { const updated = await action(); setSaved(updated); setMode(null); setPicking(null); setConfirming(null); displayToast('success', 'Thành công', message); }
    catch (error) { const parsed = toProblem(error); setMode(null); setPicking(null); setConfirming(null); displayToast('error', 'Lỗi', problemLines(parsed), 5); if (parsed.status === 409) reload(); }
  });
  const confirm = () => {
    if (!data || !confirming) return;
    if (confirming === 'delete') void runExclusive(async () => {
      try { await examPackageApi.remove(id, data.version); displayToast('success', 'Thành công', 'Đã xóa đề nháp.'); navigate('/exam-packages', { replace: true }); }
      catch (error) { setConfirming(null); displayToast('error', 'Lỗi', problemLines(toProblem(error)), 5); reload(); }
    });
    else if (confirming === 'practice') void runExclusive(async () => {
      try { const copy = await examPackageApi.practice(id, data.version); displayToast('success', 'Thành công', 'Đã tạo bản sao đề ôn tập.'); navigate(`/exam-packages/${copy.package.id}`); }
      catch (error) { setConfirming(null); displayToast('error', 'Lỗi', problemLines(toProblem(error)), 5); reload(); }
    });
    else save(() => examPackageApi.finalize(id, data.version), 'Đã chốt và khóa bản cuối của đề.');
  };
  if (!data) return <><PageHeader title="Chi tiết đề" onBack={() => navigate('/exam-packages')} /><div className="sep-page"><p role={loaded.loading ? 'status' : 'alert'}>{loaded.loading ? 'Đang tải đề…' : toProblem(loaded.error).message}</p>{!loaded.loading && <PcbButton onClick={reload}>Thử lại</PcbButton>}</div></>;
  const item = data.package;
  const required = data.cells.reduce((sum, cell) => sum + cell.requiredCount, 0);
  const selectedCell = data.cells.find(cell => cell.id === picking?.detailId);
  return <>
    <PageHeader title="Chi tiết đề" onBack={() => navigate('/exam-packages')} />
    <div className="sep-page exam-package-page">
      <div className="exam-package-summary"><h2>{item.name}</h2><span className={`sep-status sep-status--${item.status}`}>{packageStatuses[item.status]}</span></div>
      <dl className="exam-package-meta">
        <div><dt>Mục đích</dt><dd>{item.purpose === 'practice' ? 'Ôn tập' : 'Đề thi'}</dd></div><div><dt>Phạm vi</dt><dd>{item.subjectName} · {item.gradeLevelName} · {item.academicYearName}</dd></div>
        <div><dt>Ma trận</dt><dd>{item.matrixName}</dd></div><div><dt>Người tạo</dt><dd>{item.authorName}</dd></div><div><dt>Người review</dt><dd>{item.reviewerName ?? 'Chưa giao'}</dd></div>
        <div><dt>Hạn review</dt><dd>{data.dueAt ? formatDate(data.dueAt) : 'Chưa đặt hạn'}</dd></div><div><dt>Câu hỏi / Tổng điểm</dt><dd>{item.questionCount}/{required} câu · {data.totalScore} điểm</dd></div>
        {data.approvedByName && <div><dt>Người chốt</dt><dd>{data.approvedByName} · {item.approvedAt ? formatDate(item.approvedAt) : '—'}</dd></div>}
        {data.canViewTask && data.taskId && <div><dt>Nhiệm vụ review</dt><dd><Link to={`/matrix-tasks/${data.taskId}`}>Xem nhiệm vụ</Link></dd></div>}
        {data.sourceExamSetId && <div><dt>Đề nguồn</dt><dd><Link to={`/exam-packages/${data.sourceExamSetId}`}>Xem đề gốc</Link></dd></div>}
      </dl>
      <div className="sep-actions">
        <PcbButton variant="secondary" onClick={() => navigate(`/exam-packages/${id}/preview`)}><Icon name="visibility" />Xem trước / In đề</PcbButton>
        {data.canRename && <PcbButton variant="secondary" disabled={busy} onClick={() => setMode('rename')}>Đổi tên</PcbButton>}
        {data.canAssign && <PcbButton disabled={busy} onClick={() => setMode('assign')}>{data.taskId ? 'Đổi người review / Hạn' : 'Giao review'}</PcbButton>}
        {data.canSubmitReview && <PcbButton disabled={busy} onClick={() => setMode('submit')}>Gửi kết quả review</PcbButton>}
        {data.canReturnReview && <PcbButton variant="secondary" disabled={busy} onClick={() => setMode('return')}>Trả lại để review</PcbButton>}
        {data.canFinalize && <PcbButton disabled={busy} onClick={() => setConfirming('finalize')}>Chốt bản cuối</PcbButton>}
        {data.canConvertToPractice && <PcbButton variant="secondary" disabled={busy} onClick={() => setConfirming('practice')}>Tạo bản sao ôn tập</PcbButton>}
        {data.canDelete && <PcbButton variant="danger" disabled={busy} onClick={() => setConfirming('delete')}>Xóa đề</PcbButton>}
        <PcbButton variant="ghost" disabled={busy} onClick={reload}>Tải lại</PcbButton>
      </div>
      {item.status === 'APPROVED' && <p className="sep-alert sep-alert--info">Đề đã chốt. Nội dung câu hỏi và cấu trúc được khóa.</p>}
      {data.canReplace && <p className="sep-alert sep-alert--info">Bạn có thể thay từng câu bằng câu đã duyệt trong cùng ô ma trận. Gửi kết quả review khi hoàn tất.</p>}
      {data.cells.map(cell => { const rows = data.questions.filter(q => q.detailId === cell.id); return <section key={cell.id} className="sep-section">
        <div className="exam-package-summary"><h2 className="sep-section-title">{cell.lessonTitle} · {levels[cell.cognitiveLevel]}</h2><span>{rows.length}/{cell.requiredCount} câu · {cell.percentage}% · {cell.score} điểm</span></div>
        {rows.map(row => <details key={row.id} className="question-picker-row"><summary>Câu {data.questions.findIndex(q => q.id === row.id) + 1}: {row.question.content}</summary><QuestionPreview question={row.question} />{data.canReplace && <div className="sep-actions"><PcbButton variant="secondary" size="sm" disabled={busy} onClick={() => setPicking(row)}>Thay câu từ ngân hàng</PcbButton></div>}</details>)}
        {rows.length === 0 && <p className="sep-muted">Chưa có câu cho ô này.</p>}
      </section>; })}
      <section className="sep-section"><h2 className="sep-section-title">Lịch sử đề</h2>
        {data.history.length === 0 && <p className="sep-muted">Đề được tạo trước khi có lịch sử quản lý.</p>}
        <ol className="exam-package-history">{data.history.map(event => <li key={event.id}><strong>{historyLabels[event.eventCode] ?? event.eventCode}</strong><span> · {event.actorName} · {formatDate(event.createdAt)}</span>{event.oldQuestionId && <p>Câu #{event.oldQuestionId} → Câu #{event.newQuestionId}</p>}{event.comment && <p>{event.comment}</p>}</li>)}</ol>
      </section>
    </div>
    {mode && <ExamPackageActionDialog key={mode} mode={mode} data={data} busy={busy} onClose={() => setMode(null)} onSave={save} />}
    {picking && selectedCell && <QuestionPicker key={picking.id} matrixId={item.matrixId} detailId={selectedCell.id} selectedIds={data.questions.map(q => q.question.id)} selectionLimit={1} selectLabel="Thay câu hỏi" busy={busy} onClose={() => { if (!busy) setPicking(null); }} onSelect={questions => { if (questions.length === 1) save(() => examPackageApi.replace(id, picking.id, data.version, questions[0].id), 'Đã thay câu hỏi đúng ô ma trận.'); }} />}
    <ConfirmDialog type={confirming === 'delete' ? 'danger' : 'info'} isOpen={confirming !== null} title={confirming === 'delete' ? 'Xóa đề nháp?' : confirming === 'practice' ? 'Tạo bản sao ôn tập?' : 'Chốt bản cuối?'} message={confirming === 'delete' ? 'Đề nháp này sẽ bị xóa. Bạn chắc chắn muốn tiếp tục?' : confirming === 'practice' ? 'Tạo đề ôn tập từ bản đã chốt, giữ nguyên đề thi gốc.' : 'Bản cuối sẽ được khóa và nhiệm vụ review hoàn thành. Kiểm tra kỹ câu hỏi trước khi chốt.'} confirmText={confirming === 'delete' ? 'Xóa đề' : confirming === 'practice' ? 'Tạo bản sao' : 'Chốt và khóa đề'} isLoading={busy} onCancel={() => setConfirming(null)} onConfirm={confirm} />
  </>;
};
