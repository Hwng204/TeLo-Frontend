import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PcbButton } from '../../../components/pcb';
import { PageHeader } from '../../../components/common/PageHeader';
import { useAsync } from '../../../hooks';
import { toProblem } from '../../../utils/problem';
import { QuestionPreview } from '../../questions/components/QuestionPreview';
import { examPackageApi } from '../examPackageApi';
import { packageStatuses } from '../types';
import '../examPackages.css';

export const ExamPackagePreviewPage = () => {
  const id = Number(useParams().id); const navigate = useNavigate();
  const loaded = useAsync(() => examPackageApi.get(id), [id]);
  const [answers, setAnswers] = useState(false);
  const data = loaded.data;
  return <>
    <PageHeader title="Xem trước đề" onBack={() => navigate(`/exam-packages/${id}`)} />
    <div className="sep-page exam-package-page">
      {!data && <p role={loaded.loading ? 'status' : 'alert'}>{loaded.loading ? 'Đang tải đề…' : toProblem(loaded.error).message}{!loaded.loading && <PcbButton onClick={loaded.reload}>Thử lại</PcbButton>}</p>}
      {data && <>
        <div className="sep-actions exam-package-print-controls"><label><input type="checkbox" checked={answers} onChange={e => setAnswers(e.target.checked)} /> Hiện đáp án và giải thích</label><PcbButton onClick={() => window.print()}>In / Lưu PDF</PcbButton></div>
        <article className="exam-package-print"><h2>{data.package.name}</h2><p>{data.package.subjectName} · {data.package.gradeLevelName} · {data.package.academicYearName}</p>
          <p>{data.questions.length} câu · Tổng điểm: {data.totalScore} · {packageStatuses[data.package.status]}{answers ? ' · Bản có đáp án' : ''}</p>
          {data.package.status !== 'APPROVED' && <p><strong>BẢN CHƯA CHỐT</strong></p>}
          <p>Họ và tên: ................................................................... Lớp: .................</p>
          {data.questions.map((row, index) => <section key={row.id}><h3>Câu {index + 1}</h3><QuestionPreview question={answers ? row.question : { ...row.question, correctOption: null, explanation: null }} /></section>)}
        </article>
      </>}
    </div>
  </>;
};
