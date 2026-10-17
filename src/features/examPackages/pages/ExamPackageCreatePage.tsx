import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Field, Icon, PcbButton, SelectField } from '../../../components/pcb';
import { PageHeader } from '../../../components/common/PageHeader';
import { NoticeDialog, type Notice } from '../../../components/common/NoticeDialog';
import { useAsync, useBusy } from '../../../hooks';
import { useUnsavedChanges } from '../../../hooks/useUnsavedChanges';
import { problemLines, toProblem } from '../../../utils/problem';
import { displayToast } from '../../../utils/toast';
import { questionApi } from '../../questions/questionApi';
import { levels } from '../../questions/types';
import { examPackageApi } from '../examPackageApi';
import '../examPackages.css';

export const ExamPackageCreatePage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState(''); const [matrixId, setMatrixId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<Notice | null>(null);
  const [busy, runExclusive] = useBusy();
  const [created, setCreated] = useState(false);
  const guard = useUnsavedChanges(!created && (name.length > 0 || matrixId.length > 0), () => { setName(''); setMatrixId(''); }, busy);
  const options = useAsync(examPackageApi.options, []);
  const availability = useAsync(() => matrixId ? questionApi.availability(Number(matrixId)) : Promise.resolve([]), [matrixId]);
  const matrices = (options.data?.matrices ?? []).filter(m => m.status === 'APPROVED');
  const selected = matrices.find(m => m.id === Number(matrixId));
  const submit = () => void runExclusive(async () => {
    const found: Record<string, string> = {};
    if (!name.trim() || name.trim().length > 255) found.name = 'Nhập tên đề từ 1 đến 255 ký tự.';
    if (!matrixId) found.matrixId = 'Chọn ma trận đã duyệt.';
    setErrors(found);
    if (Object.keys(found).length) { setNotice({ kind: 'error', messages: Object.values(found) }); return; }
    try {
      const data = await examPackageApi.generate(name.trim(), Number(matrixId));
      setCreated(true);
      displayToast('success', 'Thành công', 'Đã tạo đề tự động. Kiểm tra đề và giao giáo viên hoặc tổ trưởng review.');
      navigate(`/exam-packages/${data.package.id}`);
    } catch (error) {
      const parsed = toProblem(error); setErrors(parsed.fieldErrors ?? {});
      setNotice({ kind: 'error', messages: problemLines(parsed) }); availability.reload();
    }
  });
  const cells = availability.data ?? [];
  const needed = cells.reduce((sum, cell) => sum + cell.requiredCount, 0);
  const shortage = cells.reduce((sum, cell) => sum + Math.max(0, cell.requiredCount - cell.availableCount), 0);
  return <>
    <PageHeader title="Tạo đề tự động" onBack={() => navigate('/exam-packages')} />
    <div className="sep-page exam-package-page exam-generation-page">
      <ol className="exam-generation-steps" aria-label="Luồng xử lý đề">
        <li className="exam-generation-step--active"><span>1</span><div><strong>Tạo đề tự động</strong><small>Chọn ma trận đã duyệt</small></div></li>
        <li><span>2</span><div><strong>Giao chỉnh sửa, review</strong><small>Giáo viên hoặc tổ trưởng</small></div></li>
        <li><span>3</span><div><strong>PHT chốt bản cuối</strong><small>Kiểm tra và khóa đề</small></div></li>
      </ol>
      {options.loading && <p role="status">Đang tải ma trận…</p>}
      {Boolean(options.error) && <div role="alert" className="sep-alert">{toProblem(options.error).message}<PcbButton variant="secondary" onClick={options.reload}>Thử lại</PcbButton></div>}
      {options.data && !options.data.canCreate && <div role="alert" className="sep-alert">Bạn không có quyền tạo đề tự động.</div>}
      <div className="exam-generation-grid">
        <section className="exam-generation-form">
          <div className="exam-generation-section-heading"><span className="question-package-icon"><Icon name="auto_awesome" size={26} /></span><div><h2>Thông tin đề</h2><p>Hệ thống chọn câu hỏi phù hợp từng ô ma trận.</p></div></div>
          <Field label="Tên đề" required maxLength={255} value={name} error={errors.name} disabled={busy} placeholder="Ví dụ: Đề kiểm tra Toán khối 5" onChange={e => setName(e.target.value)} />
          <SelectField label="Ma trận đã duyệt" required selectedLabel={selected?.name} value={matrixId} error={errors.matrixId} disabled={busy || options.loading} onChange={e => setMatrixId(e.target.value)}>
            <option value="">Chọn ma trận</option>{matrices.map(m => <option key={m.id} value={m.id}>{m.name} · {m.subjectName} · {m.gradeLevelName} · {m.academicYearName}</option>)}
          </SelectField>
          {!options.loading && matrices.length === 0 && options.data?.canCreate && <p className="question-draft-hint">Phân hiệu chưa có ma trận đã duyệt. Cần duyệt ma trận trước khi tạo đề.</p>}
          {selected && <div className="exam-generation-scope"><span><Icon name="menu_book" size={18} />{selected.subjectName}</span><span><Icon name="school" size={18} />{selected.gradeLevelName}</span><span><Icon name="calendar_month" size={18} />{selected.academicYearName}</span></div>}
          <div className="exam-generation-guidance"><Icon name="info" size={20} /><div><strong>Sau khi tạo đề</strong><p>Xem nội dung đề rồi giao giáo viên hoặc tổ trưởng chỉnh sửa, review. PHT kiểm tra lần cuối và chốt đề.</p></div></div>
        </section>
        <section className="exam-generation-bank" aria-label="Kiểm tra ngân hàng theo ma trận">
          <div className="exam-generation-bank-heading"><h2><Icon name="fact_check" />Câu hỏi theo ma trận</h2>{matrixId && !availability.loading && !availability.error && cells.length > 0 && <span className={'question-state ' + (shortage ? 'question-state--draft' : 'question-state--complete')}>{shortage ? 'Thiếu ' + shortage + ' câu' : 'Đủ câu hỏi'}</span>}</div>
          <div className="exam-generation-bank-content">
            {!matrixId ? <div className="question-empty-message"><Icon name="grid_view" size={40} /><strong>Chọn ma trận để kiểm tra</strong><span>Số câu cần và câu phù hợp trong ngân hàng sẽ hiện tại đây.</span></div> : availability.loading ? <div className="question-empty-message" role="status"><Icon name="hourglass_empty" size={36} />Đang kiểm tra ngân hàng…</div> : availability.error ? <div className="sep-alert" role="alert">{toProblem(availability.error).message}<PcbButton variant="secondary" onClick={availability.reload}>Thử lại</PcbButton></div> : cells.length === 0 ? <p className="question-empty-message">Chưa có chỉ tiêu câu hỏi để hiển thị.</p> : <table className="exam-availability-table"><thead><tr><th>Phần trong ma trận</th><th>Cần</th><th>Sẵn có</th></tr></thead><tbody>{cells.map(cell => <tr key={cell.detailId}><td><strong title={cell.lessonTitle ?? undefined}>{cell.lessonTitle ?? 'Bài học trong ma trận'}</strong><span className={'question-level question-level--' + cell.cognitiveLevel}>{levels[cell.cognitiveLevel]}</span></td><td>{cell.requiredCount}</td><td className={cell.availableCount < cell.requiredCount ? 'exam-package-shortage' : 'exam-package-enough'}>{cell.availableCount}{cell.availableCount < cell.requiredCount && <small>Thiếu {cell.requiredCount - cell.availableCount}</small>}</td></tr>)}</tbody></table>}
          </div>
          <div className="exam-generation-bank-footer"><strong>{matrixId ? needed + ' câu cần tạo' : 'Chưa chọn ma trận'}</strong><span>Số lượng được kiểm tra lại khi tạo đề.</span></div>
        </section>
      </div>
      <div className="exam-generation-actions"><p><Icon name="verified_user" size={18} />Chỉ lấy câu đã duyệt trong ngân hàng thi.</p><div className="question-toolbar-actions"><PcbButton variant="secondary" disabled={busy} onClick={() => navigate('/exam-packages')}><Icon name="close" />Hủy</PcbButton><PcbButton disabled={busy || !options.data?.canCreate} onClick={submit}><Icon name="auto_awesome" />{busy ? 'Đang tạo…' : 'Tạo đề tự động'}</PcbButton></div></div>
    </div>{guard.dialog}<NoticeDialog notice={notice} onClose={() => setNotice(null)} />
  </>;
};
