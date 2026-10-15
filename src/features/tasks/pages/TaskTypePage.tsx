import { useNavigate } from 'react-router-dom';
import { PcbButton } from '../../../components/pcb';
import { PageHeader } from '../../../components/common/PageHeader';
import '../tasks.css';

/** PHT giao lập ma trận hoặc tự sinh đề rồi giao review đề đã có câu. */
export const TaskTypePage = () => {
  const navigate = useNavigate();
  const back = () => navigate('/matrix-tasks');

  return (
    <>
      <PageHeader title="Giao nhiệm vụ / Tạo đề" onBack={back} />

      <div className="sep-page">
        <section className="sep-section">
          <div className="sep-task-types">
            <PcbButton variant="secondary" onClick={() => navigate('/matrix-tasks/new/matrix')}>
              Nhiệm vụ ma trận
            </PcbButton>
            <PcbButton variant="secondary" onClick={() => navigate('/exam-packages/new')}>
              Tạo đề tự động
            </PcbButton>
          </div>
          <p className="sep-muted">Với đề thi, PHT chọn ma trận để hệ thống sinh đề trước, sau đó giao giáo viên hoặc tổ trưởng chỉnh sửa và review. PHT xem lại và chốt bản cuối.</p>
        </section>
      </div>
    </>
  );
};
