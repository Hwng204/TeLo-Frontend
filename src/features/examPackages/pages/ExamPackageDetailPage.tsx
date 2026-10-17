import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Icon, PcbButton } from '../../../components/pcb';
import { PageHeader } from '../../../components/common/PageHeader';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import { useAsync, useBusy } from '../../../hooks';
import { useUnsavedChanges } from '../../../hooks/useUnsavedChanges';
import { displayToast } from '../../../utils/toast';
import { formatDate } from '../../../utils/formatters';
import { problemLines, toProblem } from '../../../utils/problem';
import { QuestionPicker } from '../../questions/components/QuestionPicker';
import { ExamPackageActionDialog, type PackageDialogMode } from '../components/ExamPackageActionDialog';
import { ExamPackageQuestions } from '../components/ExamPackageQuestions';
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
  const [saved, setSaved] = useState<PackageDetail | null>(null);
  const data = saved ?? loaded.data;
  const [mode, setMode] = useState<PackageDialogMode | null>(null);
  const [picking, setPicking] = useState<PackageQuestion | null>(null);
  const [confirming, setConfirming] = useState<'finalize' | 'practice' | 'delete' | null>(null);
  const [formDirty, setFormDirty] = useState(false);
  const [pickerDirty, setPickerDirty] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [busy, runExclusive] = useBusy();
  const guard = useUnsavedChanges(formDirty || pickerDirty, () => { setFormDirty(false); setPickerDirty(false); }, busy);
  const reload = () => guard.request(() => { setSaved(null); setMode(null); setPicking(null); setConflict(false); loaded.reload(); });
  const save = (action: () => Promise<PackageDetail>, message: string) => void runExclusive(async () => {
    try {
      const updated = await action(); setSaved(updated); setMode(null); setPicking(null); setConfirming(null);
      setFormDirty(false); setPickerDirty(false); setConflict(false); displayToast('success', 'Thành công', message);
    } catch (error) {
      const parsed = toProblem(error); setConfirming(null);
      if (parsed.status === 409) setConflict(true);
      displayToast('error', 'Lỗi', problemLines(parsed), 5);
    }
  });
  const confirm = () => {
    if (!data || !confirming) return;
    if (confirming === 'delete') void runExclusive(async () => {
      try { await examPackageApi.remove(id, data.version); displayToast('success', 'Thành công', 'Đã xóa đề nháp.'); navigate('/exam-packages', { replace: true }); }
      catch (error) { setConfirming(null); displayToast('error', 'Lỗi', problemLines(toProblem(error)), 5); }
    });
    else if (confirming === 'practice') void runExclusive(async () => {
      try { const copy = await examPackageApi.practice(id, data.version); displayToast('success', 'Thành công', 'Đã tạo bản sao đề ôn tập.'); navigate('/exam-packages/' + copy.package.id); }
      catch (error) { setConfirming(null); displayToast('error', 'Lỗi', problemLines(toProblem(error)), 5); }
    });
    else save(() => examPackageApi.finalize(id, data.version), 'Đã chốt và khóa bản cuối của đề.');
  };
  if (!data) return <><PageHeader title="Chi tiết đề" onBack={() => navigate('/exam-packages')} /><div className="sep-page"><p role={loaded.loading ? 'status' : 'alert'}>{loaded.loading ? 'Đang tải đề…' : toProblem(loaded.error).message}</p>{!loaded.loading && <PcbButton onClick={reload}>Thử lại</PcbButton>}</div>{guard.dialog}</>;
  const item = data.package;
  const required = data.cells.reduce((sum, cell) => sum + cell.requiredCount, 0);
  const selectedCell = data.cells.find(cell => cell.id === picking?.detailId);
  const review = data.history.find(event => event.eventCode === (item.status === 'REVIEWED' ? 'REVIEW_SUBMITTED' : 'REVIEW_RETURNED'));
  return <>
    <PageHeader title="Chi tiết đề" onBack={() => navigate('/exam-packages')} />
    <div className="sep-page exam-package-page">
      <div className="exam-package-overview">
        <div className="exam-package-summary"><div className="question-overview-identity"><span className="question-package-icon"><Icon name="description" size={28} /></span><div><h2>{item.name}</h2><p>{item.subjectName} · {item.gradeLevelName} · {item.academicYearName}</p></div></div><span className={'sep-status sep-status--' + item.status}>{packageStatuses[item.status]}</span></div>
        <div className="exam-package-facts"><span><Icon name="quiz" size={18} /><strong>{item.questionCount}/{required}</strong> câu hỏi</span><span><Icon name="grade" size={18} /><strong>{data.totalScore}</strong> điểm</span><span><Icon name="folder_open" size={18} />{item.purpose === 'practice' ? 'Đề ôn tập' : 'Đề thi'}</span><span><Icon name="person" size={18} /><span>Review:</span><strong>{item.reviewerName ?? 'Chưa giao'}</strong></span>{data.dueAt && <span className="exam-package-deadline"><Icon name="event" size={18} />Hạn: {formatDate(data.dueAt)}</span>}</div>
      </div>
      <details className="exam-package-information"><summary>Thông tin đề và phân công</summary>
        <dl className="exam-package-meta">
          <div><dt>Ma trận</dt><dd>{item.matrixName}</dd></div><div><dt>Người tạo</dt><dd>{item.authorName}</dd></div><div><dt>Người review</dt><dd>{item.reviewerName ?? 'Chưa giao'}</dd></div><div><dt>Hạn review</dt><dd>{data.dueAt ? formatDate(data.dueAt) : 'Chưa đặt hạn'}</dd></div>
          {data.approvedByName && <div><dt>Người chốt</dt><dd>{data.approvedByName} · {item.approvedAt ? formatDate(item.approvedAt) : '—'}</dd></div>}
          {data.canViewTask && data.taskId && <div><dt>Nhiệm vụ review</dt><dd><Link to={'/matrix-tasks/' + data.taskId}>Xem nhiệm vụ</Link></dd></div>}
          {data.sourceExamSetId && <div><dt>Đề nguồn</dt><dd><Link to={'/exam-packages/' + data.sourceExamSetId}>Xem đề gốc</Link></dd></div>}
        </dl>
      </details>
      <div className="exam-package-actions">
        <div className="question-toolbar-actions">
          <PcbButton variant="secondary" disabled={busy} onClick={() => navigate('/exam-packages/' + id + '/preview')}><Icon name="visibility" />Xem trước / In đề</PcbButton>
          {data.canAssign && <PcbButton variant="secondary" disabled={busy} onClick={() => setMode('assign')}><Icon name="person_add" />{data.taskId ? 'Phân công review / Hạn' : 'Giao review'}</PcbButton>}
          {data.canRename && <PcbButton variant="secondary" disabled={busy} onClick={() => setMode('rename')}><Icon name="edit" />Đổi tên</PcbButton>}
          <PcbButton variant="secondary" disabled={busy} onClick={reload}><Icon name="refresh" />Tải lại</PcbButton>
        </div>
        <div className="question-toolbar-actions">
          {data.canReturnReview && <PcbButton variant="secondary" className="exam-review-return" disabled={busy} onClick={() => setMode('return')}><Icon name="assignment_return" />Yêu cầu review lại</PcbButton>}
          {data.canSubmitReview && <PcbButton disabled={busy} onClick={() => setMode('submit')}><Icon name="send" />Gửi kết quả review</PcbButton>}
          {data.canFinalize && <PcbButton className="exam-finalize" disabled={busy} onClick={() => setConfirming('finalize')}><Icon name="verified" />Chốt bản cuối</PcbButton>}
        </div>
      </div>
      {conflict && <p className="sep-alert" role="alert">Đề hoặc điều kiện sử dụng đã thay đổi. Nội dung đang nhập được giữ lại; đóng biểu mẫu rồi tải lại trước khi tiếp tục.</p>}
      {item.status === 'APPROVED' && <p className="question-draft-hint">Đề đã chốt. Nội dung câu hỏi và cấu trúc được khóa.</p>}
      {data.canReplace && <p className="question-draft-hint">Chọn từng câu để kiểm tra. Khi cần, thay bằng câu trong cùng ô ma trận rồi gửi kết quả review cho PHT.</p>}
      {review?.comment && item.status !== 'APPROVED' && <div className="question-review-note"><strong>{item.status === 'REVIEWED' ? 'Nhận xét của người review' : 'Yêu cầu chỉnh sửa gần nhất'}</strong><p>{review.comment}</p></div>}
      <ExamPackageQuestions data={data} busy={busy} onReplace={row => setPicking(row)} />
      <details className="exam-package-history-panel"><summary>Lịch sử thay đổi ({data.history.length})</summary>
        {data.history.length === 0 && <p className="sep-muted">Đề được tạo trước khi có lịch sử quản lý.</p>}
        <ol className="exam-package-history">{data.history.map(event => <li key={event.id}><strong>{historyLabels[event.eventCode] ?? event.eventCode}</strong><span> · {event.actorName} · {formatDate(event.createdAt)}</span>{event.oldQuestionId && <p>Câu #{event.oldQuestionId} → Câu #{event.newQuestionId}</p>}{event.comment && <p>{event.comment}</p>}</li>)}</ol>
      </details>
      {(data.canConvertToPractice || data.canDelete) && <div className="sep-actions exam-package-other-actions">
        {data.canConvertToPractice && <PcbButton variant="secondary" disabled={busy} onClick={() => setConfirming('practice')}>Tạo bản sao ôn tập</PcbButton>}
        {data.canDelete && <PcbButton variant="danger" disabled={busy} onClick={() => setConfirming('delete')}>Xóa đề nháp</PcbButton>}
      </div>}
    </div>
    {mode && <ExamPackageActionDialog key={mode} mode={mode} data={data} busy={busy} onDirty={setFormDirty} onClose={() => guard.request(() => setMode(null))} onSave={save} />}
    {picking && selectedCell && <QuestionPicker key={picking.id} matrixId={item.matrixId} detailId={selectedCell.id} selectedIds={data.questions.map(q => q.question.id)} selectionLimit={1} selectLabel="Thay câu hỏi" busy={busy} onDirty={setPickerDirty} onClose={() => guard.request(() => setPicking(null))} onSelect={questions => { if (questions.length === 1) save(() => examPackageApi.replace(id, picking.id, data.version, questions[0].id), 'Đã thay câu hỏi đúng ô ma trận.'); }} />}
    {guard.dialog}
    <ConfirmDialog type={confirming === 'delete' ? 'danger' : 'info'} isOpen={confirming !== null} title={confirming === 'delete' ? 'Xóa đề nháp?' : confirming === 'practice' ? 'Tạo bản sao ôn tập?' : 'Chốt bản cuối?'} message={confirming === 'delete' ? 'Đề nháp này sẽ bị xóa. Bạn chắc chắn muốn tiếp tục?' : confirming === 'practice' ? 'Tạo đề ôn tập từ bản đã chốt, giữ nguyên đề thi gốc.' : 'Bản cuối sẽ được khóa và nhiệm vụ review hoàn thành. Kiểm tra kỹ câu hỏi trước khi chốt.'} confirmText={confirming === 'delete' ? 'Xóa đề' : confirming === 'practice' ? 'Tạo bản sao' : 'Chốt và khóa đề'} isLoading={busy} onCancel={() => setConfirming(null)} onConfirm={confirm} />
  </>;
};
