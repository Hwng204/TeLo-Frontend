import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Field, PcbButton, SelectField } from '../../../components/pcb';
import { PageHeader } from '../../../components/common/PageHeader';
import { NoticeDialog, type Notice } from '../../../components/common/NoticeDialog';
import { useAsync, useBusy } from '../../../hooks';
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
      displayToast('success', 'Thành công', 'Đã tạo đề tự động. Kiểm tra đề và giao giáo viên hoặc tổ trưởng review.');
      navigate(`/exam-packages/${data.package.id}`);
    } catch (error) {
      const parsed = toProblem(error); setErrors(parsed.fieldErrors ?? {});
      setNotice({ kind: 'error', messages: problemLines(parsed) }); availability.reload();
    }
  });
  return <>
    <PageHeader title="Tạo đề tự động" onBack={() => navigate('/exam-packages')} />
    <div className="sep-page exam-package-page">
      {options.loading && <p role="status">Đang tải ma trận…</p>}
      {Boolean(options.error) && <div role="alert" className="sep-alert">{toProblem(options.error).message}<PcbButton variant="ghost" onClick={options.reload}>Thử lại</PcbButton></div>}
      {options.data && !options.data.canCreate && <div role="alert" className="sep-alert">Bạn không có quyền tạo đề tự động.</div>}
      <section className="sep-section"><h2 className="sep-section-title">Thông tin đề</h2>
        <p className="sep-muted">Chọn ma trận để hệ thống sinh đề. Sau khi xem đề, PHT giao giáo viên hoặc tổ trưởng chỉnh sửa và review, rồi xem lại và chốt bản cuối.</p>
        <Field label="Tên đề" required maxLength={255} value={name} error={errors.name} disabled={busy} placeholder="Ví dụ: Toán 5 · Cuối học kỳ I" onChange={e => setName(e.target.value)} />
        <SelectField label="Ma trận đã duyệt" required value={matrixId} error={errors.matrixId} disabled={busy || options.loading} onChange={e => setMatrixId(e.target.value)}>
          <option value="">Chọn ma trận</option>{matrices.map(m => <option key={m.id} value={m.id}>{m.name} · {m.subjectName} · {m.gradeLevelName} · {m.academicYearName}</option>)}
        </SelectField>
        {!options.loading && matrices.length === 0 && options.data?.canCreate && <p className="sep-muted">Phân hiệu chưa có ma trận đã duyệt. Cần duyệt ma trận trước khi tạo đề.</p>}
        {selected && <p className="sep-muted">{selected.subjectName} · {selected.gradeLevelName} · {selected.academicYearName}</p>}
      </section>
      {matrixId && <section className="sep-section"><h2 className="sep-section-title">Câu hỏi theo ma trận</h2>
        <p className="sep-muted">Hệ thống chọn đủ câu từ ngân hàng thi cho từng ô. Số lượng dưới đây là tham khảo; hệ thống kiểm tra lại khi tạo.</p>
        {availability.loading && <p role="status">Đang kiểm tra ngân hàng…</p>}
        {Boolean(availability.error) && <div className="sep-alert" role="alert">{toProblem(availability.error).message}<PcbButton variant="ghost" onClick={availability.reload}>Thử lại</PcbButton></div>}
        <div className="pcb-table-wrap"><table className="pcb-table"><thead><tr><th>Ô ma trận</th><th>Mức nhận thức</th><th>Cần</th><th>Có trong ngân hàng</th></tr></thead><tbody>{availability.data?.map(cell => <tr key={cell.detailId}><td>{cell.lessonTitle ?? 'Bài học trong ma trận'}</td><td>{levels[cell.cognitiveLevel]}</td><td>{cell.requiredCount}</td><td>{cell.availableCount}{cell.availableCount < cell.requiredCount && <span className="exam-package-shortage"> · Thiếu {cell.requiredCount - cell.availableCount}</span>}</td></tr>)}</tbody></table></div>
      </section>}
      <div className="sep-actions"><PcbButton variant="ghost" disabled={busy} onClick={() => navigate('/exam-packages')}>Hủy</PcbButton><PcbButton disabled={busy || !options.data?.canCreate} onClick={submit}>{busy ? 'Đang tạo…' : 'Tạo đề tự động'}</PcbButton></div>
    </div><NoticeDialog notice={notice} onClose={() => setNotice(null)} />
  </>;
};
